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
- Plainer wording in agent review mode: a short intro, a note on the paste step, a clearer placeholder and friendlier import errors.
- Fixed the build, validate and review scripts doing nothing on Windows.
- Added a "What you get" section that leads with the benefits, widened the agent review text to the full box, and added build steps to the README.
- Reworked "What every concern includes" into "Inside every concern", covering definition, review question, trade-off, red flags, where it appears and the agent check.
- Security hardening: a Content Security Policy built from hashes of the inline code, a canonical URL, a no-referrer policy and a GitHub Pages deploy workflow that publishes the page with its SHA-256. Actions are pinned to commit SHAs, Pages permissions are limited to the deploy job and CI runs on Node 22.
- Fixed a stored review status such as "constructor" breaking the page after reload. Imported findings now mask credentials in file paths, quoted values with spaces and quoted JSON keys, cap the paste size and number of findings, and say when the browser cannot store them.
- The author name is fixed in the page template. `content/meta.yaml` now holds the canonical URL instead.
- The validator now rejects instruction-like text in concern content: hidden or direction control characters, line breaks, code fences, headings, chat role labels, "ignore the previous instructions" phrasing, and in prose web addresses, email addresses and commands. Added CODEOWNERS for content, page source, scripts, workflows and agent instructions.
- Imported agent findings are kept in sessionStorage instead of localStorage, and all storage keys start with `prc.`, so other pages on the same github.io origin cannot read the findings or collide with the keys.
