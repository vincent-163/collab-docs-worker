import { DurableObject } from "cloudflare:workers";
import { randomName, pickColor } from "./names.js";
import { MAX_CELLS, sanitizeCell } from "./sheet-core.js";

const MAX_TITLE_CHARS = 200;
const CHUNK_SIZE = 48000; // chars per storage chunk, keeps every value < 128 KiB

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

// Online spreadsheet room: cell-level last-write-wins collaboration over
// WebSocket (no OT; cells are independent). Formulas are evaluated on the
// client via src/formula.js; the room only stores raw cell text.
// Any logged-in user with the sheet link may collaborate.
export class SheetRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.clients = new Map(); // WebSocket -> { id, name, color }
    this.nextClientId = 1;
    this.title = "";
    this.owner = null;
    this.createdAt = null;
    this.updatedAt = null;
    this.cells = {}; // "r,c" -> raw text
    this.rev = 0;
    this.lastPush = 0;
    this.savedChunks = 0;
    ctx.blockConcurrencyWhile(async () => {
      const count = (await ctx.storage.get("chunks")) || 0;
      if (count > 0) {
        const keys = Array.from({ length: count }, (_, i) => `s${i}`);
        const values = await ctx.storage.get(keys);
        const state = JSON.parse(keys.map((k) => values.get(k) || "").join(""));
        this.title = state.title || "";
        this.owner = state.owner || null;
        this.createdAt = state.createdAt;
        this.updatedAt = state.updatedAt;
        this.cells = state.cells || {};
        this.rev = state.rev || 0;
        this.savedChunks = count;
      }
    });
  }

  async save() {
    const payload = JSON.stringify({
      title: this.title,
      owner: this.owner,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      cells: this.cells,
      rev: this.rev
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
      owner: this.owner,
      revision: this.rev,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      collaborators: this.clients.size
    };
  }

  sheetId() {
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
        .fetch(`https://user/docs/${this.sheetId()}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: this.title, updatedAt: this.updatedAt })
        })
        .catch((err) => console.warn("pushToOwner failed", String(err).slice(0, 120)))
    );
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

  handleMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const client = this.clients.get(ws);
    if (!client) return;

    if (msg.type === "cell") {
      const cell = sanitizeCell(msg.r, msg.c, msg.value);
      if (!cell) {
        ws.send(JSON.stringify({ type: "error", code: "bad_cell", message: "非法的单元格" }));
        return;
      }
      const key = `${cell.r},${cell.c}`;
      if (cell.value === "") {
        delete this.cells[key];
      } else {
        if (!this.cells[key] && Object.keys(this.cells).length >= MAX_CELLS) {
          ws.send(JSON.stringify({ type: "error", code: "too_many_cells", message: "表格已达到单元格上限" }));
          return;
        }
        this.cells[key] = cell.value;
      }
      this.rev += 1;
      this.updatedAt = Date.now();
      this.broadcast({
        type: "cell",
        r: cell.r,
        c: cell.c,
        value: cell.value,
        rev: this.rev,
        by: { id: client.id, name: client.name, color: client.color }
      });
      this.pushToOwner();
      this.save();
      return;
    }

    if (msg.type === "title") {
      const title = String(msg.title || "").slice(0, MAX_TITLE_CHARS);
      this.title = title;
      this.updatedAt = Date.now();
      this.broadcast({ type: "title", title, by: { id: client.id, name: client.name } }, ws);
      this.pushToOwner(true);
      this.save();
    }
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
        this.title = String(body.title || "").slice(0, MAX_TITLE_CHARS);
        this.owner = typeof body.owner === "string" ? body.owner : null;
        this.createdAt = Date.now();
        this.updatedAt = this.createdAt;
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
        title: this.title,
        cells: this.cells,
        rev: this.rev,
        you: { id: info.id, name: info.name, color: info.color },
        clients: this.presence()
      }));
      this.broadcastPresence();
      serverWs.addEventListener("message", (event) => {
        try {
          this.handleMessage(serverWs, event.data);
        } catch (err) {
          console.error("sheet-room message error", err);
        }
      });
      serverWs.addEventListener("close", () => this.removeClient(serverWs));
      serverWs.addEventListener("error", () => this.removeClient(serverWs));
      return new Response(null, { status: 101, webSocket: clientWs });
    }

    return json({ error: "not_found" }, 404);
  }
}
