import test from "node:test";
import assert from "node:assert/strict";
import {
  REALTIME_API_BASE, realtimeEnabled, realtimeUrl, sanitizeTrackRefs, sanitizeSessionDescription
} from "../src/realtime.js";

test("realtimeEnabled requires both credentials", () => {
  assert.equal(realtimeEnabled({}), false);
  assert.equal(realtimeEnabled({ REALTIME_APP_ID: "abc" }), false);
  assert.equal(realtimeEnabled({ REALTIME_APP_SECRET: "xyz" }), false);
  assert.equal(realtimeEnabled({ REALTIME_APP_ID: "abc", REALTIME_APP_SECRET: "xyz" }), true);
});

test("realtimeUrl builds Connection API URLs", () => {
  assert.equal(realtimeUrl("app123", "/sessions/new"), `${REALTIME_API_BASE}/app123/sessions/new`);
  assert.equal(
    realtimeUrl("app123", "/sessions/sess456/tracks/new"),
    `${REALTIME_API_BASE}/app123/sessions/sess456/tracks/new`
  );
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
