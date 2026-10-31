// Layout checks that need a real browser. Skipped when no Chromium is available.
// Set CHROMIUM_PATH to use a Chromium you already have, or run: npx playwright-core install chromium
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
import { buildHtml } from "../../scripts/build.mjs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prc-e2e-"));
const file = path.join(dir, "index.html");
fs.writeFileSync(file, buildHtml());
const url = "file://" + file;

let browser;
try {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
} catch (e) {
  console.warn("No Chromium available, skipping browser tests:", e.message.split("\n")[0]);
}
const skip = !browser && "no browser available";
const top = (page, sel) => page.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().top), sel);

test("section anchors place the heading near the top of the window", { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await page.click(".hero .btn >> text=Open the checklist");
  await page.waitForTimeout(1300);
  const t = await top(page, "#checklist .sh2");
  assert.ok(t >= 0 && t <= 40, `heading top was ${t}px`);
  await page.close();
});

test("a category card jumps to the checklist heading", { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await page.click(".ccard >> nth=2");
  await page.waitForTimeout(1300);
  const t = await top(page, "#checklist .sh2");
  assert.ok(t >= 0 && t <= 40, `heading top was ${t}px`);
  await page.close();
});

test("a related concern lands just below the sticky toolbar", { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await page.click("#grid .pill >> text=Circuit breakers");
  await page.click("#detail .rel .pill >> nth=0");
  await page.waitForTimeout(1300);
  const bar = await page.evaluate(() => Math.round(document.querySelector(".bar").getBoundingClientRect().height));
  const h = await top(page, ".sec:has(.pill[aria-expanded=true]) .sh");
  assert.ok(h >= bar && h <= bar + 80, `heading top ${h}px, toolbar ${bar}px`);
  await page.close();
});

test("the page has no horizontal overflow on a phone", { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await page.goto(url);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.click("#modeAgent");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.close();
});

test.after(async () => { if (browser) await browser.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("the page works under its own CSP and the CSP blocks injected script", { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
  await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => (window.__csp = (window.__csp || []).concat(e.violatedDirective))));
  await page.goto(url);
  await page.click(".pill >> nth=0");
  await page.click("#modeAgent");
  const dl = page.waitForEvent("download");
  await page.click("#agSkill");
  assert.equal((await dl).suggestedFilename(), "SKILL.md");
  await page.fill("#agIn", JSON.stringify({ findings: [{ id: 11, result: "found" }] }));
  await page.click("#agImport");
  assert.match(await page.textContent("#agSum"), /Imported 1 finding/);
  await page.evaluate(() => {
    const s = document.createElement("script");
    s.textContent = "window.__injected = true";
    document.body.appendChild(s);
  });
  assert.equal(await page.evaluate(() => window.__injected), undefined);
  await page.waitForFunction(() => (window.__csp || []).length > 0);
  const violations = await page.evaluate(() => window.__csp || []);
  assert.deepEqual(violations, ["script-src-elem"]);
  assert.deepEqual(problems.filter((p) => !/Content Security Policy/.test(p)), []);
  await page.close();
});
