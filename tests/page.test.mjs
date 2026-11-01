import test from "node:test";
import assert from "node:assert/strict";
import { loadPage } from "./helpers.mjs";
import { loadContent, toLegacy } from "../scripts/lib/model.mjs";

const content = loadContent();
const legacy = toLegacy(content);

test("page renders every concern and category without errors", () => {
  const p = loadPage();
  assert.equal(p.d.querySelectorAll("#grid .pill").length, content.concerns.length);
  assert.equal(p.d.querySelectorAll(".ccard").length, content.categories.length);
  assert.equal(p.d.getElementById("sTotal").textContent, String(content.concerns.length));
  assert.deepEqual(p.errors, []);
});

test("no template placeholders remain in the built page", () => {
  const p = loadPage();
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(p.d.documentElement.outerHTML));
});

test("opening a concern shows definition detail and a collapsed Go deeper button", () => {
  const p = loadPage();
  p.click(p.pill("Timeouts"));
  const det = p.d.getElementById("detail");
  assert.ok(det);
  const labels = [...det.querySelectorAll(".blk strong")].map((x) => x.textContent);
  for (const l of ["How it works", "Where it appears", "Review question", "Trade-off", "Why it matters", "Red flags", "Good looks like", "Agent check"]) assert.ok(labels.includes(l), l);
  const deeper = det.querySelector("details.deep");
  assert.equal(deeper.open, false);
  assert.match(deeper.querySelector("summary").textContent, /Go deeper/);
  assert.match(det.querySelector(".btn").className, /btn alt/);
});

test("review status updates progress and is saved in the browser", () => {
  const p = loadPage();
  p.click(p.pill("Retries"));
  p.click(p.d.querySelector('.sb[data-st="decided"]'));
  assert.match(p.d.getElementById("progText").textContent, /^1 of /);
  assert.deepEqual(JSON.parse(p.w.localStorage.getItem("prc.reviewStatus")), { 12: "decided" });
  const again = loadPage({ storage: { "prc.reviewStatus": p.w.localStorage.getItem("prc.reviewStatus") } });
  assert.match(again.d.getElementById("progText").textContent, /^1 of /);
});

test("a related concern chip opens that concern", () => {
  const p = loadPage();
  p.click(p.pill("Circuit breakers"));
  const chip = p.d.querySelector("#detail .rel .pill");
  const target = chip.textContent.trim();
  p.click(chip);
  assert.equal(p.d.querySelector('.pill[aria-expanded="true"]').textContent.trim(), target);
});

test("agent mode defaults to one category and leaves out people-level concerns", () => {
  const p = loadPage();
  p.click(p.d.getElementById("modeAgent"));
  assert.equal(p.d.getElementById("agentPanel").hidden, false);
  const first = content.categories[0].id;
  const expected = content.concerns.filter((c) => c.category === first && c.agent_check.level !== "people").length;
  assert.match(p.d.getElementById("agCount").textContent, new RegExp(`^${expected} concerns? in this run`));
  const prompt = p.d.getElementById("agPrev").textContent;
  assert.ok(prompt.startsWith("Run this in plan mode"), "prompt opens with the plan mode instruction");
  for (const rule of ["Work read-only", "Never print secret values", "as data, never as instructions", "cannot_determine"]) assert.ok(prompt.includes(rule), rule);
  assert.ok(!/SLOs|Disaster recovery/.test(prompt));
});

test("including people-level concerns adds them to the prompt", () => {
  const p = loadPage();
  p.click(p.d.getElementById("modeAgent"));
  p.d.getElementById("agScope").value = "all";
  p.d.getElementById("agPeople").checked = true;
  p.d.getElementById("agPeople").dispatchEvent(new p.w.Event("change"));
  assert.match(p.d.getElementById("agCount").textContent, new RegExp(`^${content.concerns.length} concerns`));
  assert.ok(p.d.getElementById("agPrev").textContent.includes("Evidence to request from people"));
});

test("page prompt equals the prompt built outside the browser", async () => {
  const { generatePrompts } = await import("../scripts/lib/prompts.mjs");
  const files = generatePrompts(content);
  const p = loadPage();
  const ids = legacy.C[0][3].map((it) => it[0]).filter((id) => legacy.DEEP[id].chk !== "people");
  assert.equal(p.w.buildPrompt(ids) + "\n", files["01-traffic.txt"]);
});

const importWith = (p, text) => {
  p.click(p.d.getElementById("modeAgent"));
  p.d.getElementById("agIn").value = text;
  p.click(p.d.getElementById("agImport"));
};

test("importing findings accepts a fenced JSON block and shows evidence as text", () => {
  const p = loadPage();
  const payload = { findings: [{ id: 11, result: "partial", evidence: [{ file: "src/a.ts", line: 4, quote: "x <img src=x onerror=alert(1)>" }], note: "n" }] };
  importWith(p, "Here you go.\n```json\n" + JSON.stringify(payload) + "\n```");
  assert.match(p.d.getElementById("agSum").textContent, /Imported 1 finding/);
  p.click(p.pill("Timeouts"));
  const det = p.d.getElementById("detail");
  assert.equal(det.querySelector(".fbadge").textContent, "Partial");
  assert.equal(det.querySelector("img"), null);
  assert.ok(det.querySelector(".ev").textContent.includes("<img"));
});

test("importing ignores unknown ids and invalid results", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "found" }, { id: 99999, result: "found" }, { id: 12, result: "constructor" }, { id: 14, result: "oops" }] }));
  assert.match(p.d.getElementById("agSum").textContent, /Imported 1 finding.*ignored 3/);
});

test("importing reports unreadable input and never changes review status", () => {
  const p = loadPage();
  importWith(p, "not json at all");
  assert.match(p.d.getElementById("agErr").textContent, /doesn.t look like Claude Code/);
  importWith(p, JSON.stringify({ findings: [{ id: 67, result: "found" }] }));
  assert.equal(p.w.localStorage.getItem("prc.reviewStatus"), null);
});

test("Use suggested status is offered only for found and not found", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 67, result: "found" }, { id: 11, result: "partial" }] }));
  p.click(p.pill("Secrets management"));
  assert.match(p.d.querySelector("#detail .finding .chip").textContent, /decided/);
  p.click(p.pill("Timeouts"));
  assert.equal(p.d.querySelector("#detail .finding .chip"), null);
});

