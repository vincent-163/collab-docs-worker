// Pure sheet-model helpers shared by SheetRoom (src/sheet-room.js) and the
// unit tests — kept free of cloudflare:workers imports.

export const SHEET_ROWS = 200;
export const SHEET_COLS = 26;
export const MAX_CELLS = 5000;
export const MAX_CELL_CHARS = 500;

// Validate a cell coordinate/value write. Returns null or { r, c, value }.
export function sanitizeCell(r, c, value) {
  if (!Number.isInteger(r) || !Number.isInteger(c)) return null;
  if (r < 0 || r >= SHEET_ROWS || c < 0 || c >= SHEET_COLS) return null;
  const text = String(value ?? "").slice(0, MAX_CELL_CHARS);
  return { r, c, value: text };
}
