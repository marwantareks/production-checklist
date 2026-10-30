# Review log

Every concern was reviewed by two AI reviewers (Gemini and Claude Opus 5.5), in separate fresh sessions with the same prompt, and then walked through decision by decision by the author. **Human expert review is pending for every row.** The plan for it is in [EXPERT_REVIEW_PLAN.md](EXPERT_REVIEW_PLAN.md).

Nothing here is a claim of independent expert review. A row means two AI reviewers found and the author decided on the points in the linked records.

| Round | Scope | Concerns | Edits accepted | Decisions | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Security | 67 to 80 | 61 | [decisions](decisions/round-01-security-decisions.md), [triage](decisions/round-01-security-triage.md) | Set the review method and the first agent prompt rules. |
| 2 | Databases and data consistency | 25 to 38, 81, 82 | 56 | [decisions](decisions/round-02-databases-decisions.md), [triage](decisions/round-02-databases-triage.md) | |
| 3 | Resilience and fault tolerance | 10 to 14, 44, 83 to 87, 95, 96 | 57 | [decisions](decisions/round-03-resilience-decisions.md), [triage](decisions/round-03-resilience-triage.md) | Concern 13 retired and merged into 12. Gemini reviewed only half, so 84 to 87, 95 and 96 had one reviewer until round 8. |
| 4 | Messaging and concurrency | 15 to 20, 39 to 43 | 63 | [decisions](decisions/round-04-messaging-concurrency-decisions.md), [triage](decisions/round-04-messaging-concurrency-triage.md) | 41 renamed and made partial. |
| 5 | Scaling and observability | 8, 9, 45 to 47, 88 to 90, 104, 58 to 66 | 104 | [decisions](decisions/round-05-scaling-observability-decisions.md), [triage](decisions/round-05-scaling-observability-triage.md) | |
| 6 | Traffic and caching | 1 to 5, 22, 24, 101, 102, 2, 48 to 50, 91 to 94 | 94 | [decisions](decisions/round-06-traffic-caching-decisions.md), [triage](decisions/round-06-traffic-caching-triage.md) | |
| 7 | Build, deployment and release | 6, 51 to 57, 103, 107, 108 | 85 | [decisions](decisions/round-07-delivery-decisions.md), [triage](decisions/round-07-delivery-triage.md) | 108 renamed Dependency management. |
| 8 | Verification | 17 new concerns (109 to 125), and a second opinion on 84 to 87, 95, 96 | 138 | [decisions](decisions/round-08-verification-decisions.md), [triage](decisions/round-08-verification-triage.md) | New concerns drafted from rounds 1 to 7, each reviewed before inclusion. |

Total: 658 edits accepted across 8 rounds. 99 concerns at the start, 1 retired, 17 added, 115 now.

## Held out as post-release candidates

Security headers and content security policy, security testing in the pipeline, file upload handling, AI and LLM feature security, incident response and on-call, business logic abuse, scheduled jobs and batch reliability, encoding and collation and data types, delivery performance metrics.

## Sources agents cited that nobody has opened

Each triage document lists the sources a reviewer cited. Some were checked against documentation by the author during the rounds, and the triage says which. Open the rest before citing them anywhere.