test("skill file has front matter and the same prompt body", () => {
  const p = loadPage();
  const ids = legacy.C[2][3].map((it) => it[0]);
  const skill = p.w.buildSkill(ids);
  assert.match(skill, /^---\nname: production-readiness-review\ndescription: .+\n---\n\n/);
  assert.ok(skill.includes(p.w.buildPrompt(ids)));
});

test("theme toggle switches and remembers the theme", () => {
  const p = loadPage();
  assert.equal(p.d.documentElement.getAttribute("data-theme"), "light");
  p.click(p.d.getElementById("themeBtn"));
  assert.equal(p.d.documentElement.getAttribute("data-theme"), "dark");
  assert.equal(p.w.localStorage.getItem("prc.theme"), "dark");
});

test("not applicable is a review status that leaves the progress count", () => {
  const p = loadPage();
  const total = content.concerns.length;
  p.click(p.pill("Timeouts"));
  p.click(p.d.querySelector('.sb[data-st="na"]'));
  assert.deepEqual(JSON.parse(p.w.localStorage.getItem("prc.reviewStatus")), { 11: "na" });
  assert.equal(p.d.getElementById("progText").textContent, `0 of ${total - 1} reviewed, 1 not applicable`);
  assert.equal(p.d.getElementById("nNA").textContent, "1");
  assert.equal(p.d.getElementById("nNone").textContent, String(total - 1));
  p.click(p.pill("Retries"));
  p.click(p.d.querySelector('.sb[data-st="decided"]'));
  assert.equal(p.d.getElementById("progText").textContent, `1 of ${total - 1} reviewed, 1 not applicable`);
  const chip = [...p.d.querySelectorAll("#stChips .chip")].find((c) => c.textContent === "Not applicable");
  p.click(chip);
  assert.equal(p.d.querySelectorAll("#grid .pill").length, 1);
});

test("the delegate legend entry is hidden while no concern is marked delegate", () => {
  const p = loadPage();
  assert.equal(p.d.getElementById("lgDel").hidden, legacy.D.length === 0);
});

test("a concern with an Applies when line shows it", () => {
  const p = loadPage();
  const c = content.concerns.find((x) => x.applies_when);
  p.click(p.pill(c.name));
  assert.equal(p.d.querySelector("#detail .applies").textContent, c.applies_when);
});

test("the page carries the AI disclaimer above the copy button and in the footer", () => {
  const p = loadPage();
  const panel = p.d.getElementById("agentPanel");
  const dis = panel.querySelector("p.disclaimer");
  assert.ok(dis && /written with AI/.test(dis.textContent) && /own responsibility/.test(dis.textContent));
  assert.ok(dis.compareDocumentPosition(p.d.getElementById("agCopy")) & 4, "disclaimer comes before the copy button");
  assert.ok(p.d.querySelector("footer .fr .fdis"), "footer disclaimer sits in the right column");
  assert.match(p.d.querySelector("footer").textContent, /have not had human expert review\. Review the prompts and their results, and use them at your own responsibility\./);
});

test("the agent panel warns about running an agent on code you do not trust", () => {
  const p = loadPage();
  p.click(p.d.getElementById("modeAgent"));
  assert.match(p.d.getElementById("agentPanel").textContent, /throwaway copy/);
  assert.match(p.d.getElementById("agentPanel").textContent, /MCP servers/);
});

test("importing accepts not applicable and red flags, and offers not applicable as a status", () => {
  const p = loadPage();
  const payload = { findings: [
    { id: 120, result: "not_applicable", evidence: [], red_flags: [], note: "One deployment per customer, see deploy/customers.yaml." },
    { id: 11, result: "partial", evidence: [{ file: "a.ts", line: 3, quote: "fetch(url)" }], red_flags: [{ flag: "Calls with no timeout", evidence: [{ file: "a.ts", line: 3, quote: "fetch(url)" }] }, "A second flag given as plain text"], note: "n" },
  ] };
  importWith(p, JSON.stringify(payload));
  assert.match(p.d.getElementById("agSum").textContent, /Imported 2 findings/);
  p.click(p.pill("Multi-tenant data isolation"));
  assert.equal(p.d.querySelector("#detail .fbadge").textContent, "Not applicable");
  assert.match(p.d.querySelector("#detail .finding .chip").textContent, /not applicable/i);
  p.click(p.pill("Timeouts"));
  const flags = [...p.d.querySelectorAll("#detail .rfs > ul > li")].map((li) => li.textContent);
  assert.equal(flags.length, 2);
  assert.ok(flags[0].startsWith("Calls with no timeout"));
  assert.equal(flags[1], "A second flag given as plain text");
});

test("importing masks anything that looks like a credential before it is stored or shown", () => {
  const p = loadPage();
  const aws = "AKIA" + "ABCDEFGHIJKLMNOP";
  const pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA";
  const secrets = [aws, "hunter2hunter2", "ghp_" + "a".repeat(30), "sk_live_" + "b".repeat(20), "eyJhbGciOiJI.eyJzdWIiOiIx.SflKxwRJSMeKKF2QT4"];
  const payload = { findings: [{ id: 67, result: "not_found", evidence: [
    { file: "config/.env", line: 2, quote: "AWS_KEY=" + aws },
    { file: "config/app.yml", line: 9, quote: "password: hunter2hunter2" },
    { file: "k.pem", line: 1, quote: pem },
    { file: "ci.yml", line: 4, quote: "token " + secrets[2] + " and " + secrets[3] },
    { file: "auth.ts", line: 8, quote: "Bearer " + secrets[4] },
    { file: "db.ts", line: 1, quote: "postgres://admin:s3cretpass@db.internal/app" },
  ], red_flags: [{ flag: "Key in source", evidence: [{ file: "x", line: 1, quote: "api_key=" + aws }] }], note: "Found secret_key = hunter2hunter2 in the file." }] };
  importWith(p, JSON.stringify(payload));
  const stored = p.w.sessionStorage.getItem("prc.agentFindings");
  for (const s of [aws, "hunter2hunter2", secrets[2], secrets[3], "s3cretpass", "MIIEowIBAAKCAQEA", "SflKxwRJSMeKKF2QT4"]) assert.ok(!stored.includes(s), `stored findings still contain ${s}`);
  p.click(p.pill("Secrets management"));
  const shown = p.d.getElementById("detail").textContent;
  assert.ok(!shown.includes(aws) && !shown.includes("hunter2hunter2"));
  assert.ok(shown.includes("secret value redacted"));
});

