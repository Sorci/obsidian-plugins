# AI Topic/Tags/Summary on Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When importing a WeChat article, optionally call an OpenAI-compatible API to generate `topic`, `tags`, and an AI summary, then write them into frontmatter + a callout block at the top of the note.

**Architecture:** Add an AI client module (OpenAI-compatible `chat/completions`) + a deterministic note formatting module. Import flow calls AI (best-effort, synchronous by default), then composes the final markdown with topic/tags/summary.

**Tech Stack:** Obsidian `requestUrl`, TypeScript, Vitest.

---

## File map (create/modify)

**Create**
- `src/ai/openaiCompatible.ts` — HTTP client + prompt + response parsing/validation
- `src/ai/__tests__/openaiCompatible.test.ts` — unit tests for parsing/normalization (no real network)
- `src/importer/noteFormatting.ts` — compose frontmatter + AI summary callout + final markdown
- `src/importer/__tests__/noteFormatting.test.ts` — unit tests for YAML/callout formatting

**Modify**
- `src/types.ts` — add AI settings + defaults; add analysis types
- `src/settings.ts` — settings UI for AI section
- `src/importer/importWeChatArticle.ts` — integrate AI call + note formatting
- `README.md` — document AI configuration and behavior (best-effort + privacy)

---

## Task 1: Add settings + types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Update `WeChatClipperSettings`**

Edit `src/types.ts` to add:

```ts
export type AiLanguage = "auto" | "zh" | "en";

export type WeChatClipperSettings = {
  noteFolder: string;
  assetFolder: string;
  trimTailEnabled: boolean;
  trimTailKeywords: string[];
  userAgent: string;

  aiEnabled: boolean;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiRequestTimeoutMs: number;
  aiMaxInputChars: number;
  aiSummaryMaxChars: number;
  aiMaxTags: number;
  aiLanguage: AiLanguage;
};
```

- [ ] **Step 2: Update `DEFAULT_SETTINGS`**

Append defaults (keep existing keys unchanged):

```ts
export const DEFAULT_SETTINGS: WeChatClipperSettings = {
  noteFolder: "inbox/wechat",
  assetFolder: "assets/wechat",
  trimTailEnabled: true,
  trimTailKeywords: [
    "赞赏",
    "打赏",
    "推荐阅读",
    "阅读原文",
    "点击阅读原文",
    "长按识别二维码",
    "扫码关注",
    "关注公众号",
    "更多精彩内容"
  ],
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",

  aiEnabled: false,
  aiBaseUrl: "",
  aiApiKey: "",
  aiModel: "gpt-4o-mini",
  aiRequestTimeoutMs: 30000,
  aiMaxInputChars: 60000,
  aiSummaryMaxChars: 150,
  aiMaxTags: 8,
  aiLanguage: "auto"
};
```

- [ ] **Step 3: Add AI analysis output types**

In `src/types.ts` add:

```ts
export type AiArticleAnalysis = {
  topic?: string;
  tags?: string[];
  summary?: string;
};
```

- [ ] **Step 4: Typecheck**

Run:

```bash
npm test
```

Expected: PASS (existing tests still compile; no new tests yet).

- [ ] **Step 5: Commit**

```bash
git add src/types.ts
git commit -m "feat: add ai settings and analysis types"
```

---

## Task 2: Add AI settings UI

**Files:**
- Modify: `src/settings.ts`

- [ ] **Step 1: Add an “AI” section**

In `display()` (after existing settings), add settings:

```ts
new Setting(containerEl).setName("AI").setHeading();

new Setting(containerEl)
  .setName("启用 AI")
  .setDesc("导入时生成 topic / tags / AI 总结（需要配置接口与 Key）")
  .addToggle((toggle) =>
    toggle.setValue(this.plugin.settings.aiEnabled).onChange(async (value) => {
      this.plugin.settings.aiEnabled = value;
      await this.plugin.saveSettings();
      this.display();
    }),
  );
```

- [ ] **Step 2: Add Base URL / Model / Key**

