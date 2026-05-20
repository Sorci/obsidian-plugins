# WeChat Clipper Store Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 WeChat Clipper（Sorci）通过 Obsidian Community plugins 上架并支持后续在 Store 内更新（基于 GitHub Release 资产）。

**Architecture:** 采用 monorepo 做源码仓库，另建 `Sorci/wechat-clipper` 作为发布仓库。源码仓库负责把 `obsidian-plugins/wechat-clipper/` 同步到发布仓库根目录并打 tag；发布仓库在 tag 推送后自动构建并创建 GitHub Release，上传 `main.js/manifest.json(/styles.css)` 供 Obsidian 拉取更新。

**Tech Stack:** TypeScript, esbuild, npm, GitHub Actions, Obsidian community plugin release model

---

## 文件结构与变更面

**源码仓库（当前仓库 /workspace）**
- Modify: [manifest.json](file:///workspace/obsidian-plugins/wechat-clipper/manifest.json)
- Modify: [package.json](file:///workspace/obsidian-plugins/wechat-clipper/package.json)
- Create: `/workspace/obsidian-plugins/wechat-clipper/LICENSE`
- Create: `/workspace/.github/workflows/publish-wechat-clipper.yml`
- (Optional) Create: `/workspace/scripts/sync-plugin.mjs`（如果工作流里脚本过长，抽出来）

**发布仓库（Sorci/wechat-clipper）**
- Create: `.github/workflows/release.yml`（在发布仓库里）
- 根目录需存在：`manifest.json`, `README.md`, `LICENSE`, `package.json`, `esbuild.config.mjs`, `src/`
- Release 附件由 CI 产出：`main.js`, `manifest.json`, `styles.css(可选)`

---

### Task 1: 修正插件元数据到 0.1.2 / Sorci

**Files:**
- Modify: [manifest.json](file:///workspace/obsidian-plugins/wechat-clipper/manifest.json)
- Modify: [package.json](file:///workspace/obsidian-plugins/wechat-clipper/package.json)
- Test: `/workspace/obsidian-plugins/wechat-clipper/src/__tests__/`（仅运行全量测试即可）

- [ ] **Step 1: 更新 manifest.json 字段**

将字段更新为（authorUrl 这里先留空，后续可补；不会阻塞发版与上架）：

```json
{
  "id": "wechat-clipper",
  "name": "WeChat Clipper",
  "version": "0.1.2",
  "minAppVersion": "1.5.0",
  "description": "Import WeChat Official Account articles into Obsidian as Markdown with local images.",
  "author": "Sorci",
  "authorUrl": "",
  "isDesktopOnly": false
}
```

- [ ] **Step 2: 同步 package.json version**

将 `version` 改为：

```json
{
  "name": "obsidian-wechat-clipper",
  "version": "0.1.2"
}
```

- [ ] **Step 3: 运行测试**

Run（在插件目录内）：

```bash
npm test
```

Expected: vitest 退出码为 0

- [ ] **Step 4: 本地构建一次确保能产出 main.js**

Run：

```bash
npm run build
```

Expected: 生成/更新 `main.js`

- [ ] **Step 5: Commit**

```bash
git add obsidian-plugins/wechat-clipper/manifest.json obsidian-plugins/wechat-clipper/package.json
git commit -m "chore(wechat-clipper): bump version to 0.1.2 and set author"
```

---

### Task 2: 补齐 MIT LICENSE（以便同步到发布仓库根目录）

**Files:**
- Create: `/workspace/obsidian-plugins/wechat-clipper/LICENSE`

- [ ] **Step 1: 创建 LICENSE（MIT）**

内容（年份用 2026，主体为 Sorci）：

```text
MIT License

Copyright (c) 2026 Sorci

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Commit**

```bash
git add obsidian-plugins/wechat-clipper/LICENSE
git commit -m "chore(wechat-clipper): add MIT license"
```

---

### Task 3: 发布仓库（Sorci/wechat-clipper）添加 Release 工作流

**Files (in Sorci/wechat-clipper):**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: 在发布仓库创建工作流文件**

创建 `.github/workflows/release.yml`，核心要求：
- 触发：tag push（形如 `0.1.2`）
- 校验：tag == `manifest.json.version`
- 构建：`npm ci` + `npm run build`
- Release：创建 GitHub Release 并上传附件 `main.js`, `manifest.json`，若存在则上传 `styles.css`

建议内容：

```yaml
name: Release

on:
  push:
    tags:
      - "*.*.*"

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Verify tag matches manifest version
        run: |
          TAG="${GITHUB_REF_NAME}"
          VERSION="$(node -p "require('./manifest.json').version")"
          if [ "$TAG" != "$VERSION" ]; then
            echo "Tag ($TAG) does not match manifest.json version ($VERSION)"
            exit 1
          fi

      - name: Build
        run: npm run build

      - name: Prepare assets
        run: |
          test -f main.js
          test -f manifest.json
          if [ -f styles.css ]; then
            echo "styles.css found"
          fi

      - name: Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            main.js
            manifest.json
            styles.css
```

- [ ] **Step 2: 在发布仓库打一个本地 dry-run 检查**

确认发布仓库默认分支根目录存在：
- `manifest.json`（version 为 `0.1.2`）
- `package.json`
- `esbuild.config.mjs`
- `src/`

并确认 `npm ci && npm run build` 可以在发布仓库跑通。

- [ ] **Step 3: 提交并推送到发布仓库**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release workflow"
git push
```

---

### Task 4: 源码仓库添加“同步到发布仓库并打 tag”的工作流

**Files:**
- Create: `/workspace/.github/workflows/publish-wechat-clipper.yml`

- [ ] **Step 1: 在源码仓库准备 GitHub Secret**

在源码仓库的 GitHub Settings → Secrets and variables → Actions 添加：
- `WECHAT_CLIPPER_PUBLISH_TOKEN`：一个对 `Sorci/wechat-clipper` 有写权限的 token

最小权限建议：
- contents: write（对发布仓库）

- [ ] **Step 2: 添加 workflow_dispatch 工作流**

创建 `/workspace/.github/workflows/publish-wechat-clipper.yml`，要求：
- 手动触发，输入 version（例如 0.1.2）
- 校验子目录 `obsidian-plugins/wechat-clipper/` 的 `manifest.json` 与 `package.json` 版本一致且等于输入
- 将该子目录内容同步到 `Sorci/wechat-clipper` 仓库的 `main` 分支根目录
- 在发布仓库创建 tag（例如 0.1.2）并 push（触发发布仓库 Release 工作流）

建议内容（使用 git + rsync 风格的覆盖同步；不依赖额外 action）：

```yaml
name: Publish WeChat Clipper

on:
  workflow_dispatch:
    inputs:
      version:
        description: "Release version (x.y.z)"
        required: true

permissions:
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Verify versions
        working-directory: obsidian-plugins/wechat-clipper
        run: |
          INPUT="${{ inputs.version }}"
          MV="$(node -p "require('./manifest.json').version")"
          PV="$(node -p "require('./package.json').version")"
          if [ "$INPUT" != "$MV" ]; then
            echo "Input version ($INPUT) != manifest.json version ($MV)"
            exit 1
          fi
          if [ "$INPUT" != "$PV" ]; then
            echo "Input version ($INPUT) != package.json version ($PV)"
            exit 1
          fi

      - name: Clone publish repo
        env:
          TOKEN: ${{ secrets.WECHAT_CLIPPER_PUBLISH_TOKEN }}
        run: |
          git clone "https://x-access-token:${TOKEN}@github.com/Sorci/wechat-clipper.git" publish-repo

      - name: Sync plugin subtree to publish repo root
        run: |
          rm -rf publish-repo/*
          cp -R obsidian-plugins/wechat-clipper/. publish-repo/

      - name: Commit and push to publish repo
        working-directory: publish-repo
        run: |
          git config user.name "wechat-clipper-bot"
          git config user.email "wechat-clipper-bot@users.noreply.github.com"
          git add -A
          git commit -m "chore: sync from monorepo ${{ inputs.version }}" || echo "No changes to commit"
          git push origin HEAD:main

      - name: Create and push tag
        working-directory: publish-repo
        run: |
          git tag "${{ inputs.version }}"
          git push origin "${{ inputs.version }}"
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/publish-wechat-clipper.yml
git commit -m "ci: add workflow to sync and tag publish repo for wechat-clipper"
```

---

### Task 5: 首次发版 0.1.2（验证 Store 更新链路的核心）

**Files:**
- N/A（操作步骤）

- [ ] **Step 1: 在源码仓库推送到默认分支**

确保包含 Task 1/2/4 的提交已 push。

- [ ] **Step 2: 运行源码仓库工作流（Publish WeChat Clipper）**

在 GitHub Actions 手动触发，输入：
- version: `0.1.2`

Expected:
- 发布仓库 `Sorci/wechat-clipper` 的 main 分支被同步更新
- 发布仓库出现 tag `0.1.2`

- [ ] **Step 3: 验证发布仓库 Release 是否生成**

Expected:
- `Sorci/wechat-clipper` → Releases 出现 `0.1.2`
- Assets 包含：`main.js`, `manifest.json`（若未来有则含 `styles.css`）

- [ ] **Step 4: 手动安装验证（可选但强烈建议）**

从 Release 下载附件，复制到：
`<vault>/.obsidian/plugins/wechat-clipper/`

Expected:
- Obsidian 能启用插件且无明显报错

---

### Task 6: 提交到 Obsidian 社区插件列表（上架）

**Files (in obsidianmd/obsidian-releases fork):**
- Modify: `community-plugins.json`

- [ ] **Step 1: Fork obsidianmd/obsidian-releases 并新建分支**

分支名示例：`add-wechat-clipper`

- [ ] **Step 2: 在 community-plugins.json 增加条目**

新增对象示例（字段需与发布仓库 manifest 一致）：

```json
{
  "id": "wechat-clipper",
  "name": "WeChat Clipper",
  "author": "Sorci",
  "description": "Import WeChat Official Account articles into Obsidian as Markdown with local images.",
  "repo": "Sorci/wechat-clipper",
  "branch": "main"
}
```

- [ ] **Step 3: 提 PR**

按 PR 模板逐项勾选（包括：Release 已存在、资产完整、LICENSE 存在、manifest 字段一致等）。

- [ ] **Step 4: 等待审核与处理反馈**

如有 review comment，按要求修改并更新 PR。

---

## Self-Review Checklist（计划自检）

- 覆盖 spec：版本一致性、双仓库、两段 CI、Release 资产、上架条目字段约束、验收标准均有对应 Task
- 无占位：计划中每个关键步骤给出了具体文件路径、内容与命令
- 一致性：tag 格式统一为 `x.y.z`（不加 v），与 manifest/package 的版本一致

## 执行交接

计划已保存到 [2026-05-20-wechat-clipper-store-update.md](file:///workspace/docs/superpowers/plans/2026-05-20-wechat-clipper-store-update.md)。

两种执行方式：
1) Subagent-Driven（推荐）：我按 Task 拆分逐个落地并在关键点请你确认
2) Inline Execution：我在当前会话按 Task 顺序一次性执行到可发版状态

你选哪一个？

