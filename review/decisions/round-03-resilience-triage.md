# Round 3 triage: Resilience and fault tolerance (concerns 10 to 14, 44, 83 to 87, 95, 96)

Sources: Claude Opus 5.5 (one complete reply: 67 findings, 11 suggested additions) and Gemini (one reply: 3 findings, 1 suggested addition, and **only the first half of the concerns**).

Nothing here has been applied to the repository. All 57 content edits in section 4 were applied to a scratch copy and pass the schema limits and style rules. They already reflect earlier decisions: described patterns go to `look_for`, hint lists respect the cap of 15, and concern 12 is drafted as if 13 is merged into it (decision 1 below).

---

## 1. What this round showed

**R1. Gemini's reply was incomplete and its clean list was wrong again.** It covered 10 to 14, 44 and 83, and said nothing about 84, 85, 86, 87, 95 or 96. It also ignored the "send the first half and wait" instruction. Its "no issues" list (10, 12, 13, 44) was contradicted by Opus in all four: a major finding in each. This is the third round in a row.

**R2. The outage-safety check found two critical problems.**
- **Idempotency (14):** implemented as written (look up the key, process, store the result), two concurrent requests with the same key both pass the lookup and both run, so a payment is charged twice. The key has to be claimed atomically.
- **Backups (84):** I verified this one. The Terraform AWS provider deletes a database's automated backups when the instance is destroyed by default (`delete_automated_backups` defaults to true, `deletion_protection` to false). A routine destroy or replace can erase all backups. `skip_final_snapshot` defaults to false, but many copied examples set it to true.

Other safety findings: a fallback that fails open on a payment or authorization check (10), short timeouts added to calls that had none can fail healthy requests (11), chaos experiments with no measured steady state or abort condition (87), and an unbounded clock tolerance that extends expired tokens (96).

