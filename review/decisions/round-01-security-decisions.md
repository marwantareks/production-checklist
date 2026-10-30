# Round 1 decision record: Security

**Status:** agent-reviewed and owner-approved. **Human expert review: pending.**
**Date:** 2026-10-29
**Scope:** concerns 67 to 80 (14 concerns) in the Security category.

## Review log row

| Category | Concerns | Date | Agent reviewers | Owner approval | Expert review | Status |
|---|---|---|---|---|---|---|
| Security | 67 to 80 | 2026-10-29 | Gemini (3 replies), Claude Opus 5.5 (1 reply) | Marwan Tarek | Pending | Signed off, expert review pending |

Nothing has been applied to the repository. All edits below are applied once, after all rounds are done.

## Decisions

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Hints that are descriptions | Add a `look_for` field | Some patterns, such as a query inside a loop, can only be described. Searching for the sentence finds nothing. |
| 2 | Evidence to request on partial concerns | Allow it on partial and code concerns, optional | A concern can be partly visible in the repo and still need people. Partial concerns are 42 of 99. |
| 3 | Overlapping concerns | Split 69, 70, 71 and 73. Rename 70 to "JWT signing keys and validation" | One owner for each check, so a review does not ask the same question twice. |
| 4 | Agent prompt changes | Accept P1 to P5 | Safety fixes (secrets, no running code), accuracy (not_found), and the missing results (not_applicable, red flags). |
| 5 | Claude Code wording | Claude Code first, with one wording tweak | Keeps Claude Code as the main target without giving wrong instructions to other agents. |
| 6 | New concerns, "add now" | Add all five | Each fills a top OWASP category with no home in the list. |
| 7 | New concerns, "consider" | Add threat modeling and data classification and privacy. Fold the other two in | Those two are architect-owned decisions. Patching and hardening already have a home. |
| 8 | Content edits | Accept all 61 as a batch | Each has an agent source and a stated reason, and passes validation. |
| 9 | Round status | Sign off now, expert review pending | The new content needs its own review round, and the expert review is planned for the end. |

## Content edits accepted (61)

| Concern | Name | Edits |
|---|---|---|
| 67 | Secrets management | 5 |
| 68 | IAM | 4 |
| 69 | OAuth | 6 |
| 70 | JWT signing keys and validation (renamed) | 7 |
| 71 | TLS | 6 |
| 72 | Encryption at rest | 4 |
| 73 | Encryption in transit | 3 |
| 74 | WAF | 4 |
| 75 | DDoS protection | 3 |
| 76 | CORS | 5 |
| 77 | CSRF | 3 |
| 78 | SQL injection | 3 |
| 79 | XSS | 4 |
| 80 | SSRF | 4 |

The full wording of every edit is in `round-01-security-triage.md`, section 4.

## Work for the repo stage

**Schema and validator**
- Add optional `look_for` under `agent_check` (decision 1).
- Allow optional `evidence_to_request` on code and partial concerns (decision 2).
- Raise the search hint cap from 15 to 20.
- Warn when a hint reads like a sentence.
- Add the `not_applicable` result to the agent findings schema, and an optional `red_flags` array per finding (decision 4).

**Prompt (`src/lib/prompt.js`)**
- Secret handling in quotes and notes, no running or network access, `not_found` only where the control would be configured in the repo, `not_applicable`, `red_flags`, escaping, and the example using an id in scope (P1 to P5).
- Open with "You are a coding agent, for example Claude Code", and "Use plan mode in Claude Code, or your tool's read-only mode" (decision 5).
- Show `look_for` items as descriptions, not exact text.

**Page**
- A fourth review status, "Not applicable", excluded from the progress denominator.
- Show `red_flags` and `not_applicable` findings.
- Mask likely secrets when findings are imported.
- Show `look_for` and evidence to request on partial concerns.

**Content**
- Apply the 61 edits. Rename concern 70 (id stays 70, file renamed).
- Move the 14 descriptive hints to `look_for`: concerns 11, 27, 39, 43, 59, 68, 73, 78, 107, 108.
- Concern 75: change to partial, add hints (for example aws_shield_protection, cloudflare, rate_limit), keep its evidence list.
- Draft seven new concerns (below) and send them through review before they merge.
- Fold patch timelines into the supply chain concern, and container hardening into 8 Kubernetes.

**Docs**
- Add a review log to the repo with one row per category, starting with the row above.
- Keep this record in `review/decisions/`.

## New concerns to draft (7)

| Concern | Proposed ownership | Proposed check level | Notes |
|---|---|---|---|
| Application authorization | own | partial | Object-level and function-level checks, deny by default. Narrow concern 68 to infrastructure and workload identity. |
| Authentication and session management | own | partial | Password hashing, phishing-resistant MFA, session expiry, cookie flags. Covers password storage. |
| Software supply chain security | guardrail | partial | Provenance, signed artifacts, SBOMs, pinned pipeline steps, plus patch timelines. Links to 108 and 6. |
| Other injection and unsafe deserialization | guardrail | code | Command, NoSQL, template, LDAP, path traversal, deserialization. |
| Security logging and audit trails | guardrail | partial | Tamper-resistant records of login, access and admin events. Links to 59. |
| Threat modeling | own | people | Trust boundaries and abuse cases before build. |
| Data classification and privacy | own | people | Which data is personal or regulated, and what that implies for encryption, retention, residency and logging. |

With these the checklist grows from 99 to 106 concerns. They have not been reviewed by anyone and are marked unreviewed until they pass a review round.

## Held out (revisit at final sign-off)

Security headers, security testing in the pipeline, file upload handling, multi-tenant isolation, security incident response, AI and LLM security.

## Open items

- Human expert review of the security category.
- Review round for the seven new concerns.
- Sources cited by an agent that I have not opened (listed in section 5 of the triage). Open any you plan to cite.
- Decision 4 and 5 code changes need tests before the next real use of agent mode.
