// Convert Quill delta ops to plain text and Markdown.

function escapeLinkUrl(url) {
  return String(url).replace(/[()\\]/g, (c) => `\\${c}`);
}

function renderInline(text, attrs = {}) {
  if (!text) return "";
  let out = text;
  if (attrs.code) out = `\`${out}\``;
  if (attrs.bold) out = `**${out}**`;
  if (attrs.italic) out = `*${out}*`;
  if (attrs.strike) out = `~~${out}~~`;
  if (attrs.underline) out = `<u>${out}</u>`;
  if (attrs.color || attrs.background) {
    const style = [
      attrs.color ? `color:${attrs.color}` : "",
      attrs.background ? `background-color:${attrs.background}` : ""
    ].filter(Boolean).join(";");
    out = `<span style="${style}">${out}</span>`;
  }
  if (attrs.link) out = `[${out}](${escapeLinkUrl(attrs.link)})`;
  return out;
}

function renderEmbed(embed, attrs = {}) {
  if (embed.image) return `![图片](${escapeLinkUrl(embed.image)})`;
  if (embed.video) return `[视频](${escapeLinkUrl(embed.video)})`;
  if (embed.formula) return `$${embed.formula}$`;
  return "[嵌入内容]";
}

// Split delta ops into lines: { segments: [...], block: attributes|null }
function splitLines(ops) {
  const lines = [];
  let current = { segments: [], block: null };
  for (const op of ops) {
    if (typeof op.insert === "string") {
      const parts = op.insert.split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) current.segments.push({ text: parts[i], attrs: op.attributes || {} });
        if (i < parts.length - 1) {
          current.block = op.attributes || null;
          lines.push(current);
          current = { segments: [], block: null };
        }
      }
    } else if (op.insert && typeof op.insert === "object") {
      current.segments.push({ embed: op.insert, attrs: op.attributes || {} });
    }
  }
  if (current.segments.length) lines.push(current);
  return lines;
}

function lineText(line) {
  return line.segments
    .map((seg) => (seg.embed ? renderEmbed(seg.embed, seg.attrs) : renderInline(seg.text, seg.attrs)))
    .join("");
}

export function deltaToText(ops) {
  let out = "";
  for (const op of ops || []) {
    if (typeof op.insert === "string") out += op.insert;
    else if (op.insert?.image) out += "[图片]";
    else if (op.insert?.video) out += "[视频]";
  }
  return out.replace(/\n$/, "");
}

export function deltaToMarkdown(ops) {
  const lines = splitLines(ops);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const block = line.block || {};

    if (block["code-block"]) {
      const codeLines = [];
      while (i < lines.length && lines[i].block?.["code-block"]) {
        codeLines.push(lines[i].segments.map((s) => s.text || "").join(""));
        i++;
      }
      out.push("```", ...codeLines, "```", "");
      continue;
    }

    if (block.table) {
      const rows = [];
      let currentRow = [];
      let lastRowId = null;
      while (i < lines.length && lines[i].block?.table) {
        const rowId = String(lines[i].block.table);
        if (lastRowId !== null && rowId !== lastRowId) {
          rows.push(currentRow);
          currentRow = [];
        }
        lastRowId = rowId;
        currentRow.push(lineText(lines[i]).replace(/\|/g, "\\|"));
        i++;
      }
      rows.push(currentRow);
      for (let r = 0; r < rows.length; r++) {
        out.push(`| ${rows[r].join(" | ")} |`);
        if (r === 0) out.push(`| ${rows[r].map(() => "---").join(" | ")} |`);
      }
      out.push("");
      continue;
    }

    let prefix = "";
    if (block.header) prefix = `${"#".repeat(Math.min(Number(block.header) || 1, 6))} `;
    else if (block.blockquote) prefix = "> ";
    else if (block.list === "ordered") prefix = "1. ";
    else if (block.list === "bullet" || block.list === "checked" || block.list === "unchecked") prefix = "- ";
    const indent = "  ".repeat(Number(block.indent) || 0);
    out.push(indent + prefix + lineText(line));
    i++;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
