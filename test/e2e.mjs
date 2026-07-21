/* E2E test for collab-docs v3 against a running worker (default http://127.0.0.1:8787) */
import assert from "node:assert/strict";
import Delta from "quill-delta";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";

function check(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

async function waitFor(fn, msg, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  console.error("FAIL (timeout):", msg);
  process.exit(1);
}

const cookiesOf = (res) =>
  (res.headers.getSetCookie ? res.headers.getSetCookie() : [])
    .map((c) => c.split(";")[0])
    .join("; ");

const authed = (cookie, extra = {}) => ({ ...extra, headers: { cookie, ...(extra.headers || {}) } });
const bearer = (key) => ({ headers: { authorization: `Bearer ${key}` } });

async function register(email, password) {
  return fetch(`${BASE}/register`, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({ email, password })
  });
}

/* ---------- health & auth gates ---------- */
const health = await (await fetch(`${BASE}/health`)).json();
check(health.ok === true, "health endpoint");

check((await fetch(`${BASE}/api/v1/documents`, { method: "POST" })).status === 401, "anonymous API create rejected");
check((await fetch(`${BASE}/app/state`)).status === 401, "anonymous dashboard state rejected");
{
  const res = await fetch(`${BASE}/app`, { redirect: "manual" });
  check(res.status === 303 && res.headers.get("location").endsWith("/login"), "anonymous /app redirects to login");
}

/* ---------- register / login ---------- */
const run = Date.now().toString(36);
const emailA = `e2e-a-${run}@example.com`;
const emailB = `e2e-b-${run}@example.com`;
const PASS = "e2e-password-123";

const regA = await register(emailA, PASS);
check(regA.status === 303, "register A redirects");
const cookieA = cookiesOf(regA);
check(cookieA.includes("cd_session="), "register sets session cookie");

check((await register(emailA, PASS)).status === 409, "duplicate register rejected");

const regB = await register(emailB, PASS);
const cookieB = cookiesOf(regB);
check(regB.status === 303 && cookieB.includes("cd_session="), "register B works");

{
  const login = await fetch(`${BASE}/login`, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({ email: emailA, password: PASS })
  });
  check(login.status === 303 && cookiesOf(login).includes("cd_session="), "login A works");
  const bad = await fetch(`${BASE}/login`, {
    method: "POST",
    body: new URLSearchParams({ email: emailA, password: "wrong-password" })
  });
  check(bad.status === 401, "wrong password rejected");
}

/* ---------- documents (session) ---------- */
const created = await (await fetch(`${BASE}/api/v1/documents`, authed(cookieA, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "E2E 测试文档", content: "hello world" })
}))).json();
const id = created.document.document_id;
check(id && created.edit_url.includes(`/d/${id}`), `created doc ${id}`);
check(created.document.revision === 1, "initial content becomes revision 1");

const list = await (await fetch(`${BASE}/api/v1/documents`, authed(cookieA))).json();
check(list.documents.some((d) => d.document_id === id), "doc listed for owner");

check((await fetch(`${BASE}/api/v1/documents/${id}`, authed(cookieB))).status === 403, "other user API access forbidden");
{
  const page = await fetch(`${BASE}/d/${id}`, authed(cookieB));
  check(page.status === 403, "other user editor access forbidden");
}
check((await fetch(`${BASE}/d/${id}`, authed(cookieA))).status === 200, "owner editor page renders");

const titleInfo = await (await fetch(`${BASE}/d/${id}/title`, authed(cookieA))).json();
check(titleInfo.title === "E2E 测试文档", "doc title lookup works");

const patched = await fetch(`${BASE}/api/v1/documents/${id}`, authed(cookieA, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "改名后的文档" })
}));
check(patched.status === 200 && (await patched.json()).document.title === "改名后的文档", "PATCH title works");

/* ---------- realtime collaboration (two WS clients, owner session) ---------- */
const wsBase = BASE.replace("http", "ws");