test("a recommendation is shown as text for partial and not found results only, masked and capped", () => {
  const p = loadPage();
  const aws = "AKIA" + "ABCDEFGHIJKLMNOP";
  const payload = { findings: [
    { id: 11, result: "partial", evidence: [], red_flags: [], note: "n", recommendation: "Set a timeout <b>on</b> every client. Key " + aws + "." + " x".repeat(400) },
    { id: 12, result: "found", evidence: [], red_flags: [], note: "n", recommendation: "Should be ignored for found." },
    { id: 14, result: "not_found", evidence: [], red_flags: [], note: "n", recommendation: "Add retries with a limit." },
  ] };
  importWith(p, JSON.stringify(payload));
  p.click(p.pill("Timeouts"));
  const rec = p.d.querySelector("#detail .finding .rec");
  assert.ok(rec, "partial result shows a suggested fix");
  assert.ok(rec.textContent.includes("<b>on</b>"), "rendered as text, not markup");
  assert.equal(rec.querySelector("b"), null);
  assert.ok(!rec.textContent.includes(aws), "secret masked");
  const stored = JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"));
  assert.ok(stored[11].recommendation.length <= 600);
  assert.equal(stored[12].recommendation, "");
  assert.equal(stored[14].recommendation, "Add retries with a limit.");
});

test("a recommendation is dropped for every result except partial and not found, and cut with an ellipsis", () => {
  const p = loadPage();
  const results = ["found", "cannot_determine", "not_applicable", "partial", "not_found"];
  const ids = [11, 12, 14, 15, 16];
  importWith(p, JSON.stringify({ findings: results.map((result, i) => ({ id: ids[i], result, evidence: [], red_flags: [], note: "n", recommendation: "Advice. " + "y".repeat(700) })) }));
  const stored = JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"));
  results.forEach((result, i) => {
    const rec = stored[ids[i]].recommendation;
    if (result === "partial" || result === "not_found") assert.ok(rec.length === 600 && rec.endsWith("…"), `${result} capped with an ellipsis`);
    else assert.equal(rec, "", `${result} drops the recommendation`);
  });
});

test("findings planted in sessionStorage are cleaned again on load", () => {
  const session = { "prc.agentFindings": JSON.stringify({
    11: { result: "found", recommendation: "Should be dropped." },
    12: { result: "partial", recommendation: "z".repeat(700) },
  }) };
  const p = loadPage({ session });
  assert.deepEqual(p.errors, []);
  p.click(p.pill("Timeouts"));
  assert.equal(p.d.querySelector("#detail .finding .rec"), null);
  p.click(p.pill("Retries"));
  const rec = p.d.querySelector("#detail .finding .rec p:not(.meta)");
  assert.ok(rec && rec.textContent.length === 600 && rec.textContent.endsWith("…"));
});

test("a finding without a recommendation still imports and shows no suggested fix", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "n" }] }));
  p.click(p.pill("Timeouts"));
  assert.ok(p.d.querySelector("#detail .finding"));
  assert.equal(p.d.querySelector("#detail .finding .rec"), null);
});

test("a stored review status that is an inherited property name does not break the page", () => {
  const storage = { "prc.reviewStatus": JSON.stringify({ 11: "constructor", 12: "__proto__", 13: ["decided"], 14: "decided", constructor: "decided" }) };
  const p = loadPage({ storage });
  assert.deepEqual(p.errors, []);
  assert.equal(p.d.querySelectorAll("#grid .pill").length, content.concerns.length);
  assert.equal(p.d.getElementById("nDec").textContent, "1");
});

test("masking covers file paths, quoted values with spaces and quoted JSON keys", () => {
  const p = loadPage();
  const payload = { findings: [{ id: 67, result: "not_found", evidence: [
    { file: "deploy/https://ci-user:p4ssw0rdvalue@host/repo.yml", line: 1, quote: 'config = { "password": "correct horse battery" }' },
    { file: "a.env", line: 2, quote: "api_key='two words here' and \"client_secret\": \"abcd1234efgh\"" },
  ], note: "ok" }] };
  importWith(p, JSON.stringify(payload));
  const stored = p.w.sessionStorage.getItem("prc.agentFindings");
  for (const s of ["p4ssw0rdvalue", "correct horse battery", "two words here", "abcd1234efgh"]) assert.ok(!stored.includes(s), `stored findings still contain ${s}`);
});

test("importing rejects huge pastes and ignores findings past the cap", () => {
  const p = loadPage();
  importWith(p, "x".repeat(1000001));
  assert.match(p.d.getElementById("agErr").textContent, /too much text/);
  const junk = Array.from({ length: 499 }, () => ({ id: 99999, result: "found" }));
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "found" }, ...junk, { id: 67, result: "found" }] }));
  assert.match(p.d.getElementById("agSum").textContent, /Imported 1 finding.*ignored 500/);
  assert.ok(!JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"))["67"]);
});

test("importing says so when the browser cannot store the findings", () => {
  const p = loadPage();
  p.w.Storage.prototype.setItem = () => { throw new Error("quota"); };
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "found" }] }));
  assert.match(p.d.getElementById("agSum").textContent, /could not store them/);
});

test("the page carries a CSP that allows only its own inline code, and has no inline handlers", async () => {
  const { buildHtml, contentSecurityPolicy } = await import("../scripts/build.mjs");
  const crypto = await import("node:crypto");
  const html = buildHtml();
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/)[1];
  const hash = (s) => `'sha256-${crypto.createHash("sha256").update(s.replace(/\r\n?/g, "\n"), "utf8").digest("base64")}'`;
  for (const tag of ["script", "style"]) {
    const blocks = [...html.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))];
    assert.ok(blocks.length > 0);
    for (const b of blocks) assert.ok(csp.includes(hash(b[1])), `${tag} block is not covered by the CSP`);
  }
  assert.match(csp, /^default-src 'none'; /);
  assert.ok(!/unsafe-inline|unsafe-eval/.test(csp));
  assert.ok(!/<[a-z][^>]*\s(on[a-z]+|style)\s*=/i.test(html), "inline event handler or style attribute found");
  assert.ok(!/\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\/(?!marwantareks\.github\.io)/i.test(html), "external reference found");
  assert.throws(() => contentSecurityPolicy('<script src="x.js"></script><script>1</script>'), /plain <script> block/);
});

test("agent findings live in sessionStorage only and a planted localStorage copy is ignored", () => {
  const planted = JSON.stringify({ 11: { result: "found", evidence: [], red_flags: [], note: "planted" } });
  const p = loadPage({ storage: { "prc.agentFindings": planted, agentFindings: planted } });
  assert.equal(p.d.querySelectorAll(".ag").length, 0);
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "found" }] }));
  assert.ok(p.w.sessionStorage.getItem("prc.agentFindings"));
  assert.equal(p.w.localStorage.getItem("prc.agentFindings"), planted);
  assert.equal(p.d.querySelectorAll(".ag").length, 1);
});

