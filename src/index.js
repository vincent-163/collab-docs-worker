import { DocRoomV2 } from "./doc-room.js";
import { UserRoom } from "./user-room.js";
import { DirectoryRoom } from "./directory-room.js";
import { ChatRoom } from "./chat-room.js";
import { SheetRoom } from "./sheet-room.js";
import { MeetRoom } from "./meet-room.js";
import { STYLE_CSS, CLIENT_JS, DASHBOARD_JS, CHAT_JS, SHEET_JS, MEET_JS } from "./static.js";
import {
  landingPage, authPage, dashboardPage, editorPage, notFoundPage, shareErrorPage,
  chatPage, sheetPage, meetPage
} from "./pages.js";
import { deltaToMarkdown } from "./delta-export.js";
import {
  hashPassword, randomToken, parseCookies,
  SESSION_COOKIE, sessionCookieHeader, clearSessionCookieHeader, validEmail
} from "./auth.js";
import { estimateMonthlyCents, oneTimeUploadCents } from "./billing.js";
import {
  realtimeEnabled, realtimeRequest, sanitizeTrackRefs, sanitizeSessionDescription
} from "./realtime.js";
import quillJs from "./vendor/quill.js";
import quillCoreCss from "./vendor/quill.core.css";
import quillSnowCss from "./vendor/quill.snow.css";
import skillMd from "../skill/SKILL.md";
import formulaJs from "./formula.js";

export { DocRoomV2, UserRoom, DirectoryRoom, ChatRoom, SheetRoom, MeetRoom };

const ID_PATTERN = /^[A-Za-z0-9]{6,24}$/;
const SHARE_PATTERN = /^([A-Za-z0-9]{10})([a-f0-9]{24})$/;
const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // chat attachments
const CHAT_FILE_TTL = 7 * 86400000; // chat attachments expire after 7 days
const CRON_SETTLE = "23 4 1 * *";
const CRON_CHAT_CLEANUP = "17 3 * * *";

const html = (body, status = 200, headers = {}) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...headers }
  });

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

const staticAsset = (body, contentType) =>
  new Response(body, { headers: { "content-type": contentType, "cache-control": "public, max-age=86400" } });

const redirect = (location, headers = {}) => new Response(null, { status: 303, headers: { location, ...headers } });

function randomId(length = 10) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const b of bytes) id += ID_ALPHABET[b % ID_ALPHABET.length];
  return id;
}

const room = (env, id) => env.DOC_ROOMS.getByName(id);
const userRoom = (env, userId) => env.USER_ROOMS.getByName(userId);
const directory = (env) => env.DIRECTORY.getByName("directory");
const chatRoom = (env, id) => env.CHAT_ROOMS.getByName(id);
const sheetRoom = (env, id) => env.SHEET_ROOMS.getByName(id);
const meetRoom = (env, id) => env.MEET_ROOMS.getByName(id);

async function roomOr404(env, id, path, init) {
  const response = await room(env, id).fetch(`https://room${path}`, init);
  if (response.status === 404) return null;
  return response;
}

// Session from the cd_session cookie: "<userId>.<token>".
async function getSession(request, env) {
  const raw = parseCookies(request)[SESSION_COOKIE] || "";
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  const userId = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  if (!/^[A-Za-z0-9]{10,24}$/.test(userId) || !token) return null;
  const response = await userRoom(env, userId).fetch("https://user/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token })
  });
  if (!response.ok) return null;
  const { email } = await response.json();
  return { userId, email, token };
}

// API key auth: "Authorization: Bearer cdk_<userId>.<secret>".
async function getApiKeyAuth(request, env) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(cdk_([A-Za-z0-9]{10,24})\.([a-f0-9]{32}))$/);
  if (!match) return null;
  const [, key, userId] = match;
  const response = await userRoom(env, userId).fetch("https://user/apikeys/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key })
  });
  return response.ok ? { userId } : null;
}

async function getAuth(request, env) {
  return (await getSession(request, env)) || (await getApiKeyAuth(request, env));
}

