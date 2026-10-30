# Verification round triage: 17 new concerns and a second opinion on six (ids 109 to 125, and 84, 85, 86, 87, 95, 96)

Sources: eight complete replies, one per agent and prompt: new security concerns (109 to 116), new data concerns (117 to 120), new resilience, scaling and delivery concerns (121 to 125), and the second opinion on six round 3 concerns. About 165 findings from Opus and about 70 from Gemini, and about 40 suggested additions. Neither agent cleared a concern except Gemini's short list on the security prompt (111, 113 and 115), which Opus contradicted with major findings in all three.

Nothing here has been applied to the repository. All 138 content edits in section 4 were applied to a scratch copy of the checklist (the 115 concerns with every earlier accepted edit applied) and pass the schema limits and style rules.

---

## 1. What this round showed

**R1. First drafts needed more work, as expected.** The 17 new concerns drew about six edits each, against about five for concerns reviewed once before. The two agents agreed on the important points, and Opus found more. A single agent's clean list failed again: Gemini cleared 111, 113 and 115, and Opus found major problems in each.

**R2. The outage-safety and security checks found real problems.**
- **Authorization (109):** request bodies bound directly to models let a caller set fields such as role or tenant, and roles taken from the request were missing.
- **Authentication (110):** SameSite set to None satisfied the old wording, current guidance says to check passwords against breached lists and not to force changes, and multi-factor is most often bypassed through recovery.
- **Supply chain (111):** image and action tags are mutable, so "pinned" did not mean safe, and signatures verified without checking who signed accept artifacts signed by anyone.
- **Injection (112):** an argument list without a shell still allows argument injection, and JSON with polymorphic typing enables the same attacks as binary deserialization.
- **Audit logging (113):** log injection, and write-once retention in compliance mode cannot be shortened or undone.
- **Service-to-service authentication (116):** a mesh in permissive mode still accepts plain text, a gateway that forwards client identity headers lets anyone forge internal identity, and tokens need an audience check.
- **Isolation levels (117):** the same level name means different things in different databases, Oracle's serializable is snapshot isolation, and MySQL's repeatable read can still lose updates. Both agents said serializable is not always abort based.
- **Constraints (118):** adding a constraint to a large table can lock it, and changing an int key to bigint rewrites the table.
- **Database maintenance (119):** VACUUM FULL and OPTIMIZE TABLE can cause an outage or fill the disk, and long-running transactions are the main reason maintenance falls behind.
- **Multi-tenant isolation (120):** both agents rated this critical. Row-level security does not apply to the table owner or superusers unless forced, and tenant context kept on a pooled connection can leak to the next request.
- **Degradation, bulkheads, providers (121 to 123):** fallbacks that run rarely or move load make outages worse, security checks that fail open in degraded mode, a bulkhead only helps if callers fail fast when it is full, and retrying a provider call with no idempotency key can charge twice.
- **Load testing and configuration (124, 125):** stubs that answer instantly make results optimistic, tests against production can look like an attack, and Gemini rated fleet-wide configuration pushes critical (Opus major).
- **Second opinion (84 to 96):** Gemini rated automatic failback critical (85), the Redlock hint critical (96) and manual-only abort wording critical (87), and both agents asked for key protection for cross-account backups (84).

**R3. Hints again.** Both agents flagged generic or description-style hints in nearly every concern, and common words such as tenant_id and owner_id.

**R4. Applies-when sentences.** Both agents asked for one on 116: "Applies when the system has more than one service, or calls internal services or functions over a network." I broadened 120's (shared components such as logging or search count) and revised 87's (monitoring is a prerequisite to flag, not a reason the concern does not apply).

**R5. Check level and ownership.**
- Partial instead of code: 118 and 122 (both agents).
- Partial instead of people: 114, 115 and 123 (Opus). Each has hints and keeps its evidence list.
- Guardrail instead of own: 117, 119, 121 and 125 (new concerns), and 87 and 96 (second opinion).

**R6. Overlaps resolved.** Pinning and updates stay in 108 and 111 now focuses on integrity (provenance, signing, build isolation, registry trust). Capacity projection stays in 124, and 119 points to it. Noisy tenants point to 122. Retry safety points to 12 and 14.

**R7. A correction to my own round 3 wording.** The second reviewer found that my edit to 96 (token tolerance of "seconds to a few minutes") lets expired tokens through. It now says "usually seconds and not minutes".

---

## 2. Further changes to the agent prompt

| # | Finding | Agent | Proposed change |
|---|---|---|---|
| P41 | The secret rules do not cover password hashes in fixtures, one-time password seeds, private keys, database dumps or committed environment files, which the new hints lead straight to. | Opus (8a, 8c, 8d) | "Treat password hashes, one-time password seeds, private keys and key files (.pem, .key, .p12, .pfx, .jks) as secrets, and database dumps and backup files (.sql, .dump, .bak, .bson, .archive) as data exports: report only the path. In environment and settings files, read key names only." |
| P42 | The end-of-support red flag needs support dates from the agent's own training data, which contradicts the rule against reporting from its own knowledge. | Opus | "Report an end-of-support red flag only when a file in the repository states the support date. Otherwise note it as needing people evidence." |
| P43 | The prompt does not say how to decide that input is untrusted, so agents flag every match, including constant arguments and safe loaders. | Opus | "For injection and deserialization matches, trace the value back to a request, message, file or environment input. Report a red flag only when that path is shown." |
| P44 | Two red flags depend on a default level, but an agent that assumes read committed is wrong for MySQL. | Opus | "When a red flag depends on a product default, identify the product from configuration or drivers and quote the evidence. If it cannot be seen, return cannot_determine for that flag." |
| P45 | ORMs create primary and foreign keys without literal SQL, so a search for PRIMARY KEY gives false "no key" findings. | Opus | "Prefer the latest schema snapshot over single migrations. ORM models often create keys implicitly, so do not report a missing key from the absence of SQL text." |
| P46 | Hints such as pg_stat_user_tables invite an agent to connect to a database. The rules ban network requests and running code, not a local database. | Opus (safety) | "Never connect to any database, including local or containerized ones, and never run SQL or database clients. Treat SQL in the repository as text to read." |
| P47 | An agent that finds no tenant column, or only one region, may return not_applicable, the worst outcome for a leak risk or a multi-region need. This revises P37. | Opus | "Use not_applicable only with positive evidence that the Applies when condition fails, never from the absence of a search hit. A single-region deployment does not show a multi-region concern is false. If unclear, return cannot_determine." |
| P48 | Quoting line 1 for a file's existence fails when the file is empty. | Gemini | Revise P36: "...use line 1 and quote the first line, or an empty quote if the file is zero bytes." |

Not proposed for decision: tagging each red flag as (code) or (people) was raised a fifth time and stays deferred. Gemini again asked for a ban on absence red flags (declined in round 6), a stricter sampling rule (the rule from round 6 already covers it), and removal of the evidence-to-request lists from the generated prompt (those lists tell the agent what to report as needing people evidence).

---

## 3. Decisions for this round

| # | Decision | Status |
|---|---|---|
| 1 | Prompt changes P41 to P48 | **Decided:** accept all eight |
| 2 | Check level changes for 114, 115, 118, 122 and 123 | **Decided:** accept all five |
| 3 | New concerns suggested in this round | **Decided:** add none. Security headers and security testing stay as post-release candidates. The checklist stays at 115 concerns |
| 4 | The 138 content edits in section 4 | Open |
| 5 | Round status and the expert review plan | Open |

### Suggested additions this round (about 40 suggestions, 21 distinct)

| Tier | Concern | Suggested by | Where it goes |
|---|---|---|---|
| Consider | Security headers and content security policy | Both agents (also in round 1) | Partly covered already: HSTS in 71, content security policy in 79, CORS in 76. New concern, or stay folded. |
| Consider | Security testing in the pipeline (static and dynamic analysis) | Both agents (also in round 1) | Partly covered: 6, 108 and 111. 112 mentions static analysis only in passing. New concern, or stay folded. |
| Fold | Certificate and credential expiry | Opus | 71 already has "certificates renewed by hand" and "automated renewal with expiry alerts", and 125 covers configuration |
| Fold | Load shedding and admission control | Both agents | 44 (done in round 3) |
| Fold | Graceful shutdown and connection draining | Both agents (again) | 54, 57, 8 and 45 (already folded) |
| Fold | Static stability and failure domains | Opus, Gemini | 86 (in the edits), 83 and 85 |
| Fold | Incident response and on-call | Opus (again) | Held since round 1, removed earlier as organizational |
| Fold | Data retention and deletion | Opus | 115 (in the edits) |
| Fold | Database roles and least privilege | Opus | 68 (folded in round 2) |
| Fold | Database engine versions and end of life | Opus | The supply chain concern (111) |
| Fold | Reconciliation and integrity checks | Opus, Gemini | 84 and 18 (already folded) |
| Fold | Transactional outbox and dual writes | Gemini | 18 (suggested in four rounds) |
| Fold | Read-after-write consistency | Gemini | 29, 32, 35 and 86 (in the edits) |
| Fold | Cascading failure and retry storms | Gemini | 10, 12 and 121 |
| Fold | Key management and rotation | Opus | 67, 70 and 72 |
| Fold | Privileged and production access | Opus | 68 and 113 |
| Hold | File upload handling | Opus | Held since round 1 (112 covers path traversal) |
| Hold | AI and LLM feature security | Opus | Held since round 1 |
| Hold | Business logic abuse and fraud | Opus | 1 and 110 cover the main controls |
| Hold | Scheduled jobs and batch reliability | Opus | Removed earlier by you (cron jobs) |
| Hold | Encoding, collation and data types | Opus | Backlog, as a possible addition to 118 |

