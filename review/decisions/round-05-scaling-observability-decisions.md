# Round 5 decision record: Scaling and infrastructure, and Observability and operations

**Status:** agent-reviewed and owner-approved. **Human expert review: pending**, with concerns 88 and 104 added to the recovery expert's review set.
**Date:** 2026-10-29
**Scope:** concerns 8, 9, 45 to 47, 88 to 90 and 104 (scaling and infrastructure), and 58 to 66 (observability and operations). 18 concerns.

## Review log rows

| Category | Concerns | Date | Agent reviewers | Owner approval | Expert review | Status |
|---|---|---|---|---|---|---|
| Scaling and infrastructure | 8, 9, 45 to 47, 88 to 90, 104 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete) | Marwan Tarek | Pending, for 88 and 104 | Signed off, expert review pending |
| Observability and operations | 58 to 66 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete, via a standalone prompt) | Marwan Tarek | Not required | Signed off |

Nothing has been applied to the repository. All edits are applied once, after all rounds are done. The running list of repo work is in `repo-stage-backlog.md`.

## Decisions

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Prompt changes P24 to P29 | Accept all six | Closes three leak paths (state files and cluster tools, personal data, webhook URLs) and fixes the not_applicable, found-versus-partial and example issues. |
| 2 | Check level changes | Accept all five: 8, 59 and 60 from code to partial; 63 and 88 from people to partial | Each level now matches what an agent can confirm from the repository. |
| 3 | New concerns and folds | Fold the rest, and add "Capacity planning and load testing" (own, partial) | Four scaling and cost concerns assume load tests exist and nothing asks whether they are done. Environment configuration management is revisited in round 7. |
| 4 | Content edits | Accept all 104 as a batch | Each has an agent source and a reason, passes validation, and the SQS and probe claims were checked. |
| 5 | Round status | Sign off now, expert review pending, adding 88 and 104 to the expert set | 104 (destroy protection, state secrets) and 88 (removing failover capacity) are the two recovery-related concerns. |

## Content edits accepted (104)

| Concern | Name | Edits |
|---|---|---|
| 8 | Kubernetes | 9 |
| 9 | Service discovery | 5 |
| 45 | Autoscaling | 6 |
| 46 | Horizontal scaling | 5 |
| 47 | Vertical scaling | 3 |
| 58 | Monitoring | 4 |
| 59 | Logging | 9 |
| 60 | Distributed tracing | 6 |
| 61 | Metrics | 6 |
| 62 | Alerts | 7 |
| 63 | SLOs | 5 |
| 64 | SLIs | 4 |
| 65 | Error budgets | 5 |
| 66 | Observability | 6 |
| 88 | Cost optimization | 7 |
| 89 | Cold starts | 5 |
| 90 | Serverless limits | 5 |
| 104 | Infrastructure as code | 7 |

The full wording of every edit is in `round-05-scaling-observability-triage.md`, section 4.

## Prompt changes accepted

- **P24:** show each concern's Applies when sentence in the generated prompt, and use `not_applicable` when no files for the technology exist after searching all hints, listing the searches.
- **P25:** never run terraform, pulumi, cdk, kubectl, helm or cloud CLIs. If a state file is committed, report its path only and do not open it.
- **P26:** never quote personal data. Do not open committed log files or data exports beyond confirming they exist, and report only their path.
- **P27:** treat webhook URLs, integration keys and routing keys as secrets. Quote only the key name and write "secret value redacted" in place of the URL.
- **P28:** judge `found` or `partial` only on the practices the repository can show, and list the others in the note as needing people evidence.
- **P29:** show the generated example finding with an empty `red_flags` array, and describe the entry shape in one line.

## Applies-when sentences proposed (for the new field)

- 8 Kubernetes: applies when the system runs on Kubernetes or a managed Kubernetes service.
- 60 Distributed tracing: applies when requests cross more than one service, queue or background job.
- 89 Cold starts: applies when the system uses serverless functions or containers that scale to zero.
- 90 Serverless limits: applies when the system uses serverless functions or other platforms with fixed execution limits.

## Claims checked against documentation this round

- AWS Lambda documentation on SQS event sources: the queue visibility timeout should be at least six times the function timeout, plus the batching window, and the function timeout cannot exceed it (90).
- Liveness probes (8): several independent guides agree a probe should check only the process and slow starts need a startup probe. These are secondary sources, and the primary Kubernetes page has not been opened.

## New concern to draft (1)

| Concern | Proposed ownership | Proposed check level | Notes |
|---|---|---|---|
| Capacity planning and load testing | own | partial | Peak load modelled and tested end to end, with headroom. Hints for load test tools (k6, Locust, Gatling, JMeter, Artillery) and evidence of the last load test. Link from 45, 46, 47, 88 and 92. |

Folded into existing concerns: graceful shutdown (8 and 45 in the edits, 54 in round 7), cloud quotas and limits (45 in the edits, 90 and 83 to add), container image security (8 and the software supply chain concern), audit logging (the security logging and audit trails concern and 59), telemetry pipeline and cost (66 and 59), dependency and third-party monitoring (58 and the third-party dependency resilience concern), synthetic monitoring (58), continuous profiling (a hint in 66). Held out: incident response, on-call and incident management, which you removed earlier as organizational. Revisit in round 7: environment configuration management.

Total plan so far: 99 original, minus 1 retired, plus 15 new, equals 113 concerns.

## Process lesson

The two-message reply protocol worked for the first message and failed on the second, in both agents, twice. A standalone prompt for the second half worked at once. From round 6, large rounds are split into separate prompts from the start.

## Open items

- Human expert review of security, databases, resilience, concerns 18, 19, 20 and 39 from round 4, and concerns 88 and 104 from this round.
- Second opinion on 84, 85, 86, 87, 95 and 96 (round 3 single-reviewer gap).
- Review round for the 15 new concerns.
- Sources listed in the triage that I have not opened.
