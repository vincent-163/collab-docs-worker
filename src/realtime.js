// Cloudflare Realtime SFU (formerly Cloudflare Calls) integration.
// The Worker proxies the HTTPS Connection API so the App Secret never
// reaches browsers. Docs: https://developers.cloudflare.com/realtime/sfu/
//
// Only the small helpers in this file are imported by unit tests; the
// fetch-based client is used from src/index.js at runtime.

export const REALTIME_API_BASE = "https://rtc.live.cloudflare.com/v1/apps";
export const TURN_API_BASE = "https://rtc.live.cloudflare.com/v1/turn/keys";

export function realtimeEnabled(env) {
  return !!(env.REALTIME_APP_ID && env.REALTIME_APP_SECRET);
}

export function turnEnabled(env) {
  return !!(env.TURN_KEY_ID && env.TURN_KEY_API_TOKEN);
}

export function mediaRelayEnabled(env) {
  return realtimeEnabled(env) && turnEnabled(env);
}

export function realtimeUrl(appId, path) {
  return `${REALTIME_API_BASE}/${appId}${path}`;
}

export function turnUrl(keyId) {
  return `${TURN_API_BASE}/${keyId}/credentials/generate-ice-servers`;
}

const TRACK_NAME_RE = /^[A-Za-z0-9_-]{1,64}$/;
const SESSION_ID_RE = /^[A-Za-z0-9-]{8,128}$/;
const MID_RE = /^[A-Za-z0-9]{1,8}$/;
const MAX_TRACKS_PER_CALL = 32;
const MAX_READY_RETRIES = 1;
const READY_RETRY_BASE_MS = 100;

// Validate a tracks array before proxying to the Realtime API.
// Returns a sanitized array or null.
export function sanitizeTrackRefs(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_TRACKS_PER_CALL) return null;
  const out = [];
  for (const t of input) {
    if (!t || typeof t !== "object") return null;
    const location = t.location === "local" || t.location === "remote" ? t.location : null;
    if (!location) return null;
    const trackName = String(t.trackName || "");
    if (!TRACK_NAME_RE.test(trackName)) return null;
    const ref = { location, trackName };
    if (location === "remote") {
      const sessionId = String(t.sessionId || "");
      if (!SESSION_ID_RE.test(sessionId)) return null;
      ref.sessionId = sessionId;
    }
    if (t.mid !== undefined && t.mid !== null) {
      const mid = String(t.mid);
      if (!MID_RE.test(mid)) return null;
      ref.mid = mid;
    }
    out.push(ref);
  }
  return out;
}

export function sanitizeCloseTrackRefs(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_TRACKS_PER_CALL) return null;
  const out = [];
  for (const track of input) {
    if (!track || typeof track !== "object") return null;
    const mid = String(track.mid ?? "");
    if (!MID_RE.test(mid)) return null;
    out.push({ mid });
  }
  return out;
}

// Validate a { type, sdp } session description from the browser.
export function sanitizeSessionDescription(input) {
  if (!input || typeof input !== "object") return null;
  if (input.type !== "offer" && input.type !== "answer") return null;
  const sdp = String(input.sdp || "");
  if (!sdp || sdp.length > 65536) return null;
  return { type: input.type, sdp };
}

export function sanitizeTurnIceServers(input) {
  if (!Array.isArray(input)) return null;
  const out = [];
  for (const server of input) {
    if (!server || typeof server !== "object") continue;
    const username = typeof server.username === "string" ? server.username : "";
    const credential = typeof server.credential === "string" ? server.credential : "";
    const urls = (Array.isArray(server.urls) ? server.urls : [server.urls])
      .filter((url) => typeof url === "string")
      .filter((url) => /^turns?:/i.test(url) && !/:53(?:\?|$)/.test(url));
    if (username && credential && urls.length) out.push({ urls, username, credential });
  }
  return out.length ? out : null;
}

// Call the Realtime Connection API with the App Secret (server-side only).
export async function realtimeRequest(env, path, { method = "GET", body } = {}, attempt = 0) {
  const res = await fetch(realtimeUrl(env.REALTIME_APP_ID, path), {
    method,
    headers: {
      authorization: `Bearer ${env.REALTIME_APP_SECRET}`,
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 425 && attempt < MAX_READY_RETRIES) {
    const retryAfter = Number.parseFloat(res.headers.get("retry-after") || "");
    const delayMs = Number.isFinite(retryAfter)
      ? Math.min(Math.max(retryAfter * 1000, READY_RETRY_BASE_MS), 2000)
      : Math.min(READY_RETRY_BASE_MS * (2 ** attempt), 1600);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return realtimeRequest(env, path, { method, body }, attempt + 1);
  }
  const data = await res.json().catch(() => ({ error: "sfu_upstream", status: res.status }));
  return { status: res.status, data };
}

export async function turnCredentialsRequest(env, ttl = 86400) {
  const res = await fetch(turnUrl(env.TURN_KEY_ID), {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ ttl })
  });
  const data = await res.json().catch(() => ({ error: "turn_upstream", status: res.status }));
  return { status: res.status, data };
}
