---
title: WeChat Clipper（monorepo）上架与自动更新设计
date: 2026-05-20
version_target: 0.1.2
author: Sorci
---

# 目标

- 让用户在 Obsidian Community plugins（Obsidian Store）中安装并更新 WeChat Clipper
- 建立稳定的自动发版链路：更新代码 → 生成 GitHub Release（含 main.js/manifest.json）→ Obsidian 检测到新版本
- 保留 monorepo：未来允许在同一源码仓库中维护多个插件

# 背景与约束

- Obsidian 的社区插件更新依赖 GitHub Release 附件，而不是仓库分支的最新代码
- Release tag 必须与 manifest.json 的 version 完全一致，且附件需要包含：
  - main.js
  - manifest.json
  - styles.css（可选）
- 社区插件登记（obsidianmd/obsidian-releases 的 community-plugins.json）仅支持配置单一 repo（可选 branch），不支持配置子目录

# 现状

- 插件位于 monorepo 子目录：obsidian-plugins/wechat-clipper/
- manifest.json / package.json 当前 version 为 0.0.1，author 为占位符
- 仓库中缺少发布/上架所需的标准化发布工作流（CI 创建 Release 并上传附件）

# 总体方案

采用“双仓库”模型：

- 源码仓库（monorepo）：用于日常开发与测试，包含多个插件子目录
- 发布仓库（per-plugin）：仅用于该插件的上架与更新；Obsidian Store 指向该仓库

发布仓库的默认分支根目录内容等同于该插件的“可发布内容根”，并且由 CI 自动构建与发布 Release。

# 仓库与目录规范

## 源码仓库（monorepo）

- 路径：obsidian-plugins/wechat-clipper/
- 发布所需文件（源形态）：
  - manifest.json
  - package.json / package-lock.json
  - src/
  - esbuild.config.mjs
  - README.md
  - LICENSE（在插件子目录内新增，便于同步到发布仓库根目录）

## 发布仓库（per-plugin）

- 仓库：<OWNER>/<REPO>（由维护者确定）
- 默认分支：main（建议）
- 根目录包含（至少）：
  - manifest.json
  - main.js（Release 附件从 CI 构建得到）
  - README.md
  - LICENSE

# 版本策略

- 使用语义化版本：x.y.z
- 版本号一致性要求（发布的硬约束）：
  - manifest.json.version == package.json.version == Git tag
- tag 格式：使用纯版本号（例如 0.1.2），不加前缀 v

# 工作流设计

## A. 发布仓库：自动创建 Release

触发条件：

- push tag（例如 0.1.2）

流程：

- 校验 tag 与 manifest.json.version 完全一致；不一致则失败
- npm ci
- npm run build
- 创建 GitHub Release（tag 为 0.1.2）
- 上传 Release assets：
  - main.js
  - manifest.json
  - styles.css（若存在）

产出：

- 一个可被 Obsidian Store 拉取更新的 Release

## B. 源码仓库：同步到发布仓库并触发发版

触发条件（二选一，默认推荐第 1 种）：

1) 手动触发（workflow_dispatch），输入 version（例如 0.1.2）
2) push tag（例如 0.1.2）在源码仓库触发

流程：

- 校验源码仓库中：
  - obsidian-plugins/wechat-clipper/manifest.json.version 与目标 version 一致
  - obsidian-plugins/wechat-clipper/package.json.version 与目标 version 一致
- 将 obsidian-plugins/wechat-clipper/ 目录内容同步到发布仓库默认分支根目录（覆盖式同步）
- 在发布仓库创建同名 tag（例如 0.1.2），触发发布仓库 Release 工作流

凭据与权限：

- 源码仓库需要一个可写入发布仓库的 Token（仅最小权限：contents:write）
- Token 存在源码仓库 Secrets 中，工作流仅在受信分支/手动触发时使用

# 上架（首次提交到 Obsidian 社区插件列表）

在 obsidianmd/obsidian-releases 的 community-plugins.json 新增条目，字段取值约束：

- id：wechat-clipper（与 manifest.json.id 一致，且上架后不得修改）
- name：WeChat Clipper（与 manifest.json.name 一致）
- author：Sorci（与 manifest.json.author 一致）
- description：与 manifest.json.description 一致
- repo：发布仓库 <OWNER>/<REPO>
- branch：若默认分支非 master，可显式填 main

审核通过合并后：

- 用户可在 Obsidian 内搜索并安装
- 后续更新将通过发布仓库的 GitHub Release 分发

# 回滚策略

- 若某版本出现严重问题：
  - 发布一个更高版本（例如 0.1.3）修复并发布
  - 不建议删除已发布 Release；如必须撤回，优先使用更高版本覆盖

# 验收标准

- 发布仓库中存在 Release 0.1.2，且附件包含 main.js 与 manifest.json
- manifest.json.version 为 0.1.2，author 为 Sorci
- 提交到 community-plugins.json 的条目与 manifest 信息一致
- 在 Obsidian 内安装后可检测到后续版本更新（发布 0.1.3 后可见更新提示）

