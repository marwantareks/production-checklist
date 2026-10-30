// Loads the YAML content and converts it to the shapes the page and the prompt kit use.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const pad = (n) => String(n).padStart(3, "0");
export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const fileNameFor = (c) => `${pad(c.id)}-${slug(c.name)}.yaml`;

export function loadContent(root = ROOT) {
  const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
  const categories = YAML.parse(read("content/categories.yaml")).categories.slice().sort((a, b) => a.order - b.order);
  const meta = YAML.parse(read("content/meta.yaml"));
  const dir = path.join(root, "content/concerns");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort();
  const concerns = files.map((f) => ({ ...YAML.parse(fs.readFileSync(path.join(dir, f), "utf8")), _file: f }));
  const retiredPath = path.join(root, "content/retired.yaml");
  const retired = fs.existsSync(retiredPath) ? YAML.parse(read("content/retired.yaml")).retired || [] : [];
  return { root, meta, categories, concerns, retired };
}

// The page script reads these globals: C, G, D, X, DEEP, CI.
export function toLegacy({ categories, concerns }) {
  const byId = {};
  const C = categories.map((cat) => {
    const items = concerns
      .filter((x) => x.category === cat.id)
      .sort((a, b) => a.order - b.order)
      .map((x) => (x.also_fits ? [x.id, x.name, x.definition, x.also_fits] : [x.id, x.name, x.definition]));
    return [cat.name, cat.hue, cat.summary, items];
  });
  const G = concerns.filter((x) => x.ownership === "guardrail").map((x) => x.id);
  const D = concerns.filter((x) => x.ownership === "delegate").map((x) => x.id);
  const X = {};
  const DEEP = {};
  for (const x of concerns) {
    byId[x.id] = x;
    X[x.id] = [x.review_question, x.trade_off, x.related];
    const a = x.agent_check;
    const d = {
      chk: a.level,
      how: x.how_it_works,
      where: x.where_it_appears,
      why: x.why_it_matters,
      flags: x.red_flags,
      good: x.good_looks_like,
      decide: x.decide_between || "",
    };
    if (a.level === "people") d.ask = a.evidence_to_request;
    else {
      d.sig = a.search_hints;
      if (a.look_for) d.look = a.look_for;
      if (a.evidence_to_request) d.ask = a.evidence_to_request;
    }
    if (x.applies_when) d.app = x.applies_when;
    DEEP[x.id] = d;
  }
  const CI = categories.map((c) => c.icon);
  return { C, G, D, X, DEEP, CI };
}

// Same structure the page builds at runtime, for use outside the browser.
export function promptContext(legacy) {
  const IDX = {};
  legacy.C.forEach((c) => c[3].forEach((it) => { IDX[it[0]] = it; }));
  return { C: legacy.C, IDX, DEEP: legacy.DEEP, X: legacy.X };
}
