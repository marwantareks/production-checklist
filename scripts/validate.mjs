// Validates content against the schemas and the rules a schema cannot express.
// Exit code 1 on any error. Warnings never fail the run.
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import YAML from "yaml";
import { ROOT, loadContent, fileNameFor } from "./lib/model.mjs";

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
const schema = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, "schema", name), "utf8"));
const vConcern = ajv.compile(schema("concern.schema.json"));
const vCategories = ajv.compile(schema("categories.schema.json"));
const vMeta = ajv.compile(schema("meta.schema.json"));
const vRetired = ajv.compile(schema("retired.schema.json"));
const GENERIC = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/lib/generic-hints.json"), "utf8")).words);
const STOP = new Set(["a", "an", "the", "with", "without", "of", "in", "for", "to", "no", "is", "are", "that", "which", "any"]);

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const schemaErrors = (where, v) => v.errors.forEach((e) => err(where, `${e.instancePath || "(root)"} ${e.message}`));

export function validate(root = ROOT) {
  errors.length = 0;
  warnings.length = 0;

  const content = loadContent(root);
  const rawCats = YAML.parse(fs.readFileSync(path.join(root, "content/categories.yaml"), "utf8"));
  if (!vCategories(rawCats)) schemaErrors("content/categories.yaml", vCategories);
  if (!vMeta(content.meta)) schemaErrors("content/meta.yaml", vMeta);

  const retiredFile = path.join(root, "content/retired.yaml");
  const retired = fs.existsSync(retiredFile) ? YAML.parse(fs.readFileSync(retiredFile, "utf8")) : { retired: [] };
  if (!vRetired(retired)) schemaErrors("content/retired.yaml", vRetired);
  const retiredIds = new Set((retired.retired || []).map((r) => r.id));

  const catIds = new Set();
  const catOrders = new Set();
  for (const c of content.categories) {
    if (catIds.has(c.id)) err("categories.yaml", `duplicate category id "${c.id}"`);
    if (catOrders.has(c.order)) err("categories.yaml", `duplicate category order ${c.order}`);
    catIds.add(c.id);
    catOrders.add(c.order);
  }

  const ids = new Map();
  const positions = new Map();
  for (const c of content.concerns) {
    const where = `content/concerns/${c._file}`;
    const { _file, ...data } = c;
    if (!vConcern(data)) { schemaErrors(where, vConcern); continue; }

    if (ids.has(c.id)) err(where, `id ${c.id} is already used by ${ids.get(c.id)}`);
    if (retiredIds.has(c.id)) err(where, `id ${c.id} was retired and must not be reused`);
    ids.set(c.id, c._file);
    if (c._file !== fileNameFor(c)) err(where, `file name should be ${fileNameFor(c)}`);
    if (!catIds.has(c.category)) err(where, `unknown category "${c.category}"`);

    const pos = `${c.category}:${c.order}`;
    if (positions.has(pos)) err(where, `order ${c.order} is also used by ${positions.get(pos)} in category ${c.category}`);
    positions.set(pos, c._file);

    // Style rules for prose. Search hints and evidence are exempt because they are literal strings.
    const prose = {
      definition: c.definition, how_it_works: c.how_it_works, where_it_appears: c.where_it_appears,
      review_question: c.review_question, trade_off: c.trade_off, why_it_matters: c.why_it_matters,
      decide_between: c.decide_between, applies_when: c.applies_when,
    };
    const lists = { red_flags: c.red_flags, good_looks_like: c.good_looks_like, look_for: c.agent_check.look_for || [] };
    const checkText = (field, text) => {
      if (text === undefined) return;
      if (text !== text.trim()) err(where, `${field} has leading or trailing whitespace`);
      if (/\s{2,}/.test(text)) err(where, `${field} has repeated whitespace`);
      if (/\w'\w/.test(text) || /(^|\s)'|'(\s|$)/.test(text)) err(where, `${field} uses a straight apostrophe or quote; use ’ or “ ”`);
      if (/[—–]/.test(text)) err(where, `${field} contains a dash used as punctuation; rewrite the sentence`);
      if (/[<>]/.test(text)) err(where, `${field} contains < or >`);
      if (/^[a-z]/.test(text)) err(where, `${field} should start with a capital letter`);
    };
    for (const [f, t] of Object.entries(prose)) {
      checkText(f, t);
      if (t === undefined) continue;
      if (f === "review_question") { if (!t.endsWith("?")) err(where, "review_question must end with ?"); }
      else if (!t.endsWith(".")) err(where, `${f} must end with a full stop`);
      if (f === "applies_when" && !t.startsWith("Applies when ")) err(where, "applies_when must start with “Applies when ”");
    }
    for (const [f, arr] of Object.entries(lists)) {
      arr.forEach((t, i) => {
        checkText(`${f}[${i}]`, t);
        if (t.endsWith(".")) err(where, `${f}[${i}] should not end with a full stop`);
      });
    }

    const lvl = c.agent_check.level;
    if (lvl !== "people") {
      const hints = c.agent_check.search_hints;
      if (hints.some((h) => h !== h.trim())) err(where, "a search hint has leading or trailing whitespace");
      if (new Set(hints).size !== hints.length) err(where, "a search hint is listed twice");
      for (const h of hints) {
        if (GENERIC.has(h)) err(where, `search hint “${h}” is a single common word, which matches thousands of unrelated lines; pair it with context`);
        const words = h.split(" ");
        if (words.length >= 4 && words.some((w) => STOP.has(w.toLowerCase()))) err(where, `search hint “${h}” reads like a sentence; put patterns described in words in look_for`);
      }
    }
    if (c.name !== c.name.trim() || /^[a-z]/.test(c.name)) err(where, "name should start with a capital letter and have no stray whitespace");

    for (const r of c.related) {
      if (r === c.id) err(where, "related lists the concern itself");
    }
    if (c.decide_between && !/ (or|and) /.test(c.decide_between)) warn(where, "decide_between does not name options with “or”");
  }

  // Cross-file checks after every concern is known.
  for (const c of content.concerns) {
    const where = `content/concerns/${c._file}`;
    for (const r of c.related || []) {
      if (retiredIds.has(r)) err(where, `related id ${r} was retired`);
      else if (!ids.has(r)) err(where, `related id ${r} does not exist`);
    }
  }
  for (const cat of content.categories) {
    if (!content.concerns.some((c) => c.category === cat.id)) warn("categories.yaml", `category "${cat.id}" has no concerns`);
  }

  return { errors: [...errors], warnings: [...warnings], concernCount: content.concerns.length, categoryCount: content.categories.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = validate();
  for (const w of r.warnings) console.warn("warning:", w);
  for (const e of r.errors) console.error("error:", e);
  if (r.errors.length) {
    console.error(`\nValidation failed with ${r.errors.length} error(s).`);
    process.exit(1);
  }
  console.log(`OK: ${r.concernCount} concerns in ${r.categoryCount} categories, no errors${r.warnings.length ? `, ${r.warnings.length} warning(s)` : ""}.`);
}
