# Collab Docs Worker

带账户系统的多人实时协作富文本文档应用，部署在 Cloudflare Workers 上，通过共享入口
Worker 暴露在 `https://workers.v-163.top/docs/`。

## 功能

- **账户系统**：邮箱 + 密码注册登录（不验证邮箱），注册即送 $5 余额
- **知识库**：类飞书的目录树组织所有文档，支持文件夹、移动、重命名；
  在文档中写入其他文档的链接，自动展示目标文档标题
- **富文本编辑**（Quill）：标题、粗体/斜体/下划线/删除线、行内代码、文字颜色与
  背景色、有序/无序列表、引用块、代码块、链接、图片、表格
- 基于 WebSocket + Quill Delta 操作转换（OT）的多人实时协同编辑，冲突自动合并
- 协作 presence：自动分配昵称/颜色，实时显示在线协作者
- 历史版本：每次修改记录为修订版本，可查看任意历史版本并一键恢复
- 文档标题实时同步、字符统计、Markdown/TXT 导出（表格导出为 Markdown 表格）
- **分享链接**：为文档生成只读 / 可编辑链接，支持 1 天 / 7 天 / 30 天有效期与链接管理
- **图片托管**：图片上传到 R2，按 $0.015/GB/月 计费，每月结算；余额不足自动清理该
  用户全部图片
- **API Key**：在仪表盘生成，配合 [skill](skill/SKILL.md) 让 AI Agent 直接读写文档

## 架构

- `src/index.js` — HTTP 路由：落地页、注册登录、仪表盘、编辑器、分享页、REST API、
  WebSocket 入口、静态资源、图片服务；`scheduled()` 处理每月计费结算
- `src/doc-room.js` — `DocRoomV2` Durable Object：每个文档一个实例，持有权威 Delta
  文档、操作日志、修订快照、分享链接，处理并发变换、presence 广播与持久化
- `src/user-room.js` — `UserRoom` Durable Object：每个用户一个实例，持有密码哈希、
  会话、API Key、知识库树、图片用量与余额
- `src/directory-room.js` — `DirectoryRoom` Durable Object：全局 email → userId 目录，
  以及计费用的用户列表
- `src/auth.js` — PBKDF2 密码哈希、会话 cookie 工具
- `src/billing.js` — 图片存储按 byte-second 累计、按月结算（$0.015/GB/月）
- `src/delta-sanitize.js` — 客户端 Delta 校验与净化（属性白名单、链接/颜色安全检查）
- `src/delta-export.js` — Delta → 纯文本 / Markdown 转换
- `src/static.js` — 前端（CSS + 编辑器客户端 + 仪表盘客户端，内置 Delta OT 状态机）
- `src/vendor/` — Quill 2 编辑器及其主题 CSS（随 Worker 分发，不依赖外部 CDN）
- `src/pages.js` — 落地页 / 注册登录 / 仪表盘 / 编辑器 HTML 模板
- `skill/SKILL.md` — Agent skill：API Key 认证与文档 API 用法（线上 `/docs/skill.md` 可读）

协作协议：客户端把本地编辑产生的 Delta 携带 `baseRev` 发送；服务端将该 Delta 对
`baseRev` 之后的已应用操作做 OT 变换（`quill-delta` 的 `transform`，历史操作优先）
后落盘并广播。客户端对未确认的 pending/buffer Delta 做同样的变换，保证所有副本
最终一致。

## REST API

需 `Authorization: Bearer <API Key>` 或登录会话 cookie；仅能访问自己的文档。

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | `/docs/api/v1/documents` | 创建文档 `{title?, content?}` 或 `{title?, delta:{ops}}` |
| GET | `/docs/api/v1/documents` | 列出我的文档 |
| GET | `/docs/api/v1/documents/:id` | 文档元信息 |
| PATCH | `/docs/api/v1/documents/:id` | 更新标题 |
| GET | `/docs/api/v1/documents/:id/content` | 正文（`delta` + 纯文本 `text`），`?rev=N` 取历史版本 |
| GET | `/docs/api/v1/documents/:id/revisions` | 修订版本列表 |
| GET | `/docs/api/v1/documents/:id/collaborators` | 当前在线协作者 |
| GET | `/docs/api/v1/documents/:id/export` | 导出 `?format=markdown\|txt` |
| POST | `/docs/api/v1/images` | 上传图片（multipart，≤10MB，PNG/JPG/GIF/WebP） |
| WS | `/docs/d/:id/ws` · `/docs/s/:token/ws` | 实时协作通道（owner / 分享链接） |

## 部署

共享入口 Worker（`workers.v-163.top` 仓库）通过 Service Binding `DOCS_SERVICE`
把 `/docs/*` 转发到本 Worker，转发时剥离 `/docs` 前缀并设置
`x-forwarded-prefix` 头。

依赖资源：R2 bucket `collab-docs-images`（图片托管）、每月 1 日的 cron 触发器
（计费结算），均已在 `wrangler.jsonc` 声明。

需要仓库 secret `CLOUDFLARE_API_TOKEN`（Workers Scripts Write + Workers R2
Storage Write）与仓库变量 `CLOUDFLARE_ACCOUNT_ID`。推送 `main` 触发 GitHub
Actions 部署，或本地运行：

```bash
npm ci
npm test        # node --test + wrangler deploy --dry-run
scripts/deploy.sh
```

## 限制

- 单文档 Delta JSON 最大约 480K 字符（DO storage 单值 128 KiB 约束，已分块存储）
- 操作日志超过 2,000 条后压缩为快照，更早的历史版本不再可取（API 返回 410）
- 会话有效期 30 天；每用户最多 10 个 API Key、每文档最多 50 个分享链接
