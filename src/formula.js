// Tiny spreadsheet formula engine for the online sheet: "=expr" with
// + - * / % and parentheses, cell refs (A1), ranges (A1:B5) and the
// SUM / AVERAGE / MIN / MAX / COUNT functions. Zero dependencies; shared
// by the sheet client (src/static.js) and the unit tests.

export function colName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

// "A1" -> { row: 0, col: 0 }; returns null for invalid refs.
export function parseCellRef(ref) {
  const m = /^([A-Za-z]{1,3})([0-9]{1,7})$/.exec(String(ref));
  if (!m) return null;
  let col = 0;
  for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { row: parseInt(m[2], 10) - 1, col: col - 1 };
}

export class FormulaError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function sum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}

const FUNCTIONS = {
  SUM: (nums) => sum(nums),
  AVERAGE: (nums) => {
    if (!nums.length) throw new FormulaError("#DIV/0!");
    return sum(nums) / nums.length;
  },
  MIN: (nums) => (nums.length ? Math.min(...nums) : 0),
  MAX: (nums) => (nums.length ? Math.max(...nums) : 0),
  COUNT: (nums) => nums.length
};
FUNCTIONS.AVG = FUNCTIONS.AVERAGE;

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    if ("+-*/%(),:".includes(ch)) {
      tokens.push({ t: ch });
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const m = /^[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?/.exec(src.slice(i));
      if (!m) throw new FormulaError("#ERROR");
      tokens.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      const m = /^[A-Za-z]+[0-9]*/.exec(src.slice(i));
      const word = m[0];
      if (src[i + word.length] === "(") {
        tokens.push({ t: "name", v: word.toUpperCase() });
      } else if (parseCellRef(word)) {
        tokens.push({ t: "ref", v: word.toUpperCase() });
      } else {
        throw new FormulaError("#NAME?");
      }
      i += word.length;
      continue;
    }
    throw new FormulaError("#ERROR");
  }
  return tokens;
}

class Parser {
  constructor(tokens, ctx) {
    this.tokens = tokens;
    this.i = 0;
    this.ctx = ctx;
  }

  peek() {
    return this.tokens[this.i];
  }

  next() {
    return this.tokens[this.i++];
  }

  expect(type) {
    const tok = this.next();
    if (!tok || tok.t !== type) throw new FormulaError("#ERROR");
  }

  parseExpr() {
    let value = this.parseTerm();
    while (this.peek() && (this.peek().t === "+" || this.peek().t === "-")) {
      const op = this.next().t;
      const rhs = this.parseTerm();
      value = op === "+" ? this.add(value, rhs) : this.add(value, -rhs);
    }
    return value;
  }

  add(a, b) {
    return this.scalar(a) + this.scalar(b);
  }

  scalar(v) {
    if (typeof v !== "number") throw new FormulaError("#VALUE!");
    return v;
  }

  parseTerm() {
    let value = this.parseFactor();
    while (this.peek() && (this.peek().t === "*" || this.peek().t === "/" || this.peek().t === "%")) {
      const op = this.next().t;
      const rhs = this.scalar(this.parseFactor());
      const lhs = this.scalar(value);
      if ((op === "/" || op === "%") && rhs === 0) throw new FormulaError("#DIV/0!");
      value = op === "*" ? lhs * rhs : op === "/" ? lhs / rhs : lhs % rhs;
    }
    return value;
  }

  parseFactor() {
    const tok = this.peek();
    if (!tok) throw new FormulaError("#ERROR");
    if (tok.t === "-") {
      this.next();
      return -this.scalar(this.parseFactor());
    }
    if (tok.t === "+") {
      this.next();
      return this.scalar(this.parseFactor());
    }
    if (tok.t === "num") {
      this.next();
      return tok.v;
    }
    if (tok.t === "(") {
      this.next();
      const value = this.parseExpr();
      this.expect(")");
      return value;
    }
    if (tok.t === "ref") {
      this.next();
      if (this.peek() && this.peek().t === ":") {
        this.next();
        const end = this.next();
        if (!end || end.t !== "ref") throw new FormulaError("#ERROR");
        return this.ctx.range(tok.v, end.v); // array, only valid as a function arg
      }
      return this.ctx.get(tok.v);
    }
    if (tok.t === "name") {
      this.next();
      const fn = FUNCTIONS[tok.v];
      if (!fn) throw new FormulaError("#NAME?");
      this.expect("(");
      const nums = [];
      if (this.peek() && this.peek().t !== ")") {
        for (;;) {
          const arg = this.parseExpr();
          if (Array.isArray(arg)) nums.push(...arg);
          else nums.push(this.scalar(arg));
          if (this.peek() && this.peek().t === ",") {
            this.next();
            continue;
          }
          break;
        }
      }
      this.expect(")");
      const value = fn(nums);
      if (typeof value !== "number" || Number.isNaN(value)) throw new FormulaError("#VALUE!");
      return value;
    }
    throw new FormulaError("#ERROR");
  }
}

// Evaluate "=..." formula text. ctx = { get(ref) -> number,
// range(fromRef, toRef) -> number[] }. Either callback may throw an object
// with a `code` (e.g. "#CYCLE!" for circular refs in the client).
// Returns { value } or { error: "#CODE" }. Non-formula input passes through.
export function evaluateFormula(src, ctx) {
  if (typeof src !== "string" || !src.startsWith("=")) return { value: src };
  try {
    const parser = new Parser(tokenize(src.slice(1)), ctx);
    const value = parser.parseExpr();
    if (parser.i !== parser.tokens.length) throw new FormulaError("#ERROR");
    if (Array.isArray(value)) throw new FormulaError("#VALUE!");
    if (typeof value === "number" && !Number.isFinite(value)) throw new FormulaError("#DIV/0!");
    return { value };
  } catch (err) {
    return { error: (err && err.code) || "#ERROR" };
  }
}
