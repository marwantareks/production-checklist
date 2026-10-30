# Round 2 triage: Databases and data consistency (concerns 25 to 38, 81, 82)

Sources: Gemini (one reply: 8 findings, 1 suggested addition) and Claude Opus 5.5 (one complete reply: 60 findings, 10 suggested additions).

Nothing here has been applied to the repository. All 56 content edits in section 4 were applied to a scratch copy and pass the schema limits and style rules. They already reflect round 1 decisions: descriptive hints are moved out for the `look_for` field, and hint lists respect the cap of 15.

---

## 1. What this round showed

**R1. Gemini's "no issues found" was wrong again.** It cleared 27, 29, 31, 33, 34, 36, 38 and 82. Opus found a major issue in every one of those eight. In both rounds a single agent's clean list has not held up.

**R2. The outage-safety check worked.** Opus raised 8 safety findings, two rated critical:
- A plain CREATE INDEX on a large table blocks writes for the whole build (25).
- Reversing a destructive migration loses data, and a schema change waiting for a lock blocks every query behind it (81).
- Others: EXPLAIN ANALYZE runs the statement (26), transaction pooling breaks session features (28), a forgotten partition makes inserts fail (31), last-write-wins drops writes (35), "remove unused indexes" ignores per-node statistics (25), and expand-then-contract conflicts with automatic migrations (81).

**R3. Hint quality is a recurring problem.** Opus flagged hints in 14 of the 16 concerns, mostly generic words (pool, replica, primary, lock, version, schema, partition, cluster, KEY). Round 1 had the same pattern. I fixed these one by one in section 4, but decision 3 below proposes a rule so it stops recurring.

**R4. One verified claim with a cross-concern effect.** PgBouncer's own feature table confirms that in transaction pooling mode, SET, LISTEN and session-level advisory locks never work. So pg_advisory_lock, which is a hint in 37 and 38, fails behind a transaction pooler. I added the pooling-mode check to 28 and noted the hint in 37.

**R5. The agent prompt has four more issues**, listed in section 2.

---

## 2. Further changes to the agent prompt

