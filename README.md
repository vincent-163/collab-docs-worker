# Collab Docs Worker

带账户系统的多人实时协作办公套件（文档 / 表格 / 聊天 / 会议），部署在
Cloudflare Workers 上，通过共享入口 Worker 暴露在
`https://workers.v-163.top/docs/`。

## 功能

- **账户系统**：邮箱 + 密码注册登录（不验证邮箱），注册即送 $5 余额
- **知识库**：类飞书的目录树组织所有文档与表格，支持文件夹、移动、重命名；
  在文档中写入其他文档的链接，自动展示目标文档标题
- **富文本编辑**（Quill）：标题、粗体/斜体/下划线/删除线、行内代码、文字颜色与
  背景色、有序/无序列表、引用块、代码块、链接、图片、表格
- 基于 WebSocket + Quill Delta 操作转换（OT）的多人实时协同编辑，冲突自动合并
- 协作 presence：自动分配昵称/颜色，实时显示在线协作者
- 历史版本：每次修改记录为修订版本，可查看任意历史版本并一键恢复
- 文档标题实时同步、字符统计、Markdown/TXT 导出（表格导出为 Markdown 表格）
- **分享链接**：为文档生成只读 / 可编辑链接，支持 1 天 / 7 天 / 30 天有效期与链接管理
- **在线表格**：200 行 × 26 列单元格编辑，多人实时协同（单元格级 last-write-wins），
  公式求值（`+ - * / %`、括号、单元格引用、区域与 SUM/AVERAGE/MIN/MAX/COUNT，
  客户端内置微型解析器，零依赖），纳入知识库目录树
- **实时聊天**：房间制文字聊天（WebSocket），支持图片与文件附件（≤25MB，上传到 R2，
  **保存 7 天后自动删除**，按大小一次性扣费 $0.15/GB）
- **在线会议**：会议房间（文字聊天）+ 音视频通话。媒体路径二选一，自动切换：
  **Cloudflare Realtime SFU 中转**（配置凭证后启用，媒体经 Cloudflare 全球网络转发）
  → 失败/未配置时回退 **浏览器 WebRTC mesh 点对点直连**（Worker 仅做信令）
- **图片托管**：文档图片上传到 R2，按 $0.015/GB/月 计费，每月结算；余额不足自动清理该
  用户全部图片
- **API Key**：在仪表盘生成，配合 [skill](skill/SKILL.md) 让 AI Agent 直接读写文档

## 架构

- `src/index.js` — HTTP 路由：落地页、注册登录、仪表盘、编辑器、表格、聊天室、
  会议室、分享页、REST API、WebSocket 入口、静态资源、图片/附件服务；
  `scheduled()` 处理每月计费结算与每日聊天附件清理
- `src/doc-room.js` — `DocRoomV2` Durable Object：每个文档一个实例，持有权威 Delta
  文档、操作日志、修订快照、分享链接，处理并发变换、presence 广播与持久化
- `src/user-room.js` — `UserRoom` Durable Object：每个用户一个实例，持有密码哈希、
  会话、API Key、知识库树、聊天/会议房间列表、图片用量与余额（含一次性扣费）
- `src/directory-room.js` — `DirectoryRoom` Durable Object：全局 email → userId 目录，
  以及计费用的用户列表
- `src/chat-room.js` — `ChatRoom` Durable Object：每个聊天室一个实例，WebSocket
  消息扇出 + 持久化历史（最近 300 条，分块存储），附件消息只存元数据/URL
- `src/sheet-room.js` — `SheetRoom` Durable Object：每个表格一个实例，单元格级
  last-write-wins 协同（无 OT），原始单元格文本持久化（分块存储），标题同步到知识库
- `src/meet-room.js` — `MeetRoom` Durable Object：每个会议一个实例，临时文字聊天
  （内存，不持久化）+ WebRTC 信令中继（mesh 模式的 offer/answer/ICE 按 peer 转发）
  + 媒体状态与 SFU 已发布轨道列表（presence 广播）
- `src/realtime.js` — Cloudflare Realtime SFU 集成：Connection API 服务端代理
  （App Secret 不下发浏览器）、track/SDP 入参校验（纯函数，可单测）
