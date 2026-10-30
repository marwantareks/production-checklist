# Round 5 triage: Scaling and infrastructure, and Observability and operations (concerns 8, 9, 45 to 47, 88 to 90, 104 and 58 to 66)

Sources: Claude Opus 5.5 (about 100 findings and 9 suggested additions) and Gemini (58 findings and 3 suggested additions). Each agent reviewed the scaling half through the main prompt and the observability half through a standalone prompt, because the second message of the two-message protocol returned the first half again. Neither agent listed any concern as clean.

Nothing here has been applied to the repository. All 104 content edits in section 4 were applied to a scratch copy and pass the schema limits and style rules. They reflect earlier decisions: described patterns go to `look_for`, hint lists respect the cap of 15, and the edits that make a concern partial with evidence to request were checked against the schema change you approved in round 1.

---

## 1. What this round showed

**R1. The two-message protocol failed on the second message.** Both agents sent the first half correctly, then re-sent the first half when asked to continue, twice. A standalone prompt for the observability half worked at once. From round 6 on, large rounds are split into two separate prompts from the start.

**R2. The agents agreed again.** Both agents found the same problems in almost every concern, and neither cleared a single one. Opus found more, about 100 findings to Gemini's 58.

**R3. The outage-safety check found more real problems.**
- **Kubernetes (8):** CPU limits on every container cause throttling and latency spikes even when the node has idle CPU, and a liveness probe that checks a dependency restarts healthy pods during a database slowdown and turns a partial outage into a full one. Both agents found both.
- **Cost optimization (88):** both rated right-sizing critical. Followed literally, it removes the headroom and the idle standby capacity that failover depends on. Spot capacity can also be reclaimed with minutes of notice, and a storage lifecycle rule on the wrong prefix deletes data permanently.
- **Infrastructure as code (104):** both flagged missing destroy protection (Gemini rated it critical): a renamed resource can make the plan replace a production database. State files hold secrets in plain text.
- **Logging (59):** synchronous logging blocks request threads when the disk stalls (Gemini rated it critical), and request bodies, headers and URLs with tokens leak personal data and secrets. Log injection and message lookups, as in Log4Shell, were missing.
- **Metrics (61, 66):** unbounded labels crash the metrics backend, averaging percentiles across instances hides localized outages (Gemini rated it critical), and slicing by customer in 66 contradicted the label rule in 61.
- **Alerts (62):** one failure can page for every dependent service, because alerts are not grouped or deduplicated (Gemini rated it critical).
- **Tracing (60):** auto-instrumentation can record SQL statements, URLs and headers in span attributes, and baggage is sent to every downstream call, including third parties.
- **Error budgets (65):** a release freeze with no exception can block security patches and the fixes that restore reliability.
- **Synthetic checks (58):** checks against production can create real orders, payments or emails.

**R4. Hints again.** Both agents flagged generic or description-style hints in every concern: scale, lambda, span, dns, registry, localStorage, backend, alert, for:, counter, gauge, sli, attributes, labels.

**R5. Applies-when sentences.** Both agents proposed them for four concerns:
- 8 Kubernetes: "Applies when the system runs on Kubernetes or a managed Kubernetes service."
- 60 Distributed tracing: "Applies when requests cross more than one service, queue or background job."
- 89 Cold starts: "Applies when the system uses serverless functions or containers that scale to zero."
- 90 Serverless limits: "Applies when the system uses serverless functions or other platforms with fixed execution limits."

**R6. Check level and ownership.**
- Partial instead of code: 8 Kubernetes and 59 Logging (and 60 Tracing), because cluster operations and central log settings live outside the repository.
- Partial instead of people: 88 Cost optimization and 63 SLOs, because tags, budgets, lifecycle rules and SLOs defined as code can be seen in the repository.
- Guardrail instead of own: 8, 59, 61, 62, 88 and 104. The architect sets the standard and teams implement it.

**R7. Overlaps.** 63 repeated 64 and 65 (indicator and budget policy flags), 58 repeated 61 and 62 (dashboards and alerts), and 66 repeated 59 and 60 (correlation ids). I narrowed each to its own topic.

**R8. One disagreement.** On SLO windows, Opus said they can roll or follow the calendar, and Gemini said rolling is standard. The SRE Workbook allows both, so 63 now says rolling is the default and names the calendar trade-off.

---

## 2. Further changes to the agent prompt

| # | Finding | Agent | Proposed change |
|---|---|---|---|
| P24 | The not_applicable rule refers to an "Applies when" line, but no concern in the prompt has one. Agents may use not_applicable on weak evidence, or never use it. | Opus | Show the Applies when sentences, and say: "If no files for the technology exist after searching all hints (for example no Kubernetes manifests, Helm charts or Kustomize files), use not_applicable and list the searches." |
| P25 | The tfstate hint sends the agent into state files that contain secrets in plain text. "Do not run the code" may not be read as covering terraform, kubectl or helm, which can reach live cloud accounts with ambient credentials. | Opus (major, safety) | "Never run terraform, pulumi, cdk, kubectl, helm or cloud CLIs. If a state file is committed, report its path only and do not open it." |
| P26 | The redaction rules cover credentials but not personal data. Repositories often contain committed log files, data dumps or fixtures with real customer data, and the agent may quote them as evidence. | Opus (major, safety) | "Never quote personal data such as names, emails, phone numbers or addresses. Do not open committed log files or data exports beyond confirming they exist, and report only their path." |
| P27 | Alert routing files contain webhook URLs and integration keys with the secret in the path or query. The current rule redacts only the user information part of a URL. | Opus (major, safety) | "Treat webhook URLs, integration keys and routing keys as secrets. Quote only the key name and write secret value redacted in place of the URL." |
| P28 | Found requires every good practice, but several cannot be shown by code, such as tested escalation paths. Agents will never return found, or guess. | Opus | "Judge found or partial only on the practices the repository can show, and list the others in the note as needing people evidence." |
| P29 | The example in the generated prompt uses a real red flag that states an absence, backed by fake evidence. It nudges agents to report absences that may live outside the repository. | Opus | Show the example finding with an empty red_flags array, and describe the red flag entry in one line: {"flag": "<text exactly as listed>", "evidence": [...]}. |

