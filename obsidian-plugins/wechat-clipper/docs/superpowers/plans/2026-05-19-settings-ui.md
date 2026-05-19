# Settings UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 WeChat Clipper 插件补齐设置类型、默认值与设置页 UI，并能持久化保存。

**Architecture:** 将设置结构与默认值集中在 `src/types.ts`，设置页 UI 独立在 `src/settings.ts`。插件在 `onload` 时加载设置并注册设置页，设置页直接修改插件内存中的 `settings` 并调用 `saveSettings()` 落盘。

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild

---

### Task 1: 定义设置类型与默认值

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: 扩展类型与默认值**

将 `src/types.ts` 改为：

```ts
export type WeChatClipperPluginTypes = {
  version: string;
};

export type WeChatClipperSettings = {
  noteFolder: string;
  assetFolder: string;
  trimTailEnabled: boolean;
  trimTailKeywords: string[];
  userAgent: string;
};

export const DEFAULT_SETTINGS: WeChatClipperSettings = {
  noteFolder: "inbox/wechat",
  assetFolder: "assets/wechat",
  trimTailEnabled: true,
  trimTailKeywords: ["阅读原文", "点击阅读原文", "长按识别二维码", "扫码关注", "赞赏作者"],
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};
```

---

### Task 2: 实现设置页 UI

**Files:**
- Create: `src/settings.ts`

- [ ] **Step 1: 新增设置页类并实现交互**

创建 `src/settings.ts`：

```ts
import { App, PluginSettingTab, Setting } from "obsidian";
import type WeChatClipperPlugin from "./main";

function parseKeywords(value: string): string[] {
  return value
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatKeywords(value: string[]): string {
  return value.join("\n");
}

export class WeChatClipperSettingTab extends PluginSettingTab {
  private readonly plugin: WeChatClipperPlugin;

  constructor(app: App, plugin: WeChatClipperPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("笔记保存路径")
      .setDesc("相对于仓库根目录的目标文件夹")
      .addText((text) =>
        text
          .setPlaceholder("inbox/wechat")
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (value) => {
            this.plugin.settings.noteFolder = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("资源保存路径")
      .setDesc("相对于仓库根目录的图片等资源文件夹")
      .addText((text) =>
        text
          .setPlaceholder("assets/wechat")
          .setValue(this.plugin.settings.assetFolder)
          .onChange(async (value) => {
            this.plugin.settings.assetFolder = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("自动裁剪尾部")
      .setDesc("导入时尝试移除“阅读原文”等尾部内容")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.trimTailEnabled).onChange(async (value) => {
          this.plugin.settings.trimTailEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }),
      );

    const keywordsSetting = new Setting(containerEl)
      .setName("尾部裁剪关键词")
      .setDesc("每行一个关键词，或用逗号分隔");

    const keywordsTextArea = document.createElement("textarea");
    keywordsTextArea.value = formatKeywords(this.plugin.settings.trimTailKeywords);
    keywordsTextArea.rows = 6;
    keywordsTextArea.style.width = "100%";
    keywordsTextArea.addEventListener("change", async () => {
      this.plugin.settings.trimTailKeywords = parseKeywords(keywordsTextArea.value);
      await this.plugin.saveSettings();
    });

    if (!this.plugin.settings.trimTailEnabled) {
      keywordsTextArea.disabled = true;
    }

    keywordsSetting.controlEl.appendChild(keywordsTextArea);

    new Setting(containerEl)
      .setName("User-Agent")
      .setDesc("抓取网页时使用的 User-Agent")
      .addTextArea((text) =>
        text.setValue(this.plugin.settings.userAgent).onChange(async (value) => {
          this.plugin.settings.userAgent = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
```

---

### Task 3: 插件加载/保存设置并注册设置页

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: 增加 settings 状态、load/save 方法、注册 SettingTab**

将 `src/main.ts` 改为：

```ts
import { Plugin } from "obsidian";
import { WeChatClipperSettingTab } from "./settings";
import { DEFAULT_SETTINGS, type WeChatClipperSettings } from "./types";

export default class WeChatClipperPlugin extends Plugin {
  settings: WeChatClipperSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new WeChatClipperSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<WeChatClipperSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(loaded ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
```

---

### Task 4: 构建验证

**Files:**
- None

- [ ] **Step 1: 运行构建**

Run:

```bash
npm run build
```

Expected: exit code 0