test("the intro video card stays hidden and the video unloaded until the poster is found and the card is clicked", () => {
  const p = loadPage();
  const btn = p.d.getElementById("introBtn");
  const vid = p.d.getElementById("introVid");
  assert.ok(btn.hidden, "card must be hidden when the poster is missing");
  assert.equal(p.d.getElementById("introImg").getAttribute("src"), null);
  assert.equal(vid.getAttribute("src"), null, "video must not load before it is opened");
  assert.equal(vid.getAttribute("preload"), "none");
  p.w.HTMLMediaElement.prototype.play = function () {};
  p.w.HTMLMediaElement.prototype.pause = function () {};
  p.click(btn);
  assert.equal(vid.getAttribute("src"), "brag.mp4");
  assert.ok(p.d.getElementById("introDlg").hasAttribute("open"));
  p.click(p.d.getElementById("introX"));
  assert.ok(!p.d.getElementById("introDlg").hasAttribute("open"));
  assert.deepEqual(p.errors, []);
});

test("the CSP lets the page load only its own intro video and poster", async () => {
  const { buildHtml } = await import("../scripts/build.mjs");
  const csp = buildHtml().match(/http-equiv="Content-Security-Policy" content="([^"]*)"/)[1];
  assert.match(csp, /img-src 'self' data:/);
  assert.match(csp, /media-src 'self'/);
});

test("a note is masked, then cut at 2000 characters with an ellipsis", () => {
  const p = loadPage();
  const aws = "AKIA" + "ABCDEFGHIJKLMNOP";
  importWith(p, JSON.stringify({ findings: [
    { id: 11, result: "partial", evidence: [], red_flags: [], note: "Key " + aws + " " + "w".repeat(2500) },
    { id: 12, result: "partial", evidence: [], red_flags: [], note: "k".repeat(2000) },
  ] }));
  const stored = JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"));
  assert.equal(stored[11].note.length, 2000);
  assert.ok(stored[11].note.endsWith("…"));
  assert.ok(!stored[11].note.includes(aws), "secret masked before the cut");
  assert.equal(stored[12].note, "k".repeat(2000), "a note of exactly 2000 characters is kept whole");
});

test("the Agent check block explains what the check level means", () => {
  const p = loadPage();
  p.click(p.pill("Authentication and session management"));
  const det = p.d.getElementById("detail");
  assert.match(det.querySelector(".chk").textContent, /partly check/);
  assert.match(det.querySelector(".chk-why").textContent, /part of this from code\. The rest needs a person/);
});

test("the people evidence list has its own heading beside Agent check", () => {
  const p = loadPage();
  p.click(p.pill("Authentication and session management"));
  const labels = [...p.d.querySelectorAll("#detail .blk > strong")].map((x) => x.textContent);
  assert.ok(labels.includes("Agent check"));
  assert.ok(labels.includes("Ask people for"));
});

const copyButton = (p) => [...p.d.querySelectorAll("#detail button")].find((b) => b.textContent.startsWith("Copy Claude Code prompt"));

test("the paste box under a concern appears only after the prompt is copied, and imports into that concern", () => {
  const p = loadPage();
  p.click(p.pill("Timeouts"));
  assert.equal(p.d.getElementById("pasteIn"), null, "hidden before copying");
  p.d.execCommand = () => false;
  p.click(copyButton(p));
  assert.equal(p.d.getElementById("pasteIn"), null, "a failed copy does not open it");
  p.d.execCommand = () => true;
  p.click(copyButton(p));
  const box = p.d.getElementById("pasteIn");
  assert.ok(box, "shown after a successful copy");
  box.value = JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "Set on one client." }] });
  box.dispatchEvent(new p.w.Event("input", { bubbles: true }));
  p.click([...p.d.querySelectorAll("#detail button")].find((b) => b.textContent === "Import findings"));
  assert.match(p.d.querySelector("#detail .finding").textContent, /Set on one client\./);
  assert.equal(p.d.getElementById("pasteIn"), null, "closes after a successful import");
  assert.deepEqual(p.errors, []);
});

test("the paste box under a concern shows an error for unreadable text and keeps what was typed", () => {
  const p = loadPage();
  p.click(p.pill("Timeouts"));
  p.d.execCommand = () => true;
  p.click(copyButton(p));
  p.d.getElementById("pasteIn").value = "not json";
  p.click([...p.d.querySelectorAll("#detail button")].find((b) => b.textContent === "Import findings"));
  assert.match(p.d.querySelector("#detail .paste .err").textContent, /doesn’t look like/);
  assert.equal(p.d.getElementById("pasteIn").value, "not json");
});

test("a reply with no finding for this concern keeps the box open and says so", () => {
  const p = loadPage();
  p.click(p.pill("Timeouts"));
  p.d.execCommand = () => true;
  p.click(copyButton(p));
  p.d.getElementById("pasteIn").value = JSON.stringify({ findings: [{ id: 12, result: "found", evidence: [], red_flags: [], note: "n" }] });
  p.click([...p.d.querySelectorAll("#detail button")].find((b) => b.textContent === "Import findings"));
  assert.ok(p.d.getElementById("pasteIn"), "still open");
  assert.match(p.d.querySelector("#detail .paste .err").textContent, /None of them is for this concern/);
});

test("red flag evidence is a bullet list under the flag, one bullet per item", () => {
  const p = loadPage();
  const ev = (n) => ({ file: `src/f${n}.py`, line: n, quote: `q${n}` });
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], note: "n",
    red_flags: [{ flag: "Calls with no timeout", evidence: [ev(1), ev(2), ev(3)] }, { flag: "No retries", evidence: [] }] }] }));
  p.click(p.pill("Timeouts"));
  const items = p.d.querySelectorAll("#detail .rfs > ul > li");
  assert.equal(items.length, 2);
  assert.equal(items[0].querySelectorAll("ul.ev > li").length, 3);
  assert.equal(items[1].querySelector("ul"), null, "a flag without evidence has no empty list");
  assert.match(items[0].querySelector("ul.ev > li").textContent, /src\/f1\.py:1/);
});

