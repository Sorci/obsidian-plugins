# URL Input Modal UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the WeChat article URL input modal feel more native by left-aligning/widening the input and enabling Enter-to-import.

**Architecture:** Keep the existing Obsidian `Setting`-based modal layout, apply minimal inline layout adjustments for full-width input, and add a small DOM helper to bind Enter key submission.

**Tech Stack:** TypeScript, Obsidian Plugin API, Vitest, JSDOM

---

## File Map

- Modify: [main.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/main.ts)
- Create: `obsidian-plugins/wechat-clipper/src/ui/bindEnterSubmit.ts`
- Create: `obsidian-plugins/wechat-clipper/src/ui/__tests__/bindEnterSubmit.test.ts`

---

### Task 1: Add Enter-to-submit DOM helper (TDD)

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/ui/bindEnterSubmit.ts`
- Test: `obsidian-plugins/wechat-clipper/src/ui/__tests__/bindEnterSubmit.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { bindEnterSubmit } from "../bindEnterSubmit";

describe("bindEnterSubmit", () => {
  it("calls submit when Enter is pressed", () => {
    const input = document.createElement("input");
    const submit = vi.fn();

    bindEnterSubmit(input, submit);

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("does not call submit for non-Enter keys", () => {
    const input = document.createElement("input");
    const submit = vi.fn();

    bindEnterSubmit(input, submit);

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    expect(submit).toHaveBeenCalledTimes(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/ui/__tests__/bindEnterSubmit.test.ts
```

Expected: FAIL with module import error or `bindEnterSubmit` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
export function bindEnterSubmit(inputEl: HTMLInputElement, submit: () => void): () => void {
  const onKeyDown = (evt: KeyboardEvent) => {
    if (evt.key !== "Enter") return;
    evt.preventDefault();
    submit();
  };

  inputEl.addEventListener("keydown", onKeyDown);
  return () => inputEl.removeEventListener("keydown", onKeyDown);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/ui/__tests__/bindEnterSubmit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/ui
git commit -m "test: add bindEnterSubmit helper"
```

---

### Task 2: Update UrlInputModal layout and interaction

**Files:**
- Modify: [main.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/main.ts)

- [ ] **Step 1: Write the minimal code change**

Update `UrlInputModal.onOpen()` to:
- build the URL input using `Setting`, remove/hide the info area to avoid left label spacing
- make the input take full available width and keep left alignment
- autofocus input
- bind Enter key to submit (same behavior as clicking Import)

Replace the URL input `Setting` block in [main.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/main.ts#L65-L82) with:

```ts
import { bindEnterSubmit } from "./ui/bindEnterSubmit";

class UrlInputModal extends Modal {
  private readonly plugin: WeChatClipperPlugin;
  private resolve?: (value: string | null) => void;
  private value = "";
  private unbindEnter?: () => void;

  constructor(plugin: WeChatClipperPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  openAndGet(): Promise<string | null> {
    this.open();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "WeChat Article URL" });

    const urlSetting = new Setting(contentEl);
    (urlSetting as any).infoEl?.remove?.();
    urlSetting.controlEl.style.width = "100%";
    urlSetting.controlEl.style.justifyContent = "flex-start";

    urlSetting.addText((text) => {
      text.setPlaceholder("https://mp.weixin.qq.com/s/...").onChange((v) => {
        this.value = v.trim();
      });

      text.inputEl.style.width = "100%";
      text.inputEl.classList.add("prompt-input");
      this.unbindEnter = bindEnterSubmit(text.inputEl, () => {
        this.close();
        this.resolve?.(this.value || null);
      });

      window.setTimeout(() => text.inputEl.focus(), 0);
    });

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Import").setCta().onClick(() => {
        this.close();
        this.resolve?.(this.value || null);
      })
    );
  }

  onClose(): void {
    this.unbindEnter?.();
    this.resolve?.(this.value || null);
  }
}
```

- [ ] **Step 2: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run build to ensure TypeScript/esbuild output is valid**

Run:

```bash
npm run build
```

Expected: esbuild succeeds and `main.js` updates without errors.

- [ ] **Step 4: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/main.ts
git commit -m "feat: improve url input modal ux"
```

---

## Plan Self-Review

- Spec coverage:
  - input left-align + widen: Task 2 Step 1 (remove infoEl + 100% width + flex-start)
  - Enter-to-import: Task 1 + Task 2 Step 1 (bindEnterSubmit)
- Placeholder scan: no TBD/TODO or vague steps
- Type consistency: helper is DOM-only and imported from `./ui/bindEnterSubmit`
