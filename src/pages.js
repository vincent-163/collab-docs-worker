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
  <p>无需注册、无需登录。创建文档、分享链接，即刻开始多人实时协同编辑。支持富文本格式、图片、表格、代码块、历史版本与开放 API。</p>
  <form class="create-card" method="POST" action="${prefix}/new">
    <input name="title" maxlength="200" placeholder="文档标题（可选）" autocomplete="off">
    <button class="btn" type="submit">免费创建文档</button>
  </form>
</section>
<section class="features">
  <div class="feature"><div class="icon">⚡</div><h3>实时协作</h3><p>基于 WebSocket 与操作转换（OT）算法，多人同时编辑不冲突，修改毫秒级同步到所有协作者。</p></div>
  <div class="feature"><div class="icon">🎨</div><h3>富文本格式</h3><p>标题、粗体、斜体、下划线、删除线、文字颜色与背景色、有序/无序列表、引用块，一应俱全。</p></div>
  <div class="feature"><div class="icon">🧩</div><h3>图片 / 表格 / 代码块</h3><p>支持插入链接图片、可编辑表格与语法等宽代码块，满足技术文档与日常记录需求。</p></div>
  <div class="feature"><div class="icon">👥</div><h3>协作 presence</h3><p>自动为每位协作者分配昵称与颜色，实时展示在线成员列表与编辑动态。</p></div>
  <div class="feature"><div class="icon">🕘</div><h3>历史版本</h3><p>每一次修改都记录为修订版本，可随时查看任意历史版本内容并一键恢复。</p></div>
  <div class="feature"><div class="icon">🔗</div><h3>匿名分享</h3><p>无需账号，链接即权限。复制链接发给伙伴即可共同编辑，支持 Markdown / TXT 导出。</p></div>
</section>
<section class="api-docs" id="api">
  <h2>开放 API</h2>
  <table>
    <tr><th>方法</th><th>路径</th><th>说明</th></tr>
    <tr><td>POST</td><td><code>${prefix}/api/v1/documents</code></td><td>创建文档（JSON: <code>{title, content}</code> 或 <code>{title, delta:{ops}}</code>）</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id</code></td><td>获取文档元信息</td></tr>
    <tr><td>PATCH</td><td><code>${prefix}/api/v1/documents/:id</code></td><td>更新文档标题</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/content</code></td><td>正文（Quill Delta + 纯文本），支持 <code>?rev=N</code> 历史版本</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/revisions</code></td><td>修订版本列表</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/collaborators</code></td><td>当前在线协作者</td></tr>
    <tr><td>GET</td><td><code>${prefix}/api/v1/documents/:id/export</code></td><td>导出 <code>?format=markdown|txt</code></td></tr>
    <tr><td>WS</td><td><code>${prefix}/d/:id/ws</code></td><td>实时协作通道（Delta 操作同步）</td></tr>
  </table>
</section>
<footer class="footer">Powered by Cloudflare Workers · Durable Objects · Quill</footer>
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
<link rel="stylesheet" href="${prefix}/static/vendor/quill.core.css">
<link rel="stylesheet" href="${prefix}/static/vendor/quill.snow.css">
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
<div id="toolbar" class="doc-toolbar">
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
    <button class="ql-image" title="图片（链接）"></button>
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
<script src="${prefix}/static/vendor/quill.js"></script>
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
