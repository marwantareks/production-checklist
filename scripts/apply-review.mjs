// Turns a reviewer's findings (JSON) into a Markdown report of suggested edits.
// It never changes content. A person, or Claude Code with the review-content skill, decides what to apply.
//
// Usage: node scripts/apply-review.mjs <findings.json> [--min-severity critical|major|minor|nit]
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { ROOT, loadContent } from "./lib/model.mjs";

const SEV = ["critical", "major", "minor", "nit"];

function readJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  try { return JSON.parse(raw); } catch { /* fall through to extraction */ }
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1] : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(text);
}

export function buildReport(findings, content, minSeverity = "nit") {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  const validate = ajv.compile(JSON.parse(fs.readFileSync(path.join(ROOT, "schema/review-findings.schema.json"), "utf8")));
  if (!validate(findings)) {
    const msgs = validate.errors.map((e) => `${e.instancePath || "(root)"} ${e.message}`);
    throw new Error("The findings do not match the schema:\n  " + msgs.join("\n  "));
  }
  const byId = new Map(content.concerns.map((c) => [c.id, c]));
  const problems = [];
  const keep = findings.findings.filter((f) => SEV.indexOf(f.severity) <= SEV.indexOf(minSeverity));
  for (const f of keep) {
    const c = byId.get(f.concern_id);
    if (!c) { problems.push(`Finding refers to unknown concern id ${f.concern_id}`); continue; }
    if (f.field === "search_hints" && c.agent_check.level === "people") problems.push(`Concern ${c.id} has no search_hints (level people)`);
    if (f.field === "evidence_to_request" && !c.agent_check.evidence_to_request) problems.push(`Concern ${c.id} has no evidence_to_request yet`);
    if (f.field === "look_for" && c.agent_check.level === "people") problems.push(`Concern ${c.id} has no look_for (level people)`);
  }

  const current = (c, field) => {
    if (field === "search_hints" || field === "evidence_to_request" || field === "look_for") return (c.agent_check[field] || []).join("; ");
    if (field === "name") return c.name;
    if (field === "agent_check_level") return c.agent_check.level;
    if (field === "agent_prompt") return "(generated prompt, see src/lib/prompt.js)";
    const v = c[field];
    return Array.isArray(v) ? v.map((x) => `- ${x}`).join("\n") : String(v ?? "");
  };

  const counts = Object.fromEntries(SEV.map((s) => [s, 0]));
  keep.forEach((f) => counts[f.severity]++);
  const L = [];
  L.push(`# Review report`, "", `Reviewer: ${findings.reviewer}`, `Date: ${findings.date}`);
  if (findings.scope) L.push(`Scope: ${findings.scope}`);
  L.push("", `Findings shown: ${keep.length} of ${findings.findings.length} (minimum severity: ${minSeverity})`);
  L.push(`By severity: ${SEV.map((s) => `${s} ${counts[s]}`).join(", ")}`, "");
  if (problems.length) L.push("## Problems with the findings file", "", ...problems.map((p) => `- ${p}`), "");
  if (findings.no_issues_found && findings.no_issues_found.length) L.push(`Concerns the reviewer listed as clean: ${findings.no_issues_found.join(", ")}. Treat a clean list from one reviewer as weak evidence, because another reviewer often finds problems in the same concerns.`, "");

  const groups = new Map();
  for (const f of keep) { if (!groups.has(f.concern_id)) groups.set(f.concern_id, []); groups.get(f.concern_id).push(f); }
  const ordered = [...groups.entries()].sort((a, b) => {
    const worst = (arr) => Math.min(...arr.map((f) => SEV.indexOf(f.severity)));
    return worst(a[1]) - worst(b[1]) || a[0] - b[0];
  });
  for (const [id, arr] of ordered) {
    const c = byId.get(id);
    L.push(`## ${id}. ${c ? c.name : "(unknown concern)"}`, "");
    if (c) L.push(`File: content/concerns/${c._file}`, "");
    arr.sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity));
    arr.forEach((f, i) => {
      L.push(`### ${i + 1}. [${f.severity}] ${f.type}, field \`${f.field}\`, confidence ${f.confidence}`, "", f.issue, "");
      if (c) L.push("Current:", "", "```text", current(c, f.field), "```", "");
      if (f.suggested_edit) L.push("Suggested:", "", "```text", f.suggested_edit, "```", "");
      if (f.sources && f.sources.length) L.push("Sources:", ...f.sources.map((s) => `- ${s}`), "");
      L.push("Decision: [ ] accept  [ ] edit  [ ] reject", "");
    });
  }
  if (findings.suggested_additions && findings.suggested_additions.length) {
    L.push("## Suggested additions", "");
    findings.suggested_additions.forEach((a) => L.push(`- **${a.name}** (${a.category}): ${a.reason}${a.overlaps_with && a.overlaps_with.length ? ` Overlaps with ${a.overlaps_with.join(", ")}.` : ""}`));
    L.push("");
  }
  return { markdown: L.join("\n"), counts, shown: keep.length, total: findings.findings.length, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const mi = args.indexOf("--min-severity");
  const min = mi >= 0 ? args[mi + 1] : "nit";
  if (!file || !SEV.includes(min)) {
    console.error("Usage: node scripts/apply-review.mjs <findings.json> [--min-severity critical|major|minor|nit]");
    process.exit(2);
  }
  try {
    const res = buildReport(readJson(file), loadContent(), min);
    const outDir = path.join(ROOT, "review/out");
    fs.mkdirSync(outDir, { recursive: true });
    const out = path.join(outDir, `report-${path.basename(file, ".json")}.md`);
    fs.writeFileSync(out, res.markdown);
    console.log(`Wrote ${path.relative(ROOT, out)}: ${res.shown} findings (${Object.entries(res.counts).map(([k, v]) => `${k} ${v}`).join(", ")})`);
    if (res.problems.length) console.warn(`${res.problems.length} problem(s) noted in the report.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
