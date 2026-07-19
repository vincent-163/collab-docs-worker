/* E2E test against a running collab-docs worker (default http://127.0.0.1:8787) */
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

const res = await fetch(`${BASE}/api/v1/documents`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "E2E 测试文档", content: "hello world" })
});
check(res.status === 201, "create returns 201");
const created = await res.json();
const id = created.document.document_id;
check(id && created.edit_url.includes(`/d/${id}`), `created doc ${id}`);
check(created.document.revision === 1, "initial content becomes revision 1");

const meta = await (await fetch(`${BASE}/api/v1/documents/${id}`)).json();
check(meta.document.title === "E2E 测试文档", "meta title matches");
check(meta.document.chars === 11, "meta chars matches");

const content = await (await fetch(`${BASE}/api/v1/documents/${id}/content`)).json();
check(content.text === "hello world", "plain text content matches");
check(Array.isArray(content.delta.ops), "delta content present");

const patched = await fetch(`${BASE}/api/v1/documents/${id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "改名后的文档" })
});
check(patched.status === 200 && (await patched.json()).document.title === "改名后的文档", "PATCH title works");

// --- WebSocket collaboration between two clients ---
const wsUrl = `${BASE.replace("http", "ws")}/d/${id}/ws`;

function client(name) {
  const ws = new WebSocket(wsUrl);
  const c = {
    name, ws,
    doc: new Delta(), rev: null, id: null,
    pending: null, // { opId, delta }
    opSeq: 0,
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
        }
      };
      ws.onerror = reject;
    })
  };
  return c;
}

const a = client("A");
const b = client("B");
await Promise.all([a.ready, b.ready]);
check(a.id !== b.id, "clients have distinct ids");

// A inserts "A:" at position 0; B concurrently appends " :B" at position 11.
a.sendDelta(new Delta().insert("A:"));
b.sendDelta(new Delta().retain(11).insert(" :B"));

await waitFor(() => a.pending === null && b.pending === null, "both ops acknowledged");
console.log("ok: both ops acknowledged");
await waitFor(() => a.rev >= 3 && b.rev >= 3, "both clients reached rev 3");

const final = await (await fetch(`${BASE}/api/v1/documents/${id}/content`)).json();
console.log("server:", JSON.stringify(final.text), "rev", final.revision);
check(final.revision === 3, "revision advanced to 3");
check(final.text === "A:hello world :B", "server text correct");
assert.deepEqual(a.doc.ops, final.delta.ops, "client A converged with server");
assert.deepEqual(b.doc.ops, final.delta.ops, "client B converged with server");

// --- rich text: bold + color + image ---
a.sendDelta(new Delta().retain(16).insert(" 加粗红字", { bold: true, color: "#e74c3c" }));
await waitFor(() => a.pending === null, "formatted op acked");
await new Promise((r) => setTimeout(r, 1500));
let rich = await (await fetch(`${BASE}/api/v1/documents/${id}/content`)).json();
check(rich.delta.ops.some((op) => op.attributes?.bold && op.attributes?.color === "#e74c3c"), "bold+color attributes stored");
assert.deepEqual(b.doc.ops, rich.delta.ops, "client B received formatted insert");

b.sendDelta(new Delta().retain(new Delta(rich.delta.ops).length() - 1).insert({ image: "https://example.com/pic.png" }));
await waitFor(() => b.pending === null, "image op acked");
await new Promise((r) => setTimeout(r, 1500));
rich = await (await fetch(`${BASE}/api/v1/documents/${id}/content`)).json();
check(rich.delta.ops.some((op) => op.insert?.image === "https://example.com/pic.png"), "image embed stored");
check(rich.text.includes("[图片]"), "plain text marks image");

// --- evil input is sanitized ---
a.sendDelta(new Delta().retain(1).insert("x", { link: "javascript:alert(1)" }));
await waitFor(() => a.pending === null, "evil op acked");
await new Promise((r) => setTimeout(r, 1500));
rich = await (await fetch(`${BASE}/api/v1/documents/${id}/content`)).json();
check(!JSON.stringify(rich.delta.ops).includes("javascript:"), "javascript: links stripped");

const collabs = await (await fetch(`${BASE}/api/v1/documents/${id}/collaborators`)).json();
check(collabs.collaborators.length === 2, "presence shows 2 collaborators");

const revs = await (await fetch(`${BASE}/api/v1/documents/${id}/revisions`)).json();
check(revs.revisions.length >= 5, `revisions list has entries (${revs.revisions.length})`);
check(revs.revisions[0].revision === revs.revision, "revisions newest-first");

const old = await (await fetch(`${BASE}/api/v1/documents/${id}/content?rev=1`)).json();
check(old.text === "hello world", "historical revision content reconstructable");

const exportRes = await fetch(`${BASE}/api/v1/documents/${id}/export?format=markdown`);
const exported = await exportRes.text();
check(exported.startsWith("# 改名后的文档"), "markdown export has title heading");
check(exported.includes("** 加粗红字**") && exported.includes("![图片](https://example.com/pic.png)"), "markdown export renders formats");

// editor page
const page = await fetch(`${BASE}/d/${id}`);
check(page.status === 200 && (await page.text()).includes("quill"), "editor page renders with quill");

const missing = await fetch(`${BASE}/d/zzzzzz`);
check(missing.status === 404, "unknown doc id 404s");

a.ws.close();
b.ws.close();
console.log("\nALL E2E CHECKS PASSED");
process.exit(0);