---

## 3. Decisions for this round

| # | Decision | Status |
|---|---|---|
| 1 | Prompt changes P24 to P29 | **Decided:** accept all six |
| 2 | Check level changes for 8, 59, 60, 63 and 88 | **Decided:** accept all five |
| 3 | New concerns and folds suggested this round | **Decided:** fold everything else and add "Capacity planning and load testing" (own, partial), bringing the plan to 113 concerns |
| 4 | The 104 content edits in section 4 | Open |
| 5 | Round status and sign-off | Open |

### Suggested additions this round (12 suggestions, 11 distinct)

Opus suggested 9 and Gemini 3. Incident response (Opus) and incident management (Gemini) are the same topic.

| Tier | Concern | Suggested by | Why | Where it goes |
|---|---|---|---|---|
| Fold | Graceful shutdown and connection draining | Opus | Rollouts, scale-in, spot reclaims and node drains depend on handling SIGTERM and finishing in-flight work. | 8 and 45 (in the edits), 54 in round 7 |
| Fold | Cloud quotas and service limits | Opus | Quotas, subnet addresses and API rate limits block scaling and failover. Raised in round 3 too. | 45 (in the edits), 90, and 83 in the backlog |
| Fold | Container image security and provenance | Opus | Base image patching, scanning, signing and pinned digests. | 8 (mutable tags flag, in the edits) and the software supply chain concern from round 1 |
| Fold | Audit logging | Opus | Security audit trails need tamper resistance and separate retention. | The security logging and audit trails concern from round 1, and 59 (in the edits) |
| Fold | Telemetry pipeline and cost | Opus | Collectors, sampling and spend are a failure point and a major cost. | 66 and 59 (in the edits) |
| Fold | Dependency and third-party monitoring | Opus | Outages often start in external APIs and identity providers. | 58 (in the edits) and the third-party dependency resilience concern from round 3 |
| Fold | Synthetic monitoring | Gemini | Scripted checks from outside detect reachability and TLS problems. | 58 (already covers it, in the edits) |
| Hold | Incident response, on-call and incident management | Opus, Gemini | Severity tiers, on-call rotations, incident roles and blameless reviews. You removed on-call, postmortems and production incidents earlier as organizational. Raised in rounds 1, 4 and 5. | Not added |
| Consider | Capacity planning and load testing | Opus | Scaling and cost concerns assume tested limits, but nothing asks whether peak load has been modelled and tested. 92 is throughput only. | New concern, or stay folded in 45 to 47 and 88 |
| Consider | Environment configuration management | Opus | How configuration differs between environments, is validated and changes safely is a frequent outage cause. No existing home. | New concern, or stay uncovered |
| Consider | Continuous profiling | Gemini | Finds CPU and allocation hotspots that metrics and traces cannot. | New concern, or a hint in 66 |

---

## 4. Proposed content edits by concern

### 8. Kubernetes

**how_it_works** (Opus). Accept.

Missing graceful termination, a main cause of errors during rollouts and scale-in. A disruption budget that allows zero evictions blocks node drains and cluster upgrades.

Now:

> Kubernetes runs containers across a cluster of machines. It schedules workloads, restarts failed ones, scales them and routes traffic. Reliability depends on correct resource requests and limits, health probes, replica counts spread across zones, disruption budgets and safe rollout settings.

Proposed:

> Kubernetes runs containers across a cluster of machines. It schedules workloads, restarts failed ones, scales them and routes traffic. Reliability depends on correct resource requests and limits, health probes, replica counts spread across zones, disruption budgets that still allow one eviction, safe rollout settings and graceful shutdown within the termination grace period.

**red_flags** (Gemini, Opus). Accept.

Both agents flagged probes: a liveness probe that checks a dependency restarts healthy pods during a database slowdown and turns a partial outage into a full one. Opus adds mutable image tags and network policies. Opus also suggested service account tokens mounted where they are not needed, which I left out to stay within six flags.

Add or change to:

- No resource requests, or no memory limit
- No readiness probe on pods that receive traffic
- Liveness probes that check dependencies such as the database
- Images referenced by mutable tags such as latest
- Containers running as root or with broad privileges, or no network policies

Replace or remove:

- No resource requests or limits
- No readiness or liveness probes
- Containers running as root or with broad privileges

**good_looks_like** (Gemini, Opus). Accept.

Both agents rated this a safety problem: CPU limits on every container cause CFS throttling and latency spikes even when the node has idle CPU. Common practice is to set requests, set memory limits, and use CPU limits deliberately.

Add or change to:

- CPU and memory requests set from measured usage, memory limits set, and CPU limits used only where throttling is acceptable
- At least two replicas spread across zones, with disruption budgets that still allow an eviction
- Readiness probes on serving pods, liveness probes that check only the process, and startup probes for slow starts
- Pods shut down gracefully on SIGTERM within the grace period

Replace or remove:

- Requests and limits set from measured usage
- At least two replicas spread across zones, with disruption budgets
- Probes defined and tuned

**review_question** (Gemini, Opus). Accept.

Both agents: the old question asked two things and neither matched the settings in the lists.

Now:

> Do you need an orchestrator, and who owns cluster operations?

Proposed:

> Are requests, probes, zone spread and disruption budgets set for every production workload, and who enforces them?

**search_hints** (Gemini, Opus). Accept.

Both agents: the hints only found Deployments, and probes had no hint. helm and limits: are generic.

Add: `kind: StatefulSet`, `kind: DaemonSet`, `livenessProbe`, `readinessProbe`, `startupProbe`, `allowPrivilegeEscalation`, `privileged: true`, `Chart.yaml`, `kustomization.yaml`, `NetworkPolicy`

Remove: `resources:`, `limits:`, `replicas:`, `securityContext`, `helm`

**agent check level** (Opus). Accept.

Who operates the cluster, whether nodes span zones and whether requests come from measured usage cannot be seen in the repository.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show. Needs the schema change you approved in round 1.

Add or change to:

- Who operates the cluster and the on-call arrangement
- The node and zone layout of the cluster
- The usage data behind the requests and limits

**ownership** (Opus). Accept.

Choosing Kubernetes is the architect's decision, but almost all the content is about manifest standards that teams implement.

