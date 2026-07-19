// Simple operational transformation for plain-text documents.
// Op shapes: { t: "ins", p: number, s: string } | { t: "del", p: number, l: number }
// An "op list" applies its ops sequentially.

export function applyOps(text, ops) {
  for (const op of ops) {
    if (op.t === "ins") {
      text = text.slice(0, op.p) + op.s + text.slice(op.p);
    } else {
      text = text.slice(0, op.p) + text.slice(op.p + op.l);
    }
  }
  return text;
}

// Transform op x over the already-applied op y.
// yPriority decides insert/insert ties at the same position.
// Returns null when x becomes a no-op.
export function transformOp(x, y, yPriority) {
  if (y.t === "ins") {
    if (x.t === "ins") {
      if (y.p < x.p || (y.p === x.p && yPriority)) {
        return { t: "ins", p: x.p + y.s.length, s: x.s };
      }
      return x;
    }
    // x is delete
    if (y.p <= x.p) {
      return { t: "del", p: x.p + y.s.length, l: x.l };
    }
    if (y.p < x.p + x.l) {
      return { t: "del", p: x.p, l: x.l + y.s.length };
    }
    return x;
  }
  // y is delete
  const yEnd = y.p + y.l;
  if (x.t === "ins") {
    if (x.p > y.p) {
      return { t: "ins", p: x.p - Math.min(y.l, x.p - y.p), s: x.s };
    }
    return x;
  }
  // x is delete too
  const xEnd = x.p + x.l;
  if (yEnd <= x.p) return { t: "del", p: x.p - y.l, l: x.l };
  if (xEnd <= y.p) return x;
  const before = Math.max(0, Math.min(xEnd, y.p) - x.p);
  const after = Math.max(0, xEnd - Math.max(yEnd, x.p));
  const len = before + after;
  if (len === 0) return null;
  return { t: "del", p: Math.min(x.p, y.p), l: len };
}

// Transform op list `ops` over the already-applied op list `history`.
// historyPriority decides which side wins insert/insert ties at the same
// position; it must stay consistent across every replica. Server history has
// priority, so use the default when transforming local ops over server ops and
// `false` when transforming incoming server ops over local pending ops.
export function transformOps(ops, history, historyPriority = true) {
  let out = ops;
  for (const h of history) {
    const next = [];
    let against = h;
    for (const op of out) {
      const moved = transformOp(op, against, historyPriority);
      against = transformOp(against, op, !historyPriority) || against;
      if (moved) next.push(moved);
    }
    out = next;
  }
  return out;
}

// Map a caret/selection position through applied ops.
export function mapPosition(pos, ops) {
  for (const op of ops) {
    if (op.t === "ins") {
      if (op.p <= pos) pos += op.s.length;
    } else {
      if (op.p + op.l <= pos) pos -= op.l;
      else if (op.p < pos) pos = op.p;
    }
  }
  return pos;
}

// Diff two strings into a minimal [delete?, insert?] op list.
export function diffOps(oldText, newText) {
  if (oldText === newText) return [];
  const minLen = Math.min(oldText.length, newText.length);
  let p = 0;
  while (p < minLen && oldText[p] === newText[p]) p++;
  let s = 0;
  while (
    s < minLen - p &&
    oldText[oldText.length - 1 - s] === newText[newText.length - 1 - s]
  ) {
    s++;
  }
  const ops = [];
  const delLen = oldText.length - p - s;
  if (delLen > 0) ops.push({ t: "del", p, l: delLen });
  const ins = newText.slice(p, newText.length - s);
  if (ins.length > 0) ops.push({ t: "ins", p, s: ins });
  return ops;
}

// Merge sequentially-applied ops where possible so buffers stay small.
export function composeOps(a, b) {
  const out = [...a];
  for (const op of b) {
    const last = out[out.length - 1];
    if (last && last.t === "ins" && op.t === "ins" && op.p === last.p + last.s.length) {
      out[out.length - 1] = { t: "ins", p: last.p, s: last.s + op.s };
    } else if (last && last.t === "del" && op.t === "del" && (op.p === last.p || op.p + op.l === last.p)) {
      out[out.length - 1] = { t: "del", p: Math.min(last.p, op.p), l: last.l + op.l };
    } else {
      out.push(op);
    }
  }
  return out;
}

// Validate and normalize ops coming from a client. Ops in the list apply
// sequentially, so positions are checked against the evolving text length.
// Returns null when invalid.
export function sanitizeOps(ops, textLen) {
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > 512) return null;
  let cur = textLen;
  let inserted = 0;
  const out = [];
  for (const op of ops) {
    if (op.t === "ins") {
      if (typeof op.s !== "string" || op.s.length === 0) return null;
      if (!Number.isInteger(op.p) || op.p < 0 || op.p > cur) return null;
      inserted += op.s.length;
      if (inserted > 100000) return null;
      cur += op.s.length;
      out.push({ t: "ins", p: op.p, s: op.s });
    } else if (op.t === "del") {
      if (!Number.isInteger(op.p) || op.p < 0) return null;
      if (!Number.isInteger(op.l) || op.l <= 0 || op.p + op.l > cur) return null;
      cur -= op.l;
      out.push({ t: "del", p: op.p, l: op.l });
    } else {
      return null;
    }
  }
  return out;
}
