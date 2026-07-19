function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

export function homePage(prefix) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>协作文档 · 实时多人协作</title>
<link rel="stylesheet" href="${prefix}/static/style.css">
</head>
<body class="home">
<nav class="home-nav">
  <div class="logo">📝 协作<span>文档</span></div>
  <a class="btn secondary small" href="#api">开放 API</a>
</nav>
<section class="hero">
  <h1>多人实时协作的<br><em>在线文档</em></h1>
  <p>无需注册、无需登录。创建文档、分享链接，即刻开始多人实时协同编辑。支持在线状态、历史版本与开放 API。</p>
  <form class="create-card" method="POST" action="${prefix}/new">
    <input name="title" maxlength="200" placeholder="文档标题（可选）" autocomplete="off">
    <button class="btn" type="submit">免费创建文档</button>
  </form>
</section>
<section class="features">
  <div class="feature"><div class="icon">⚡</div><h3>实时协作</h3><p>基于 WebSocket 与操作转换（OT）算法，多人同时编辑不冲突，修改毫秒级同步到所有协作者。</p></div>
  <div class="feature"><div class="icon">👥</div><h3>协作 presence</h3><p>自动为每位协作者分配昵称与颜色，实时展示在线成员列表与编辑动态。</p></div>
  <div class="feature"><div class="icon">🕘</div><h3>历史版本</h3><p>每一次修改都记录为修订版本，可随时查看任意历史版本内容并一键恢复。</p></div>
  <div class="feature"><div class="icon">🔗</div><h3>匿名分享</h3><p>无需账号，链接即权限。复制链接发给伙伴即可共同编辑，也支持 Markdown 导出。</p></div>
</section>
<section class="api-docs" id="api">
  <h2>开放 API</h2>
  <table>
    <tr><th>方法</th><th>路径</th><th>说明</th></tr>
    <tr><td>POST</td><td><code>${prefix}/api/v1/documents</code></td><td>创建文档（JSON: <code>{title, content}</code>）</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id</code></td><td>获取文档元信息</td></tr>
    <tr><td>PATCH</td><td><code>${prefix}/api/v1/documents/:id</code></td><td>更新文档标题</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/content</code></td><td>获取正文，支持 <code>?rev=N</code> 历史版本</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/revisions</code></td><td>修订版本列表</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/collaborators</code></td><td>当前在线协作者</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/export</code></td><td>导出 <code>?format=markdown|txt</code></td></tr>
    <tr><td>WS</td><td><code>${prefix}/d/:id/ws</code></td><td>实时协作通道（OT 操作同步）</td></tr>
  </table>
</section>
<footer class="footer">Powered by Cloudflare Workers · Durable Objects</footer>
</body>
</html>`;
}

export function editorPage(prefix, docId, title, wsUrl) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title || "未命名文档")} · 协作文档</title>
<link rel="stylesheet" href="${prefix}/static/style.css">
</head>
<body class="editor-body">
<header class="topbar">
  <a class="logo" href="${prefix}/">📝 协作<span>文档</span></a>
  <input id="title-input" class="title-input" maxlength="200" value="${escapeHtml(title)}" placeholder="未命名文档">
  <div id="status" class="status offline"><i class="dot"></i><span>连接中…</span></div>
  <div class="spacer"></div>
  <div id="collabs" class="collabs"></div>
  <button id="btn-history" class="btn secondary small">历史版本</button>
  <button id="btn-export" class="btn secondary small">导出</button>
  <button id="btn-share" class="btn small">分享链接</button>
</header>
<main class="doc-wrap">
  <div class="doc-page"><textarea id="editor" readonly placeholder="正在加载文档…" spellcheck="false"></textarea></div>
  <div class="metabar">
    <span id="char-count">字符 0</span>
    <span id="rev-label">修订版本 0</span>
    <span>文档 ID：${escapeHtml(docId)}</span>
  </div>
</main>
<div id="history-modal" class="modal-mask">
  <div class="modal">
    <header>历史版本<button id="btn-close-history">×</button></header>
    <div id="rev-list" class="rev-list"></div>
    <div id="rev-view" class="rev-view">
      <pre id="rev-content"></pre>
      <div class="rev-actions">
        <button id="btn-restore" class="btn small">恢复到此版本</button>
      </div>
    </div>
  </div>
</div>
<div id="toast" class="toast"></div>
<script>window.COLLAB_CFG = ${JSON.stringify({ prefix, docId, wsUrl })};</script>
<script src="${prefix}/static/client.js"></script>
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
<link rel="stylesheet" href="${prefix}/static/style.css">
</head>
<body class="home">
<section class="hero">
  <h1>😕 文档不存在</h1>
  <p>链接可能已失效，或者文档 ID 有误。</p>
  <a class="btn" href="${prefix}/">返回首页创建新文档</a>
</section>
</body>
</html>`;
}
