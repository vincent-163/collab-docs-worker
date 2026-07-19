/* E2E test against a running collab-docs worker (default http://127.0.0.1:8787) */
const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

function applyOps(text, ops) {
  for (const op of ops) {
    text = op.t === "ins" ? text.slice(0, op.p) + op.s + text.slice(op.p)
                          : text.slice(0, op.p) + text.slice(op.p + op.l);
  }
  return text;
}

// Minimal mirror of the browser client's OT transform (history wins ties).
function transformOp(x, y, yPriority) {
  if (y.t === "ins") {
    if (x.t === "ins") {
      if (y.p < x.p || (y.p === x.p && yPriority)) return { t: "ins", p: x.p + y.s.length, s: x.s };
      return x;
    }
    if (y.p <= x.p) return { t: "del", p: x.p + y.s.length, l: x.l };
    if (y.p < x.p + x.l) return { t: "del", p: x.p, l: x.l + y.s.length };
    return x;
  }
  const yEnd = y.p + y.l;
  if (x.t === "ins") {
    if (x.p > y.p) return { t: "ins", p: x.p - Math.min(y.l, x.p - y.p), s: x.s };
    return x;
  }
  const xEnd = x.p + x.l;
  if (yEnd <= x.p) return { t: "del", p: x.p - y.l, l: x.l };
  if (xEnd <= y.p) return x;
  const before = Math.max(0, Math.min(xEnd, y.p) - x.p);
  const after = Math.max(0, xEnd - Math.max(yEnd, x.p));
  return before + after === 0 ? null : { t: "del", p: Math.min(x.p, y.p), l: before + after };
}

function transformOps(ops, history, historyPriority = true) {
  let out = ops;
  for (const h of history) {
    const next = [];
    let against = h;
    for (const op of out) {
      const moved = transformOp(op, against, historyPriority);
      against = transformOp(against, op, !historyPriority) || against;
      if (moved) next.push(moved);
    }
    out = next;
  }
  return out;
}

const res = await fetch(`${BASE}/api/v1/documents`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "E2E 测试文档", content: "hello world" })
});
assert(res.status === 201, "create returns 201");
const created = await res.json();
const id = created.document.document_id;
assert(id && created.edit_url.includes(`/d/${id}`), `created doc ${id}`);
assert(created.document.revision === 1, "initial content becomes revision 1");

const meta = await (await fetch(`${BASE}/api/v1/documents/${id}`)).json();
assert(meta.document.title === "E2E 测试文档", "meta title matches");
assert(meta.document.chars === 11, "meta chars matches");

const content = await (await fetch(`${BASE}/api/v1/documents/${id}/content`)).json();
assert(content.content === "hello world", "content matches");

const patched = await fetch(`${BASE}/api/v1/documents/${id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "改名后的文档" })
});
assert(patched.status === 200 && (await patched.json()).document.title === "改名后的文档", "PATCH title works");

// --- WebSocket collaboration between two clients ---
const wsUrl = `${BASE.replace("http", "ws")}/d/${id}/ws`;

function client(name) {
  const ws = new WebSocket(wsUrl);
  const c = {
    name, ws,
    text: null, rev: null, id: null,
    pending: null, // { opId, ops } unacknowledged local op
    opSeq: 0,
    messages: [],
    sendOps(ops) {
      c.pending = { opId: ++c.opSeq, ops };
      c.text = applyOps(c.text, ops);
      ws.send(JSON.stringify({ type: "op", opId: c.pending.opId, baseRev: c.rev, ops }));
    },
    ready: new Promise((resolve, reject) => {
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        c.messages.push(msg);
        if (msg.type === "init") {
          c.text = msg.text; c.rev = msg.rev; c.id = msg.you.id;
          resolve();
        } else if (msg.type === "op") {
          const isAck = msg.by && msg.by.id === c.id && c.pending && msg.opId === c.pending.opId;
          if (isAck) {
            c.pending = null;
          } else {
            let serverOps = msg.ops;
            if (c.pending) {
              const overPending = transformOps(serverOps, c.pending.ops, false);
              c.pending.ops = transformOps(c.pending.ops, serverOps);
              serverOps = overPending;
            }
            c.text = applyOps(c.text, serverOps);
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
assert(a.text === "hello world" && b.text === "hello world", "both clients got init state");
assert(a.id !== b.id, "clients have distinct ids");

// A inserts at 0 based on rev 1
a.sendOps([{ t: "ins", p: 0, s: "A:" }]);

// B concurrently appends at end based on the same rev 1
b.sendOps([{ t: "ins", p: 11, s: " :B" }]);

await new Promise((r) => setTimeout(r, 1500));
assert(a.pending === null && b.pending === null, "both ops acknowledged");

const final = await (await fetch(`${BASE}/api/v1/documents/${id}/content`)).json();
console.log("server:", JSON.stringify(final.content), "rev", final.revision);
console.log("client A:", JSON.stringify(a.text), "client B:", JSON.stringify(b.text));
assert(a.text === final.content, "client A converged with server");
assert(b.text === final.content, "client B converged with server");
assert(final.revision === 3, "revision advanced to 3");

const collabs = await (await fetch(`${BASE}/api/v1/documents/${id}/collaborators`)).json();
assert(collabs.collaborators.length === 2, "presence shows 2 collaborators");

const revs = await (await fetch(`${BASE}/api/v1/documents/${id}/revisions`)).json();
assert(revs.revisions.length === 3, `revisions list has 3 entries (${revs.revisions.length})`);
assert(revs.revisions[0].revision === 3, "revisions newest-first");

const old = await (await fetch(`${BASE}/api/v1/documents/${id}/content?rev=1`)).json();
assert(old.content === "hello world", "historical revision content reconstructable");

const exportRes = await fetch(`${BASE}/api/v1/documents/${id}/export?format=markdown`);
const exported = await exportRes.text();
assert(exported.startsWith("# 改名后的文档"), "markdown export has title heading");

// editor page
const page = await fetch(`${BASE}/d/${id}`);
assert(page.status === 200 && (await page.text()).includes("COLLAB_CFG"), "editor page renders");

const missing = await fetch(`${BASE}/d/zzzzzz`);
assert(missing.status === 404, "unknown doc id 404s");

a.ws.close();
b.ws.close();
console.log("\nALL E2E CHECKS PASSED");
process.exit(0);
