# Contributing

Thank you for helping improve the checklist. Wrong advice on an architecture checklist does real harm, so content changes get more scrutiny than code changes.

## Ways to help

- **Correct a concern.** Open a "Content correction" issue, or send a pull request.
- **Propose a concern.** Open a "Propose a new concern" issue first so the scope can be agreed.
- **Improve the page or tooling.** Pull requests are welcome.
- **Review content.** See [docs/REVIEW_PROCESS.md](docs/REVIEW_PROCESS.md).

## Workflow

1. Fork the repository and create a branch.
2. Make your change. Content lives in `content/concerns/`. Never edit `dist/`.
3. Run `npm ci` once, then `npm run check`. It must pass.
4. Open a pull request using the template.

Use short, imperative commit messages, for example `Clarify retry budget in retries`.

## Content rules

- Follow [docs/CONTENT_STYLE_GUIDE.md](docs/CONTENT_STYLE_GUIDE.md). `npm run validate` enforces the mechanical rules.
- Keep the text vendor neutral. Name tools only as examples.
- Back a factual change with a source or direct experience, and say which in the pull request.
- Ids are permanent. Never renumber or reuse one. To retire a concern, open an issue.
- Content changes need a second technical reviewer before they are merged.

## Code rules

- Keep the output a single self-contained file with no external requests.
- Keep the page working without a build step at runtime and usable by keyboard.
- Add or update a test for any behavior you change.

## Conduct

Be respectful and assume good faith. Disagree about the content, not the person.