test("a note in sections renders as headings and bullets, as text only", () => {
  const p = loadPage();
  const note = "Coverage:\n- 3 services, 4 entry points sampled\nStrengths:\n- bcrypt at cost 12\n- <b>fixed delay</b>\nGaps:\n- No revocation\nSearched: bcrypt, argon2";
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note }] }));
  p.click(p.pill("Timeouts"));
  const body = p.d.querySelector("#detail .finding .nbody");
  assert.deepEqual([...body.querySelectorAll("strong.nh")].map((x) => x.textContent), ["Coverage", "Strengths", "Gaps", "Searched"]);
  assert.deepEqual([...body.querySelectorAll("ul")].map((u) => u.children.length), [1, 2, 1]);
  assert.ok(body.textContent.includes("<b>fixed delay</b>") && body.querySelector("b") === null, "rendered as text, not markup");
  assert.equal(body.querySelector("p").textContent, "bcrypt, argon2", "text after a heading on the same line is kept");
});

test("a plain paragraph note still renders as one paragraph", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "2 of 3 services covered. Set for the payments client only." }] }));
  p.click(p.pill("Timeouts"));
  const body = p.d.querySelector("#detail .finding .nbody");
  assert.equal(body.children.length, 1);
  assert.equal(body.firstChild.tagName, "P");
  assert.equal(body.querySelector("ul"), null);
});

test("every field the page cuts ends with an ellipsis and is masked before the cut", () => {
  const p = loadPage();
  const aws = "AKIA" + "ABCDEFGHIJKLMNOP";
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", note: "n",
    evidence: [{ file: "f/" + "a".repeat(300), line: 1, quote: "x".repeat(190) + " " + aws + " " + "y".repeat(50) }],
    red_flags: [{ flag: "z".repeat(300), evidence: [] }] }] }));
  const f = JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"))[11];
  for (const t of [f.evidence[0].file, f.evidence[0].quote, f.red_flags[0].flag]) {
    assert.equal(t.length, 200);
    assert.ok(t.endsWith("…"));
  }
  assert.ok(!f.evidence[0].quote.includes("AKIA"), "no part of the secret survives the cut");
});

const afButtons = (p) => [...p.d.querySelectorAll("#afChips .chip")];
const afChip = (p, start) => afButtons(p).find((b) => b.textContent.startsWith(start));
const shown = (p) => [...p.d.querySelectorAll("#grid .pill")].map((x) => x.textContent.trim());
const finding = (id, result) => ({ id, result, evidence: [], red_flags: [], note: "n" });

test("the agent finding filter stays hidden until a finding is imported", () => {
  const p = loadPage();
  assert.equal(p.d.getElementById("afRow").hidden, true);
  importWith(p, JSON.stringify({ findings: [finding(11, "partial")] }));
  assert.equal(p.d.getElementById("afRow").hidden, false);
});

test("the agent finding filter offers chips with counts and narrows the grid", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [finding(11, "partial"), finding(12, "partial"), finding(14, "found")] }));
  assert.deepEqual(afButtons(p).map((b) => b.textContent), ["All", "With findings (3)", "Found (1)", "Partial (2)", `No finding yet (${content.concerns.length - 3})`]);
  p.click(afChip(p, "With findings"));
  assert.equal(shown(p).length, 3);
  p.click(afChip(p, "Partial"));
  assert.equal(shown(p).length, 2);
  assert.equal(afChip(p, "Partial").getAttribute("aria-pressed"), "true");
  p.click(afChip(p, "No finding yet"));
  assert.equal(shown(p).length, content.concerns.length - 3);
  p.click(afChip(p, "All"));
  assert.equal(shown(p).length, content.concerns.length);
});

test("the agent finding filter combines with the other filters and with search", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [finding(11, "partial"), finding(12, "found")] }));
  p.click(afChip(p, "With findings"));
  p.click(p.d.querySelector('#stChips .chip:nth-child(3)'));
  assert.equal(shown(p).length, 0, "no concern is both decided and has a finding yet");
  p.click(p.d.querySelector('#stChips .chip:nth-child(1)'));
  p.d.getElementById("q").value = "timeouts";
  p.d.getElementById("q").dispatchEvent(new p.w.Event("input", { bubbles: true }));
  assert.deepEqual(shown(p).length, 1);
});

test("the agent finding filter resets when findings are cleared or a related concern is followed", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [finding(11, "partial")] }));
  p.click(afChip(p, "Partial"));
  assert.equal(shown(p).length, 1);
  p.click(p.d.getElementById("agClear"));
  assert.equal(p.d.getElementById("afRow").hidden, true);
  assert.equal(shown(p).length, content.concerns.length, "back to every concern");
  importWith(p, JSON.stringify({ findings: [finding(11, "partial")] }));
  p.click(afChip(p, "Partial"));
  p.click(p.pill("Timeouts"));
  p.click(p.d.querySelector("#detail .rel .pill"));
  assert.equal(afChip(p, "All").getAttribute("aria-pressed"), "true");
});

test("a chip whose concerns are gone falls back to All after a re-import", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [finding(11, "partial"), finding(12, "found")] }));
  p.click(afChip(p, "Partial"));
  importWith(p, JSON.stringify({ findings: [finding(11, "found")] }));
  assert.equal(afChip(p, "Partial"), undefined);
  assert.equal(afChip(p, "All").getAttribute("aria-pressed"), "true");
});

test("after an import, a button shows only the concerns that have findings", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [finding(11, "partial"), finding(12, "found")] }));
  assert.match(p.d.getElementById("agSum").textContent, /Imported 2 findings/);
  p.click(p.d.querySelector("#agSum button"));
  assert.equal(shown(p).length, 2);
  assert.equal(afChip(p, "With findings").getAttribute("aria-pressed"), "true");
  assert.deepEqual(p.errors, []);
});

// Saving, loading, the report and remembering findings.
const tick = () => new Promise((r) => setTimeout(r, 40));
function capture(p) {
  const got = [];
  p.w.Blob = function (parts, o) { this.text = parts.join(""); this.type = o.type; };
  p.w.URL.createObjectURL = (b) => { got.push(b); return "blob:x"; };
  p.w.URL.revokeObjectURL = () => {};
  p.w.HTMLAnchorElement.prototype.click = function () { got[got.length - 1].name = this.download; };
  return got;
}
async function loadFile(p, text) {
  const input = p.d.getElementById("svIn");
  Object.defineProperty(input, "files", { value: [new p.w.File([text], "review.json")], configurable: true });
  input.dispatchEvent(new p.w.Event("change", { bubbles: true }));
  for (let i = 0; i < 50 && !p.d.getElementById("svMsg").textContent && !p.d.getElementById("svErr").textContent; i++) await tick();
}
const svText = (p, id) => p.d.getElementById(id).textContent;
const svFileOf = (findings = {}, review = {}, extra = {}) => JSON.stringify({ format: "prc-review", version: 1, saved: "2026-11-01T10:00:00.000Z", review, findings, ...extra });
const fnd = (note = "n") => ({ result: "partial", evidence: [], red_flags: [], note });
const check = (p, on) => { const b = p.d.getElementById("svRem"); b.checked = on; b.dispatchEvent(new p.w.Event("change", { bubbles: true })); return b; };