Only show when enabled:

```ts
if (this.plugin.settings.aiEnabled) {
  new Setting(containerEl)
    .setName("AI Base URL")
    .setDesc("OpenAI 兼容接口的根地址，例如 https://api.openai.com")
    .addText((text) =>
      text.setValue(this.plugin.settings.aiBaseUrl).onChange(async (value) => {
        this.plugin.settings.aiBaseUrl = value.trim();
        await this.plugin.saveSettings();
      }),
    );

  new Setting(containerEl)
    .setName("AI Model")
    .setDesc("例如 gpt-4o-mini / deepseek-chat 等")
    .addText((text) =>
      text.setValue(this.plugin.settings.aiModel).onChange(async (value) => {
        this.plugin.settings.aiModel = value.trim();
        await this.plugin.saveSettings();
      }),
    );

  new Setting(containerEl)
    .setName("AI API Key")
    .setDesc("仅保存在本地 Obsidian 设置中，不会写入笔记内容")
    .addText((text) => {
      text.inputEl.type = "password";
      text.setValue(this.plugin.settings.aiApiKey).onChange(async (value) => {
        this.plugin.settings.aiApiKey = value.trim();
        await this.plugin.saveSettings();
      });
    });
}
```

- [ ] **Step 3: Add numeric constraints**

Implement with `addText` + parse + clamp:

```ts
function clampInt(value: string, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
```

Then add settings for:

- `aiRequestTimeoutMs` (min 1000, max 120000)
- `aiMaxInputChars` (min 5000, max 200000)
- `aiSummaryMaxChars` (min 50, max 500)
- `aiMaxTags` (min 1, max 20)

- [ ] **Step 4: Manual smoke check**

Run:

```bash
npm run build
```

Expected: build success (UI cannot be fully run here, but TS compiles).

- [ ] **Step 5: Commit**

```bash
git add src/settings.ts
git commit -m "feat: add ai settings ui"
```

---

## Task 3: Implement OpenAI-compatible AI client

**Files:**
- Create: `src/ai/openaiCompatible.ts`
- Create: `src/ai/__tests__/openaiCompatible.test.ts`

- [ ] **Step 1: Write parsing/normalization tests (failing first)**

Create `src/ai/__tests__/openaiCompatible.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeAiAnalysis, parseJsonObject } from "../openaiCompatible";

describe("parseJsonObject", () => {
  it("parses strict JSON", () => {
    const obj = parseJsonObject(`{"topic":"t","tags":["a"],"summary":"s"}`);
    expect(obj).toEqual({ topic: "t", tags: ["a"], summary: "s" });
  });

  it("returns null on non-JSON", () => {
    const obj = parseJsonObject("hello");
    expect(obj).toBeNull();
  });
});

describe("normalizeAiAnalysis", () => {
  it("trims and clamps tags/topic/summary", () => {
    const out = normalizeAiAnalysis(
      { topic: "  主题  ", tags: [" #a ", "b", "b", ""], summary: "x".repeat(1000) },
      { maxTags: 2, maxSummaryChars: 10 }
    );

    expect(out.topic).toBe("主题");
    expect(out.tags).toEqual(["a", "b"]);
    expect(out.summary).toBe("x".repeat(10));
  });
});
```

- [ ] **Step 2: Implement `openaiCompatible.ts` minimal to pass tests**

Create `src/ai/openaiCompatible.ts`:

```ts
import { requestUrl } from "obsidian";
import type { AiArticleAnalysis, AiLanguage, WeChatClipperSettings } from "../types";

export function parseJsonObject(content: string): Record<string, unknown> | null {
  const s = content.trim();
  if (!s.startsWith("{") || !s.endsWith("}")) return null;
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeAiAnalysis(
  raw: Record<string, unknown>,
  opts: { maxTags: number; maxSummaryChars: number }
): AiArticleAnalysis {
  const topic = typeof raw.topic === "string" ? raw.topic.trim() : "";

  const tagsRaw =
    Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [];
  const tags = Array.from(
    new Set(
      tagsRaw
        .map((t) => t.trim().replace(/^#+/g, ""))
        .filter((t) => t.length > 0)
        .slice(0, opts.maxTags)
    )
  );

  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";

  return {
    topic: topic || undefined,
    tags: tags.length > 0 ? tags : undefined,
    summary: summary ? summary.slice(0, opts.maxSummaryChars) : undefined
  };
}

export function hasAiConfig(settings: WeChatClipperSettings): boolean {
  return Boolean(settings.aiEnabled && settings.aiBaseUrl.trim() && settings.aiApiKey.trim() && settings.aiModel.trim());
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replaceAll(/\/+$/g, "");
}

function formatLanguageHint(lang: AiLanguage): string {
  if (lang === "zh") return "用中文输出。";
  if (lang === "en") return "Output in English.";
  return "";
}

export async function analyzeArticleWithOpenAICompatible(args: {
  title: string;
  markdown: string;
  settings: WeChatClipperSettings;
}): Promise<AiArticleAnalysis> {
  const { settings } = args;
  if (!hasAiConfig(settings)) return {};

  const baseUrl = normalizeBaseUrl(settings.aiBaseUrl);
  const url = `${baseUrl}/v1/chat/completions`;

  const input = args.markdown.slice(0, settings.aiMaxInputChars);

  const system = [
    "You are an assistant that extracts topic/tags/summary from an article.",
    "Return ONLY valid JSON (no markdown, no code fence).",
    `Schema: {"topic":"string","tags":["string"],"summary":"string"}.`,
    `Constraints: topic <= 40 chars; tags length <= ${settings.aiMaxTags}, each tag <= 12 chars, no '#'; summary <= ${settings.aiSummaryMaxChars} chars.`,
    formatLanguageHint(settings.aiLanguage)
  ]
    .filter(Boolean)
    .join(" ");

  const user = `Title: ${args.title}\n\nContent:\n${input}`;

  const req = requestUrl({
    url,
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${settings.aiApiKey.trim()}`
    },
    body: JSON.stringify({
      model: settings.aiModel.trim(),
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  } as any);

  const res = await promiseWithTimeout(req, settings.aiRequestTimeoutMs, "AI request timeout");
  const json = (res as any).json;
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return {};

  const obj = parseJsonObject(content);
  if (!obj) return {};
  return normalizeAiAnalysis(obj, { maxTags: settings.aiMaxTags, maxSummaryChars: settings.aiSummaryMaxChars });
}

function promiseWithTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  if (!ms || ms <= 0) return p;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test
```

Expected: PASS (new tests pass).

- [ ] **Step 4: Commit**

```bash
git add src/ai/openaiCompatible.ts src/ai/__tests__/openaiCompatible.test.ts
git commit -m "feat: add openai-compatible ai analysis client"
```

---

## Task 4: Implement deterministic note formatting (frontmatter + callout)

**Files:**
- Create: `src/importer/noteFormatting.ts`
- Create: `src/importer/__tests__/noteFormatting.test.ts`
- Modify: `src/importer/importWeChatArticle.ts`

- [ ] **Step 1: Write formatting tests (failing first)**

Create `src/importer/__tests__/noteFormatting.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { composeWeChatNote } from "../noteFormatting";

describe("composeWeChatNote", () => {
  it("writes topic/tags into yaml and inserts ai summary callout after frontmatter", () => {
    const out = composeWeChatNote(
      { url: "u", title: "t", publishDate: "2026-01-01" },
      "BODY\n",
      { topic: "topic", tags: ["a", "b"], summary: "sum" }
    );

    expect(out).toContain("source: u");
    expect(out).toContain('title: "t"');
    expect(out).toContain("publish_time: 2026-01-01");
    expect(out).toContain('topic: "topic"');
    expect(out).toContain("tags:\n  - a\n  - b\n");
    expect(out).toContain('---\n\n> [!summary] AI 总结\n> sum\n\nBODY\n');
  });

  it("omits ai fields when analysis is empty", () => {
    const out = composeWeChatNote({ url: "u" }, "BODY\n", {});
    expect(out).not.toContain("topic:");
    expect(out).not.toContain("\n> [!summary]");
  });
});
```

- [ ] **Step 2: Implement `noteFormatting.ts`**

Create `src/importer/noteFormatting.ts`:

```ts
import type { AiArticleAnalysis, WeChatArticleMeta } from "../types";

