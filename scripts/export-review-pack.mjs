// Builds review/pack/: everything a third-party reviewer needs, readable by people and by agents.
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadContent, toLegacy, pad } from "./lib/model.mjs";
import { generatePrompts } from "./lib/prompts.mjs";
import { concernMarkdown } from "./lib/pack.mjs";

const content = loadContent();
const legacy = toLegacy(content);
const out = path.join(ROOT, "review/pack");
fs.rmSync(out, { recursive: true, force: true });
for (const d of ["content", "prompts", "schema"]) fs.mkdirSync(path.join(out, d), { recursive: true });
const write = (rel, text) => fs.writeFileSync(path.join(out, rel), text);

const index = ["# Content index", "", `Concerns: ${content.concerns.length}. Categories: ${content.categories.length}.`, ""];
content.categories.forEach((cat, i) => {
  const items = content.concerns.filter((c) => c.category === cat.id).sort((a, b) => a.order - b.order);
  const file = `${String(i + 1).padStart(2, "0")}-${cat.id}.md`;
  const md = [`# ${cat.name}`, "", cat.summary, "", `Concerns in this file: ${items.length}.`, "", ...items.map(concernMarkdown)].join("\n");
  write(`content/${file}`, md);
  index.push(`## ${cat.name}`, "", `File: content/${file}`, "", ...items.map((c) => `- ${c.id}. ${c.name}`), "");
});
write("content/INDEX.md", index.join("\n"));
write("concerns.json", JSON.stringify({ categories: content.categories, concerns: content.concerns.map(({ _file, ...c }) => c) }, null, 2) + "\n");

for (const [name, text] of Object.entries(generatePrompts(content))) write(`prompts/${name}`, text);

for (const f of ["review-findings.schema.json", "agent-findings.schema.json", "concern.schema.json"]) {
  fs.copyFileSync(path.join(ROOT, "schema", f), path.join(out, "schema", f));
}
fs.copyFileSync(path.join(ROOT, "review/REVIEWER_PROMPT.md"), path.join(out, "REVIEWER_PROMPT.md"));
fs.copyFileSync(path.join(ROOT, "review/example-findings.json"), path.join(out, "example-findings.json"));

write("README.md", `# Review pack

Generated ${new Date().toISOString().slice(0, 10)} from ${content.concerns.length} concerns in ${content.categories.length} categories.

## What is in this pack

- \`REVIEWER_PROMPT.md\`: the instructions to give the reviewing agent or person.
- \`content/\`: the reviewable text, one file per category, plus \`INDEX.md\`.
- \`concerns.json\`: the same content as structured data.
- \`prompts/\`: the Claude Code prompts the page generates, one per category, plus the shared ground rules.
- \`schema/review-findings.schema.json\`: the shape the reviewer must return.
- \`example-findings.json\`: a valid example.

## How to use it

1. Give the reviewer the whole pack and the text of \`REVIEWER_PROMPT.md\`.
2. Ask for one category at a time for the best depth, for example \`content/03-resilience.md\` with \`prompts/03-resilience.txt\`.
3. Save each reply as JSON under \`review/out/\` in the repository.
4. Run \`npm run review:apply -- review/out/<file>.json\` to produce a report of suggested edits.

Use a reviewer from a different model family than the one that drafted the content.
`);
console.log(`Wrote review pack to ${path.relative(ROOT, out)}/ (${fs.readdirSync(path.join(out, "content")).length} content files, ${fs.readdirSync(path.join(out, "prompts")).length} prompt files)`);
