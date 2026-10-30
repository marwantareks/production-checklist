---
name: add-concern
description: Add a new concern to the Production Readiness Checklist, or substantially rewrite an existing one. Use when asked to add, create or rewrite a concern in content/concerns.
---

# Add or rewrite a concern

Follow these steps in order.

1. Read `docs/CONTENT_STYLE_GUIDE.md` and `docs/SCHEMA.md`. Look at two existing concerns in the same category for tone and length.
2. Choose the id. Take the highest existing `id` in `content/concerns/` and add one. Never reuse or renumber an id.
3. Choose the category from `content/categories.yaml` and an `order` that places it sensibly. Orders go in steps of 10. To insert between 20 and 30, use 25.
4. Copy `docs/concern-template.yaml` to `content/concerns/NNN-slug.yaml`. `NNN` is the id padded to three digits and the slug is the lowercase name with hyphens, for example `106-graceful-shutdown.yaml`. Remove the template comments.
5. Fill every field:
   - Write for a senior engineer who is not a specialist.
   - Make `red_flags` observable and `good_looks_like` verifiable.
   - Add `decide_between` only if the architect makes a real choice between named options.
   - Pick `ownership` and `agent_check.level` conservatively. If settings, approvals or runtime data decide the answer, the level is `partial` or `people`.
   - Use literal `search_hints` (4 to 20, no single common words, no sentences). Describe patterns with no exact text in `look_for`. Use `evidence_to_request` for `people`, and for the part of a `partial` concern a repository cannot show.
   - Add `applies_when` only if the concern does not apply to every system.
   - Check every `good_looks_like` item: could a team meet the wording and still be unsafe?
   - Choose two to four `related` ids that exist. Consider adding this id to the `related` list of the concerns it links to, if there is room.
6. Run `npm run validate` and fix every error in the content. Do not change the validator.
7. Run `npm run build` and `npm test`. Both must pass.
8. Add a line to `CHANGELOG.md`.
9. In the pull request description, state the sources or experience behind factual claims and ask for a human technical reviewer. Say clearly if any claim is uncertain.

Do not edit `dist/`.