export function composeWeChatNote(
  meta: WeChatArticleMeta,
  body: string,
  analysis: AiArticleAnalysis
): string {
  const lines: string[] = ["---", `source: ${meta.url}`];
  if (meta.title) lines.push(`title: "${escapeYamlString(meta.title)}"`);
  if (meta.account) lines.push(`account: "${escapeYamlString(meta.account)}"`);
  if (meta.author) lines.push(`author: "${escapeYamlString(meta.author)}"`);
  if (meta.publishDate) lines.push(`publish_time: ${meta.publishDate}`);

  if (analysis.topic) lines.push(`topic: "${escapeYamlString(analysis.topic)}"`);
  if (analysis.tags && analysis.tags.length > 0) {
    lines.push("tags:");
    for (const t of analysis.tags) {
      lines.push(`  - ${t}`);
    }
  }

  lines.push("---", "");

  const aiBlock = analysis.summary ? formatAiSummaryCallout(analysis.summary) : "";
  return lines.join("\n") + aiBlock + body.trimEnd() + "\n";
}

export function formatAiSummaryCallout(summary: string): string {
  const normalized = summary.trim().replaceAll(/\r\n/g, "\n");
  const parts = normalized.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  const outLines = ["> [!summary] AI 总结", ...parts.map((p) => `> ${p}`), ""];
  return outLines.join("\n") + "\n";
}

function escapeYamlString(s: string): string {
  return s.replaceAll(/"/g, '\\"');
}
```

- [ ] **Step 3: Wire formatting into import flow**

In `src/importer/importWeChatArticle.ts`:

1) Import:

```ts
import { composeWeChatNote } from "./noteFormatting";
```

2) Replace existing `withFrontmatter(...)` usage:

```ts
content: composeWeChatNote(extracted.meta, localized.markdown, analysis)
```

3) Delete the old `withFrontmatter` and `escapeYamlString` functions from this file.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/importer/noteFormatting.ts src/importer/__tests__/noteFormatting.test.ts src/importer/importWeChatArticle.ts
git commit -m "refactor: compose note with ai frontmatter and summary callout"
```

---

## Task 5: Integrate AI call into import pipeline (best-effort, synchronous)

**Files:**
- Modify: `src/importer/importWeChatArticle.ts`

- [ ] **Step 1: Import AI analyzer**

At top of `src/importer/importWeChatArticle.ts`:

```ts
import type { AiArticleAnalysis } from "../types";
import { analyzeArticleWithOpenAICompatible, hasAiConfig } from "../ai/openaiCompatible";
```

- [ ] **Step 2: Run AI and image localization in parallel**

Replace the sequential `localizeImages(...)` call with:

```ts
const aiPromise: Promise<AiArticleAnalysis> = args.settings.aiEnabled
  ? analyzeArticleWithOpenAICompatible({ title, markdown: mdBody, settings: args.settings })
  : Promise.resolve({});

const localizePromise = localizeImages({
  vault: args.app.vault as any,
  markdown: mdBody,
  noteFolder: args.settings.noteFolder,
  assetFolder: args.settings.assetFolder,
  noteStem,
  referer: args.url,
  userAgent: args.settings.userAgent,
  requestUrl: async (req) => {
    const res = await requestUrl(req as any);
    return {
      headers: res.headers as Record<string, string>,
      arrayBuffer: res.arrayBuffer
    };
  }
});

const [analysis, localized] = await Promise.all([
  aiPromise.catch(() => ({})),
  localizePromise
]);
```

Then pass `analysis` into `composeWeChatNote(...)`.

- [ ] **Step 3: Add missing-config notice (optional, non-blocking)**

Still in `importWeChatArticle`, if AI is enabled but config missing:

```ts
if (args.settings.aiEnabled && !hasAiConfig(args.settings)) {
  // do not throw; import continues
}
```

Instead of logging from importer, return an additional flag in the result so `main.ts` can show a Notice without touching importer concerns:

1) Extend `ImportWeChatResult` in `src/types.ts`:

