# Round 6 decision record: Traffic, networking and APIs, and Caching and performance

**Status:** agent-reviewed and owner-approved. **Human expert review: pending**, with concerns 4, 22, 48, 49 and 101 added to the security expert's review set.
**Date:** 2026-10-29
**Scope:** concerns 1, 3, 4, 5, 22, 24, 101, 102 (traffic, networking and APIs) and 2, 48, 49, 50, 91 to 94 (caching and performance). 16 concerns, reviewed through two separate prompts.

## Review log rows

| Category | Concerns | Date | Agent reviewers | Owner approval | Expert review | Status |
|---|---|---|---|---|---|---|
| Traffic, networking and APIs | 1, 3, 4, 5, 22, 24, 101, 102 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete) | Marwan Tarek | Pending, for 4, 22 and 101 | Signed off, expert review pending |
| Caching and performance | 2, 48, 49, 50, 91 to 94 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete) | Marwan Tarek | Pending, for 48 and 49 | Signed off, expert review pending |

Nothing has been applied to the repository. All edits are applied once, after all rounds are done. The running list of repo work is in `repo-stage-backlog.md`.

## Decisions

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Prompt changes P30 to P34 | Accept P30, P32, P33, P34. Decline P31 (the ban on absence red flags) | P12a, P16 and P30 together meet P31's goal. A ban would also remove per-flag detail, because most red flags state an absence. |
| 2 | Check level changes | Accept all five: 2, 4, 22, 50 and 102 from code to partial | Each level now matches what an agent can confirm from the repository. |
| 3 | New concerns and folds | Fold the rest, and add "Service-to-service authentication" (own, partial) | Raised independently by both agents, an architect-level trust decision, and nothing owns east-west trust. Frontend performance stays folded into 91. |
| 4 | Content edits | Accept all 94 as a batch | Each has an agent source and a reason, passes validation, and the keep-alive and Redis claims were checked. |
| 5 | Round status | Sign off now, expert review pending, adding 4, 22, 48, 49 and 101 to the expert set | The five are attack surface: header spoofing and request smuggling, cross-site WebSocket hijacking, cache deception and poisoning, and SSRF. |

## Content edits accepted (94)

| Concern | Name | Edits |
|---|---|---|
| 1 | Rate limiting | 6 |
| 2 | Caching | 8 |
| 3 | Load balancing | 6 |
| 4 | Reverse proxies | 9 |
| 5 | API gateways | 4 |
| 22 | WebSockets | 6 |
| 24 | Server-sent events | 6 |
| 48 | CDN | 6 |
| 49 | Edge caching | 6 |
| 50 | Cache invalidation | 10 |
| 91 | Latency | 4 |
| 92 | Throughput | 5 |
| 93 | P99 latency | 4 |
| 94 | Tail latency | 3 |
| 101 | Webhooks | 5 |
| 102 | API versioning | 6 |

The full wording of every edit is in `round-06-traffic-caching-triage.md`, section 4.

## Prompt changes accepted

- **P30:** for a red flag that states an absence, evidence may be an empty array, and the note lists the searches and locations.
- **P32:** a red flag entry has the shape {"flag": "<text exactly as listed>", "evidence": [{"file": "...", "line": 1, "quote": "..."}]}.
- **P33:** the sampling rule names the cases it covers: practices that must hold on every endpoint, handler, client or write (rate limits, authentication, signature checks, timeouts). Sample the main ones, report found only if every one checked has it, and say how many were checked.
- **P34:** a hint match in unrelated code does not show the technology is used. Confirm with a handler, endpoint or client before judging the concern.
- **Declined (P31):** report a red flag only with positive evidence, and report missing controls through not_found or cannot_determine.

## Applies-when sentences proposed (for the new field)

- 22 WebSockets: applies when the system keeps WebSocket connections open to clients or other services.
- 24 Server-sent events: applies when the system streams events to clients with server-sent events.
- 101 Webhooks: applies when the system sends or receives webhooks.
- 48 CDN: applies when the system serves content to users spread across regions or must absorb traffic spikes at the edge.
- 49 Edge caching: applies when the system caches pages or API responses, not just static files, at a CDN or edge runtime.

## Claims checked against documentation this round

- AWS troubleshooting guidance: the backend keep-alive timeout must be greater than the load balancer's idle timeout (default 60 seconds on an ALB), or the balancer reuses a closed connection and returns intermittent 502 errors (3).
- Redis documentation: maxmemory defaults to unlimited on 64-bit systems, and the noeviction policy returns an error rather than storing new data once the limit is reached (2).

## New concern to draft (1)

| Concern | Proposed ownership | Proposed check level | Notes |
|---|---|---|---|
| Service-to-service authentication | own | partial | mTLS or workload identity between services, so a request that bypasses the gateway or carries a forged identity header is rejected. Hints: mTLS, SPIFFE, PeerAuthentication, AuthorizationPolicy, istio, linkerd, workload identity. Link from 5, 71, 72 and 73. |

Folded into existing concerns: load testing methodology (the round 5 capacity planning concern), egress control (101, 88 and SSRF in 80), timeout and keep-alive chains (3, 4, 11), load shedding (44), pagination and response size limits (26), API error format and contract validation (102 and the injection concern), DNS behavior and global traffic steering (9, 85, 86), compression (48 and 4), hot keys (2 and 30), profiling (a hint in 66), browser caching (2 and 48), frontend performance (91, with a real user monitoring item). Held out: internal RPC protocols, which you removed earlier as narrow protocol detail.

Total plan so far: 99 original, minus 1 retired, plus 16 new, equals 114 concerns.

## Open items

- Human expert review of security, databases, resilience, concerns 18, 19, 20 and 39, concerns 88 and 104, and concerns 4, 22, 48, 49 and 101. About 55 of the planned 114 concerns. At the end, rank the set by severity of the findings so the expert reviews the highest-risk concerns first.
- Second opinion on 84, 85, 86, 87, 95 and 96 (round 3 single-reviewer gap).
- Review round for the 16 new concerns.
- Sources listed in the triage that I have not opened.
