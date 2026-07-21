import test from "node:test";
import assert from "node:assert/strict";
import {
  REALTIME_API_BASE, TURN_API_BASE, mediaRelayEnabled, realtimeEnabled, realtimeRequest, realtimeUrl,
  sanitizeCloseTrackRefs, sanitizeTrackRefs, sanitizeSessionDescription, sanitizeTurnIceServers,
  turnCredentialsRequest, turnEnabled, turnUrl
} from "../src/realtime.js";

test("realtimeEnabled requires both credentials", () => {
  assert.equal(realtimeEnabled({}), false);
  assert.equal(realtimeEnabled({ REALTIME_APP_ID: "abc" }), false);
  assert.equal(realtimeEnabled({ REALTIME_APP_SECRET: "xyz" }), false);
  assert.equal(realtimeEnabled({ REALTIME_APP_ID: "abc", REALTIME_APP_SECRET: "xyz" }), true);
});

test("mediaRelayEnabled requires SFU and TURN credentials", () => {
  const all = {
    REALTIME_APP_ID: "app",
    REALTIME_APP_SECRET: "app-secret",
    TURN_KEY_ID: "turn",
    TURN_KEY_API_TOKEN: "turn-secret"
  };
  assert.equal(turnEnabled(all), true);
  assert.equal(mediaRelayEnabled(all), true);
  assert.equal(mediaRelayEnabled({ REALTIME_APP_ID: "app", REALTIME_APP_SECRET: "secret" }), false);
  assert.equal(mediaRelayEnabled({ TURN_KEY_ID: "turn", TURN_KEY_API_TOKEN: "secret" }), false);
});

test("realtimeUrl builds Connection API URLs", () => {
  assert.equal(realtimeUrl("app123", "/sessions/new"), `${REALTIME_API_BASE}/app123/sessions/new`);
  assert.equal(
    realtimeUrl("app123", "/sessions/sess456/tracks/new"),
    `${REALTIME_API_BASE}/app123/sessions/sess456/tracks/new`
  );
});

test("turnUrl builds the credential endpoint", () => {
  assert.equal(
    turnUrl("key123"),
    `${TURN_API_BASE}/key123/credentials/generate-ice-servers`
  );
});

test("sanitizeTurnIceServers keeps authenticated relays and drops STUN and port 53", () => {
  assert.deepEqual(sanitizeTurnIceServers([
    { urls: ["stun:stun.cloudflare.com:3478", "stun:stun.cloudflare.com:53"] },
    {
      urls: [
        "turn:turn.cloudflare.com:3478?transport=udp",
        "turn:turn.cloudflare.com:53?transport=udp",
        "turns:turn.cloudflare.com:443?transport=tcp"
      ],
      username: "u",
      credential: "c"
    }
  ]), [{
    urls: [
      "turn:turn.cloudflare.com:3478?transport=udp",
      "turns:turn.cloudflare.com:443?transport=tcp"
    ],
    username: "u",
    credential: "c"
  }]);
  assert.equal(sanitizeTurnIceServers([{ urls: "stun:stun.cloudflare.com:3478" }]), null);
});

test("turnCredentialsRequest uses the TURN bearer and requested TTL", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    request = { url, init };
    return Response.json({ iceServers: [] });
  });
  const result = await turnCredentialsRequest({ TURN_KEY_ID: "kid", TURN_KEY_API_TOKEN: "token" }, 3600);
  assert.equal(request.url, `${TURN_API_BASE}/kid/credentials/generate-ice-servers`);
  assert.equal(request.init.headers.authorization, "Bearer token");
  assert.deepEqual(JSON.parse(request.init.body), { ttl: 3600 });
  assert.equal(result.status, 200);
});

test("realtimeRequest retries a session-not-ready 425 response", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    if (calls === 1) {
      return Response.json({ error: "session_not_ready" }, {
        status: 425,
        headers: { "retry-after": "0" }
      });
    }
    return Response.json({ tracks: [{ trackName: "video" }] });
  });

  const result = await realtimeRequest(
    { REALTIME_APP_ID: "app", REALTIME_APP_SECRET: "secret" },
    "/sessions/session/tracks/new",
    { method: "POST", body: { tracks: [] } }
  );

  assert.equal(calls, 2);
  assert.equal(result.status, 200);
  assert.deepEqual(result.data, { tracks: [{ trackName: "video" }] });
});

test("sanitizeTrackRefs accepts valid local and remote refs", () => {
  assert.deepEqual(
    sanitizeTrackRefs([{ location: "local", mid: "0", trackName: "m1-c2-a3f9k2-audio" }]),
    [{ location: "local", mid: "0", trackName: "m1-c2-a3f9k2-audio" }]
  );
  assert.deepEqual(
    sanitizeTrackRefs([{ location: "remote", sessionId: "2a95132c-1573-2412", trackName: "t" }]),
    [{ location: "remote", sessionId: "2a95132c-1573-2412", trackName: "t" }]
  );
  // extra fields are stripped
  assert.deepEqual(
    sanitizeTrackRefs([{ location: "local", trackName: "a", evil: "x" }]),
    [{ location: "local", trackName: "a" }]
  );
});

test("sanitizeTrackRefs rejects malformed input", () => {
  assert.equal(sanitizeTrackRefs(null), null);
  assert.equal(sanitizeTrackRefs([]), null);
  assert.equal(sanitizeTrackRefs("tracks"), null);
  assert.equal(sanitizeTrackRefs(new Array(33).fill({ location: "local", trackName: "a" })), null);
  assert.equal(sanitizeTrackRefs([{ location: "nowhere", trackName: "a" }]), null);
  assert.equal(sanitizeTrackRefs([{ location: "local", trackName: "bad name!" }]), null);
  assert.equal(sanitizeTrackRefs([{ location: "local", trackName: "" }]), null);
  assert.equal(sanitizeTrackRefs([{ location: "remote", sessionId: "short", trackName: "a" }]), null);
  assert.equal(sanitizeTrackRefs([{ location: "remote", sessionId: "", trackName: "a" }]), null);
  assert.equal(sanitizeTrackRefs([{ location: "local", mid: "not a mid!", trackName: "a" }]), null);
});

test("sanitizeCloseTrackRefs accepts only mids", () => {
  assert.deepEqual(sanitizeCloseTrackRefs([{ mid: "0", trackName: "ignored" }]), [{ mid: "0" }]);
  assert.equal(sanitizeCloseTrackRefs([{ trackName: "missing-mid" }]), null);
  assert.equal(sanitizeCloseTrackRefs([{ mid: "not a mid" }]), null);
  assert.equal(sanitizeCloseTrackRefs([]), null);
});

test("sanitizeSessionDescription validates type and sdp", () => {
  assert.deepEqual(
    sanitizeSessionDescription({ type: "offer", sdp: "v=0 ..." }),
    { type: "offer", sdp: "v=0 ..." }
  );
  assert.deepEqual(
    sanitizeSessionDescription({ type: "answer", sdp: "v=0 ..." }),
    { type: "answer", sdp: "v=0 ..." }
  );
  assert.equal(sanitizeSessionDescription({ type: "pranswer", sdp: "v=0" }), null);
  assert.equal(sanitizeSessionDescription({ type: "offer", sdp: "" }), null);
  assert.equal(sanitizeSessionDescription({ type: "offer", sdp: "x".repeat(65537) }), null);
  assert.equal(sanitizeSessionDescription(null), null);
  assert.equal(sanitizeSessionDescription("offer"), null);
});
