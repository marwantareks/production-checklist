// Builds dist/index.html: one self-contained file with the CSS, content, prompt kit and page script inlined.
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadContent, toLegacy } from "./lib/model.mjs";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// JSON that is safe inside an inline <script> element.
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export function buildHtml(root = ROOT) {
  const content = loadContent(root);
  const legacy = toLegacy(content);
  const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
  const concernCount = content.concerns.length;
  const categoryCount = content.categories.length;
  const catWord = WORDS[categoryCount] || String(categoryCount);

  const data = [
    `var C=${json(legacy.C)};`,
    `var G=${json(legacy.G)};`,
    `var D=${json(legacy.D)};`,
    `var X=${json(legacy.X)};`,
    `var DEEP=${json(legacy.DEEP)};`,
    `var CI=${json(legacy.CI)};`,
  ].join("\n");

  const values = {
    STYLES: read("src/styles.css"),
    DATA: data,
    PROMPT_KIT: read("src/lib/prompt.js"),
    APP: read("src/app.js"),
    CONCERN_COUNT: String(concernCount),
    CATEGORY_COUNT: String(categoryCount),
    CATEGORY_COUNT_WORD: catWord,
    CATEGORY_COUNT_WORD_CAP: cap(catWord),
    AUTHOR: content.meta.author,
    YEAR: String(content.meta.year),
    UPDATED: content.meta.updated,
  };

  let html = read("src/template.html");
  // Replace long blocks first so counts inside them are never rewritten.
  for (const key of ["STYLES", "DATA", "PROMPT_KIT", "APP"]) html = html.split(`{{${key}}}`).join("\u0000" + key + "\u0000");
  for (const [key, val] of Object.entries(values)) {
    if (["STYLES", "DATA", "PROMPT_KIT", "APP"].includes(key)) continue;
    html = html.split(`{{${key}}}`).join(val);
  }
  for (const key of ["STYLES", "DATA", "PROMPT_KIT", "APP"]) html = html.split("\u0000" + key + "\u0000").join(values[key]);

  const left = html.match(/\{\{[A-Z_]+\}\}/g);
  if (left) throw new Error("Unreplaced placeholders: " + [...new Set(left)].join(", "));
  return html;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = buildHtml();
  fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
  const out = path.join(ROOT, "dist/index.html");
  fs.writeFileSync(out, html);
  console.log(`Built ${path.relative(ROOT, out)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
}
