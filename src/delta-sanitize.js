import Delta from "quill-delta";

const ALLOWED_ATTRIBUTES = new Set([
  "bold", "italic", "underline", "strike", "code",
  "link", "color", "background",
  "header", "list", "blockquote", "code-block",
  "table", "script", "align", "indent"
]);
const SAFE_CSS_VALUE = /^[#a-zA-Z0-9(),.%\s-]{1,32}$/;

function sanitizeAttributes(attrs) {
  if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return undefined;
  const out = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (!ALLOWED_ATTRIBUTES.has(key)) continue;
    const type = typeof value;
    if (type !== "string" && type !== "number" && type !== "boolean") continue;
    if (key === "link" && (type !== "string" || !/^https?:\/\//i.test(value))) continue;
    if ((key === "color" || key === "background") && (type !== "string" || !SAFE_CSS_VALUE.test(value))) continue;
    if (type === "string" && value.length > 500) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

// Validate and normalize a client delta. Returns a Delta or null.
export function sanitizeDelta(raw) {
  if (!raw || !Array.isArray(raw.ops) || raw.ops.length === 0 || raw.ops.length > 2000) return null;
  const ops = [];
  for (const op of raw.ops) {
    if (!op || typeof op !== "object") return null;
    const keys = ["insert", "retain", "delete"].filter((k) => op[k] !== undefined);
    if (keys.length !== 1) return null;
    const attributes = sanitizeAttributes(op.attributes);
    if (op.retain !== undefined) {
      if (!Number.isInteger(op.retain) || op.retain <= 0) return null;
      ops.push(attributes ? { retain: op.retain, attributes } : { retain: op.retain });
    } else if (op.delete !== undefined) {
      if (!Number.isInteger(op.delete) || op.delete <= 0 || attributes) return null;
      ops.push({ delete: op.delete });
    } else {
      if (typeof op.insert === "string") {
        if (op.insert.length === 0) return null;
        ops.push(attributes ? { insert: op.insert, attributes } : { insert: op.insert });
      } else if (op.insert && typeof op.insert === "object") {
        const embedKeys = Object.keys(op.insert);
        if (embedKeys.length !== 1 || embedKeys[0] !== "image") return null;
        const url = op.insert.image;
        if (typeof url !== "string" || !/^https?:\/\//i.test(url) || url.length > 2000) return null;
        ops.push(attributes ? { insert: { image: url }, attributes } : { insert: { image: url } });
      } else {
        return null;
      }
    }
  }
  try {
    return new Delta(ops);
  } catch {
    return null;
  }
}

export function summarizeDelta(delta) {
  let ins = 0;
  let del = 0;
  let embeds = 0;
  for (const op of delta.ops) {
    if (typeof op.insert === "string") ins += op.insert.length;
    else if (op.insert) embeds += 1;
    else if (op.delete) del += op.delete;
  }
  const parts = [`+${ins}`, `-${del}`];
  if (embeds) parts.push(`${embeds} 个嵌入`);
  return parts.join(" ");
}