async function createDocument(env, prefix, origin, userId, { title = "", content = "", delta = null, parent = null } = {}) {
  const id = randomId();
  const meta = await room(env, id).fetch("https://room/init", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, content, delta, owner: userId })
  }).then((r) => r.json());
  await userRoom(env, userId).fetch("https://user/docs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ docId: id, title: meta.title, parent })
  });
  return {
    document: { document_id: id, ...meta },
    url: `${origin}${prefix}/d/${id}`,
    edit_url: `${origin}${prefix}/d/${id}`
  };
}

async function handleRegister(request, env, prefix) {
  const form = await request.formData().catch(() => null);
  const email = String(form?.get("email") || "").trim().toLowerCase();
  const password = String(form?.get("password") || "");
  if (!validEmail(email)) return html(authPage(prefix, "register", "邮箱格式不正确"), 400);
  if (password.length < 8) return html(authPage(prefix, "register", "密码至少 8 位"), 400);
  const userId = randomId(12);
  const claim = await directory(env).fetch("https://dir/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, userId })
  });
  if (claim.status === 409) return html(authPage(prefix, "register", "该邮箱已注册，请直接登录"), 409);
  const { salt, hash } = await hashPassword(password);
  await userRoom(env, userId).fetch("https://user/init", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, salt, hash })
  });
  const login = await userRoom(env, userId).fetch("https://user/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password })
  }).then((r) => r.json());
  return redirect(`${prefix}/app`, { "set-cookie": sessionCookieHeader(userId, login.token) });
}

async function handleLogin(request, env, prefix) {
  const form = await request.formData().catch(() => null);
  const email = String(form?.get("email") || "").trim().toLowerCase();
  const password = String(form?.get("password") || "");
  const lookup = await directory(env).fetch(`https://dir/lookup?email=${encodeURIComponent(email)}`);
  if (!lookup.ok) return html(authPage(prefix, "login", "邮箱或密码错误"), 401);
  const { userId } = await lookup.json();
  const login = await userRoom(env, userId).fetch("https://user/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password })
  });
  if (!login.ok) return html(authPage(prefix, "login", "邮箱或密码错误"), 401);
  const { token } = await login.json();
  return redirect(`${prefix}/app`, { "set-cookie": sessionCookieHeader(userId, token) });
}

// Resolve a share token to { docId, mode } or an error status.
async function resolveShare(env, token) {
  const match = token.match(SHARE_PATTERN);
  if (!match) return { status: 404 };
  const docId = match[1];
  const response = await roomOr404(env, docId, `/share-access?token=${encodeURIComponent(token)}`);
  if (!response) return { status: 404 };
  if (response.status === 410) return { status: 410 };
  const data = await response.json();
  return { status: 200, docId, mode: data.mode };
}

