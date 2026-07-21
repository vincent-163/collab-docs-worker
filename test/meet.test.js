import test from "node:test";
import assert from "node:assert/strict";
import { meetPage, meetEndedPage } from "../src/pages.js";
import { MEET_JS } from "../src/static.js";

test("meetPage renders end button and isOwner flag only for the owner", () => {
  const owner = meetPage("", "meet123", "周会", "wss://x/ws", false, true);
  assert.ok(owner.includes('id="btn-end"'));
  assert.ok(owner.includes("结束会议"));
  assert.ok(owner.includes('"isOwner":true'));

  const guest = meetPage("", "meet123", "周会", "wss://x/ws", false, false);
  assert.ok(!guest.includes('id="btn-end"'));
  assert.ok(guest.includes('"isOwner":false'));

  // default (old signature) behaves like a guest
  const legacy = meetPage("", "meet123", "周会", "wss://x/ws");
  assert.ok(!legacy.includes('id="btn-end"'));
});

test("meetPage exposes SFU-only screen sharing controls", () => {
  const page = meetPage("/docs", "meet123", "周会", "wss://x/ws", true, false);
  assert.ok(page.includes('id="btn-screen"'));
  assert.ok(page.includes("分享屏幕"));
  assert.ok(page.includes("不建立参会者点对点连接"));
  assert.ok(page.includes("static/meet.js?v=10"));
});

test("meetPage escapes the meeting name and ships the ended overlay", () => {
  const page = meetPage("", "meet123", '<img src=x onerror=alert(1)> "q"', "wss://x/ws", false, true);
  assert.ok(!page.includes("<img src=x"));
  assert.ok(page.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert.ok(page.includes('id="meet-ended-overlay"'));
});

test("meetEndedPage shows name, end time and a way back, escaped", () => {
  const page = meetEndedPage("/docs", '总结<b>会</b>', Date.UTC(2026, 6, 21, 9, 30));
  assert.ok(page.includes("会议已结束"));
  assert.ok(page.includes("总结&lt;b&gt;会&lt;/b&gt;"));
  assert.ok(!page.includes("总结<b>会</b>"));
  assert.ok(page.includes("结束时间：2026/7/21 17:30")); // Asia/Shanghai
  assert.ok(page.includes('href="/docs/app"'));
});

test("meetEndedPage tolerates a missing end time", () => {
  const page = meetEndedPage("", "会议", null);
  assert.ok(page.includes("会议已结束"));
  assert.ok(!page.includes("结束时间"));
});

test("meet client handles the ended terminal state", () => {
  assert.ok(MEET_JS.includes("function handleEnded(endedAt)"));
  assert.ok(MEET_JS.includes("event.code === 4000"));
  assert.ok(MEET_JS.includes("meeting_ended"));
  assert.ok(MEET_JS.includes("'/end'"));
  // reconnect timer must be tracked so it can be cancelled on end
  assert.ok(MEET_JS.includes("reconnectTimer = setTimeout(connect, backoff)"));
});

test("meet client publishes screen tracks without mesh fallback", () => {
  assert.ok(MEET_JS.includes("getDisplayMedia"));
  assert.ok(MEET_JS.includes("function startScreenShare()"));
  assert.ok(MEET_JS.includes("function stopScreenShare()"));
  assert.ok(MEET_JS.includes("sfuPublish(stream, 'screen')"));
  assert.ok(MEET_JS.includes("sfuApi('/ice', 'POST')"));
  assert.ok(MEET_JS.includes("iceTransportPolicy: 'relay'"));
  assert.ok(!MEET_JS.includes("stun:stun.cloudflare.com"));
  assert.ok(MEET_JS.includes("res.sessionDescription.type === 'answer'"));
  assert.ok(MEET_JS.includes("source: meta.source"));
  assert.ok(!MEET_JS.includes("已回退到浏览器点对点模式"));
  assert.ok(!MEET_JS.includes("type: 'signal'"));
  assert.ok(!MEET_JS.includes("stun.l.google.com"));
});