| # | Finding | Agent | Proposed change |
|---|---|---|---|
| P7 | Sharding, partitioning and read replicas are optional techniques. The agent would mark a well-designed system "not found". | Opus | Add an optional content field `applies_when` per concern (for example "The database holds more data than one machine serves well"). The prompt says: if the condition does not hold, return not_applicable. See decision 1. |
| P8 | Several red flags and practices need runtime data or team process (indexes never queried, slow logs reviewed, conflict rate monitored). Nothing stops an agent reporting them from code. | Opus | "If a red flag or practice needs runtime data or team process, do not report it from code. Say in the note that it needs people or runtime evidence." |
| P9 | Connection strings often hold passwords (postgres://user:password@host). The redaction rule covers key names, not credentials inside a URL. | Opus | "Treat credentials inside connection strings as secrets and redact the user information part of any URL." |
| P10 | Allowed git commands can run commands set in a repository's own git config (such as core.pager and core.fsmonitor), and git log with patches can show secrets from history. | Opus | See decision 2: restrict git use. |
| P11 | Output ambiguity: line numbers, quotes over 120 characters, and red flags reported without evidence. | Opus | "Line numbers start at 1. Truncate quotes over 120 characters with an ellipsis. Report a red flag only when you have evidence it is present." |

---

## 3. Decisions for this round

| # | Decision | Status |
|---|---|---|
| 1 | Optional techniques: an `applies_when` field (P7) | Open |
| 2 | Prompt changes P8 to P11, including how to restrict git | Open |
| 3 | A rule against generic single-word hints | Open |
| 4 | New concerns suggested this round | Open |
| 5 | The 56 content edits in section 4 | Open |
| 6 | Round status and sign-off | Open |

### Suggested additions this round (11 total)

Opus suggested 10 and Gemini 1. My recommendation by tier. The "fold" items already have a home.

| Tier | Concern | Why | Where it goes |
|---|---|---|---|
| Add | Transaction isolation levels | Defaults differ by database, and many lost-update and write-skew bugs come from assuming stronger isolation. The locking concerns (36, 37) depend on it. | New concern (own, partial) |
| Add | Database constraints and integrity | Unique, foreign key, NOT NULL and CHECK constraints are the last defense against races and bad writes. 38 relies on unique constraints and nothing reviews them. | New concern (guardrail, code) |
| Consider | Primary key and id generation | 32-bit id exhaustion, guessable sequential ids, random UUID index fragmentation, and global ids for sharding. | New concern (guardrail, code) |
| Consider | Database maintenance and growth | Disk growth, bloat, vacuum and PostgreSQL transaction id wraparound cause outages indexing does not address. | New concern (own, partial) |
| Consider | Multi-tenant data isolation | Suggested again (round 1 held it out). Missing tenant filters leak one customer's data to another, and the isolation model is an architect-level choice. | New concern (own, partial) |
| Fold | Transactional outbox and dual writes | Concern 18 already covers it (its red flag is a database write and a message sent as separate steps with no outbox). | Already covered |
| Fold | Long transactions and statement timeouts | Statement timeouts are now in 26. Idle-in-transaction sessions can go in 37. | 26 and 37 |
| Fold | Database access and least privilege | Separate runtime, migration and read-only accounts. | 68 (infrastructure identity) |
| Fold | Data retention, deletion and residency | Same topic as the data classification and privacy concern you added in round 1. | That concern |
| Fold | Soft deletes and tombstoning (Gemini) | An implementation detail of retention and deletion. | That concern |
| Fold | Database engine version lifecycle | End-of-support engines lose security fixes. Fits the patch timelines in the supply chain concern. | That concern |

Adding the two "Add" concerns takes the checklist to 108. The three "Consider" concerns would take it to 111.

---

## 4. Proposed content edits by concern

### 25. Database indexing

**how_it_works** (Gemini, Opus). Accept.

Gemini: indexes also take memory. Opus: "every change updates the index" is too absolute (some updates skip it), column order was stated but not explained, and partial and covering indexes were missing.

Now:

> An index is a structure that lets the database find rows without scanning the whole table, for example a B-tree on a column. It speeds up reads that filter, join or sort on the indexed columns, and it slows writes and takes storage because every change updates the index. Composite indexes depend on column order.

Proposed:

> An index lets the database find rows without scanning the whole table, for example with a B-tree on a column. It speeds up reads that filter, join or sort on the indexed columns. It slows inserts, deletes and updates to those columns, and takes storage and memory. A composite index helps queries that filter on its leading columns, so an index on customer and date helps a filter on customer but not one on date alone. Partial and covering indexes serve narrower cases.

**good_looks_like** (Opus). Accept.

Safety, rated critical by Opus: a plain CREATE INDEX on a large table blocks writes for the whole build, and a failed concurrent build can leave an invalid index. Removing "unused" indexes is also risky: usage statistics are per node and reset on restart, and a unique index may never be scanned yet still enforces a constraint.

Add or change to:

- Unused indexes removed only after checking every node over a full business cycle, and never if they enforce a constraint
- Indexes on large tables built online (for example CREATE INDEX CONCURRENTLY in PostgreSQL), with invalid indexes checked after a failed build

Replace or remove:

- Unused and duplicate indexes removed

**search_hints** (Opus). Accept.

KEY matches API_KEY and dictionary code, and explain and indexes are generic. Adds the common ORM forms.

Add: `CREATE UNIQUE INDEX`, `INDEX idx_`, `@Table(indexes`, `@@index`, `db_index=True`, `HasIndex(`, `Index(`, `ensureIndex`

Remove: `index:`, `unique:`, `explain`, `KEY`, `indexes`

**agent_check level** (Opus). Accept.

Whether indexes match the real query patterns, or any are unused, needs query statistics, not the repository.

Change from `code` to `partial`.

**review_question** (Opus). Accept.

The current question asks two things, including who reviews them.

Now:

> Are indexes aligned with the top query patterns, and who reviews them?

Proposed:

> Are indexes checked against the top query patterns using real query statistics?

### 26. Query optimization

**how_it_works** (Opus). Accept.

Safety: EXPLAIN ANALYZE executes the statement. On an UPDATE or DELETE it changes data, and on a heavy query in production it adds the full load.

Now:

> Query optimization finds and fixes slow queries by reading execution plans, adding or changing indexes, selecting fewer columns and rows, avoiding unnecessary joins and moving work out of hot paths. It is driven by measuring real queries, not by guessing.

Proposed:

> Query optimization finds and fixes slow queries by reading execution plans, adding or changing indexes, selecting fewer columns and rows, avoiding unnecessary joins and moving work out of hot paths. It is driven by measuring real queries, not by guessing. EXPLAIN ANALYZE runs the query, so wrap data-changing statements in a transaction that is rolled back, and avoid running heavy queries this way on the primary.

**red_flags** (Gemini, Opus). Accept.

Gemini rated SELECT * a major issue on any production table, not only wide ones. I softened it to application queries, since EXISTS (SELECT *) is fine. Opus adds the common causes of unusable indexes.

Add or change to:

- SELECT * in application queries instead of naming the columns needed
- Filters that wrap indexed columns in functions or casts, or use a leading wildcard LIKE, so the index cannot be used

Replace or remove:

- SELECT * on wide tables

**good_looks_like** (Opus). Accept.

Deep OFFSET pagination gets slower on later pages and skips or repeats rows under concurrent writes. Statement timeouts were missing.

Add or change to:

- Queries select only what is needed, and large lists use keyset pagination rather than deep OFFSET
- Statement timeouts set so a runaway query is cancelled

Replace or remove:

- Queries select only what is needed and paginate

**search_hints** (Opus). Accept.

LIMIT, OFFSET, joins and paginate match good code as well. Adds slow-log settings for the common databases. I dropped .all() because it matches array code everywhere.

Add: `log_min_duration_statement`, `slow_query_log`, `long_query_time`, `auto_explain`, `statement_timeout`, `findMany(`, `.ToList()`

Remove: `slow_query`, `LIMIT`, `OFFSET`, `paginate`, `joins`

### 27. N+1 queries

**search_hints** (Opus). Accept.

includes( matches JavaScript array code everywhere. Adds the loading options and detection tools of other ORMs. The two descriptive hints (a query call inside a for loop, forEach with await db) move to look_for, as decided.

Add: `joinedload`, `selectinload`, `JOIN FETCH`, `@EntityGraph`, `@BatchSize`, `preload(`, `include: {`, `.includes(:`, `.Include(`, `assertNumQueries`, `nplusone`

Remove: `a query call inside a for loop`, `forEach with await db`, `lazy loading`, `includes(`, `Include(`

**trade_off** (Opus). Accept.

The cartesian product from joining collections can be worse than N+1, and the current text does not name it.

Now:

> Batching or joins fix it but can fetch more data than needed.

Proposed:

> Joins or eager loading fix it, but joining several collections at once multiplies rows, so batched or split queries are often better.

### 28. Connection pooling

**how_it_works** (Gemini, Opus). Accept.

Both agents: oversized pools hurt the database as well as undersized ones. Opus adds that rolling deployments and autoscaling temporarily raise the connection count.

Now:

> A connection pool keeps a set of open database connections and hands them out to requests, so each request does not pay to open a new one. The pool has a maximum size, a wait timeout and checks for dead connections. Total connections across all instances must stay below the database limit.

Proposed:

> A connection pool keeps a set of open database connections and hands them out to requests, so each request does not pay to open a new one. The pool has a maximum size, a wait timeout and checks for dead connections. Total connections across all instances must stay below the database limit. Size the budget for the maximum instance count during autoscaling and rolling deployments, plus jobs, migrations and reserved admin connections. Larger pools are not faster, because a database handles only a limited number of active queries well.

**red_flags** (Gemini, Opus). Accept.

Merges Gemini's thrashing risk with Opus's leak detection and the real timeout risk, which is an unbounded wait, not a missing one.

Add or change to:

- Pool size set without computing instances times pool size against the database limit, or set so high that the database thrashes
- Connection wait timeout unbounded or longer than the request timeout
- Connections not returned on error paths, with no leak detection

Replace or remove:

- Pool size set without computing instances times pool size against the database limit
- No timeout when waiting for a connection

**good_looks_like** (Opus). Accept.

Verified against PgBouncer's feature table: in transaction pooling, SET, LISTEN and session-level advisory locks never work, and prepared statements need a setting.

Add or change to:

- Pooling mode checked against session features the code uses, such as session settings, advisory locks, LISTEN and prepared statements

**search_hints** (Opus). Accept.

pool matches thread and worker pools. maxPoolSize is not the HikariCP name. Adds settings from other stacks.

Add: `maximumPoolSize`, `connectionTimeout`, `leakDetectionThreshold`, `max_overflow`, `pool_timeout`, `pool_pre_ping`, `pool_recycle`, `connection_limit`, `Max Pool Size`, `SetMaxOpenConns`, `CONN_MAX_AGE`

Remove: `pool`, `max_connections`, `pool_size`, `connectionLimit`, `acquireTimeout`, `createPool`

**related** (Opus). Accept.

Serverless connection exhaustion is central to this concern. Dropped 26 to stay within four.

Add: `90`, `54`

Remove: `26`

### 29. Read replicas

**how_it_works** (Opus). Accept.

Two common failures were missing.

Now:

> A read replica is a copy of the database that serves read queries, spreading load away from the primary. Replication is usually asynchronous, so a replica can lag behind and return older data. Applications must decide which reads can use a replica and handle lag.

Proposed:

> A read replica is a copy of the database that serves read queries, spreading load away from the primary. Replication is usually asynchronous, so a replica can lag behind and return older data. Applications must decide which reads can use a replica and handle lag. Reads inside a write transaction must stay on the primary. Long queries on a replica can be cancelled or can delay replication, depending on settings.

**red_flags** (Opus). Accept.

All reads on the primary is not a flaw by itself. Caching, query tuning or a larger server may be the better answer.

Add or change to:

- Primary overloaded by reads with no plan for caching, tuning or replicas

Replace or remove:

- All reads sent to the primary even under heavy read load

**search_hints** (Opus). Accept.

primary, secondary, readonly and follower match CSS, keys and UI code. Adds real routing settings from common frameworks.

Add: `secondaryPreferred`, `ApplicationIntent=ReadOnly`, `connects_to(database:`, `using('replica')`, `DATABASE_ROUTERS`, `AbstractRoutingDataSource`, `replicaSet`, `read_replica`

Remove: `replica`, `readonly`, `follower`, `primary`, `secondary`

### 30. Sharding

**how_it_works** (Opus). Accept.

Missing what sharding breaks, and the reason a modulo mapping is painful to grow.

Now:

> Sharding splits data across several databases using a shard key, such as customer or region, so each holds part of the data and writes scale beyond one machine. Choosing the key matters most: a poor key creates hotspots, and queries or transactions across shards become hard.

Proposed:

> Sharding splits data across several databases using a shard key, such as customer or region, so each holds part of the data and writes scale beyond one machine. Choosing the key matters most: a poor key creates hotspots, and queries or transactions across shards become hard. Unique constraints and auto-increment ids only hold within a shard, so ids need a global scheme. Mapping keys to many logical shards, rather than modulo the number of servers, makes adding capacity a move of whole shards.

**red_flags** (Opus). Accept.

The old flag was too absolute: sharding by region or tenant can be required from the start.

Add or change to:

- Sharding adopted with no capacity, residency or isolation need behind it

Replace or remove:

- Sharding adopted before a single database was exhausted

**decide_between** (Gemini, Opus). Accept.

Gemini adds distributed and NoSQL databases. Opus adds splitting by function and caching, which often remove the need to shard.

Now:

> Shard the data, scale vertically, or use a distributed database. Vertical scaling and replicas are simpler for as long as they work. Distributed databases move sharding into the product at their own cost.

Proposed:

> Shard the data, scale vertically, split data by function into separate databases, or use a distributed or NoSQL database. Vertical scaling, replicas and caching are simpler for as long as they work. Distributed databases move sharding into the product at their own cost.

**search_hints** (Opus). Accept.

cluster is generic. Adds shard-related settings from common tools.

Add: `shardKey`, `shard_key`, `shardCollection`, `vschema`, `create_distributed_table`, `ShardingSphere`, `shard_id`

Remove: `shard`, `sharding`, `shard key`, `partition key`, `cluster`

### 31. Partitioning

**how_it_works** (Opus). Accept.

Hotspots are mainly a sharding problem. Within one database the risks are missing pruning and too many partitions.

Now:

> Partitioning splits one large table into smaller parts inside the same database, usually by date or key range. Queries that filter on the partition key read only the relevant parts, and old data can be dropped quickly by removing a partition. A poorly chosen key creates hotspots or forces scans of every partition.

Proposed:

> Partitioning splits one large table into smaller parts inside the same database, by range (often date), list or hash. Queries that filter on the partition key read only the relevant parts, and old data can be dropped quickly by removing a partition. A poorly chosen key forces scans of every partition, and too many partitions slow query planning.

**red_flags** (Opus). Accept.

Safety: with range partitioning, an insert for a period that has no partition fails, which is an outage.

Add or change to:

- Future partitions created by hand, so inserts fail when one is missing

Replace or remove:

- Partitions created manually and sometimes forgotten

**good_looks_like** (Opus). Accept.

Converting an existing large table is not an in-place change in PostgreSQL.

Add or change to:

- Converting an existing table planned as a data migration, with unique keys that include the partition key

**search_hints** (Opus). Accept.

partition, TTL, archive and time series match Kafka, caches and unrelated code.

Add: `PARTITION OF`, `ATTACH PARTITION`, `DETACH PARTITION`, `partman.create_parent`, `create_hypertable`, `CREATE PARTITION FUNCTION`

Remove: `partition`, `range partition`, `retention`, `TTL`, `archive`, `time series`

### 32. Replication

**how_it_works** (Gemini, Opus). Accept.

Both agents: synchronous replication usually waits for a quorum, not all replicas. Opus adds that it can stop writes, and that replication is not a backup.

Now:

> Replication copies data from one node to others to improve availability and durability. It can be synchronous, where a write completes only after replicas confirm, or asynchronous, where replicas catch up later. Synchronous protects data but adds latency. Asynchronous is faster but can lose recent writes on failure.

Proposed:

> Replication copies data from one node to others to improve availability and durability. It can be synchronous, where a write completes only after replicas confirm, or asynchronous, where replicas catch up later. Synchronous protects data but adds latency, and it can block writes when the required replicas are unavailable. Quorum and semi-synchronous modes sit between the two. Asynchronous is faster but can lose recent writes on failure. Replication copies mistakes and deletions, so it does not replace backups.

**search_hints** (Opus). Accept.

replicas matches every Kubernetes Deployment. wal and acks are generic.

Add: `synchronous_standby_names`, `rpl_semi_sync`, `MultiAZ`, `replication_factor`, `acks=all`, `writeConcern`, `consistency_level`

Remove: `replication`, `replication factor`, `replicas`, `acks`, `wal`, `replica`

**related** (Opus). Accept.

Backups and disaster recovery travel with the replication mode and recovery point. Dropped 34 to stay within four.

Add: `84`, `83`

Remove: `34`

### 33. Leader election

**how_it_works** (Opus). Accept.

Many common implementations, including the Kubernetes client library, state they do not guarantee a single leader.

Now:

> Leader election lets a group of nodes agree on one node to coordinate work, such as the primary of a database or the one scheduler running a job. It usually relies on a consensus system (Raft, ZooKeeper, etcd) or a lease in shared storage. The design must handle a leader that is slow or partitioned, so two leaders do not act at once.

Proposed:

> Leader election lets a group of nodes agree on one node to coordinate work, such as the primary of a database or the one scheduler running a job. It usually relies on a consensus system (Raft, ZooKeeper, etcd) or a lease in shared storage. The design must handle a leader that is slow or partitioned, so two leaders do not act at once. Leases assume clocks and pauses stay within bounds, so a paused leader can still act after losing its lease. Safety needs fencing tokens that the protected resource checks.

**search_hints** (Opus). Accept.

lock and singleton are generic. Adds the common library entry points.

Add: `LeaderElector`, `RunOrDie`, `coordination.k8s.io`, `LeaderLatch`, `LeaderSelector`, `Campaign(`, `@SchedulerLock`, `leader-elect`

Remove: `leader`, `election`, `lease`, `lock`, `singleton`, `leaderelection`, `ShedLock`

**related** (Opus). Accept.

Clock skew is central to lease safety.

Add: `96`

### 34. CAP theorem

**how_it_works** (Opus). Accept.

CAP covers only partitions. The everyday trade-off, latency against consistency (PACELC), was missing.

Now:

> The CAP theorem says that when a network partition happens, a distributed data system can keep either consistency (every read sees the latest write) or availability (every request gets a response), not both. In practice the choice is made for each data set and shows up in the database settings and in the application’s behavior on errors.

Proposed:

> The CAP theorem says that when a network partition happens, a distributed data system can keep either consistency (every read sees the latest write) or availability (every request gets a response), not both. In practice the choice is made for each data set and shows up in the database settings and in the application’s behavior on errors. CAP uses strict definitions, and many systems meet neither. Without a partition, the everyday choice is between lower latency and stronger consistency, which settings such as quorum size or synchronous replication control.

**definition** (Opus). Accept.

The old definition implied a clean either-or choice.

Now:

> During a network partition you can only keep consistency or availability.

Proposed:

> During a network partition, a replicated system must give up either strict consistency or availability for affected operations.

### 35. Eventual consistency

**definition** (Opus). Accept.

The old definition implied a time bound that the model does not give.

Now:

> Replicas may differ briefly but converge over time.

Proposed:

> Replicas may differ, and converge once updates stop, with no guaranteed time limit.

**red_flags** (Gemini, Opus). Accept.

Gemini: retries during the convergence window cause duplicates. Opus: last-write-wins silently drops writes under clock skew, and users can see data go backwards. I merged "no resolution rule" into the last-write-wins item to stay within six.

Add or change to:

- Conflicting updates resolved by last-write-wins on wall-clock time where losing a write matters
- Reads spread across replicas so a user can see newer data and then older data
- Users able to retry pending actions with no idempotency keys

Replace or remove:

- Conflicting updates with no resolution rule

**related** (Opus). Accept.

Clock skew and event-driven architecture travel with this concern.

Add: `96`, `17`

Remove: `50`

### 36. Optimistic locking

**how_it_works** (Opus). Accept.

Timestamps are unsafe versions: two writes in the same clock tick, or under skew, pass the check. A hand-written UPDATE must check the affected row count.

Now:

> Optimistic locking assumes conflicts are rare. Each record carries a version or timestamp. An update succeeds only if the version is unchanged since it was read, and otherwise fails so the caller can reload and retry. It avoids holding locks, so it scales well when conflicts are uncommon.

Proposed:

> Optimistic locking assumes conflicts are rare. Each record carries an integer version or a database row version. An update includes the expected version in its condition and succeeds only if one row changed, and otherwise fails so the caller can reload and retry. Code that does not check the row count misses the conflict. It avoids holding locks, so it scales well when conflicts are uncommon.

**red_flags** (Opus). Accept.

Bulk updates skip the ORM check. A single-row version check does not prevent write skew across rows.

Add or change to:

- Bulk or raw updates that bypass the version check
- Version checks relied on for rules that span several rows

**search_hints** (Opus). Accept.

version matches manifests and API versions everywhere. Adds framework markers.

Add: `[ConcurrencyCheck]`, `IsRowVersion`, `rowversion`, `version_id_col`, `OptimisticLockException`, `StaleObjectStateError`, `DbUpdateConcurrencyException`

Remove: `version`, `optimistic`, `OptimisticLock`

### 37. Pessimistic locking

**how_it_works** (Opus). Accept.

Misses the most common bug: SELECT FOR UPDATE outside an explicit transaction releases at once.

Now:

> Pessimistic locking takes a lock on the data before changing it, so others wait or fail until the lock is released. It is done with SELECT FOR UPDATE or similar. It prevents conflicts when contention is high, but it reduces concurrency and can cause deadlocks if locks are taken in different orders.

Proposed:

> Pessimistic locking takes a lock on the data before changing it, so others wait or fail until the lock is released. It is done with SELECT FOR UPDATE or similar. It prevents conflicts when contention is high, but it reduces concurrency and can cause deadlocks if locks are taken in different orders. The lock lasts only until the transaction ends, so under autocommit it protects nothing. The database aborts one side of a deadlock, and that transaction must be retried.

**good_looks_like** (Gemini, Opus). Accept.

Gemini adds NOWAIT. Opus adds deadlock retry and notes that SKIP LOCKED suits queue processing, not protecting a specific record, so I left it out.

Add or change to:

- Lock wait timeouts set, or NOWAIT used to fail fast
- Deadlock and lock timeout errors retried a bounded number of times

Replace or remove:

- Lock wait timeouts set

**search_hints** (Opus). Accept.

synchronized and lock( match in-process locks, which are a different concern. Adds ORM lock functions. Note that pg_advisory_lock fails under transaction pooling (see 28).

Add: `select_for_update`, `with_for_update`, `lockForUpdate`, `with_lock`, `PESSIMISTIC_WRITE`, `FOR SHARE`, `NOWAIT`, `HOLDLOCK`, `GET_LOCK(`

Remove: `lock(`, `advisory lock`, `synchronized`

### 38. Distributed locks

**how_it_works** (Opus). Accept.

The old text implied any lock store gives fencing tokens.

Now:

> A distributed lock gives one process at a time exclusive access to a resource across several machines, usually through Redis, a database or a coordination service. Correct use needs an expiry so crashed holders do not block forever, and fencing tokens so a holder that paused cannot act after its lock expired.

Proposed:

> A distributed lock gives one process at a time exclusive access to a resource across several machines, usually through Redis, a database or a coordination service. Correct use needs an expiry so crashed holders do not block forever, and fencing tokens so a holder that paused cannot act after its lock expired. Fencing tokens must come from a source that always increases, such as an etcd revision or a database sequence, and the protected resource must reject older tokens. Redis locks do not provide this.

**red_flags** (Opus). Accept.

Redlock's safety is disputed. Adds two common implementation mistakes.

Add or change to:

- A Redis lock, single node or Redlock, relied on alone for correctness
- Lock set and expiry set in two separate commands
- Lock released without checking it is still owned by the caller

Replace or remove:

- A single Redis node used for a lock where correctness matters

**search_hints** (Opus). Accept.

lock and lease are generic. Adds common client libraries.

Add: `RLock`, `getLock(`, `InterProcessMutex`, `LockRegistry`, `@SchedulerLock`, `pg_try_advisory_lock`, `pg_advisory_lock`, `DistributedLock`

Remove: `lock`, `lease`, `pg_advisory`, `distributed lock`, `ShedLock`

### 81. Database migrations

**how_it_works** (Opus). Accept.

Safety, rated critical by Opus: reversing a destructive migration loses data written since, and a schema change waiting for a lock blocks every query behind it.

Now:

> Schema changes are written as versioned scripts, stored with the code and applied in order by a tool, so every environment reaches the same schema. Safe migrations are backward compatible with the version of the application that is still running, and can be rolled forward or back.

Proposed:

> Schema changes are written as versioned scripts, stored with the code and applied in order by a tool, so every environment reaches the same schema. Safe migrations are backward compatible with the version of the application that is still running, so a bad release can be fixed by rolling forward. Down migrations that drop data are not a rollback plan. Schema changes set a short lock timeout and retry, so a waiting change does not block all traffic.

**red_flags** (Gemini, Opus). Accept.

Gemini rated this critical: a huge single transaction can lock tables and exhaust transaction logs. Opus covers the same step in good_looks_like.

Add or change to:

- Migrations that backfill or update millions of rows in a single transaction without batching

**good_looks_like** (Opus). Accept.

Running every migration automatically conflicts with expand then contract, because the contract step must wait until all old versions are gone.

Add or change to:

- Migrations run in the pipeline, in order, with the contract step held until no old version is running
- Changes follow expand then contract: add new structures, deploy code that uses both, backfill in batches, then remove old structures in a later release
- Constraints added in steps where supported, such as NOT VALID then VALIDATE in PostgreSQL

Replace or remove:

- Migrations run automatically in the pipeline, in order
- Changes follow expand then contract so old and new versions both work

**review_question** (Opus). Accept.

The current question asks two things and steers toward rollback.

Now:

> Can schema changes run without downtime, and can they be rolled back?

Proposed:

> Can each schema change be deployed while the previous application version is still running?

**decide_between** (Opus). Accept.

Most tools already take a lock, so races are less of an issue than health checks and schema rights.

Now:

> Run migrations at application startup, or as a separate pipeline step. Startup is simple, but several instances can race and a failure blocks startup. A separate step is controlled but needs pipeline work.

Proposed:

> Run migrations at application startup, or as a separate pipeline step. Startup is simple, but long migrations can trip health checks and the application account needs rights to change the schema. A separate step is controlled and allows a least-privilege runtime account, but needs pipeline work.

**search_hints** (Opus). Accept.

Adds common tools and the risky statements.

Add: `db/migrate`, `manage.py migrate`, `dotnet ef`, `golang-migrate`, `RENAME COLUMN`, `SET NOT NULL`

Remove: `ActiveRecord::Migration`, `db:migrate`

### 82. Schema versioning

**how_it_works** (Opus). Accept.

Checking only the latest version does not protect consumers that replay older data. Reusing a field number corrupts data silently.

Now:

> Schema versioning manages how data formats change over time so producers and consumers can evolve independently. Rules such as backward compatibility (new readers handle old data) and forward compatibility (old readers handle new data) are enforced with schema definitions and compatibility checks.

Proposed:

> Schema versioning manages how data formats change over time so producers and consumers can evolve independently. Rules such as backward compatibility (new readers handle old data) and forward compatibility (old readers handle new data) are enforced with schema definitions and compatibility checks. Where old data is replayed or kept, check compatibility against all previous versions, not just the latest. In Protobuf, never reuse a removed field number; mark it reserved.

**good_looks_like** (Opus). Accept.

Tolerating unknown fields conflicts with strict input validation at public boundaries, where unknown fields can enable mass assignment.

Add or change to:

- Readers of internal events and stored data tolerate unknown fields; public API inputs are validated against an explicit schema

Replace or remove:

- Readers tolerate unknown fields

**search_hints** (Opus). Accept.

schema, compatibility and version field are generic.

Add: `schema.registry.url`, `buf.yaml`, `BACKWARD_TRANSITIVE`, `.avsc`, `.proto`, `reserved`, `upcaster`, `$schema`

Remove: `schema`, `backward compatible`, `version field`, `compatibility`

---

## 5. Sources

- **Confirmed by me this round:** PgBouncer's feature table (transaction pooling: SET, LISTEN and session-level advisory locks never work; prepared statements need a setting).
- **Cited by an agent and not opened by me:** the PostgreSQL documentation (CREATE INDEX, EXPLAIN, statement_timeout, lock_timeout, hot standby, table partitioning, synchronous replication, ALTER TABLE NOT VALID, explicit locking), the MySQL online DDL and semisynchronous replication pages, the HikariCP pool sizing page and README, the Kubernetes client-go leader election documentation, Kleppmann's Designing Data-Intensive Applications and his article on distributed locking, the EF Core concurrency and query splitting pages, the Redis SET and locking pages, the Confluent compatibility page, the Protocol Buffers reserved fields page, Strong Migrations, and the CAP and consistency papers (Gilbert and Lynch, Brewer, Abadi, Vogels). These are all well-known references and the claims match documented behavior as I know it, but open any you plan to cite.

## 6. Next

I'll walk through decisions 1 to 6 one at a time, as in round 1.
