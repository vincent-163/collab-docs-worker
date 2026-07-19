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

/* ---------- homepage ---------- */
.home { min-height: 100vh; background: linear-gradient(160deg, #eef3ff 0%, #f8faff 45%, #fdf3ee 100%); }
.home-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 6vw; }
.logo { font-size: 20px; font-weight: 700; letter-spacing: .5px; }
.logo span { color: var(--primary); }
.hero { text-align: center; padding: 9vh 20px 60px; }
.hero h1 { font-size: clamp(30px, 5vw, 52px); line-height: 1.25; margin-bottom: 16px; }
.hero h1 em { font-style: normal; color: var(--primary); }
.hero p { color: var(--muted); font-size: 17px; max-width: 620px; margin: 0 auto 36px; line-height: 1.7; }
.create-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 12px 40px rgba(60, 90, 180, .10); padding: 14px; display: flex; gap: 10px; max-width: 560px; margin: 0 auto; }
.create-card input { flex: 1; border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; font-size: 15px; outline: none; }
.create-card input:focus { border-color: var(--primary); }
.btn { border: none; border-radius: 10px; background: var(--primary); color: #fff; font-size: 15px; font-weight: 600; padding: 12px 22px; cursor: pointer; transition: background .15s; white-space: nowrap; }
.btn:hover { background: var(--primary-dark); }
.btn.secondary { background: #eef2fb; color: var(--text); border: 1px solid var(--border); }
.btn.secondary:hover { background: #e2e9f8; }
.btn.small { padding: 7px 13px; font-size: 13px; }
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

/* ---------- editor ---------- */
.editor-body { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; gap: 14px; padding: 10px 18px; background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; flex-wrap: wrap; }
.topbar .logo { font-size: 17px; }
.title-input { border: 1px solid transparent; border-radius: 8px; font-size: 15px; font-weight: 600; padding: 7px 10px; width: 240px; outline: none; }
.title-input:hover { border-color: var(--border); }
.title-input:focus { border-color: var(--primary); }
.status { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; white-space: nowrap; }
.status .dot { width: 8px; height: 8px; border-radius: 50%; background: #2ecc71; }
.status.offline .dot { background: #e74c3c; }
.status.syncing .dot { background: #f1c40f; }
.topbar .spacer { flex: 1; }
.collabs { display: flex; align-items: center; }
.avatar { width: 28px; height: 28px; border-radius: 50%; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; margin-left: -8px; cursor: default; }
.avatar:first-child { margin-left: 0; }
.avatar.me { outline: 2px solid var(--primary); outline-offset: 1px; }
.doc-wrap { flex: 1; padding: 26px 16px 60px; }
.doc-page { background: var(--card); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 6px 24px rgba(40, 60, 120, .07); max-width: 860px; margin: 0 auto; min-height: 76vh; display: flex; }
.doc-page textarea { flex: 1; border: none; outline: none; resize: none; padding: 44px 52px; font-size: 15.5px; line-height: 1.85; font-family: inherit; background: transparent; color: var(--text); min-height: 76vh; }
.doc-page textarea[readonly] { background: repeating-linear-gradient(0deg, #fff, #fff 36px, #fcfcfd 36px, #fcfcfd 72px); }
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
.rev-item .rev-summary { color: var(--muted); width: 90px; }
.rev-item .rev-time { color: var(--muted); margin-left: auto; }
.modal .rev-view { display: none; flex-direction: column; min-height: 0; }
.modal .rev-view pre { overflow: auto; padding: 18px 20px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.modal .rev-view .rev-actions { display: flex; gap: 10px; padding: 12px 20px; border-top: 1px solid var(--border); }
.empty-doc { color: #b6bfce; }
@media (max-width: 640px) {
  .doc-page textarea { padding: 24px 20px; }
  .title-input { width: 140px; }
  .create-card { flex-direction: column; }
}
`;

export const CLIENT_JS = `
(function () {
  'use strict';
  var cfg = window.COLLAB_CFG;
  var prefix = cfg.prefix;
  var docId = cfg.docId;

  /* ---------------- OT (mirror of server src/ot.js) ---------------- */
  function applyOps(text, ops) {
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.t === 'ins') text = text.slice(0, op.p) + op.s + text.slice(op.p);
      else text = text.slice(0, op.p) + text.slice(op.p + op.l);
    }
    return text;
  }
  function transformOp(x, y, yPriority) {
    if (y.t === 'ins') {
      if (x.t === 'ins') {
        if (y.p < x.p || (y.p === x.p && yPriority)) return { t: 'ins', p: x.p + y.s.length, s: x.s };
        return x;
      }
      if (y.p <= x.p) return { t: 'del', p: x.p + y.s.length, l: x.l };
      if (y.p < x.p + x.l) return { t: 'del', p: x.p, l: x.l + y.s.length };
      return x;
    }
    var yEnd = y.p + y.l;
    if (x.t === 'ins') {
      if (x.p > y.p) return { t: 'ins', p: x.p - Math.min(y.l, x.p - y.p), s: x.s };
      return x;
    }
    var xEnd = x.p + x.l;
    if (yEnd <= x.p) return { t: 'del', p: x.p - y.l, l: x.l };
    if (xEnd <= y.p) return x;
    var before = Math.max(0, Math.min(xEnd, y.p) - x.p);
    var after = Math.max(0, xEnd - Math.max(yEnd, x.p));
    var len = before + after;
    if (len === 0) return null;
    return { t: 'del', p: Math.min(x.p, y.p), l: len };
  }
  function transformOps(ops, history, historyPriority) {
    if (historyPriority === undefined) historyPriority = true;
    var out = ops;
    for (var i = 0; i < history.length; i++) {
      var next = [];
      var against = history[i];
      for (var j = 0; j < out.length; j++) {
        var moved = transformOp(out[j], against, historyPriority);
        var rest = transformOp(against, out[j], !historyPriority);
        if (rest) against = rest;
        if (moved) next.push(moved);
      }
      out = next;
    }
    return out;
  }
  function mapPosition(pos, ops) {
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.t === 'ins') { if (op.p <= pos) pos += op.s.length; }
      else if (op.p + op.l <= pos) pos -= op.l;
      else if (op.p < pos) pos = op.p;
    }
    return pos;
  }
  function diffOps(oldText, newText) {
    if (oldText === newText) return [];
    var minLen = Math.min(oldText.length, newText.length);
    var p = 0;
    while (p < minLen && oldText[p] === newText[p]) p++;
    var s = 0;
    while (s < minLen - p && oldText[oldText.length - 1 - s] === newText[newText.length - 1 - s]) s++;
    var ops = [];
    var delLen = oldText.length - p - s;
    if (delLen > 0) ops.push({ t: 'del', p: p, l: delLen });
    var ins = newText.slice(p, newText.length - s);
    if (ins.length > 0) ops.push({ t: 'ins', p: p, s: ins });
    return ops;
  }

  /* ---------------- state ---------------- */
  var ta = document.getElementById('editor');
  var titleInput = document.getElementById('title-input');
  var statusEl = document.getElementById('status');
  var collabsEl = document.getElementById('collabs');
  var countEl = document.getElementById('char-count');
  var revEl = document.getElementById('rev-label');
  var ws = null;
  var myId = null;
  var rev = 0;
  var text = '';
  var pending = null;   // { opId, ops }
  var buffer = [];      // ops composed while waiting for ack
  var opSeq = 0;
  var connected = false;
  var backoff = 1000;
  var clients = [];

  function setStatus(state, label) {
    statusEl.className = 'status' + (state === 'offline' ? ' offline' : state === 'syncing' ? ' syncing' : '');
    statusEl.querySelector('span').textContent = label;
  }
  function updateCount() {
    countEl.textContent = '字符 ' + text.length;
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

  /* ---------------- networking ---------------- */
  function send(obj) {
    if (connected && ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }
  function sendOps(ops) {
    pending = { opId: ++opSeq, ops: ops };
    send({ type: 'op', opId: pending.opId, baseRev: rev, ops: ops });
    setStatus('syncing', '同步中…');
  }

  function onInit(msg) {
    rev = msg.rev;
    text = msg.text;
    myId = msg.you.id;
    clients = msg.clients;
    pending = null;
    buffer = [];
    ta.value = text;
    ta.readOnly = false;
    titleInput.value = msg.title;
    document.title = (msg.title || '未命名文档') + ' · 协作文档';
    clients = msg.clients;
    renderCollabs();
    updateCount();
    updateRev();
    setStatus('online', '已连接 · 实时同步');
    backoff = 1000;
  }

  function onRemoteOp(msg) {
    var serverOps = msg.ops;
    if (pending) {
      var overPending = transformOps(serverOps, pending.ops, false);
      pending.ops = transformOps(pending.ops, serverOps);
      serverOps = overPending;
    }
    if (buffer.length) {
      var overBuffer = transformOps(serverOps, buffer, false);
      buffer = transformOps(buffer, serverOps);
      serverOps = overBuffer;
    }
    var selS = ta.selectionStart, selE = ta.selectionEnd;
    text = applyOps(text, serverOps);
    ta.value = text;
    ta.selectionStart = mapPosition(selS, serverOps);
    ta.selectionEnd = mapPosition(selE, serverOps);
    rev = msg.rev;
    updateCount();
    updateRev();
    if (!pending) setStatus('online', '已连接 · 实时同步');
  }

  function onAck(msg) {
    rev = msg.rev;
    updateRev();
    pending = null;
    if (buffer.length) {
      var b = buffer;
      buffer = [];
      sendOps(b);
    } else {
      setStatus('online', '已连接 · 实时同步');
    }
  }

  function connect() {
    setStatus('offline', '连接中…');
    ta.readOnly = true;
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
      ta.readOnly = true;
      setStatus('offline', '离线 · ' + Math.round(backoff / 1000) + 's 后重连');
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 10000);
    };
    ws.onerror = function () { ws.close(); };
  }

  /* ---------------- local editing ---------------- */
  ta.addEventListener('input', function () {
    var ops = diffOps(text, ta.value);
    if (!ops.length) return;
    text = ta.value;
    updateCount();
    if (!connected) return;
    if (pending) buffer = buffer.concat(ops);
    else sendOps(ops);
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
  document.addEventListener('selectionchange', function () {
    if (document.activeElement !== ta) return;
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(function () {
      send({ type: 'cursor', start: ta.selectionStart, end: ta.selectionEnd });
    }, 200);
  });

  /* ---------------- toolbar actions ---------------- */
  document.getElementById('btn-share').addEventListener('click', function () {
    var url = location.origin + prefix + '/d/' + docId;
    function done() { toast('链接已复制，分享给他人即可协作'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt('复制链接：', url); });
    } else {
      window.prompt('复制链接：', url);
    }
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
        document.getElementById('rev-content').textContent = data.content || '';
        document.getElementById('btn-restore').dataset.rev = data.revision;
      });
  });
  document.getElementById('btn-restore').addEventListener('click', function () {
    fetch(prefix + '/api/v1/documents/' + docId + '/content?rev=' + this.dataset.rev)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (typeof data.content !== 'string') return;
        ta.value = data.content;
        var evt = document.createEvent('Event');
        evt.initEvent('input', true, true);
        ta.dispatchEvent(evt);
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
