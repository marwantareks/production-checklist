# Round 2 decision record: Databases and data consistency

**Status:** agent-reviewed and owner-approved. **Human expert review: pending.**
**Date:** 2026-10-29
**Scope:** concerns 25 to 38, 81 and 82 (16 concerns) in the Databases and data consistency category.

## Review log row

| Category | Concerns | Date | Agent reviewers | Owner approval | Expert review | Status |
|---|---|---|---|---|---|---|
| Databases and data consistency | 25 to 38, 81, 82 | 2026-10-29 | Gemini (1 reply), Claude Opus 5.5 (1 reply) | Marwan Tarek | Pending | Signed off, expert review pending |

Nothing has been applied to the repository. All edits are applied once, after all rounds are done. The running list of repo work is in `repo-stage-backlog.md`.

## Decisions

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Optional techniques (replicas, sharding, partitioning and other conditional concerns) | Add an `applies_when` field | A reviewable condition per concern is better than hard-coding three concerns in the prompt. The agent returns `not_applicable` when the condition clearly does not hold. |
| 2 | Prompt changes P8 to P11 | Accept P8, P9 and P11. Restrict git to `git ls-files`, `git grep` and patch-free `git log`, always with `--no-pager` | Removes the repository-config and history-patch risks at almost no cost. |
| 3 | Generic single-word hints | A validator rule: warn now, make it an error after the final cleanup | Both rounds found the same flaw. A warning avoids blocking the repo update on a large cleanup. |
| 4 | New concerns | Add four: transaction isolation levels; constraints, keys and integrity (id generation folded in); database maintenance and growth; multi-tenant data isolation (conditional) | Each fills a gap with no current home. Id generation fits inside the constraints concern. |
| 5 | Content edits | Accept all 56 as a batch | Each has an agent source and a reason, passes validation, and the main safety claims were checked against documentation. |
| 6 | Round status | Sign off now, expert review pending | The new concerns are reviewed together in a later round, and expert review is planned for the end. |

## Content edits accepted (56)

| Concern | Name | Edits |
|---|---|---|
| 25 | Database indexing | 5 |
| 26 | Query optimization | 4 |
| 27 | N+1 queries | 2 |
| 28 | Connection pooling | 5 |
| 29 | Read replicas | 3 |
| 30 | Sharding | 4 |
| 31 | Partitioning | 4 |
| 32 | Replication | 3 |
| 33 | Leader election | 3 |
| 34 | CAP theorem | 2 |
| 35 | Eventual consistency | 3 |
| 36 | Optimistic locking | 3 |
| 37 | Pessimistic locking | 3 |
| 38 | Distributed locks | 3 |
| 81 | Database migrations | 6 |
| 82 | Schema versioning | 3 |

The full wording of every edit is in `round-02-databases-triage.md`, section 4.

## Claims checked against documentation this round

- PgBouncer feature table: in transaction pooling, `SET`, `LISTEN` and session-level advisory locks never work (28, and the advisory-lock hints in 37 and 38).
- PostgreSQL CREATE INDEX: a standard build locks out writes, and a failed concurrent build leaves an invalid index (25).
- PostgreSQL EXPLAIN: ANALYZE executes the statement, and the documentation recommends BEGIN, EXPLAIN ANALYZE, ROLLBACK (26).
- Kubernetes client-go leader election: the package states it does not guarantee that only one client acts as leader (33).

## Not opened

The PostgreSQL pages on partitioning, hot standby, synchronous replication, NOT VALID and explicit locking; MySQL online DDL and semisynchronous replication; the HikariCP pool sizing page; Kleppmann's book and his article on distributed locking; the EF Core, Redis, Confluent and Protocol Buffers pages; Strong Migrations; and the CAP and consistency papers. Open any you plan to cite.

## New concerns to draft (4)

| Concern | Proposed ownership | Proposed check level | Notes |
|---|---|---|---|
| Transaction isolation levels | own | partial | Defaults differ by database. Links to 36, 37. |
| Constraints, keys and integrity | guardrail | code | Unique, foreign key, NOT NULL, CHECK constraints, plus primary key and id generation (id exhaustion, guessable ids, UUID fragmentation, global ids for sharding). |
| Database maintenance and growth | own | partial | Disk growth, bloat, vacuum and transaction id wraparound. |
| Multi-tenant data isolation | own | partial | Conditional via `applies_when`. Held out in round 1, suggested again. |

Folded into existing concerns: transactional outbox (already in 18); statement timeouts (done in 26) and idle-in-transaction sessions (to add to 37); database least privilege (68); retention, deletion, residency and soft deletes (data classification and privacy); engine version lifecycle (supply chain, with patch timelines).

With round 1 the checklist grows from 99 to 110 concerns once these are written and reviewed.

## Open items

- Human expert review of the databases category.
- Review round for the new concerns, together with round 1's.
- Sources listed above that I have not opened.
