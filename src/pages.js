function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

const SKILL_URL = "https://github.com/vincent-163/collab-docs-worker/tree/main/skill";

export function landingPage(prefix) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>协作文档 · 实时多人协作</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=3">
</head>
<body class="home">
<nav class="home-nav">
  <div class="logo">📝 协作<span>文档</span></div>
  <div>
    <a class="btn secondary small" href="${prefix}/login">登录</a>
    <a class="btn small" href="${prefix}/register">免费注册</a>
  </div>
</nav>
<section class="hero">
  <h1>多人实时协作的<br><em>在线文档</em></h1>
  <p>注册即送 $5 额度。富文本编辑、知识库目录、实时协同、分享链接、图片托管与开放 API，一站式搞定。</p>
  <div class="create-card">
    <a class="btn" style="flex:1" href="${prefix}/register">立即开始</a>
    <a class="btn secondary" href="${prefix}/login">已有账号登录</a>
  </div>
</section>
<section class="features">
  <div class="feature"><div class="icon">⚡</div><h3>实时协作</h3><p>基于 WebSocket 与操作转换（OT）算法，多人同时编辑不冲突，修改毫秒级同步到所有协作者。</p></div>
  <div class="feature"><div class="icon">🎨</div><h3>富文本格式</h3><p>标题、粗体、斜体、颜色、列表、引用、代码块、链接图片与可编辑表格。</p></div>
  <div class="feature"><div class="icon">📚</div><h3>知识库</h3><p>以目录树组织你的所有文档；在文档中写入文档链接，自动展示目标文档标题。</p></div>
  <div class="feature"><div class="icon">🔗</div><h3>分享链接</h3><p>为文档生成只读或可编辑的分享链接，支持有效期设置与链接管理。</p></div>
  <div class="feature"><div class="icon">🖼️</div><h3>图片托管</h3><p>图片上传到 R2，$0.015/GB/月，注册送 $5。超额自动清理，用量透明。</p></div>
  <div class="feature"><div class="icon">🤖</div><h3>Agent Skill</h3><p>登录后生成 API Key，配合 <a href="${SKILL_URL}">skill</a> 让 AI Agent 直接读写你的文档。</p></div>
</section>
<section class="api-docs" id="api">
  <h2>开放 API</h2>
  <table>
    <tr><th>方法</th><th>路径</th><th>说明</th></tr>
    <tr><td>POST</td><td><code>${prefix}/api/v1/documents</code></td><td>创建文档 <code>{title, content}</code> 或 <code>{title, delta:{ops}}</code></td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents</code></td><td>列出我的文档</td></tr>
    <tr><td>GET/PATCH</td><td><code>${prefix}/api/v1/documents/:id</code></td><td>文档元信息 / 更新标题</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/content</code></td><td>正文（Delta + 纯文本），<code>?rev=N</code> 历史版本</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/revisions</code></td><td>修订版本列表</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/export</code></td><td>导出 <code>?format=markdown|txt</code></td></tr>
  </table>
  <p style="margin-top:12px;color:var(--muted);font-size:13px">API 需携带 <code>Authorization: Bearer &lt;API Key&gt;</code>（登录后在「我的」页面生成）。Agent 使用方法见 <a href="${SKILL_URL}">skill/SKILL.md</a>（<a href="${prefix}/skill.md">在线阅读</a>）。</p>
</section>
<footer class="footer">Powered by Cloudflare Workers · Durable Objects · R2 · Quill · <a href="https://github.com/vincent-163/collab-docs-worker">开源仓库</a></footer>
</body>
</html>`;
}

export function authPage(prefix, mode, error = "") {
  const isLogin = mode === "login";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${isLogin ? "登录" : "注册"} · 协作文档</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=3">
</head>
<body class="home">
<nav class="home-nav">
  <a class="logo" href="${prefix}/">📝 协作<span>文档</span></a>
</nav>
<section class="hero" style="padding-top:6vh">
  <form class="auth-card" method="POST" action="${prefix}/${mode}">
    <h2>${isLogin ? "登录" : "注册"}</h2>
    ${error ? `<div class="auth-error">${escapeHtml(error)}</div>` : ""}
    <input name="email" type="email" required placeholder="邮箱" autocomplete="email">
    <input name="password" type="password" required minlength="8" placeholder="密码（至少 8 位）" autocomplete="${isLogin ? "current-password" : "new-password"}">
    <button class="btn" type="submit">${isLogin ? "登录" : "注册并领取 $5 额度"}</button>
    <p class="auth-switch">${isLogin ? `还没有账号？<a href="${prefix}/register">免费注册</a>` : `已有账号？<a href="${prefix}/login">直接登录</a>`}</p>
  </form>
</section>
</body>
</html>`;
}

