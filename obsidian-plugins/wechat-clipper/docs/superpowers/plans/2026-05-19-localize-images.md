# Localize Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在导入的 Markdown 中定位远程图片，使用 Obsidian `requestUrl` 抓取二进制并写入 vault 的 `assets/wechat/<noteStem>/`，同时把 Markdown 图片链接替换为以“笔记文件所在目录”为基准的相对路径。

**Architecture:** 通过纯字符串扫描提取 `![](...)` 形式图片 URL；对每个 URL 依次下载并落盘；用一个路径工具计算从 `noteFolder/` 到 `assetFolder/noteStem/<file>` 的相对路径；返回替换后的 Markdown 与统计信息（总数/失败数）。

**Tech Stack:** TypeScript, Obsidian API (`requestUrl`, `Vault`), Vitest

---

## File Structure

- Create: `src/importer/localizeImages.ts`
- Create: `src/importer/__tests__/localizeImages.test.ts`

`localizeImages.ts` 导出：

- `ensureFolder(vault, folderPath)`：确保 vault 内目标文件夹存在（递归创建）
- `localizeImages(params)`：执行提取、下载、落盘、替换，并返回 `{ markdown, imageTotal, imageFailed }`

## Task 1: 定义 API 与最小测试（失败用例）

**Files:**
- Create: `src/importer/__tests__/localizeImages.test.ts`

- [ ] **Step 1: 写测试用例骨架，先断言提取/替换行为**

```ts
import { describe, expect, it, vi } from "vitest";
import { localizeImages } from "../localizeImages";

vi.mock("obsidian", () => {
  return {
    requestUrl: vi.fn()
  };
});

function makeVault() {
  const files = new Map<string, ArrayBuffer>();
  const folders = new Set<string>();
  return {
    getFolderByPath: (p: string) => (folders.has(p) ? ({ path: p } as any) : null),
    createFolder: async (p: string) => {
      if (folders.has(p)) throw new Error("exists");
      folders.add(p);
      return { path: p } as any;
    },
    createBinary: async (p: string, data: ArrayBuffer) => {
      files.set(p, data);
      return { path: p } as any;
    }
  };
}

describe("localizeImages", () => {
  it("downloads images and rewrites markdown links to relative paths from note folder", async () => {
    const { requestUrl } = await import("obsidian");
    (requestUrl as any).mockImplementation(async () => ({
      headers: { "content-type": "image/png" },
      arrayBuffer: new ArrayBuffer(3),
      json: {},
      text: "",
      status: 200
    }));

    const vault = makeVault();
    const noteFolder = "inbox/wechat";
    const assetFolder = "assets/wechat";
    const noteStem = "hello";

    const input = "a\\n![](https://example.com/a.png)\\n";
    const out = await localizeImages({
      vault: vault as any,
      markdown: input,
      noteFolder,
      assetFolder,
      noteStem,
      referer: "https://mp.weixin.qq.com/s/xx",
      userAgent: "UA"
    });

    expect(out.imageTotal).toBe(1);
    expect(out.imageFailed).toBe(0);
    expect(out.markdown).toContain("![](../../assets/wechat/hello/a.png)");
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test`
Expected: FAIL（`localizeImages` 模块不存在或导出缺失）

## Task 2: 实现 `localizeImages.ts`（让测试通过）

**Files:**
- Create: `src/importer/localizeImages.ts`

- [ ] **Step 1: 实现最小功能：解析 `![](...)` URL、下载、落盘、替换**

实现要点：

- `extractMarkdownImageUrls(markdown)`：识别 `![](...)` 与 `![alt](...)`（支持可选 title；支持 `<...>` 包裹 URL）
- `ensureFolder(vault, folderPath)`：按层级 `a/b/c` 逐级 `getFolderByPath`，不存在则 `createFolder`
- `resolveFileName(url, contentType, index)`：尽量保留 URL 最后段文件名；缺扩展名时用 `content-type` 推断；冲突时追加 `-2/-3`
- `relativePosix(fromDir, toPath)`：计算 `../../assets/...` 形式；fromDir 使用 `noteFolder`；toPath 使用 `${assetFolder}/${noteStem}/${fileName}`
- 下载使用 `requestUrl({ url, method: "GET", headers: { Referer, "User-Agent" } })` 并取 `await res.arrayBuffer`
- 落盘使用 `vault.createBinary(targetPath, arrayBuffer)`

- [ ] **Step 2: 运行测试并确认通过**

Run: `npm run test`
Expected: PASS

## Task 3: 覆盖边界与失败统计（增强测试）

**Files:**
- Modify: `src/importer/__tests__/localizeImages.test.ts`
- Modify: `src/importer/localizeImages.ts`

- [ ] **Step 1: 增加失败场景测试：下载抛错时计入 failed，Markdown 原链接保留**

```ts
it("keeps original url when download fails and increments failed", async () => {
  const { requestUrl } = await import("obsidian");
  (requestUrl as any).mockImplementationOnce(async () => {
    throw new Error("net");
  });
  const vault = makeVault();
  const out = await localizeImages({
    vault: vault as any,
    markdown: "![](https://example.com/b.png)\\n",
    noteFolder: "inbox/wechat",
    assetFolder: "assets/wechat",
    noteStem: "hello",
    referer: "https://mp.weixin.qq.com/s/xx",
    userAgent: "UA"
  });
  expect(out.imageTotal).toBe(1);
  expect(out.imageFailed).toBe(1);
  expect(out.markdown).toBe("![](https://example.com/b.png)\\n");
});
```

- [ ] **Step 2: 完善实现以满足失败处理**

规则：

- 对单张图片的下载/写入失败，不中断整体流程
- 失败时不替换该图片链接

- [ ] **Step 3: 运行测试**

Run: `npm run test`
Expected: PASS

## Task 4: Build 验证

- [ ] **Step 1: 运行构建**

Run: `npm run build`
Expected: 构建成功，退出码 0

---

## Execution Handoff

计划已写入 `docs/superpowers/plans/2026-05-19-localize-images.md`。

两种执行方式：

1. Subagent-Driven（推荐）- 我会按 Task 逐个派发执行并在每个 Task 后回到你这里确认
2. Inline Execution - 我在当前会话直接按 Task 执行完并汇报

你选 1 还是 2？
