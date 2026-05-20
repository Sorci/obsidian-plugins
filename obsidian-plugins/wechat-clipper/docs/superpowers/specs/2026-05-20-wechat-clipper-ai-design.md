# WeChat Clipper：AI 主题/标签/总结（导入时同步生成）设计

## 1. 背景与目标

当前插件已实现从公众号 URL 导入文章并转换为 Markdown（含图片本地化），但缺少 AI 能力。

本设计目标：

- 在导入完成后，自动识别文章主题（topic）并生成标签（tags），写入笔记 frontmatter，便于检索与聚合
- 在 frontmatter（Obsidian Properties）之后、正文之前插入一个简短的 AI 总结块（callout）
- 采用“插件内置调用 OpenAI 兼容 API”的方式，不依赖其他 Obsidian AI 插件
- 默认“导入时同步生成”，并提供明确的失败降级策略

相关现有代码路径：

- 导入流程入口：[main.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/main.ts#L13-L45)
- 导入编排与写入笔记：[importWeChatArticle.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/importer/importWeChatArticle.ts#L10-L62)

## 2. 非目标（Non-goals）

- 不做运行时注入复杂 UI（例如在阅读视图插入按钮、可编辑标签组件等）
  - 原因：Obsidian 属性面板本身支持对 `tags` 的增删（包括点击 “X” 删除与手动补充），已满足交互诉求
- 不实现向量化、语义检索、知识库问答等更重的 AI 能力
- 不在首版提供“导入后异步生成”与“重新生成”按钮（可作为后续迭代）

## 3. 用户体验与输出格式

### 3.1 Frontmatter 字段

新增字段：

- `topic: "<string>"`
- `tags: ["tag1", "tag2", ...]`

约束：

- tags 仅输出纯文本，不包含 `#`
- tags 数量受配置项限制（默认 8）
- tags 与 topic 均为可选：AI 失败时不写入

### 3.2 AI 总结展示（callout）

位置：frontmatter 结束行 `---` 之后、正文之前。

格式（示例）：

```md
> [!summary] AI 总结
> 一句话或两三句话概括文章核心观点与结论，尽量信息密度高。

```

约束：

- 总结长度受配置项限制（默认 120 字左右）
- 失败时不插入该块（或可选插入“生成失败”提示，首版默认不插入以避免污染正文）

## 4. 技术方案概览

### 4.1 LLM 接入方式

采用插件内置 HTTP 调用方式，新增一个模块封装 OpenAI 兼容接口：

- 使用 Obsidian 提供的 `requestUrl`（现有代码已使用）发起请求
- 支持配置 Base URL（兼容 OpenAI/DeepSeek/通义等 OpenAI-Compatible 服务）

不新增第三方 SDK 依赖（首版），原因：

- 减少包体与兼容性风险
- 只需要 `POST /v1/chat/completions` 即可满足需求

### 4.2 与现有导入流程的集成点

导入流程（简化）：

1. fetch HTML
2. extract content
3. clean content
4. html → markdown
5. localize images
6. write note

集成点建议：

- 在拿到 `mdBody` 后即可进行 AI 分析：输入 `title + mdBody`
- AI 请求与 `localizeImages(...)` 可并行执行（两者都是网络/IO 密集），最终合并结果后写入笔记

当前可修改入口：

- [importWeChatArticle.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/importer/importWeChatArticle.ts#L10-L52)

## 5. 配置设计（Settings）

在插件设置页新增 “AI” 区域配置项：

- `aiEnabled: boolean`（默认 false）
- `aiBaseUrl: string`（默认空；示例：`https://api.openai.com` 或自建网关）
- `aiApiKey: string`（默认空；使用 password 输入）
- `aiModel: string`（默认 `gpt-4o-mini` 或留空让用户填）
- `aiRequestTimeoutMs: number`（默认 30000）
- `aiMaxInputChars: number`（默认 60000，避免超长文章导致 token 过大）
- `aiSummaryMaxChars: number`（默认 150）
- `aiMaxTags: number`（默认 8）
- `aiLanguage: "auto" | "zh" | "en"`（默认 auto；主要用于 prompt 约束输出语言）

落点文件：

- 设置 UI：[settings.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/settings.ts)
- 类型与默认值：[types.ts](file:///workspace/obsidian-plugins/wechat-clipper/src/types.ts)

安全要求：

- 不在 Notice/日志中输出 API Key 或完整请求头
- settings 持久化由 Obsidian 管理，但仍应避免任何形式的明文打印

## 6. Prompt 与返回结构（可解析 JSON）

目标：让模型输出稳定、可解析、可控长度的结构化结果，避免 Markdown/自然语言漂移。

### 6.1 输入

- `title`：文章标题
- `content`：文章 Markdown（必要时截断到 `aiMaxInputChars`）

截断策略：

- 优先保留开头与结尾（例如：开头 70% + 结尾 30%），或直接保留开头并说明已截断（首版选更简单的“从头截断”也可）
- 在 prompt 中提示内容可能被截断，需尽量覆盖核心信息

### 6.2 输出 JSON schema

要求模型严格输出以下 JSON（不带代码块，不带额外文本）：

```json
{
  "topic": "string",
  "tags": ["string"],
  "summary": "string"
}
```

字段约束：

- `topic`：不超过 20 字（或 40 chars）
- `tags`：数组长度不超过 `aiMaxTags`；每个 tag 不超过 12 字；不含 `#`；不含空格开头结尾
- `summary`：不超过 `aiSummaryMaxChars`

解析策略：

- 首选 `JSON.parse` 直接解析
- 若解析失败：触发降级（见第 8 节）

## 7. 写入格式（YAML 与 Markdown 拼装）

### 7.1 Frontmatter YAML

在现有 `withFrontmatter(meta, body)` 的基础上扩展：

- 若有 topic：`topic: "<escaped>"`
- 若有 tags：`tags:` 按 YAML list 输出，例如：

```yaml
tags:
  - tag1
  - tag2
```

避免使用 `tags: [a, b]` 的行内数组写法，以减少转义与边界情况。

### 7.2 Callout 插入

在 frontmatter 结束 `---` 与正文之间插入 callout 块：

- 若 summary 存在：插入 `> [!summary] AI 总结` + 多行 `> ...`（按行 wrap）
- callout 后追加一个空行，再接正文

实现插入点：

- [withFrontmatter](file:///workspace/obsidian-plugins/wechat-clipper/src/importer/importWeChatArticle.ts#L54-L62) 中 `lines.push("---", "");` 之后追加内容

## 8. 失败降级与提示策略

需要确保“AI 不可用时也能正常导入”。

降级规则：

- `aiEnabled=false`：完全跳过 AI
- 配置缺失（Base URL / Key / Model 为空）：跳过 AI，并提示用户去设置页配置
- 请求超时/HTTP 失败/返回不可解析：跳过 AI，导入继续完成

用户提示（Notice）原则：

- 成功：可在导入完成提示中追加 “AI: ok”
- 失败：提示“AI 生成失败（原因简述）”，不包含敏感信息

## 9. 测试策略

单元测试（vitest）建议覆盖：

- JSON 解析：正确 JSON、带前后噪声（应失败并降级）、字段缺失
- YAML 输出：tags list 的格式、字符串转义
- callout 拼装：多行 summary 时每行前缀 `>` 正确

不做真实联网测试，改用 mock `requestUrl`。

## 10. 迭代路线（后续可选）

- 异步生成：导入先落盘，再后台补齐 topic/tags/summary 并更新文件，减少等待
- 重新生成：在 callout 下方追加一个可点击的 code block + 插件渲染按钮（需要 UI 注入）
- 与 Obsidian 原生 “Properties” 的编辑体验更深度结合（目前先使用 tags 的原生增删能力）

