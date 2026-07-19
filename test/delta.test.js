import test from "node:test";
import assert from "node:assert/strict";
import Delta from "quill-delta";
import { sanitizeDelta } from "../src/delta-sanitize.js";
import { deltaToText, deltaToMarkdown } from "../src/delta-export.js";

test("delta transform converges like the server does", () => {
  const base = new Delta().insert("hello world\n");
  const a = new Delta().insert("A:"); // insert at 0
  const b = new Delta().retain(11).insert(" :B"); // append before trailing newline

  // Server applies A, then B transformed over A (history priority).
  const serverAfterA = base.compose(a);
  const bTransformed = a.transform(b, true);
  const serverFinal = serverAfterA.compose(bTransformed);

  // Client B applied its own op locally, then receives A transformed over it.
  const aOverB = b.transform(a, false);
  const bFinal = base.compose(b).compose(aOverB);

  assert.deepEqual(bFinal, serverFinal);
  assert.deepEqual(serverFinal, base.compose(a).compose(bTransformed));
});

test("sanitizeDelta accepts formatting, images and tables", () => {
  const d = sanitizeDelta({
    ops: [
      { insert: "标题文字" },
      { insert: "\n", attributes: { header: 1 } },
      { insert: "加粗", attributes: { bold: true, color: "#e74c3c" } },
      { insert: { image: "https://example.com/a.png" } },
      { insert: "\n" },
      { insert: "单元格" },
      { insert: "\n", attributes: { table: "row-1" } }
    ]
  });
  assert.ok(d instanceof Delta);
  assert.equal(d.ops.length, 7);
});

test("sanitizeDelta strips dangerous or unknown content", () => {
  // javascript: links are dropped
  const d = sanitizeDelta({ ops: [{ insert: "x", attributes: { link: "javascript:alert(1)", bold: true } }] });
  assert.deepEqual(d.ops, [{ insert: "x", attributes: { bold: true } }]);
  // non-image embeds rejected
  assert.equal(sanitizeDelta({ ops: [{ insert: { video: "https://x" } }] }), null);
  // css injection in color is dropped
  const d2 = sanitizeDelta({ ops: [{ insert: "x", attributes: { color: "red;position:fixed" } }] });
  assert.deepEqual(d2.ops, [{ insert: "x" }]);
  // malformed ops rejected
  assert.equal(sanitizeDelta({ ops: [{ retain: -1 }] }), null);
  assert.equal(sanitizeDelta({ ops: [{ insert: "a", retain: 1 }] }), null);
  assert.equal(sanitizeDelta({ ops: [] }), null);
  assert.equal(sanitizeDelta({}), null);
});

test("deltaToText extracts plain text", () => {
  const ops = [
    { insert: "你好" },
    { insert: { image: "https://x/a.png" } },
    { insert: "世界\n" }
  ];
  assert.equal(deltaToText(ops), "你好[图片]世界");
});

test("deltaToMarkdown renders blocks and inline styles", () => {
  const ops = [
    { insert: "大标题" },
    { insert: "\n", attributes: { header: 1 } },
    { insert: "加粗", attributes: { bold: true } },
    { insert: "和" },
    { insert: "斜体", attributes: { italic: true } },
    { insert: "还有链接", attributes: { link: "https://example.com" } },
    { insert: "\n" },
    { insert: "第一项" },
    { insert: "\n", attributes: { list: "bullet" } },
    { insert: "let x = 1;" },
    { insert: "\n", attributes: { "code-block": true } },
    { insert: "引用" },
    { insert: "\n", attributes: { blockquote: true } },
    { insert: { image: "https://x/a.png" } },
    { insert: "\n" }
  ];
  const md = deltaToMarkdown(ops);
  assert.match(md, /^# 大标题/m);
  assert.match(md, /\*\*加粗\*\*和\*斜体\*\[还有链接\]\(https:\/\/example\.com\)/);
  assert.match(md, /^- 第一项/m);
  assert.match(md, /```\nlet x = 1;\n```/);
  assert.match(md, /^> 引用/m);
  assert.match(md, /!\[图片\]\(https:\/\/x\/a\.png\)/);
});

test("deltaToMarkdown renders tables as markdown tables", () => {
  const ops = [
    { insert: "A1" }, { insert: "\n", attributes: { table: "r1" } },
    { insert: "B1" }, { insert: "\n", attributes: { table: "r1" } },
    { insert: "A2" }, { insert: "\n", attributes: { table: "r2" } },
    { insert: "B2" }, { insert: "\n", attributes: { table: "r2" } },
    { insert: "\n" }
  ];
  const md = deltaToMarkdown(ops);
  assert.match(md, /\| A1 \| B1 \|/);
  assert.match(md, /\| --- \| --- \|/);
  assert.match(md, /\| A2 \| B2 \|/);
});
