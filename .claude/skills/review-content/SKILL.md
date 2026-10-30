---
name: review-content
description: Review or apply review findings for the Production Readiness Checklist content. Use when asked to review concerns, process reviewer findings, or turn a review file into edits.
---

# Review content

## To prepare a third-party review

1. Run `npm run review:prompt -- --ids <ids> --title "<scope>"` for a group of eight to eleven concerns. It writes a self-contained prompt to `review/out/`.
2. Paste it into a fresh session of two reviewers from a different model family than the drafter. A reviewer's clean list is weak evidence, so use two.
3. Save each reply as JSON in `review/out/`. Paste one prompt per message.

## To process findings

1. Run `npm run review:apply -- review/out/<file>.json`. Use `--min-severity major` for a first pass.
2. Open the report in `review/out/`. For each finding decide accept, edit or reject.
   - Accept an accuracy change only if it has a source or a second reviewer agrees.
   - Reject edits that add vendor bias, absolutes, or break `docs/CONTENT_STYLE_GUIDE.md`.
   - For `agent_prompt` findings, change `src/lib/prompt.js` and update the tests that check the prompt rules. Never remove a safety rule.
3. Check high-risk claims against the documentation before accepting an edit. Apply accepted edits to the YAML files in `content/concerns/`.
4. Run `npm run check`.
5. Summarize in the pull request what was accepted, edited and rejected, and why.

## To review a concern yourself

Check accuracy, completeness, clarity, consistency between red flags and good looks like, whether the review question can be answered from evidence, neutrality, search hint quality, and the ownership and check levels. Report problems with the evidence for them. Do not rewrite text that is fine.

Never apply a review finding automatically without a human decision on security, data consistency or recovery concerns.
