# Changelog

All notable changes are listed here. Dates use the year and month.

## 0.1.0 (October 2026)

- First repository release.
- 115 concerns in 10 categories, stored as one YAML file each. 17 were added after the first drafts and 1 was retired, after eight rounds of two-reviewer AI review (658 edits accepted).
- Browse mode with review status (decided, deferred, missing, not applicable), progress that leaves out concerns marked not applicable, filters and related concerns.
- Agent review mode with generated Claude Code prompts, a downloadable skill and import of structured findings, including red flags, a not applicable result and masking of anything that looks like a secret.
- Concern fields: `applies_when`, `look_for` and evidence to request on partial concerns. A validator that rejects generic and sentence-like search hints and records retired ids.
- Build, validation, review pack export, a single-message review prompt builder and review report scripts.
- Review log, decision records for every round and a ranked expert review plan. Human expert review is pending.
- Content, page and browser layout tests.
- Agent findings can carry an optional `recommendation` (up to 600 characters) for `partial` and `not_found` results. The prompt asks for it as advice based on the cited evidence, and the page masks it, ignores it for other results and shows it as plain text under "Suggested fix".
- An AI disclaimer in agent review mode (above the copy button), in the footer and as a line in every generated prompt: written with AI, not yet expert reviewed, review the prompts and their outputs, use at your own responsibility.
- Plan mode is now stated clearly in agent review mode: a callout above the copy button, a reminder after copying, a note beside the per-concern copy button, a note in the skill step, and an opening line in the prompt itself.
- Plainer wording in agent review mode: a short intro, a note on the paste step, a clearer placeholder and friendlier import errors.
- The agent prompt now tells the agent not to exit plan mode and to reply with the JSON instead, so the "Exit plan mode?" dialog no longer interrupts a review.
- Agent notes can now be up to 1200 characters (was 600). The prompt asks for notes in short sections (Coverage, Strengths, Gaps, Needs people, Searched) within that limit, and the page shows them as headings and bullets, masks text before cutting it and marks every cut with an ellipsis. Red flag evidence is now a bullet list under each flag, and finding text runs the full width.
- The agent check level now has a plain explanation under the badge, and the people evidence list has its own "Ask people for" heading beside "Agent check".
- After you copy the prompt for one concern, a paste box appears under the copy button so you can import the reply without going back to the agent review panel.
- All text in a concern's detail panel now runs the full width of the panel. Paragraphs were capped at 70 characters wide.
- An "Agent finding" filter row appears once findings are imported: All, With findings, one chip per result with its count, and No finding yet. It combines with the category, status and search filters, and the import message has a button that shows only the concerns with findings.
- Fixed the build, validate and review scripts doing nothing on Windows.
- Added a "What you get" section that leads with the benefits, widened the agent review text to the full box, and added build steps to the README.
- Reworked "What every concern includes" into "Inside every concern", covering definition, review question, trade-off, red flags, where it appears and the agent check.
- Security hardening: a Content Security Policy built from hashes of the inline code, a canonical URL, a no-referrer policy and a GitHub Pages deploy workflow that publishes the page with its SHA-256. Actions are pinned to commit SHAs, Pages permissions are limited to the deploy job and CI runs on Node 22.
- Fixed a stored review status such as "constructor" breaking the page after reload. Imported findings now mask credentials in file paths, quoted values with spaces and quoted JSON keys, cap the paste size and number of findings, and say when the browser cannot store them.
- The author name is fixed in the page template. `content/meta.yaml` now holds the canonical URL instead.
- The validator now rejects instruction-like text in concern content: hidden or direction control characters, line breaks, code fences, headings, chat role labels, "ignore the previous instructions" phrasing, and in prose web addresses, email addresses and commands. Added CODEOWNERS for content, page source, scripts, workflows and agent instructions.
- Imported agent findings are kept in sessionStorage instead of localStorage, and all storage keys start with `prc.`, so other pages on the same github.io origin cannot read the findings or collide with the keys.
- Added a "Watch the 30-second intro" card in the hero that opens the intro video in a dialog. The video and poster are optional files beside the page, loaded only on play. The card stays hidden if they are missing, so the single downloaded file still works. The CSP now allows same-origin images and media, and the Pages workflow publishes the two files.
