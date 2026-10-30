import { JSDOM } from "jsdom";
import { buildHtml } from "../scripts/build.mjs";

// Loads the built page in jsdom with the browser APIs the page needs stubbed.
export function loadPage({ html = buildHtml(), storage = {} } = {}) {
  const errors = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "http://localhost/",
    pretendToBeVisual: true,
    beforeParse(w) {
      w.Element.prototype.scrollIntoView = function () {};
      w.scrollTo = function () {};
      w.matchMedia = () => ({ matches: false });
      w.confirm = () => true;
      for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
      w.addEventListener("error", (e) => errors.push(e.message));
    },
  });
  const w = dom.window;
  const d = w.document;
  return {
    w,
    d,
    errors,
    pill: (name) => [...d.querySelectorAll("#grid .pill")].find((p) => p.textContent.trim().startsWith(name)),
    click: (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })),
  };
}