---

## 4. Proposed content edits by concern

### 84. Backups

**how_it_works** (Gemini, Opus). Accept.

Both agents: restore time was missing, and Opus and Gemini both rated key protection critical or major: a cross-account copy encrypted with a source-account key fails if that account is compromised.

Now:

> Backups are copies of data stored separately so it can be restored after loss or corruption. A good setup defines what is backed up, how often (or, with point-in-time recovery, how often logs are shipped), which sets the recovery point, where copies are kept, for how long, and who can delete them. Backups of related data stores taken at different moments may not restore to a consistent state, and backups are only usable while their encryption keys exist. A backup counts only if a restore has been tested.

Proposed:

> Backups are copies of data stored separately so it can be restored after loss or corruption. A good setup defines what is backed up, how often (or, with point-in-time recovery, how often logs are shipped), the longest acceptable restore time, where copies are kept, for how long, and who can delete them. Measure restore time in every test. Backups of related stores taken at different moments may not restore consistently, and backups work only while their keys exist, so keep a key in the backup account and protect it from deletion. A backup counts only if a restore has been tested.

**red_flags** (Opus). Accept.

The old flag mixed two conditions and read as if any same-region copy is a problem.

Add or change to:

- No backup copy outside the source account and region, or every copy deletable with production credentials

Replace or remove:

- Backups in the same account or region as the data, with the same credentials

**good_looks_like** (Opus). Accept.

Compliance-mode locks cannot be undone, even by the account root.

Add or change to:

- Backups immutable for their retention period and surviving deletion of the source resource, with retention reviewed before compliance-mode locks are applied

Replace or remove:

- Backups immutable for their retention period and surviving deletion of the source resource

**review_question** (Gemini). Accept.

The old question asked three things.

Now:

> What is backed up, how often, and when did you last restore it?

Proposed:

> What evidence shows that restores from this data store succeed within the recovery time and recovery point targets?

**search_hints** (Gemini, Opus). Accept.

Gemini: pg_dump and mongodump are logical dump tools, not continuous backups. Opus: non-AWS and non-Postgres stacks looked like they had no backups.

Add: `point_in_time_recovery_enabled`, `backup_configuration`, `geo_redundant_backup_enabled`, `DeletionPolicy`

Remove: `point_in_time_recovery`, `azurerm_backup_policy`, `pg_dump`, `mongodump`

**related** (Opus). Accept.

Key availability (67) and retention (115). I dropped 32 to stay within four.

Add: `67`, `115`

Remove: `32`

### 85. Failover

**how_it_works** (Gemini, Opus). Accept.

Gemini rated the missing failback rule critical: automatic failback to a recovered primary causes cascading failovers and split-brain. Opus: standby capacity and in-flight requests.

Now:

> Failover moves service from a failed component to a standby, whether a database primary, a server or a whole region. It can be automatic or manual. A reliable design detects failure accurately, promotes only one standby, redirects clients, and avoids two nodes both acting as primary. With asynchronous replication, writes not yet copied to the standby are lost when it is promoted. After failover, the old primary must be fenced and rebuilt or rewound as a replica, never simply restarted.

Proposed:

> Failover moves service from a failed component to a standby, such as a database primary, a server or a region. It can be automatic or manual. A reliable design detects failure accurately, promotes only one standby, redirects clients, and avoids two nodes both acting as primary. The standby must carry full load, and requests in flight fail during the switch, so clients need safe retries. With asynchronous replication, writes not yet copied are lost on promotion. After failover, the old primary must be fenced and rebuilt as a replica, never simply restarted, and automatic failback should be off.

**red_flags** (Opus). Accept.

A standby that shares the primary's failure domain or lacks its capacity is visible in infrastructure code.

Add or change to:

- Failover never exercised outside an incident (see 87)
- A standby in the same zone, host or rack as the primary, or smaller than the primary

Replace or remove:

- Failover never exercised outside an incident

**good_looks_like** (Opus). Accept.

An unplanned failover on asynchronous replication loses acknowledged writes, and the flapping flag had no matching good practice.

Add or change to:

- Failover tested regularly, with planned switchover in production and forced failover in non-production, recording recovery time and lost writes
- Failure detection that needs several consecutive failed checks, with a cooldown and a limit on automatic failovers

Replace or remove:

- Failover tested regularly, with the observed recovery time recorded

**undefined** (Opus). Accept.

Data loss comes from asynchronous replication, not from automation.

Now:

> Automatic failover shortens outages but risks false triggers and data loss.

Proposed:

> Automatic failover shortens outages but risks false triggers. With asynchronous replication, any failover can lose recent writes.

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> Is failover automatic or manual, and how is split-brain avoided?

Proposed:

> How does the architecture prevent split-brain and false promotions during failover?

**search_hints** (Gemini, Opus). Accept.

promote, sentinel and fencing are generic and match marketing, build promotion and Microsoft Sentinel.

Add: `pg_promote`, `sentinel monitor`, `high_availability`, `group_replication`

Remove: `sentinel`, `promote`, `fencing`

**related** (Opus). Accept.

Replication mode decides failover data loss (32). I dropped 56 to stay within four.

Add: `32`

Remove: `56`

### 86. Multi-region deployment

**how_it_works** (Gemini, Opus). Accept.

Both agents: replication lag and read-your-own-writes in a single write region. Opus: static stability.

Now:

> Multi-region deployment runs the application in more than one cloud region, either active-active (all serve traffic) or active-passive (one waits). It gives resilience against a regional outage and lower latency for distant users, but data replication across regions makes consistency, cost and operations harder. Accepting writes in several regions needs a rule for conflicting writes, and last writer wins can silently lose data. Data residency rules may limit which regions can hold copies. Deploy to one region at a time so a bad release cannot take down every region.

Proposed:

> Multi-region deployment runs the application in more than one cloud region, either active-active (all serve traffic) or active-passive (one waits). It protects against a regional outage and lowers latency, but replication makes consistency, cost and operations harder. Accepting writes in several regions needs a rule for conflicting writes, and last writer wins can silently lose data. Local reads from a single write region can be stale. Recovery should rely on capacity and routing already in place, not on control plane calls that may fail in a regional event. Deploy one region at a time.

**decide_between** (Opus). Accept.

The old text omitted replication lag, the main design cost of this option.

Now:

> Active-passive, active-active with one write region, or active-active with writes everywhere. Active-passive is simpler and cheaper, with a slower and riskier switch. One write region serves reads locally without write conflicts, but writes still depend on that region. Writes everywhere gives the fastest recovery but needs data designed for conflicting writes.

Proposed:

> Active-passive, active-active with one write region, or active-active with writes everywhere. Active-passive is simpler and cheaper, with a slower and riskier switch. One write region serves reads locally without write conflicts, but local reads can be stale and writes still depend on that region. Writes everywhere gives the fastest recovery but needs data designed for conflicting writes.

**red_flags** (Opus). Accept.

"Data in one region" conflicted with the one write region option, which is valid when data is replicated.

Add or change to:

- Application in several regions but data with no replica outside one region
- Releases or configuration changes pushed to every region at once
- A secondary region without the capacity or quota to take full load

Replace or remove:

- Application deployed in several regions but data in one

**search_hints** (Gemini, Opus). Accept.

Both agents: region strings match every single-region repository, and global accelerator and global table contain spaces. azurerm 4 renamed the multiple write locations setting.

Add: `aws_globalaccelerator_accelerator`, `aws_dynamodb_global_table`, `multiple_write_locations_enabled`, `latency_routing_policy`, `aws_s3_bucket_replication_configuration`, `geo_location`

Remove: `global accelerator`, `enable_multiple_write_locations`, `global table`, `us-east-`, `eu-west-`, `eastus`, `westeurope`, `europe-west`

**related** (Opus). Accept.

Replication (32) and residency (115). I dropped 35 and 96 to stay within four.

Add: `32`, `115`

Remove: `35`, `96`

### 87. Chaos engineering

**applies_when** (Opus). Accept.

Putting monitoring in the condition let a system with poor monitoring be marked not applicable and hide two gaps.

Now:

> Applies when the system relies on resilience mechanisms such as failover, retries or breakers, and has monitoring good enough to see the effect of an experiment.

Proposed:

> Applies when the system relies on resilience mechanisms such as failover, retries or breakers. If monitoring cannot show the effect of an experiment, fix that first.

**how_it_works** (Opus). Accept.

Network rules left behind, or a role able to stop any instance, can cause an outage outside the blast radius.

Now:

> Chaos engineering injects controlled failures, such as killing instances, adding latency or cutting a dependency, to check that the system behaves as designed. Each experiment defines a measurable steady state and a hypothesis, starts in a non-production environment, limits the blast radius, stops automatically when a key alarm fires, and ends with fixes for what was found. Production runs come later, with on-call informed.

Proposed:

> Chaos engineering injects controlled failures, such as killing instances, adding latency or cutting a dependency, to check that the system behaves as designed. Each experiment defines a measurable steady state and a hypothesis, starts in a non-production environment, limits the blast radius, stops automatically when a key alarm fires, and ends with fixes for what was found. Faults must clear automatically if the experiment or its agent stops, and the experiment role should reach only tagged targets. Production runs come later, with on-call informed.

**red_flags** (Gemini, Opus). Accept.

Gemini rated the manual-stop wording critical: production experiments need automated abort conditions.

Add or change to:

- Experiments with no automatic stop condition tied to latency or error alarms, or targets not limited by tag or percentage

Replace or remove:

- Experiments run with no way to stop them quickly

**good_looks_like** (Gemini, Opus). Accept.

how_it_works required an automatic stop, but the good practice only asked for the ability to stop.

Add or change to:

- Stop conditions tied to alarms, plus a manual stop

Replace or remove:

- Ability to stop an experiment immediately

**search_hints** (Opus). Accept.

chaos monkey, fault injection and game day contain spaces and rarely appear in code. The stop condition settings that matter most were missing.

Add: `StressChaos`, `stop_condition`, `chaosmonkey`, `ChaosExperiment`

Remove: `gremlin`, `chaos monkey`, `fault injection`, `game day`

**ownership** (Opus). Accept.

The architect sets the policy (non-production first, abort conditions, approval for production) and teams run experiments.

Change from `own` to `guardrail`.

### 95. Network partitions

**definition** (Opus). Accept.

Large overlap with the CAP theorem concern, and the difference was not stated.

Now:

> Network failures splitting a system into isolated groups.

Proposed:

> Network failures splitting a system into isolated groups, and the settings that decide what each side does. See 34 for theory.

**how_it_works** (Gemini, Opus). Accept.

Both agents: quorum sizing and tiebreakers. Opus: the choice falls mainly on the side without a quorum.

Now:

> A network partition splits a system so some nodes cannot reach others while all keep running. Each component then has to choose how to behave: stop serving to protect consistency, or keep serving and risk conflicts. The design should decide this for each data set and test it. Partitions are often partial or one-way, and a timeout cannot tell a partition from a slow or crashed peer. A leader cut off from the others may keep acting as leader, so writes should carry a fencing token that storage checks.

Proposed:

> A network partition splits a system so some nodes cannot reach others while all keep running. The side without a quorum then has to choose: stop serving writes to protect consistency, or keep serving and risk conflicts. Quorum systems need an odd number of voters or a tiebreaker. Design this per data set and test it. Partitions are often partial or one-way, and a timeout cannot tell a partition from a slow or crashed peer. A leader cut off from the others may keep acting as leader, so writes should carry a fencing token that storage checks.

**red_flags** (Opus). Accept.

The most common code-visible partition risks: writes acknowledged before a majority has them, and clusters that cannot form a majority.

Add or change to:

- A cluster setting that lets both sides of a partition keep accepting writes, such as RabbitMQ partition handling left on ignore
- Writes acknowledged by one node, such as acks=1, w: 1, min.insync.replicas=1 or unclean leader election on
- Two-node or even-sized clusters with no tiebreaker

Replace or remove:

- A cluster setting that lets both sides of a partition keep accepting writes, such as partition handling left on ignore

**search_hints** (Gemini, Opus). Accept.

raft matches draft and aircraft, consensus is generic, and a quorum queue hint will not match code written as a map.

Add: `x-queue-type`, `pause_minority`, `hashicorp/raft`, `etcd-io/raft`, `synchronous_standby_names`, `minimum_master_nodes`, `readConcern`

Remove: `quorum`, `x-queue-type: quorum`, `raft`, `etcd`, `consensus`

**related** (Opus). Accept.

Fencing and split-brain tie this to 38 and 85, and testing to 87.

Add: `38`, `85`, `87`

Remove: `33`, `35`

### 96. Clock skew

**how_it_works** (Opus). Accept.

Monotonic readings cannot be compared across machines.

Now:

> Clock skew is the difference between the clocks of different machines. Logic that compares timestamps from different machines, such as expiry, ordering, locks and token validity, can go wrong when clocks differ. Systems reduce the risk with synchronized time, tolerances, and logical clocks or version numbers. A single machine’s clock can also jump when time synchronization corrects it or a virtual machine pauses, so measure durations and timeouts with a monotonic clock, not the wall clock.

Proposed:

> Clock skew is the difference between the clocks of different machines. Logic that compares timestamps from different machines, such as expiry, ordering, locks and token validity, can go wrong when clocks differ. Systems reduce the risk with synchronized time, tolerances, and logical clocks or version numbers. A single machine’s clock can also jump when synchronization corrects it or a virtual machine pauses, so measure durations with a monotonic clock, whose readings only mean something on the machine that took them.

**red_flags** (Opus). Accept.

A margin cannot fix lease logic, because process pauses and clock jumps defeat any margin. Managed hosts sync time for you.

Add or change to:

- A lock or lease that protects writes with no fencing token, relying only on expiry time
- No time synchronization on self-managed hosts

Replace or remove:

- Lock or lease expiry based on local time with no safety margin
- No time synchronization on servers

**good_looks_like** (Gemini). Accept.

Gemini: a multi-minute tolerance lets expired tokens through. This tightens my round 3 wording, which said seconds to a few minutes.

Add or change to:

- A small tolerance on token and certificate checks, usually seconds and not minutes, chosen deliberately

Replace or remove:

- A small tolerance on token and certificate checks, seconds to a few minutes, chosen deliberately

**search_hints** (Gemini, Opus). Accept.

Gemini rated Redlock critical: it relies on wall-clock expiry across nodes and is unsafe under skew and pauses without fencing. Opus: ntp matches inside many identifiers.

Add: `process.hrtime`, `CLOCK_MONOTONIC`, `Stopwatch`, `ntp.conf`, `chronyd`, `pool.ntp.org`

Remove: `Redlock`, `fencing`, `chrony`, `ntp`

**ownership** (Opus). Accept.

Time sync is platform configuration and token tolerance is team detail.

Change from `own` to `guardrail`.

### 109. Application authorization

**how_it_works** (Opus). Accept.

Opus: property-level access (OWASP API3) was missing, and trusting client-supplied roles.

Now:

> Authorization checks whether the caller may perform this action on this specific resource. Checks must run on the server for every request, as close to the data as possible, not only in the interface. Common models are roles, attributes and relationships. The usual failures are endpoints with no check, identifiers taken from the request so one user can read another’s record, and a gap between what the interface hides and what the API allows. Rules should be central, testable and deny by default.

Proposed:

> Authorization checks whether the caller may perform this action on this specific resource, and on each field of it. Checks must run on the server for every request, close to the data, not only in the interface. Common models are roles, attributes and relationships. Typical failures are endpoints with no check, identifiers or roles taken from the request so one user can read another’s record or set their own role, and a gap between what the interface hides and what the API allows. Rules should be central, testable and deny by default.

**red_flags** (Opus). Accept.

Adds mass assignment and client-supplied roles. To stay within six flags I dropped "permissions checked once at login".

Add or change to:

- Resource ids, roles or tenant values taken from the request instead of the verified session or token
- Request bodies bound directly to models, so a caller can set fields such as role, owner or tenant

Replace or remove:

- Resource ids taken from the request and used with no ownership or tenant check
- Permissions checked once at login and never again for long-lived sessions

**search_hints** (Gemini, Opus). Accept.

