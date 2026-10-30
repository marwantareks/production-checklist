# Verification round decision record: new concerns and second opinion

**Status:** agent-reviewed and owner-approved. **Human expert review:** replaced by a ranked expert review plan, produced at the final step.
**Date:** 2026-10-30
**Scope:** the 17 new concerns (ids 109 to 125, reviewed in three prompts) and a second opinion on six round 3 concerns (84, 85, 86, 87, 95, 96).

## Review log rows

| Group | Concerns | Date | Agent reviewers | Owner approval | Status |
|---|---|---|---|---|---|
| New security concerns | 109 to 116 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete) | Marwan Tarek | Signed off |
| New data concerns | 117 to 120 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete) | Marwan Tarek | Signed off |
| New resilience, scaling and delivery concerns | 121 to 125 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete) | Marwan Tarek | Signed off |
| Second opinion on round 3 concerns | 84, 85, 86, 87, 95, 96 | 2026-10-29 | Gemini and Claude Opus 5.5 (the round 3 gap is now closed) | Marwan Tarek | Signed off |

Nothing has been applied to the repository. The drafts and every accepted edit are applied to a scratch copy that validates with zero errors and zero warnings.

## Decisions

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Prompt changes P41 to P48 | Accept all eight | Closes two leak paths (sensitive files and databases), fixes the not_applicable gap that would hide a tenant leak, and stops guessing about defaults and support dates. |
| 2 | Check level changes | Accept all five: 118 and 122 from code to partial, and 114, 115 and 123 from people to partial | Each level now matches what an agent can confirm from the repository. |
| 3 | New concerns | Add none. Security headers and security testing stay as post-release candidates | They are partly covered by 71, 76, 79, 6, 108, 111 and 112. The checklist stays at 115. |
| 4 | Content edits | Accept all 138 as a batch | Each has an agent source and a reason, passes validation, and the row-level security and Istio claims were checked. |
| 5 | Status and expert plan | Sign off now, and replace the growing expert list with a ranked plan | The set had grown to about 70 of 115 concerns, which no single expert can review. |

## Content edits accepted (138)

| Concern | Name | Edits |
|---|---|---|
| 84 | Backups | 6 |
| 85 | Failover | 7 |
| 86 | Multi-region deployment | 5 |
| 87 | Chaos engineering | 6 |
| 95 | Network partitions | 5 |
| 96 | Clock skew | 5 |
| 109 | Application authorization | 3 |
| 110 | Authentication and session management | 7 |
| 111 | Software supply chain security | 4 |
| 112 | Other injection and deserialization | 4 |
| 113 | Security logging and audit trails | 6 |
| 114 | Threat modeling | 5 |
| 115 | Data classification and privacy | 6 |
| 116 | Service-to-service authentication | 6 |
| 117 | Transaction isolation levels | 7 |
| 118 | Constraints, keys and integrity | 8 |
| 119 | Database maintenance and growth | 8 |
| 120 | Multi-tenant data isolation | 7 |
| 121 | Graceful degradation | 7 |
| 122 | Bulkheads and resource isolation | 7 |
| 123 | Third-party dependency resilience | 7 |
| 124 | Capacity planning and load testing | 6 |
| 125 | Environment configuration management | 6 |

The full wording of every edit is in `round-08-verification-triage.md`, section 4.

## Prompt changes accepted

- **P41:** treat password hashes, one-time password seeds, private keys and key files (.pem, .key, .p12, .pfx, .jks) as secrets, and database dumps and backup files (.sql, .dump, .bak, .bson, .archive) as data exports: report only the path. In environment and settings files, read key names only.
- **P42:** report an end-of-support red flag only when a file in the repository states the support date.
- **P43:** for injection and deserialization matches, trace the value back to a request, message, file or environment input, and report only when that path is shown.
- **P44:** when a red flag depends on a product default, identify the product from configuration or drivers and quote the evidence. Otherwise return cannot_determine.
- **P45:** prefer the latest schema snapshot over single migrations. ORM models create keys implicitly.
- **P46:** never connect to any database, including local ones, and never run SQL or database clients.
- **P47:** use not_applicable only with positive evidence that the Applies when condition fails, never from the absence of a search hit. Revises P37.
- **P48:** revises P36. For an empty file, use line 1 with an empty quote.
- **Still deferred (raised five times):** tagging each red flag and practice as (code) or (people).

## Applies-when changes

- 116 Service-to-service authentication: applies when the system has more than one service, or calls internal services or functions over a network.
- 120 Multi-tenant data isolation: broadened to include shared components such as logging, analytics, search or support tooling.
- 87 Chaos engineering: monitoring is a prerequisite to flag, not part of the condition.

## Claims checked against documentation this round

- PostgreSQL: superusers and roles with BYPASSRLS always bypass row security, and table owners normally do too unless FORCE ROW LEVEL SECURITY is set (120).
- Istio: an unset mTLS mode is treated as permissive, which accepts plain text and mTLS, and strict mode ensures connections that bypass the mesh are not possible (116).

## Final state of the checklist (scratch copy, all edits applied)

- 115 concerns in 10 categories: security 22, databases 20, resilience 15, delivery 12, scaling 10, observability 9, traffic 8, caching 8, messaging 6, concurrency 5.
- Check level: code 24, partial 81, people 10.
- Ownership: own 75, guardrail 40. The delegate value is no longer used by any concern.
- 19 concerns have an Applies when sentence. 43 have evidence to request.

## Post-release candidates (held out)

Security headers and content security policy, security testing in the pipeline, file upload handling, AI and LLM feature security, incident response and on-call, business logic abuse, scheduled jobs and batch reliability, encoding and collation and data types, delivery performance metrics.

## Open items

- Produce the ranked expert review plan (tiers: the three agreed categories first, then every other concern with a critical finding from both agents, then the rest).
- Update the repository once, from the scratch copy (see the backlog).
- Sources listed in the triage documents that I have not opened.
