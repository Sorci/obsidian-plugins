# WeChat Clipper (Obsidian Plugin)

## Features

- Import WeChat Official Account article from URL into Obsidian
- Download images into Vault and replace links
- Trim tail sections (reward/recommendation/etc.)
- (Optional) Use AI to generate topic/tags/summary and write into the note

## Manual Install

1. Copy this folder to your vault plugins folder: `<Vault>/.obsidian/plugins/wechat-clipper/`
2. Ensure the folder contains:
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

## AI（可选）

开启后，会在导入流程中用「OpenAI 兼容接口」分析文章，尽力生成：
- topic（主题）
- tags（标签）
- summary（摘要）

在 Obsidian 设置中进入本插件设置页：
- 启用 AI：打开后才会请求 AI
- Base URL：例如 `https://api.openai.com`
  - 插件会自动补齐为 `/v1/chat/completions`
  - 也支持你直接填 `.../v1` 或 `.../v1/chat/completions`
- Model：例如 `gpt-4o-mini`
- API Key：以密码框输入，仅保存在本地插件设置中
- 输出语言：`auto` / `zh` / `en`
- 请求超时、最大输入字符数、摘要最大字符数、最大标签数量：用于控制请求与输出规模

## 写入字段

当 AI 生成到对应字段时，会写入笔记：
- YAML Frontmatter：`topic`、`tags`
- 正文开头：插入一段 summary callout（`[!summary]`）

示例（节选）：

```md
---
source: https://mp.weixin.qq.com/s/...
title: "..."
publish_time: 2026-05-20
topic: "..."
tags:
  - a
  - b
---

> [!summary] AI 总结
> ...
```

## Best-effort 行为与状态提示

- AI 失败/超时/返回内容不合法时：不会阻塞导入，笔记仍会生成，只是不会写入 topic/tags/summary
- 开启 AI 但缺少 Base URL / Model / API Key：不会请求 AI，状态为 `missing config`
- 导入完成后会在右上角 Notice 里显示 AI 状态（例如 `AI: ok/failed/missing config`）

## 隐私提示

- 仅在你开启 AI 且配置完整时，才会向你配置的 Base URL 发起请求
- 发送给 AI 的内容包含：文章标题 + 文章正文的 Markdown（会按“最大输入字符数”截断）
- API Key 仅保存在本地 Obsidian 插件设置中；请自行评估第三方模型服务的留存/合规风险
- 如需更强隐私控制，建议使用自部署或本地的 OpenAI 兼容服务作为 Base URL

## Limitations

- Publicly accessible articles only (no login-required articles)