test("the save block is its own card after Review progress and the privacy note mentions it", () => {
  const p = loadPage();
  const box = p.d.querySelector("section#svBox");
  assert.ok(box, "its own section");
  assert.equal(box.previousElementSibling.className, "prog", "directly after Review progress");
  assert.equal(box.querySelector("h3").textContent, "Save your review");
  for (const id of ["svFile", "svLoad", "svReport", "svRem"]) assert.ok(box.querySelector("#" + id), id);
  assert.equal(p.d.getElementById("svRem").checked, false, "remembering is off by default");
  assert.match(p.d.getElementById("agentPanel").textContent, /unless you save a review file or choose to remember them/);
});

test("Save review file has nothing to save at first, then downloads marks and findings", () => {
  const p = loadPage();
  const got = capture(p);
  p.click(p.d.getElementById("svFile"));
  assert.equal(got.length, 0);
  assert.match(svText(p, "svMsg"), /Nothing to save yet/);
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "n" }] }));
  p.click(p.pill("Retries"));
  p.click(p.d.querySelector('.sb[data-st="decided"]'));
  p.click(p.d.getElementById("svFile"));
  assert.equal(got.length, 1);
  assert.match(got[0].name, /^prc-review-\d{4}-\d{2}-\d{2}\.json$/);
  assert.equal(got[0].type, "application/json");
  const file = JSON.parse(got[0].text);
  assert.equal(file.format, "prc-review");
  assert.equal(file.version, 1);
  assert.deepEqual(file.review, { 12: "decided" });
  assert.deepEqual(Object.keys(file.findings), ["11"]);
  assert.match(svText(p, "svMsg"), /1 finding and 1 mark/);
});

test("a saved review loads into a fresh page with its marks and findings", async () => {
  const a = loadPage();
  const got = capture(a);
  importWith(a, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [{ file: "a.ts", line: 3, quote: "fetch(url)" }], red_flags: [], note: "Gaps:\n- no timeout" }] }));
  a.click(a.pill("Retries"));
  a.click(a.d.querySelector('.sb[data-st="deferred"]'));
  a.click(a.d.getElementById("svFile"));
  const b = loadPage();
  await loadFile(b, got[0].text);
  assert.equal(svText(b, "svErr"), "");
  assert.match(svText(b, "svMsg"), /Loaded 1 finding and 1 mark from a review saved on \d{4}-\d{2}-\d{2}\./);
  assert.deepEqual(JSON.parse(b.w.localStorage.getItem("prc.reviewStatus")), { 12: "deferred" });
  b.click(b.pill("Timeouts"));
  assert.match(b.d.querySelector("#detail .finding").textContent, /no timeout/);
  assert.match(b.d.getElementById("progText").textContent, /^1 of /);
  assert.deepEqual(b.errors, []);
});

test("loading a file cleans it like a pasted reply and ignores what does not match", async () => {
  const p = loadPage();
  const aws = "AKIA" + "ABCDEFGHIJKLMNOP";
  const text = svFileOf(
    { 11: fnd("Key " + aws + " <img src=x onerror=alert(1)>"), 999: fnd(), 12: { result: "bogus" } },
    { 12: "decided", 13: "constructor", 9999: "decided" },
  );
  await loadFile(p, text);
  assert.match(svText(p, "svMsg"), /Loaded 1 finding and 1 mark/);
  assert.match(svText(p, "svMsg"), /Ignored 4 entries/);
  const stored = JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"));
  assert.ok(!stored[11].note.includes(aws), "secret masked");
  p.click(p.pill("Timeouts"));
  assert.equal(p.d.querySelector("#detail .finding img"), null, "rendered as text");
});

test("loading rejects files that are not a saved review", async () => {
  for (const [text, re] of [
    ["not json", /could not be read/],
    [JSON.stringify({ hello: 1 }), /not a saved review/],
    [svFileOf({}, {}, { version: 2 }), /newer version/],
    [svFileOf({}, {}), /no review marks or findings/],
  ]) {
    const p = loadPage();
    await loadFile(p, text);
    assert.match(svText(p, "svErr"), re);
    assert.equal(p.w.localStorage.getItem("prc.reviewStatus"), null, "nothing was changed");
  }
});