export function dashboardPage(prefix, email) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>知识库 · 协作文档</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=4">
</head>
<body class="dash-body">
<header class="topbar">
  <a class="logo" href="${prefix}/">📝 协作<span>文档</span></a>
  <span style="color:var(--muted);font-size:14px">知识库</span>
  <div class="spacer"></div>
  <span id="balance-badge" class="balance-badge">…</span>
  <span class="dash-email">${escapeHtml(email)}</span>
  <form method="POST" action="${prefix}/logout" style="display:inline"><button class="btn secondary small" type="submit">退出</button></form>
</header>
<div class="dash-layout">
  <aside class="dash-side">
    <div class="dash-side-actions">
      <button id="btn-new-doc" class="btn small">＋ 新建文档</button>
      <button id="btn-new-sheet" class="btn small" title="新建表格">📊＋</button>
      <button id="btn-new-folder" class="btn secondary small" title="新建文件夹">📁＋</button>
    </div>
    <div id="tree" class="tree"><div class="tree-loading">加载中…</div></div>
  </aside>
  <main class="dash-main">
    <section class="panel">
      <h3>📊 账户与用量</h3>
      <div id="usage" class="usage-grid">加载中…</div>
    </section>
    <section class="panel">
      <h3>💬 聊天室</h3>
      <div id="chats">加载中…</div>
      <div class="apikey-create">
        <button id="btn-new-chat" class="btn secondary small">新建聊天室</button>
      </div>
    </section>
    <section class="panel">
      <h3>🎥 会议</h3>
      <div id="meets">加载中…</div>
      <div class="apikey-create">
        <button id="btn-new-meet" class="btn secondary small">新建会议</button>
      </div>
    </section>
    <section class="panel">
      <h3>🔑 API Keys <a class="panel-link" href="${SKILL_URL}" target="_blank" rel="noopener">Agent skill 使用指南</a></h3>
      <div id="apikeys">加载中…</div>
      <div class="apikey-create">
        <input id="apikey-name" placeholder="Key 名称（如：kimi-cli）" maxlength="60">
        <button id="btn-new-apikey" class="btn secondary small">生成 Key</button>
      </div>
      <div id="apikey-result" class="apikey-result" style="display:none"></div>
    </section>
  </main>
</div>
<div id="toast" class="toast"></div>
<script>window.DASH_CFG = ${JSON.stringify({ prefix })};</script>
<script src="${prefix}/static/dashboard.js?v=4"></script>
</body>
</html>`;
}

export function editorPage(prefix, docId, title, wsUrl, opts = {}) {
  const { readOnly = false, isOwner = false, shareToken = null } = opts;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title || "未命名文档")} · 协作文档</title>
<link rel="stylesheet" href="${prefix}/static/vendor/quill.core.css?v=3">
<link rel="stylesheet" href="${prefix}/static/vendor/quill.snow.css?v=3">
<link rel="stylesheet" href="${prefix}/static/style.css?v=3">
</head>
<body class="editor-body">
<header class="topbar">
  <a class="logo" href="${prefix}/">📝 协作<span>文档</span></a>
  <input id="title-input" class="title-input" maxlength="200" value="${escapeHtml(title)}" placeholder="未命名文档"${readOnly ? " readonly" : ""}>
  ${readOnly ? '<span class="ro-badge">只读</span>' : ""}
  <div id="status" class="status offline"><i class="dot"></i><span>连接中…</span></div>
  <div class="spacer"></div>
  <div id="collabs" class="collabs"></div>
  <button id="btn-history" class="btn secondary small">历史版本</button>
  <button id="btn-export" class="btn secondary small">导出</button>
  ${isOwner ? '<button id="btn-share" class="btn small">分享</button>' : ""}
</header>
<div id="toolbar" class="doc-toolbar"${readOnly ? ' style="display:none"' : ""}>
  <span class="ql-formats">
    <select class="ql-header">
      <option value="1">标题 1</option>
      <option value="2">标题 2</option>
      <option value="3">标题 3</option>
      <option selected>正文</option>
    </select>
  </span>
  <span class="ql-formats">
    <button class="ql-bold" title="粗体"></button>
    <button class="ql-italic" title="斜体"></button>
    <button class="ql-underline" title="下划线"></button>
    <button class="ql-strike" title="删除线"></button>
    <button class="ql-code" title="行内代码"></button>
  </span>
  <span class="ql-formats">
    <select class="ql-color" title="文字颜色"></select>
    <select class="ql-background" title="背景颜色"></select>
  </span>
  <span class="ql-formats">
    <button class="ql-list" value="ordered" title="有序列表"></button>
    <button class="ql-list" value="bullet" title="无序列表"></button>
    <button class="ql-blockquote" title="引用"></button>
    <button class="ql-code-block" title="代码块"></button>
  </span>
  <span class="ql-formats">
    <button class="ql-link" title="链接"></button>
    <button class="ql-image" title="图片"></button>
    <button class="ql-table-custom" id="btn-table" title="插入表格">⊞</button>
    <button class="ql-clean" title="清除格式"></button>
  </span>
</div>
<main class="doc-wrap">
  <div class="doc-page"><div id="editor"></div></div>
  <div class="metabar">
    <span id="char-count">字符 0</span>
    <span id="rev-label">修订版本 0</span>
    <span>文档 ID：${escapeHtml(docId)}</span>
    <a href="${prefix}/app" style="margin-left:auto">← 返回知识库</a>
  </div>
</main>
<div id="history-modal" class="modal-mask">
  <div class="modal">
    <header>历史版本<button id="btn-close-history">×</button></header>
    <div id="rev-list" class="rev-list"></div>
    <div id="rev-view" class="rev-view">
      <pre id="rev-content"></pre>
      <div class="rev-actions">
        <button id="btn-restore" class="btn small"${readOnly ? " disabled" : ""}>恢复到此版本</button>
      </div>
    </div>
  </div>
</div>
${isOwner ? `<div id="share-modal" class="modal-mask">
  <div class="modal">
    <header>分享文档<button id="btn-close-share">×</button></header>
    <div class="share-create">
      <select id="share-mode">
        <option value="ro">只读</option>
        <option value="rw">可编辑</option>
      </select>
      <select id="share-expires">
        <option value="">永久有效</option>
        <option value="day">1 天</option>
        <option value="week">7 天</option>
        <option value="month">30 天</option>
      </select>
      <button id="btn-create-share" class="btn small">生成链接</button>
    </div>
    <div id="share-list" class="share-list"><div class="rev-item">加载中…</div></div>
  </div>
