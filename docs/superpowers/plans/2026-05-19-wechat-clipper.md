# WeChat Clipper (Obsidian 子插件) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `obsidian-plugins/wechat-clipper/` 内实现一个 Obsidian 插件：通过粘贴微信公众号文章 URL 一键导入 Markdown，并将图片下载到 Vault 里本地引用，同时清理末尾引导内容。

**Architecture:** 插件命令触发导入流程：抓取 HTML → 抽取正文 DOM → 清洗/截断 → HTML 转 Markdown → 下载图片并替换为本地相对引用 → 写入 Vault。核心逻辑拆为纯函数模块以便单测，Obsidian API 仅用于 IO（网络/文件）。

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild (bundle), turndown (HTML→MD), vitest (unit tests), jsdom (tests-only DOM)

---

## File Structure

**Plugin root:** `obsidian-plugins/wechat-clipper/`

**Create**
- `obsidian-plugins/wechat-clipper/manifest.json`
- `obsidian-plugins/wechat-clipper/package.json`
- `obsidian-plugins/wechat-clipper/tsconfig.json`
- `obsidian-plugins/wechat-clipper/esbuild.config.mjs`
- `obsidian-plugins/wechat-clipper/src/main.ts`
- `obsidian-plugins/wechat-clipper/src/settings.ts`
- `obsidian-plugins/wechat-clipper/src/types.ts`
- `obsidian-plugins/wechat-clipper/src/importer/importWeChatArticle.ts`
- `obsidian-plugins/wechat-clipper/src/importer/fetchHtml.ts`
- `obsidian-plugins/wechat-clipper/src/importer/extractArticle.ts`
- `obsidian-plugins/wechat-clipper/src/importer/cleanArticle.ts`
- `obsidian-plugins/wechat-clipper/src/importer/htmlToMarkdown.ts`
- `obsidian-plugins/wechat-clipper/src/importer/localizeImages.ts`
- `obsidian-plugins/wechat-clipper/src/importer/pathing.ts`
- `obsidian-plugins/wechat-clipper/src/importer/parseMeta.ts`
- `obsidian-plugins/wechat-clipper/src/importer/__tests__/extractArticle.test.ts`
- `obsidian-plugins/wechat-clipper/src/importer/__tests__/cleanArticle.test.ts`
- `obsidian-plugins/wechat-clipper/src/importer/__tests__/parseMeta.test.ts`
- `obsidian-plugins/wechat-clipper/README.md`

**Modify**
- (Optional) `/workspace/README.md`：补充仓库结构与如何进入子插件目录构建/测试（若你希望在根 README 有导航）

---

### Task 1: Scaffold 子插件工程

**Files:**
- Create: `obsidian-plugins/wechat-clipper/manifest.json`
- Create: `obsidian-plugins/wechat-clipper/package.json`
- Create: `obsidian-plugins/wechat-clipper/tsconfig.json`
- Create: `obsidian-plugins/wechat-clipper/esbuild.config.mjs`
- Create: `obsidian-plugins/wechat-clipper/src/types.ts`

- [ ] **Step 1: 创建 manifest.json**

```json
{
  "id": "wechat-clipper",
  "name": "WeChat Clipper",
  "version": "0.0.1",
  "minAppVersion": "1.5.0",
  "description": "Import WeChat Official Account articles into Obsidian as Markdown with local images.",
  "author": "Your Name",
  "authorUrl": "",
  "isDesktopOnly": false
}
```

- [ ] **Step 2: 创建 package.json（含构建与测试依赖）**

```json
{
  "name": "obsidian-wechat-clipper",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node esbuild.config.mjs production",
    "dev": "node esbuild.config.mjs development",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "esbuild": "^0.23.0",
    "jsdom": "^24.0.0",
    "obsidian": "latest",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  },
  "dependencies": {
    "turndown": "^7.2.0"
  }
}
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 esbuild.config.mjs（输出 main.js 到插件目录根）**

```js
import esbuild from "esbuild";
import process from "node:process";
import { readFileSync } from "node:fs";

const mode = process.argv[2] ?? "production";
const isDev = mode === "development";