```ts
export type ImportWeChatResult = {
  notePath: string;
  imageTotal: number;
  imageFailed: number;
  aiStatus?: "skipped" | "ok" | "failed" | "missing_config";
};
```

2) Set status in importer:

- disabled → `skipped`
- enabled but missing config → `missing_config`
- enabled and analysis contains any of (topic/tags/summary) → `ok`
- enabled but request/parse fails → `failed`

3) Update Notice in `src/main.ts` to append `AI: <status>` only when `aiStatus` exists.

- [ ] **Step 4: Add tests for `aiStatus` decision logic**

Create `src/importer/__tests__/aiStatus.test.ts` (pure function) by extracting a helper:

In `src/importer/importWeChatArticle.ts`, create an exported helper in a new file `src/importer/aiStatus.ts`:

```ts
import type { AiArticleAnalysis, WeChatClipperSettings } from "../types";
import { hasAiConfig } from "../ai/openaiCompatible";

export function decideAiStatus(settings: WeChatClipperSettings, analysis: AiArticleAnalysis, aiError: boolean): "skipped" | "ok" | "failed" | "missing_config" {
  if (!settings.aiEnabled) return "skipped";
  if (!hasAiConfig(settings)) return "missing_config";
  if (aiError) return "failed";
  if (analysis.topic || (analysis.tags && analysis.tags.length > 0) || analysis.summary) return "ok";
  return "failed";
}
```

Test file `src/importer/__tests__/aiStatus.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { decideAiStatus } from "../aiStatus";

const base = {
  noteFolder: "",
  assetFolder: "",
  trimTailEnabled: true,
  trimTailKeywords: [],
  userAgent: "",
  aiEnabled: true,
  aiBaseUrl: "https://api.openai.com",
  aiApiKey: "k",
  aiModel: "m",
  aiRequestTimeoutMs: 1,
  aiMaxInputChars: 1,
  aiSummaryMaxChars: 1,
  aiMaxTags: 1,
  aiLanguage: "auto"
} as any;

describe("decideAiStatus", () => {
  it("missing config", () => {
    expect(decideAiStatus({ ...base, aiApiKey: "" }, {}, false)).toBe("missing_config");
  });

  it("ok when has any field", () => {
    expect(decideAiStatus(base, { summary: "s" }, false)).toBe("ok");
  });

  it("failed when error", () => {
    expect(decideAiStatus(base, {}, true)).toBe("failed");
  });

  it("skipped when disabled", () => {
    expect(decideAiStatus({ ...base, aiEnabled: false }, {}, false)).toBe("skipped");
  });
});
```

- [ ] **Step 5: Run tests + build**

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/importer/importWeChatArticle.ts src/importer/aiStatus.ts src/importer/__tests__/aiStatus.test.ts src/main.ts src/types.ts
git commit -m "feat: generate ai topic/tags/summary during import"
```

---

## Task 6: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add AI configuration section**

Add a section describing:

- What gets generated: `topic`, `tags`, AI summary callout
- Where it is stored (frontmatter + body)
- Best-effort behavior (AI failure does not block import)
- Privacy note: article content is sent to the configured AI endpoint

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document ai configuration and behavior"
```

---

## Final verification

- [ ] Run:

```bash
npm test
npm run build
```

- [ ] Manual check (in Obsidian):
  - Enable AI, set Base URL / Model / Key
  - Import a short article
  - Verify `topic` / `tags` appear in Properties and tags are removable/addable
  - Verify AI summary callout is rendered between Properties and body content