</div>` : ""}
<div id="toast" class="toast"></div>
<script>window.COLLAB_CFG = ${JSON.stringify({ prefix, docId, wsUrl, readOnly, isOwner })};</script>
<script src="${prefix}/static/vendor/quill.js?v=3"></script>
<script src="${prefix}/static/client.js?v=3"></script>
</body>
</html>`;
}

export function notFoundPage(prefix) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>文档不存在 · 协作文档</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=3">
</head>
<body class="home">
<section class="hero">
  <h1>😕 文档不存在</h1>
  <p>链接可能已失效，或者文档 ID 有误。</p>
  <a class="btn" href="${prefix}/app">返回知识库</a>
</section>
</body>
</html>`;
}

export function shareErrorPage(prefix, heading, detail) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(heading)} · 协作文档</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=3">
</head>
<body class="home">
<section class="hero">
  <h1>🔒 ${escapeHtml(heading)}</h1>
  <p>${escapeHtml(detail)}</p>
  <a class="btn" href="${prefix}/app">返回知识库</a>
</section>
</body>
</html>`;
}

export function chatPage(prefix, chatId, name, wsUrl) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(name || "聊天室")} · 聊天</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=4">
</head>
<body class="chat-body">
<header class="topbar">
  <a class="logo" href="${prefix}/">📝 协作<span>文档</span></a>
  <span class="room-name">💬 ${escapeHtml(name || "聊天室")}</span>
  <div id="status" class="status offline"><i class="dot"></i><span>连接中…</span></div>
  <div class="spacer"></div>
  <div id="collabs" class="collabs"></div>
  <a class="btn secondary small" href="${prefix}/app">返回知识库</a>
</header>
<div id="ws-warning" class="compat-warning" style="display:none">当前浏览器不支持 WebSocket，无法使用实时聊天，请更换现代浏览器。</div>
<main class="chat-main">
  <div id="chat-list" class="chat-list"></div>
  <div class="chat-inputbar">
    <button id="btn-attach" class="btn secondary small" title="发送图片或文件（≤25MB，保存 7 天，按大小一次性扣费）">📎</button>
    <input id="chat-input" maxlength="4000" placeholder="输入消息，回车发送" autocomplete="off">
    <button id="btn-send" class="btn small">发送</button>
  </div>
  <div class="chat-hint">附件保存 7 天后自动删除；非图片文件不支持在线预览，请下载后查看。房间 ID：${escapeHtml(chatId)}</div>