Both agents: tenant_id and owner_id appear in almost every schema. Opus: the exception markers that open holes in deny by default are the most useful things to find. I kept [Authorize without its closing bracket on purpose, so it also matches attribute arguments.

Add: `[AllowAnonymous`, `@PermitAll`, `permitAll()`, `AllowAny`, `skip_authorization`, `skip_before_action :authenticate`, `openfga`

Remove: `cancancan`, `verify_authorized`, `tenant_id`, `owner_id`

### 110. Authentication and session management

**how_it_works** (Opus). Accept.

Opus: current NIST guidance and credential stuffing were missing.

Now:

> Authentication verifies identity, for example with a password, a passkey, a one-time code or a federated sign-in. After it succeeds, the system issues a session or token that stands in for the user. That proof must be hard to steal and guess: random identifiers, Secure and HttpOnly cookies, expiry, rotation after login and privilege change, and server-side revocation. Passwords need slow hashing, and sensitive actions need a second factor. Account recovery is part of authentication and is often the weakest path.

Proposed:

> Authentication verifies identity with a password, passkey, one-time code or federated sign-in. After it succeeds, the system issues a session or token that stands in for the user. That proof must be hard to steal and guess: random identifiers, Secure and HttpOnly cookies, expiry, rotation after login and privilege change, and server-side revocation. Passwords need slow hashing, a breached-password check and protection against credential stuffing, without complexity rules or forced changes. Sensitive actions need a second factor. Recovery is part of authentication and often the weakest path.

**red_flags** (Gemini, Opus). Accept.

Opus: account enumeration is not limited to reset, and MFA is most often bypassed through recovery. Gemini: privileged accounts on a single factor. I merged the reset-link and session fixation flags into others to stay within six.

Add or change to:

- Sessions that never expire, are not ended on logout and password change, or keep the same identifier after login
- No limit or delay on repeated login failures, or no defense against credential stuffing
- Login, signup or password reset responses that reveal whether an account exists
- Multi-factor authentication that can be skipped through recovery or a weaker fallback factor, or privileged accounts protected by a single factor

Replace or remove:

- Sessions that never expire or are not ended on logout and password change
- No limit or delay on repeated login failures
- Password reset links that do not expire or reveal whether an account exists
- Session identifier not changed after login

**good_looks_like** (Opus). Accept.

SameSite=None satisfies the old wording, and a slow algorithm with a low work factor still fails.

Add or change to:

- Passwords hashed with Argon2id, scrypt, bcrypt or PBKDF2 at a current work factor, or handled by a managed identity provider or passkeys
- Session cookies marked Secure and HttpOnly, with SameSite set to Lax or Strict, no broader Domain than needed, and sensible expiry and rotation

Replace or remove:

- Passwords hashed with a slow, salted algorithm, or handled by a managed identity provider or passkeys
- Cookies marked Secure, HttpOnly and SameSite, with sensible expiry and rotation

**decide_between** (Opus). Accept.

The common middle ground and the backend for frontend pattern were missing.

Now:

> Server-side sessions or signed tokens. Server-side sessions are easy to revoke and keep data off the client, but need shared storage. Signed tokens avoid a lookup and suit service calls, but cannot be revoked before they expire unless a deny list is kept. Browser apps are usually better served by cookies than by tokens in local storage.

Proposed:

> Server-side sessions or signed tokens. Server-side sessions are easy to revoke and keep data off the client, but need shared storage. Signed tokens avoid a lookup and suit service calls, but cannot be revoked before they expire. A middle ground is short-lived access tokens with rotated, revocable refresh tokens, and browser apps can keep tokens on a server and use a session cookie.

**review_question** (Opus). Accept.

The old question asked three things and never mentioned recovery.

Now:

> How are users authenticated, how long do sessions last, and how are they revoked?

Proposed:

> How can a user’s session or account be taken over, through login, recovery or a stolen session, and what stops each path?

**search_hints** (Opus). Accept.

regenerate_session is not a common API name, and HttpOnly and SameSite are written in camel case in many JavaScript frameworks.

Add: `httpOnly`, `sameSite`, `session_regenerate_id`, `session.regenerate`, `reset_session`, `SESSION_COOKIE_HTTPONLY`, `Rfc2898DeriveBytes`

Remove: `express-session`, `SESSION_COOKIE_SECURE`, `passkey`, `password_hash`, `regenerate_session`

**related** (Opus). Accept.

Repeated login failures depend on rate limiting (1). I dropped 77 to stay within four.

Add: `1`

Remove: `77`

### 111. Software supply chain security

**how_it_works** (Opus). Accept.

Opus: dependency confusion, install scripts and untrusted pull request pipelines were missing, and pinning duplicated 108.

Now:

> The supply chain covers everything between source and running system: dependencies, build tools, pipelines, base images and artifacts. Controls include pinning dependencies, actions and images to exact versions or digests, building in a controlled environment, recording how an artifact was built (provenance), listing its contents in a software bill of materials, and verifying signatures before deploy. It also covers patching: runtimes, frameworks and base images that no longer receive fixes, and how fast critical fixes are applied.

Proposed:

> The supply chain covers everything between source and running system: dependencies, build tools, pipelines, base images and artifacts. Controls include building in a controlled pipeline, recording how an artifact was built (provenance), listing its contents in a software bill of materials, signing it, and verifying the signer before deploy. Common attacks use lookalike package names, internal names claimed on a public registry, install scripts, and pipelines that run untrusted pull request code with secrets. Pipeline tokens need least privilege. Pinning and updates are in 108.

**red_flags** (Opus). Accept.

Version ranges in a manifest are normal when a lockfile is installed frozen, so the flag now targets mutable tags and missing lockfiles.

Add or change to:

- Base images or CI actions referenced by mutable tags, or dependencies installed without a committed lockfile
- Images or packages deployed with no check of the signer or digest

Replace or remove:

- Dependencies, base images or CI actions referenced by mutable tags or version ranges
- Images or packages deployed with no signature or digest check

**good_looks_like** (Opus). Accept.

Tags are mutable, and keyless signing verified without a constraint on signer identity accepts artifacts signed by anyone.

Add or change to:

- Dependencies installed from a committed lockfile, base images pinned by digest, and CI actions pinned to a full commit hash
- Deploys verify that signatures come from the expected build identity and that provenance names the expected source and pipeline

Replace or remove:

- Dependencies and base images pinned by version or digest and updated through reviewed changes
- Deploys verify signatures or digests

**search_hints** (Opus). Accept.

spdx matches SPDX-License-Identifier headers in source files, and notation and attestation are common words.

Add: `cosign verify`, `spdxVersion`, `.spdx.json`, `attest-build-provenance`, `verifyImages`, `--require-hashes`, `pull_request_target`

Remove: `spdx`, `attestation`, `grype`, `dependabot.yml`, `renovate.json`, `notation`

### 112. Other injection and deserialization

**how_it_works** (Opus). Accept.

Dynamic evaluation, expression languages, prototype pollution and header injection were missing.

Now:

> Injection happens when input is mixed into something an interpreter executes: an operating system command, a template, an LDAP or NoSQL query, an XML parser, a file path or a serialized object. The interpreter cannot tell data from instructions. Safe patterns pass input as parameters, use allow lists, avoid shell calls and string-built queries, turn off dangerous parser features and never deserialize untrusted data into arbitrary types. SQL injection and cross-site scripting have their own concerns.

Proposed:

> Injection happens when input is mixed into something an interpreter runs: an operating system command, code passed to eval or an expression language, a template, an LDAP or NoSQL query, an XML parser, a file path, an HTTP header or a serialized object. Safe patterns pass input as parameters, use allow lists, avoid shell calls and string-built queries, turn off dangerous parser features and never deserialize untrusted data into arbitrary types. In JavaScript, merging request objects into other objects can change shared prototypes. SQL injection and cross-site scripting have their own concerns.

**red_flags** (Opus). Accept.

Normalizing a path without checking it stays inside the base directory still allows traversal, and symbolic links can escape it.

Add or change to:

- Templates rendered from user-supplied template text, or input passed to eval
- File paths built from user input without resolving the full path and checking it stays inside an allowed directory

Replace or remove:

- Templates rendered from user-supplied template text
- File paths built from user input with no normalization or allow list

**good_looks_like** (Opus). Accept.

An argument list without a shell still allows argument injection, and JSON with polymorphic type handling enables gadget-chain attacks.

Add or change to:

- Process calls avoided, or made with argument lists and no shell, with user values placed after a -- separator and checked against an allow list
- Deserialization limited to plain data formats with type information from the payload turned off, or to allow-listed types

Replace or remove:

- Process and shell calls avoided, or made with argument lists and no shell
- Deserialization limited to plain data formats, or to allow-listed types

**search_hints** (Gemini, Opus). Accept.

Both agents: $where matches ordinary variables. Opus: most of the stated scope could not be found with the old hints.

Add: `exec.Command(`, `shell_exec`, `eval(`, `new Function(`, `TypeNameHandling`, `enableDefaultTyping`

Remove: `yaml.load`, `unserialize(`, `XMLInputFactory`, `$where`, `shell=True`

### 113. Security logging and audit trails

**how_it_works** (Opus). Accept.

Log injection was missing, and the clock requirement now points to 96.

Now:

> Security logs record who did what, to what, when and from where, for events that matter: sign-ins and failures, permission changes, access to sensitive data, administrative actions and configuration changes. Audit trails must be tamper resistant, kept apart from application debug logs, retained for a defined period and reviewed or alerted on. Entries must not contain secrets or more personal data than needed. Clocks must be synchronized so events from different systems can be ordered.

Proposed:

> Security logs record who did what, to what, when and from where, for events that matter: sign-ins and failures, permission changes, access to sensitive data, administrative actions and configuration changes. Audit trails must be tamper resistant, kept apart from application debug logs, retained for a defined period and reviewed or alerted on. Entries must not contain secrets or more personal data than needed, and user input in them must be encoded. Clocks must be synchronized (see 96) so events from different systems can be ordered.

**red_flags** (Opus). Accept.

A logging pipeline that silently stops leaves a gap found only during an investigation. Retention also conflicts with data minimization if it is too long.

Add or change to:

- Secrets, tokens, session identifiers or full card numbers written to security logs
- User input written to audit entries without encoding line breaks and control characters
- No alert on repeated failures or privileged actions, or when audit events stop arriving
- Retention shorter than the legal or investigative need, or longer than the purpose allows for personal data

Replace or remove:

- Secrets, tokens or full card numbers written to security logs
- No alerting on repeated failures or privileged actions
- Retention shorter than the legal or investigative need
- Events with no user, source address or timestamp

**good_looks_like** (Opus). Accept.

Write-once retention in compliance mode cannot be shortened, so a wrong value locks in cost and can block erasure duties.

Add or change to:

- Audit logs in append-only or write-once storage in a separate account that administrators cannot change, with retention set deliberately

Replace or remove:

- Audit logs written to append-only or write-once storage, separate from application logs

**review_question** (Opus). Accept.

The old question asked three things.

Now:

> Which security events are recorded, who can alter or read them, and who is alerted?

Proposed:

> Could you reconstruct who did what during a security incident from records that the people involved cannot alter?

**search_hints** (Opus). Accept.

CloudTrail is AWS only and LoginFailed is not a standard name.

Add: `google_project_iam_audit_config`, `azurerm_monitor_diagnostic_setting`, `AuthenticationFailureBadCredentialsEvent`, `user_login_failed`, `paper_trail`, `Envers`

Remove: `SecurityEvent`, `LoginFailed`, `AuditEvent`, `AuditTrail`

**related** (Opus). Accept.

Clock synchronization is covered by 96 and personal data in logs by 115.

Add: `96`, `115`

Remove: `109`, `110`

### 114. Threat modeling

**definition** (Opus). Accept.

"Before building it" excluded systems already in production, the usual case at a readiness review.

Now:

> Working out how a system could be attacked and deciding what to do about it before building it.

Proposed:

> Working out how a system could be attacked and deciding what to do about it, first at design time and again as it changes.

**how_it_works** (Opus). Accept.

STRIDE was used without explanation.

Now:

> Threat modeling is a structured look at a design: what the system holds and does, who might attack it and how, what controls exist, and what is left uncovered. Teams draw the data flows, mark trust boundaries, ask what could go wrong at each step using a method such as STRIDE, rank findings by impact and likelihood, and record decisions. It is done at design time and repeated when the design changes, because fixing a flaw in a diagram is far cheaper than fixing it in production.

Proposed:

> Threat modeling is a structured look at a design: what the system holds and does, who might attack it and how, what controls exist, and what is left uncovered. Teams draw data flows and trust boundaries, ask what could go wrong at each step using a method such as STRIDE (spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege) or LINDDUN for privacy, rank findings by impact and likelihood, and record decisions. It is done at design time and repeated when the design changes.

**good_looks_like** (Gemini, Opus). Accept.

Gemini: mitigate, accept, transfer or avoid are the standard terms. Opus: accepted risks need a named approver and a review date.

Add or change to:

- Threats listed with a decision for each: mitigate, remove by design, transfer or accept, with accepted risks signed off by a named owner and given a review date

Replace or remove:

- Threats listed with a decision for each: fix, accept or transfer

**agent check level** (Opus). Accept.

Threat models are often kept in the repository, so an agent can confirm one exists and when it last changed. Opus rated this low confidence.

Change from `people` to `partial`.

**search_hints** (Opus). Accept.

Hints for threat model files. Quality still needs people evidence.

Add: `threat-model`, `threatmodel`, `.tm7`, `threagile`, `pytm`, `STRIDE`, `LINDDUN`, `threat_model.md`

### 115. Data classification and privacy

**how_it_works** (Opus). Accept.

Purpose limitation, minimization and processors, including analytics and AI services, were missing.

Now:

> Classification labels data by sensitivity, for example public, internal, confidential and regulated, and ties each label to rules for storage, access, encryption, logging and sharing. Privacy adds legal duties: a lawful reason to collect personal data, limits on retention, rights to access and delete, limits on moving data between countries, and notice when it leaks. These rules reach backups, logs, analytics copies, test data and messages, which are often forgotten. Soft deletes and retention need an explicit policy, because data kept forever is a liability.

Proposed:

> Classification labels data by sensitivity and ties each label to rules for storage, access, encryption, logging and sharing. Privacy adds legal duties: collect only what a stated purpose needs and use it only for that, keep it no longer than needed, honor access and deletion requests, limit transfers between countries, and give notice of leaks. Every vendor that receives personal data, including analytics scripts and AI services, needs a contract and an inventory entry. These rules reach backups, logs, analytics copies, test data and messages.

**red_flags** (Opus). Accept.

Read literally, "deletion that reaches backups" pushes teams to edit backups. Common practice is to let backups expire and re-apply deletions after a restore.

Add or change to:

- No retention period, or deleted data that can return through copies or a backup restore (backups should expire on a schedule and deletions be re-applied)

Replace or remove:

- No retention period, or deletion that does not reach backups, replicas and copies

**good_looks_like** (Opus). Accept.

A red flag covered missing request handling but no good practice described it.

Add or change to:

- Access and deletion requests handled through a defined process that reaches every store in the inventory, within legal deadlines

**related** (Opus). Accept.

Residency ties to multi-region (86) and tenant separation to 120.

Add: `86`, `120`

Remove: `113`, `114`

**agent check level** (Opus). Accept.

Retention jobs, TTL settings, masking in seed scripts and log redaction filters can be seen in code.

Change from `people` to `partial`.

**search_hints** (Opus). Accept.

Hints for retention, masking and request handling in code.

Add: `retention_in_days`, `retention_period`, `expireAfterSeconds`, `@PersonalData`, `data_classification`, `anonymize`, `DataSubjectRequest`, `faker`, `delete_user_data`

### 116. Service-to-service authentication

**applies_when** (Gemini, Opus). Accept.

Both agents: a monolith cannot be marked not_applicable without this line.

Now:

> undefined

Proposed:

> Applies when the system has more than one service, or calls internal services or functions over a network.

**how_it_works** (Opus). Accept.

Opus: audience checks, the confused deputy problem, and that authenticating a caller is not authorizing it. Softened "the network is not a trust boundary".

Now:

> Inside a system, services call each other, and each call needs proof of who is calling and a rule for what that caller may do. Common approaches are mutual TLS with certificates issued to each workload, signed tokens from a trusted identity service, and platform identities such as cloud roles. The network is not a trust boundary: a request that skips the gateway or carries a forged identity header must be rejected. Credentials should be short lived and rotated automatically, and each service should be allowed to call only what it needs.

Proposed:

> Inside a system, services call each other, and each call needs proof of who is calling and a rule for what that caller may do. Common approaches are mutual TLS with certificates issued to each workload, signed tokens from a trusted identity service, and platform identities such as cloud roles. Network location alone is not proof of identity: a request that skips the gateway or carries a forged identity header must be rejected. Tokens must name the service they are meant for, and a call made for a user should carry a token for that user and service, not a broad service token.

**red_flags** (Opus). Accept.

Header forwarding is the most common way to forge internal identity. I merged the rotation and no-authentication flags into the shared-credentials one.

Add or change to:

- A gateway that forwards identity headers sent by the client instead of removing and setting them
- Internal tokens accepted without checking which service they were issued for

Replace or remove:

- Calls between services with no authentication or authorization
- Certificates or tokens that never rotate or expire

**good_looks_like** (Opus). Accept.

A mesh in permissive mode, the Istio default, still accepts plain text, and strict mTLS with no authorization policy lets every workload call every other.

Add or change to:

- Every internal call authenticated, with mutual TLS in strict mode or workload identity, and an explicit rule saying which callers each service accepts

Replace or remove:

- Every internal call authenticated, for example with mutual TLS or workload identity

**search_hints** (Opus). Accept.

ServiceAccount appears in nearly every Kubernetes repository, and SecurityPolicy matches Cloud Armor rules.

Add: `mode: STRICT`, `PERMISSIVE`, `kind: AuthorizationPolicy`, `iam.gke.io/gcp-service-account`, `eks.amazonaws.com/role-arn`, `azure.workload.identity`, `X-Forwarded-User`, `NetworkPolicy`, `audience`

Remove: `AuthorizationPolicy`, `workload identity`, `ssl_verify_client`, `client_auth`, `ServiceAccount`, `SecurityPolicy`

**related** (Opus). Accept.

IAM (68) and JWT validation (70). I dropped 73 and 109 to stay within four.

Add: `68`, `70`

Remove: `73`, `109`

### 117. Transaction isolation levels

**how_it_works** (Gemini, Opus). Accept.

Both agents: serializable is not always abort based, since MySQL and SQL Server lock. Opus: repeatable read differs by product, Oracle SERIALIZABLE is snapshot isolation, and defaults should be named.

Now:

> Isolation levels trade correctness against concurrency. Read committed, the default in many databases, lets a transaction see changes committed by others between its statements, so a read followed by a write can overwrite an update made in between (a lost update). Repeatable read and snapshot isolation avoid some anomalies but still allow write skew, where two transactions read overlapping data and write different rows that together break a rule. Serializable prevents these, at the cost of aborts the application must retry. Defaults differ by database.

Proposed:

> Isolation levels trade correctness against concurrency, and level names are not portable. Read committed, the default in PostgreSQL, SQL Server and Oracle, lets a transaction see changes committed by others between its statements, so a read then a write can overwrite an update made in between (a lost update). Repeatable read and snapshot isolation prevent some anomalies, but what they prevent depends on the database (MySQL InnoDB defaults to it and can still lose updates), and all can allow write skew. True serializable prevents these by aborting or locking, so the application must retry.

**good_looks_like** (Gemini, Opus). Accept.

Opus: retry the whole transaction, not the statement, and not after side effects. Both agents: most cross-row rules cannot be expressed as constraints.

Add or change to:

- Atomic statements, row locks or version checks used where lost updates matter (see 36 and 37)
- Retry of the whole transaction on serialization failures and deadlocks, with a limit and backoff, and no external side effects inside it
- Rules across rows enforced by serializable transactions, by locking a shared parent row, or by a unique or exclusion constraint where one fits

Replace or remove:

- Atomic statements, row locks or version checks used where lost updates matter
- Retry logic for serialization failures
- Rules across rows enforced by constraints or serializable transactions

**undefined** (Opus). Accept.

Raising isolation globally can cause lock contention and outages.

Now:

> Stronger isolation prevents subtle data bugs but lowers throughput and requires retries.

Proposed:

> Stronger isolation prevents subtle data bugs but lowers throughput and needs retries. Raise it per transaction and load test it first, because locking databases can block or deadlock.

**decide_between** (Gemini). Accept.

The concern had no decide_between.

Now:

> undefined

Proposed:

> Atomic updates, version checks, row locks or serializable isolation. Atomic updates and row locks suit contention on a few rows. Version checks suit rare conflicts. Serializable isolation suits rules that span several rows, at the cost of throughput and retries.

**search_hints** (Gemini, Opus). Accept.

40001 is a bare number, and READ COMMITTED SNAPSHOT needs underscores in SQL Server syntax.

Add: `select_for_update`, `with_for_update`, `PESSIMISTIC_WRITE`, `READ_COMMITTED_SNAPSHOT`, `SerializationFailure`, `could not serialize access`, `40P01`, `TransactionIsolationLevel`

Remove: `FOR SHARE`, `READ COMMITTED SNAPSHOT`, `40001`

**related** (Gemini, Opus). Accept.

Both agents: deadlocks (40) were missing. I dropped 36 to stay within four.

Add: `40`

Remove: `36`

**ownership** (Opus). Accept.

The architect sets the default level, the retry standard and which flows need stronger guarantees.

Change from `own` to `guardrail`.

### 118. Constraints, keys and integrity

**how_it_works** (Gemini, Opus). Accept.

Gemini rated the locking hazard critical. Opus: unique constraints do not make retries safe by themselves, and ids run out faster than row counts suggest.

Now:

> Constraints make the database refuse invalid data whichever application or script writes it. Primary keys identify rows, unique constraints stop duplicates and make retries safe, foreign keys keep relationships valid, and not null and check constraints enforce basic rules. Key choice matters: 32-bit integer ids run out, sequential ids are guessable, random UUIDs fragment indexes unless ordered, and sharded systems need globally unique ids. Constraints that exist only in application code fail when a second writer, a migration or a race appears.

Proposed:

> Constraints make the database refuse invalid data whichever application or script writes it. Primary keys identify rows, unique constraints stop duplicates and, with conflict handling in the application, let retried inserts be detected, foreign keys keep relationships valid, and not null and check constraints enforce basic rules. Adding a constraint to a large table can lock it. Key choice matters: 32-bit ids run out, often sooner than row counts suggest, sequential ids are guessable, random UUIDs scatter index writes unless time ordered, and sharded systems need globally unique ids.

**red_flags** (Opus). Accept.

Foreign keys cannot span databases or shards, constraints are not trusted until revalidated after loads, and an unindexed foreign key column makes parent deletes scan the child table.

Add or change to:

- Tables with no primary key, or relationships inside one database with no foreign key and no documented reason
- Constraints disabled to speed up loads and not revalidated against the loaded data afterwards
- Foreign key columns with no index, or ON DELETE CASCADE on large tables without review

Replace or remove:

- Tables with no primary key, or relationships with no foreign key
- Constraints disabled to speed up loads and never restored
- Free text columns holding values that should be constrained

**good_looks_like** (Opus). Accept.

Opus rated the old migration guidance critical: ALTER TABLE on a large table can take an exclusive lock, and changing an int key to bigint rewrites the table.

Add or change to:

- New constraints added by a safe migration: clean violating rows first, validate in a separate step, build unique indexes concurrently, widen ids in batches

Replace or remove:

- New constraints added with a safe migration, such as validating without long locks

**review_question** (Gemini). Accept.

The old question combined two topics.

Now:

> Which business rules does the database enforce itself, and how are ids generated?

Proposed:

> Which data integrity and business rules does the database enforce directly through constraints?

**search_hints** (Gemini, Opus). Accept.

Adds the literals behind the red flags: 32-bit id types, uniqueness only in the ORM, foreign keys switched off in the ORM, and time-ordered identifiers.

Add: `@@unique`, `validates_uniqueness_of`, `db_constraint=False`, `relationMode`, `DEFAULT_AUTO_FIELD`, `BigAutoField`, `uuidv7`, `ulid`, `NEWSEQUENTIALID`

Remove: `CHECK (`, `@Column(unique`, `UniqueConstraint`, `gen_random_uuid`, `AUTO_INCREMENT`, `BIGSERIAL`, `GENERATED ALWAYS AS IDENTITY`

**agent check level** (Gemini, Opus). Accept.

Both agents: how close ids are to their limit, whether constraints were revalidated after loads, and whether data quality checks find violations need runtime data.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- The current maximum id and growth rate for the largest tables with integer keys
- Results of recent data quality checks

**related** (Opus). Accept.

Guessable ids are safe only with object-level checks (109). I dropped 38 as a weak link.

Add: `109`

Remove: `38`

### 119. Database maintenance and growth

**how_it_works** (Gemini, Opus). Accept.

Opus rated the vacuum advice critical: VACUUM FULL and OPTIMIZE TABLE can cause an outage or fill the disk. Both agents: long-running transactions are the main reason maintenance falls behind.

Now:

> Databases need regular upkeep as data changes. Deleted and updated rows leave dead space that must be reclaimed, for example by vacuum in PostgreSQL, or tables and indexes bloat and slow down. Planner statistics must stay current so queries use good plans. Some databases have counters that can wrap around and force a shutdown if not managed. Storage, connections and log or backup volumes grow with data, and a full disk is a common outage. Growth should be projected, and old data archived or removed under a stated policy.

Proposed:

> Databases need regular upkeep as data changes. Deleted and updated rows leave dead space that routine maintenance, such as autovacuum in PostgreSQL, makes reusable, or tables and indexes bloat and slow down. Rewriting a table to return space, such as VACUUM FULL or OPTIMIZE TABLE, locks or rebuilds it, so test it first. Long-running transactions, idle sessions and unused replication slots stop cleanup and fill disks. Planner statistics must stay current, and some databases have counters that can run out, such as transaction ids in PostgreSQL. Archive old data under a stated policy.

**red_flags** (Opus). Accept.

Adds replication slots and points the capacity item to 124.

Add or change to:

- No alert on disk use, bloat, long-running transactions or unused replication slots
- No projection of when storage or other limits will be reached (see 124)

Replace or remove:

- No alert on disk use, bloat, long-running transactions or connections
- No projection of when storage or other limits will be reached

**good_looks_like** (Opus). Accept.

One large DELETE causes long locks and lag, and "work scheduled outside peak load" could lead teams to pause autovacuum.

Add or change to:

- An archive or purge policy for old data, applied in small batches or by dropping partitions, aligned with retention and legal holds, and tested
- Heavy manual maintenance tested and scheduled outside peak load, with autovacuum left running and tuned, not paused

Replace or remove:

- An archive or purge policy for old data, applied and tested
- Maintenance impact tested, with work scheduled outside peak load

**undefined** (Opus). Accept.

Storage autoscaling can cause a surprise bill, and allocated storage on some managed services cannot shrink.

Now:

> Aggressive maintenance keeps performance steady but uses capacity and can contend with traffic, so timing and tuning need care.

Proposed:

> Aggressive maintenance keeps performance steady but uses capacity and contends with traffic. Storage autoscaling prevents full disks but can raise cost, so set a maximum.

**review_question** (Opus). Accept.

The old question asked two things.

Now:

> How are database growth and maintenance monitored, and what happens when a limit is reached?

Proposed:

> Which database limit will this system reach first, when, and what alert and action are in place before it does?

**search_hints** (Gemini, Opus). Accept.

Gemini: the hints were mostly PostgreSQL. Opus: innodb_file_per_table and max_wal_size have low signal, and storage_autoscaling is not a real setting name.

Add: `max_allocated_storage`, `disk_autoresize`, `auto_grow_enabled`, `max_slot_wal_keep_size`, `idle_in_transaction_session_timeout`, `autovacuum_freeze_max_age`, `sp_updatestats`, `log_reuse_wait_desc`

Remove: `innodb_file_per_table`, `max_wal_size`, `pg_partman`, `storage_autoscaling`

**related** (Gemini, Opus). Accept.

Both agents: capacity planning (124). I dropped 25 to stay within four.

Add: `124`

Remove: `25`

**ownership** (Opus). Accept.

Vacuum and statistics tuning is DBA or platform detail. The architect sets retention, growth alerts and limits.

Change from `own` to `guardrail`.

### 120. Multi-tenant data isolation

**applies_when** (Opus). Accept.

A system with a separate deployment per customer can still share a log pipeline or search cluster.

Now:

> Applies when one deployment of the system serves more than one customer or organization.

Proposed:

> Applies when one deployment, or any shared component such as logging, analytics, search or support tooling, serves more than one customer or organization.

**how_it_works** (Gemini, Opus). Accept.

Both agents rated this critical: row-level security does not apply to the table owner or superusers unless forced, and tenant context in a session variable on a pooled connection can leak to the next request.

Now:

> In a multi-tenant system, several customers use the same application and often the same database. Isolation can be by database, by schema, or by a tenant column on shared tables. Stronger separation costs more to run, and weaker separation depends on every query carrying the tenant filter, so one missing filter shows a customer another’s data. Controls include enforcing the tenant in one central layer, database row-level security, tenant-scoped credentials, per-tenant keys and limits so one tenant cannot starve others. Caches, search indexes and logs must be tenant aware too.

Proposed:

> Several customers share one application and often one database. Isolation can be by database, by schema, or by a tenant column on shared tables. Weaker separation depends on every query carrying the tenant filter. Controls include one central enforcement layer, row-level security, tenant-scoped credentials and limits against noisy tenants. In PostgreSQL, the table owner and superusers skip row-level security unless it is forced, and tenant context kept on a pooled connection must be set per transaction. Caches, search indexes and logs must carry the tenant.

**red_flags** (Opus). Accept.

ORM global filters can be bypassed silently by raw SQL, IgnoreQueryFilters, unscoped or disabled Hibernate filters. The noisy tenant flag now points to 122.

Add or change to:

- Tenant filter added by hand in each query, or bypassed by raw SQL or filter overrides
- One tenant able to use all connections, storage or compute (see 122)

Replace or remove:

- Tenant filter added by hand in each query
- One tenant able to use all connections, storage or compute

**good_looks_like** (Opus). Accept.

Unique constraints should include the tenant id, and foreign keys should include it so a row cannot reference another tenant’s row.

Add or change to:

- Tenant context set once and enforced centrally, for example by row-level security that applies to the application’s role, or a scoped data layer
- Unique constraints and foreign keys that include the tenant id

Replace or remove:

- Tenant context set once and enforced centrally, for example by row-level security or a scoped data layer

**decide_between** (Gemini, Opus). Accept.

Both agents: schema per tenant breaks down at scale, and the common hybrid was missing.

Now:

> Separate databases, separate schemas or a shared schema with a tenant column. Separate databases give the strongest isolation and easy per-tenant backup, but cost more at scale. Schemas sit between. A shared schema is cheapest and simplest to scale, and depends fully on correct filtering.

Proposed:

> Separate databases, separate schemas or a shared schema with a tenant column. Separate databases give the strongest isolation and easy per-tenant backup, but cost more at scale. Schemas sit between and strain migrations and catalogs past a few thousand tenants. A shared schema is cheapest to scale and depends fully on correct filtering.

**search_hints** (Gemini, Opus). Accept.

Many systems call the tenant an organization, account or workspace. schema per tenant is a description, not code text.

Add: `org_id`, `organization_id`, `account_id`, `workspace_id`, `acts_as_tenant`, `HasQueryFilter`, `IgnoreQueryFilters`, `FORCE ROW LEVEL SECURITY`, `BYPASSRLS`, `current_setting(`, `SET LOCAL`, `search_path`

Remove: `tenantId`, `TenantContext`, `ENABLE ROW LEVEL SECURITY`, `django-tenants`, `Finbuckle`, `@TenantId`, `schema per tenant`

**related** (Opus). Accept.

Noisy tenants overlap bulkheads (122). I dropped 113 to stay within four.

Add: `122`

Remove: `113`

### 121. Graceful degradation

**how_it_works** (Gemini, Opus). Accept.

Both agents: unbounded queues and heavier fallbacks make things worse. Opus: honest messaging and paced replay, overload as a trigger, and exit criteria.

Now:

> Instead of failing completely when a dependency is slow or down, the system decides in advance which features matter most and which can be turned off, simplified or served from stale data. Examples are showing cached results, hiding recommendations, queueing writes for later, or switching to read-only mode. The decision is made per feature with the business, the degraded state is visible to users and operators, and it is tested, because fallback paths are rarely exercised. Circuit breakers and flags are the usual triggers.

Proposed:

> Instead of failing completely when a dependency is slow or down, the system decides in advance which features matter most and which can be turned off, simplified or served from bounded, stale data. Fallbacks that run rarely or move load to another system can make an outage worse, so prefer ones that do less work, such as static or cached responses, and exercise them. Queued writes need a durable queue, idempotent replay, an honest pending message and a paced drain. Degradation also applies under overload, with clear criteria for entering and leaving each mode.

**red_flags** (Opus). Accept.

Allowing requests when the authorization or fraud service is down turns an outage into a security hole.

Add or change to:

- Authorization, fraud or other security checks that fail open in degraded mode
- No agreed list of which features are essential, or a degraded mode that users and operators cannot see

Replace or remove:

- No agreed list of which features are essential
- Degraded mode that users and operators cannot see

**good_looks_like** (Opus). Accept.

Matches the new red flag.

Add or change to:

- Security and integrity checks fail closed, with any cached decisions kept short lived

**review_question** (Gemini, Opus). Accept.

The old question asked two things, and who decided can only be answered by people.

Now:

> Which features can be dropped or reduced when a dependency fails, and who decided that?

Proposed:

> What does each non-essential feature do when the dependency it needs fails or slows down?

**search_hints** (Gemini, Opus). Accept.

kill switch contains a space, and serve_stale, degradedMode and READ_ONLY_MODE are invented identifiers.

Add: `getFallback`, `FallbackPolicy`, `AddFallback`, `onErrorResume`, `stale-while-revalidate`, `proxy_cache_use_stale`, `killSwitch`, `kill_switch`, `readOnlyMode`, `read_only`

Remove: `serve_stale`, `READ_ONLY_MODE`, `degradedMode`, `kill switch`

**related** (Gemini, Opus). Accept.

Load shedding (44) and third-party dependencies (123). I dropped 11 and 87 to stay within four.

Add: `44`, `123`

Remove: `11`, `87`

**ownership** (Gemini). Accept.

Architects define tiering standards and degradation policy, and service teams implement them.

Change from `own` to `guardrail`.

### 122. Bulkheads and resource isolation

**how_it_works** (Gemini, Opus). Accept.

Both agents: sizing from Little's Law, and caller-runs policies that bypass the bulkhead. Opus: a bulkhead only helps if callers fail fast when it is full, and async runtimes need concurrency limits.

Now:

> A bulkhead limits how much of a shared resource one dependency, tenant or kind of work can use. Examples are a separate thread pool or connection pool per downstream service, a semaphore limiting concurrent calls, separate queues for urgent and bulk work, and separate deployments or cells for different customers. When one dependency slows, only its pool fills up and the rest of the system keeps working. Without them, one slow call can hold every thread and make the service look down. Sizes should come from measured need and be monitored.

Proposed:

> A bulkhead limits how much of a shared resource one dependency, tenant or kind of work can use. Examples are a separate thread pool or connection pool per downstream service, a semaphore or concurrency limit, separate queues for urgent and bulk work, and separate deployments or cells. In async runtimes the bulkhead is a concurrency limit and a per-host connection cap. When a pool is full, calls must be rejected or time out quickly, with a bounded queue, or callers still wait and the outage returns. Size limits with Little’s Law: concurrent calls equal request rate times latency, plus headroom.

**why_it_matters** (Opus). Accept.

The old text was too absolute.

Now:

> Shared pools turn a slow dependency into a full outage, because every request ends up waiting on the same limited resource.

Proposed:

> Shared pools can turn a slow dependency into a full outage, because every request ends up waiting on the same limited resource.

**red_flags** (Opus). Accept.

Java’s newFixedThreadPool uses an unbounded queue, which is a red flag here, not a positive hint.

Add or change to:

- Unbounded queues or thread pools, including executors created with a default unbounded queue

Replace or remove:

- Unbounded queues or thread pools

**search_hints** (Gemini, Opus). Accept.

Both agents: newFixedThreadPool, ThreadPoolExecutor and max_workers are ubiquitous primitives.

Add: `ArrayBlockingQueue`, `AddConcurrencyLimiter`, `MaxConnectionsPerServer`, `setMaxPerRoute`, `maxSockets`, `asyncio.Semaphore`, `ResourceQuota`

Remove: `newFixedThreadPool`, `ThreadPoolExecutor`, `BulkheadPolicy`

**agent check level** (Gemini, Opus). Accept.

Both agents: whether limits reflect measured demand and whether saturation is monitored need runtime evidence.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Pool saturation and rejection metrics
- Results of a test that slowed one dependency

**related** (Gemini, Opus). Accept.

Tenant isolation (120). I dropped 28 to stay within four.

Add: `120`

Remove: `28`

### 123. Third-party dependency resilience

**how_it_works** (Gemini, Opus). Accept.

Both agents: "cannot be more available than the product" ignores caching, queues and fallbacks. Opus: correlated failure of backup providers and provider changes.

Now:

> Most systems depend on services they do not run: payment providers, identity providers, email and SMS, maps, data feeds and cloud platforms. Their availability caps yours, because a system that needs several services in series cannot be more available than the product of their availability. Resilience means knowing what you depend on, what each provider promises and what happens to your service when each one fails. It also means timeouts, fallbacks, a contact path, and attention to quotas and changes of terms or pricing.

Proposed:

> Most systems depend on services they do not run: payment, identity, email and SMS providers, maps, data feeds and cloud platforms. A hard dependency with no fallback caps your availability at its own, and several in series give roughly the product of their availability if they fail independently. Published SLA figures are promises, not measurements, and credits rarely cover an outage. Resilience means knowing what you depend on and what happens when each fails, with timeouts, fallbacks, a contact path, and attention to quotas, provider changes and backups that share hosting with their primary.

**red_flags** (Gemini, Opus). Accept.

The availability flag ignored fallbacks, contradicting 121. Gemini: deprecations and credential expiry.

Add or change to:

- Availability targets higher than the combined availability of providers on the critical path that have no fallback
- Provider limits, quotas, deprecations or credential expiry unknown or unmonitored
- No exit or substitute plan for a single-source provider, or a backup that shares the primary’s hosting

Replace or remove:

- Availability targets higher than the combined availability of critical providers
- Provider limits and quotas unknown or unmonitored
- No exit or substitute plan for a single-source provider

**good_looks_like** (Opus). Accept.

Opus rated this critical: retrying a provider call with no guard can charge a card twice, and retrying past limits gets the account blocked.

Add or change to:

- Retries use idempotency keys where supported, respect Retry-After and stay within quota

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> Which external services can take you down, and what is the plan for each?

Proposed:

> What continuity and fallback plans exist for each critical external dependency?

**related** (Gemini, Opus). Accept.

Both agents: retries (12) and idempotency (14). I dropped 11 and 83 to stay within four.

Add: `12`, `14`

Remove: `11`, `83`

**agent check level** (Opus). Accept.

Timeouts, retry limits, circuit breakers and fallbacks on provider clients are visible in code.

Change from `people` to `partial`.

**search_hints** (Opus). Accept.

Hints for common client settings on provider calls.

Add: `Idempotency-Key`, `Retry-After`, `setConnectTimeout`, `@Retry`, `resilience4j`, `opossum`, `axios-retry`

### 124. Capacity planning and load testing

**how_it_works** (Gemini, Opus). Accept.

Both agents: open versus closed load models and coordinated omission. Opus: stubs that answer instantly make results optimistic.

Now:

> Capacity planning starts from expected peak demand and growth, turns it into resource needs, and compares that with what the system sustains. Load tests prove it. They send realistic traffic at a fixed rate, without waiting for each response, so they do not hide slow results, and they find the highest rate that still meets latency targets and the point where the system degrades. Stress, soak and spike shapes show different limits. They run in a production-like environment and use stubs or sandboxes for external services, so they trigger no real charges or messages.

Proposed:

> Capacity planning starts from expected peak demand and growth, turns it into resource needs, and compares that with what the system sustains. Load tests prove it. Match the load model to real clients: an open model, sending requests at a set arrival rate, for many independent users, and a closed model for a fixed set of clients. Waiting for each response in an open-traffic test hides slow results (coordinated omission). State targets as a percentile latency and an error rate, and check the generator is not the bottleneck. Use production-sized data and realistic stubs.

**red_flags** (Opus). Accept.

Tests against production can harm users, trigger autoscaling and billing, and look like an attack to a provider. I merged the autoscaling flag into the good practices.

Add or change to:

- Load tests against production or shared environments with no abort criteria, cost limit or notice to the providers involved

Replace or remove:

- Autoscaling and limits set without any test of the bottleneck

**good_looks_like** (Opus). Accept.

Headroom must also cover losing a zone and rolling deploys, and tests on small databases or warm caches overstate capacity.

Add or change to:

- Expected peak and growth stated in numbers, with headroom for peak load with one zone or instance lost and during deployments
- Tests run regularly and before major changes, on production-sized data including cold-cache runs
- External services stubbed with realistic latency and limits, or sandboxed
- Tests have abort thresholds and a cost limit, and follow the provider’s testing policy

Replace or remove:

- Expected peak and growth stated in numbers, with headroom against them
- Tests run regularly and before major changes
- External services stubbed or sandboxed during tests

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> What peak load must the system carry, and what test shows it can?

Proposed:

> What load test shows the system sustains its target peak load within latency targets?

**search_hints** (Gemini, Opus). Accept.

k6, ghz and loadtest are short and match hashes and unrelated words.

Add: `k6/http`, `locustfile`, `from locust`, `io.gatling`, `.jmx`, `artillery.yml`, `nbomber`, `vegeta attack`, `ghz --proto`, `hyperfoil`, `maxReplicas`

Remove: `k6`, `locust`, `gatling`, `jmeter`, `artillery`, `vegeta`, `loadtest`, `ghz`, `performance-test`

**related** (Opus). Accept.

Latency percentiles (93). I dropped 46 to stay within four.

Add: `93`

Remove: `46`

### 125. Environment configuration management

**how_it_works** (Gemini, Opus). Accept.

Gemini rated this critical and Opus major: a value that passes the pipeline but fails startup, pushed to every instance at once, crash-loops the fleet.

Now:

> Configuration is everything that changes behavior without changing code: endpoints, limits, timeouts, feature settings and resource sizes. It should be kept apart from code and from secrets, versioned, and differ between environments only where it must. It is validated at startup and in the pipeline against a schema, so a missing or malformed value fails fast and not in production. Changes are reviewed, rolled out gradually and can be rolled back like code, since bad configuration is a leading cause of outages. Drift between environments should be detected.

Proposed:

> Configuration is everything that changes behavior without changing code: endpoints, limits, timeouts and resource sizes. It is kept apart from code and secrets, versioned, and differs between environments only where it must. It is validated at startup and in the pipeline against a schema. Changes go to a small share of instances first, with health checks that stop and roll back automatically, and instances that reload settings at runtime reject invalid values and keep the last good one. Drift is detected between running configuration and version control and between environments.

**red_flags** (Opus). Accept.

Cross-environment leakage and silent defaults can corrupt or leak data.

Add or change to:

- Defaults in code that point at production or enable debug, or non-production settings that can reach production resources

Replace or remove:

- Configuration, secrets and code mixed in the same files

**good_looks_like** (Opus). Accept.

"Separate from code" was ambiguous.

Add or change to:

- Configuration in version control in its own files or repository, never hard-coded, with secrets in a secrets store and referenced by name
- A schema validated at startup and in the pipeline, with required values that have no default
- Drift between running configuration and version control detected
- Non-production cannot reach production resources

Replace or remove:

- Configuration in version control, separate from code and secrets
- A schema validated at startup and in the pipeline
- Drift between environments detected

**search_hints** (Gemini, Opus). Accept.

dotenv and env.example encourage committing local environment files, and modern schema libraries were missing.

Add: `pydantic-settings`, `application.properties`, `values.yaml`, `IOptions`, `convict`, `zod`

Remove: `dotenv`, `application.yml`, `env.example`

**ownership** (Gemini, Opus). Accept.

The architect sets the standard (separation, schema, rollout, drift detection) and teams implement it per service.

Change from `own` to `guardrail`.

**related** (Gemini, Opus). Accept.

Configuration rollouts carry the same risk as deploys (53). I dropped 55 to stay within four.

Add: `53`

Remove: `55`

---

## 5. Sources

- **Confirmed by me this round:** the PostgreSQL documentation that superusers and roles with BYPASSRLS always bypass row security and table owners normally do too unless FORCE ROW LEVEL SECURITY is set (120), and the Istio documentation that an unset mTLS mode is treated as permissive, which accepts plain text, while strict mode ensures connections bypassing the mesh are not possible (116). Isolation level defaults across PostgreSQL, MySQL, SQL Server and Oracle, tenant context on pooled connections (which matches the PgBouncer behavior I confirmed in round 2), and the supply chain and authentication guidance match what I know and what both agents independently reported.
- **Cited by an agent and not opened by me:** the OWASP API Security Top 10, Cheat Sheet Series and Application Security Verification Standard; NIST SP 800-63B and SP 800-207; RFC 6265bis, RFC 8693, RFC 9562 and RFC 9700; the PostgreSQL, MySQL, SQL Server and Oracle documentation on isolation, locking, vacuuming and row-level security; Berenson and others on ANSI isolation levels; Kleppmann's book and article on locking; the Istio, Sigstore and SLSA documentation; GitHub's Actions hardening guide; the AWS Backup, S3 Object Lock, Well-Architected and Builders' Library material; Nygard's Release It!; the Twelve-Factor App; Schroeder and others on open versus closed load models; Tang and others on configuration management at Facebook; and the Principles of Chaos Engineering. Open any you plan to cite.

## 6. Next

I'll walk through decisions 1 to 5 one at a time.
