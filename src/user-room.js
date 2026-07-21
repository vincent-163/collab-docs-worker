import { DurableObject } from "cloudflare:workers";
import { verifyPassword, sha256Hex, randomToken, SESSION_MAX_AGE } from "./auth.js";
import { accrue, chargeCents } from "./billing.js";

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

const SIGNUP_GIFT_CENTS = 500; // $5.00

// Per-user state: profile, sessions, API keys, knowledge-base tree, image billing.
export class UserRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.state = null;
    ctx.blockConcurrencyWhile(async () => {
      this.state = (await ctx.storage.get("state")) || null;
    });
  }

  async save() {
    await this.ctx.storage.put("state", this.state);
  }

  gcSessions() {
    const now = Date.now();
    for (const [token, expiresAt] of Object.entries(this.state.sessions)) {
      if (expiresAt < now) delete this.state.sessions[token];
    }
  }

  publicState() {
    const s = this.state;
    const docs = Object.values(s.docs).sort((a, b) => b.updatedAt - a.updatedAt);
    const nodes = Object.values(s.nodes).map((n) => ({
      ...n,
      name: n.type === "doc" || n.type === "sheet" ? (s.docs[n.docId]?.title || "未命名") : n.name
    }));
    const chats = Object.values(s.chats || {}).sort((a, b) => b.lastAt - a.lastAt);
    const meets = Object.values(s.meets || {}).sort((a, b) => b.lastAt - a.lastAt);
    return {
      email: s.email,
      createdAt: s.createdAt,
      balanceCents: Math.round(s.balanceCents * 100) / 100,
      bytesStored: s.bytesStored,
      imageCount: Object.keys(s.images).length,
      docs,
      nodes,
      chats,
      meets,
      apiKeys: s.apiKeys.map((k) => ({ id: k.id, name: k.name, prefix: k.prefix, createdAt: k.createdAt }))
    };
  }

  upsertDocNode(docId, parent, kind = "doc") {
    const existing = Object.values(this.state.nodes).find((n) => n.type === kind && n.docId === docId);
    if (existing) return existing;
    const id = randomToken(6);
    const node = { id, type: kind, docId, parent: parent || null };
    this.state.nodes[id] = node;
    return node;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;

    if (url.pathname === "/init" && method === "POST") {
      if (this.state) return json({ error: "exists" }, 409);
      const body = await request.json();
      const now = Date.now();
      this.state = {
        email: body.email,
        passSalt: body.salt,
        passHash: body.hash,
        createdAt: now,
        sessions: {},
        apiKeys: [],
        docs: {},
        nodes: {},
        chats: {},
        meets: {},
        images: {},
        balanceCents: SIGNUP_GIFT_CENTS,
        byteSeconds: 0,
        bytesStored: 0,
        lastAccrued: now,
        lastSettle: now
      };
      await this.save();
      return json({ ok: true });
    }

    if (!this.state) return json({ error: "not_found" }, 404);

    if (url.pathname === "/login" && method === "POST") {
      const { password } = await request.json();
      const ok = await verifyPassword(String(password || ""), this.state.passSalt, this.state.passHash);
      if (!ok) return json({ error: "bad_credentials" }, 401);
      const token = randomToken();
      this.gcSessions();
      this.state.sessions[token] = Date.now() + SESSION_MAX_AGE * 1000;
      await this.save();
      return json({ token });
    }

    if (url.pathname === "/session" && method === "POST") {
      const { token } = await request.json();
      this.gcSessions();
      if (!this.state.sessions[token]) {
        await this.save();
        return json({ error: "invalid_session" }, 401);
      }
      return json({ email: this.state.email });
    }

    if (url.pathname === "/logout" && method === "POST") {
      const { token } = await request.json();
      delete this.state.sessions[token];
      await this.save();
      return json({ ok: true });
    }

    if (url.pathname === "/state" && method === "GET") {
      return json(this.publicState());
    }

    if (url.pathname === "/apikeys" && method === "POST") {
      const { name } = await request.json().catch(() => ({}));
      if (this.state.apiKeys.length >= 10) return json({ error: "too_many_keys" }, 400);
      const userId = this.ctx.id.name;
      const key = `cdk_${userId}.${randomToken(16)}`;
      const record = {
        id: randomToken(6),
        name: String(name || "API Key").slice(0, 60),
        prefix: key.slice(0, 16),
        hash: await sha256Hex(key),
        createdAt: Date.now()
      };
      this.state.apiKeys.push(record);
      await this.save();
      return json({ id: record.id, name: record.name, prefix: record.prefix, key });
    }

    if (url.pathname.startsWith("/apikeys/") && method === "DELETE") {
      const id = url.pathname.slice("/apikeys/".length);
      this.state.apiKeys = this.state.apiKeys.filter((k) => k.id !== id);
      await this.save();
      return json({ ok: true });
    }

    if (url.pathname === "/apikeys/verify" && method === "POST") {
      const { key } = await request.json();
      const hash = await sha256Hex(String(key || ""));
      const found = this.state.apiKeys.find((k) => k.hash === hash);
      return found ? json({ ok: true }) : json({ error: "bad_key" }, 401);
    }

    if (url.pathname === "/docs" && method === "POST") {
      const { docId, title, parent, kind } = await request.json();
      const now = Date.now();
      const existing = this.state.docs[docId];
      this.state.docs[docId] = {
        id: docId,
        kind: kind === "sheet" ? "sheet" : "doc",
        title: String(title || ""),
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      const node = this.upsertDocNode(docId, parent, kind === "sheet" ? "sheet" : "doc");
      await this.save();
      return json({ ok: true, nodeId: node.id });
    }

    if (url.pathname.startsWith("/docs/") && method === "PATCH") {
      const docId = url.pathname.slice("/docs/".length);
      const body = await request.json();
      if (this.state.docs[docId]) {
        if (typeof body.title === "string") this.state.docs[docId].title = body.title;
        this.state.docs[docId].updatedAt = body.updatedAt || Date.now();
        await this.save();
      }
      return json({ ok: true });
    }

    if (url.pathname === "/nodes" && method === "POST") {
      const { name, parent } = await request.json();
      const id = randomToken(6);
      const node = { id, type: "folder", name: String(name || "新建文件夹").slice(0, 60), parent: parent || null };
      this.state.nodes[id] = node;
      await this.save();
      return json({ node });
    }

    if (url.pathname.startsWith("/nodes/") && method === "PATCH") {
      const id = url.pathname.slice("/nodes/".length);
      const body = await request.json();
      const node = this.state.nodes[id];
      if (!node) return json({ error: "not_found" }, 404);
      if (typeof body.name === "string" && node.type === "folder") node.name = body.name.slice(0, 60);
      if (body.parent !== undefined && body.parent !== id) {
        // prevent moving a folder into its own descendant
        let p = body.parent;
        let cycle = false;
        while (p) {
          if (p === id) { cycle = true; break; }
          p = this.state.nodes[p]?.parent || null;
        }
        if (!cycle) node.parent = body.parent;
      }
      await this.save();
      return json({ node });
    }

    if (url.pathname.startsWith("/nodes/") && method === "DELETE") {
      const id = url.pathname.slice("/nodes/".length);
      const node = this.state.nodes[id];
      if (!node) return json({ error: "not_found" }, 404);
      if (node.type === "folder") {
        for (const child of Object.values(this.state.nodes)) {
          if (child.parent === id) child.parent = node.parent;
        }
      }
      delete this.state.nodes[id];
      await this.save();
      return json({ ok: true });
    }

    // Remember a chat/meeting room the user created or joined.
    if ((url.pathname === "/chats" || url.pathname === "/meets") && method === "POST") {
      const { roomId, name } = await request.json();
      const key = url.pathname === "/chats" ? "chats" : "meets";
      this.state[key] = this.state[key] || {};
      const now = Date.now();
      const existing = this.state[key][roomId];
      this.state[key][roomId] = {
        id: roomId,
        name: String(name || "").slice(0, 60),
        createdAt: existing?.createdAt || now,
        lastAt: now
      };
      await this.save();
      return json({ ok: true });
    }

    // One-time balance charge (chat attachments). Atomic check + deduct.
    if (url.pathname === "/charge" && method === "POST") {
      const { cents } = await request.json();
      if (!Number.isFinite(cents) || cents <= 0 || cents > 100000) {
        return json({ error: "bad_amount" }, 400);
      }
      if (this.state.balanceCents < cents) {
        return json({ error: "insufficient_balance", balanceCents: this.state.balanceCents }, 402);
      }
      this.state.balanceCents = Math.round((this.state.balanceCents - cents) * 100) / 100;
      await this.save();
      return json({ ok: true, balanceCents: this.state.balanceCents });
    }

    if (url.pathname === "/images" && method === "POST") {
      const { imageId, bytes } = await request.json();
      accrue(this.state, Date.now());
      this.state.images[imageId] = bytes;
      this.state.bytesStored += bytes;
      await this.save();
      return json({ ok: true, bytesStored: this.state.bytesStored });
    }

    if (url.pathname === "/images/delete" && method === "POST") {
      const { imageId } = await request.json();
      accrue(this.state, Date.now());
      const bytes = this.state.images[imageId] || 0;
      delete this.state.images[imageId];
      this.state.bytesStored = Math.max(0, this.state.bytesStored - bytes);
      await this.save();
      return json({ ok: true });
    }

    if (url.pathname === "/usage" && method === "GET") {
      accrue(this.state, Date.now());
      await this.save();
      return json({
        balanceCents: Math.round(this.state.balanceCents * 100) / 100,
        bytesStored: this.state.bytesStored,
        imageCount: Object.keys(this.state.images).length
      });
    }

    // Monthly billing settle (called by the cron trigger via index.js).
    if (url.pathname === "/settle" && method === "POST") {
      accrue(this.state, Date.now());
      const charge = chargeCents(this.state.byteSeconds);
      this.state.byteSeconds = 0;
      this.state.lastSettle = Date.now();
      this.state.balanceCents = Math.round((this.state.balanceCents - charge) * 100) / 100;
      let wiped = [];
      if (this.state.balanceCents < 0 && Object.keys(this.state.images).length > 0) {
        wiped = Object.keys(this.state.images);
        this.state.images = {};
        this.state.bytesStored = 0;
        this.state.balanceCents = 0;
      }
      await this.save();
      return json({ chargedCents: charge, balanceCents: this.state.balanceCents, wiped });
    }

    return json({ error: "not_found" }, 404);
  }
}