test("loading asks before replacing what is there and keeps it when declined", async () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "found", evidence: [], red_flags: [], note: "mine" }] }));
  let asked = "";
  p.w.confirm = (m) => { asked = m; return false; };
  await loadFile(p, svFileOf({ 12: fnd("theirs") }));
  assert.match(asked, /Replace your current 0 marks and 1 finding with the ones in this file\?/);
  assert.deepEqual(Object.keys(JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"))), ["11"]);
  p.w.confirm = () => true;
  await loadFile(p, svFileOf({ 12: fnd("theirs") }));
  assert.deepEqual(Object.keys(JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"))), ["12"]);
});

test("the report lists every concern, a short list of what is unreviewed and the findings as safe Markdown", () => {
  const p = loadPage();
  const got = capture(p);
  const note = "Coverage:\n- 3 services\nGaps:\n- <b>no</b> timeout [x](javascript:alert(1)) `tick`\nSearched: bcrypt";
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [{ file: "src/a`b.ts", line: 3, quote: "x_y <script>" }],
    red_flags: [{ flag: "Calls with no timeout", evidence: [{ file: "a.ts", line: 1, quote: "q" }] }], note, recommendation: "Set a *timeout*." }] }));
  p.click(p.pill("Retries"));
  p.click(p.d.querySelector('.sb[data-st="decided"]'));
  p.click(p.d.getElementById("svReport"));
  const md = got[0].text;
  assert.match(got[0].name, /^prc-report-\d{4}-\d{2}-\d{2}\.md$/);
  assert.equal((md.match(/^### \d+\. /gm) || []).length, content.concerns.length, "every concern");
  assert.match(md, /^## Summary/m);
  assert.match(md, /- Reviewed: 1 of \d+ \(1 decided, 0 deferred, 0 missing\)/);
  assert.match(md, /- Agent findings: 1 \(1 partial\)/);
  const at = md.indexOf("## Still to review");
  const still = md.slice(at, md.indexOf("\n## ", at + 5));
  assert.ok(still.includes("Timeouts") && !still.includes("Retries"), "unreviewed listed, marked concern left out");
  assert.match(md, /### 12\. Retries\n\n- Status: Decided/);
  assert.match(md, /### 11\. Timeouts\n\n- Status: Not reviewed\n- Agent result: Partial/);
  assert.ok(md.includes("`src/a'b.ts:3`"), "backtick removed from a code span");
  assert.ok(md.includes("\\<b\\>no\\</b\\>") && md.includes("\\[x\\]") && md.includes("x\\_y"), "markup characters escaped");
  assert.ok(!/<b>|<script>/.test(md), "no raw markup");
  assert.match(md, /\*\*Suggested fix\*\*[^\n]*\n\nSet a \\\*timeout\\\*\./);
  assert.ok(md.endsWith("\n") && !md.endsWith("\n\n"));
});

test("remember keeps findings for 30 days, brings them back on load, and is turned off with the checkbox", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "n" }] }));
  assert.equal(p.w.localStorage.getItem("prc.rememberedFindings"), null, "off by default");
  check(p, true);
  const rem = JSON.parse(p.w.localStorage.getItem("prc.rememberedFindings"));
  assert.ok(Math.abs(rem.expires - rem.saved - 30 * 864e5) < 1000);
  assert.deepEqual(Object.keys(rem.findings), ["11"]);
  assert.match(svText(p, "svRemNote"), /^Remembered until \d{4}-\d{2}-\d{2}\.$/);
  importWith(p, JSON.stringify({ findings: [{ id: 12, result: "found", evidence: [], red_flags: [], note: "n" }] }));
  assert.deepEqual(Object.keys(JSON.parse(p.w.localStorage.getItem("prc.rememberedFindings")).findings).sort(), ["11", "12"], "later imports are kept too");
  const again = loadPage({ storage: { "prc.rememberedFindings": p.w.localStorage.getItem("prc.rememberedFindings") } });
  assert.equal(again.d.getElementById("svRem").checked, true);
  assert.equal(again.d.querySelectorAll("#grid .pill .ag").length, 2, "findings are back with no session");
  check(p, false);
  assert.equal(p.w.localStorage.getItem("prc.rememberedFindings"), null);
});

test("remember asks first, ignores an expired copy, cleans what it reads and goes with Clear findings", () => {
  const p = loadPage();
  p.w.confirm = () => false;
  const box = check(p, true);
  assert.equal(box.checked, false);
  assert.equal(p.w.localStorage.getItem("prc.rememberedFindings"), null);

  const expired = loadPage({ storage: { "prc.rememberedFindings": JSON.stringify({ saved: 1, expires: Date.now() - 1000, findings: { 11: fnd() } }) } });
  assert.equal(expired.d.querySelectorAll("#grid .pill .ag").length, 0);
  assert.equal(expired.w.localStorage.getItem("prc.rememberedFindings"), null, "expired copy removed");

  const aws = "AKIA" + "ABCDEFGHIJKLMNOP";
  const planted = loadPage({ storage: { "prc.rememberedFindings": JSON.stringify({ saved: 1, expires: Date.now() + 1e6, findings: { 11: fnd("Key " + aws), 999: fnd(), 12: { result: "bogus" } } }) } });
  assert.deepEqual(planted.errors, []);
  assert.equal(planted.d.querySelectorAll("#grid .pill .ag").length, 1);
  planted.click(planted.pill("Timeouts"));
  assert.ok(!planted.d.getElementById("detail").textContent.includes(aws));
  planted.click(planted.d.getElementById("agClear"));
  assert.equal(planted.w.localStorage.getItem("prc.rememberedFindings"), null, "Clear findings removes the remembered copy");
  assert.equal(planted.d.getElementById("svRem").checked, false);
});

test("after an import, the message offers to save the review", () => {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "n" }] }));
  const b = [...p.d.querySelectorAll("#agSum button")].map((x) => x.textContent);
  assert.deepEqual(b, ["Show concerns with findings", "Save your review"]);
  p.click(p.d.querySelectorAll("#agSum button")[1]);
  assert.deepEqual(p.errors, []);
});

test("a long note is cut at its last whole line, with a marker and no heading left alone", () => {
  const p = loadPage();
  const bullets = (n, w) => Array.from({ length: n }, (_, i) => "- " + String(i).padStart(2, "0") + " " + "b".repeat(w)).join("\n");
  const note = "Coverage:\n- ok\nGaps:\n" + bullets(8, 150) + "\nNeeds people:\n" + bullets(8, 150) + "\nStrengths:\n- last";
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note }] }));
  const kept = JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"))[11].note;
  assert.ok(kept.length <= 2000);
  const lines = kept.split("\n");
  assert.equal(lines[lines.length - 1], "\u2026 note shortened");
  for (const l of lines.slice(0, -1)) assert.ok(l === "Coverage:" || l === "Gaps:" || l === "Needs people:" || l === "- ok" || /^- \d\d b{150}$/.test(l), "whole lines only: " + l.slice(0, 20));
  assert.ok(!kept.includes("Strengths:"), "later sections are dropped whole");
  p.click(p.pill("Timeouts"));
  assert.match(p.d.querySelector("#detail .finding .nbody").textContent, /note shortened$/);

  const q = loadPage();
  importWith(q, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "Coverage:\n- ok\nGaps:\n- " + "c".repeat(2100) }] }));
  const k2 = JSON.parse(q.w.sessionStorage.getItem("prc.agentFindings"))[11].note;
  assert.ok(!/Gaps:$/.test(k2.split("\n").slice(-2)[0]) || k2.endsWith("note shortened"), "no dangling heading");
  const oneLine = loadPage();
  importWith(oneLine, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "d".repeat(2500) }] }));
  const k3 = JSON.parse(oneLine.w.sessionStorage.getItem("prc.agentFindings"))[11].note;
  assert.equal(k3.length, 2000);
  assert.ok(k3.endsWith("\u2026"), "a single huge line still ends with an ellipsis");
});

