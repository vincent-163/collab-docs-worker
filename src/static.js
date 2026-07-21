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

/* ---------- chat ---------- */
.room-name { font-size: 15px; font-weight: 600; }
.compat-warning { background: #fff4e0; color: #b9770e; padding: 10px 18px; font-size: 13.5px; border-bottom: 1px solid var(--border); }
.chat-body { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }
.chat-main { flex: 1; display: flex; flex-direction: column; max-width: 760px; width: 100%; margin: 0 auto; padding: 16px; min-height: 0; }
.chat-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 8px 2px; min-height: 40vh; }
.chat-list-empty { color: var(--muted); text-align: center; margin-top: 40px; font-size: 13.5px; }
.chat-msg { display: flex; gap: 10px; align-items: flex-start; }
.chat-msg .avatar { flex-shrink: 0; margin-left: 0; }
.chat-bubble { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 8px 12px; max-width: 78%; min-width: 0; }
.chat-bubble.mine { background: #eef3ff; border-color: #d4e0fb; }
.chat-meta { font-size: 11.5px; color: var(--muted); margin-bottom: 4px; display: flex; gap: 8px; }
.chat-text { font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.chat-img { max-width: 260px; max-height: 200px; border-radius: 8px; display: block; margin-top: 4px; cursor: zoom-in; }
.chat-file { display: inline-flex; align-items: center; gap: 8px; margin-top: 4px; background: #f2f5fc; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; }
.chat-file-note { display: block; font-size: 11.5px; color: var(--muted); margin-top: 4px; }
.chat-inputbar { display: flex; gap: 8px; padding: 10px 0 4px; }
.chat-inputbar input { flex: 1; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; min-width: 0; }
.chat-inputbar input:focus { border-color: var(--primary); }
.chat-hint { color: var(--muted); font-size: 12px; padding: 4px 2px 12px; }

/* ---------- sheet ---------- */
.sheet-body { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }
.sheet-formulabar { display: flex; align-items: center; gap: 10px; padding: 8px 18px; background: var(--card); border-bottom: 1px solid var(--border); }
.fx-ref { font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: var(--muted); width: 42px; text-align: center; flex-shrink: 0; }
.sheet-formulabar input { flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 13.5px; font-family: ui-monospace, Menlo, monospace; outline: none; min-width: 0; }
.sheet-formulabar input:focus { border-color: var(--primary); }
.sheet-main { flex: 1; overflow: auto; padding: 12px 16px 30px; min-height: 0; }
.sheet-grid table { border-collapse: collapse; background: var(--card); }
.sheet-grid th { border: 1px solid var(--border); background: #f7f9fd; color: var(--muted); font-size: 12px; font-weight: 600; min-width: 96px; height: 24px; padding: 0 6px; position: sticky; top: 0; z-index: 2; }
.sheet-grid th.row-head { min-width: 42px; position: sticky; left: 0; z-index: 3; }
.sheet-grid th.corner { position: sticky; left: 0; top: 0; z-index: 4; }
.sheet-grid td { border: 1px solid var(--border); font-size: 13px; padding: 3px 6px; height: 24px; max-width: 240px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: cell; }
.sheet-grid td.selected { outline: 2px solid var(--primary); outline-offset: -2px; }
.sheet-grid td.error { color: #c0392b; }
.sheet-grid td input { width: 100%; border: none; outline: none; font-size: 13px; font-family: inherit; padding: 0; background: transparent; }
.sheet-metabar { padding: 0 16px 14px; }

/* ---------- meet ---------- */
.meet-body { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }
.meet-layout { flex: 1; display: flex; min-height: 0; }
.meet-stage { flex: 1; display: flex; flex-direction: column; padding: 16px; min-width: 0; }
.videos { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; align-content: start; }
.video-tile { background: #101826; border-radius: 12px; overflow: hidden; position: relative; aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; }
.video-tile video { width: 100%; height: 100%; object-fit: cover; }
.video-tile .video-label { position: absolute; left: 8px; bottom: 8px; background: rgba(0,0,0,.55); color: #fff; font-size: 12px; padding: 2px 8px; border-radius: 6px; }
.video-tile .video-placeholder { color: #8fa0bd; font-size: 13px; }
.meet-controls { display: flex; gap: 10px; padding-top: 14px; justify-content: center; }
.meet-chat { width: 320px; flex-shrink: 0; border-left: 1px solid var(--border); background: var(--card); display: flex; flex-direction: column; padding: 12px; min-height: 0; }
.meet-chat .chat-list { padding: 4px 0; min-height: 0; }
.meet-chat .chat-bubble { background: #f7f9fd; }
.meet-hint { text-align: center; padding-bottom: 10px; }
@media (max-width: 860px) {
  .meet-layout { flex-direction: column; }
  .meet-chat { width: 100%; border-left: none; border-top: 1px solid var(--border); }
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
          var isSheet = n.type === 'sheet';
          html += '<div class="tree-row" ' + pad + '>' +
            '<span class="tree-icon">' + (isSheet ? '📊' : '📄') + '</span>' +
            '<a class="tree-name" href="' + prefix + (isSheet ? '/sheet/' : '/d/') + n.docId + '" title="' + esc(n.name) + '">' + esc(n.name) + '</a>' +
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

  function createSheet(parent) {
    var title = window.prompt('表格标题（可选）', '');
    if (title === null) return;
    var form = new FormData();
    form.append('title', title);
    if (parent) form.append('parent', parent);
    fetch(prefix + '/sheet/new', { method: 'POST', body: form, redirect: 'follow' })
      .then(function (r) { location.href = r.url; });
  }

  function createRoom(kind) {
    var label = kind === 'chat' ? '聊天室' : '会议';
    var name = window.prompt(label + '名称', label);
    if (name === null) return;
    var form = new FormData();
    form.append('name', name);
    fetch(prefix + '/' + kind + '/new', { method: 'POST', body: form, redirect: 'follow' })
      .then(function (r) { location.href = r.url; });
  }

  document.getElementById('btn-new-doc').addEventListener('click', function () { createDoc(null); });
  document.getElementById('btn-new-sheet').addEventListener('click', function () { createSheet(null); });
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

    var chatsEl = document.getElementById('chats');
    if (!state.chats || !state.chats.length) {
      chatsEl.innerHTML = '<div style="color:var(--muted);font-size:13.5px">还没有聊天室。新建后把链接分享给同事即可加入。</div>';
    } else {
      chatsEl.innerHTML = state.chats.map(function (c) {
        return '<div class="apikey-row"><span>💬</span><a href="' + prefix + '/chat/' + c.id + '">' + esc(c.name || '聊天室') + '</a>' +
          '<span style="color:var(--muted);font-size:12px;margin-left:auto">' + new Date(c.lastAt).toLocaleDateString() + '</span></div>';
      }).join('');
    }

    var meetsEl = document.getElementById('meets');
    if (!state.meets || !state.meets.length) {
      meetsEl.innerHTML = '<div style="color:var(--muted);font-size:13.5px">还没有会议。新建后把链接分享给同事即可加入。</div>';
    } else {
      meetsEl.innerHTML = state.meets.map(function (m) {
        return '<div class="apikey-row"><span>🎥</span><a href="' + prefix + '/meet/' + m.id + '">' + esc(m.name || '会议') + '</a>' +
          '<span style="color:var(--muted);font-size:12px;margin-left:auto">' + new Date(m.lastAt).toLocaleDateString() + '</span></div>';
      }).join('');
    }

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

  document.getElementById('btn-new-chat').addEventListener('click', function () { createRoom('chat'); });
  document.getElementById('btn-new-meet').addEventListener('click', function () { createRoom('meet'); });

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

export const CHAT_JS = `
(function () {
  'use strict';
  var cfg = window.CHAT_CFG;
  var prefix = cfg.prefix;
  var listEl = document.getElementById('chat-list');
  var inputEl = document.getElementById('chat-input');
  var statusEl = document.getElementById('status');
  var collabsEl = document.getElementById('collabs');
  var ws = null;
  var connected = false;
  var backoff = 1000;
  var myId = null;
  var clients = [];
  var seenIds = {};

  if (!window.WebSocket) {
    document.getElementById('ws-warning').style.display = '';
    document.getElementById('btn-send').disabled = true;
    document.getElementById('btn-attach').disabled = true;
    return;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
  function setStatus(state, label) {
    statusEl.className = 'status' + (state === 'offline' ? ' offline' : '');
    statusEl.querySelector('span').textContent = label;
  }
  function renderCollabs() {
    var html = '';
    for (var i = 0; i < clients.length; i++) {
      var c = clients[i];
      html += '<div class="avatar' + (c.id === myId ? ' me' : '') + '" style="background:' + c.color + '" title="' +
        esc(c.name) + (c.id === myId ? '（我）' : '') + '">' + esc(c.name.slice(-2, -1)) + '</div>';
    }
    collabsEl.innerHTML = html;
  }
  function fmtTime(ts) {
    var d = new Date(ts);
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }
  function fmtSize(bytes) {
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB';
    return bytes + ' B';
  }

  function msgNode(m) {
    var mine = m.by && m.by.id === myId;
    var html = '<div class="chat-msg">' +
      '<div class="avatar" style="background:' + (m.by ? m.by.color : '#888') + '" title="' + esc(m.by ? m.by.name : '') + '">' +
      esc(m.by ? m.by.name.slice(-2, -1) : '?') + '</div>' +
      '<div class="chat-bubble' + (mine ? ' mine' : '') + '">' +
      '<div class="chat-meta"><span>' + esc(m.by ? m.by.name : '匿名') + '</span><span>' + fmtTime(m.ts) + '</span></div>';
    if (m.kind === 'image' && m.file) {
      if (m.text) html += '<div class="chat-text">' + esc(m.text) + '</div>';
      html += '<a href="' + esc(m.file.url) + '" target="_blank" rel="noopener">' +
        '<img class="chat-img" src="' + esc(m.file.url) + '" alt="' + esc(m.file.name) + '" loading="lazy"></a>';
    } else if (m.kind === 'file' && m.file) {
      if (m.text) html += '<div class="chat-text">' + esc(m.text) + '</div>';
      html += '<a class="chat-file" href="' + esc(m.file.url) + '" download="' + esc(m.file.name) + '">📎 ' +
        esc(m.file.name) + '（' + fmtSize(m.file.size) + '）</a>' +
        '<span class="chat-file-note">此文件类型不支持在线预览，请下载后查看；附件保存 7 天</span>';
    } else {
      html += '<div class="chat-text">' + esc(m.text || '') + '</div>';
    }
    html += '</div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  }

  function appendMsg(m) {
    if (seenIds[m.id]) return;
    seenIds[m.id] = true;
    var empty = listEl.querySelector('.chat-list-empty');
    if (empty) empty.remove();
    var nearBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 120;
    listEl.appendChild(msgNode(m));
    if (nearBottom || (m.by && m.by.id === myId)) listEl.scrollTop = listEl.scrollHeight;
  }

  function send(obj) {
    if (connected && ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }

  function sendText() {
    var text = inputEl.value;
    if (!text.trim()) return;
    send({ type: 'msg', kind: 'text', text: text });
    inputEl.value = '';
    inputEl.focus();
  }

  document.getElementById('btn-send').addEventListener('click', sendText);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  });

  /* ---------------- attachments ---------------- */
  var MAX_FILE_BYTES = 25 * 1024 * 1024;
  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  document.getElementById('btn-attach').addEventListener('click', function () {
    fileInput.value = '';
    fileInput.click();
  });
  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { toast('附件不能超过 25MB'); return; }
    var form = new FormData();
    form.append('file', file);
    setStatus('offline', '上传附件中…');
    fetch(prefix + '/chat/' + cfg.chatId + '/upload', { method: 'POST', body: form })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); })
      .then(function (res) {
        setStatus('online', '已连接');
        if (!res.ok) { toast(res.d.message || '附件上传失败'); return; }
        var isImage = String(res.d.contentType || '').indexOf('image/') === 0;
        send({ type: 'msg', kind: isImage ? 'image' : 'file', file: res.d });
        toast('附件已发送（扣费 $' + (res.d.chargedCents / 100).toFixed(4) + '）');
      })
      .catch(function () { setStatus('online', '已连接'); toast('附件上传失败'); });
  });

  /* ---------------- networking ---------------- */
  function connect() {
    setStatus('offline', '连接中…');
    ws = new WebSocket(cfg.wsUrl);
    ws.onopen = function () { connected = true; };
    ws.onmessage = function (event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (msg.type === 'init') {
        myId = msg.you.id;
        clients = msg.clients;
        (msg.messages || []).forEach(appendMsg);
        if (!listEl.children.length) {
          listEl.innerHTML = '<div class="chat-list-empty">还没有消息，来说点什么吧</div>';
        }
        listEl.scrollTop = listEl.scrollHeight;
        renderCollabs();
        setStatus('online', '已连接');
        backoff = 1000;
      } else if (msg.type === 'msg') {
        appendMsg(msg.msg);
      } else if (msg.type === 'presence') {
        clients = msg.clients;
        renderCollabs();
      } else if (msg.type === 'error') {
        toast(msg.message || '出错了');
      }
    };
    ws.onclose = function () {
      connected = false;
      setStatus('offline', '离线 · ' + Math.round(backoff / 1000) + 's 后重连');
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 10000);
    };
    ws.onerror = function () { ws.close(); };
  }
  connect();
})();
`;

export const SHEET_JS = `
(function () {
  'use strict';
  // window.FORMULA is installed by an inline ES-module script in the page
  // (imports /static/formula.js); wait for DOMContentLoaded so it exists.
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    var FE = window.FORMULA;
    if (!FE) {
      document.getElementById('status').querySelector('span').textContent = '公式引擎加载失败，请刷新重试';
      return;
    }
    var cfg = window.SHEET_CFG;
    var ROWS = 200;
    var COLS = 26;
    var gridEl = document.getElementById('sheet-grid');
    var titleInput = document.getElementById('title-input');
    var statusEl = document.getElementById('status');
    var collabsEl = document.getElementById('collabs');
    var revEl = document.getElementById('rev-label');
    var fxRef = document.getElementById('fx-ref');
    var fxInput = document.getElementById('fx-input');

    var cells = {}; // "r,c" -> raw text
    var rev = 0;
    var myId = null;
    var clients = [];
    var selected = null; // { r, c }
    var editingTd = null;
    var ws = null;
    var connected = false;
    var synced = false;
    var backoff = 1000;
    var tdRefs = []; // [r][c] -> td element

    function toast(msg) {
      var el = document.getElementById('toast');
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(function () { el.classList.remove('show'); }, 2200);
    }
    function setStatus(state, label) {
      statusEl.className = 'status' + (state === 'offline' ? ' offline' : state === 'syncing' ? ' syncing' : '');
      statusEl.querySelector('span').textContent = label;
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
    function updateRev() {
      revEl.textContent = '修订版本 ' + rev;
    }
    function key(r, c) { return r + ',' + c; }

    /* ---------------- formula evaluation ---------------- */
    function cellNumber(r, c, visiting) {
      var raw = cells[key(r, c)];
      if (raw === undefined || raw === '') return 0;
      if (raw.charAt(0) === '=') {
        var v = evaluateCell(r, c, visiting);
        if (v.error) throw { code: v.error };
        return typeof v.value === 'number' ? v.value : 0;
      }
      var n = parseFloat(raw);
      return Number.isNaN(n) ? 0 : n;
    }
    function evaluateCell(r, c, visiting) {
      var k = key(r, c);
      if (visiting[k]) return { error: '#CYCLE!' };
      visiting[k] = true;
      var res = FE.evaluateFormula(cells[k], {
        get: function (ref) {
          var p = FE.parseCellRef(ref);
          if (!p || p.row < 0 || p.row >= ROWS || p.col < 0 || p.col >= COLS) throw { code: '#REF!' };
          return cellNumber(p.row, p.col, visiting);
        },
        range: function (a, b) {
          var pa = FE.parseCellRef(a);
          var pb = FE.parseCellRef(b);
          if (!pa || !pb) throw { code: '#REF!' };
          var nums = [];
          var r0 = Math.min(pa.row, pb.row), r1 = Math.max(pa.row, pb.row);
          var c0 = Math.min(pa.col, pb.col), c1 = Math.max(pa.col, pb.col);
          if (r1 - r0 > 1000 || c1 - c0 > 100) throw { code: '#REF!' };
          for (var rr = r0; rr <= r1; rr++) {
            for (var cc = c0; cc <= c1; cc++) nums.push(cellNumber(rr, cc, visiting));
          }
          return nums;
        }
      });
      delete visiting[k];
      return res;
    }
    function displayValue(r, c) {
      var raw = cells[key(r, c)];
      if (raw === undefined) return { text: '' };
      if (raw.charAt(0) === '=') {
        var v = evaluateCell(r, c, {});
        if (v.error) return { text: v.error, error: true };
        return { text: String(Math.round(v.value * 1e10) / 1e10) };
      }
      return { text: raw };
    }

    /* ---------------- grid rendering ---------------- */
    function buildGrid() {
      var html = '<table><tr><th class="corner"></th>';
      for (var c = 0; c < COLS; c++) html += '<th>' + FE.colName(c) + '</th>';
      html += '</tr>';
      for (var r = 0; r < ROWS; r++) {
        html += '<tr><th class="row-head">' + (r + 1) + '</th>';
        for (var c2 = 0; c2 < COLS; c2++) html += '<td data-r="' + r + '" data-c="' + c2 + '"></td>';
        html += '</tr>';
      }
      html += '</table>';
      gridEl.innerHTML = html;
      var tds = gridEl.querySelectorAll('td');
      for (var i = 0; i < tds.length; i++) {
        var td = tds[i];
        var rr = Number(td.dataset.r);
        var cc = Number(td.dataset.c);
        if (!tdRefs[rr]) tdRefs[rr] = [];
        tdRefs[rr][cc] = td;
      }
    }
    function renderCell(r, c) {
      var td = tdRefs[r] && tdRefs[r][c];
      if (!td || td === editingTd) return;
      var v = displayValue(r, c);
      td.textContent = v.text;
      td.classList.toggle('error', !!v.error);
      td.title = cells[key(r, c)] || '';
    }
    function renderAll() {
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (cells[key(r, c)] !== undefined) renderCell(r, c);
        }
      }
    }
    function renderFormulas() {
      for (var k in cells) {
        if (cells[k].charAt(0) === '=') {
          var parts = k.split(',');
          renderCell(Number(parts[0]), Number(parts[1]));
        }
      }
    }

    /* ---------------- selection & editing ---------------- */
    function select(r, c) {
      if (selected) {
        var prev = tdRefs[selected.r] && tdRefs[selected.r][selected.c];
        if (prev) prev.classList.remove('selected');
      }
      selected = { r: r, c: c };
      var td = tdRefs[r][c];
      td.classList.add('selected');
      fxRef.textContent = FE.colName(c) + (r + 1);
      fxInput.value = cells[key(r, c)] || '';
    }
    function commitEdit(td, input) {
      var r = Number(td.dataset.r);
      var c = Number(td.dataset.c);
      var value = input.value;
      editingTd = null;
      td.textContent = '';
      applyLocal(r, c, value);
    }
    function startEdit(td, initial) {
      if (editingTd) return;
      var r = Number(td.dataset.r);
      var c = Number(td.dataset.c);
      editingTd = td;
      td.textContent = '';
      td.classList.remove('error');
      var input = document.createElement('input');
      input.value = initial !== undefined ? initial : (cells[key(r, c)] || '');
      td.appendChild(input);
      input.focus();
      if (initial !== undefined) input.setSelectionRange(input.value.length, input.value.length);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit(td, input);
          select(Math.min(r + 1, ROWS - 1), c);
        } else if (e.key === 'Escape') {
          editingTd = null;
          renderCell(r, c);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit(td, input);
          select(r, Math.min(c + 1, COLS - 1));
        }
        e.stopPropagation();
      });
      input.addEventListener('blur', function () {
        if (editingTd === td) commitEdit(td, input);
      });
    }
    function applyLocal(r, c, value) {
      if (value === '') delete cells[key(r, c)];
      else cells[key(r, c)] = value;
      renderCell(r, c);
      renderFormulas();
      if (selected) fxInput.value = cells[key(selected.r, selected.c)] || '';
      if (synced && connected) {
        send({ type: 'cell', r: r, c: c, value: value });
        setStatus('syncing', '同步中…');
        setTimeout(function () { if (connected) setStatus('online', '已连接 · 实时同步'); }, 600);
      }
    }

    gridEl.addEventListener('mousedown', function (e) {
      var td = e.target.closest('td');
      if (!td || td === editingTd) return;
      select(Number(td.dataset.r), Number(td.dataset.c));
    });
    gridEl.addEventListener('dblclick', function (e) {
      var td = e.target.closest('td');
      if (td) startEdit(td);
    });
    document.addEventListener('keydown', function (e) {
      if (!selected || editingTd) return;
      if (document.activeElement === titleInput || document.activeElement === fxInput) return;
      var td = tdRefs[selected.r][selected.c];
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        startEdit(td);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        applyLocal(selected.r, selected.c, '');
      } else if (e.key === 'ArrowUp' && selected.r > 0) { e.preventDefault(); select(selected.r - 1, selected.c); }
      else if (e.key === 'ArrowDown' && selected.r < ROWS - 1) { e.preventDefault(); select(selected.r + 1, selected.c); }
      else if (e.key === 'ArrowLeft' && selected.c > 0) { e.preventDefault(); select(selected.r, selected.c - 1); }
      else if (e.key === 'ArrowRight' && selected.c < COLS - 1) { e.preventDefault(); select(selected.r, selected.c + 1); }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startEdit(td, e.key);
      }
    });
    fxInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && selected) {
        e.preventDefault();
        applyLocal(selected.r, selected.c, fxInput.value);
      }
    });

    /* ---------------- title ---------------- */
    var titleTimer = null;
    titleInput.addEventListener('input', function () {
      document.title = (titleInput.value || '未命名表格') + ' · 在线表格';
      clearTimeout(titleTimer);
      titleTimer = setTimeout(function () {
        send({ type: 'title', title: titleInput.value });
      }, 400);
    });

    /* ---------------- networking ---------------- */
    function send(obj) {
      if (connected && ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
    }
    function connect() {
      setStatus('offline', '连接中…');
      synced = false;
      ws = new WebSocket(cfg.wsUrl);
      ws.onopen = function () { connected = true; };
      ws.onmessage = function (event) {
        var msg;
        try { msg = JSON.parse(event.data); } catch (e) { return; }
        if (msg.type === 'init') {
          myId = msg.you.id;
          clients = msg.clients;
          cells = msg.cells || {};
          rev = msg.rev || 0;
          renderAll();
          titleInput.value = msg.title || '';
          document.title = (msg.title || '未命名表格') + ' · 在线表格';
          renderCollabs();
          updateRev();
          setStatus('online', '已连接 · 实时同步');
          synced = true;
          backoff = 1000;
        } else if (msg.type === 'cell') {
          if (msg.value === '') delete cells[key(msg.r, msg.c)];
          else cells[key(msg.r, msg.c)] = msg.value;
          rev = msg.rev;
          renderCell(msg.r, msg.c);
          renderFormulas();
          updateRev();
          if (selected && selected.r === msg.r && selected.c === msg.c && !editingTd) {
            fxInput.value = msg.value;
          }
        } else if (msg.type === 'title') {
          if (!msg.by || msg.by.id !== myId) {
            if (document.activeElement !== titleInput) titleInput.value = msg.title;
            document.title = (msg.title || '未命名表格') + ' · 在线表格';
          }
        } else if (msg.type === 'presence') {
          clients = msg.clients;
          renderCollabs();
        } else if (msg.type === 'error') {
          toast(msg.message || '同步出错');
        }
      };
      ws.onclose = function () {
        connected = false;
        synced = false;
        setStatus('offline', '离线 · ' + Math.round(backoff / 1000) + 's 后重连');
        setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 10000);
      };
      ws.onerror = function () { ws.close(); };
    }

    buildGrid();
    select(0, 0);
    connect();
  });
})();
`;

export const MEET_JS = `
(function () {
  'use strict';
  var cfg = window.MEET_CFG;
  var prefix = cfg.prefix;
  var videosEl = document.getElementById('videos');
  var listEl = document.getElementById('chat-list');
  var inputEl = document.getElementById('chat-input');
  var statusEl = document.getElementById('status');
  var collabsEl = document.getElementById('collabs');
  var warnEl = document.getElementById('media-warning');
  var btnAudio = document.getElementById('btn-audio');
  var btnVideo = document.getElementById('btn-video');

  var ws = null;
  var connected = false;
  var backoff = 1000;
  var myId = null;
  var clients = [];
  var seenIds = {};
  var pcs = {}; // peerId -> { pc, polite, makingOffer, ignoreOffer }
  var tiles = {}; // peerId -> tile element
  var localStream = null;
  var audioOn = false;
  var videoOn = false;

  var rtcOk = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection);
  if (!window.WebSocket) {
    warnEl.textContent = '当前浏览器不支持 WebSocket，无法使用会议功能，请更换现代浏览器。';
    warnEl.style.display = '';
    return;
  }
  if (!rtcOk) {
    warnEl.textContent = '当前浏览器不支持音视频通话（缺少 getUserMedia/RTCPeerConnection），已降级为仅文字聊天。';
    warnEl.style.display = '';
    btnAudio.disabled = true;
    btnVideo.disabled = true;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
  function setStatus(state, label) {
    statusEl.className = 'status' + (state === 'offline' ? ' offline' : '');
    statusEl.querySelector('span').textContent = label;
  }
  function renderCollabs() {
    var html = '';
    for (var i = 0; i < clients.length; i++) {
      var c = clients[i];
      html += '<div class="avatar' + (c.id === myId ? ' me' : '') + '" style="background:' + c.color + '" title="' +
        esc(c.name) + (c.id === myId ? '（我）' : '') + '">' + esc(c.name.slice(-2, -1)) + '</div>';
    }
    collabsEl.innerHTML = html;
  }
  function clientById(id) {
    for (var i = 0; i < clients.length; i++) if (clients[i].id === id) return clients[i];
    return null;
  }

  /* ---------------- chat ---------------- */
  function fmtTime(ts) {
    var d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function appendMsg(m) {
    if (seenIds[m.id]) return;
    seenIds[m.id] = true;
    var empty = listEl.querySelector('.chat-list-empty');
    if (empty) empty.remove();
    var div = document.createElement('div');
    div.innerHTML = '<div class="chat-msg"><div class="chat-bubble' + (m.by && m.by.id === myId ? ' mine' : '') + '">' +
      '<div class="chat-meta"><span>' + esc(m.by ? m.by.name : '匿名') + '</span><span>' + fmtTime(m.ts) + '</span></div>' +
      '<div class="chat-text">' + esc(m.text || '') + '</div></div></div>';
    listEl.appendChild(div.firstChild);
    listEl.scrollTop = listEl.scrollHeight;
  }
  function sendText() {
    var text = inputEl.value;
    if (!text.trim()) return;
    send({ type: 'chat', text: text });
    inputEl.value = '';
    inputEl.focus();
  }
  document.getElementById('btn-send').addEventListener('click', sendText);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  });

  /* ---------------- video tiles ---------------- */
  function makeTile(id, label, color) {
    if (tiles[id]) return tiles[id];
    var tile = document.createElement('div');
    tile.className = 'video-tile';
    tile.innerHTML = '<div class="video-placeholder">📷 未开启视频</div>' +
      '<div class="video-label" style="border-left:3px solid ' + (color || '#888') + '">' + esc(label) + '</div>';
    videosEl.appendChild(tile);
    tiles[id] = tile;
    return tile;
  }
  function attachStream(id, stream) {
    var tile = tiles[id];
    if (!tile) return;
    var video = tile.querySelector('video');
    if (!video) {
      tile.querySelector('.video-placeholder').remove();
      video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      if (id === 'me') video.muted = true;
      tile.insertBefore(video, tile.firstChild);
    }
    video.srcObject = stream;
  }
  function removePeer(peerId) {
    var ctx = pcs[peerId];
    if (ctx) {
      try { ctx.pc.close(); } catch (e) { /* ignore */ }
      delete pcs[peerId];
    }
    if (tiles[peerId]) {
      tiles[peerId].remove();
      delete tiles[peerId];
    }
  }

  /* ---------------- WebRTC mesh (perfect negotiation) ---------------- */
  function sendSignal(to, data) {
    send({ type: 'signal', to: to, data: data });
  }
  function ensurePc(peerId) {
    if (pcs[peerId]) return pcs[peerId];
    var ctx = {
      pc: new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }),
      polite: myId < peerId,
      makingOffer: false,
      ignoreOffer: false
    };
    pcs[peerId] = ctx;
    var pc = ctx.pc;
    if (localStream) {
      localStream.getTracks().forEach(function (t) { pc.addTrack(t, localStream); });
    }
    pc.onicecandidate = function (e) {
      if (e.candidate) sendSignal(peerId, { candidate: e.candidate });
    };
    pc.ontrack = function (e) {
      var peer = clientById(peerId);
      makeTile(peerId, peer ? peer.name : '参会者', peer ? peer.color : '#888');
      attachStream(peerId, e.streams[0]);
    };
    pc.onconnectionstatechange = function () {
      if (pc.connectionState === 'failed') {
        // mesh link failed (likely symmetric NAT without TURN): tell the user
        toast('与一位参会者的连接失败：对方网络可能需要 TURN 中继（本平台不支持）');
      }
    };
    pc.onnegotiationneeded = function () {
      ctx.makingOffer = true;
      pc.setLocalDescription()
        .then(function () { sendSignal(peerId, { description: pc.localDescription }); })
        .catch(function () { /* ignore */ })
        .finally(function () { ctx.makingOffer = false; });
    };
    return ctx;
  }
  function onSignal(from, data) {
    if (!rtcOk || !data) return;
    var ctx = ensurePc(from);
    var pc = ctx.pc;
    (async function () {
      try {
        if (data.description) {
          var offerCollision = data.description.type === 'offer' &&
            (ctx.makingOffer || pc.signalingState !== 'stable');
          ctx.ignoreOffer = !ctx.polite && offerCollision;
          if (ctx.ignoreOffer) return;
          await pc.setRemoteDescription(data.description);
          if (data.description.type === 'offer') {
            await pc.setLocalDescription();
            sendSignal(from, { description: pc.localDescription });
          }
        } else if (data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            if (!ctx.ignoreOffer) throw err;
          }
        }
      } catch (err) {
        console.warn('signal error', err);
      }
    })();
  }
  function syncPeers() {
    // Create connections towards everyone once we have media; peers without
    // media create theirs when our offer arrives.
    if (!localStream || !rtcOk) return;
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id !== myId) ensurePc(clients[i].id);
    }
  }

  /* ---------------- Cloudflare Realtime SFU (preferred when configured) -----
   * Media is relayed through Cloudflare's SFU: we publish local tracks and
   * pull every other participant's tracks over one RTCPeerConnection.
   * The Worker proxies the Realtime HTTPS API (App Secret stays server-side);
   * MeetRoom presence carries each client's published track list.
   * Any failure falls back to the mesh P2P path above.
   */
  var sfuOn = !!cfg.sfu && rtcOk;
  var sfuPc = null;
  var sfuSessionId = null;
  var sfuFailed = false;
  var sfuSubs = {};        // "sessionId/trackName" -> true (already pulled)
  var sfuMidMap = {};      // mid -> meet client id (for ontrack tiles)
  var sfuSessionPeer = {}; // sfu sessionId -> meet client id
  var sfuTag = null;       // unique track-name prefix per publish

  function sfuApi(path, method, body) {
    return fetch(prefix + '/meet/' + cfg.meetId + '/sfu' + path, {
      method: method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.message || d.errorDescription || d.error || d.errorCode || ('HTTP ' + r.status));
        return d;
      });
    });
  }

  function iceGathered(pc) {
    // The Realtime HTTPS API does not trickle; send SDP with candidates.
    if (pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise(function (resolve) {
      var timer = setTimeout(done, 3000);
      function done() {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
      function check() { if (pc.iceGatheringState === 'complete') done(); }
      pc.addEventListener('icegatheringstatechange', check);
    });
  }

  function sfuConnected(pc) {
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        cleanup();
        reject(new Error('Cloudflare SFU ICE connection timeout (' + pc.iceConnectionState + ')'));
      }, 10000);
      function cleanup() {
        clearTimeout(timer);
        pc.removeEventListener('iceconnectionstatechange', check);
      }
      function check() {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          cleanup();
          resolve();
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          cleanup();
          reject(new Error('Cloudflare SFU ICE connection ' + pc.iceConnectionState));
        }
      }
      pc.addEventListener('iceconnectionstatechange', check);
    });
  }

  function sfuFail(err) {
    console.warn('sfu failed, falling back to mesh', err);
    sfuOn = false;
    sfuFailed = true;
    if (sfuPc) {
      try { sfuPc.close(); } catch (e) { /* ignore */ }
      sfuPc = null;
    }
    toast('Cloudflare SFU 连接失败，已回退到浏览器点对点模式');
    syncPeers();
  }

  function sfuAddLocalTracks(stream) {
    if (!stream || !sfuPc) return;
    stream.getTracks().forEach(function (track) {
      var exists = sfuPc.getSenders().some(function (sender) { return sender.track === track; });
      if (!exists) sfuPc.addTrack(track, stream);
    });
  }

  function sfuEnsure(stream) {
    if (sfuSessionId) {
      sfuAddLocalTracks(stream);
      return Promise.resolve();
    }
    sfuPc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] });
    sfuPc.ontrack = function (e) {
      var mid = e.transceiver ? e.transceiver.mid : null;
      var clientId = mid !== null ? sfuMidMap[mid] : undefined;
      if (clientId === undefined || clientId === null) return;
      var peer = clientById(clientId);
      makeTile('p' + clientId, peer ? peer.name : '参会者', peer ? peer.color : '#888');
      attachStream('p' + clientId, (e.streams && e.streams[0]) || new MediaStream([e.track]));
    };
    if (stream) {
      sfuAddLocalTracks(stream);
    } else {
      sfuPc.addTransceiver('audio', { direction: 'recvonly' });
      sfuPc.addTransceiver('video', { direction: 'recvonly' });
    }
    return sfuPc.createOffer().then(function (offer) {
      return sfuPc.setLocalDescription(offer);
    }).then(function () {
      return iceGathered(sfuPc);
    }).then(function () {
      return sfuApi('/session', 'POST', {
        sessionDescription: { type: sfuPc.localDescription.type, sdp: sfuPc.localDescription.sdp }
      });
    }).then(function (d) {
      if (d.errorCode) throw new Error(d.errorDescription || d.errorCode);
      sfuSessionId = d.sessionId;
      return sfuPc.setRemoteDescription(d.sessionDescription).then(function () {
        return sfuConnected(sfuPc);
      });
    });
  }

  function localTransceivers() {
    return sfuPc.getTransceivers().filter(function (t) { return t.sender && t.sender.track; });
  }

  function sfuPublish(stream) {
    if (myId === null) return Promise.reject(new Error('not initialized'));
    var existingSession = !!sfuSessionId;
    return sfuEnsure(stream).then(function () {
      if (!existingSession) return;
      return sfuPc.createOffer()
        .then(function (offer) { return sfuPc.setLocalDescription(offer); })
        .then(function () { return iceGathered(sfuPc); });
    }).then(function () {
      sfuTag = 'm' + cfg.meetId + '-c' + myId + '-' + Math.random().toString(36).slice(2, 8);
      var tracks = localTransceivers().map(function (t) {
        return { location: 'local', mid: t.mid, trackName: sfuTag + '-' + t.sender.track.kind };
      });
      var payload = { tracks: tracks };
      if (existingSession) {
        payload.sessionDescription = { type: sfuPc.localDescription.type, sdp: sfuPc.localDescription.sdp };
      }
      return sfuApi('/sessions/' + sfuSessionId + '/tracks', 'POST', payload);
    }).then(function (res) {
      if (res.errorCode) throw new Error(res.errorDescription || res.errorCode);
      var failedTrack = (res.tracks || []).find(function (t) { return t.errorCode; });
      if (failedTrack) throw new Error(failedTrack.errorDescription || failedTrack.errorCode);
      if (!res.sessionDescription) return;
      if (res.sessionDescription.type !== 'offer') throw new Error('unexpected SFU session description');
      return sfuPc.setRemoteDescription(res.sessionDescription)
        .then(function () { return sfuPc.createAnswer(); })
        .then(function (answer) { return sfuPc.setLocalDescription(answer); })
        .then(function () { return iceGathered(sfuPc); })
        .then(function () {
          return sfuApi('/sessions/' + sfuSessionId + '/renegotiate', 'PUT', {
            sessionDescription: { type: sfuPc.localDescription.type, sdp: sfuPc.localDescription.sdp }
          });
        });
    }).then(function () {
      // Announce the published tracks so peers can pull them.
      var published = localTransceivers().map(function (t) {
        return { sessionId: sfuSessionId, trackName: sfuTag + '-' + t.sender.track.kind, kind: t.sender.track.kind };
      });
      send({ type: 'sfu-tracks', tracks: published });
    });
  }

  function sfuSyncSubscriptions() {
    if (!sfuOn || sfuFailed || !sfuSessionId) return Promise.resolve();
    var want = [];
    for (var i = 0; i < clients.length; i++) {
      var c = clients[i];
      if (c.id === myId || !c.sfuTracks) continue;
      for (var j = 0; j < c.sfuTracks.length; j++) {
        var t = c.sfuTracks[j];
        var key = t.sessionId + '/' + t.trackName;
        if (sfuSubs[key]) continue;
        sfuSubs[key] = true; // mark first to avoid duplicate pulls
        sfuSessionPeer[t.sessionId] = c.id;
        want.push({ location: 'remote', sessionId: t.sessionId, trackName: t.trackName });
      }
    }
    if (!want.length) return Promise.resolve();
    return sfuApi('/sessions/' + sfuSessionId + '/tracks', 'POST', { tracks: want })
      .then(function (res) {
        if (res.errorCode) throw new Error(res.errorDescription || res.errorCode);
        var retry = false;
        (res.tracks || []).forEach(function (t) {
          var key = t.sessionId + '/' + t.trackName;
          if (t.errorCode) {
            delete sfuSubs[key];
            if (t.errorCode === 'empty_track_error') {
              retry = true;
              return;
            }
            throw new Error(t.errorDescription || t.errorCode);
          }
          var peerId = sfuSessionPeer[t.sessionId];
          if (t.mid !== undefined && t.mid !== null && peerId !== undefined) sfuMidMap[t.mid] = peerId;
        });
        if (retry) {
          setTimeout(sfuMaybeSync, 1000);
          return;
        }
        if (!res.sessionDescription) return;
        // Remote track pulls come back as an offer we must answer.
        return sfuPc.setRemoteDescription(res.sessionDescription)
          .then(function () { return sfuPc.createAnswer(); })
          .then(function (answer) { return sfuPc.setLocalDescription(answer); })
          .then(function () { return iceGathered(sfuPc); })
          .then(function () {
            return sfuApi('/sessions/' + sfuSessionId + '/renegotiate', 'PUT', {
              sessionDescription: { type: sfuPc.localDescription.type, sdp: sfuPc.localDescription.sdp }
            });
          });
      })
      .catch(sfuFail);
  }

  function sfuMaybeSync() {
    if (!sfuOn || sfuFailed) return;
    var any = false;
    for (var i = 0; i < clients.length; i++) {
      var c = clients[i];
      if (c.id !== myId && c.sfuTracks && c.sfuTracks.length) { any = true; break; }
    }
    if (!any) return;
    sfuEnsure().then(sfuSyncSubscriptions).catch(sfuFail);
  }

  function removeSfuPeer(clientId) {
    var key = 'p' + clientId;
    if (tiles[key]) {
      tiles[key].remove();
      delete tiles[key];
    }
  }

  function sfuClose() {
    // Best-effort cleanup of our published tracks on page unload.
    if (!sfuSessionId || !sfuPc) return;
    try {
      var tracks = localTransceivers().map(function (t) {
        return { location: 'local', mid: t.mid, trackName: sfuTag + '-' + t.sender.track.kind };
      });
      if (!tracks.length) return;
      fetch(prefix + '/meet/' + cfg.meetId + '/sfu/sessions/' + sfuSessionId + '/tracks/close', {
        method: 'PUT',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tracks: tracks })
      });
    } catch (e) { /* ignore */ }
  }

  function pushMediaState() {
    send({ type: 'media', audio: audioOn, video: videoOn });
    btnAudio.textContent = audioOn ? '🎙 关闭麦克风' : '🎙 开启麦克风';
    btnVideo.textContent = videoOn ? '📷 关闭摄像头' : '📷 开启摄像头';
  }
  function acquireMedia() {
    if (localStream) return Promise.resolve(localStream);
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(function (stream) {
        localStream = stream;
        audioOn = true;
        videoOn = true;
        makeTile('me', '我', '#4f7cff');
        attachStream('me', stream);
        pushMediaState();
        if (sfuOn) {
          return sfuPublish(stream)
            .then(sfuSyncSubscriptions)
            .catch(function (err) { sfuFail(err); })
            .then(function () { return stream; });
        }
        syncPeers();
        return stream;
      })
      .catch(function (err) {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
          toast('音视频需要 HTTPS 或 localhost 环境');
        } else if (err && err.name === 'NotAllowedError') {
          toast('已拒绝摄像头/麦克风权限，请在浏览器地址栏允许后重试');
        } else if (err && err.name === 'NotFoundError') {
          toast('未检测到摄像头/麦克风设备');
        } else {
          toast('无法开启音视频：' + (err && err.name ? err.name : '未知错误'));
        }
        return null;
      });
  }
  btnAudio.addEventListener('click', function () {
    acquireMedia().then(function (stream) {
      if (!stream) return;
      audioOn = !audioOn;
      stream.getAudioTracks().forEach(function (t) { t.enabled = audioOn; });
      pushMediaState();
    });
  });
  btnVideo.addEventListener('click', function () {
    acquireMedia().then(function (stream) {
      if (!stream) return;
      videoOn = !videoOn;
      stream.getVideoTracks().forEach(function (t) { t.enabled = videoOn; });
      pushMediaState();
    });
  });
  window.addEventListener('beforeunload', function () {
    sfuClose();
    Object.keys(pcs).forEach(removePeer);
    if (localStream) localStream.getTracks().forEach(function (t) { t.stop(); });
  });

  /* ---------------- networking ---------------- */
  function send(obj) {
    if (connected && ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }
  function connect() {
    setStatus('offline', '连接中…');
    ws = new WebSocket(cfg.wsUrl);
    ws.onopen = function () { connected = true; };
    ws.onmessage = function (event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (msg.type === 'init') {
        myId = msg.you.id;
        clients = msg.clients;
        (msg.messages || []).forEach(appendMsg);
        if (!listEl.children.length) {
          listEl.innerHTML = '<div class="chat-list-empty">会议聊天，消息不保存</div>';
        }
        renderCollabs();
        setStatus('online', '已连接');
        backoff = 1000;
      } else if (msg.type === 'chat') {
        appendMsg(msg.msg);
      } else if (msg.type === 'presence') {
        var before = {};
        clients.forEach(function (c) { before[c.id] = true; });
        clients = msg.clients;
        var now = {};
        clients.forEach(function (c) { now[c.id] = true; });
        Object.keys(before).forEach(function (id) {
          if (!now[id] && Number(id) !== myId) {
            removePeer(Number(id));
            removeSfuPeer(Number(id));
          }
        });
        renderCollabs();
        if (sfuOn && !sfuFailed) sfuMaybeSync();
        else syncPeers();
      } else if (msg.type === 'signal') {
        onSignal(msg.from, msg.data);
      }
    };
    ws.onclose = function () {
      connected = false;
      Object.keys(pcs).forEach(removePeer);
      setStatus('offline', '离线 · ' + Math.round(backoff / 1000) + 's 后重连');
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 10000);
    };
    ws.onerror = function () { ws.close(); };
  }
  connect();
})();
`;
