import { DurableObject } from "cloudflare:workers";
import { randomName, pickColor } from "./names.js";

const MAX_MESSAGES = 100; // ephemeral chat history (memory only)
const MAX_TEXT = 4000;
const MAX_NAME = 60;
const MAX_SIGNAL_CHARS = 16000; // generous cap for SDP blobs

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

// Meeting room: ephemeral text chat + WebRTC signaling relay. Media flows
// directly between browsers (mesh P2P); the worker never touches media
// bytes — Durable Objects cannot relay UDP/TURN traffic, so a true media
// relay is not possible on this platform. Chat history is memory-only and
// lost when the room restarts. Any logged-in user with the link may join.
export class MeetRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.clients = new Map(); // WebSocket -> { id, name, color, audio, video }
    this.nextClientId = 1;
    this.messages = []; // [{ id, text, by, ts }] memory only
    this.nextMessageId = 1;
    this.name = "";
    this.owner = null;
    this.createdAt = null;
    ctx.blockConcurrencyWhile(async () => {
      const state = (await ctx.storage.get("meta")) || null;
      if (state) {
        this.name = state.name || "";
        this.owner = state.owner || null;
        this.createdAt = state.createdAt;
      }
    });
  }

  async save() {
    await this.ctx.storage.put("meta", { name: this.name, owner: this.owner, createdAt: this.createdAt });
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
    return Array.from(this.clients.values()).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      audio: !!c.audio,
      video: !!c.video,
      sfuTracks: c.sfuTracks || []
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

    if (msg.type === "chat") {
      const text = String(msg.text || "").slice(0, MAX_TEXT);
      if (!text.trim()) return;
      const entry = {
        id: this.nextMessageId++,
        text,
        by: { id: client.id, name: client.name, color: client.color },
        ts: Date.now()
      };
      this.messages.push(entry);
      if (this.messages.length > MAX_MESSAGES) this.messages = this.messages.slice(-MAX_MESSAGES);
      this.broadcast({ type: "chat", msg: entry });
      return;
    }

    if (msg.type === "media") {
      client.audio = !!msg.audio;
      client.video = !!msg.video;
      this.broadcastPresence();
      return;
    }

    if (msg.type === "sfu-tracks") {
      // Announce which tracks this client published to the Realtime SFU so
      // other participants can pull them. Kept in presence for late joiners.
      const tracks = Array.isArray(msg.tracks) ? msg.tracks.slice(0, 8) : [];
      client.sfuTracks = tracks
        .map((t) => ({
          sessionId: String(t?.sessionId || "").slice(0, 128),
          trackName: String(t?.trackName || "").slice(0, 64),
          kind: t?.kind === "video" ? "video" : "audio"
        }))
        .filter((t) => /^[A-Za-z0-9-]{8,128}$/.test(t.sessionId) && /^[A-Za-z0-9_-]{1,64}$/.test(t.trackName));
      this.broadcastPresence();
      return;
    }

    if (msg.type === "signal") {
      // Relay WebRTC signaling (SDP offer/answer, ICE candidates) to one peer.
      if (!Number.isInteger(msg.to)) return;
      if (JSON.stringify(msg.data ?? null).length > MAX_SIGNAL_CHARS) return;
      for (const [peerWs, peer] of this.clients) {
        if (peer.id === msg.to) {
          try {
            peerWs.send(JSON.stringify({ type: "signal", from: client.id, data: msg.data }));
          } catch {
            /* ignore */
          }
          return;
        }
      }
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
        this.name = String(body.name || "会议").slice(0, MAX_NAME);
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
        color: pickColor(this.nextClientId - 2),
        audio: false,
        video: false
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
          console.error("meet-room message error", err);
        }
      });
      serverWs.addEventListener("close", () => this.removeClient(serverWs));
      serverWs.addEventListener("error", () => this.removeClient(serverWs));
      return new Response(null, { status: 101, webSocket: clientWs });
    }

    return json({ error: "not_found" }, 404);
  }
}