function client(name, url, cookie) {
  const ws = new WebSocket(url, { headers: { cookie } });
  const c = {
    name, ws,
    doc: new Delta(), rev: null, id: null,
    pending: null, opSeq: 0, lastError: null,
    sendDelta(delta) {
      c.pending = { opId: ++c.opSeq, delta };
      c.doc = c.doc.compose(delta);
      ws.send(JSON.stringify({ type: "op", opId: c.pending.opId, baseRev: c.rev, delta: { ops: delta.ops } }));
    },
    ready: new Promise((resolve, reject) => {
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "init") {
          c.doc = new Delta(msg.delta.ops); c.rev = msg.rev; c.id = msg.you.id;
          resolve();
        } else if (msg.type === "op") {
          const isAck = msg.by && msg.by.id === c.id && c.pending && msg.opId === c.pending.opId;
          if (isAck) {
            c.pending = null;
          } else {
            let R = new Delta(msg.delta.ops);
            if (c.pending) {
              const newPending = R.transform(c.pending.delta, true);
              R = c.pending.delta.transform(R, false);
              c.pending.delta = newPending;
            }
            c.doc = c.doc.compose(R);
          }
          c.rev = Math.max(c.rev, msg.rev);
        } else if (msg.type === "error") {
          c.lastError = msg;
        }
      };
      ws.onerror = reject;
    })
  };
  return c;
}

const a = client("A", `${wsBase}/d/${id}/ws`, cookieA);
const b = client("B", `${wsBase}/d/${id}/ws`, cookieA);
await Promise.all([a.ready, b.ready]);
check(a.id !== b.id, "clients have distinct ids");

a.sendDelta(new Delta().insert("A:"));
b.sendDelta(new Delta().retain(11).insert(" :B"));
await waitFor(() => a.pending === null && b.pending === null, "both ops acknowledged");
await waitFor(() => a.rev >= 3 && b.rev >= 3, "both clients reached rev 3");

const final = await (await fetch(`${BASE}/api/v1/documents/${id}/content`, authed(cookieA))).json();
check(final.revision === 3 && final.text === "A:hello world :B", "server converged");
assert.deepEqual(a.doc.ops, final.delta.ops, "client A converged with server");
assert.deepEqual(b.doc.ops, final.delta.ops, "client B converged with server");

a.sendDelta(new Delta().retain(16).insert(" 加粗红字", { bold: true, color: "#e74c3c" }));
await waitFor(() => a.pending === null, "formatted op acked");
await waitFor(async () => true, "settle", 1);
let rich = await (await fetch(`${BASE}/api/v1/documents/${id}/content`, authed(cookieA))).json();
check(rich.delta.ops.some((op) => op.attributes?.bold && op.attributes?.color === "#e74c3c"), "bold+color stored");
assert.deepEqual(b.doc.ops, rich.delta.ops, "client B received formatted insert");

a.sendDelta(new Delta().retain(1).insert("x", { link: "javascript:alert(1)" }));
await waitFor(() => a.pending === null, "evil op acked");
rich = await (await fetch(`${BASE}/api/v1/documents/${id}/content`, authed(cookieA))).json();
check(!JSON.stringify(rich.delta.ops).includes("javascript:"), "javascript: links stripped");

const revs = await (await fetch(`${BASE}/api/v1/documents/${id}/revisions`, authed(cookieA))).json();
check(revs.revisions.length >= 4, `revisions list has entries (${revs.revisions.length})`);

const old = await (await fetch(`${BASE}/api/v1/documents/${id}/content?rev=1`, authed(cookieA))).json();
check(old.text === "hello world", "historical revision reconstructable");

const exported = await (await fetch(`${BASE}/api/v1/documents/${id}/export?format=markdown`, authed(cookieA))).text();
check(exported.startsWith("# 改名后的文档"), "markdown export has title heading");
check(exported.includes("** 加粗红字**"), "markdown export renders formats");

a.ws.close();
b.ws.close();

/* ---------- share links ---------- */
const shareRo = await (await fetch(`${BASE}/d/${id}/shares`, authed(cookieA, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ mode: "ro" })
}))).json();
check(shareRo.token && shareRo.url.includes("/s/"), "read-only share created");

const shareRw = await (await fetch(`${BASE}/d/${id}/shares`, authed(cookieA, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ mode: "rw", expiresIn: "week" })
}))).json();
check(shareRw.mode === "rw" && shareRw.expiresAt > Date.now(), "rw share with expiry created");

const shareList = await (await fetch(`${BASE}/d/${id}/shares`, authed(cookieA))).json();
check(shareList.shares.length === 2, "share list shows both links");
check((await fetch(`${BASE}/d/${id}/shares`, authed(cookieB))).status === 403, "non-owner cannot manage shares");