</main>
<div id="toast" class="toast"></div>
<script>window.CHAT_CFG = ${JSON.stringify({ prefix, chatId, wsUrl })};</script>
<script src="${prefix}/static/chat.js?v=4"></script>
</body>
</html>`;
}

export function sheetPage(prefix, sheetId, title, wsUrl) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title || "未命名表格")} · 在线表格</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=4">
</head>
<body class="sheet-body">
<header class="topbar">
  <a class="logo" href="${prefix}/">📝 协作<span>文档</span></a>
  <input id="title-input" class="title-input" maxlength="200" value="${escapeHtml(title)}" placeholder="未命名表格">
  <div id="status" class="status offline"><i class="dot"></i><span>连接中…</span></div>
  <div class="spacer"></div>
  <div id="collabs" class="collabs"></div>
  <a class="btn secondary small" href="${prefix}/app">返回知识库</a>
</header>
<div class="sheet-formulabar">
  <span id="fx-ref" class="fx-ref">A1</span>
  <input id="fx-input" placeholder="值或公式（以 = 开头，支持 SUM/AVERAGE/MIN/MAX/COUNT 与 + - * /）" autocomplete="off" spellcheck="false">
</div>
<main class="sheet-main">
  <div id="sheet-grid" class="sheet-grid"></div>
</main>
<div class="metabar sheet-metabar">
  <span id="rev-label">修订版本 0</span>
  <span>表格 ID：${escapeHtml(sheetId)}</span>
  <span>持有链接的登录用户均可编辑</span>
</div>
<div id="toast" class="toast"></div>
<script>window.SHEET_CFG = ${JSON.stringify({ prefix, sheetId, wsUrl })};</script>
<script type="module">
  import { evaluateFormula, colName, parseCellRef } from "${prefix}/static/formula.js";
  window.FORMULA = { evaluateFormula, colName, parseCellRef };
</script>
<script src="${prefix}/static/sheet.js?v=4"></script>
</body>
</html>`;
}

export function meetPage(prefix, meetId, name, wsUrl, sfuEnabled = false, isOwner = false) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(name || "会议")} · 在线会议</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=5">
</head>
<body class="meet-body">
<header class="topbar">
  <a class="logo" href="${prefix}/">📝 协作<span>文档</span></a>
  <span class="room-name">🎥 ${escapeHtml(name || "会议")}</span>
  <div id="status" class="status offline"><i class="dot"></i><span>连接中…</span></div>
  <div class="spacer"></div>
  <div id="collabs" class="collabs"></div>
  <a class="btn secondary small" href="${prefix}/app">返回知识库</a>
</header>
<div id="media-warning" class="compat-warning" style="display:none"></div>
<div class="meet-layout">
  <main class="meet-stage">
    <div id="videos" class="videos"></div>
    <div class="meet-controls">
      <button id="btn-audio" class="btn secondary small">🎙 开启麦克风</button>
      <button id="btn-video" class="btn secondary small">📷 开启摄像头</button>
      <button id="btn-screen" class="btn secondary small">🖥 分享屏幕</button>
      ${isOwner ? '<button id="btn-end" class="btn danger small">结束会议</button>' : ""}
    </div>
  </main>
  <aside class="meet-chat">
    <div id="chat-list" class="chat-list"></div>
    <div class="chat-inputbar">
      <input id="chat-input" maxlength="4000" placeholder="发送消息…" autocomplete="off">
      <button id="btn-send" class="btn small">发送</button>
    </div>
  </aside>
</div>
<div class="chat-hint meet-hint">${sfuEnabled ? "摄像头、麦克风和屏幕共享只经 Cloudflare Realtime SFU 中转，不建立参会者点对点连接；会议 ID：" : "未配置 Cloudflare Realtime SFU，音视频与屏幕共享不可用；会议 ID："}${escapeHtml(meetId)}</div>
<div id="meet-ended-overlay" class="meet-ended-overlay">
  <div class="meet-ended-card">
    <h2>🎥 会议已结束</h2>
    <p id="meet-ended-detail">主持人已结束本次会议，感谢参与。</p>
    <a class="btn" href="${prefix}/app">返回知识库</a>
  </div>
</div>
<div id="toast" class="toast"></div>
<script>window.MEET_CFG = ${JSON.stringify({ prefix, meetId, wsUrl, sfu: !!sfuEnabled, isOwner: !!isOwner })};</script>
<script src="${prefix}/static/meet.js?v=8"></script>
</body>
</html>`;
}

export function meetEndedPage(prefix, name, endedAt) {
  const ended = endedAt
    ? new Date(endedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })
    : "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>会议已结束 · 在线会议</title>
<link rel="stylesheet" href="${prefix}/static/style.css?v=5">
</head>
<body class="home">
<section class="hero">
  <h1>🎥 会议已结束</h1>
  <p>「${escapeHtml(name || "会议")}」已由主持人结束。${ended ? `<br>结束时间：${escapeHtml(ended)}` : ""}</p>
  <a class="btn" href="${prefix}/app">返回知识库</a>
</section>
</body>
</html>`;
}
