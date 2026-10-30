// Shared by the review pack export and the single-message review prompt builder.
const list = (title, arr) => [`**${title}:**`, ...arr.map((x) => `- ${x}`), ""];
const LEVELS = { code: "can be checked from code", partial: "can be partly checked from code", people: "needs people or runtime data" };

export function concernMarkdown(c) {

  const L = [];
  L.push(`## ${c.id}. ${c.name}`, "");
  L.push(`- id: ${c.id}`, `- ownership: ${c.ownership}`, `- agent_check level: ${c.agent_check.level} (${LEVELS[c.agent_check.level]})`);
  if (c.also_fits) L.push(`- also_fits: ${c.also_fits}`);
  L.push(`- related: ${c.related.map((r) => `${r}`).join(", ") || "none"}`, "");
  L.push(`**definition:** ${c.definition}`, "");
  if (c.applies_when) L.push(`**applies_when:** ${c.applies_when}`, "");
  L.push(`**how_it_works:** ${c.how_it_works}`, "");
  L.push(`**where_it_appears:** ${c.where_it_appears}`, "");
  L.push(`**review_question:** ${c.review_question}`, "");
  L.push(`**trade_off:** ${c.trade_off}`, "");
  L.push(`**why_it_matters:** ${c.why_it_matters}`, "");
  L.push(...list("red_flags", c.red_flags));
  L.push(...list("good_looks_like", c.good_looks_like));
  if (c.decide_between) L.push(`**decide_between:** ${c.decide_between}`, "");
  if (c.agent_check.level === "people") L.push(...list("evidence_to_request", c.agent_check.evidence_to_request));
  else {
    L.push(`**search_hints:** ${c.agent_check.search_hints.map((h) => "`" + h + "`").join(", ")}`, "");
    if (c.agent_check.look_for) L.push(...list("look_for", c.agent_check.look_for));
    if (c.agent_check.evidence_to_request) L.push(...list("evidence_to_request", c.agent_check.evidence_to_request));
  }
  return L.join("\n");
}
