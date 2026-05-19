# Task6 HTML To Markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `htmlToMarkdown.ts`，使用 turndown 将微信正文 `HTMLElement` 转为 Markdown，并将 `img[data-src]/img[src]` 转为标准 Markdown 图片链接。

**Architecture:** 使用 `TurndownService` 的自定义 rule 覆盖 `img` 节点的转换逻辑，优先取 `data-src`，否则取 `src`，输出 `![alt](url)`；其它节点使用 turndown 默认规则。

**Tech Stack:** TypeScript, turndown, vitest

---

### Task 1: 新增 htmlToMarkdown 工具函数

**Files:**
- Create: `/workspace/obsidian-plugins/wechat-clipper/src/importer/htmlToMarkdown.ts`

- [ ] **Step 1: 创建文件与导出函数签名**

```ts
import TurndownService from "turndown";

export function htmlToMarkdown(contentEl: HTMLElement): string {
  const service = new TurndownService();
  return service.turndown(contentEl);
}
```

- [ ] **Step 2: 添加 img 自定义 rule（data-src/src -> Markdown image）**

```ts
service.addRule("wechat-image", {
  filter: "img",
  replacement(_content, node) {
    const el = node as HTMLElement;
    const img = el as HTMLImageElement;
    const src = img.getAttribute("data-src") ?? img.getAttribute("src") ?? "";
    if (!src) return "";
    const alt = (img.getAttribute("alt") ?? "").replaceAll("[", "\\[").replaceAll("]", "\\]");
    return `![${alt}](${src})`;
  }
});
```

### Task 2: 验证构建与测试

**Files:**
- Verify: `/workspace/obsidian-plugins/wechat-clipper`

- [ ] **Step 1: 运行构建**

Run: `npm run build`  
Expected: exit code 0

- [ ] **Step 2: 运行单元测试**

Run: `npm run test`  
Expected: exit code 0

