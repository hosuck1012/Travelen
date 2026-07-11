const fs = require("fs");
const zlib = require("zlib");

const pdfPath = process.argv[2] || "specification.pdf";
const data = fs.readFileSync(pdfPath);
const latin = data.toString("latin1");

function decodePdfString(raw) {
  let out = "";
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = raw[++i];
    if (next === "n") out += "\n";
    else if (next === "r") out += "\r";
    else if (next === "t") out += "\t";
    else if (next === "b") out += "\b";
    else if (next === "f") out += "\f";
    else if (next === "(" || next === ")" || next === "\\") out += next;
    else if (/[0-7]/.test(next || "")) {
      let oct = next;
      for (let j = 0; j < 2 && /[0-7]/.test(raw[i + 1] || ""); j += 1) {
        oct += raw[++i];
      }
      out += String.fromCharCode(parseInt(oct, 8));
    } else if (next !== "\r" && next !== "\n") {
      out += next || "";
    }
  }
  return out;
}

function hexToText(hex) {
  const clean = hex.replace(/\s+/g, "");
  const bytes = [];
  for (let i = 0; i + 1 < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  const buffer = Buffer.from(bytes);
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    let out = "";
    for (let i = 2; i + 1 < buffer.length; i += 2) {
      out += String.fromCharCode(buffer.readUInt16BE(i));
    }
    return out;
  }
  return buffer.toString("utf8").replace(/\u0000/g, "");
}

function extractStrings(text) {
  const found = [];
  let match;
  const paren = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  while ((match = paren.exec(text))) {
    found.push(decodePdfString(match[0].slice(1, match[0].lastIndexOf(")"))));
  }
  const hex = /<([0-9a-fA-F\s]+)>\s*Tj/g;
  while ((match = hex.exec(text))) {
    found.push(hexToText(match[1]));
  }
  const arrays = /\[((?:.|\n|\r)*?)\]\s*TJ/g;
  while ((match = arrays.exec(text))) {
    const body = match[1];
    const parts = [];
    let p;
    const token = /\((?:\\.|[^\\)])*\)|<([0-9a-fA-F\s]+)>/g;
    while ((p = token.exec(body))) {
      if (p[0][0] === "(") parts.push(decodePdfString(p[0].slice(1, -1)));
      else parts.push(hexToText(p[1]));
    }
    if (parts.length) found.push(parts.join(""));
  }
  return found;
}

let streamCount = 0;
let decodedCount = 0;
const chunks = [];
const streamRegex = /<<(?:.|\n|\r)*?>>\s*stream\r?\n/g;
let headerMatch;
while ((headerMatch = streamRegex.exec(latin))) {
  const header = headerMatch[0];
  const start = headerMatch.index + header.length;
  const endMarker = latin.indexOf("endstream", start);
  if (endMarker < 0) break;
  streamCount += 1;
  let stream = data.subarray(start, endMarker);
  if (stream.length && stream[stream.length - 1] === 10) stream = stream.subarray(0, -1);
  if (stream.length && stream[stream.length - 1] === 13) stream = stream.subarray(0, -1);
  if (/\/FlateDecode/.test(header)) {
    try {
      const inflated = zlib.inflateSync(stream).toString("latin1");
      decodedCount += 1;
      chunks.push(...extractStrings(inflated));
    } catch (err) {
      // Ignore streams that are not plain zlib despite the advertised filter.
    }
  } else {
    chunks.push(...extractStrings(stream.toString("latin1")));
  }
  streamRegex.lastIndex = endMarker + "endstream".length;
}

const text = chunks
  .map((line) => line.replace(/\s+/g, " ").trim())
  .filter(Boolean)
  .join("\n")
  .replace(/\n{3,}/g, "\n\n");

console.log(`streams=${streamCount} decoded=${decodedCount} text_lines=${text ? text.split("\n").length : 0}`);
console.log("---TEXT---");
console.log(text.slice(0, 12000));