{
  const page = await fetch(`${BASE}/s/${shareRo.token}`, authed(cookieB));
  const html = await page.text();
  check(page.status === 200 && html.includes("只读"), "B opens ro share as read-only");
}
// B connects over the ro share and tries to edit -> rejected.
const bRo = client("B-ro", `${wsBase}/s/${shareRo.token}/ws`, cookieB);
await bRo.ready;
bRo.sendDelta(new Delta().retain(1).insert("HACK"));
await waitFor(() => bRo.lastError && bRo.lastError.code === "read_only", "ro share rejects edits");
check(bRo.pending !== null, "ro edit never acknowledged");
bRo.ws.close();

// B edits over the rw share.
const bRw = client("B-rw", `${wsBase}/s/${shareRw.token}/ws`, cookieB);
await bRw.ready;
const before = await (await fetch(`${BASE}/api/v1/documents/${id}/content`, authed(cookieA))).json();
bRw.sendDelta(new Delta().retain(new Delta(before.delta.ops).length() - 1).insert(" [B编辑]"));
await waitFor(() => bRw.pending === null, "rw share edit acknowledged");
const afterRw = await (await fetch(`${BASE}/api/v1/documents/${id}/content`, authed(cookieA))).json();
check(afterRw.text.includes("[B编辑]"), "rw share edit persisted");
bRw.ws.close();

// Delete the ro share -> link dies.
await fetch(`${BASE}/d/${id}/shares/${shareRo.token}`, authed(cookieA, { method: "DELETE" }));
check((await fetch(`${BASE}/s/${shareRo.token}`, authed(cookieB))).status === 404, "deleted share link 404s");

/* ---------- meetings: owner can end ---------- */
const meetRes = await fetch(`${BASE}/meet/new`, authed(cookieA, {
  method: "POST",
  redirect: "manual",
  body: new URLSearchParams({ name: "E2E 会议" })
}));
check(meetRes.status === 303, "meet created redirects");
const meetId = meetRes.headers.get("location").split("/").pop();

{
  const page = await fetch(`${BASE}/meet/${meetId}`, authed(cookieA));
  const body = await page.text();
  check(page.status === 200 && body.includes('id="btn-end"'), "owner sees end button");
}
{
  const page = await fetch(`${BASE}/meet/${meetId}`, authed(cookieB));
  const body = await page.text();
  check(page.status === 200 && !body.includes('id="btn-end"'), "guest does not see end button");
}
check((await fetch(`${BASE}/meet/${meetId}/end`, { method: "POST" })).status === 401, "anonymous end rejected");
check((await fetch(`${BASE}/meet/${meetId}/end`, authed(cookieB, { method: "POST" }))).status === 403, "non-owner end forbidden");
check((await fetch(`${BASE}/meet/noSuchMeet1/end`, authed(cookieA, { method: "POST" }))).status === 404, "end of unknown meeting 404s");

// B is connected over WS when A ends the meeting.
const bMeet = new WebSocket(`${wsBase}/meet/${meetId}/ws`, { headers: { cookie: cookieB } });
const bMeetTypes = [];
const bMeetClosed = new Promise((resolve) => {
  bMeet.onclose = (e) => resolve({ code: e.code, reason: e.reason });
});
bMeet.onmessage = (e) => bMeetTypes.push(JSON.parse(e.data).type);
await waitFor(() => bMeetTypes.includes("init"), "B joined the meeting");

const ended1 = await (await fetch(`${BASE}/meet/${meetId}/end`, authed(cookieA, { method: "POST" }))).json();
check(ended1.ended_at > 0, "owner end returns ended_at");
const bClose = await bMeetClosed;
check(bMeetTypes.includes("ended"), "participant received ended broadcast");
check(bClose.code === 4000 && bClose.reason === "meeting_ended", "participant ws closed with 4000/meeting_ended");

const ended2 = await (await fetch(`${BASE}/meet/${meetId}/end`, authed(cookieA, { method: "POST" }))).json();
check(ended2.ended_at === ended1.ended_at, "ending twice is idempotent");

// Ended page: static 410 page, no meet.js, dashboard history lastAt untouched.
const stateBefore = await (await fetch(`${BASE}/app/state`, authed(cookieA))).json();
const meetLastAt = stateBefore.meets.find((m) => m.id === meetId)?.lastAt;
check(meetLastAt > 0, "meeting recorded in dashboard history");
{
  const page = await fetch(`${BASE}/meet/${meetId}`, authed(cookieA));
  const body = await page.text();
  check(page.status === 410 && body.includes("会议已结束") && !body.includes("meet.js"), "ended meeting page is a static 410 page");
}
{
  const stateAfter = await (await fetch(`${BASE}/app/state`, authed(cookieA))).json();
  check(stateAfter.meets.find((m) => m.id === meetId)?.lastAt === meetLastAt, "ended page does not touch history lastAt");
}

