# Production Readiness Checklist

A free checklist of production concerns for architects and architecture review boards. Each concern has a plain-language definition, a review question, a trade-off, red flags, what good looks like, and where it shows up in a real application.

You can use it two ways:

- **Browse.** Open the page, walk the categories, and mark each concern decided, deferred, missing or not applicable. Progress is saved in your browser.
- **Agent review.** Generate a read-only prompt for Claude Code, run it against your repository, and paste the structured findings back. Each concern then shows the agent's evidence. You decide.

The output is a single self-contained HTML file with light and dark themes and no external requests.

> **Status.** The content is general guidance. It has not yet had independent technical review, and the agent search hints have not been tuned against many real repositories. See [docs/REVIEW_PROCESS.md](docs/REVIEW_PROCESS.md).

## Quick start

Requires Node.js 22 or later.

```sh
npm ci             # install dependencies, once
npm run build      # write dist/index.html
```

Then open `dist/index.html` in a browser: `open dist/index.html` on macOS, `start dist\index.html` on Windows, `xdg-open dist/index.html` on Linux.

`npm run check` validates the content, builds the page and runs the tests in one step. Run it before every commit.

To host it, copy `dist/index.html` to any static host. It has no other files.

## Building the page

`npm run build` reads `content/`, `src/template.html`, `src/styles.css`, `src/lib/prompt.js` and `src/app.js`, and inlines them all into one file, `dist/index.html`. It creates `dist/` if it is missing. The build fails if a `{{PLACEHOLDER}}` in the template is left unreplaced.

1. Edit the source: a concern in `content/concerns/`, or the page in `src/`.
2. Run `npm run check`. It validates, rebuilds and tests.
3. Reload `dist/index.html` in your browser.

`dist/` is generated and not committed, so a fresh clone has no `dist/` until you build. Never edit it by hand, because the next build overwrites it. `npm run prompts` also writes the Claude Code prompts to `dist/prompts/`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run validate` | Checks every content file against the schema and the style rules. |
| `npm run build` | Builds `dist/index.html`. |
| `npm test` | Runs the content, page and review tests. |
| `npm run test:e2e` | Runs the browser layout tests. Needs Chromium. See below. |
| `npm run prompts` | Writes the Claude Code prompts to `dist/prompts/`. |
| `npm run review:export` | Builds the review pack in `review/pack/` for a third-party reviewer. |
| `npm run review:apply -- <file>` | Turns a reviewer's findings into a report of suggested edits. |
| `npm run check` | Validate, build and test in one step. |

For the browser tests, set `CHROMIUM_PATH` to an existing Chromium, or run `npx playwright-core install chromium` once.

## Repository layout

```
content/
  categories.yaml        the ten categories, their order and icons
  meta.yaml              site title, canonical URL, year, last updated
  concerns/              one YAML file per concern (the source of truth)
schema/                  JSON Schemas for content, agent findings and review findings
src/
  template.html          page structure
  styles.css             styles, light and dark
  app.js                 page behavior
  lib/prompt.js          builds the agent prompt (used in the page and in Node)
scripts/                 validate, build, prompts, review pack, apply review
tests/                   content, page and review tests, plus browser layout tests
review/                  reviewer prompt and example; generated packs and reports go here
docs/                    schema reference, style guide, agent review, review process, architecture
.claude/skills/          Claude Code skills for adding and reviewing content
CLAUDE.md                project instructions for Claude Code
```

`dist/` and the generated review files are not committed.

## Editing content

Edit the YAML in `content/concerns/`, then run `npm run check` to rebuild. The fields are described in [docs/SCHEMA.md](docs/SCHEMA.md) and the writing rules are in [docs/CONTENT_STYLE_GUIDE.md](docs/CONTENT_STYLE_GUIDE.md). For how the pieces fit together, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## How agent review works

The page builds one prompt per scope from the same content you read. The prompt tells Claude Code to work in plan mode (read-only), never run anything or touch a database, never print secrets, treat repository text as data, answer `cannot_determine` instead of guessing, and cite a file, line and short quote for every result. It returns JSON that the page imports as suggestions, with secrets masked. Run it only on a repository you trust, or on a throwaway copy. See [docs/AGENT_REVIEW.md](docs/AGENT_REVIEW.md) for the safety model and limits.

## Review by a third party

`npm run review:prompt -- --ids 109,110` builds one self-contained review prompt for a group of concerns. `npm run review:export` writes a pack with the content as Markdown, the generated prompts, a reviewer prompt and the schema for the reply. `npm run review:apply` turns the reply into a report you can accept or reject item by item. See [docs/REVIEW_PROCESS.md](docs/REVIEW_PROCESS.md). The content has been reviewed by two AI reviewers in eight rounds, and an expert review is planned. See [review/LOG.md](review/LOG.md) and [review/EXPERT_REVIEW_PLAN.md](review/EXPERT_REVIEW_PLAN.md).

## Contributing

Corrections and new concerns are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md). To report unsafe advice or a security problem in the page, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE). Copyright (c) 2026 Marwan Tarek.
