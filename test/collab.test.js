import test from "node:test";
import assert from "node:assert/strict";
import { colName, parseCellRef, evaluateFormula } from "../src/formula.js";
import { sanitizeCell, SHEET_ROWS, SHEET_COLS } from "../src/sheet-core.js";
import { oneTimeUploadCents, MIN_UPLOAD_CENTS } from "../src/billing.js";

test("colName and parseCellRef round-trip", () => {
  assert.equal(colName(0), "A");
  assert.equal(colName(25), "Z");
  assert.equal(colName(26), "AA");
  assert.deepEqual(parseCellRef("A1"), { row: 0, col: 0 });
  assert.deepEqual(parseCellRef("b2"), { row: 1, col: 1 });
  assert.deepEqual(parseCellRef("AA10"), { row: 9, col: 26 });
  assert.equal(parseCellRef("1A"), null);
  assert.equal(parseCellRef(""), null);
});

test("arithmetic with precedence, parens and unary minus", () => {
  const ctx = { get: () => 0, range: () => [] };
  assert.deepEqual(evaluateFormula("=1+2*3", ctx), { value: 7 });
  assert.deepEqual(evaluateFormula("=(1+2)*3", ctx), { value: 9 });
  assert.deepEqual(evaluateFormula("=10/4", ctx), { value: 2.5 });
  assert.deepEqual(evaluateFormula("=-3+5", ctx), { value: 2 });
  assert.deepEqual(evaluateFormula("=10%3", ctx), { value: 1 });
  assert.deepEqual(evaluateFormula("=2*(3+(4-1))", ctx), { value: 12 });
});

test("cell refs and ranges resolve through ctx", () => {
  const values = { A1: 10, A2: 20, B1: 5, B2: 7 };
  const ctx = {
    get: (ref) => values[ref] ?? 0,
    range: (a, b) => {
      const from = parseCellRef(a);
      const to = parseCellRef(b);
      const out = [];
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r++) {
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c++) {
          out.push(values[`${colName(c)}${r + 1}`] ?? 0);
        }
      }
      return out;
    }
  };
  assert.deepEqual(evaluateFormula("=A1+B2*2", ctx), { value: 24 });
  assert.deepEqual(evaluateFormula("=SUM(A1:B2)", ctx), { value: 42 });
  assert.deepEqual(evaluateFormula("=AVERAGE(A1:A2)", ctx), { value: 15 });
  assert.deepEqual(evaluateFormula("=MIN(A1:B2)", ctx), { value: 5 });
  assert.deepEqual(evaluateFormula("=MAX(A1:B2)", ctx), { value: 20 });
  assert.deepEqual(evaluateFormula("=COUNT(A1:B2)", ctx), { value: 4 });
  assert.deepEqual(evaluateFormula("=SUM(A1:B2)/COUNT(A1:B2)", ctx), { value: 10.5 });
  assert.deepEqual(evaluateFormula("=avg(a1,a2)", ctx), { value: 15 }); // case-insensitive, multi-arg
});

test("errors: div0, bad ref, unknown name, syntax, circular", () => {
  const ctx = { get: () => 0, range: () => [] };
  assert.deepEqual(evaluateFormula("=1/0", ctx), { error: "#DIV/0!" });
  assert.deepEqual(evaluateFormula("=1%0", ctx), { error: "#DIV/0!" });
  assert.deepEqual(evaluateFormula("=AVERAGE()", ctx), { error: "#DIV/0!" });
  assert.deepEqual(evaluateFormula("=NOPE(1)", ctx), { error: "#NAME?" });
  assert.deepEqual(evaluateFormula("=1+", ctx), { error: "#ERROR" });
  assert.deepEqual(evaluateFormula("=(1+2", ctx), { error: "#ERROR" });
  assert.deepEqual(evaluateFormula("=", ctx), { error: "#ERROR" });
  // circular ref surfaces from ctx.get
  const cycling = { get: () => { throw { code: "#CYCLE!" }; }, range: () => [] };
  assert.deepEqual(evaluateFormula("=A1+1", cycling), { error: "#CYCLE!" });
  // non-formula input passes through untouched
  assert.deepEqual(evaluateFormula("hello", ctx), { value: "hello" });
  assert.deepEqual(evaluateFormula(42, ctx), { value: 42 });
});

test("sanitizeCell validates coordinates and trims values", () => {
  assert.deepEqual(sanitizeCell(0, 0, "hi"), { r: 0, c: 0, value: "hi" });
  assert.deepEqual(sanitizeCell(SHEET_ROWS - 1, SHEET_COLS - 1, 42), { r: SHEET_ROWS - 1, c: SHEET_COLS - 1, value: "42" });
  assert.equal(sanitizeCell(-1, 0, "x"), null);
  assert.equal(sanitizeCell(0, SHEET_COLS, "x"), null);
  assert.equal(sanitizeCell(SHEET_ROWS, 0, "x"), null);
  assert.equal(sanitizeCell(1.5, 0, "x"), null);
  assert.equal(sanitizeCell(0, 0, "x".repeat(1000)).value.length, 500);
  assert.deepEqual(sanitizeCell(0, 0, null), { r: 0, c: 0, value: "" });
});

test("oneTimeUploadCents: $0.15/GB one-time with a minimum charge", () => {
  assert.equal(oneTimeUploadCents(1e9), 15); // 1 GB -> $0.15
  assert.equal(oneTimeUploadCents(10 * 1e9), 150); // 10 GB -> $1.50
  assert.equal(oneTimeUploadCents(100 * 1e6), 1.5); // 100 MB -> 1.5 cents
  assert.equal(oneTimeUploadCents(1024), MIN_UPLOAD_CENTS); // tiny file -> min charge
  assert.equal(oneTimeUploadCents(0), MIN_UPLOAD_CENTS);
});