Change from `own` to `guardrail`.

**related** (Opus). Accept.

Health checks and rolling deployments. I dropped 104 to stay within four.

Add: `56`, `54`

Remove: `104`

### 9. Service discovery

**how_it_works** (Gemini, Opus). Accept.

Opus: long-lived connections stay pinned to old instances, a very common gRPC failure. Gemini: disabling caching entirely can overwhelm DNS resolvers.

Now:

> Service discovery lets services find the current network addresses of other services, even as instances start, stop and move. It uses DNS, a registry, or the platform (such as Kubernetes services). Clients must handle changes and failures when the registry or DNS is slow or stale.

Proposed:

> Service discovery lets services find the current network addresses of other services, even as instances start, stop and move. It uses DNS, a registry, or the platform (such as Kubernetes services). Clients must handle changes and failures when the registry or DNS is slow or stale, cache resolution safely without overwhelming resolvers, and refresh long-lived connections such as gRPC or HTTP/2, because a Kubernetes ClusterIP balances connections, not requests.

**red_flags** (Opus). Accept.

Consensus-based registries such as Consul and etcd need an odd quorum, and two servers tolerate no failure. The review question asks about a registry outage but neither list answered it.

Add or change to:

- Clients that cache DNS results forever, or never refresh long-lived connections
- A registry without a quorum of three or five servers
- Every call fails when the registry is unreachable

Replace or remove:

- Clients that cache DNS results forever
- A single registry instance

**good_looks_like** (Opus). Accept.

Matches the red flags and the review question.

Add or change to:

- The registry runs as a quorum of three or five servers across zones
- Clients keep the last known healthy addresses if the registry is unavailable

Replace or remove:

- The registry runs redundantly

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> How do services find healthy peers, and what happens if the registry is down?

Proposed:

> How do client services maintain availability when the discovery registry or DNS resolver degrades?

**search_hints** (Gemini, Opus). Accept.

dns, registry and localhost: match almost every repository, and headless matches headless browsers.

Add: `eureka.client`, `spring.cloud.discovery`, `CoreDNS`, `aws_service_discovery`, `servicediscovery`, `clusterIP: None`, `.svc.cluster.local`, `sun.net.inetaddr.ttl`, `kube-dns`, `_tcp.`

Remove: `eureka`, `service discovery`, `dns`, `headless`, `registry`, `localhost:`

### 45. Autoscaling

**how_it_works** (Gemini, Opus). Accept.

Gemini: memory as a signal causes persistent upward scaling. Opus: pod autoscaling only helps if nodes exist, and the node autoscaler takes minutes and can be blocked by quotas.

Now:

> Autoscaling adds and removes instances automatically based on load signals such as CPU, memory, request rate or queue depth. Settings include minimum and maximum counts, the metric and target, and cooldown periods. It can react too slowly for sudden spikes and can scale into the limits of dependencies such as the database.

Proposed:

> Autoscaling adds and removes instances automatically based on load signals such as CPU, request rate or queue depth. Memory is rarely a good signal, because garbage-collected runtimes keep memory after load falls. Settings include minimum and maximum counts, the metric and target, and cooldown periods. New pods need node capacity, which takes minutes to add and which quotas or subnet addresses can block. It can react too slowly for spikes and can scale into the limits of dependencies such as the database.

**red_flags** (Gemini, Opus). Accept.

Opus: HPA utilization targets are a percentage of the request, and a fixed replicas value resets the count on every apply. Gemini: scale-in dropping work is caused by missing graceful shutdown.

Add or change to:

- Utilization targets with no resource requests set
- A fixed replicas value in manifests that an autoscaler also manages
- Scale-in without graceful shutdown or connection draining, so active work is dropped

Replace or remove:

- Scale-in so aggressive that it drops active work

**good_looks_like** (Opus). Accept.

The scale-in red flag had no matching good practice. HPA calls its cooldown a stabilization window.

Add or change to:

- Warm-up and stabilization or cooldown set and tested
- Scale-in drains connections and lets in-flight work finish within the termination grace period

Replace or remove:

- Warm-up and cooldown set and tested

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> What metric triggers scaling, and are limits and cooldowns set?

Proposed:

> What bottleneck metric determines autoscaling thresholds, and what are its upper and lower bounds?

**search_hints** (Gemini, Opus). Accept.

scale matches CSS transforms and image code.

Add: `ScaledObject`, `stabilizationWindowSeconds`, `scaleTargetRef`, `aws_autoscaling_group`, `aws_appautoscaling_policy`, `azurerm_monitor_autoscale_setting`, `google_compute_autoscaler`, `karpenter`, `cluster-autoscaler`

Remove: `autoscaling`, `min_size`, `max_size`, `scaling policy`, `scale`

**related** (Opus). Accept.

Cold starts slow the scaling response. I dropped 90 to stay within four.

Add: `89`

### 46. Horizontal scaling

**definition** (Gemini, Opus). Accept.

Machines is inaccurate for containers and functions.

Now:

> Adding more machines.

Proposed:

> Adding more instances of a service to share the load.

**undefined** (Opus). Accept.

"Near-linear capacity growth" overclaimed and contradicted how_it_works.

Now:

> Near-linear capacity growth and resilience versus state and coordination complexity.

Proposed:

> Capacity and resilience grow with instances until a shared store or coordination becomes the limit, versus state and coordination complexity.

**red_flags** (Opus). Accept.

In-memory rate limiters multiply their effective limit by the instance count.

Add or change to:

- Rate limits, counters or connection state kept in instance memory

**search_hints** (Gemini, Opus). Accept.

Both agents: localStorage is browser storage and says nothing about server state, and /tmp is normal for single-request work. session matches almost every web app. Gemini also noted that Part B repeats localStorage, so removing it here fixes the agent prompt too.

Add: `express-session`, `MemoryStore`, `HttpSession`, `sessionAffinity`, `ClientIP`, `IMemoryCache`, `lru-cache`, `node-cron`, `APScheduler`, `ShedLock`, `Quartz`, `persistentVolumeClaim`

Remove: `session`, `localStorage`, `/tmp`, `in-memory`, `static map`, `sticky`, `replicas`, `cron`

**related** (Opus). Accept.