const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url)));

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  target: "es2022",
  platform: "browser",
  outfile: "main.js",
  sourcemap: isDev ? "inline" : false,
  define: {
    __PLUGIN_VERSION__: JSON.stringify(manifest.version)
  }
});

if (isDev) {
  await ctx.watch();
  console.log("watching...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
```

- [ ] **Step 5: 安装依赖并验证构建**

Run (from repo root):

```bash
cd obsidian-plugins/wechat-clipper
npm ci || npm install
npm run build
```

Expected: 生成 `obsidian-plugins/wechat-clipper/main.js`

- [ ] **Step 6: Commit**

```bash
git add obsidian-plugins/wechat-clipper/manifest.json obsidian-plugins/wechat-clipper/package.json obsidian-plugins/wechat-clipper/tsconfig.json obsidian-plugins/wechat-clipper/esbuild.config.mjs
git commit -m "chore(wechat-clipper): scaffold plugin workspace"
```

---

### Task 2: 插件设置（目录、清理规则、UA）

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/settings.ts`
- Modify: `obsidian-plugins/wechat-clipper/src/types.ts`

- [ ] **Step 1: 定义设置类型与默认值**

```ts
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
  trimTailKeywords: [
    "赞赏",
    "打赏",
    "推荐阅读",
    "阅读原文",
    "长按识别二维码",
    "关注公众号",
    "更多精彩内容"
  ],
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
};
```

- [ ] **Step 2: 创建 SettingTab（文本框 + 开关 + 多行关键词）**

```ts
import { App, PluginSettingTab, Setting } from "obsidian";
import type WeChatClipperPlugin from "./main";

export class WeChatClipperSettingTab extends PluginSettingTab {
  private plugin: WeChatClipperPlugin;

  constructor(app: App, plugin: WeChatClipperPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("笔记目录")
      .setDesc("导入后的 Markdown 笔记保存目录（相对 Vault 根目录）")
      .addText((text) =>
        text
          .setPlaceholder("inbox/wechat")
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (value) => {
            this.plugin.settings.noteFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("图片目录")
      .setDesc("导入后的图片保存目录（相对 Vault 根目录）")
      .addText((text) =>
        text
          .setPlaceholder("assets/wechat")
          .setValue(this.plugin.settings.assetFolder)
          .onChange(async (value) => {
            this.plugin.settings.assetFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("末尾清理")
      .setDesc("尝试移除文章末尾的打赏/推荐等引导内容")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.trimTailEnabled)
          .onChange(async (value) => {
            this.plugin.settings.trimTailEnabled = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.trimTailEnabled) {
      new Setting(containerEl)
        .setName("末尾截断关键词")
        .setDesc("任意命中即从该块起丢弃")
        .addTextArea((area) =>
          area
            .setValue(this.plugin.settings.trimTailKeywords.join("\n"))
            .onChange(async (value) => {
              this.plugin.settings.trimTailKeywords = value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl)
      .setName("User-Agent")
      .setDesc("用于请求 HTML 与图片的 UA")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.userAgent)
          .onChange(async (value) => {
            this.plugin.settings.userAgent = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/types.ts obsidian-plugins/wechat-clipper/src/settings.ts
git commit -m "feat(wechat-clipper): add settings for folders and cleanup"
```

---

### Task 3: 导入核心数据结构与工具（路径、元信息解析）

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/importer/pathing.ts`
- Create: `obsidian-plugins/wechat-clipper/src/importer/parseMeta.ts`
- Create: `obsidian-plugins/wechat-clipper/src/importer/__tests__/parseMeta.test.ts`
- Modify: `obsidian-plugins/wechat-clipper/src/types.ts`

- [ ] **Step 1: 定义文章结构与导入结果类型**

```ts
export type WeChatArticleMeta = {
  url: string;
  title?: string;
  account?: string;
  author?: string;
  publishDate?: string;
};

export type WeChatExtracted = {
  meta: WeChatArticleMeta;
  contentEl: HTMLElement;
};

export type ImportWeChatResult = {
  notePath: string;
  imageTotal: number;
  imageFailed: number;
};
```

- [ ] **Step 2: 实现文件名与路径工具**

```ts
export function sanitizeFileStem(input: string): string {
  const s = input
    .replaceAll(/[\\/:*?"<>|]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return s.length ? s : "untitled";
}

export function joinPosix(...parts: string[]): string {
  return parts
    .join("/")
    .replaceAll(/\/+/g, "/")
    .replaceAll(/^\/|\/$/g, "");
}

export function ensureMdExt(stem: string): string {
  return stem.toLowerCase().endsWith(".md") ? stem : `${stem}.md`;
}
```

- [ ] **Step 3: 实现 parseMeta（HTML 字符串 → meta）**

```ts
import type { WeChatArticleMeta } from "../types";

export function parseWeChatMeta(url: string, html: string): WeChatArticleMeta {
  const meta: WeChatArticleMeta = { url };

  const ogTitle = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (ogTitle) meta.title = decodeHtmlEntities(ogTitle.trim());

  const publishTs = html.match(/\bvar\s+ct\s*=\s*['"](\d{10})['"]/i)?.[1];
  if (publishTs) meta.publishDate = new Date(Number(publishTs) * 1000).toISOString().slice(0, 10);

  return meta;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replaceAll(/&amp;/g, "&")
    .replaceAll(/&lt;/g, "<")
    .replaceAll(/&gt;/g, ">")
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&#39;/g, "'");
}
```

- [ ] **Step 4: 为 parseMeta 写单测（vitest）**

```ts
import { describe, expect, it } from "vitest";
import { parseWeChatMeta } from "../parseMeta";

describe("parseWeChatMeta", () => {
  it("parses og:title and ct publish timestamp", () => {
    const html = `
      <meta property="og:title" content="Hello &amp; World" />
      <script>var ct = "1710000000";</script>
    `;
    const meta = parseWeChatMeta("https://example.com", html);
    expect(meta.title).toBe("Hello & World");
    expect(meta.publishDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd obsidian-plugins/wechat-clipper
npm run test
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/types.ts obsidian-plugins/wechat-clipper/src/importer/pathing.ts obsidian-plugins/wechat-clipper/src/importer/parseMeta.ts obsidian-plugins/wechat-clipper/src/importer/__tests__/parseMeta.test.ts
git commit -m "feat(wechat-clipper): add meta parsing and path utilities"
```

---

### Task 4: HTML 抓取与正文抽取（#js_content）

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/importer/fetchHtml.ts`
- Create: `obsidian-plugins/wechat-clipper/src/importer/extractArticle.ts`
- Create: `obsidian-plugins/wechat-clipper/src/importer/__tests__/extractArticle.test.ts`

- [ ] **Step 1: fetchHtml（Obsidian requestUrl 包装）**

```ts
import { requestUrl } from "obsidian";

export async function fetchHtml(url: string, userAgent: string): Promise<string> {
  const res = await requestUrl({
    url,
    method: "GET",
    headers: {
      "User-Agent": userAgent,
      Referer: url
    }
  });

  return res.text;
}
```

- [ ] **Step 2: extractArticle（HTML → contentEl + meta）**

```ts
import { parseWeChatMeta } from "./parseMeta";
import type { WeChatExtracted } from "../types";

export function extractWeChatArticle(url: string, html: string): WeChatExtracted {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const content = doc.querySelector("#js_content");
  if (!content) {
    throw new Error("未找到正文容器 #js_content");
  }
  return { meta: parseWeChatMeta(url, html), contentEl: content as unknown as HTMLElement };
}
```

- [ ] **Step 3: 单测使用 jsdom 注入 DOMParser**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { extractWeChatArticle } from "../extractArticle";

beforeEach(() => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  // @ts-expect-error
  globalThis.DOMParser = dom.window.DOMParser;
});

describe("extractWeChatArticle", () => {
  it("extracts #js_content", () => {
    const html = `<div id="js_content"><p>hello</p></div>`;
    const out = extractWeChatArticle("https://example.com", html);
    expect(out.contentEl.querySelector("p")?.textContent).toBe("hello");
  });

  it("throws when missing #js_content", () => {
    expect(() => extractWeChatArticle("https://example.com", "<div></div>")).toThrow(
      "未找到正文容器 #js_content"
    );
  });
});
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd obsidian-plugins/wechat-clipper
npm run test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/importer/fetchHtml.ts obsidian-plugins/wechat-clipper/src/importer/extractArticle.ts obsidian-plugins/wechat-clipper/src/importer/__tests__/extractArticle.test.ts
git commit -m "feat(wechat-clipper): fetch html and extract article body"
```

---

### Task 5: 正文清洗与末尾截断

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/importer/cleanArticle.ts`
- Create: `obsidian-plugins/wechat-clipper/src/importer/__tests__/cleanArticle.test.ts`

- [ ] **Step 1: cleanArticle（DOM 原地清洗）**

```ts
export type CleanOptions = {
  trimTailEnabled: boolean;
  trimTailKeywords: string[];
};

const DEFAULT_REMOVE_SELECTORS = [
  ".qr_code_pc",
  ".reward_qrcode_area",
  ".reward_qrcode",
  ".rich_media_tool",
  ".share_media_tool",
  ".share_tool",
  ".js_profile_qrcode",
  ".profile_container",
  ".rich_media_area_primary .rich_media_area_primary_inner",
  "mp-miniprogram"
];

export function cleanWeChatContent(contentEl: HTMLElement, opts: CleanOptions): void {
  for (const sel of DEFAULT_REMOVE_SELECTORS) {
    for (const el of Array.from(contentEl.querySelectorAll(sel))) {
      el.remove();
    }
  }

  if (!opts.trimTailEnabled) return;

  const keywords = opts.trimTailKeywords.map((s) => s.trim()).filter(Boolean);
  if (!keywords.length) return;

  const blocks = Array.from(contentEl.children) as HTMLElement[];
  for (let i = blocks.length - 1; i >= 0; i--) {
    const text = blocks[i].textContent?.trim() ?? "";
    if (!text) continue;
    if (keywords.some((k) => text.includes(k))) {
      for (let j = blocks.length - 1; j >= i; j--) {
        blocks[j].remove();
      }
      break;
    }
  }
}
```

- [ ] **Step 2: 单测覆盖“末尾截断命中”与“不误删前文”**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { cleanWeChatContent } from "../cleanArticle";

beforeEach(() => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  // @ts-expect-error
  globalThis.DOMParser = dom.window.DOMParser;
});

describe("cleanWeChatContent", () => {
  it("trims tail blocks after matching keyword", () => {
    const doc = new DOMParser().parseFromString(
      `<div id="js_content">
        <p>a</p>
        <p>b</p>
        <p>赞赏</p>
        <p>c</p>
      </div>`,
      "text/html"
    );
    const el = doc.querySelector("#js_content") as unknown as HTMLElement;
    cleanWeChatContent(el, { trimTailEnabled: true, trimTailKeywords: ["赞赏"] });
    expect(el.textContent?.replaceAll(/\s+/g, "")).toBe("ab");
  });

  it("does nothing when disabled", () => {
    const doc = new DOMParser().parseFromString(
      `<div id="js_content"><p>a</p><p>赞赏</p></div>`,
      "text/html"
    );
    const el = doc.querySelector("#js_content") as unknown as HTMLElement;
    cleanWeChatContent(el, { trimTailEnabled: false, trimTailKeywords: ["赞赏"] });
    expect(el.textContent?.replaceAll(/\s+/g, "")).toBe("a赞赏");
  });
});
```

- [ ] **Step 3: 运行测试确认通过**

```bash
cd obsidian-plugins/wechat-clipper
npm run test
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/importer/cleanArticle.ts obsidian-plugins/wechat-clipper/src/importer/__tests__/cleanArticle.test.ts
git commit -m "feat(wechat-clipper): clean content and trim tail sections"
```

---

### Task 6: HTML → Markdown 转换

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/importer/htmlToMarkdown.ts`

- [ ] **Step 1: 使用 turndown 将 contentEl 转换为 Markdown**

```ts
import TurndownService from "turndown";

export function htmlToMarkdown(contentEl: HTMLElement): string {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-"
  });

  service.addRule("wechatImage", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as HTMLImageElement;
      const url = el.getAttribute("data-src") || el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      if (!url) return "";
      return `![${escapeMd(alt)}](${url})`;
    }
  });

  return service.turndown(contentEl.innerHTML).trim() + "\n";
}

function escapeMd(s: string): string {
  return s.replaceAll(/[\[\]]/g, "");
}
```

- [ ] **Step 2: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/importer/htmlToMarkdown.ts
git commit -m "feat(wechat-clipper): convert html body to markdown"
```

---

### Task 7: 图片下载与本地化引用替换

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/importer/localizeImages.ts`

- [ ] **Step 1: 实现图片下载与替换（下载到 assets/wechat/<noteStem>/）**

```ts
import { requestUrl, type App } from "obsidian";
import { joinPosix } from "./pathing";

type LocalizeImagesInput = {
  app: App;
  markdown: string;
  articleUrl: string;
  userAgent: string;
  assetFolder: string;
  noteStem: string;
};

export async function localizeImages(input: LocalizeImagesInput): Promise<{
  markdown: string;
  imageTotal: number;
  imageFailed: number;
}> {
  const matches = Array.from(input.markdown.matchAll(/!\[[^\]]*]\(([^)]+)\)/g));
  const urls = matches.map((m) => m[1]).filter((u) => /^https?:\/\//i.test(u));

  const folder = joinPosix(input.assetFolder, input.noteStem);
  await ensureFolder(input.app, folder);

  let out = input.markdown;
  let failed = 0;

  for (const url of urls) {
    try {
      const bin = await downloadBinary(url, input.articleUrl, input.userAgent);
      const ext = guessExt(url) ?? "jpg";
      const name = `${stableHash(url)}.${ext}`;
      const filePath = joinPosix(folder, name);
      await input.app.vault.createBinary(filePath, bin);
      out = out.replaceAll(`(${url})`, `(${filePath})`);
    } catch {
      failed += 1;
    }
  }

  return { markdown: out, imageTotal: urls.length, imageFailed: failed };
}

async function downloadBinary(url: string, referer: string, userAgent: string): Promise<ArrayBuffer> {
  const res = await requestUrl({
    url,
    method: "GET",
    headers: {
      "User-Agent": userAgent,
      Referer: referer
    }
  });
  return res.arrayBuffer;
}

function guessExt(url: string): string | null {
  const clean = url.split("?")[0];
  const m = clean.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : null;
}

function stableHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

async function ensureFolder(app: App, path: string): Promise<void> {
  const parts = path.split("/").filter(Boolean);
  let cur = "";
  for (const p of parts) {
    cur = cur ? `${cur}/${p}` : p;
    if (app.vault.getAbstractFileByPath(cur)) continue;
    await app.vault.createFolder(cur);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/importer/localizeImages.ts
git commit -m "feat(wechat-clipper): download images and replace links"
```

---

### Task 8: 组装导入流水线（纯逻辑）

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/importer/importWeChatArticle.ts`

- [ ] **Step 1: importWeChatArticle（抓取→抽取→清洗→转MD→本地化图片→返回结果）**

```ts
import type { App } from "obsidian";
import type { ImportWeChatResult, WeChatClipperSettings } from "../types";
import { fetchHtml } from "./fetchHtml";
import { extractWeChatArticle } from "./extractArticle";
import { cleanWeChatContent } from "./cleanArticle";
import { htmlToMarkdown } from "./htmlToMarkdown";
import { localizeImages } from "./localizeImages";
import { ensureMdExt, joinPosix, sanitizeFileStem } from "./pathing";

export async function importWeChatArticle(args: {
  app: App;
  url: string;
  settings: WeChatClipperSettings;
}): Promise<ImportWeChatResult> {
  const html = await fetchHtml(args.url, args.settings.userAgent);
  const extracted = extractWeChatArticle(args.url, html);

  cleanWeChatContent(extracted.contentEl, {
    trimTailEnabled: args.settings.trimTailEnabled,
    trimTailKeywords: args.settings.trimTailKeywords
  });

  const title = extracted.meta.title ?? "untitled";
  const noteStem = sanitizeFileStem(title);

  const mdBody = htmlToMarkdown(extracted.contentEl);
  const localized = await localizeImages({
    app: args.app,
    markdown: mdBody,
    articleUrl: args.url,
    userAgent: args.settings.userAgent,
    assetFolder: args.settings.assetFolder,
    noteStem
  });

  const notePath = await writeNote(args.app, {
    folder: args.settings.noteFolder,
    stem: noteStem,
    publishDate: extracted.meta.publishDate,
    markdown: withFrontmatter(extracted.meta, localized.markdown)
  });

  return { notePath, imageTotal: localized.imageTotal, imageFailed: localized.imageFailed };
}

function withFrontmatter(meta: { url: string; title?: string; publishDate?: string }, body: string): string {
  const lines: string[] = ["---", `source: ${meta.url}`];
  if (meta.title) lines.push(`title: "${meta.title.replaceAll(/"/g, '\\"')}"`);
  if (meta.publishDate) lines.push(`publish_time: ${meta.publishDate}`);
  lines.push("---", "");
  return lines.join("\n") + body;
}

async function writeNote(
  app: App,
  input: { folder: string; stem: string; publishDate?: string; markdown: string }
): Promise<string> {
  const folder = input.folder.trim().replaceAll(/\/+$/g, "");
  await ensureFolder(app, folder);

  const base = ensureMdExt(input.stem);
  const basePath = folder ? joinPosix(folder, base) : base;
  const existing = app.vault.getAbstractFileByPath(basePath);
  if (!existing) {
    await app.vault.create(basePath, input.markdown);
    return basePath;
  }

  const suffix = input.publishDate ?? new Date().toISOString().slice(0, 10);
  const alt = ensureMdExt(`${input.stem} - ${suffix}`);
  const altPath = folder ? joinPosix(folder, alt) : alt;
  await app.vault.create(altPath, input.markdown);
  return altPath;
}

async function ensureFolder(app: App, path: string): Promise<void> {
  if (!path) return;
  const parts = path.split("/").filter(Boolean);
  let cur = "";
  for (const p of parts) {
    cur = cur ? `${cur}/${p}` : p;
    if (app.vault.getAbstractFileByPath(cur)) continue;
    await app.vault.createFolder(cur);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/importer/importWeChatArticle.ts
git commit -m "feat(wechat-clipper): implement import pipeline"
```

---

### Task 9: 接入 Obsidian 插件生命周期与命令

**Files:**
- Create: `obsidian-plugins/wechat-clipper/src/main.ts`
- Modify: `obsidian-plugins/wechat-clipper/src/types.ts`
- Modify: `obsidian-plugins/wechat-clipper/package.json`（若需要额外脚本）

- [ ] **Step 1: main.ts（loadSettings/saveSettings + 命令 + 设置页）**

```ts
import { Modal, Notice, Plugin, Setting } from "obsidian";
import { WeChatClipperSettingTab } from "./settings";
import { DEFAULT_SETTINGS, type WeChatClipperSettings } from "./types";
import { importWeChatArticle } from "./importer/importWeChatArticle";

export default class WeChatClipperPlugin extends Plugin {
  settings: WeChatClipperSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new WeChatClipperSettingTab(this.app, this));

    this.addCommand({
      id: "import-wechat-article-from-url",
      name: "Import WeChat Article from URL",
      callback: async () => {
        const url = await new UrlInputModal(this.app).openAndGet();
        if (!url) return;
        await this.runImport(url);
      }
    });
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<WeChatClipperSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(loaded ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async runImport(url: string): Promise<void> {
    try {
      const out = await importWeChatArticle({ app: this.app, url, settings: this.settings });
      const msg =
        out.imageFailed > 0
          ? `Imported: ${out.notePath} (images: ${out.imageTotal}, failed: ${out.imageFailed})`
          : `Imported: ${out.notePath} (images: ${out.imageTotal})`;
      new Notice(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`Import failed: ${msg}`);
    }
  }
}

class UrlInputModal extends Modal {
  private resolve?: (value: string | null) => void;
  private value = "";

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

    new Setting(contentEl).addText((text) =>
      text.setPlaceholder("https://mp.weixin.qq.com/s/...").onChange((v) => {
        this.value = v.trim();
      })
    );

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Import").setCta().onClick(() => {
        this.close();
        this.resolve?.(this.value || null);
      })
    );
  }

  onClose(): void {
    this.resolve?.(this.value || null);
  }
}
```

- [ ] **Step 2: types.ts 导出 settings 类型**

```ts
export type { WeChatClipperSettings } from "./types";
```

Expected: 若 `types.ts` 已包含该类型定义则跳过该导出步骤，确保 `main.ts` 引用一致即可。

- [ ] **Step 3: 构建验证**

```bash
cd obsidian-plugins/wechat-clipper
npm run build
```

Expected: `main.js` 生成成功

- [ ] **Step 4: Commit**

```bash
git add obsidian-plugins/wechat-clipper/src/main.ts obsidian-plugins/wechat-clipper/src/types.ts obsidian-plugins/wechat-clipper/src/settings.ts
git commit -m "feat(wechat-clipper): wire command and settings tab"
```

---

### Task 10: README（子插件级使用说明）

**Files:**
- Create: `obsidian-plugins/wechat-clipper/README.md`

- [ ] **Step 1: 写明安装、开发、使用与已知限制**

```md
# WeChat Clipper (Obsidian Plugin)

## Features

- Import WeChat Official Account article from URL into Obsidian
- Download images into Vault and replace links
- Trim tail sections (reward/recommendation/etc.)

## Setup (Manual)

1. Copy this folder into your vault plugins folder:
   `<Vault>/.obsidian/plugins/wechat-clipper/`
2. Ensure these files exist in that folder:
   - manifest.json
   - main.js
3. Reload Obsidian and enable the plugin

## Development

```bash
cd obsidian-plugins/wechat-clipper
npm install
npm run dev
```

## Usage

Command palette → "Import WeChat Article from URL"

## Limitations

- Publicly accessible articles only (no login-required articles)
```

- [ ] **Step 2: Commit**

```bash
git add obsidian-plugins/wechat-clipper/README.md
git commit -m "docs(wechat-clipper): add plugin readme"
```

---

### Task 11: 手工验收（在 Obsidian 内验证）

**Files:**
- None

- [ ] **Step 1: 将编译产物放入 Vault 插件目录**

Example:

```bash
cp -r obsidian-plugins/wechat-clipper <YOUR_VAULT>/.obsidian/plugins/wechat-clipper
```

Expected: 目录内至少包含 `manifest.json` 与 `main.js`

- [ ] **Step 2: 在 Obsidian 启用插件并导入 3 篇文章**

Expected:
- Markdown 生成在 `inbox/wechat/`
- 图片生成在 `assets/wechat/<noteStem>/`
- 文内图片引用为相对路径（可离线打开）
- 末尾打赏/推荐等内容被清理（若误删可在设置中关闭或改关键词）

- [ ] **Step 3: 记录 1-2 个失败样本 URL 与失败类型**

Expected: 为后续规则补强提供可复现输入

---

## Plan Self-Review

**Spec coverage**
- URL 入口、公开可访问文章支持：Task 9/4
- 抽取正文 #js_content：Task 4
- 无关内容清理与末尾截断：Task 5 + 设置 Task 2
- HTML → Markdown：Task 6
- 图片下载到 Vault 并本地引用：Task 7/8
- 文件命名（仅标题 + 重名追加日期）：Task 8
- 默认目录：Task 2/8

**Placeholder scan**
- 无 TBD/TODO；每一步包含具体文件路径、代码与命令。

**Type consistency**
- settings / meta / extracted / result 类型在 Task 2/3/8 中统一使用 `WeChatClipperSettings`、`WeChatArticleMeta`、`WeChatExtracted`、`ImportWeChatResult`。