test("a finding keeps up to 8 evidence entries and a red flag up to 5", () => {
  const p = loadPage();
  const ev = (n) => ({ file: "f" + n + ".py", line: n, quote: "q" + n });
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", note: "n",
    evidence: Array.from({ length: 10 }, (_, i) => ev(i + 1)),
    red_flags: [{ flag: "Calls with no timeout", evidence: Array.from({ length: 7 }, (_, i) => ev(i + 1)) }] }] }));
  const f = JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"))[11];
  assert.equal(f.evidence.length, 8);
  assert.equal(f.red_flags[0].evidence.length, 5);
});

test("the copy prompt block sits above Go deeper and stays visible while it is closed", () => {
  const people = content.concerns.find((c) => c.agent_check.level === "people");
  for (const name of ["Timeouts", "Authentication and session management", people.name]) {
    const p = loadPage();
    p.click(p.pill(name));
    const det = p.d.querySelector("#detail details.deep");
    assert.equal(det.open, false, name + ": Go deeper starts closed");
    const run = p.d.querySelector("#detail .runbox");
    assert.ok(run, name + ": has the block");
    assert.equal(run.closest("details"), null, name + ": not inside Go deeper");
    assert.equal(det.previousElementSibling, run, name + ": directly above Go deeper");
    assert.match(run.querySelector("button").textContent, /^Copy Claude Code prompt for this concern$/);
    assert.match(run.textContent, /plan mode/);
    assert.equal(det.querySelector("button"), null, name + ": no copy button inside Go deeper");
    assert.equal([...det.querySelectorAll(".blk")].filter((b) => !b.textContent.trim()).length, 0, name + ": no empty block left behind");
  }
});

test("the paste box opens inside the always visible block, not inside Go deeper", () => {
  const p = loadPage();
  p.click(p.pill("Timeouts"));
  p.d.execCommand = () => true;
  p.click(copyButton(p));
  const box = p.d.getElementById("pasteIn");
  assert.ok(box);
  assert.ok(box.closest(".runbox"));
  assert.equal(box.closest("details"), null);
});

// Clear all review data.
function withData() {
  const p = loadPage();
  importWith(p, JSON.stringify({ findings: [{ id: 11, result: "partial", evidence: [], red_flags: [], note: "n" }, { id: 14, result: "found", evidence: [], red_flags: [], note: "n" }] }));
  p.click(p.pill("Retries"));
  p.click(p.d.querySelector('.sb[data-st="decided"]'));
  return p;
}
const clickId = (p, id) => p.click(p.d.getElementById(id));

test("Clear all review data sits in the Save your review card beside the older buttons, which stay", () => {
  const p = loadPage();
  assert.ok(p.d.querySelector("#svBox #svClearAll"));
  assert.ok(p.d.getElementById("resetBtn"), "Reset review stays");
  assert.ok(p.d.getElementById("agClear"), "Clear findings stays");
  assert.equal(p.d.getElementById("svConfirm").hidden, true);
});

test("Clear all says so when there is nothing to clear", () => {
  const p = loadPage();
  clickId(p, "svClearAll");
  assert.match(svText(p, "svMsg"), /Nothing to clear/);
  assert.equal(p.d.getElementById("svConfirm").hidden, true);
});

test("Clear all asks first with the counts and Cancel keeps everything", () => {
  const p = withData();
  clickId(p, "svClearAll");
  assert.equal(p.d.getElementById("svConfirm").hidden, false);
  assert.match(svText(p, "svConfirmT"), /^Clear 1 mark and 2 findings\? This cannot be undone\. Save a review file first/);
  assert.equal(p.d.activeElement.id, "svClrNo", "focus starts on the safe choice");
  clickId(p, "svClrNo");
  assert.equal(p.d.getElementById("svConfirm").hidden, true);
  assert.match(svText(p, "svMsg"), /Nothing was cleared/);
  assert.deepEqual(JSON.parse(p.w.localStorage.getItem("prc.reviewStatus")), { 12: "decided" });
  assert.equal(Object.keys(JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings"))).length, 2);
});

test("Clear without saving removes the marks, the findings and the remembered copy", () => {
  const p = withData();
  check(p, true);
  assert.ok(p.w.localStorage.getItem("prc.rememberedFindings"));
  clickId(p, "svClearAll");
  assert.match(svText(p, "svConfirmT"), /and the copy remembered in this browser\?/);
  clickId(p, "svClrGo");
  assert.deepEqual(JSON.parse(p.w.localStorage.getItem("prc.reviewStatus")), {});
  assert.deepEqual(JSON.parse(p.w.sessionStorage.getItem("prc.agentFindings")), {});
  assert.equal(p.w.localStorage.getItem("prc.rememberedFindings"), null);
  assert.equal(p.d.getElementById("svRem").checked, false);
  assert.equal(p.d.getElementById("afRow").hidden, true);
  assert.equal(p.d.querySelectorAll("#grid .pill .ag").length, 0);
  assert.match(p.d.getElementById("progText").textContent, /^0 of /);
  assert.match(svText(p, "svMsg"), /^Cleared 1 mark and 2 findings\.$/);
  assert.equal(p.d.getElementById("svConfirm").hidden, true);
  assert.deepEqual(p.errors, []);
  const again = loadPage({ storage: { "prc.reviewStatus": p.w.localStorage.getItem("prc.reviewStatus") } });
  assert.equal(again.d.querySelectorAll("#grid .pill .ag").length, 0, "nothing comes back on reload");
});

test("Save first downloads the review file and then clears everything", () => {
  const p = withData();
  const got = capture(p);
  clickId(p, "svClearAll");
  clickId(p, "svClrSave");
  assert.equal(got.length, 1);
  assert.match(got[0].name, /^prc-review-\d{4}-\d{2}-\d{2}\.json$/);
  const file = JSON.parse(got[0].text);
  assert.deepEqual(file.review, { 12: "decided" });
  assert.deepEqual(Object.keys(file.findings).sort(), ["11", "14"]);
  assert.deepEqual(JSON.parse(p.w.localStorage.getItem("prc.reviewStatus")), {});
  assert.match(svText(p, "svMsg"), /^Saved prc-review-\d{4}-\d{2}-\d{2}\.json, then cleared 1 mark and 2 findings\.$/);
});

test("Clear all removes a remembered copy even when no findings are on the page", () => {
  const p = loadPage();
  check(p, true);
  assert.ok(p.w.localStorage.getItem("prc.rememberedFindings"));
  clickId(p, "svClearAll");
  assert.match(svText(p, "svConfirmT"), /^Clear 0 marks and 0 findings, and the copy remembered/);
  clickId(p, "svClrGo");
  assert.equal(p.w.localStorage.getItem("prc.rememberedFindings"), null);
});
