// Writes the generated prompts to dist/prompts/.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/model.mjs";
import { generatePrompts } from "./lib/prompts.mjs";

const out = path.join(ROOT, "dist/prompts");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const files = generatePrompts();
for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(out, name), text);
console.log(`Wrote ${Object.keys(files).length} files to ${path.relative(ROOT, out)}/`);