- `src/auth.js` — PBKDF2 密码哈希、会话 cookie 工具
- `src/billing.js` — 图片存储按 byte-second 累计、按月结算（$0.015/GB/月）；
  聊天附件按上传大小一次性扣费（$0.15/GB，最低 0.01 美分/次）
- `src/formula.js` — 表格公式引擎（tokenizer + 递归下降解析器），同时作为 ES 模块
  由浏览器加载（`/static/formula.js`）
- `src/sheet-core.js` — 表格模型纯函数（行列上限、单元格写入校验），与 Worker 运行时解耦
- `src/delta-sanitize.js` — 客户端 Delta 校验与净化（属性白名单、链接/颜色安全检查）
- `src/delta-export.js` — Delta → 纯文本 / Markdown 转换
- `src/static.js` — 前端（CSS + 编辑器客户端 + 仪表盘客户端 + 聊天/表格/会议客户端，
  内置 Delta OT 状态机）
- `src/vendor/` — Quill 2 编辑器及其主题 CSS（随 Worker 分发，不依赖外部 CDN）
- `src/pages.js` — 落地页 / 注册登录 / 仪表盘 / 编辑器 / 表格 / 聊天室 / 会议室 HTML 模板
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

## 聊天 / 表格 / 会议

这三个功能使用**链接即权限**模型：房间 ID 是不可猜测的随机串，任何持有链接的
登录用户都可以加入并协作（与文档的 owner + 分享链接模型不同，属于刻意的简化）。

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | `/docs/chat/new` | 创建聊天室（form `name`） |
| GET | `/docs/chat/:id` | 聊天室页面（自动记入仪表盘房间列表） |
| WS | `/docs/chat/:id/ws` | 聊天 WebSocket（历史 + 实时消息 + presence） |
| POST | `/docs/chat/:id/upload` | 上传附件（multipart ≤25MB，一次性扣费，7 天保留） |
| GET | `/docs/file/chat/:key` | 附件下载（不可猜测 key，图片 inline，其余 attachment） |
| POST | `/docs/sheet/new` | 创建表格（form `title`、`parent`，纳入知识库树） |
| GET | `/docs/sheet/:id` | 表格编辑器页面 |
| WS | `/docs/sheet/:id/ws` | 表格协同 WebSocket（单元格 LWW + 标题 + presence） |
| POST | `/docs/meet/new` | 创建会议（form `name`） |
| GET | `/docs/meet/:id` | 会议页面（音视频 + 文字聊天） |
| WS | `/docs/meet/:id/ws` | 会议 WebSocket（聊天 + 信令/轨道广播 + presence） |
| POST | `/docs/meet/:id/sfu/session` | 创建 Realtime SFU 会话（代理，需配置 secret） |
| POST | `/docs/meet/:id/sfu/sessions/:sid/tracks` | 发布/订阅 track（代理 tracks/new） |
| PUT | `/docs/meet/:id/sfu/sessions/:sid/renegotiate` | SDP renegotiate 应答（代理） |
| PUT | `/docs/meet/:id/sfu/sessions/:sid/tracks/close` | 关闭 track（代理，离开会议时 best-effort 调用） |

### 聊天附件计费

附件按上传大小**一次性扣费**（费率 $0.15/GB，最低 0.01 美分/次），从注册余额中
扣除；余额不足时上传被拒绝（HTTP 402），不产生存储。附件对象 key 内嵌上传时间戳
（`chat/<ts>-<rand>`），每日 cron（`17 3 * * *`）扫描 R2 `chat/` 前缀并删除超过
7 天的对象。

### 在线会议的技术路线

会议音视频有两条媒体路径，客户端自动选择：

1. **Cloudflare Realtime SFU 中转**（首选，需配置凭证）：每位参会者由浏览器经
   `RTCPeerConnection` 与 Cloudflare SFU 建连（STUN 用 `stun.cloudflare.com:3478`），
   通过 Realtime Connection API 发布本地音视频 track、拉取其他参会者的 track。
   App Secret 只保存在 Worker 服务端，浏览器的一切 Realtime API 调用都经由本 Worker
   代理（`/meet/:id/sfu/*`，含参数校验）。“谁发布了哪些 track”通过 MeetRoom
   presence（`sfuTracks` 字段）广播，迟加入者也能订阅。媒体流量不经过本 Worker。