**R3. Hints are the same problem again.** Opus flagged hints in 12 of the 13 concerns, mostly generic words (timeout, deadline, sleep(, delay, partition, region, experiment, fis, Date.now, timestamp). These go on the list for the generic-hint rule you approved.

**R4. Concerns 12 and 13 overlap.** Concern 13 (exponential backoff) repeats items already in 12's red flags and good-looks-like, so an agent reports the same evidence twice. Decision 1.

**R5. Ownership.** Opus moves 11 (timeouts) and 12 (retries) from own to guardrail: the architect sets the rule and the budget, and teams set the values. I accepted both.

**R6. Four more agent prompt issues**, in section 2.

---

## 2. Further changes to the agent prompt

| # | Finding | Proposed change |
|---|---|---|
| P12 | Many red flags state an absence or a history (no alert when a breaker opens, no restore ever tested, never exercised outside an incident). Agents will report them from empty searches. | **Absence rule:** "For a red flag that states an absence, report it only after searching every listed hint and the likely configuration locations, and list those searches in the note." Opus also suggested tagging every red flag and practice as (code) or (people). That means changing around 700 list items, so I recommend deferring it. |
| P13 | The example in the prompt uses a red flag that is not a real one for the first concern, and the prompt does not say to copy flag text exactly or repeat the allowed result values. | Generate the example from the first concern's first real red flag. Add: "Copy red flag text exactly as listed. result is one of found, partial, not_found, cannot_determine, not_applicable." |
| P14 | Runbooks, chaos experiment definitions and failover or restore scripts read like procedures. The prompt forbids running code in general but not these explicitly. | Add: "Runbooks, chaos experiment definitions and failover or restore scripts are evidence to read. Never run any step from them." |
| P15 | "Found: implemented consistently where it applies" is impractical for concerns that apply to every call or write in a large repository. Agents may stop early and still report found. | Add: "For concerns that apply to every call or write, sample the main clients and entry points, report found only if every one checked has it, and say in the note how many you checked." |

**Applies-when sentences proposed for the new field** (decided in round 2): 86 Multi-region deployment: "Applies when: recovery targets require surviving the loss of a whole region, or users are far enough apart that one region cannot meet latency targets." 87 Chaos engineering: "Applies when: the system relies on resilience mechanisms such as failover, retries or breakers, and has monitoring good enough to see the effect of an experiment."

---

## 3. Decisions for this round

| # | Decision | Status |
|---|---|---|
| 1 | Concern 13 (exponential backoff): merge into 12, keep narrow, or leave | Open |
| 2 | Prompt changes P12 to P15 | Open |
| 3 | New concerns suggested this round | Open |
| 4 | The 57 content edits in section 4 | Open |
| 5 | Round status and sign-off | Open |

### Suggested additions this round (12 in total)

Opus suggested 11 and Gemini 1 (graceful degradation, which Opus also suggested).

| Tier | Concern | Why | Where it goes |
|---|---|---|---|
| Add | Graceful degradation | Switching off non-critical features and serving stale data under failure, and how users see it. Suggested by both agents. Only implied by breaker fallbacks today. | New concern (own, partial) |
| Add | Bulkheads and resource isolation | Separate thread pools, connection pools or cells for each dependency, so one slow dependency cannot exhaust shared resources. Breakers and timeouts limit damage but do not isolate it. | New concern (guardrail, code) |
| Consider | Third-party dependency resilience | SaaS and external APIs have their own SLAs and outages. They need an inventory, timeouts, fallbacks and targets that fit your RTO. | New concern (own, people) |
| Fold | Load shedding and admission control | Concern 44 now separates load shedding from backpressure. | 44 (done in the edits) |
| Fold | Static stability and control plane dependence | Recovery should not need actions on the failed region's control plane. | 83 and 85 (a red flag in 83 is in the edits) |
| Fold | Capacity headroom for zone loss | Remaining zones must absorb a lost zone's load. | 45 (autoscaling), as a good-looks-like item |
| Fold | Cloud service quotas and limits | Quotas block failover and scale-out during an incident. | 45 and 83 |
| Fold | Graceful shutdown and connection draining | Already covered by 54 (rolling deployments). | 54, no change |
| Fold | Transactional outbox and dual writes | Already in 18. Suggested again, so I linked 14 to 18. | 18, no change |
| Fold | Data integrity verification | Detecting silent corruption before it reaches every backup. | 84 (a good-looks-like item is in the edits) |
| Hold | Incident response and runbooks | You removed incident items earlier as organizational, not technical. | Not added |

Adding the two "add" concerns takes the plan from 110 to 112. Merging 13 into 12 (decision 1) takes one away, giving 111. The "consider" concern would add one.

---

## 4. Proposed content edits by concern

### 10. Circuit breakers

**how_it_works** (Opus). Accept.

A plain failure counter trips on low traffic and misses slow but successful calls. Common libraries use a rate over a sliding window. A failed trial call reopens the breaker. Breakers are per process, and a breaker shared across endpoints lets one bad endpoint block healthy ones.

Now:

> A circuit breaker wraps calls to a dependency and counts failures. After a threshold it opens and fails calls immediately without contacting the dependency. After a wait it lets a few trial calls through (half-open) and closes again if they succeed.

Proposed:

> A circuit breaker wraps calls to a dependency and tracks failures and slow calls, usually as a rate over a sliding window after a minimum number of calls. When the rate passes a threshold it opens and fails calls immediately without contacting the dependency. After a wait it lets a few trial calls through (half-open): if they succeed it closes, and if they fail it opens again. State is usually kept per process, so instances trip independently. Scope a breaker to one dependency or endpoint group, so one failing endpoint does not block healthy ones.

**decide_between** (Opus). Accept.

Mesh settings are not equivalent to a breaker. Envoy circuit breaking caps connections and pending requests, and outlier detection ejects individual hosts, so a reviewer could wrongly accept mesh config as a breaker.

Now:

> A library-level breaker or a mesh-level one. A library breaker can run fallback logic for each call. A mesh applies one policy without code changes but cannot provide a fallback.

Proposed:

> A library-level breaker or mesh-level protection. A library breaker stops calls to the whole dependency and can run fallback logic for each call. A mesh applies policy without code changes, but its outlier detection removes individual unhealthy hosts and its connection limits cap load. It does not stop calls to a dependency that is failing everywhere, and it cannot provide a fallback.

**red_flags** (Opus). Accept.

Safety: the most dangerous fallback mistakes were missing. An unreachable authorization or fraud service must not be treated as "allowed". The first flag also contradicted good_looks_like, which accepts a clear error.

Add or change to:

- Open state behavior not defined, so callers get an unexpected exception
- A fallback that fails open on an authorization, fraud or payment check
- A fallback that calls another dependency that would be overloaded by the same event

Replace or remove:

- A breaker with no fallback behavior defined

**search_hints** (Opus). Accept.

Adds current APIs and mesh keys. Hystrix has been in maintenance mode since 2018, so finding it is itself worth reporting, which I left for the agent to note.

Add: `@CircuitBreaker`, `AddCircuitBreaker`, `CircuitBreakerStrategyOptions`, `failsafe`, `consecutive5xxErrors`, `circuit_breakers`

Remove: `Polly`

### 11. Timeouts

**how_it_works** (Gemini, Opus). Accept.

Gemini: the text should name the connect and read split. Opus: the layering rule ignores retries, a timeout does not cancel downstream work, and a timed-out write has an unknown outcome.

Now:

> Every remote call (HTTP, database, queue, cache) is given a maximum wait. When it expires, the caller stops waiting, releases the thread or connection, and takes a defined fallback or returns an error. Timeouts should be layered: each downstream timeout must be shorter than the caller’s own budget, otherwise the caller gives up first and the downstream work is wasted.

Proposed:

> Every remote call (HTTP, database, queue, cache) gets a maximum wait, usually a connect timeout, a read timeout and an overall limit. When it expires, the caller stops waiting, releases the thread or connection, and takes a fallback or returns an error. Each downstream timeout must fit inside the caller’s own budget, and with retries, each attempt’s timeout times the attempts, plus the delays, must fit too. A timeout does not stop the downstream work, so pass a deadline along where possible. A timed-out write may have succeeded, so its outcome is unknown.

**red_flags** (Opus). Accept.

In most clients the read timeout applies to each socket read, so a slowly dripping response can exceed it indefinitely.

Add or change to:

- Connect and read timeouts set but no overall limit on the whole request
- No limit on waiting for a connection from a pool
- No server-side limit, such as a database statement timeout or an inbound request timeout

Replace or remove:

- A connect timeout set but no read timeout

**good_looks_like** (Opus). Accept.

Safety: adding short timeouts to calls that had none can fail slow but healthy requests across production at once. The text gave no guidance on choosing values or rolling them out.

Add or change to:

- Every outbound call has explicit connect, read and overall timeouts, including the wait for a pooled connection
- Timeouts come from a latency budget for each request path, and new or shorter ones are rolled out gradually while watching the timeout rate

Replace or remove:

- Every outbound call has an explicit connect and read timeout
- Timeouts come from a latency budget for each request path

**search_hints** (Opus). Accept.

timeout and deadline match almost every repository. Adds the patterns that show a missing timeout, such as Go's default client. The descriptive hint moves to look_for.

Add: `context.WithDeadline`, `http.DefaultClient`, `http.Get(`, `HttpClient.Timeout`, `AbortSignal.timeout`, `httpx.Timeout`, `statement_timeout`, `commandTimeout`, `setConnectTimeout`

Remove: `timeout`, `deadline`, `http.Client{`, `requests.get( without a timeout argument`

**ownership** (Opus). Accept.

The architect sets the latency budget and the rule that every call has a timeout. Teams set the values for each client.

Change from `own` to `guardrail`.

**review_question** (Opus). Accept.

The current question asks two things.

Now:

> Does every remote call have a timeout, and do they fit within the caller’s budget?

Proposed:

> How are timeouts set for remote calls on the critical request path, and how do they fit within the request’s overall budget?

### 12. Retries

**how_it_works** (Opus). Accept.

Drafted on the assumption that 13 is merged into 12 (decision 1). Opus: backoff on its own barely reduces total load when many clients keep arriving, so it must be paired with a retry limit or budget. The jitter type matters.

Now:

> When a call fails with a transient error, the caller sends it again, usually after a delay. Retries help with brief faults such as a dropped connection or a restarting instance. They must be limited in count and total time, applied only to safe operations, and spaced with backoff, or they add load to a dependency that is already struggling.

Proposed:

> When a call fails with a transient error, the caller sends it again, after a delay that grows with each attempt (backoff) and includes random jitter so clients do not retry together. Full jitter, a random delay between zero and the computed delay, spreads load best. Retries help with brief faults such as a dropped connection or a restarting instance. They must be limited in count and total time and applied only to safe operations, because backoff spaces retries out but does not reduce how many are sent. If the server sends Retry-After, honor it.

**red_flags** (Opus). Accept.

Many SDKs and meshes retry by default, so teams add their own retries on top. Payments can be retried safely with an idempotency key. 408 and 429 are retryable. Unlimited redelivery loops poison messages forever. Absorbs the delay-shape flags from 13.

Add or change to:

- Retries with no limit, no delay, a fixed delay or no jitter
- Retries added on top of SDK, client or mesh defaults that already retry
- Retrying writes that are not idempotent, such as a payment sent without an idempotency key
- Retrying errors that can never succeed, such as most 4xx responses (408 and 429 are exceptions, and 429 should honor Retry-After)
- Queue messages redelivered without limit and with no dead letter queue

Replace or remove:

- Retries with no limit or no delay
- Retrying non-idempotent writes such as payments
- Retrying on every error, including client errors that can never succeed

**decide_between** (Opus). Accept.

"Shared retry budget" was used without explanation, and the multiplication effect was not quantified.

Now:

> Retry at one layer only, or at several. One layer, usually closest to the caller, is easier to reason about. Several layers need a shared retry budget to stop the attempts multiplying.

Proposed:

> Retry at one layer only, or at several. One layer, usually closest to the caller, is easier to reason about. Retries at several layers multiply: three attempts at each of three layers send up to 27 calls to the bottom service. Several layers need a retry budget, a cap on retries as a share of normal traffic (for example 10%), so retries stop when failures are widespread.

**search_hints** (Opus). Accept.

visibilityTimeout is SQS timing, not the retry limit. Adds common retry configuration keys and the backoff hints from 13.

Add: `maxRetries`, `max_retries`, `RetryPolicy`, `WaitAndRetry`, `AddRetry`, `urllib3.Retry`, `backoff_factor`, `wait_exponential`, `ExponentialBackoff`, `UseJitter`, `maxReceiveCount`, `x-delivery-limit`

Remove: `retry`, `retries`, `backoff`, `jitter`, `tenacity`, `resilience4j`, `Polly`, `axios-retry`, `redelivery`, `visibilityTimeout`

**related** (Opus). Accept.

The dead letter queue link matters because redelivery limits depend on it. 13 is dropped if it is merged.

Add: `20`, `11`

Remove: `13`

**ownership** (Opus). Accept.

Which layer retries and the retry budget are architect standards. The settings in each client are team detail.

Change from `own` to `guardrail`.

### 14. Idempotency

**definition** (Opus). Accept.

Idempotency means the same effect on server state, not the same result. A second DELETE can return 404. The old wording read as if payments were idempotent by nature.

Now:

> Repeating an operation yields the same result, so retries are safe (e.g. payments).

Proposed:

> Repeating an operation has the same effect as doing it once, so retries are safe. Payments and order creation need it most.

**how_it_works** (Gemini, Opus). Accept.

Opus rated this critical: implemented as written (look up the key, process, store the result), two concurrent requests with the same key both pass the lookup and both execute, causing a duplicate charge. Both agents: bind the key to the request body.

Now:

> An operation is idempotent when doing it several times has the same effect as doing it once. For writes this is usually done with an idempotency key supplied by the caller: the server stores the key with the result and returns the stored result if the same key arrives again.

Proposed:

> An operation is idempotent when doing it several times has the same effect as doing it once. For writes this is usually done with a caller-supplied idempotency key. The server claims the key atomically before processing, for example with a unique constraint, so a concurrent duplicate waits or is rejected instead of running twice. It stores a fingerprint of the request, rejects the same key with a different body, scopes keys to the client, and returns the stored result for a repeat. Side effects outside the database need the key passed on, or an outbox.

**red_flags** (Opus). Accept.

Adds the race and scoping mistakes, and the crash between the side effect and storing the result.

Add or change to:

- Keys not scoped to the client or tenant, or kept with no expiry policy
- Check-then-insert on the key with no lock or unique constraint
- Consumers that mark a message processed in a separate transaction from the write it caused

Replace or remove:

- Keys with no expiry policy

**search_hints** (Opus). Accept.

messageId is generic. Adds common SQL and ORM forms. I left out Kafka's enable.idempotence, which covers producer duplicates only and an agent would wrongly take as consumer idempotency.

Add: `idempotency_key`, `IdempotencyKey`, `MessageDeduplicationId`, `ON DUPLICATE KEY`, `INSERT IGNORE`, `unique=True`, `@Column(unique`, `UNIQUE INDEX`, `inbox`

Remove: `idempotency`, `deduplication`, `messageId`, `unique index`

**related** (Opus). Accept.

Opus suggested 20 and 19. I chose 18 because transactional outbox and dual writes have now been suggested in two rounds, and 18 is where that topic lives.

Add: `18`

### 44. Backpressure

**definition** (Opus). Accept.

The old definition said backpressure signals upstream, but the text lists dropping and rejecting, which are load shedding. They are different.

Now:

> Signal upstream to slow down when a consumer is overwhelmed.

Proposed:

> What happens when a consumer is overwhelmed: slow the producer (backpressure) or reject excess work (load shedding).

**how_it_works** (Opus). Accept.

A long queue serves requests whose callers have already timed out, and unread messages expire under broker retention.

Now:

> Backpressure lets a slow consumer tell a fast producer to slow down, so work does not pile up without limit. Options are to block the producer, drop or reject excess work, or buffer within a fixed size. Systems without it either run out of memory or fall behind forever.

Proposed:

> Backpressure lets a slow consumer tell a fast producer to slow down, so work does not pile up without limit. Options are to block the producer, drop or reject excess work, or buffer within a fixed size. Systems without it either run out of memory or fall behind forever. With a durable broker, a consumer that falls behind can lose data when retention deletes messages it has not read. Size queue limits by how long work may wait, not by memory, and drop work whose caller has already given up.

**decide_between** (Opus). Accept.

"Dropping loses work" conflated silent dropping with rejecting. A 429 or 503 lets the caller retry later, so nothing is lost.

Now:

> Block the producer, buffer, or drop work. Blocking keeps all the work but can stall callers. Buffers absorb bursts but must be bounded. Dropping protects the system but loses work.

Proposed:

> Block the producer, buffer, reject or drop. Blocking keeps all the work but can stall callers and exhaust their threads. Buffers absorb bursts but must be bounded. Rejecting, for example with 429 or 503 and Retry-After, lets the caller try again later. Silent dropping protects the system but loses work, so use it only where loss is acceptable.

**search_hints** (Opus). Accept.

bounded, buffer, maxSize and queue size are generic. Adds specific settings and the types that are unbounded by default, such as Java's LinkedBlockingQueue.

Add: `basicQos`, `prefetch_count`, `max.poll.records`, `maxConcurrentCalls`, `BoundedChannelOptions`, `make(chan`, `ArrayBlockingQueue`, `LinkedBlockingQueue`, `RejectedExecutionHandler`, `onBackpressureBuffer`, `highWaterMark`

Remove: `bounded`, `maxSize`, `queue size`, `semaphore`, `limit concurrency`, `buffer`

**related** (Opus). Accept.

Rate limiting and retries are the obvious companions: shed work that is retried immediately undoes the shedding. Dropped 92 to stay within four.

Add: `1`, `12`

Remove: `92`

### 83. Disaster recovery

**how_it_works** (Gemini, Opus). Accept.

Gemini: RTO must include detection and decision time. Opus: replication copies corruption and deletion instantly, so only point-in-time backups meet the recovery point for those, and recovery time includes restoring large data sets and finding capacity.

Now:

> Disaster recovery is the plan and the capability to restore service after a major failure such as a region outage, data corruption or a lost environment. It is defined by two targets: RTO, how quickly service must return, and RPO, how much recent data you can afford to lose. Those targets drive the choice of backups, replication and standby capacity.

Proposed:

> Disaster recovery is the plan and the capability to restore service after a major failure such as a region outage, data corruption or a lost environment. It is defined by two targets: RTO, how quickly service must return (including the time to detect the problem and decide to recover), and RPO, how much recent data you can afford to lose. Replication protects against lost infrastructure but copies corruption and deletion at once, so those cases need point-in-time backups. Restoring large data sets and obtaining capacity, which may be scarce in a regional event, count towards recovery time.

**red_flags** (Opus). Accept.

Adds control plane dependence, who declares a disaster, failback, and emergency access. I merged the last two Opus items into existing flags to stay within six.

Add or change to:

- Recovery steps that need the control plane of the failed region or provider
- No named person or criteria for declaring a disaster, and no plan to fail back

**decide_between** (Opus). Accept.

The option names come from cloud provider guidance and were not explained.

Now:

> Backup and restore, pilot light, warm standby or active-active. Each step reduces recovery time and data loss and increases cost and complexity. Choose by RTO and RPO, not by preference.

Proposed:

> Backup and restore (rebuild from backups), pilot light (data replicated and a minimal core running, the rest started on demand), warm standby (a scaled-down full copy running) or active-active (full capacity in more than one site). Each step reduces recovery time and data loss and increases cost and complexity. Choose by RTO and RPO, not by preference.

**evidence_to_request** (Opus). Accept.

The measured result against the target is the evidence that matters.

Add or change to:

- The recovery time and data loss measured in the last test, compared with the targets

**related** (Opus). Accept.

Recovery tests are often run as game days.

Add: `87`

### 84. Backups

**how_it_works** (Opus). Accept.

With point-in-time recovery, the log shipping interval sets the recovery point. Adds cross-store consistency and key dependence.

Now:

> Backups are copies of data stored separately so it can be restored after loss or corruption. A good setup defines what is backed up, how often (which sets the recovery point), where copies are kept, for how long, and who can delete them. A backup counts only if a restore has been tested.

Proposed:

> Backups are copies of data stored separately so it can be restored after loss or corruption. A good setup defines what is backed up, how often (or, with point-in-time recovery, how often logs are shipped), which sets the recovery point, where copies are kept, for how long, and who can delete them. Backups of related data stores taken at different moments may not restore to a consistent state, and backups are only usable while their encryption keys exist. A backup counts only if a restore has been tested.

**why_it_matters** (Opus). Accept.

The old text overstated protection against ransomware.

Now:

> Backups are the last defense against deletion, corruption and ransomware, and untested ones often turn out to be incomplete or unusable.

Proposed:

> Backups are the last defense against deletion, corruption and ransomware, but only if they are isolated and cannot be deleted with production credentials. Untested ones often turn out to be incomplete or unusable.

**where_it_appears** (Opus). Accept.

Only databases and storage were named.

Now:

> Database and storage backup settings in infrastructure code, snapshot schedules, backup job scripts, retention policies and restore runbooks.

Proposed:

> Backup settings for databases, object storage, secrets, configuration and infrastructure state in infrastructure code, snapshot schedules, backup job scripts, retention policies and restore runbooks.

**red_flags** (Opus). Accept.

Opus rated this critical, and I verified it: the Terraform AWS provider's delete_automated_backups defaults to true and deletion_protection to false, so a routine destroy can erase a database's automated backups. skip_final_snapshot defaults to false, but many copied examples set it to true.

Add or change to:

- Infrastructure code that deletes backups with the resource, skips a final snapshot or has deletion protection off for data stores

**good_looks_like** (Opus). Accept.

The last item folds in the "data integrity verification" suggestion, since backups and replicas copy corruption until it is noticed.

Add or change to:

- Backups immutable for their retention period and surviving deletion of the source resource
- Integrity checks or reconciliation to catch silent corruption before it reaches every backup

**search_hints** (Opus). Accept.

backup, snapshot, restore and retention are generic, and the list was AWS and Postgres heavy.

Add: `delete_automated_backups`, `skip_final_snapshot`, `deletion_protection`, `prevent_destroy`, `point_in_time_recovery`, `aws_backup_plan`, `aws_backup_vault_lock_configuration`, `object_lock`, `azurerm_backup_policy`, `pgbackrest`, `wal-g`, `mongodump`, `velero`

Remove: `backup`, `snapshot`, `retention`, `automated_backup`, `point_in_time`, `PITR`, `restore`, `aws_backup`

### 85. Failover

**definition** (Opus). Accept.

The old definition said automatic, but the concern covers manual failover too.

Now:

> Automatic switch to a standby when the primary fails.

Proposed:

> Switching service to a standby when the primary fails, automatically or by a person.

**how_it_works** (Opus). Accept.

Explains where data loss comes from and what happens to the old primary.

Now:

> Failover moves service from a failed component to a standby, whether a database primary, a server or a whole region. It can be automatic or manual. A reliable design detects failure accurately, promotes only one standby, redirects clients, and avoids two nodes both acting as primary.

Proposed:

> Failover moves service from a failed component to a standby, whether a database primary, a server or a whole region. It can be automatic or manual. A reliable design detects failure accurately, promotes only one standby, redirects clients, and avoids two nodes both acting as primary. With asynchronous replication, writes not yet copied to the standby are lost when it is promoted. After failover, the old primary must be fenced and rebuilt or rewound as a replica, never simply restarted.

**decide_between** (Opus). Accept.

The old text said "within a zone", but failover inside one zone does not survive a zone outage.

Now:

> Automatic or manual failover. Automatic is faster but can trigger falsely. Manual is slower but a person confirms the failure. Many teams automate within a zone and keep cross-region failover manual.

Proposed:

> Automatic or manual failover. Automatic is faster but can trigger falsely. Manual is slower but a person confirms the failure. Many teams automate failover across zones within a region and keep cross-region failover manual.

**red_flags** (Opus). Accept.

Adds flapping and concrete DNS caching causes.

Add or change to:

- Clients that do not follow the switch, such as long-lived connections, long DNS TTLs or runtime DNS caching
- Health checks so sensitive that brief blips trigger repeated failovers, with no cooldown

Replace or remove:

- Clients with long-lived connections or cached addresses that don’t follow the switch

**search_hints** (Opus). Accept.

replica, standby and health check are generic, and route53 was the only DNS product named. Adds other clouds and common operators.

Add: `automatic_failover_enabled`, `availability_type`, `zone_redundant`, `failover_routing_policy`, `azurerm_traffic_manager`, `repmgr`, `pg_auto_failover`, `cloudnative-pg`, `fencing`

Remove: `standby`, `replica`, `health check`, `dns failover`, `route53`

**related** (Opus). Accept.

Health checks drive failover decisions, and disaster recovery depends on failover. Dropped 32 to stay within four.

Add: `56`, `83`

Remove: `32`

### 86. Multi-region deployment

**how_it_works** (Opus). Accept.

Missing write conflicts, residency limits and staged deployment across regions. The applies_when sentence Opus proposed is listed under decision 1's follow-up in the triage summary.

Now:

> Multi-region deployment runs the application in more than one cloud region, either active-active (all serve traffic) or active-passive (one waits). It gives resilience against a regional outage and lower latency for distant users, but data replication across regions makes consistency, cost and operations harder.

Proposed:

> Multi-region deployment runs the application in more than one cloud region, either active-active (all serve traffic) or active-passive (one waits). It gives resilience against a regional outage and lower latency for distant users, but data replication across regions makes consistency, cost and operations harder. Accepting writes in several regions needs a rule for conflicting writes, and last writer wins can silently lose data. Data residency rules may limit which regions can hold copies. Deploy to one region at a time so a bad release cannot take down every region.

**decide_between** (Opus). Accept.

Adds the common middle option.

Now:

> Active-active or active-passive. Active-passive is simpler and cheaper, with a slower and riskier switch. Active-active gives the fastest recovery but needs data designed for multi-region writes.

Proposed:

> Active-passive, active-active with one write region, or active-active with writes everywhere. Active-passive is simpler and cheaper, with a slower and riskier switch. One write region serves reads locally without write conflicts, but writes still depend on that region. Writes everywhere gives the fastest recovery but needs data designed for conflicting writes.

**search_hints** (Opus). Accept.

region and replication match everything, and the region names were AWS only.

Add: `aws_rds_global_cluster`, `azurerm_traffic_manager`, `azurerm_frontdoor`, `enable_multiple_write_locations`, `google_spanner_instance`, `google_compute_global_forwarding_rule`, `us-east-`, `eu-west-`, `eastus`, `westeurope`, `europe-west`

Remove: `region`, `us-east`, `eu-west`, `traffic manager`, `route53`, `replication`

**related** (Opus). Accept.

Sharding (30) was a weak link. Failover, eventual consistency and clock skew travel with multi-region far more often.

Add: `85`, `96`

Remove: `30`

### 87. Chaos engineering

**how_it_works** (Opus). Accept.

Safety: followed literally, a team could run experiments in production with no measured steady state and no automatic abort.

Now:

> Chaos engineering injects controlled failures, such as killing instances, adding latency or cutting a dependency, to check that the system behaves as designed. Experiments start with a hypothesis, run with a limited blast radius, and end with fixes for what was found.

Proposed:

> Chaos engineering injects controlled failures, such as killing instances, adding latency or cutting a dependency, to check that the system behaves as designed. Each experiment defines a measurable steady state and a hypothesis, starts in a non-production environment, limits the blast radius, stops automatically when a key alarm fires, and ends with fixes for what was found. Production runs come later, with on-call informed.

**search_hints** (Opus). Accept.

experiment matches A/B tests and feature flags, fis matches words like fiscal, and chaos alone is broad.

Add: `chaos-mesh`, `PodChaos`, `NetworkChaos`, `ChaosEngine`, `litmuschaos`, `chaostoolkit`, `steady-state-hypothesis`, `pumba`, `aws_fis_experiment_template`, `azurerm_chaos_studio`

Remove: `chaos`, `litmus`, `latency injection`, `fis`, `experiment`

**related** (Opus). Accept.

Disaster recovery and failover are the main experiment targets.

Add: `83`

### 95. Network partitions

**how_it_works** (Opus). Accept.

The old text assumed clean, symmetric splits.

Now:

> A network partition splits a system so some nodes cannot reach others while all keep running. Each component then has to choose how to behave: stop serving to protect consistency, or keep serving and risk conflicts. The design should decide this for each data set and test it.

Proposed:

> A network partition splits a system so some nodes cannot reach others while all keep running. Each component then has to choose how to behave: stop serving to protect consistency, or keep serving and risk conflicts. The design should decide this for each data set and test it. Partitions are often partial or one-way, and a timeout cannot tell a partition from a slow or crashed peer. A leader cut off from the others may keep acting as leader, so writes should carry a fencing token that storage checks.

**red_flags** (Opus). Accept.

The first flag duplicated concern 11 and would be reported twice. RabbitMQ's partition handling default, ignore, allows split-brain.

Add or change to:

- A cluster setting that lets both sides of a partition keep accepting writes, such as partition handling left on ignore

Replace or remove:

- Network calls with no timeout

**search_hints** (Opus). Accept.

partition matches Kafka and table partitioning (31), and leader and timeout are generic.

Add: `split-brain`, `cluster_partition_handling`, `x-queue-type: quorum`, `min.insync.replicas`, `unclean.leader.election.enable`, `writeConcern`, `synchronous_commit`

Remove: `partition`, `split brain`, `leader`, `timeout`

### 96. Clock skew

**how_it_works** (Opus). Accept.

Time sync can step the clock, so durations measured with the wall clock can go negative. This is a very common code-level bug.

Now:

> Clock skew is the difference between the clocks of different machines. Logic that compares timestamps from different machines, such as expiry, ordering, locks and token validity, can go wrong when clocks differ. Systems reduce the risk with synchronized time, tolerances, and logical clocks or version numbers.

Proposed:

> Clock skew is the difference between the clocks of different machines. Logic that compares timestamps from different machines, such as expiry, ordering, locks and token validity, can go wrong when clocks differ. Systems reduce the risk with synchronized time, tolerances, and logical clocks or version numbers. A single machine’s clock can also jump when time synchronization corrects it or a virtual machine pauses, so measure durations and timeouts with a monotonic clock, not the wall clock.

**good_looks_like** (Opus). Accept.

An unbounded tolerance extends the life of expired tokens. Fencing tokens are the real fix for lease logic.

Add or change to:

- A small tolerance on token and certificate checks, seconds to a few minutes, chosen deliberately
- Locks and leases protected by fencing tokens, so a holder whose lease has expired cannot still write
- Durations and timeouts measured with a monotonic clock

Replace or remove:

- Tolerance (leeway) on token and certificate checks
- Lease and lock logic that tolerates clock drift

**search_hints** (Opus). Accept.

Date.now, time.time, now() and timestamp appear in almost every file. Adds the token library settings and the monotonic clock functions that reveal the practice.

Add: `clockTolerance`, `ClockSkew`, `setAllowedClockSkewSeconds`, `acceptLeeway`, `time.monotonic`, `System.nanoTime`, `performance.now`, `Redlock`, `fencing`, `timesyncd`

Remove: `Date.now`, `time.time`, `System.currentTimeMillis`, `now()`, `clockSkew`, `timestamp`, `expires_at`, `lease`

**related** (Opus). Accept.

Multi-region conflict resolution by timestamp is the main place skew causes data loss.

Add: `86`

---

## 5. Sources

- **Confirmed by me this round:** the Terraform AWS provider defaults for `delete_automated_backups` (true), `deletion_protection` (false) and `skip_final_snapshot` (false), through module documentation that quotes the provider.
- **Confirmed in earlier rounds and relevant here:** the Kubernetes client-go leader election documentation (33, related to 95 and 96).
- **Cited by an agent and not opened by me:** the AWS Builders' Library article on timeouts, retries and backoff with jitter, Marc Brooker's backoff and jitter article, the Google SRE book on cascading failures, the Resilience4j, Envoy and Istio documentation, the Hystrix maintenance notice, RFC 9110 and RFC 6585 (retryable status codes), the Stripe idempotency documentation and the IETF idempotency key draft, the Kafka and RabbitMQ documentation, the Python requests, Go net/http and .NET documentation, the AWS disaster recovery whitepaper, the Well-Architected reliability pillar, Principles of Chaos Engineering, AWS Fault Injection Service documentation, and Kleppmann's work. They are standard references and the claims match what I know, but open any you plan to cite.

## 6. Next

I'll walk through decisions 1 to 5 one at a time, as in the earlier rounds.
