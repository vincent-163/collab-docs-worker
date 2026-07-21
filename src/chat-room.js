import { DurableObject } from "cloudflare:workers";
import { randomName, pickColor } from "./names.js";

const MAX_MESSAGES = 300; // retained history per room
const MAX_TEXT = 4000; // chars per text message
const MAX_NAME = 60;
const CHUNK_SIZE = 48000; // chars per storage chunk, keeps every value < 128 KiB

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

// Realtime chat room: WebSocket fan-out with persisted message history.
// Attachments live in R2 (uploaded via index.js); messages only carry the
// file metadata/URL. Any logged-in user with the room link may join.
export class ChatRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.clients = new Map(); // WebSocket -> { id, name, color }
    this.nextClientId = 1;
    this.name = "";
    this.owner = null;
    this.createdAt = null;
    this.messages = []; // [{ id, kind, text?, file?, by, ts }]
    this.nextMessageId = 1;
    this.savedChunks = 0;
    ctx.blockConcurrencyWhile(async () => {
      const count = (await ctx.storage.get("chunks")) || 0;
      if (count > 0) {
        const keys = Array.from({ length: count }, (_, i) => `s${i}`);
        const values = await ctx.storage.get(keys);
        const state = JSON.parse(keys.map((k) => values.get(k) || "").join(""));
        this.name = state.name || "";
        this.owner = state.owner || null;
        this.createdAt = state.createdAt;
        this.messages = state.messages || [];
        this.nextMessageId = state.nextMessageId || this.messages.length + 1;
        this.savedChunks = count;
      }
    });
  }

  async save() {
    const payload = JSON.stringify({
      name: this.name,
      owner: this.owner,
      createdAt: this.createdAt,
      messages: this.messages,
      nextMessageId: this.nextMessageId
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
    return { name: this.name, owner: this.owner, created_at: this.createdAt, online: this.clients.size };
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
    return Array.from(this.clients.values()).map((c) => ({ id: c.id, name: c.name, color: c.color }));
  }

  broadcastPresence() {
    this.broadcast({ type: "presence", clients: this.presence() });
  }

  // Validate and normalize an incoming chat message; returns null if bad.
  sanitizeMessage(msg) {
    const kind = msg.kind === "image" || msg.kind === "file" ? msg.kind : "text";
    if (kind === "text") {
      const text = String(msg.text || "").slice(0, MAX_TEXT);
      if (!text.trim()) return null;
      return { kind, text };
    }
    const file = msg.file && typeof msg.file === "object" ? msg.file : {};
    const url = String(file.url || "");
    // Attachment URLs are produced by the /chat/:id/upload endpoint.
    if (!/^\/[A-Za-z0-9-]*\/file\/chat\/[0-9]+-[a-f0-9]{16}$/.test(url)) return null;
    return {
      kind,
      text: String(msg.text || "").slice(0, 200),
      file: {
        url,
        name: String(file.name || "附件").slice(0, 200),
        size: Number.isFinite(file.size) ? file.size : 0,
        contentType: String(file.contentType || "application/octet-stream").slice(0, 100)
      }
    };
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
    if (msg.type !== "msg") return;
    const body = this.sanitizeMessage(msg);
    if (!body) {
      ws.send(JSON.stringify({ type: "error", code: "bad_msg", message: "非法的消息" }));
      return;
    }
    const entry = {
      id: this.nextMessageId++,
      ...body,
      by: { id: client.id, name: client.name, color: client.color },
      ts: Date.now()
    };
    this.messages.push(entry);
    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }
    this.broadcast({ type: "msg", msg: entry });
    this.save();
  }

  removeClient(ws) {
    if (this.clients.delete(ws)) this.broadcastPresence();
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
        this.name = String(body.name || "聊天室").slice(0, MAX_NAME);
        this.owner = typeof body.owner === "string" ? body.owner : null;
        this.createdAt = Date.now();
        await this.save();
      }
      return json(this.meta());
    }

    if (url.pathname === "/meta" && request.method === "GET") {
      if (this.createdAt === null) return json({ error: "not_found" }, 404);
      return json(this.meta());
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
        color: pickColor(this.nextClientId - 2)
      };
      this.clients.set(serverWs, info);
      serverWs.send(JSON.stringify({
        type: "init",
        name: this.name,
        messages: this.messages,
        you: { id: info.id, name: info.name, color: info.color },
        clients: this.presence()
      }));
      this.broadcastPresence();
      serverWs.addEventListener("message", (event) => {
        try {
          this.handleMessage(serverWs, event.data);
        } catch (err) {
          console.error("chat-room message error", err);
        }
      });
      serverWs.addEventListener("close", () => this.removeClient(serverWs));
      serverWs.addEventListener("error", () => this.removeClient(serverWs));
      return new Response(null, { status: 101, webSocket: clientWs });
    }

    return json({ error: "not_found" }, 404);
  }
}