Jobs that assume one instance need locks. I dropped 33 and 28 to stay within four.

Add: `38`

### 47. Vertical scaling

**how_it_works** (Opus). Accept.

"Needs no code change" is often false in effect: a fixed JVM heap or a single-threaded process does not use extra capacity until reconfigured.

Now:

> Vertical scaling gives one machine more CPU, memory or storage. It is simple, needs no code change and is quick for databases and legacy applications. It has a ceiling, usually needs a restart, and leaves one larger component as a single point of failure.

Proposed:

> Vertical scaling gives one machine more CPU, memory or storage. It is simple, needs no architecture change and is quick for databases and legacy applications, but runtime settings such as heap size, worker count and pool sizes often must be raised to use the capacity. It has a ceiling and usually needs a restart, and a managed database resize usually means a failover with brief disconnects. It leaves one larger component as a single point of failure.

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> How far can a bigger machine take you, and where is the ceiling?

Proposed:

> What is the hardware resource ceiling for the current architecture, and when will it be reached?

**related** (Gemini, Opus). Accept.

Both agents suggested database links. The next step after the ceiling is usually read replicas, sharding or partitioning.

Add: `29`, `30`

### 58. Monitoring

**review_question** (Gemini, Opus). Accept.

Both agents: the old question asked two things, and who is looking at the dashboards invites an answer that cannot be judged from evidence.

Now:

> Which signals are watched continuously, and who is looking at them?

Proposed:

> Which user-facing signals are monitored for each service and dependency, and how would you know if monitoring itself stopped working?

**red_flags** (Gemini, Opus). Accept.

Both agents flagged the most common silent failure: failed scrapes, a dead agent or a broken alert route look like a healthy system, because missing data does not fire threshold alerts.

Add or change to:

- No alert when monitoring stops collecting data or cannot deliver alerts

**good_looks_like** (Opus). Accept.

Synthetic checks against production can create real orders, payments or emails. The first item points to 61 and 62 so this concern stays on coverage, synthetic checks and the independence of the monitoring stack.

Add or change to:

- Every service and key dependency is covered by the metrics in 61 and the alerts in 62
- Synthetic checks cover the main user journeys, using test accounts and flagged traffic that cannot trigger real payments, messages or data changes
- An always-firing heartbeat alert checked from outside, and alerts on missing data

Replace or remove:

- Every service has dashboards for rate, errors, duration and saturation
- Synthetic checks cover the main user journeys

**search_hints** (Gemini, Opus). Accept.

dashboard, synthetic and uptime are generic. Adds configuration literals for common stacks.

Add: `scrape_configs`, `ServiceMonitor`, `PrometheusRule`, `blackbox_exporter`, `grafana_dashboard`, `datadog_monitor`, `datadog_synthetics_test`, `aws_cloudwatch_metric_alarm`, `aws_synthetics_canary`, `azurerm_monitor`, `google_monitoring_uptime_check_config`, `pingdom`, `uptime_kuma`

Remove: `prometheus`, `grafana`, `datadog`, `cloudwatch`, `dashboard`, `alertmanager`, `synthetic`, `uptime`

### 59. Logging

**how_it_works** (Gemini, Opus). Accept.

Gemini rated this critical: synchronous logging on request paths blocks worker threads when the disk or log daemon stalls. Opus: retention is not one setting, because audit logs and personal-data logs have different rules, and access to logs was not mentioned.

Now:

> Logging records events from the application for debugging, audit and analysis. Good logs are structured (such as JSON), carry a request or trace id, use levels consistently, avoid sensitive data and are collected centrally with retention rules.

Proposed:

> Logging records events from the application for debugging, audit and analysis. Good logs are structured (such as JSON), carry a request or trace id, use levels consistently, avoid sensitive data and are collected centrally. Logging should not block requests, so writes are asynchronous with bounded buffers. Audit logs need tamper-resistant storage and a minimum retention, while other logs are kept no longer than needed and with restricted access, because they often contain personal data.

**red_flags** (Opus). Accept.

Opus: missing leak paths (bodies, headers, URLs with tokens, exception messages), and missing log injection, including libraries that evaluate lookups in messages, as in Log4Shell. Masking in the shipping pipeline is too late.

Add or change to:

- Request or response bodies, headers or full URLs logged without filtering
- User input written to logs without encoding, or logging libraries with message lookups enabled

**good_looks_like** (Gemini, Opus). Accept.

Both agents: asynchronous logging. Opus: high-volume logs drive large bills, so volume and cost need tracking.

Add or change to:

- Sensitive fields removed or masked in the application before logs are written
- Logging is asynchronous with a bounded buffer, and high-volume logs are sampled or rate limited, with volume and cost tracked

Replace or remove:

- Sensitive data excluded or masked

**review_question** (Gemini, Opus). Accept.

The old question had four parts. Both agents asked for a narrower question.

Now:

> What is logged, with what structure, retention and privacy handling?

Proposed:

> What is logged for each service, and how are sensitive fields kept out of it?

**search_hints** (Gemini, Opus). Accept.

Both agents: password in a log call and Authorization header in a log call are task descriptions, not search strings, and correlation id rarely matches code. They move to look_for.

Add: `log4j2.xml`, `logback.xml`, `Serilog`, `NLog`, `go.uber.org/zap`, `zerolog`, `logrus`, `MDC`, `X-Request-ID`, `retention_in_days`

Remove: `logger`, `logging`, `log4j`, `password in a log call`, `Authorization header in a log call`, `correlation id`

**agent check level** (Opus). Accept.

Central shipping, retention and runtime level control often live in platform or vendor settings outside the repository.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- The central log platform and its retention settings
- Who can read production logs

**ownership** (Opus). Accept.

The architect sets the logging standard (format, fields, sensitive data rules, retention) and teams implement it.

Change from `own` to `guardrail`.

**related** (Opus). Accept.

Adds a link to secrets management.

Add: `67`

### 60. Distributed tracing

**how_it_works** (Gemini, Opus). Accept.

Gemini: more than a trace id is passed (parent span id and flags). Opus: keeping errors and slow requests is impossible with head-based sampling, the default in most SDKs, and queues need the context in message headers.

Now:

> Distributed tracing follows one request across services. A trace id is created at the entry point and passed along every call and message, and each step records a span with timing. Traces show where time goes and where failures start, and standards such as OpenTelemetry define the formats.

Proposed:

> Distributed tracing follows one request across services. A trace context, with the trace id, the parent span id and sampling flags, is created at the entry point and passed along every call, and for messages it travels in message headers. Each step records a span with timing. Head sampling decides at the start of a request, so keeping all errors and slow requests needs tail sampling in a collector. Standards such as OpenTelemetry define the formats.

**red_flags** (Opus). Accept.

Auto-instrumentation can record SQL statements, URLs and headers in span attributes, and baggage is propagated to every downstream call, including third parties.

Add or change to:

- Personal data or secrets in span attributes or baggage
- Trace context from untrusted callers accepted without limits

**good_looks_like** (Opus). Accept.

The sampling item now says what it needs.

Add or change to:

- Tail sampling that keeps errors and slow requests

Replace or remove:

- Sampling that keeps errors and slow requests

**search_hints** (Gemini, Opus). Accept.

Both agents: span matches HTML span tags in every frontend, and propagat is an unanchored stem.

Add: `@opentelemetry/`, `opentelemetry-instrumentation`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_SAMPLER`, `tail_sampling`, `TracerProvider`, `TextMapPropagator`, `ActivitySource`, `tracestate`, `dd-trace`, `aws-xray-sdk`

Remove: `opentelemetry`, `otel`, `trace_id`, `span`, `x-ray`, `tracer`, `propagat`

**agent check level** (Opus). Accept.

Sampling rules and collector configuration often live in a platform repository or vendor settings.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- The sampling rules and collector configuration
- A trace that crosses a queue or background job

### 61. Metrics

**how_it_works** (Gemini, Opus). Accept.

Both agents: high cardinality crashes the metrics store, not just costs more. Opus: RED, USE and counters versus gauges were used without explanation.

Now:

> Metrics are numeric measurements collected over time, such as request rate, error rate, latency, CPU, queue depth and business counts. They are cheap to store and fast to query, so they drive dashboards and alerts. Labels (dimensions) add detail, but too many unique values make them expensive.

Proposed:

> Metrics are numeric measurements collected over time, such as request rate, error rate, latency, CPU, queue depth and business counts. Counters only increase and are read as rates, and gauges hold a current value. Request rate, errors and duration (RED) suit services, and utilization, saturation and errors (USE) suit resources. Metrics are cheap only while label values stay bounded, because unbounded labels can overload or crash the metrics backend.

**red_flags** (Gemini, Opus). Accept.

Gemini rated averaging percentiles critical: an average of p95 or p99 values across nodes is meaningless and hides localized outages. Opus: more causes of unbounded labels.

Add or change to:

- Labels with unbounded values, such as user ids, raw URL paths, error messages or request ids
- Latency measured with averages, or percentiles averaged across instances, instead of histograms

Replace or remove:

- Labels with unbounded values such as user ids

**good_looks_like** (Opus). Accept.

Averages hide tail latency, and precomputed percentiles cannot be combined across instances.

Add or change to:

- Rate, errors and duration for every service, with duration recorded as a histogram, and saturation for resources

Replace or remove:

- Rate, errors and duration for every service, and saturation for resources

**search_hints** (Gemini, Opus). Accept.

counter, gauge, histogram and metrics are common words in unrelated code.

Add: `prometheus_client`, `client_golang`, `@Timed`, `MeterProvider`, `create_counter`, `create_histogram`, `System.Diagnostics.Metrics`, `dogstatsd`, `StatsD`, `ServiceMonitor`, `histogram_quantile`

Remove: `prometheus`, `counter`, `histogram`, `gauge`, `statsd`, `metrics`, `otel metrics`

**ownership** (Opus). Accept.

The architect sets the metrics standard (signals, naming, label rules) and teams instrument.

Change from `own` to `guardrail`.

**related** (Opus). Accept.

Latency percentiles link to 93.

Add: `93`

### 62. Alerts

**definition** (Opus). Accept.

The old definition tied alerts to thresholds, which contradicts how_it_works. Alerts also fire on missing data, logs and synthetic failures.

Now:

> Notifications when metrics cross thresholds.

Proposed:

> Notifications to people when the system needs action.

**how_it_works** (Opus). Accept.

Missing the distinction between pages and tickets, and multiwindow burn rate alerting.

Now:

> Alerts notify people when something needs action. Good alerts are tied to user impact or error budget burn, have a clear owner, link to a runbook and fire rarely enough that people trust them. Too many or noisy alerts cause fatigue, and too few leave outages unnoticed.

Proposed:

> Alerts notify people when something needs action. Good alerts are tied to user impact or error budget burn, have a clear owner, link to a runbook and fire rarely enough that people trust them. Only urgent, actionable problems page someone, and the rest become tickets. Budget burn alerts compare a short and a long window, so fast burns page and slow burns open a ticket. Too many or noisy alerts cause fatigue, and too few leave outages unnoticed.

**red_flags** (Gemini, Opus). Accept.

Gemini rated alert storms critical. Without grouping, deduplication and inhibition, one failure pages for every dependent service and hides the cause.

Add or change to:

- One failure triggers many separate pages because alerts are not grouped or deduplicated

**good_looks_like** (Opus). Accept.

Symptom-only was too absolute: some cause alerts predict impact before users feel it, and removing them loses early warning.

Add or change to:

- Pages based on symptoms users feel, plus a few cause alerts for problems that will soon cause impact, such as a disk, certificate or quota about to run out

Replace or remove:

- Alerts based on symptoms that users feel

**review_question** (Gemini, Opus). Accept.

The old question asked two things.

Now:

> Does every alert map to an action, and who is paged?

Proposed:

> Does every alert that pages someone have an owner, a runbook and a defined action?

**search_hints** (Gemini, Opus). Accept.

alert matches alert() in JavaScript, and for: matches loops and YAML keys. Adds rule and routing literals.

Add: `PrometheusRule`, `alerting_rules`, `expr:`, `runbook_url`, `alertmanager.yml`, `receivers:`, `group_by`, `inhibit_rules`, `pagerduty_service`, `opsgenie_`, `aws_cloudwatch_metric_alarm`, `datadog_monitor`, `azurerm_monitor_metric_alert`, `google_monitoring_alert_policy`

Remove: `alert`, `alertmanager`, `pagerduty`, `opsgenie`, `severity`, `runbook`, `for:`, `threshold`, `notification`, `escalation`

**ownership** (Opus). Accept.

The architect sets alerting standards (symptom based, runbook, owner, paging rules) and teams write and tune alerts.

Change from `own` to `guardrail`.

### 63. SLOs

**how_it_works** (Gemini, Opus). Accept.

Opus: the SLA versus SLO distinction and the ceiling set by dependencies. Gemini: rolling windows are standard. The two agents differ on windows (Opus: either; Gemini: rolling), and the SRE Workbook allows both, so I kept rolling as the default and named the calendar trade-off.

Now:

> A service level objective is a reliability target for a measurable service level indicator over a period, for example 99.9% of requests succeed over 30 days. The gap between the target and 100% is the error budget, which the team can spend on change and risk.

Proposed:

> A service level objective is a reliability target for a measurable service level indicator over a rolling window, for example 99.9% of requests succeed over 30 days. The gap between the target and 100% is the error budget. Calendar windows reset the budget on a fixed date, which can hide a bad end of period. An SLA is a contractual promise and should be looser than the internal SLO, and a target above what critical dependencies provide cannot be met.

**red_flags** (Gemini, Opus). Accept.

Opus: the indicator and budget policy flags repeat 64 and 65, so they would give double findings. Gemini: a target stricter than the dependency can deliver.

Add or change to:

- Targets stricter than what critical dependencies and the platform can deliver
- SLOs that nobody agreed with the business

Replace or remove:

- No indicator that reflects user experience
- No consequence when the error budget is spent

**review_question** (Gemini). Accept.

The old question asked two things. Gemini's wording was compound too, so I used one question.

Now:

> Are SLOs defined from user impact and agreed with the business?

Proposed:

> Which user journeys have an SLO, and who agreed the targets?

**agent check level** (Opus). Accept.

SLOs are often defined as code (OpenSLO, Sloth, Pyrra, Terraform resources), and 64 is already partial with similar hints.

Change from `people` to `partial`.

**search_hints** (Opus). Accept.

Hints for SLOs defined as code.

Add: `openslo`, `sloth.slok.dev`, `pyrra.dev`, `ServiceLevelObjective`, `datadog_service_level_objective`, `google_monitoring_slo`

### 64. SLIs

**how_it_works** (Gemini, Opus). Accept.

Both agents: the standard definition is good events over valid events, not total events. The exclusion must be explicit, or teams exclude real failures.

Now:

> A service level indicator is a measurement of one aspect of service quality from the user’s point of view, such as the share of requests that succeed or complete within a time limit. It is expressed as a ratio of good events to total events and feeds the SLO.

Proposed:

> A service level indicator is a measurement of one aspect of service quality from the user’s point of view, such as the share of requests that succeed or complete within a time limit. It is expressed as a ratio of good events to valid events, where valid events exclude traffic that should not count, such as health checks, bots or malformed client requests, and it feeds the SLO.

**good_looks_like** (Opus). Accept.

Follows the correction above and adds the classification rules.

Add or change to:

- Good and valid events defined clearly, including which responses count as failures and which requests are excluded

Replace or remove:

- Good and total events defined clearly

**search_hints** (Gemini, Opus). Accept.

sli matches slice and slider, and good events and total events are prose. Adds the SLO tooling literals.

Add: `openslo`, `sloth.slok.dev`, `pyrra.dev`, `ServiceLevelObjective`, `ServiceLevelIndicator`, `PrometheusServiceLevel`, `datadog_service_level_objective`, `google_monitoring_slo`, `sli_error`, `good_events`, `valid_events`

Remove: `sli`, `slo`, `success rate`, `good events`, `total events`, `availability`, `sloth`

**related** (Opus). Accept.

Latency SLIs depend on histograms, and SLIs drive burn rate alerts. I dropped 93 to stay within four.

Add: `65`, `62`

### 65. Error budgets

**how_it_works** (Gemini, Opus). Accept.

Opus: low-traffic services and dependency or planned-work burn need rules. Gemini: multiwindow burn rate alerting.

Now:

> An error budget is the amount of unreliability an SLO allows, such as 0.1% of requests over 30 days for a 99.9% target. While budget remains, the team can ship changes and take risks. When it is spent, effort shifts to reliability. It needs an agreed policy to be useful.

Proposed:

> An error budget is the amount of unreliability an SLO allows, such as 0.1% of requests over 30 days for a 99.9% target. While budget remains, the team can ship changes and take risks. When it is spent, effort shifts to reliability. It needs an agreed policy that says how burn from dependencies or planned work is counted, and low-traffic services may need longer windows. Alerts compare burn rate over a short and a long window.

**red_flags** (Gemini). Accept.

If pipelines keep shipping feature changes while the budget is exhausted, the policy is cosmetic.

Add or change to:

- Risky changes continue to ship without restriction when the budget is exhausted

**good_looks_like** (Opus). Accept.

Safety: with no exception, the policy can block security patches and the fixes that restore reliability.

Add or change to:

- Budget burn drives alerts and release decisions, with security patches and reliability fixes exempt from any freeze

Replace or remove:

- Budget burn drives alerts and release decisions

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> What happens when the budget is spent, and who decides?

Proposed:

> What happens to releases when the error budget is spent?

**related** (Opus). Accept.

Budget tracking depends on SLIs and drives alerts. I dropped 6 to stay within four.

Add: `64`, `62`

Remove: `6`

### 66. Observability

**definition** (Gemini). Accept.

Gemini: the old definition left out wide structured events. Profiling is left to the additions discussion.

Now:

> Understanding internal state from logs, metrics and traces.

Proposed:

> Understanding internal state from logs, metrics, traces and wide events.

**how_it_works** (Opus). Accept.

Safety: slicing by customer contradicts 61, which flags user ids as metric labels. Followed literally, customer ids become labels and overload the backend.

Now:

> Observability is the ability to understand what a system is doing from the data it produces (logs, metrics and traces), including answering questions you did not plan for. It needs rich, correlated data, consistent identifiers and the ability to slice by attributes such as customer, version and region.

Proposed:

> Observability is the ability to understand what a system is doing from the data it produces (logs, metrics, traces and wide events), including answering questions you did not plan for. It needs rich, correlated data, consistent identifiers and the ability to slice by attributes such as customer, version and region. High-cardinality attributes such as customer belong on traces, logs and events, not metric labels, and follow the same personal data rules as logs.

**red_flags** (Opus). Accept.

The old first flag repeats the correlation flags in 59 and 60.

Add or change to:

- No way to move from an alert to the related traces and logs

Replace or remove:

- Logs, metrics and traces not connected by a shared identifier

**good_looks_like** (Opus). Accept.

The telemetry pipeline is a failure point: blocking exporters slow the application when the backend is down, and an unprotected collector runs out of memory and drops everything.

Add or change to:

- Telemetry exporters do not block the application, and the collector has memory limits and buffers

**search_hints** (Gemini, Opus). Accept.

attributes and labels are generic. I kept the hints vendor neutral, since Opus noted that honeycomb, tempo and loki favor specific vendors.

Add: `OTEL_RESOURCE_ATTRIBUTES`, `service.version`, `deployment.environment`, `otel-collector`, `otelcol`, `memory_limiter`, `processors:`, `exporters:`, `semconv`, `TracerProvider`, `Pyroscope`

Remove: `opentelemetry`, `correlation`, `structured log`, `attributes`, `labels`, `honeycomb`, `tempo`, `loki`, `telemetry`

**related** (Gemini, Opus). Accept.

Metrics and alerts were missing. I dropped 58 to stay within four.

Add: `61`, `62`

Remove: `58`

### 88. Cost optimization

**how_it_works** (Gemini, Opus). Accept.

Both agents: spot capacity can be reclaimed with minutes of notice. Opus: lifecycle expiration deletes data permanently, and a rule on the wrong prefix or shorter than legal retention causes data loss.

Now:

> Cost optimization keeps cloud spend in line with value. It covers right-sizing resources, removing idle ones, choosing pricing models (reserved, spot, savings plans), setting storage lifecycle rules and tagging resources so costs can be traced to teams and products.

Proposed:

> Cost optimization keeps cloud spend in line with value. It covers right-sizing resources with headroom for peaks and failover, removing idle ones, choosing pricing models (reserved capacity, savings plans, or spot only for interruptible, stateless work), setting storage lifecycle rules that expire data only within agreed retention periods, and tagging resources so costs can be traced to teams and products.

**red_flags** (Opus). Accept.

Commonly missed cost drivers, and idle resources are often disaster recovery standbys.

Add or change to:

- Large data transfer between regions, zones, NAT gateways or to the internet not considered in design
- Capacity counted in failover or disaster recovery plans removed as idle
- No upper bound on autoscaled or serverless capacity

Replace or remove:

- Large data transfer between regions or to the internet not considered in design

**good_looks_like** (Gemini, Opus). Accept.

Both agents rated this critical: followed literally, right-sizing and removing idle resources cause outages. Changes need peak data, a load test and a rollback path.

Add or change to:

- Right-sizing based on peak usage over a full business cycle, load tested, with headroom for spikes and failover, and reversible

Replace or remove:

- Regular right-sizing and cleanup

**review_question** (Gemini, Opus). Accept.

The old question asked two things.

Now:

> Who owns cloud cost, and are resources right-sized and tagged?

Proposed:

> Who owns cloud cost for this system, and how is it tracked against a budget?

**agent check level** (Opus). Accept.

Tags, budgets and lifecycle rules are usually in infrastructure code, so part of this concern is checkable from the repository.

Change from `people` to `partial`.

**search_hints** (Opus). Accept.

Hints for tags, budgets, lifecycle rules and spot configuration.

Add: `default_tags`, `aws_budgets_budget`, `aws_ce_anomaly_monitor`, `azurerm_consumption_budget_subscription`, `google_billing_budget`, `aws_s3_bucket_lifecycle_configuration`, `lifecycle_rule`, `instance_market_options`

**ownership** (Opus). Accept.

Cost work is mostly done by teams and finance against standards the architect sets: tagging, budgets and cost estimates in designs.

Change from `own` to `guardrail`.

### 89. Cold starts

**definition** (Opus). Accept.

Cold starts happen on every scale-out and deployment, not only after idle.

Now:

> Startup delay when a serverless function spins up from idle.

Proposed:

> Startup delay when a new instance of a function or container starts, after idle, during scale-out or after a deployment.

**how_it_works** (Gemini, Opus). Accept.

Both agents: keeping instances warm with pings is unreliable and does nothing for concurrent bursts.

Now:

> A cold start is the delay when a serverless function or container starts a new instance, loading the runtime and code before handling the first request. It depends on language, package size, initialization work and network setup. Mitigations are smaller packages, lazy loading, provisioned capacity and keeping instances warm.

Proposed:

> A cold start is the delay when a serverless function or container starts a new instance, loading the runtime and code before handling the first request. It depends on language, package size, initialization work and network setup. Mitigations are smaller packages, lazy loading, and provisioned or minimum instances. Scheduled pings keep only one instance warm and do not help with bursts.

**red_flags** (Opus). Accept.

Provider guidance says to create reusable clients and connections outside the handler, so the flag should target unnecessary work, not initialization itself.

Add or change to:

- Startup work not needed by most requests, such as loading unused modules or calling services that could be called lazily

Replace or remove:

- Heavy initialization such as many network calls at startup

**good_looks_like** (Opus). Accept.

Snapshot restore reuses memory state, so random seeds, unique ids, credentials and connections created at init can be duplicated or stale across instances.

Add or change to:

- Snapshot-based startup used only after unique values and connections are re-created on restore

**search_hints** (Gemini, Opus). Accept.

Both agents: lambda matches lambda expressions in Python, Java and C#.

Add: `aws_lambda_function`, `AWS::Serverless::Function`, `serverless.yml`, `provisioned_concurrent_executions`, `ProvisionedConcurrencyConfig`, `min_instance_count`, `minScale`, `startup-cpu-boost`, `azurerm_linux_function_app`, `FUNCTIONS_WORKER_RUNTIME`

Remove: `lambda`, `cloud functions`, `provisioned concurrency`, `min instances`, `cloud run min instances`

### 90. Serverless limits

**how_it_works** (Gemini, Opus). Accept.

Both agents: temporary disk was missing. Opus adds the front-door timeout, retried events and recursive invocation loops.

Now:

> Serverless platforms impose limits on execution time, memory, payload size, concurrency, request rate and package size. Designs must work inside them: long jobs are split or moved, large payloads go through storage, and concurrency limits are planned so a spike does not starve other functions or overload a database.

Proposed:

> Serverless platforms impose limits on execution time, memory, temporary disk, payload size, concurrency and request rate. Designs must work inside them: long jobs are split or moved, large payloads go through storage, and concurrency is planned so a spike does not overload a database. The caller’s timeout, such as an API gateway, may be shorter than the function’s. Event sources retry failed work, so handlers must be idempotent, and a function that triggers itself can loop and run up a large bill.

**red_flags** (Opus). Accept.

A function timeout close to the queue visibility timeout makes messages reappear while still processing. AWS recommends a visibility timeout of at least six times the function timeout for SQS.

Add or change to:

- Queue visibility timeout not well above the function timeout

**good_looks_like** (Opus). Accept.

Reserved concurrency also caps the function. Set too low it throttles traffic, and set to zero it stops the function.

Add or change to:

- Reserved or limited concurrency for critical functions, sized from peak load and tested, with throttling monitored

Replace or remove:

- Reserved or limited concurrency set for critical functions

**search_hints** (Gemini, Opus). Accept.

timeout, payload, quota, concurrency and 413 are generic.

Add: `reserved_concurrent_executions`, `ReservedConcurrentExecutions`, `maximum_concurrency`, `ephemeral_storage`, `function_timeout`, `timeoutSeconds`, `max_instance_request_concurrency`, `maxInstances`, `client_max_body_size`, `visibility_timeout_seconds`, `AWS::Lambda::Function`

Remove: `timeout`, `memory_size`, `reserved concurrency`, `payload`, `413`, `quota`, `concurrency`

**related** (Opus). Accept.

Concurrency bursts exhaust database connections and retried events need idempotency. I dropped 11 to stay within four.

Add: `28`, `14`

### 104. Infrastructure as code

**how_it_works** (Gemini, Opus). Accept.

Both agents: state files store many secrets in plain text, even when marked sensitive.

Now:

> Infrastructure as code defines servers, networks, databases and permissions in files that are version-controlled, reviewed and applied by tools, so environments are reproducible and changes are traceable. It requires controls on state, secrets and who can apply changes.

Proposed:

> Infrastructure as code defines servers, networks, databases and permissions in files that are version-controlled, reviewed and applied by tools, so environments are reproducible and changes are traceable. State files can hold secrets in plain text, so state needs encryption, locking and restricted access, and only the pipeline should apply changes.

**red_flags** (Gemini, Opus). Accept.

Both agents flagged destroy protection (Gemini rated it critical): a renamed resource or changed immutable field makes the plan replace a database or bucket, and nothing stops it.

Add or change to:

- Secrets in code, or state that holds secrets without encryption and restricted access
- Stateful resources without destroy or deletion protection
- Plans that destroy or replace resources applied without explicit approval

Replace or remove:

- Secrets in code or state files

**good_looks_like** (Opus). Accept.

how_it_works mentioned who can apply, but the good practices did not.

Add or change to:

- Remote state encrypted, locked and readable only by the pipeline and a few people
- Changes reviewed through pull requests with a plan output, and the reviewed plan applied by the pipeline with short-lived least-privilege credentials
- Provider and module versions pinned and the lock file committed

Replace or remove:

- Remote state with locking and restricted access
- Changes reviewed through pull requests with a plan output

**review_question** (Opus). Accept.

The old question asked three things in one.

Now:

> Is all infrastructure defined in code, reviewed and reproducible?

Proposed:

> Could you recreate production from version-controlled code alone, through a reviewed pipeline?

**search_hints** (Gemini, Opus). Accept.

backend matches backend folders in most web projects. Adds OpenTofu, Google Cloud and the protection settings.

Add: `*.tf`, `.terraform.lock.hcl`, `terraform.tfstate`, `AWSTemplateFormatVersion`, `Pulumi.yaml`, `*.bicep`, `cdk.json`, `opentofu`, `google_`, `crossplane`, `prevent_destroy`, `deletion_protection`, `use_lockfile`, `backend "s3"`, `DeletionPolicy`

Remove: `terraform`, `pulumi`, `cloudformation`, `bicep`, `main.tf`, `backend`, `tfstate`, `aws_`, `azurerm_`, `cdk`

**ownership** (Opus). Accept.

The architect sets the infrastructure code standard and teams implement it.

Change from `own` to `guardrail`.

**related** (Opus). Accept.

Disaster recovery depends on having the definition. I dropped 68 to stay within four.

Add: `83`

---

## 5. Sources

- **Confirmed by me this round:** the AWS Lambda documentation on SQS event sources (set the queue visibility timeout to at least six times the function timeout, plus the batching window, and the function timeout cannot exceed it), which supports the new red flag in 90. For liveness probes (8), several independent guides agree that a probe should check only the process and never its dependencies, and that slow starts need a startup probe, but those are secondary sources and I have not opened the primary Kubernetes probe page. CPU limits and CFS throttling, Terraform state and destroy protection, and the Prometheus and SRE guidance match what I know and what both agents independently reported. The Terraform provider defaults were confirmed in round 3.
- **Cited by an agent and not opened by me:** the Kubernetes documentation on resources, probes, disruptions and autoscaling, the gRPC load balancing note, the etcd and Consul consensus documentation, the AWS Lambda documentation on concurrency, SnapStart, SQS and limits, the AWS EC2 and Google Cloud spot documentation, the Well-Architected cost pillar, the Terraform documentation on state and lifecycle, the OWASP logging cheat sheet, CWE-117, the OpenTelemetry documentation, the W3C Trace Context specification, the Prometheus documentation on histograms and labels, the Google SRE book and workbook chapters, and Observability Engineering. Open any you plan to cite.

## 6. Next

I'll walk through decisions 1 to 5 one at a time.
