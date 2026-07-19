import { DurableObject } from "cloudflare:workers";
import Delta from "quill-delta";
import { deltaToText } from "./delta-export.js";
import { sanitizeDelta, summarizeDelta } from "./delta-sanitize.js";

const MAX_DOC_JSON = 480000; // chars of JSON.stringify(delta ops)
const MAX_TITLE_CHARS = 200;
const LOG_COMPACT_AT = 2000;
const CHUNK_SIZE = 48000; // chars per storage chunk, keeps every value < 128 KiB

const ADJECTIVES = ["敏捷的", "沉静的", "闪耀的", "温暖的", "睿智的", "灵动的", "勇敢的", "悠然的", "专注的", "快乐的"];
const ANIMALS = ["狐狸", "熊猫", "海豚", "猫头鹰", "松鼠", "企鹅", "长颈鹿", "考拉", "老虎", "兔子"];
const COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c", "#3498db", "#9b59b6", "#e84393", "#16a085", "#d35400"];

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return a + b;
}

export class DocRoomV2 extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.clients = new Map(); // WebSocket -> { id, name, color, start, end, mode }
    this.nextClientId = 1;
    this.ops = [{ insert: "\n" }];
    this.rev = 0;
    this.title = "";
    this.owner = null;
    this.shares = {}; // token -> { mode: "ro"|"rw", expiresAt: number|null, createdAt }
    this.createdAt = null;
    this.updatedAt = null;
    this.lastPush = 0;
    this.log = []; // [{ rev, ts, by: { id, name }, delta: [...ops] }]
    this.snapRev = 0;
    this.snapOps = [{ insert: "\n" }];
    this.savedChunks = 0;
    ctx.blockConcurrencyWhile(async () => {
      const count = (await ctx.storage.get("chunks")) || 0;
      if (count > 0) {
        const keys = Array.from({ length: count }, (_, i) => `s${i}`);
        const values = await ctx.storage.get(keys);
        const state = JSON.parse(keys.map((k) => values.get(k) || "").join(""));
        this.rev = state.rev;
        this.title = state.title;
        this.owner = state.owner || null;
        this.shares = state.shares || {};
        this.createdAt = state.createdAt;
        this.updatedAt = state.updatedAt;
        this.savedChunks = count;
        if (Array.isArray(state.ops)) {
          this.ops = state.ops;
          this.log = state.log || [];
          this.snapRev = state.snapRev || 0;
          this.snapOps = state.snapOps || [{ insert: "\n" }];
        } else if (typeof state.text === "string") {
          // Legacy plain-text document: convert to a delta and compact the
          // old-format operation log (old revisions are no longer served).
          this.ops = [{ insert: state.text + "\n" }];
          this.snapRev = this.rev;
          this.snapOps = this.ops;
          this.log = [];
        }
      }
    });
  }

  async save() {
    const payload = JSON.stringify({
      ops: this.ops,
      rev: this.rev,
      title: this.title,
      owner: this.owner,
      shares: this.shares,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      log: this.log,
      snapRev: this.snapRev,
      snapOps: this.snapOps
    });
    const chunks = Math.ceil(payload.length / CHUNK_SIZE) || 1;
    const entries = { chunks };
    for (let i = 0; i < chunks; i++) {
      entries[`s${i}`] = payload.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    }
    await this.ctx.storage.put(entries);
    const stale = [];
    for (let i = chunks; i < this.savedChunks; i++) stale.push(`s${i}`);
    if (stale.length) await this.ctx.storage.delete(stale);
    this.savedChunks = chunks;
  }

  doc() {
    return new Delta(this.ops);
  }

  meta() {
    return {
      title: this.title,
      owner: this.owner,
      revision: this.rev,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      chars: deltaToText(this.ops).length,
      collaborators: this.clients.size
    };
  }

  docId() {
    return this.ctx.id.name;
  }

  // Best-effort title/timestamp push to the owner's UserRoom, throttled.
  pushToOwner(force = false) {
    if (!this.owner) return;
    const now = Date.now();
    if (!force && now - this.lastPush < 30000) return;
    this.lastPush = now;
    this.ctx.waitUntil(
      this.env.USER_ROOMS.getByName(this.owner)
        .fetch(`https://user/docs/${this.docId()}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: this.title, updatedAt: this.updatedAt })
        })
        .catch((err) => console.warn("pushToOwner failed", String(err).slice(0, 120)))
    );
  }

  contentAt(targetRev) {
    if (targetRev === this.rev) return this.payload(this.rev, this.ops);
    if (targetRev < 0 || targetRev > this.rev) return null;
    if (targetRev < this.snapRev) return { gone: true };
    let doc = new Delta(this.snapRev > 0 ? this.snapOps : []);
    for (const entry of this.log) {
      if (entry.rev <= this.snapRev) continue;
      if (entry.rev > targetRev) break;
      doc = doc.compose(new Delta(entry.delta));
    }
    return this.payload(targetRev, doc.ops);
  }

  payload(revision, ops) {
    return { revision, delta: { ops }, text: deltaToText(ops) };
  }

  broadcast(message, except = null) {
    const data = JSON.stringify(message);
    for (const ws of this.clients.keys()) {
      if (ws === except) continue;
      try {
        ws.send(data);
      } catch {
        /* closed sockets are cleaned up on close event */
      }
    }
  }

  presence() {
    return Array.from(this.clients.values()).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      start: c.start,
      end: c.end
    }));
  }

  broadcastPresence() {
    this.broadcast({ type: "presence", clients: this.presence() });
  }

  handleMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const client = this.clients.get(ws);
    if (!client) return;

    if (msg.type === "op") {
      if (client.mode === "ro") {
        ws.send(JSON.stringify({ type: "error", code: "read_only", message: "只读链接，无法编辑" }));
        return;
      }
      if (!Number.isInteger(msg.baseRev)) {
        ws.send(JSON.stringify({ type: "error", code: "bad_op", message: "非法的操作" }));
        return;
      }
      let clientDelta;
      try {
        clientDelta = sanitizeDelta(msg.delta);
      } catch (err) {
        console.warn("bad_op delta parse", String(err).slice(0, 200));
        clientDelta = null;
      }
      if (!clientDelta) {
        console.warn("bad_op", JSON.stringify(msg.delta).slice(0, 300));
        ws.send(JSON.stringify({ type: "error", code: "bad_op", message: "非法的操作" }));
        return;
      }
      if (msg.baseRev > this.rev || msg.baseRev < this.snapRev) {
        ws.send(JSON.stringify({ type: "error", code: "stale", message: "版本过旧，正在重新同步" }));
        return;
      }
      let transformed = clientDelta;
      try {
        if (msg.baseRev < this.rev) {
          const history = this.log
            .filter((entry) => entry.rev > msg.baseRev)
            .reduce((acc, entry) => acc.compose(new Delta(entry.delta)), new Delta());
          transformed = history.transform(clientDelta, true);
        }
      } catch (err) {
        console.warn("bad_op transform", String(err).slice(0, 200));
        ws.send(JSON.stringify({ type: "error", code: "bad_op", message: "非法的操作" }));
        return;
      }
      if (transformed.ops.length === 0) {
        ws.send(JSON.stringify({ type: "op", rev: this.rev, delta: { ops: [] }, opId: msg.opId, by: { id: client.id, name: client.name, color: client.color } }));
        return;
      }
      let nextDoc;
      try {
        nextDoc = this.doc().compose(transformed);
      } catch (err) {
        console.warn("bad_op compose", String(err).slice(0, 200));
        ws.send(JSON.stringify({ type: "error", code: "bad_op", message: "非法的操作" }));
        return;
      }
      if (JSON.stringify(nextDoc.ops).length > MAX_DOC_JSON) {
        ws.send(JSON.stringify({ type: "error", code: "too_large", message: "文档已达到大小上限" }));
        return;
      }
      this.ops = nextDoc.ops;
      this.rev += 1;
      this.updatedAt = Date.now();
      this.log.push({ rev: this.rev, ts: this.updatedAt, by: { id: client.id, name: client.name }, delta: transformed.ops });
      if (this.log.length > LOG_COMPACT_AT) {
        this.snapRev = this.rev;
        this.snapOps = this.ops;
        this.log = [];
      }
      this.broadcast({
        type: "op",
        rev: this.rev,
        delta: { ops: transformed.ops },
        opId: msg.opId,
        by: { id: client.id, name: client.name, color: client.color }
      });
      this.pushToOwner();
      this.save();
      return;
    }

    if (msg.type === "title") {
      if (client.mode === "ro") return;
      const title = String(msg.title || "").slice(0, MAX_TITLE_CHARS);
      this.title = title;
      this.updatedAt = Date.now();
      this.broadcast({ type: "title", title, by: { id: client.id, name: client.name } }, ws);
      this.pushToOwner(true);
      this.save();
      return;
    }

    if (msg.type === "cursor") {
      client.start = Number.isInteger(msg.start) ? msg.start : null;
      client.end = Number.isInteger(msg.end) ? msg.end : null;
      this.broadcast({ type: "cursor", id: client.id, start: client.start, end: client.end }, ws);
    }
  }

  removeClient(ws) {
    if (this.clients.delete(ws)) {
      this.broadcastPresence();
    }
    try {
      ws.close();
    } catch {
      /* already closed */
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (this.createdAt === null) {
        this.title = String(body.title || "").slice(0, MAX_TITLE_CHARS);
        this.owner = typeof body.owner === "string" ? body.owner : null;
        this.createdAt = Date.now();
        this.updatedAt = this.createdAt;
        let initial = null;
        if (body.delta && Array.isArray(body.delta.ops)) {
          initial = sanitizeDelta(body.delta);
        } else if (typeof body.content === "string" && body.content) {
          initial = new Delta().insert(body.content + "\n");
        }
        if (initial && initial.ops.length) {
          this.ops = initial.ops;
          this.rev = 1;
          this.log.push({ rev: 1, ts: this.createdAt, by: { id: 0, name: "创建者" }, delta: initial.ops });
        }
        await this.save();
      }
      return json(this.meta());
    }

    if (url.pathname === "/meta" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      return json(this.meta());
    }

    if (url.pathname === "/meta" && request.method === "PATCH") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      const body = await request.json().catch(() => ({}));
      if (typeof body.title === "string") {
        this.title = body.title.slice(0, MAX_TITLE_CHARS);
        this.updatedAt = Date.now();
        this.broadcast({ type: "title", title: this.title, by: { id: 0, name: "API" } });
        this.pushToOwner(true);
        await this.save();
      }
      return json(this.meta());
    }

    if (url.pathname === "/shares" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      const now = Date.now();
      return json({
        shares: Object.entries(this.shares).map(([token, s]) => ({
          token,
          mode: s.mode,
          expiresAt: s.expiresAt,
          expired: s.expiresAt !== null && s.expiresAt <= now,
          createdAt: s.createdAt
        }))
      });
    }

    if (url.pathname === "/shares" && request.method === "POST") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      const body = await request.json().catch(() => ({}));
      const mode = body.mode === "rw" ? "rw" : "ro";
      const expiresAt = Number.isFinite(body.expiresAt) ? body.expiresAt : null;
      if (Object.keys(this.shares).length >= 50) return json({ error: "too_many_shares" }, 400);
      const token = `${this.docId()}${Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("")}`;
      this.shares[token] = { mode, expiresAt, createdAt: Date.now() };
      await this.save();
      return json({ token, mode, expiresAt });
    }

    if (url.pathname.startsWith("/shares/") && request.method === "DELETE") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      const token = url.pathname.slice("/shares/".length);
      delete this.shares[token];
      await this.save();
      return json({ ok: true });
    }

    if (url.pathname === "/share-access" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      const token = url.searchParams.get("token") || "";
      const share = this.shares[token];
      if (!share) return json({ error: "not_found" }, 404);
      if (share.expiresAt !== null && share.expiresAt <= Date.now()) {
        return json({ error: "expired" }, 410);
      }
      return json({ mode: share.mode, expiresAt: share.expiresAt });
    }

    if (url.pathname === "/content" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      const revParam = url.searchParams.get("rev");
      const target = revParam === null ? this.rev : Number(revParam);
      if (!Number.isInteger(target)) return json({ error: "bad_revision" }, 400);
      const result = this.contentAt(target);
      if (!result) return json({ error: "bad_revision" }, 400);
      if (result.gone) return json({ error: "revision_expired", message: "该历史版本已被压缩清理" }, 410);
      return json(result);
    }

    if (url.pathname === "/revisions" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
      const revisions = this.log
        .slice(-limit)
        .reverse()
        .map((entry) => ({
          revision: entry.rev,
          created_at: entry.ts,
          author: entry.by,
          summary: summarizeDelta(new Delta(entry.delta))
        }));
      return json({ revision: this.rev, earliest_available: this.log.length ? this.log[0].rev : this.rev, revisions });
    }

    if (url.pathname === "/collaborators" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      return json({ collaborators: this.presence() });
    }

    if (url.pathname === "/ws" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      if (request.headers.get("Upgrade") !== "websocket") {
        return json({ error: "expected_websocket" }, 426);
      }
      const pair = new WebSocketPair();
      const [clientWs, serverWs] = Object.values(pair);
      serverWs.accept();
      const info = {
        id: this.nextClientId++,
        name: randomName(),
        color: COLORS[(this.nextClientId - 2) % COLORS.length],
        start: null,
        end: null,
        mode: request.headers.get("x-share-mode") === "ro" ? "ro" : "rw"
      };
      this.clients.set(serverWs, info);
      serverWs.send(JSON.stringify({
        type: "init",
        rev: this.rev,
        delta: { ops: this.ops },
        title: this.title,
        you: { id: info.id, name: info.name, color: info.color },
        clients: this.presence()
      }));
      this.broadcastPresence();
      serverWs.addEventListener("message", (event) => {
        try {
          this.handleMessage(serverWs, event.data);
        } catch (err) {
          console.error("doc-room message error", err);
        }
      });
      serverWs.addEventListener("close", () => this.removeClient(serverWs));
      serverWs.addEventListener("error", () => this.removeClient(serverWs));
      return new Response(null, { status: 101, webSocket: clientWs });
    }

    return json({ error: "not_found" }, 404);
  }
}
