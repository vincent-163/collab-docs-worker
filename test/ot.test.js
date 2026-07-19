import test from "node:test";
import assert from "node:assert/strict";
import { applyOps, transformOp, transformOps, mapPosition, diffOps, sanitizeOps, composeOps } from "../src/ot.js";

test("applyOps insert and delete", () => {
  assert.equal(applyOps("hello world", [{ t: "ins", p: 5, s: "," }]), "hello, world");
  assert.equal(applyOps("hello, world", [{ t: "del", p: 5, l: 1 }]), "hello world");
  assert.equal(applyOps("abc", [{ t: "del", p: 0, l: 1 }, { t: "ins", p: 0, s: "z" }]), "zbc");
});

test("diffOps produces ops that transform old into new", () => {
  const cases = [
    ["", "abc"],
    ["abc", ""],
    ["hello", "hello world"],
    ["hello world", "hello"],
    ["abcdef", "abXYef"],
    ["同一段文字", "同一批文字哦"],
    ["aaa", "aaa"]
  ];
  for (const [a, b] of cases) {
    assert.equal(applyOps(a, diffOps(a, b)), b, `diff ${a} -> ${b}`);
  }
});

test("transform insert vs insert with priority", () => {
  const a = { t: "ins", p: 2, s: "XX" };
  const b = { t: "ins", p: 2, s: "YY" };
  assert.deepEqual(transformOp(b, a, true), { t: "ins", p: 4, s: "YY" });
  assert.deepEqual(transformOp(a, b, false), a);
});

test("transform delete vs delete overlap", () => {
  const a = { t: "del", p: 2, l: 3 }; // removes [2,5)
  const b = { t: "del", p: 4, l: 3 }; // removes [4,7)
  assert.deepEqual(transformOp(b, a, true), { t: "del", p: 2, l: 2 });
  assert.equal(transformOp({ t: "del", p: 2, l: 3 }, a, true), null);
  assert.deepEqual(transformOp({ t: "del", p: 8, l: 2 }, a, true), { t: "del", p: 5, l: 2 });
});

// Simulates server + two concurrent clients and asserts convergence.
// Server applies A's op first, then B's op transformed over A. Client A has no
// pending ops and applies the broadcast directly; client B keeps its own op
// pending and must transform the incoming server op over it before applying.
function simulate(serverText, clientOpsA, clientOpsB) {
  const bForServer = transformOps(clientOpsB, clientOpsA);
  const serverFinal = applyOps(applyOps(serverText, clientOpsA), bForServer);
  const aFinal = applyOps(applyOps(serverText, clientOpsA), bForServer);
  const aOverB = transformOps(clientOpsA, clientOpsB, false);
  const bPendingAfter = transformOps(clientOpsB, clientOpsA);
  const bFinal = applyOps(applyOps(serverText, clientOpsB), aOverB);
  assert.deepEqual(bPendingAfter, bForServer, "client/server pending transform mismatch");
  return { serverFinal, aFinal, bFinal };
}

test("concurrent edits converge", () => {
  const cases = [
    ["hello world", [{ t: "ins", p: 0, s: "A" }], [{ t: "ins", p: 11, s: "B" }]],
    ["hello world", [{ t: "ins", p: 5, s: "A" }], [{ t: "ins", p: 5, s: "B" }]],
    ["hello world", [{ t: "del", p: 0, l: 6 }], [{ t: "ins", p: 6, s: "B" }]],
    ["hello world", [{ t: "del", p: 0, l: 5 }], [{ t: "del", p: 6, l: 5 }]],
    ["hello world", [{ t: "del", p: 2, l: 6 }], [{ t: "del", p: 4, l: 4 }]],
    ["abcdef", [{ t: "del", p: 1, l: 2 }, { t: "ins", p: 1, s: "X" }], [{ t: "ins", p: 3, s: "Y" }]]
  ];
  for (const [base, opsA, opsB] of cases) {
    const { serverFinal, aFinal, bFinal } = simulate(base, opsA, opsB);
    assert.equal(aFinal, serverFinal, `A diverged for ${JSON.stringify([base, opsA, opsB])}`);
    assert.equal(bFinal, serverFinal, `B diverged for ${JSON.stringify([base, opsA, opsB])}`);
  }
});

test("transformOps chains multiple history ops", () => {
  const history = [
    { t: "ins", p: 0, s: "ab" },
    { t: "del", p: 3, l: 2 }
  ];
  const moved = transformOps([{ t: "ins", p: 5, s: "Z" }], history);
  const base = "0123456789";
  const serverText = applyOps(applyOps(base, [history[0]]), [history[1]]);
  assert.equal(applyOps(serverText, moved), applyOps(applyOps(base, history), moved));
});

test("mapPosition tracks caret through ops", () => {
  assert.equal(mapPosition(5, [{ t: "ins", p: 2, s: "abc" }]), 8);
  assert.equal(mapPosition(1, [{ t: "ins", p: 2, s: "abc" }]), 1);
  assert.equal(mapPosition(5, [{ t: "del", p: 2, l: 2 }]), 3);
  assert.equal(mapPosition(3, [{ t: "del", p: 2, l: 5 }]), 2);
});

test("composeOps merges adjacent inserts and deletes", () => {
  const typed = composeOps(
    [{ t: "ins", p: 0, s: "a" }],
    [{ t: "ins", p: 1, s: "b" }, { t: "ins", p: 2, s: "c" }]
  );
  assert.deepEqual(typed, [{ t: "ins", p: 0, s: "abc" }]);
  const backspaces = composeOps(
    [{ t: "del", p: 5, l: 1 }],
    [{ t: "del", p: 4, l: 1 }, { t: "del", p: 3, l: 1 }]
  );
  assert.deepEqual(backspaces, [{ t: "del", p: 3, l: 3 }]);
  const mixed = composeOps([{ t: "ins", p: 0, s: "a" }], [{ t: "del", p: 0, l: 1 }]);
  assert.equal(mixed.length, 2);
  // composed ops must equal sequential application
  const seq = [diffOps("hello", "helloX"), diffOps("helloX", "helloXY"), diffOps("helloXY", "helloX")];
  const merged = seq.reduce((acc, ops) => composeOps(acc, ops), []);
  assert.equal(applyOps("hello", merged), applyOps(applyOps(applyOps("hello", seq[0]), seq[1]), seq[2]));
});

test("sanitizeOps rejects malformed input", () => {
  assert.equal(sanitizeOps([{ t: "ins", p: 0, s: "a" }], 10).length, 1);
  assert.equal(sanitizeOps([], 10), null);
  assert.equal(sanitizeOps([{ t: "ins", p: -1, s: "a" }], 10), null);
  assert.equal(sanitizeOps([{ t: "del", p: 0, l: 0 }], 10), null);
  assert.equal(sanitizeOps([{ t: "wat", p: 0 }], 10), null);
  assert.equal(sanitizeOps("nope", 10), null);
});
