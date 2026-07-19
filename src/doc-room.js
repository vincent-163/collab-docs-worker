import { DurableObject } from "cloudflare:workers";
import { applyOps, transformOps, sanitizeOps } from "./ot.js";

const MAX_DOC_CHARS = 50000;
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

function summarizeOps(ops) {
  let ins = 0;
  let del = 0;
  for (const op of ops) {
    if (op.t === "ins") ins += op.s.length;
    else del += op.l;
  }
  return `+${ins} -${del}`;
}

export class DocRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.clients = new Map(); // WebSocket -> { id, name, color, start, end }
    this.nextClientId = 1;
    this.text = "";
    this.rev = 0;
    this.title = "";
    this.createdAt = null;
    this.updatedAt = null;
    this.log = []; // [{ rev, ts, by: { id, name }, ops }]
    this.snapRev = 0;
    this.snapText = "";
    this.savedChunks = 0;
    ctx.blockConcurrencyWhile(async () => {
      const count = (await ctx.storage.get("chunks")) || 0;
      if (count > 0) {
        const keys = Array.from({ length: count }, (_, i) => `s${i}`);
        const values = await ctx.storage.get(keys);
        const state = JSON.parse(keys.map((k) => values.get(k) || "").join(""));
        this.text = state.text;
        this.rev = state.rev;
        this.title = state.title;
        this.createdAt = state.createdAt;
        this.updatedAt = state.updatedAt;
        this.log = state.log || [];
        this.snapRev = state.snapRev || 0;
        this.snapText = state.snapText || "";
        this.savedChunks = count;
      }
    });
  }

  async save() {
    const payload = JSON.stringify({
      text: this.text,
      rev: this.rev,
      title: this.title,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      log: this.log,
      snapRev: this.snapRev,
      snapText: this.snapText
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

  meta() {
    return {
      title: this.title,
      revision: this.rev,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      chars: this.text.length,
      collaborators: this.clients.size
    };
  }

  contentAt(targetRev) {
    if (targetRev === this.rev) return { revision: this.rev, content: this.text };
    if (targetRev < 0 || targetRev > this.rev) return null;
    if (targetRev < this.snapRev) return { gone: true };
    let text = this.snapRev > 0 ? this.snapText : "";
    for (const entry of this.log) {
      if (entry.rev <= this.snapRev) continue;
      if (entry.rev > targetRev) break;
      text = applyOps(text, entry.ops);
    }
    return { revision: targetRev, content: text };
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
      const ops = sanitizeOps(msg.ops, this.text.length);
      if (!ops || !Number.isInteger(msg.baseRev)) {
        console.warn("bad_op", JSON.stringify(msg).slice(0, 300), "docLen", this.text.length);
        ws.send(JSON.stringify({ type: "error", code: "bad_op", message: "非法的操作" }));
        return;
      }
      if (msg.baseRev > this.rev || msg.baseRev < this.snapRev) {
        ws.send(JSON.stringify({ type: "error", code: "stale", message: "版本过旧，正在重新同步" }));
        return;
      }
      const history = this.log
        .filter((entry) => entry.rev > msg.baseRev)
        .flatMap((entry) => entry.ops);
      const transformed = history.length ? transformOps(ops, history) : ops;
      if (transformed.length === 0) {
        ws.send(JSON.stringify({ type: "op", rev: this.rev, ops: [], opId: msg.opId, by: { id: client.id, name: client.name, color: client.color } }));
        return;
      }
      const nextText = applyOps(this.text, transformed);
      if (nextText.length > MAX_DOC_CHARS) {
        ws.send(JSON.stringify({ type: "error", code: "too_large", message: "文档已达到大小上限" }));
        return;
      }
      this.text = nextText;
      this.rev += 1;
      this.updatedAt = Date.now();
      this.log.push({ rev: this.rev, ts: this.updatedAt, by: { id: client.id, name: client.name }, ops: transformed });
      if (this.log.length > LOG_COMPACT_AT) {
        this.snapRev = this.rev;
        this.snapText = this.text;
        this.log = [];
      }
      this.broadcast({
        type: "op",
        rev: this.rev,
        ops: transformed,
        opId: msg.opId,
        by: { id: client.id, name: client.name, color: client.color }
      });
      this.save();
      return;
    }

    if (msg.type === "title") {
      const title = String(msg.title || "").slice(0, MAX_TITLE_CHARS);
      this.title = title;
      this.updatedAt = Date.now();
      this.broadcast({ type: "title", title, by: { id: client.id, name: client.name } }, ws);
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
        const content = String(body.content || "").slice(0, MAX_DOC_CHARS);
        this.title = String(body.title || "").slice(0, MAX_TITLE_CHARS);
        this.text = content;
        this.rev = 0;
        this.createdAt = Date.now();
        this.updatedAt = this.createdAt;
        if (content) {
          this.rev = 1;
          this.log.push({ rev: 1, ts: this.createdAt, by: { id: 0, name: "创建者" }, ops: [{ t: "ins", p: 0, s: content }] });
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
        await this.save();
      }
      return json(this.meta());
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
          summary: summarizeOps(entry.ops)
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
        end: null
      };
      this.clients.set(serverWs, info);
      serverWs.send(JSON.stringify({
        type: "init",
        rev: this.rev,
        text: this.text,
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
