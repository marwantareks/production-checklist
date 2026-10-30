# Expert review plan

**Status:** every concern has been reviewed by two AI reviewers and approved by the author. **No concern has been reviewed by a human expert yet.** Do not describe the checklist as expert reviewed until the tiers below are done, and say which tiers were.

An agent review does not replace an expert. In every round, both reviewers found real problems in concerns that looked fine, and a single reviewer's clean list was contradicted each time another reviewer looked. The expert review should catch what two AI reviewers share as blind spots: claims that are plausible but wrong for a specific product, advice that is safe in one setup and harmful in another, and gaps that come from never having run these systems in production.

## How the tiers were chosen

The earlier plan listed security, data consistency and recovery, and grew with every round until it covered about 70 of the 115 concerns, more than one expert can review. This plan ranks instead, so the expert works from the top as far as time allows.

- **Tier 1 (57 concerns): the three categories where the cost of error is highest.** Security, databases and data consistency, and resilience and fault tolerance, which includes backups, failover and recovery. Concerns that drew a critical finding from a reviewer come first.
- **Tier 2 (30 concerns): every other concern where a reviewer rated a finding critical.** Critical means following the text literally could cause an outage, a security hole or data loss. The record comes from the notes in the triage documents in `review/decisions/`. Rounds 1 to 4 did not keep a structured severity field, so a concern can be missing here if its note did not mention the severity.
- **Tier 3 (28 concerns): everything else.** Reviewed by two AI reviewers only. Spot check these.

## What the expert should do

1. Read the concern as a practitioner would, then read `red_flags` and `good_looks_like` with one question: could a team meet this wording and still be unsafe or wrong?
2. Check every claim that depends on a specific product. The review rounds found many cases where one product behaves differently (isolation levels, row-level security, mesh defaults, failover behavior).
3. Check every `good_looks_like` and `decide_between` item for advice that is only safe under conditions the text does not state.
4. Check that each `red_flag` could be seen by an agent in a repository, or is marked as needing people evidence.
5. Reply in the format in `review/REVIEWER_PROMPT.md` and record the review in `review/LOG.md` with the expert's name, the date and the tier covered. Apply accepted edits through `npm run review:apply` and the steps in `docs/REVIEW_PROCESS.md`.

For a fresh prompt for any group of concerns, run `npm run review:prompt -- --ids 109,110,111`.

## Tier 1

| Id | Concern | Category | Critical findings recorded |
| --- | --- | --- | --- |
| 84 | Backups | Resilience and fault tolerance | 3 |
| 14 | Idempotency | Resilience and fault tolerance | 2 |
| 81 | Database migrations | Databases and data consistency | 2 |
| 118 | Constraints, keys and integrity | Databases and data consistency | 2 |
| 119 | Database maintenance and growth | Databases and data consistency | 2 |
| 120 | Multi-tenant data isolation | Databases and data consistency | 2 |
| 85 | Failover | Resilience and fault tolerance | 1 |
| 87 | Chaos engineering | Resilience and fault tolerance | 1 |
| 96 | Clock skew | Resilience and fault tolerance | 1 |
| 123 | Third-party dependency resilience | Resilience and fault tolerance | 1 |
| 25 | Database indexing | Databases and data consistency | 1 |
| 10 | Circuit breakers | Resilience and fault tolerance | none |
| 11 | Timeouts | Resilience and fault tolerance | none |
| 12 | Retries | Resilience and fault tolerance | none |
| 44 | Backpressure | Resilience and fault tolerance | none |
| 83 | Disaster recovery | Resilience and fault tolerance | none |
| 86 | Multi-region deployment | Resilience and fault tolerance | none |
| 95 | Network partitions | Resilience and fault tolerance | none |
| 121 | Graceful degradation | Resilience and fault tolerance | none |
| 122 | Bulkheads and resource isolation | Resilience and fault tolerance | none |
| 26 | Query optimization | Databases and data consistency | none |
| 27 | N+1 queries | Databases and data consistency | none |
| 28 | Connection pooling | Databases and data consistency | none |
| 29 | Read replicas | Databases and data consistency | none |
| 30 | Sharding | Databases and data consistency | none |
| 31 | Partitioning | Databases and data consistency | none |
| 32 | Replication | Databases and data consistency | none |
| 33 | Leader election | Databases and data consistency | none |
| 34 | CAP theorem | Databases and data consistency | none |
| 35 | Eventual consistency | Databases and data consistency | none |
| 36 | Optimistic locking | Databases and data consistency | none |
| 37 | Pessimistic locking | Databases and data consistency | none |
| 38 | Distributed locks | Databases and data consistency | none |
| 82 | Schema versioning | Databases and data consistency | none |
| 117 | Transaction isolation levels | Databases and data consistency | none |
| 67 | Secrets management | Security | none |
| 68 | IAM | Security | none |
| 69 | OAuth | Security | none |
| 70 | JWT signing keys and validation | Security | none |
| 71 | TLS | Security | none |
| 72 | Encryption at rest | Security | none |
| 73 | Encryption in transit | Security | none |
| 74 | WAF | Security | none |
| 75 | DDoS protection | Security | none |
| 76 | CORS | Security | none |
| 77 | CSRF | Security | none |
| 78 | SQL injection | Security | none |
| 79 | XSS | Security | none |
| 80 | SSRF | Security | none |
| 109 | Application authorization | Security | none |
| 110 | Authentication and session management | Security | none |
| 111 | Software supply chain security | Security | none |
| 112 | Other injection and deserialization | Security | none |
| 113 | Security logging and audit trails | Security | none |
| 114 | Threat modeling | Security | none |
| 115 | Data classification and privacy | Security | none |
| 116 | Service-to-service authentication | Security | none |