2. **浏览器 mesh P2P**（回退）：未配置 Realtime 凭证（`/meet/:id/sfu/*` 返回 503）、
   或 SFU 建连/推流/订阅任一步骤失败时，自动回退到原有 mesh 逻辑（Worker 仅信令）。
   回退以客户端为单位：已回退的客户端只能看到同样走 mesh 的参会者。

**开通 SFU 的步骤**（Realtime App 需手动在控制台创建；本仓库的 CI token 没有
Calls 权限，无法程序化创建）：

1. 打开 [Realtime 控制台](https://dash.cloudflare.com/?to=/:account/realtime/sfu)，
   创建一个 SFU App（会得到 App ID 和 App Secret）。
2. 在本仓库目录执行（不会写入任何文件，直接存为 Worker secret）：
   ```bash
   npx wrangler secret put REALTIME_APP_ID
   npx wrangler secret put REALTIME_APP_SECRET
   ```
   GitHub Actions 部署时，也可将同名值保存为仓库 Secrets；部署工作流会通过
   `wrangler secret bulk` 将其同步到 Worker。
3. 重新部署。未设置这两个 secret 时一切照旧（mesh 模式），无需任何变更。
   本地开发可在 `.dev.vars`（已 gitignore）中放入同名变量调试。

**计费**（由 Cloudflare 账户侧收取，与应用内余额无关）：SFU + TURN 合计
$0.05/GB 出口流量，含 1,000 GB 免费额度；推流到 Cloudflare 不计费。

此前评估的「Worker 直接做 WebRTC 媒体中转（TURN）」依然不可行：Workers /
Durable Objects 只支持 TCP，无法收发 UDP。SFU 方案相当于把中转层托管给
Cloudflare Realtime，效果相同且不需要自建 TURN。mesh 模式下对称 NAT 对端无法
直连时该路视频失败（UI 会提示）。浏览器不支持 `getUserMedia`/
`RTCPeerConnection` 时自动降级为仅文字聊天并明确提示。

## 部署

共享入口 Worker（`workers.v-163.top` 仓库）通过 Service Binding `DOCS_SERVICE`
把 `/docs/*` 转发到本 Worker，转发时剥离 `/docs` 前缀并设置
`x-forwarded-prefix` 头。

依赖资源：R2 bucket `collab-docs-images`（图片托管 + 聊天附件）、每月 1 日的 cron
触发器（计费结算）与每日 cron 触发器（聊天附件 7 天清理），均已在 `wrangler.jsonc`
声明。新增 Durable Object 类（`ChatRoom`、`SheetRoom`、`MeetRoom`）通过 migration
`v4-collab-suite` 声明，首次部署自动生效。

> 可选加固：若想用 R2 object lifecycle 规则代替 cron 清理，可在 Cloudflare 控制台
> 为 `collab-docs-images` bucket 配置「前缀 `chat/`、7 天后删除」的生命周期规则，
> 然后移除 wrangler.jsonc 中的每日 cron。

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
- 表格：200 行 × 26 列、最多 5,000 个非空单元格、每格 500 字符；协同为单元格级
  last-write-wins（无字符级 OT），公式在客户端求值（服务端只存原始文本）
- 聊天：每房间保留最近 300 条消息；附件 ≤25MB、保存 7 天；非图片附件不支持在线
  预览（UI 已明确提示，仅提供下载）
- 会议：SFU 中转需手动在控制台创建 Realtime App 并配置 secret（见上）；未配置时
  mesh 模式无 TURN 兜底，对称 NAT 下音视频可能失败；SFU 与 mesh 混用时两种模式的
  参会者互不可见（以客户端为单位回退）；会议聊天仅存内存（DO 重启后丢失）；
  无会议密码/等候室
- 聊天/表格/会议均为「链接即权限」，没有细粒度成员管理（文档保持 owner + 分享链接模型）
