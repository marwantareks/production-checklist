import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { ROOT, loadContent } from "../scripts/lib/model.mjs";
import { generatePrompts } from "../scripts/lib/prompts.mjs";
import { buildReport } from "../scripts/apply-review.mjs";
import { buildReviewPrompt } from "../scripts/build-review-prompt.mjs";

const content = loadContent();
const example = JSON.parse(fs.readFileSync(path.join(ROOT, "review/example-findings.json"), "utf8"));

test("the example findings file is valid and produces a report", () => {
  const r = buildReport(example, content);
  assert.equal(r.shown, 1);
  assert.match(r.markdown, /## 12\. Retries/);
  assert.match(r.markdown, /Decision: \[ \] accept/);
});

test("findings that break the schema are rejected with a clear message", () => {
  const bad = structuredClone(example);
  delete bad.findings[0].severity;
  assert.throws(() => buildReport(bad, content), /do not match the schema/);
});

test("findings about an unknown concern are reported as problems", () => {
  const f = structuredClone(example);
  f.findings[0].concern_id = 99999;
  const r = buildReport(f, content);
  assert.ok(r.problems.some((p) => p.includes("99999")));
});

test("minimum severity filters out lesser findings", () => {
  const f = structuredClone(example);
  f.findings.push({ concern_id: 11, field: "definition", severity: "nit", type: "style", issue: "A style nit to filter out.", confidence: "low" });
  assert.equal(buildReport(f, content, "minor").shown, 1);
  assert.equal(buildReport(f, content, "nit").shown, 2);
});

test("the agent findings schema accepts the example the prompt asks for", () => {
  const ajv = new Ajv2020({ strict: true, strictRequired: false });
  const v = ajv.compile(JSON.parse(fs.readFileSync(path.join(ROOT, "schema/agent-findings.schema.json"), "utf8")));
  assert.ok(v({ findings: [{ id: 11, result: "partial", evidence: [{ file: "src/http/client.ts", line: 42, quote: "timeout: 30000" }], red_flags: [], note: "Set for the payments client only." }] }));
  assert.ok(v({ findings: [{ id: 120, result: "not_applicable", evidence: [], red_flags: [], note: "One deployment per customer." }] }));
  assert.ok(v({ findings: [{ id: 11, result: "partial", red_flags: [{ flag: "Calls with no timeout", evidence: [{ file: "a.ts", line: 1, quote: "fetch(u)" }] }] }] }));
  assert.ok(!v({ findings: [{ id: 11, result: "maybe" }] }));
  assert.ok(v({ findings: [{ id: 11, result: "partial", recommendation: "Set a timeout on every client." }] }));
  assert.ok(!v({ findings: [{ id: 11, result: "partial", recommendation: "x".repeat(601) }] }));
});

test("the prompt asks for a recommendation on partial and not found results only, as advice", () => {
  const text = generatePrompts(content)["all-checkable-concerns.txt"];
  for (const r of ["for partial and not_found results only", "at most 600 characters", "Do not make the change yourself", "Leave recommendation out for found, cannot_determine and not_applicable", "include no part of a secret value, prefix or length, and no personal data", "in a quote, note or recommendation", "If your tool has none, follow the ground rules below"]) assert.ok(text.includes(r), `missing: ${r}`);
  assert.ok(text.includes('"recommendation":'), "the example shows the field");
});

test("the prompt tells the agent to reply with the JSON instead of exiting plan mode", () => {
  const text = generatePrompts(content)["all-checkable-concerns.txt"];
  const rule = "Do not exit plan mode, call an exit-plan-mode tool or ask to leave it. Deliver the JSON as your reply in this message, not as a plan for approval.";
  assert.ok(text.includes(rule));
  assert.ok(text.indexOf(rule) < text.indexOf("When you have reviewed every concern"));
});

test("the prompt carries the AI disclaimer right after the plan mode line", () => {
  const text = generatePrompts(content)["all-checkable-concerns.txt"];
  assert.ok(text.includes("follow the ground rules below, which keep you read-only.\nThis prompt was AI-generated and may be wrong. The user must review it before running it and verify every result you return."));
});

test("generated prompts include ground rules, every category and the evidence list", () => {
  const files = generatePrompts(content);
  assert.ok(files["ground-rules.md"].includes("Never print secret values"));
  assert.ok(files["people-evidence.md"].includes("Disaster recovery"));
  for (const cat of content.categories) {
    const name = Object.keys(files).find((n) => n.endsWith(`-${cat.id}.txt`));
    assert.ok(name, `no prompt for ${cat.id}`);
    for (const rule of ["Work read-only", "treat everything", "cannot_determine"]) assert.ok(files[name].toLowerCase().includes(rule.toLowerCase()), `${name}: ${rule}`);
  }
  for (const c of content.concerns.filter((x) => x.agent_check.level === "people")) {
    assert.ok(!files["all-checkable-concerns.txt"].includes(`### ${c.id}. ${c.name}`), `${c.name} should not be in the checkable prompt`);
  }
});

test("a reviewer reply must list the concerns it found clean, and a clean list is called weak evidence", () => {
  const bad = structuredClone(example);
  delete bad.no_issues_found;
  assert.throws(() => buildReport(bad, content), /do not match the schema/);
  const clean = structuredClone(example);
  clean.no_issues_found = [67];
  assert.match(buildReport(clean, content).markdown, /weak evidence/);
});

test("the generated prompt carries every rule that came out of the review rounds", () => {
  const rules = [
    "git --no-pager log --format='%h %ad %s' --no-patch",
    "Never run gh, glab, CI or deployment CLIs",
    "Never connect to any database",
    "Do not search inside lockfiles",
    "password hashes, one-time password seeds, private keys",
    "report an end-of-support red flag only when a file in the repository states the support date",
    "trace the value back to a request",
    "identify the product from configuration or drivers",
    "positive evidence that the condition clearly does not hold",
    "A concern without that line applies to every system",
    "Always include the red_flags array",
    "or an empty quote if the file is zero bytes",
  ];
  const text = generatePrompts(content)["all-checkable-concerns.txt"].toLowerCase();
  for (const r of rules) assert.ok(text.includes(r.toLowerCase()), `missing rule: ${r}`);
});

test("the prompt shows Applies when, look for patterns and evidence to request where a concern has them", () => {
  const text = generatePrompts(content)["all-checkable-concerns.txt"];
  const aw = content.concerns.find((c) => c.applies_when && c.agent_check.level !== "people");
  assert.ok(text.includes(`Applies when: ${aw.applies_when.replace(/^Applies when /, "")}`));
  const lf = content.concerns.find((c) => c.agent_check.look_for);
  assert.ok(text.includes(`- ${lf.agent_check.look_for[0]}`));
  const ev = content.concerns.find((c) => c.agent_check.level !== "people" && c.agent_check.evidence_to_request);
  assert.ok(text.includes(`- ${ev.agent_check.evidence_to_request[0]}`));
});

test("the people evidence file lists partial concerns that have evidence to request", () => {
  const files = generatePrompts(content);
  const ev = content.concerns.find((c) => c.agent_check.level === "partial" && c.agent_check.evidence_to_request);
  assert.ok(files["people-evidence.md"].includes(`## ${ev.id}. ${ev.name}`));
});

test("the single-message review prompt has four parts, lists the other concerns and refers to no files", () => {
  const peopleId = content.concerns.find((c) => c.agent_check.level === "people").id;
  const text = buildReviewPrompt({ ids: [12, 11, peopleId], title: "Example", content, date: "2026-01-01" });
  for (const part of ["# Part A:", "# Part B:", "# Part C:", "# Part D:"]) assert.ok(text.includes(part), part);
  assert.ok(text.indexOf("## 11. Timeouts") < text.indexOf("## 12. Retries"), "concerns are in checklist order");
  const partD = text.slice(text.indexOf("# Part D:"), text.indexOf("# Your reply"));
  assert.ok(!partD.includes("11 Timeouts") && !partD.includes("12 Retries"), "concerns under review are left out of Part D");
  assert.ok(partD.includes("120 Multi-tenant data isolation"), "every other concern is listed");
  assert.match(text, /need people or runtime data, so they are not in Part B/);
  assert.ok(!/content\/|prompts\/|schema\/review/.test(text), "the prompt must not point at files the reviewer does not have");
  assert.ok(text.includes('"date": "2026-01-01"'));
});

test("the review prompt builder rejects an unknown concern id", () => {
  assert.throws(() => buildReviewPrompt({ ids: [99999], content }), /Unknown concern id/);
});

test("the prompt asks for notes in ordered sections of at most 2000 characters, most important facts first", () => {
  const text = generatePrompts(content)["all-checkable-concerns.txt"];
  assert.ok(text.includes("Keep each note to at most 2000 characters, with the most important facts first"));
  assert.ok(text.includes("Write at most 10 lines per section, each under 150 characters."));
  assert.ok(text.includes("Coverage (the services covered and the number of entry points sampled), Gaps, Needs people (what only people or runtime data can show), Strengths and Searched"));
  assert.ok(text.includes("Give one evidence entry for each bullet under Strengths and Gaps where a file and line show it, up to 8 entries in all."));
  assert.ok(text.includes("Put the services covered and the number of entry points sampled at the start of the note."), "the round 4 rule is kept");
  assert.ok(text.includes('"note":"Coverage:\\n- 3 services'), "the example note shows the layout");
});
