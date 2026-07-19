# Collab Docs Worker

多人实时协作文档应用，部署在 Cloudflare Workers 上，通过共享入口 Worker 暴露在
`https://workers.v-163.top/docs/`。

## 功能

- 首页匿名创建文档，无需注册登录，链接即权限
- 基于 WebSocket + 操作转换（OT）的多人实时协同编辑，冲突自动合并
- 协作 presence：自动分配昵称/颜色，实时显示在线协作者
- 历史版本：每次修改记录为修订版本，可查看任意历史版本并一键恢复
- 文档标题实时同步、字符统计、Markdown/TXT 导出
- 类飞书/谷歌/腾讯文档风格的开放 REST API

## 架构

- `src/index.js` — HTTP 路由：首页、编辑器页面、REST API、WebSocket 入口
- `src/doc-room.js` — `DocRoom` Durable Object：每个文档一个实例，持有权威文档
  状态、操作日志、修订快照，处理 OT 变换、presence 广播与持久化（分块写入 DO storage）
- `src/ot.js` — 纯文本 OT 算法（insert/delete 变换、diff、组合），服务端与客户端共用同一套规则
- `src/static.js` — 编辑器前端（CSS + 无依赖 vanilla JS 客户端，内置 OT 客户端状态机）
- `src/pages.js` — 首页/编辑器 HTML 模板

协作协议：客户端把本地编辑 diff 成 insert/delete 操作并携带 `baseRev` 发送；
服务端将操作对 `baseRev` 之后的已应用操作做 OT 变换后落盘并广播。客户端对
未确认的 pending 操作做同样的变换，保证所有副本最终一致。

## REST API

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | `/docs/api/v1/documents` | 创建文档 `{title?, content?}` |
| GET | `/docs/api/v1/documents/:id` | 文档元信息 |
| PATCH | `/docs/api/v1/documents/:id` | 更新标题 |
| GET | `/docs/api/v1/documents/:id/content` | 正文，`?rev=N` 取历史版本 |
| GET | `/docs/api/v1/documents/:id/revisions` | 修订版本列表 |
| GET | `/docs/api/v1/documents/:id/collaborators` | 当前在线协作者 |
| GET | `/docs/api/v1/documents/:id/export` | 导出 `?format=markdown\|txt` |
| WS | `/docs/d/:id/ws` | 实时协作通道 |

## 部署

共享入口 Worker（`workers.v-163.top` 仓库）通过 Service Binding `DOCS_SERVICE`
把 `/docs/*` 转发到本 Worker，转发时剥离 `/docs` 前缀并设置
`x-forwarded-prefix` 头。

需要仓库 secret `CLOUDFLARE_API_TOKEN`（仅 Workers Scripts Write）与仓库变量
`CLOUDFLARE_ACCOUNT_ID`。推送 `main` 触发 GitHub Actions 部署，或本地运行：

```bash
npm ci
npm test        # node --test + wrangler deploy --dry-run
scripts/deploy.sh
```

## 限制

- 单文档最大 50,000 字符（DO storage 单值 128 KiB 约束）
- 操作日志超过 2,000 条后压缩为快照，更早的历史版本不再可取（API 返回 410）
