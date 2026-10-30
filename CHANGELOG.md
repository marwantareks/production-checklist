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