// A late WS join learns the terminal state immediately instead of reconnecting.
{
  const late = new WebSocket(`${wsBase}/meet/${meetId}/ws`, { headers: { cookie: cookieB } });
  const got = await new Promise((resolve, reject) => {
    const types = [];
    late.onmessage = (e) => types.push(JSON.parse(e.data).type);
    late.onerror = reject;
    late.onclose = (e) => resolve({ types, code: e.code });
  });
  check(got.types[0] === "ended" && got.code === 4000, "late joiner gets ended then 4000 close");
}

/* ---------- API keys ---------- */
const keyRes = await (await fetch(`${BASE}/app/apikeys`, authed(cookieA, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "e2e" })
}))).json();
check(keyRes.key && keyRes.key.startsWith("cdk_"), "api key created");

const keyList = await (await fetch(`${BASE}/api/v1/documents`, bearer(keyRes.key))).json();
check(keyList.documents.some((d) => d.document_id === id), "api key lists documents");

const keyDoc = await fetch(`${BASE}/api/v1/documents/${id}/content`, bearer(keyRes.key));
check(keyDoc.status === 200, "api key reads content");
check((await fetch(`${BASE}/api/v1/documents`, bearer("cdk_bad.bad"))).status === 401, "bad api key rejected");

const keyCreated = await fetch(`${BASE}/api/v1/documents`, {
  method: "POST",
  headers: { authorization: `Bearer ${keyRes.key}`, "content-type": "application/json" },
  body: JSON.stringify({ title: "API Key 文档", content: "via key" })
});
check(keyCreated.status === 201, "api key creates document");

/* ---------- images ---------- */
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
const form = new FormData();
form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
const imgRes = await fetch(`${BASE}/api/v1/images`, authed(cookieA, { method: "POST", body: form }));
check(imgRes.status === 201, "image uploaded");
const img = await imgRes.json();
check(img.url.includes("/img/"), "image url returned");
{
  const fetched = await fetch(`${BASE}${img.url.replace(/^\/docs/, "")}`);
  check(fetched.status === 200 && (await fetched.arrayBuffer()).byteLength === png.length, "image served publicly");
}
check((await fetch(`${BASE}/api/v1/images`, { method: "POST", body: form })).status === 401, "anonymous upload rejected");

/* ---------- dashboard state / folders ---------- */
const state = await (await fetch(`${BASE}/app/state`, authed(cookieA))).json();
check(state.balanceCents === 500, "signup gift balance $5");
check(state.bytesStored === png.length && state.imageCount === 1, "image usage tracked");
check(state.nodes.some((n) => n.type === "doc" && n.docId === id), "doc appears in knowledge tree");
check(state.apiKeys.some((k) => k.id === keyRes.id), "api key listed in state");

const folder = await (await fetch(`${BASE}/app/folders`, authed(cookieA, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "项目" })
}))).json();
check(folder.node && folder.node.type === "folder", "folder created");

const docNode = state.nodes.find((n) => n.type === "doc" && n.docId === id);
const moved = await fetch(`${BASE}/app/nodes/${docNode.id}`, authed(cookieA, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ parent: folder.node.id })
}));
check(moved.status === 200 && (await moved.json()).node.parent === folder.node.id, "doc moved into folder");

const renamed = await fetch(`${BASE}/app/nodes/${folder.node.id}`, authed(cookieA, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "项目集" })
}));
check(renamed.status === 200 && (await renamed.json()).node.name === "项目集", "folder renamed");

check((await fetch(`${BASE}/app/nodes/${folder.node.id}`, authed(cookieA, { method: "DELETE" }))).status === 200, "folder deleted");
{
  const after = await (await fetch(`${BASE}/app/state`, authed(cookieA))).json();
  const n = after.nodes.find((x) => x.id === docNode.id);
  check(n && n.parent === null, "doc fell back to root after folder deletion");
}

/* ---------- logout ---------- */
{
  const out = await fetch(`${BASE}/logout`, authed(cookieA, { method: "POST", redirect: "manual" }));
  check(out.status === 303, "logout redirects");
  const dead = await fetch(`${BASE}/app/state`, authed(cookieA));
  check(dead.status === 401, "old session invalid after logout");
}

console.log("\nALL E2E CHECKS PASSED");
process.exit(0);
