// Static assets served by the worker. Kept as template literals so the worker
// needs no bundler rules. Client code must avoid backticks and "${" sequences.

export const STYLE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --primary: #4f7cff;
  --primary-dark: #3b63d8;
  --bg: #f4f6fb;
  --card: #ffffff;
  --text: #1f2733;
  --muted: #6b7686;
  --border: #e3e8f0;
}
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; color: var(--text); }
a { color: var(--primary); text-decoration: none; }

/* ---------- landing/auth ---------- */
.home { min-height: 100vh; background: linear-gradient(160deg, #eef3ff 0%, #f8faff 45%, #fdf3ee 100%); }
.home-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 6vw; }
.home-nav .btn { margin-left: 8px; }
.logo { font-size: 20px; font-weight: 700; letter-spacing: .5px; color: var(--text); }
.logo span { color: var(--primary); }
.hero { text-align: center; padding: 9vh 20px 60px; }
.hero h1 { font-size: clamp(30px, 5vw, 52px); line-height: 1.25; margin-bottom: 16px; }
.hero h1 em { font-style: normal; color: var(--primary); }
.hero p { color: var(--muted); font-size: 17px; max-width: 620px; margin: 0 auto 36px; line-height: 1.7; }
.create-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 12px 40px rgba(60, 90, 180, .10); padding: 14px; display: flex; gap: 10px; max-width: 560px; margin: 0 auto; }
.btn { border: none; border-radius: 10px; background: var(--primary); color: #fff; font-size: 15px; font-weight: 600; padding: 12px 22px; cursor: pointer; transition: background .15s; white-space: nowrap; display: inline-block; text-align: center; }
.btn:hover { background: var(--primary-dark); }
.btn.secondary { background: #eef2fb; color: var(--text); border: 1px solid var(--border); }
.btn.secondary:hover { background: #e2e9f8; }
.btn.small { padding: 7px 13px; font-size: 13px; }
.btn.danger { background: #e74c3c; }
.btn.danger:hover { background: #c0392b; }
.btn[disabled] { opacity: .5; cursor: not-allowed; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; max-width: 980px; margin: 0 auto; padding: 30px 6vw 50px; }
.feature { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
.feature .icon { font-size: 26px; margin-bottom: 10px; }
.feature h3 { font-size: 16px; margin-bottom: 8px; }
.feature p { color: var(--muted); font-size: 13.5px; line-height: 1.65; }
.api-docs { max-width: 980px; margin: 0 auto; padding: 0 6vw 70px; }
.api-docs h2 { font-size: 22px; margin-bottom: 14px; }
.api-docs table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; font-size: 13.5px; }
.api-docs th, .api-docs td { text-align: left; padding: 11px 14px; border-bottom: 1px solid var(--border); }
.api-docs th { background: #f7f9fd; color: var(--muted); font-weight: 600; }
.api-docs tr:last-child td { border-bottom: none; }
.api-docs code { background: #eef2fb; padding: 2px 6px; border-radius: 5px; font-size: 12.5px; }
.footer { text-align: center; color: var(--muted); font-size: 13px; padding: 24px; }
.auth-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 12px 40px rgba(60, 90, 180, .10); padding: 30px; max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; text-align: left; }
.auth-card h2 { text-align: center; margin-bottom: 6px; }
.auth-card input { border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; font-size: 15px; outline: none; }
.auth-card input:focus { border-color: var(--primary); }
.auth-error { background: #fdecea; color: #c0392b; border-radius: 8px; padding: 10px 12px; font-size: 13.5px; }
.auth-switch { text-align: center; color: var(--muted); font-size: 13.5px; }

/* ---------- dashboard ---------- */
.dash-body { background: var(--bg); min-height: 100vh; }
.dash-layout { display: flex; min-height: calc(100vh - 53px); }
.dash-side { width: 300px; background: var(--card); border-right: 1px solid var(--border); padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.dash-side-actions { display: flex; gap: 8px; }
.dash-main { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 18px; max-width: 860px; }
.panel { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; }
.panel h3 { font-size: 15px; margin-bottom: 12px; }
.panel-link { font-size: 12.5px; font-weight: 400; margin-left: 8px; }
.dash-email { color: var(--muted); font-size: 13px; }
.balance-badge { background: #e8f7ee; color: #1e9e57; border-radius: 999px; padding: 4px 12px; font-size: 12.5px; font-weight: 600; }
.tree { flex: 1; overflow-y: auto; font-size: 14px; }
.tree-loading { color: var(--muted); padding: 8px; }
.tree-row { display: flex; align-items: center; gap: 6px; padding: 5px 6px; border-radius: 8px; }
.tree-row:hover { background: #f2f5fc; }
.tree-row .tree-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.tree-row .tree-name:hover { color: var(--primary); }
.tree-row .tree-actions { display: none; gap: 4px; }
.tree-row:hover .tree-actions { display: flex; }
.tree-icon { width: 18px; text-align: center; flex-shrink: 0; }
.tree-btn { border: none; background: none; cursor: pointer; font-size: 12px; color: var(--muted); padding: 2px 4px; border-radius: 5px; }
.tree-btn:hover { background: #e2e9f8; color: var(--text); }
.tree-select { font-size: 12px; max-width: 90px; border: 1px solid var(--border); border-radius: 6px; color: var(--muted); }
.usage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.usage-item { background: #f7f9fd; border-radius: 10px; padding: 12px 14px; }
.usage-item .usage-value { font-size: 19px; font-weight: 700; }
.usage-item .usage-label { color: var(--muted); font-size: 12px; margin-top: 3px; }
.apikey-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13.5px; }
.apikey-row:last-of-type { border-bottom: none; }
.apikey-row code { background: #eef2fb; padding: 2px 8px; border-radius: 5px; font-size: 12px; }
.apikey-create { display: flex; gap: 8px; margin-top: 12px; }
.apikey-create input { flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13.5px; outline: none; }
.apikey-result { margin-top: 12px; background: #e8f7ee; border: 1px solid #b7e6c8; border-radius: 10px; padding: 12px 14px; font-size: 13px; word-break: break-all; }
.apikey-result code { font-weight: 700; }

/* ---------- editor ---------- */
.editor-body { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; gap: 14px; padding: 10px 18px; background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; flex-wrap: wrap; }
.topbar .logo { font-size: 17px; }
.title-input { border: 1px solid transparent; border-radius: 8px; font-size: 15px; font-weight: 600; padding: 7px 10px; width: 240px; outline: none; }
.title-input:hover { border-color: var(--border); }
.title-input:focus { border-color: var(--primary); }
.ro-badge { background: #fff4e0; color: #b9770e; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
.status { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; white-space: nowrap; }
.status .dot { width: 8px; height: 8px; border-radius: 50%; background: #2ecc71; }
.status.offline .dot { background: #e74c3c; }
.status.syncing .dot { background: #f1c40f; }
.topbar .spacer { flex: 1; }
.collabs { display: flex; align-items: center; }
.avatar { width: 28px; height: 28px; border-radius: 50%; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; margin-left: -8px; cursor: default; }
.avatar:first-child { margin-left: 0; }
.avatar.me { outline: 2px solid var(--primary); outline-offset: 1px; }
.doc-toolbar { position: sticky; top: 49px; z-index: 9; background: var(--card); border: none; border-bottom: 1px solid var(--border); display: flex; justify-content: center; flex-wrap: wrap; padding: 6px 12px; }
.doc-wrap { flex: 1; padding: 26px 16px 60px; }
.doc-page { background: var(--card); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 6px 24px rgba(40, 60, 120, .07); max-width: 860px; margin: 0 auto; min-height: 76vh; }
.doc-page .ql-container { border: none; font-size: 15.5px; font-family: inherit; }
.doc-page .ql-editor { padding: 40px 52px; min-height: 76vh; line-height: 1.85; }
.doc-page .ql-editor.ql-blank::before { color: #b6bfce; font-style: normal; }
.doc-page .ql-editor table { border-collapse: collapse; margin: 12px 0; }
.doc-page .ql-editor td, .doc-page .ql-editor th { border: 1px solid #ccd4e0; padding: 6px 12px; min-width: 60px; }
.doc-page .ql-editor blockquote { border-left: 3px solid var(--primary); padding-left: 14px; color: var(--muted); margin: 8px 0; }
.doc-page .ql-editor pre.ql-syntax { background: #f5f7fb; border: 1px solid var(--border); border-radius: 8px; color: #243447; }
.ql-toolbar .ql-table-custom { width: 28px; font-size: 15px; color: #444; }
.ql-toolbar .ql-table-custom:hover { color: var(--primary); }
.ql-toolbar.ql-snow .ql-formats { margin-right: 10px; }
.ql-snow .ql-picker.ql-header { width: 78px; }
.metabar { display: flex; align-items: center; gap: 16px; max-width: 860px; margin: 10px auto 0; color: var(--muted); font-size: 12.5px; padding: 0 4px; }
.toast { position: fixed; bottom: 26px; left: 50%; transform: translateX(-50%); background: #222b3a; color: #fff; padding: 10px 18px; border-radius: 9px; font-size: 13.5px; opacity: 0; transition: opacity .2s; pointer-events: none; z-index: 99; }
.toast.show { opacity: .95; }
.modal-mask { position: fixed; inset: 0; background: rgba(20, 28, 45, .45); display: none; align-items: center; justify-content: center; z-index: 50; }
.modal-mask.show { display: flex; }
.modal { background: #fff; border-radius: 14px; width: min(720px, 92vw); max-height: 82vh; display: flex; flex-direction: column; overflow: hidden; }
.modal header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid var(--border); font-weight: 700; }
.modal header button { border: none; background: none; font-size: 20px; cursor: pointer; color: var(--muted); }
.modal .rev-list { overflow-y: auto; padding: 8px 0; }
.rev-item { display: flex; align-items: center; gap: 12px; padding: 10px 20px; cursor: pointer; font-size: 13.5px; }
.rev-item:hover { background: #f5f8ff; }
.rev-item .rev-no { font-weight: 700; color: var(--primary); width: 52px; }
.rev-item .rev-author { width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rev-item .rev-summary { color: var(--muted); min-width: 90px; }
.rev-item .rev-time { color: var(--muted); margin-left: auto; white-space: nowrap; }
.modal .rev-view { display: none; flex-direction: column; min-height: 0; }
.modal .rev-view pre { overflow: auto; padding: 18px 20px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.modal .rev-view .rev-actions { display: flex; gap: 10px; padding: 12px 20px; border-top: 1px solid var(--border); }
.share-create { display: flex; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.share-create select { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13.5px; background: #fff; }
.share-list { overflow-y: auto; padding: 8px 0; }
.share-row { display: flex; align-items: center; gap: 10px; padding: 9px 20px; font-size: 13px; }
.share-row:hover { background: #f5f8ff; }
.share-row .share-url { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
.share-row .share-mode { font-weight: 700; }
.share-row .share-mode.ro { color: #b9770e; }
.share-row .share-mode.rw { color: #1e9e57; }
.share-row .share-exp { color: var(--muted); white-space: nowrap; }
.share-row .share-exp.expired { color: #c0392b; }
@media (max-width: 760px) {
  .dash-layout { flex-direction: column; }
  .dash-side { width: 100%; border-right: none; border-bottom: 1px solid var(--border); }
  .doc-page .ql-editor { padding: 22px 18px; }
  .title-input { width: 130px; }
  .create-card { flex-direction: column; }
  .doc-toolbar { top: 0; position: static; }
}
`;

export const CLIENT_JS = `
(function () {
  'use strict';
  var cfg = window.COLLAB_CFG;
  var prefix = cfg.prefix;
  var docId = cfg.docId;
  var readOnly = !!cfg.readOnly;
  var isOwner = !!cfg.isOwner;
  var Delta = Quill.import('delta');
  var DOC_LINK_RE = /\\/d\\/([A-Za-z0-9]{6,24})(?:[/?#]|$)/;

  /* ---------------- editor setup ---------------- */
  function insertImageUrl(url) {
    var range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'image', url, 'user');
    quill.setSelection(range.index + 1, 0, 'silent');
  }
  function uploadImage(file) {
    var form = new FormData();
    form.append('file', file);
    setStatus('syncing', '上传图片中…');
    fetch(prefix + '/api/v1/images', { method: 'POST', body: form })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        setStatus('online', '已连接 · 实时同步');
        if (!res.ok) { toast(res.d.message || '图片上传失败'); return; }
        insertImageUrl(res.d.url);
      })
      .catch(function () { setStatus('online', '已连接 · 实时同步'); toast('图片上传失败'); });
  }
  function imageHandler() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.onchange = function () {
      if (input.files && input.files[0]) uploadImage(input.files[0]);
      else {
        var url = window.prompt('图片链接 URL');
        if (url) insertImageUrl(url);
      }
    };
    input.click();
    // user cancelled the picker: offer URL entry on next tick if no file chosen
    setTimeout(function () {
      if (!input.files || !input.files[0]) {
        // noop: most browsers keep focus events unreliable; URL entry also via prompt below
      }
    }, 0);
  }

  var quill = new Quill('#editor', {
    theme: 'snow',
    readOnly: true,
    placeholder: readOnly ? '只读文档' : '正在加载文档…',
    modules: {
      toolbar: readOnly ? false : {
        container: '#toolbar',
        handlers: {
          image: imageHandler,
          link: function (value) {
            var url = window.prompt('链接 URL', 'https://');
            if (!url) return;
            var range = quill.getSelection(true);
            var m = url.match(DOC_LINK_RE);
            if (m) {
              fetch(prefix + '/d/' + m[1] + '/title').then(function (r) { return r.json(); }).then(function (d) {
                var text = (range.length ? quill.getText(range.index, range.length) : '') || d.title || url;
                if (range.length) quill.deleteText(range.index, range.length, 'user');
                quill.insertText(range.index, text, { link: url }, 'user');
              });
            } else {
              if (range.length) quill.formatText(range.index, range.length, 'link', url, 'user');
              else quill.insertText(range.index, url, { link: url }, 'user');
            }
          },
          'table-custom': function () {
            var input = window.prompt('表格大小（行 x 列）', '3 x 3');
            if (!input) return;
            var m = input.match(/(\\d+)\\s*[xX×]\\s*(\\d+)/);
            var rows = m ? Math.min(parseInt(m[1], 10), 20) : 3;
            var cols = m ? Math.min(parseInt(m[2], 10), 10) : 3;
            var table = quill.getModule('table');
            if (table && table.insertTable) table.insertTable(rows, cols);
            else toast('表格组件不可用');
          }
        }
      },
      table: true,
      history: false,
      clipboard: true
    }
  });

  /* ---------------- state ---------------- */
  var titleInput = document.getElementById('title-input');
  var statusEl = document.getElementById('status');
  var collabsEl = document.getElementById('collabs');
  var countEl = document.getElementById('char-count');
  var revEl = document.getElementById('rev-label');
  var ws = null;
  var myId = null;
  var rev = 0;
  var synced = false;
  var pending = null;          // { opId, delta: Delta }
  var buffer = new Delta();    // composed local ops while awaiting ack
  var opSeq = 0;
  var connected = false;
  var backoff = 1000;
  var clients = [];

  function setStatus(state, label) {
    statusEl.className = 'status' + (state === 'offline' ? ' offline' : state === 'syncing' ? ' syncing' : '');
    statusEl.querySelector('span').textContent = label;
  }
  function updateCount() {
    countEl.textContent = '字符 ' + Math.max(quill.getLength() - 1, 0);
  }
  function updateRev() {
    revEl.textContent = '修订版本 ' + rev;
  }
  function renderCollabs() {
    var html = '';
    for (var i = 0; i < clients.length; i++) {
      var c = clients[i];
      html += '<div class="avatar' + (c.id === myId ? ' me' : '') + '" style="background:' + c.color + '" title="' +
        c.name + (c.id === myId ? '（我）' : '') + '">' + c.name.slice(-2, -1) + '</div>';
    }
    collabsEl.innerHTML = html;
  }
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  /* ---------------- doc link auto titles ---------------- */
  var titleCache = {}; // url -> Promise<title>
  function fetchDocTitle(id) {
    if (!titleCache[id]) {
      titleCache[id] = fetch(prefix + '/d/' + id + '/title')
        .then(function (r) { return r.ok ? r.json() : { title: null }; })
        .then(function (d) { return d.title || null; })
        .catch(function () { return null; });
    }
    return titleCache[id];
  }
  // Replace link texts that differ from the target doc title.
  function refreshDocLinkTitles(source) {
    var contents = quill.getContents();
    var jobs = [];
    var index = 0;
    for (var i = 0; i < contents.ops.length; i++) {
      var op = contents.ops[i];
      var len = op.insert ? (typeof op.insert === 'string' ? op.insert.length : 1) : 0;
      if (typeof op.insert === 'string' && op.attributes && op.attributes.link) {
        var m = String(op.attributes.link).match(DOC_LINK_RE);
        if (m) jobs.push({ index: index, length: op.insert.length, text: op.insert, attrs: op.attributes, docKey: m[1] });
      }
      index += len;
    }
    if (!jobs.length) return;
    jobs.forEach(function (job) {
      fetchDocTitle(job.docKey).then(function (title) {
        if (!title || job.text === title) return;
        var delta = new Delta().retain(job.index).delete(job.length).insert(title, job.attrs);
        quill.updateContents(delta, source);
      });
    });
  }

  /* ---------------- networking ---------------- */
  function send(obj) {
    if (connected && ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }
  function transmit(delta) {
    pending = { opId: ++opSeq, delta: delta };
    send({ type: 'op', opId: pending.opId, baseRev: rev, delta: { ops: delta.ops } });
    setStatus('syncing', '同步中…');
  }

  function onInit(msg) {
    rev = msg.rev;
    myId = msg.you.id;
    clients = msg.clients;
    pending = null;
    buffer = new Delta();
    quill.setContents(new Delta(msg.delta.ops), 'api');
    quill.enable(!readOnly);
    synced = true;
    titleInput.value = msg.title;
    document.title = (msg.title || '未命名文档') + ' · 协作文档';
    renderCollabs();
    updateCount();
    updateRev();
    setStatus('online', readOnly ? '已连接 · 只读' : '已连接 · 实时同步');
    backoff = 1000;
    refreshDocLinkTitles('api');
  }

  function onRemoteOp(msg) {
    var R = new Delta(msg.delta.ops);
    var toApply = R;
    if (pending) {
      var newPending = R.transform(pending.delta, true);
      toApply = pending.delta.transform(R, false);
      pending.delta = newPending;
    }
    if (buffer.ops.length) {
      var newBuffer = toApply.transform(buffer, true);
      toApply = buffer.transform(toApply, false);
      buffer = newBuffer;
    }
    quill.updateContents(toApply, 'api');
    rev = msg.rev;
    updateCount();
    updateRev();
    if (!pending) setStatus('online', readOnly ? '已连接 · 只读' : '已连接 · 实时同步');
  }

  function onAck(msg) {
    rev = msg.rev;
    updateRev();
    pending = null;
    if (buffer.ops.length) {
      var b = buffer;
      buffer = new Delta();
      transmit(b);
    } else {
      setStatus('online', readOnly ? '已连接 · 只读' : '已连接 · 实时同步');
    }
  }

  function connect() {
    setStatus('offline', '连接中…');
    quill.enable(false);
    synced = false;
    ws = new WebSocket(cfg.wsUrl);
    ws.onopen = function () { connected = true; };
    ws.onmessage = function (event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (msg.type === 'init') onInit(msg);
      else if (msg.type === 'op') {
        if (msg.by && msg.by.id === myId && pending && msg.opId === pending.opId) onAck(msg);
        else onRemoteOp(msg);
      } else if (msg.type === 'title') {
        if (!msg.by || msg.by.id !== myId) {
          if (document.activeElement !== titleInput) titleInput.value = msg.title;
          document.title = (msg.title || '未命名文档') + ' · 协作文档';
        }
      } else if (msg.type === 'presence') {
        clients = msg.clients;
        renderCollabs();
      } else if (msg.type === 'cursor') {
        for (var i = 0; i < clients.length; i++) {
          if (clients[i].id === msg.id) { clients[i].start = msg.start; clients[i].end = msg.end; }
        }
      } else if (msg.type === 'error') {
        toast(msg.message || '同步出错，正在恢复');
        ws.close();
      }
    };
    ws.onclose = function () {
      connected = false;
      quill.enable(false);
      synced = false;
      setStatus('offline', '离线 · ' + Math.round(backoff / 1000) + 's 后重连');
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 10000);
    };
    ws.onerror = function () { ws.close(); };
  }

  /* ---------------- local editing ---------------- */
  var linkFixTimer = null;
  quill.on('text-change', function (delta, old, source) {
    if (source !== 'user') return;
    updateCount();
    clearTimeout(linkFixTimer);
    linkFixTimer = setTimeout(function () { refreshDocLinkTitles('user'); }, 800);
    if (!synced || !connected) return;
    if (pending) buffer = buffer.compose(delta);
    else transmit(delta);
  });

  var titleTimer = null;
  titleInput.addEventListener('input', function () {
    document.title = (titleInput.value || '未命名文档') + ' · 协作文档';
    clearTimeout(titleTimer);
    titleTimer = setTimeout(function () {
      send({ type: 'title', title: titleInput.value });
    }, 400);
  });

  var cursorTimer = null;
  quill.on('selection-change', function (range) {
    if (!range) return;
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(function () {
      send({ type: 'cursor', start: range.index, end: range.index + range.length });
    }, 200);
  });

  /* ---------------- toolbar actions ---------------- */
  var shareBtn = document.getElementById('btn-share');
  if (shareBtn) shareBtn.addEventListener('click', function () {
    document.getElementById('share-modal').classList.add('show');
    loadShares();
  });
  var closeShare = document.getElementById('btn-close-share');
  if (closeShare) closeShare.addEventListener('click', function () {
    document.getElementById('share-modal').classList.remove('show');
  });
  function loadShares() {
    var list = document.getElementById('share-list');
    list.innerHTML = '<div class="rev-item">加载中…</div>';
    fetch(prefix + '/d/' + docId + '/shares').then(function (r) { return r.json(); }).then(function (data) {
      if (!data.shares || !data.shares.length) {
        list.innerHTML = '<div class="rev-item">还没有分享链接，点击上方「生成链接」创建</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < data.shares.length; i++) {
        var s = data.shares[i];
        var exp = s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() + ' 到期' : '永久';
        html += '<div class="share-row" data-token="' + s.token + '">' +
          '<span class="share-mode ' + s.mode + '">' + (s.mode === 'rw' ? '可编辑' : '只读') + '</span>' +
          '<span class="share-url">' + s.url + '</span>' +
          '<span class="share-exp' + (s.expired ? ' expired' : '') + '">' + (s.expired ? '已过期' : exp) + '</span>' +
          '<button class="tree-btn share-copy" data-url="' + s.url + '">复制</button>' +
          '<button class="tree-btn share-del">删除</button></div>';
      }
      list.innerHTML = html;
    });
  }
  var shareList = document.getElementById('share-list');
  if (shareList) shareList.addEventListener('click', function (e) {
    var copyBtn = e.target.closest('.share-copy');
    if (copyBtn) {
      var url = copyBtn.dataset.url;
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('链接已复制'); });
      else window.prompt('复制链接：', url);
      return;
    }
    var delBtn = e.target.closest('.share-del');
    if (delBtn) {
      var row = delBtn.closest('.share-row');
      fetch(prefix + '/d/' + docId + '/shares/' + row.dataset.token, { method: 'DELETE' })
        .then(function () { loadShares(); toast('已删除'); });
    }
  });
  var createShare = document.getElementById('btn-create-share');
  if (createShare) createShare.addEventListener('click', function () {
    fetch(prefix + '/d/' + docId + '/shares', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: document.getElementById('share-mode').value,
        expiresIn: document.getElementById('share-expires').value || undefined
      })
    }).then(function (r) { return r.json(); }).then(function (s) {
      loadShares();
      if (navigator.clipboard) navigator.clipboard.writeText(s.url);
      toast('链接已生成并复制');
    });
  });

  document.getElementById('btn-export').addEventListener('click', function () {
    location.href = prefix + '/api/v1/documents/' + docId + '/export?format=markdown';
  });

  /* ---------------- history modal ---------------- */
  var mask = document.getElementById('history-modal');
  var revList = document.getElementById('rev-list');
  var revView = document.getElementById('rev-view');
  document.getElementById('btn-history').addEventListener('click', function () {
    mask.classList.add('show');
    revList.style.display = '';
    revView.style.display = 'none';
    revList.innerHTML = '<div class="rev-item">加载中…</div>';
    fetch(prefix + '/api/v1/documents/' + docId + '/revisions?limit=100')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.revisions || !data.revisions.length) {
          revList.innerHTML = '<div class="rev-item">暂无历史版本</div>';
          return;
        }
        var html = '';
        for (var i = 0; i < data.revisions.length; i++) {
          var r = data.revisions[i];
          var time = new Date(r.created_at).toLocaleString();
          html += '<div class="rev-item" data-rev="' + r.revision + '">' +
            '<span class="rev-no">v' + r.revision + '</span>' +
            '<span class="rev-author">' + (r.author ? r.author.name : '匿名') + '</span>' +
            '<span class="rev-summary">' + r.summary + '</span>' +
            '<span class="rev-time">' + time + '</span></div>';
        }
        revList.innerHTML = html;
      });
  });
  revList.addEventListener('click', function (e) {
    var item = e.target.closest('.rev-item');
    if (!item || !item.dataset.rev) return;
    fetch(prefix + '/api/v1/documents/' + docId + '/content?rev=' + item.dataset.rev)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        revList.style.display = 'none';
        revView.style.display = 'flex';
        document.getElementById('rev-content').textContent = data.text || '';
        document.getElementById('btn-restore').dataset.rev = data.revision;
      });
  });
  document.getElementById('btn-restore').addEventListener('click', function () {
    if (readOnly) return;
    fetch(prefix + '/api/v1/documents/' + docId + '/content?rev=' + this.dataset.rev)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.delta || !Array.isArray(data.delta.ops)) return;
        var current = quill.getContents();
        var replaceDelta = new Delta().delete(current.length()).concat(new Delta(data.delta.ops));
        quill.updateContents(replaceDelta, 'user');
        mask.classList.remove('show');
        toast('已恢复到 v' + data.revision);
      });
  });
  document.getElementById('btn-close-history').addEventListener('click', function () {
    mask.classList.remove('show');
  });
  mask.addEventListener('click', function (e) {
    if (e.target === mask) mask.classList.remove('show');
  });

  connect();
})();
`;

export const DASHBOARD_JS = `
(function () {
  'use strict';
  var prefix = window.DASH_CFG.prefix;
  var state = null;

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function api(path, method, body) {
    return fetch(prefix + path, {
      method: method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  }
  function dollars(cents) { return '$' + (cents / 100).toFixed(2); }
  function mb(bytes) { return (bytes / 1e6).toFixed(2) + ' MB'; }

  /* ---------------- tree ---------------- */
  function folderOptions(selected) {
    var html = '<option value="">（根目录）</option>';
    state.nodes.forEach(function (n) {
      if (n.type === 'folder') {
        html += '<option value="' + n.id + '"' + (n.id === selected ? ' selected' : '') + '>' + esc(n.name) + '</option>';
      }
    });
    return html;
  }

  function renderTree() {
    var tree = document.getElementById('tree');
    var children = {};
    state.nodes.forEach(function (n) {
      var p = n.parent || '';
      if (!children[p]) children[p] = [];
      children[p].push(n);
    });
    Object.values(children).forEach(function (list) {
      list.sort(function (a, b) { return (a.type === b.type ? 0 : a.type === 'folder' ? -1 : 1) || String(a.name).localeCompare(String(b.name)); });
    });
    var html = '';
    function walk(parent, depth) {
      (children[parent] || []).forEach(function (n) {
        var pad = 'style="padding-left:' + (6 + depth * 18) + 'px"';
        if (n.type === 'folder') {
          html += '<div class="tree-row" ' + pad + '>' +
            '<span class="tree-icon">📁</span>' +
            '<span class="tree-name" data-folder="' + n.id + '" title="' + esc(n.name) + '">' + esc(n.name) + '</span>' +
            '<span class="tree-actions">' +
            '<button class="tree-btn act-new-doc" data-parent="' + n.id + '" title="在此新建文档">＋</button>' +
            '<button class="tree-btn act-rename" data-id="' + n.id + '" data-name="' + esc(n.name) + '" title="重命名">✏️</button>' +
            '<button class="tree-btn act-del-folder" data-id="' + n.id + '" title="删除文件夹">🗑</button>' +
            '</span></div>';
          walk(n.id, depth + 1);
        } else {
          html += '<div class="tree-row" ' + pad + '>' +
            '<span class="tree-icon">📄</span>' +
            '<a class="tree-name" href="' + prefix + '/d/' + n.docId + '" title="' + esc(n.name) + '">' + esc(n.name) + '</a>' +
            '<span class="tree-actions"><select class="tree-select act-move" data-id="' + n.id + '">' + folderOptions(n.parent) + '</select></span>' +
            '</div>';
        }
      });
    }
    walk('', 0);
    tree.innerHTML = html || '<div class="tree-loading">还没有文档，点击「新建文档」开始</div>';
  }

  function createDoc(parent) {
    var title = window.prompt('文档标题（可选）', '');
    if (title === null) return;
    var form = new FormData();
    form.append('title', title);
    if (parent) form.append('parent', parent);
    fetch(prefix + '/new', { method: 'POST', body: form, redirect: 'follow' })
      .then(function (r) { location.href = r.url; });
  }

  document.getElementById('btn-new-doc').addEventListener('click', function () { createDoc(null); });
  document.getElementById('btn-new-folder').addEventListener('click', function () {
    var name = window.prompt('文件夹名称', '新建文件夹');
    if (!name) return;
    api('/app/folders', 'POST', { name: name }).then(reload);
  });
  document.getElementById('tree').addEventListener('click', function (e) {
    var newDoc = e.target.closest('.act-new-doc');
    if (newDoc) { createDoc(newDoc.dataset.parent); return; }
    var rename = e.target.closest('.act-rename');
    if (rename) {
      var name = window.prompt('重命名文件夹', rename.dataset.name);
      if (name) api('/app/nodes/' + rename.dataset.id, 'PATCH', { name: name }).then(reload);
      return;
    }
    var del = e.target.closest('.act-del-folder');
    if (del) {
      if (window.confirm('删除该文件夹？其中的文档会移到上一级。')) {
        api('/app/nodes/' + del.dataset.id, 'DELETE').then(reload);
      }
    }
  });
  document.getElementById('tree').addEventListener('change', function (e) {
    var move = e.target.closest('.act-move');
    if (move) {
      api('/app/nodes/' + move.dataset.id, 'PATCH', { parent: move.value || null }).then(reload);
    }
  });

  /* ---------------- usage + api keys ---------------- */
  function renderAccount() {
    document.getElementById('balance-badge').textContent = '余额 ' + dollars(state.balanceCents);
    document.getElementById('usage').innerHTML =
      '<div class="usage-item"><div class="usage-value">' + dollars(state.balanceCents) + '</div><div class="usage-label">账户余额（注册赠送 $5）</div></div>' +
      '<div class="usage-item"><div class="usage-value">' + state.imageCount + '</div><div class="usage-label">托管图片数量</div></div>' +
      '<div class="usage-item"><div class="usage-value">' + mb(state.bytesStored) + '</div><div class="usage-label">图片存储用量</div></div>' +
      '<div class="usage-item"><div class="usage-value">' + dollars(state.estimatedMonthlyCents) + '</div><div class="usage-label">预计月费（$0.015/GB/月）</div></div>';

    var keysEl = document.getElementById('apikeys');
    if (!state.apiKeys.length) {
      keysEl.innerHTML = '<div style="color:var(--muted);font-size:13.5px">还没有 API Key。生成后可配合 Agent skill 使用。</div>';
    } else {
      keysEl.innerHTML = state.apiKeys.map(function (k) {
        return '<div class="apikey-row"><code>' + esc(k.prefix) + '…</code><span>' + esc(k.name) + '</span>' +
          '<span style="color:var(--muted);font-size:12px">' + new Date(k.createdAt).toLocaleDateString() + '</span>' +
          '<button class="tree-btn act-del-key" data-id="' + k.id + '" style="margin-left:auto">删除</button></div>';
      }).join('');
    }
  }

  document.getElementById('btn-new-apikey').addEventListener('click', function () {
    var name = document.getElementById('apikey-name').value || 'API Key';
    api('/app/apikeys', 'POST', { name: name })
      .then(function (r) { return r.json(); })
      .then(function (k) {
        var box = document.getElementById('apikey-result');
        box.style.display = '';
        box.innerHTML = '请立即保存，Key 只显示一次：<br><code>' + esc(k.key) + '</code>' +
          ' <button class="tree-btn" id="btn-copy-key">复制</button>';
        document.getElementById('btn-copy-key').addEventListener('click', function () {
          if (navigator.clipboard) navigator.clipboard.writeText(k.key).then(function () { toast('已复制'); });
        });
        reload();
      });
  });
  document.getElementById('apikeys').addEventListener('click', function (e) {
    var del = e.target.closest('.act-del-key');
    if (del && window.confirm('删除该 API Key？')) {
      api('/app/apikeys/' + del.dataset.id, 'DELETE').then(reload);
    }
  });

  function reload() {
    return fetch(prefix + '/app/state').then(function (r) { return r.json(); }).then(function (s) {
      state = s;
      renderTree();
      renderAccount();
    });
  }
  reload();
})();
`;