// Delete chat attachments older than CHAT_FILE_TTL (daily cron). The upload
// timestamp is embedded in the R2 key: "chat/<ts>-<rand>".
async function cleanupChatFiles(env) {
  const cutoff = Date.now() - CHAT_FILE_TTL;
  let cursor;
  let deleted = 0;
  do {
    const page = await env.IMAGES.list({ prefix: "chat/", cursor, limit: 1000 });
    const stale = [];
    for (const obj of page.objects) {
      const ts = Number(obj.key.slice("chat/".length).split("-")[0]);
      if (Number.isFinite(ts) && ts < cutoff) stale.push(obj.key);
    }
    if (stale.length) {
      await env.IMAGES.delete(stale);
      deleted += stale.length;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  if (deleted) console.log(`chat cleanup: deleted ${deleted} expired files`);
}

async function scheduled(event, env, ctx) {
  if (event.cron === CRON_CHAT_CLEANUP) {
    ctx.waitUntil(cleanupChatFiles(env).catch((err) => console.error("chat cleanup failed", err)));
    return;
  }
  const { userIds } = await directory(env).fetch("https://dir/users").then((r) => r.json());
  for (const userId of userIds) {
    ctx.waitUntil((async () => {
      try {
        const result = await userRoom(env, userId).fetch("https://user/settle", { method: "POST" }).then((r) => r.json());
        for (const imageId of result.wiped || []) {
          await env.IMAGES.delete(`u/${userId}/${imageId}`);
        }
        if (result.chargedCents > 0 || result.wiped?.length) {
          console.log(`settle ${userId}: charged ${result.chargedCents}c, wiped ${result.wiped?.length || 0} images`);
        }
      } catch (err) {
        console.error(`settle failed for ${userId}`, err);
      }
    })());
  }
}

export default {
  scheduled,

  async fetch(request, env) {
    const url = new URL(request.url);
    const prefix = env.PUBLIC_PREFIX || "";
    const origin = url.origin;
    const path = url.pathname;
    const method = request.method;

    /* ---------- public ---------- */
    if (path === "/health") return json({ ok: true, service: "collab-docs" });

    if (path === "/" && method === "GET") return html(landingPage(prefix));

    if (path === "/skill.md") {
      return new Response(skillMd, { headers: { "content-type": "text/markdown; charset=utf-8" } });
    }

    if (path === "/static/style.css") return staticAsset(STYLE_CSS, "text/css; charset=utf-8");
    if (path === "/static/client.js") return staticAsset(CLIENT_JS, "application/javascript; charset=utf-8");
    if (path === "/static/dashboard.js") return staticAsset(DASHBOARD_JS, "application/javascript; charset=utf-8");
    if (path === "/static/chat.js") return staticAsset(CHAT_JS, "application/javascript; charset=utf-8");
    if (path === "/static/sheet.js") return staticAsset(SHEET_JS, "application/javascript; charset=utf-8");
    if (path === "/static/meet.js") return staticAsset(MEET_JS, "application/javascript; charset=utf-8");
    if (path === "/static/formula.js") return staticAsset(formulaJs, "application/javascript; charset=utf-8");
    if (path === "/static/vendor/quill.js") return staticAsset(quillJs, "application/javascript; charset=utf-8");
    if (path === "/static/vendor/quill.core.css") return staticAsset(quillCoreCss, "text/css; charset=utf-8");
    if (path === "/static/vendor/quill.snow.css") return staticAsset(quillSnowCss, "text/css; charset=utf-8");

    if (path === "/login" && method === "GET") return html(authPage(prefix, "login"));
    if (path === "/login" && method === "POST") return handleLogin(request, env, prefix);
    if (path === "/register" && method === "GET") return html(authPage(prefix, "register"));
    if (path === "/register" && method === "POST") return handleRegister(request, env, prefix);
    if (path === "/logout" && method === "POST") {
      const session = await getSession(request, env);
      if (session) {
        await userRoom(env, session.userId).fetch("https://user/logout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: session.token })
        });
      }
      return redirect(`${prefix}/`, { "set-cookie": clearSessionCookieHeader() });
    }

    // Public image serving (unguessable ids; images appear in shared docs).
    const imgMatch = path.match(/^\/img\/([A-Za-z0-9]{10,24})-([a-f0-9]{16})$/);
    if (imgMatch && method === "GET") {
      const object = await env.IMAGES.get(`u/${imgMatch[1]}/${imgMatch[2]}`);
      if (!object) return json({ error: "not_found" }, 404);
      const headers = new Headers();
      headers.set("content-type", object.httpMetadata?.contentType || "application/octet-stream");
      headers.set("cache-control", "public, max-age=31536000, immutable");
      headers.set("x-content-type-options", "nosniff");
      return new Response(object.body, { headers });
    }

    /* ---------- session-authenticated app ---------- */
    const session = await getSession(request, env);

    if (path === "/app" && method === "GET") {
      if (!session) return redirect(`${prefix}/login`);
      return html(dashboardPage(prefix, session.email));
    }

    if (path === "/app/state" && method === "GET") {
      if (!session) return json({ error: "unauthorized" }, 401);
      const state = await userRoom(env, session.userId).fetch("https://user/state").then((r) => r.json());
      state.estimatedMonthlyCents = estimateMonthlyCents(state.bytesStored);
      return json(state);
    }

    if (path === "/app/folders" && method === "POST") {
      if (!session) return json({ error: "unauthorized" }, 401);
      const body = await request.json().catch(() => ({}));
      return userRoom(env, session.userId).fetch("https://user/nodes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
    }

    const nodeMatch = path.match(/^\/app\/nodes\/([a-f0-9]{12})$/);
    if (nodeMatch && (method === "PATCH" || method === "DELETE")) {
      if (!session) return json({ error: "unauthorized" }, 401);
      const body = method === "PATCH" ? await request.json().catch(() => ({})) : undefined;
      return userRoom(env, session.userId).fetch(`https://user/nodes/${nodeMatch[1]}`, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
    }

    if (path === "/app/apikeys" && method === "POST") {
      if (!session) return json({ error: "unauthorized" }, 401);
      const body = await request.json().catch(() => ({}));
      return userRoom(env, session.userId).fetch("https://user/apikeys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
    }

    const keyMatch = path.match(/^\/app\/apikeys\/([a-f0-9]{12})$/);
    if (keyMatch && method === "DELETE") {
      if (!session) return json({ error: "unauthorized" }, 401);
      return userRoom(env, session.userId).fetch(`https://user/apikeys/${keyMatch[1]}`, { method: "DELETE" });
    }

    // Image upload (session only).
    if (path === "/api/v1/images" && method === "POST") {
      if (!session) return json({ error: "unauthorized" }, 401);
      const form = await request.formData().catch(() => null);
      const file = form?.get("file");
      if (!file || typeof file === "string") return json({ error: "missing_file" }, 400);
      const ext = IMAGE_TYPES[file.type];
      if (!ext) return json({ error: "unsupported_type", message: "仅支持 PNG/JPG/GIF/WebP" }, 400);
      if (file.size > MAX_IMAGE_BYTES) return json({ error: "too_large", message: "图片不能超过 10MB" }, 400);
      const imageId = randomToken(8);
      await env.IMAGES.put(`u/${session.userId}/${imageId}`, file.stream(), {
        httpMetadata: { contentType: file.type }
      });
      await userRoom(env, session.userId).fetch("https://user/images", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageId, bytes: file.size })
      });
      return json({ url: `${prefix}/img/${session.userId}-${imageId}`, bytes: file.size }, 201);
    }

    // Chat attachment file serving (unguessable keys, expire after 7 days).
    const fileMatch = path.match(/^\/file\/chat\/([0-9]+-[a-f0-9]{16})$/);
    if (fileMatch && method === "GET") {
      const object = await env.IMAGES.get(`chat/${fileMatch[1]}`);
      if (!object) return json({ error: "not_found" }, 404);
      const headers = new Headers();
      const contentType = object.httpMetadata?.contentType || "application/octet-stream";
      headers.set("content-type", contentType);
      headers.set("cache-control", "public, max-age=604800");
      headers.set("x-content-type-options", "nosniff");
      if (!contentType.startsWith("image/")) headers.set("content-disposition", "attachment");
      return new Response(object.body, { headers });
    }

    // Document creation from the dashboard.
    if (path === "/new" && method === "POST") {
      if (!session) return redirect(`${prefix}/login`);
      const form = await request.formData().catch(() => null);
      const title = String(form?.get("title") || "");
      const parent = String(form?.get("parent") || "") || null;
      const created = await createDocument(env, prefix, origin, session.userId, { title, parent });
      return redirect(created.edit_url);
    }

    // Sheet creation from the dashboard.
    if (path === "/sheet/new" && method === "POST") {
      if (!session) return redirect(`${prefix}/login`);
      const form = await request.formData().catch(() => null);
      const title = String(form?.get("title") || "");
      const parent = String(form?.get("parent") || "") || null;
      const id = randomId();
      await sheetRoom(env, id).fetch("https://sheet/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, owner: session.userId })
      });
      await userRoom(env, session.userId).fetch("https://user/docs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ docId: id, title, parent, kind: "sheet" })
      });
      return redirect(`${prefix}/sheet/${id}`);
    }

    // Sheet editor: any logged-in user with the link may collaborate
    // (link = unguessable id; see README for the access-control model).
    const sheetMatch = path.match(/^\/sheet\/([A-Za-z0-9]{6,24})(\/ws)?$/);
    if (sheetMatch) {
      if (!session) return redirect(`${prefix}/login`);
      const id = sheetMatch[1];
      const metaRes = await sheetRoom(env, id).fetch("https://sheet/meta");
      if (metaRes.status === 404) return html(notFoundPage(prefix), 404);
      const meta = await metaRes.json();
      if (sheetMatch[2] === "/ws") {
        return sheetRoom(env, id).fetch("https://sheet/ws", request);
      }
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const forwarded = request.headers.get("x-forwarded-prefix");
      const wsUrl = `${wsProtocol}//${url.host}${forwarded || prefix}/sheet/${id}/ws`;
      return html(sheetPage(prefix, id, meta.title, wsUrl));
    }

    // Chat room creation from the dashboard.
    if (path === "/chat/new" && method === "POST") {
      if (!session) return redirect(`${prefix}/login`);
      const form = await request.formData().catch(() => null);
      const name = String(form?.get("name") || "聊天室");
      const id = randomId();
      await chatRoom(env, id).fetch("https://chat/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, owner: session.userId })
      });
      return redirect(`${prefix}/chat/${id}`);
    }

    // Chat room page + websocket: any logged-in user with the link may join.
    const chatMatch = path.match(/^\/chat\/([A-Za-z0-9]{6,24})(\/ws)?$/);
    if (chatMatch) {
      if (!session) return redirect(`${prefix}/login`);
      const id = chatMatch[1];
      const metaRes = await chatRoom(env, id).fetch("https://chat/meta");
      if (metaRes.status === 404) return html(notFoundPage(prefix), 404);
      const meta = await metaRes.json();
      if (chatMatch[2] === "/ws") {
        return chatRoom(env, id).fetch("https://chat/ws", request);
      }
      // Record membership so the room shows up on the user's dashboard.
      await userRoom(env, session.userId).fetch("https://user/chats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId: id, name: meta.name })
      });
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const forwarded = request.headers.get("x-forwarded-prefix");
      const wsUrl = `${wsProtocol}//${url.host}${forwarded || prefix}/chat/${id}/ws`;
      return html(chatPage(prefix, id, meta.name, wsUrl));
    }

    // Chat attachment upload: one-time balance charge, 7-day retention.
    const chatUploadMatch = path.match(/^\/chat\/([A-Za-z0-9]{6,24})\/upload$/);
    if (chatUploadMatch && method === "POST") {
      if (!session) return json({ error: "unauthorized" }, 401);
      const metaRes = await chatRoom(env, chatUploadMatch[1]).fetch("https://chat/meta");
      if (metaRes.status === 404) return json({ error: "not_found" }, 404);
      const form = await request.formData().catch(() => null);
      const file = form?.get("file");
      if (!file || typeof file === "string") return json({ error: "missing_file" }, 400);
      if (file.size > MAX_FILE_BYTES) return json({ error: "too_large", message: "附件不能超过 25MB" }, 400);
      const key = `${Date.now()}-${randomToken(8)}`;
      const contentType = file.type || "application/octet-stream";
      await env.IMAGES.put(`chat/${key}`, file.stream(), {
        httpMetadata: { contentType }
      });
      const cents = oneTimeUploadCents(file.size);
      const charge = await userRoom(env, session.userId).fetch("https://user/charge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cents })
      });
      if (!charge.ok) {
        await env.IMAGES.delete(`chat/${key}`);
        return json({ error: "insufficient_balance", message: "余额不足，无法上传附件" }, 402);
      }
      return json({
        url: `${prefix}/file/chat/${key}`,
        name: String(file.name || "附件").slice(0, 200),
        size: file.size,
        contentType,
        chargedCents: cents
      }, 201);
    }

    // Meeting room creation from the dashboard.
    if (path === "/meet/new" && method === "POST") {
      if (!session) return redirect(`${prefix}/login`);
      const form = await request.formData().catch(() => null);
      const name = String(form?.get("name") || "会议");
      const id = randomId();
      await meetRoom(env, id).fetch("https://meet/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, owner: session.userId })
      });
      return redirect(`${prefix}/meet/${id}`);
    }

    // Cloudflare Realtime SFU proxy: the App Secret stays server-side, the
    // browser drives sessions/tracks through these endpoints. Returns 503
    // when Realtime credentials are not configured (client then uses mesh).
    const sfuMatch = path.match(/^\/meet\/([A-Za-z0-9]{6,24})\/sfu\/(session|sessions\/([A-Za-z0-9-]{8,128})\/(tracks|renegotiate|tracks\/close))$/);
    if (sfuMatch) {
      if (!session) return json({ error: "unauthorized" }, 401);
      if (!realtimeEnabled(env)) {
        return json({ error: "sfu_not_configured", message: "未配置 Cloudflare Realtime，音视频使用浏览器点对点模式" }, 503);
      }
      const metaRes = await meetRoom(env, sfuMatch[1]).fetch("https://meet/meta");
      if (metaRes.status === 404) return json({ error: "not_found" }, 404);
      const sub = sfuMatch[2];
      const sid = sfuMatch[3];
      // Response.json() cannot carry null-body statuses; normalize to 200.
      const sfuJson = (res) => json(res.data, [101, 204, 205, 304].includes(res.status) ? 200 : res.status);
      if (sub === "session" && method === "POST") {
        const body = await request.json().catch(() => null);
        const sessionDescription = sanitizeSessionDescription(body?.sessionDescription);
        if (!sessionDescription || sessionDescription.type !== "offer") {
          return json({ error: "bad_session_description" }, 400);
        }
        const res = await realtimeRequest(env, "/sessions/new", {
          method: "POST",
          body: { sessionDescription }
        });
        return sfuJson(res);
      }
      if (sid && sub.endsWith("/tracks") && method === "POST") {
        const body = await request.json().catch(() => null);
        const tracks = sanitizeTrackRefs(body?.tracks);
        if (!tracks) return json({ error: "bad_tracks" }, 400);
        const payload = { tracks };
        const sd = sanitizeSessionDescription(body?.sessionDescription);
        if (sd) payload.sessionDescription = sd;
        const res = await realtimeRequest(env, `/sessions/${sid}/tracks/new`, { method: "POST", body: payload });
        return sfuJson(res);
      }
      if (sid && sub.endsWith("/renegotiate") && method === "PUT") {
        const body = await request.json().catch(() => null);
        const sd = sanitizeSessionDescription(body?.sessionDescription);
        if (!sd) return json({ error: "bad_session_description" }, 400);
        const res = await realtimeRequest(env, `/sessions/${sid}/renegotiate`, {
          method: "PUT",
          body: { sessionDescription: sd }
        });
        return sfuJson(res);
      }
      if (sid && sub.endsWith("/tracks/close") && method === "PUT") {
        const body = await request.json().catch(() => null);
        const tracks = sanitizeTrackRefs(body?.tracks);
        if (!tracks) return json({ error: "bad_tracks" }, 400);
        const res = await realtimeRequest(env, `/sessions/${sid}/tracks/close`, { method: "PUT", body: { tracks } });
        return sfuJson(res);
      }
      return json({ error: "method_not_allowed" }, 405);
    }

    // Meeting room page + websocket: any logged-in user with the link may join.
    const meetMatch = path.match(/^\/meet\/([A-Za-z0-9]{6,24})(\/ws)?$/);
    if (meetMatch) {
      if (!session) return redirect(`${prefix}/login`);
      const id = meetMatch[1];
      const metaRes = await meetRoom(env, id).fetch("https://meet/meta");
      if (metaRes.status === 404) return html(notFoundPage(prefix), 404);
      const meta = await metaRes.json();
      if (meetMatch[2] === "/ws") {
        return meetRoom(env, id).fetch("https://meet/ws", request);
      }
      await userRoom(env, session.userId).fetch("https://user/meets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId: id, name: meta.name })
      });
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const forwarded = request.headers.get("x-forwarded-prefix");
      const wsUrl = `${wsProtocol}//${url.host}${forwarded || prefix}/meet/${id}/ws`;
      return html(meetPage(prefix, id, meta.name, wsUrl, realtimeEnabled(env)));
    }

    // Public doc-title lookup for auto-titling document links (any logged-in user).
    const titleMatch = path.match(/^\/d\/([A-Za-z0-9]{6,24})\/title$/);
    if (titleMatch && method === "GET") {
      if (!session) return json({ error: "unauthorized" }, 401);
      const response = await roomOr404(env, titleMatch[1], "/meta");
      if (!response) return json({ error: "not_found" }, 404);
      const meta = await response.json();
      return json({ title: meta.title });
    }

    // Editor via owner link.
    const docMatch = path.match(/^\/d\/([A-Za-z0-9]{6,24})(\/ws)?$/);
    if (docMatch) {
      if (!session) return redirect(`${prefix}/login`);
      const id = docMatch[1];
      const metaRes = await roomOr404(env, id, "/meta");
      if (!metaRes) return html(notFoundPage(prefix), 404);
      const meta = await metaRes.json();
      if (meta.owner !== session.userId) {
        return html(shareErrorPage(prefix, "这是他人的私有文档", "请向文档所有者索取分享链接。"), 403);
      }
      if (docMatch[2] === "/ws") {
        return room(env, id).fetch("https://room/ws", request);
      }
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const forwarded = request.headers.get("x-forwarded-prefix");
      const wsUrl = `${wsProtocol}//${url.host}${forwarded || prefix}/d/${id}/ws`;
      return html(editorPage(prefix, id, meta.title, wsUrl, { readOnly: false, isOwner: true }));
    }

    // Editor via share link.
    const shareMatch = path.match(/^\/s\/([A-Za-z0-9]{10}[a-f0-9]{24})(\/ws)?$/);
    if (shareMatch) {
      if (!session) return redirect(`${prefix}/login`);
      const token = shareMatch[1];
      const share = await resolveShare(env, token);
      if (share.status === 404) return html(shareErrorPage(prefix, "分享链接无效", "链接可能已被删除。"), 404);
      if (share.status === 410) return html(shareErrorPage(prefix, "分享链接已过期", "请向文档所有者索取新的分享链接。"), 410);
      if (shareMatch[2] === "/ws") {
        const headers = new Headers(request.headers);
        headers.set("x-share-mode", share.mode);
        return room(env, share.docId).fetch("https://room/ws", new Request(request.url, {
          method: request.method, headers, redirect: request.redirect
        }));
      }
      const metaRes = await roomOr404(env, share.docId, "/meta");
      if (!metaRes) return html(notFoundPage(prefix), 404);
      const meta = await metaRes.json();
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const forwarded = request.headers.get("x-forwarded-prefix");
      const wsUrl = `${wsProtocol}//${url.host}${forwarded || prefix}/s/${token}/ws`;
      const readOnly = share.mode === "ro";
      // Owner visiting their own share link gets full access.
      const isOwner = meta.owner === session.userId;
      return html(editorPage(prefix, share.docId, meta.title, wsUrl, {
        readOnly: readOnly && !isOwner,
        isOwner,
        shareToken: token
      }));
    }

    // Share link management (owner, session only).
    const sharesMatch = path.match(/^\/d\/([A-Za-z0-9]{6,24})\/shares(\/([A-Za-z0-9]{10}[a-f0-9]{24}))?$/);
    if (sharesMatch) {
      if (!session) return json({ error: "unauthorized" }, 401);
      const id = sharesMatch[1];
      const metaRes = await roomOr404(env, id, "/meta");
      if (!metaRes) return json({ error: "not_found" }, 404);
      if ((await metaRes.json()).owner !== session.userId) return json({ error: "forbidden" }, 403);
      if (!sharesMatch[2] && method === "GET") {
        const data = await room(env, id).fetch("https://room/shares").then((r) => r.json());
        data.shares = data.shares.map((s) => ({ ...s, url: `${origin}${prefix}/s/${s.token}` }));
        return json(data);
      }
      if (!sharesMatch[2] && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const expiresIn = { day: 86400000, week: 604800000, month: 2592000000 }[body.expiresIn] || null;
        const created = await room(env, id).fetch("https://room/shares", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: body.mode === "rw" ? "rw" : "ro", expiresAt: expiresIn ? Date.now() + expiresIn : null })
        }).then((r) => r.json());
        return json({ ...created, url: `${origin}${prefix}/s/${created.token}` }, 201);
      }
      if (sharesMatch[3] && method === "DELETE") {
        return room(env, id).fetch(`https://room/shares/${sharesMatch[3]}`, { method: "DELETE" });
      }
      return json({ error: "method_not_allowed" }, 405);
    }

    /* ---------- REST API (session or API key, owner only) ---------- */
    if (path === "/api/v1/documents" && method === "POST") {
      const auth = await getAuth(request, env) || session;
      if (!auth) return json({ error: "unauthorized" }, 401);
      const body = await request.json().catch(() => ({}));
      return json(await createDocument(env, prefix, origin, auth.userId, body), 201);
    }

    if (path === "/api/v1/documents" && method === "GET") {
      const auth = await getAuth(request, env) || session;
      if (!auth) return json({ error: "unauthorized" }, 401);
      const state = await userRoom(env, auth.userId).fetch("https://user/state").then((r) => r.json());
      return json({
        documents: state.docs.map((d) => ({
          document_id: d.id,
          title: d.title,
          created_at: d.createdAt,
          updated_at: d.updatedAt,
          url: `${origin}${prefix}/d/${d.id}`
        }))
      });
    }

    const apiMatch = path.match(/^\/api\/v1\/documents\/([A-Za-z0-9]{6,24})(\/[a-z]+)?$/);
    if (apiMatch) {
      const auth = await getAuth(request, env) || session;
      if (!auth) return json({ error: "unauthorized" }, 401);
      const id = apiMatch[1];
      const sub = apiMatch[2] || "";
      if (!ID_PATTERN.test(id)) return json({ error: "bad_id" }, 400);
      const metaRes = await roomOr404(env, id, "/meta");
      if (!metaRes) return json({ error: "not_found" }, 404);
      const meta = await metaRes.json();
      if (meta.owner !== auth.userId) return json({ error: "forbidden" }, 403);

      if (sub === "" && method === "GET") {
        return json({
          document: { document_id: id, ...meta },
          url: `${origin}${prefix}/d/${id}`,
          edit_url: `${origin}${prefix}/d/${id}`
        });
      }
      if (sub === "" && method === "PATCH") {
        const body = await request.json().catch(() => ({}));
        const response = await room(env, id).fetch("https://room/meta", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: body.title })
        });
        return json({ document: { document_id: id, ...(await response.json()) } });
      }
      if (sub === "/content" && method === "GET") {
        const revParam = url.searchParams.get("rev");
        const response = await room(env, id).fetch(`https://room/content${revParam ? `?rev=${encodeURIComponent(revParam)}` : ""}`);
        const data = await response.json();
        if (!response.ok) return json(data, response.status);
        return json({ document_id: id, ...data });
      }
      if (sub === "/revisions" && method === "GET") {
        const limit = url.searchParams.get("limit") || "100";
        const response = await room(env, id).fetch(`https://room/revisions?limit=${encodeURIComponent(limit)}`);
        return json({ document_id: id, ...(await response.json()) });
      }
      if (sub === "/collaborators" && method === "GET") {
        const response = await room(env, id).fetch("https://room/collaborators");
        return json({ document_id: id, ...(await response.json()) });
      }
      if (sub === "/export" && method === "GET") {
        const contentRes = await room(env, id).fetch("https://room/content");
        const { delta, text } = await contentRes.json();
        const format = url.searchParams.get("format") || "markdown";
        const isTxt = format === "txt";
        const title = meta.title || "未命名文档";
        const body = isTxt ? `${title}\n\n${text}` : `# ${title}\n\n${deltaToMarkdown(delta.ops)}`;
        const filename = `${title}-${id}.${isTxt ? "txt" : "md"}`;
        return new Response(body, {
          headers: {
            "content-type": `${isTxt ? "text/plain" : "text/markdown"}; charset=utf-8`,
            "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
          }
        });
      }
      return json({ error: "not_found" }, 404);
    }

    return json({ error: "not_found" }, 404);
  }
};
