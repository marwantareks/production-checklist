// Generates the Claude Code prompts and skill files outside the browser, using the same code the page uses.
import "../../src/lib/prompt.js";
import { loadContent, toLegacy, promptContext, pad } from "./model.mjs";

export function generatePrompts(content = loadContent()) {
  const legacy = toLegacy(content);
  const kit = globalThis.PromptKit.create(promptContext(legacy));
  const files = {};

  const checkable = (id) => legacy.DEEP[id].chk !== "people";
  const allIds = [];
  legacy.C.forEach((c) => c[3].forEach((it) => allIds.push(it[0])));

  // Ground rules are the part of every prompt before the concern list.
  const sample = kit.buildPrompt([allIds[0]]);
  files["ground-rules.md"] = sample.slice(0, sample.indexOf("Concerns to review (")).trimEnd() + "\n";

  content.categories.forEach((cat, i) => {
    const ids = legacy.C[i][3].map((it) => it[0]).filter(checkable);
    if (ids.length) files[`${String(i + 1).padStart(2, "0")}-${cat.id}.txt`] = kit.buildPrompt(ids) + "\n";
  });
  files["all-checkable-concerns.txt"] = kit.buildPrompt(allIds.filter(checkable)) + "\n";
  files["all-concerns-including-people.txt"] = kit.buildPrompt(allIds) + "\n";
  files["SKILL.md"] = kit.buildSkill(allIds.filter(checkable));

  const lines = ["# Evidence to request from people", "", "These concerns cannot be settled from a repository, or only in part. Ask the team for the items listed.", ""];
  legacy.C.forEach((c) => c[3].forEach((it) => {
    const d = legacy.DEEP[it[0]];
    if (!d.ask) return;
    lines.push(`## ${it[0]}. ${it[1]}`, "", `Review question: ${legacy.X[it[0]][0]}`, "");
    d.ask.forEach((a) => lines.push(`- ${a}`));
    lines.push("");
  }));
  files["people-evidence.md"] = lines.join("\n");
  return files;
}