## Tier 2

| Id | Concern | Category | Critical findings recorded |
| --- | --- | --- | --- |
| 1 | Rate limiting | Traffic, networking and APIs | 4 |
| 6 | CI/CD | Build, deployment and release | 3 |
| 3 | Load balancing | Traffic, networking and APIs | 2 |
| 4 | Reverse proxies | Traffic, networking and APIs | 2 |
| 22 | WebSockets | Traffic, networking and APIs | 2 |
| 101 | Webhooks | Traffic, networking and APIs | 2 |
| 2 | Caching | Caching and performance | 2 |
| 49 | Edge caching | Caching and performance | 2 |
| 50 | Cache invalidation | Caching and performance | 2 |
| 94 | Tail latency | Caching and performance | 2 |
| 15 | Message queues | Messaging and async processing | 2 |
| 20 | Dead letter queues | Messaging and async processing | 2 |
| 39 | Race conditions | Concurrency and memory | 2 |
| 88 | Cost optimization | Scaling and infrastructure | 2 |
| 104 | Infrastructure as code | Scaling and infrastructure | 2 |
| 51 | Feature flags | Build, deployment and release | 2 |
| 52 | Blue-green deployment | Build, deployment and release | 2 |
| 107 | Build caching | Build, deployment and release | 2 |
| 108 | Dependency management | Build, deployment and release | 2 |
| 5 | API gateways | Traffic, networking and APIs | 1 |
| 48 | CDN | Caching and performance | 1 |
| 18 | Distributed transactions | Messaging and async processing | 1 |
| 19 | Saga pattern | Messaging and async processing | 1 |
| 40 | Deadlocks | Concurrency and memory | 1 |
| 42 | Garbage collection | Concurrency and memory | 1 |
| 56 | Health checks | Build, deployment and release | 1 |
| 125 | Environment configuration management | Build, deployment and release | 1 |
| 59 | Logging | Observability and operations | 1 |
| 61 | Metrics | Observability and operations | 1 |
| 62 | Alerts | Observability and operations | 1 |

## Tier 3

| Id | Concern | Category | Critical findings recorded |
| --- | --- | --- | --- |
| 24 | Server-sent events | Traffic, networking and APIs | none |
| 102 | API versioning | Traffic, networking and APIs | none |
| 91 | Latency | Caching and performance | none |
| 92 | Throughput | Caching and performance | none |
| 93 | P99 latency | Caching and performance | none |
| 16 | Pub/sub | Messaging and async processing | none |
| 17 | Event-driven architecture | Messaging and async processing | none |
| 41 | Memory and resource leaks | Concurrency and memory | none |
| 43 | Thread safety | Concurrency and memory | none |
| 8 | Kubernetes | Scaling and infrastructure | none |
| 9 | Service discovery | Scaling and infrastructure | none |
| 45 | Autoscaling | Scaling and infrastructure | none |
| 46 | Horizontal scaling | Scaling and infrastructure | none |
| 47 | Vertical scaling | Scaling and infrastructure | none |
| 89 | Cold starts | Scaling and infrastructure | none |
| 90 | Serverless limits | Scaling and infrastructure | none |
| 124 | Capacity planning and load testing | Scaling and infrastructure | none |
| 53 | Canary releases | Build, deployment and release | none |
| 54 | Rolling deployments | Build, deployment and release | none |
| 55 | Rollbacks | Build, deployment and release | none |
| 57 | Liveness and readiness probes | Build, deployment and release | none |
| 103 | Semantic versioning | Build, deployment and release | none |
| 58 | Monitoring | Observability and operations | none |
| 60 | Distributed tracing | Observability and operations | none |
| 63 | SLOs | Observability and operations | none |
| 64 | SLIs | Observability and operations | none |
| 65 | Error budgets | Observability and operations | none |
| 66 | Observability | Observability and operations | none |
