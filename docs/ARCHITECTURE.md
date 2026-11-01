# Architecture

## Goal

One self-contained HTML file that works offline, with the content kept in files that are easy to review and change.

## Pipeline

```
content/*.yaml ──┐
schema/*.json ───┤ npm run validate
                 │
content/*.yaml ──┼─► scripts/lib/model.mjs ─► scripts/build.mjs ─► dist/index.html
src/template.html┤        (loads and reshapes)        (inlines)
src/styles.css ──┤
src/lib/prompt.js┤
src/app.js ──────┘

content/*.yaml ─► scripts/lib/prompts.mjs ─► dist/prompts/, review/pack/prompts/
                  (same src/lib/prompt.js the page uses)
```

## Why this shape

- **YAML, one file per concern.** Small diffs, one owner per change, comments allowed, and readable multi-line text.
- **Schema plus a validator.** The schema checks structure. The validator checks what a schema cannot: unique ids, file names, links, and style rules.
- **One prompt builder.** `src/lib/prompt.js` is plain JavaScript with no DOM calls. It is inlined into the page and imported in Node, so the page and the exported prompts cannot drift apart.
- **No runtime dependencies in the page.** The build inlines everything. Opening the file needs nothing else.

## Page data

The build turns the YAML into the globals the page script reads: `C` (categories and items), `G` and `D` (guardrail and delegate ids; `D` is empty today), `X` (review question, trade-off, related), `DEEP` (detail), `CI` (category icons). `scripts/lib/model.mjs` owns that conversion.

## Browser storage

Keys start with `prc.` because every page on a github.io user site shares one origin.

- `prc.theme` (localStorage): light or dark.
- `prc.reviewStatus` (localStorage): concern id to decided, deferred, missing or na (not applicable).
- `prc.agentFindings` (sessionStorage, so it stays in the tab and is gone when it closes): imported agent findings, validated and truncated on the way in and again on load.
- `prc.rememberedFindings` (localStorage, only when the person turns on Remember): a copy of the findings with a 30 day expiry. It is read through the same cleaning as the session copy, is removed when it expires, when Remember is turned off and by Clear findings.

A review file (`prc-review`, version 1) is made by Save review file and holds the review marks and the findings. Loading it cleans every entry the way a pasted reply is cleaned, ignores ids the checklist does not have and asks before replacing what is on the page. The Markdown report lists every concern and escapes agent text so it cannot turn into markup.

## Changing things

- **Add a concern:** add a YAML file. See `.claude/skills/add-concern/SKILL.md`.
- **Add a category:** add an entry to `content/categories.yaml`. Pick an unused `hue` or reuse one, and supply an icon path.
- **Change the page:** edit `src/`. Keep placeholders such as `{{YEAR}}` intact. The build also fills `{{CSP}}` with a Content Security Policy made from hashes of the inline scripts and styles, so inline code must stay in plain `<script>` and `<style>` blocks, with no inline event handler or style attributes. The build fails if one is left unreplaced.
- **Change the prompt:** edit `src/lib/prompt.js` and the tests that check its rules.
