# Round 7 triage: Build, deployment and release (concerns 6, 51 to 57, 103, 107, 108)

Sources: four complete replies, one per agent and prompt. For release strategies (7a, concerns 6 and 51 to 55): Claude Opus 5.5 and Gemini. For health and build hygiene (7b, concerns 56, 57, 103, 107, 108): Claude Opus 5.5 and Gemini. About 98 findings from Opus and 38 from Gemini, and 16 suggested additions. Neither agent listed any concern as clean.

Nothing here has been applied to the repository. All 85 content edits in section 4 were applied to a scratch copy and pass the schema limits and style rules. They reflect earlier decisions: described patterns go to `look_for`, hint lists respect the cap of 15, and the edits that make a concern partial with evidence to request were checked against the schema change you approved in round 1.

---

## 1. What this round showed

**R1. Two mistakes of mine surfaced.**
- **Lockfiles (P17).** Both agents in 7b found that the rule I proposed in round 4, "ignore lockfiles in searches and evidence", stops an agent from judging concern 108, which depends on lockfiles. An obedient agent would report "no lock file" falsely. The fix is P39 below.
- **A missing index.** Gemini twice reported that concerns 107 and 57 "do not exist". They do. The prompts split one category in two, and Part D, the index of other concerns, left out the other half. This round's replies are otherwise unaffected, and I discarded those two findings. No category is split again after this round.

**R2. The agents agreed again.** Both agents found the same problems in almost every concern, and Opus found more.

**R3. The outage-safety check found more real problems.**
- **CI/CD (6):** pipelines that let pull requests from forks read secrets, third-party actions referenced by a mutable tag, broad default tokens, gates that can be skipped, and an artifact rebuilt per environment, so what was tested is not what ships.
- **Feature flags (51):** a fallback that turns a protection off when the flag service is down, personal data sent to a third-party flag service, and a flag whose off state was never tested (Gemini rated it critical).
- **Blue-green (52):** both agents rated this critical. Switching back is unsafe if the new version wrote data the old version cannot read.
- **Rolling deployments (54):** message consumers must stop taking messages on shutdown, and a failing Kubernetes rollout stalls but does not revert by itself.
- **Rollbacks (55):** a down migration run in production can drop data written since the release. A feature flag is often the faster rollback.
- **Health checks (56):** a readiness check that includes a shared dependency removes every instance at once when it slows (Gemini rated it critical). Detailed public health output helps attackers.
- **Build caching (107):** both agents rated secrets baked into image layers and shared caches critical, plus caches that untrusted builds can write to.
- **Dependency management (108):** both agents rated package install scripts critical, since they run code at install time, often in CI with secrets present. Internal package names that resolve from a public registry are a related path.

**R4. Hints again.** Both agents flagged generic or description-style hints in every concern: deploy, pipeline, toggle, blue, green, swap, weight, strategy, undo, revert, /health, httpGet, package.json, cache key, overrides.

**R5. Applies-when sentences.** Proposed for four concerns (52, 53 and 57 by both agents, 103 by Opus):
- 52 Blue-green: "Applies when the system can run two full production environments and switch traffic between them at a load balancer, router or platform slot."
- 53 Canary: "Applies when the system can run two versions at once with routing control, and has enough traffic for canary metrics to be meaningful."
- 57 Probes: "Applies when workloads run on Kubernetes or another orchestrator that manages traffic and restarts with probes."
- 103 Semantic versioning: "Applies when the team publishes libraries, packages, SDKs or contracts that other teams or customers depend on."

**R6. Check level and ownership.**
- Partial instead of code: 6 (both agents), 51, 54, 57, 107 and 108 (Opus). Each has hints and evidence to request in its edits.
- Guardrail instead of own: 6, 54, 56, 57 and 107.
- 108 is renamed "Dependency management", as both agents asked: the old title and definition covered version conflicts only.

**R7. Overlap between 56 and 57.** 57 repeats 56 for Kubernetes and overlaps concern 8. 56 now stays platform neutral, and 57 stays Kubernetes configuration.

**R8. Environment configuration management.** Round 5 left this open for this round. Three of the four replies suggested it independently. Decision 3.

---

## 2. Further changes to the agent prompt

| # | Finding | Agent | Proposed change |
|---|---|---|---|
| P35 | Default git log output includes author names and emails, which conflicts with the rule against quoting personal data. Nothing forbids gh, glab or CI CLIs that could trigger workflows or read pipeline secrets. | Opus (safety) | "For git log, use only --no-pager log --format='%h %ad %s' --no-patch. Never run gh, glab, CI or deployment CLIs." |
| P36 | Pipeline evidence is often a file existing, which has no meaningful line. It is also unclear whether a reference such as secrets.DEPLOY_KEY must be redacted. | Opus | "When the evidence is a file's existence, use line 1 and quote the first line. References to secrets by name, such as secrets.DEPLOY_KEY, are not secret values and may be quoted." |
| P37 | The not_applicable rule (P24) lets an agent mark a universal concern such as health checks not_applicable when no health endpoint exists, which hides the first red flag. | Opus | Revise P24: "Use not_applicable only for a concern that has an Applies when line whose condition clearly fails. A concern without one applies to every system." |
| P38 | Tags and branches may be missing from a shallow CI clone, so an absent tag would be read as a missing practice. | Opus | "Tags and branches may be missing from the local clone. Do not report a missing tag as evidence." |
| P39 | The rule to ignore lockfiles, which I proposed in round 4, breaks concern 108. | Opus, Gemini | Revise P17: "Do not search inside lockfiles, but confirm they exist with git ls-files and check how CI installs from them. Report vulnerable packages only from scan results committed to the repository, never from your own knowledge." |
| P40 | Remote cache configuration holds tokens and authorization headers, and the secret rule lists only webhook URLs and keys. | Opus | Widen P27: "Treat tokens, authorization headers, webhook URLs, integration keys and routing keys as secrets. Quote only the key name." |

Not proposed for decision: Gemini again asked for a stricter absence rule (P16 already covers it), and Opus again asked for per-item (code) or (people) tagging (the fourth time, still deferred).

---

## 3. Decisions for this round

| # | Decision | Status |
|---|---|---|
| 1 | Prompt changes P35 to P40 | **Decided:** accept all six |
| 2 | Check level changes for 6, 51, 54, 57, 107 and 108 | **Decided:** accept all six |
| 3 | New concerns and folds suggested this round | **Decided:** fold the rest and add "Environment configuration management" (own, partial), bringing the plan to 115 concerns |
| 4 | The 85 content edits in section 4 | Open |
| 5 | Round status and expert set | Open |

### Suggested additions this round (16 suggestions, 11 distinct)

| Tier | Concern | Suggested by | Why | Where it goes |
|---|---|---|---|---|
| Consider | Environment configuration management | Opus, Gemini (3 of the 4 replies, and Opus in round 5) | How configuration differs between environments, is validated at startup and in the pipeline, is versioned, and is rolled out and back safely. Bad config is a leading cause of outages. 67 covers secrets and 104 covers infrastructure, not this. | New concern, or stay uncovered |
| Consider | Post-deployment verification | Opus | Smoke tests and synthetic checks after every deploy, with automatic rollback on failure, whatever the strategy. | New concern, or a good-looks-like item (now in 55) |
| Fold | Software supply chain and artifact integrity | Both agents, both prompts | Build provenance, artifact signing, SBOMs, pinned dependencies and actions, and verifying signatures at deploy. | The software supply chain security concern from round 1, once drafted, plus 6 and 108 (in the edits) |
| Fold | CI/CD pipeline security, deployment access and change approval | Opus | Token permissions, OIDC instead of long-lived keys, untrusted pull request workflows, who can deploy. | 6 (in the edits) |
| Fold | Build once, promote the same artifact | Opus | Rebuilding per environment means production runs an untested artifact. | 6 (in the edits) |
| Fold | Graceful shutdown and draining | Opus (both prompts) | Signals, draining and consumer shutdown apply to every deployment strategy, scale-in and node drain. | 54 and 57 (in the edits), 8 and 45 (round 5) |
| Fold | Dependency and vulnerability management | Opus | Scanning, update cadence and response time for critical CVEs. | 108, renamed Dependency management (in the edits) |
| Fold | Runtime and base image lifecycle | Opus | End-of-life runtimes and base images stop receiving security fixes. | The software supply chain concern (patch timelines) and 108 |
| Hold | Delivery performance metrics (DORA) | Opus | Deployment frequency, lead time, change failure rate. Measures team performance more than production readiness. | Not added |

---

## 4. Proposed content edits by concern

### 6. CI/CD

**how_it_works** (Gemini, Opus). Accept.

Both agents: build once and promote. Gemini rated it critical: rebuilding per environment means what was tested is not what ships. Opus: the text merged continuous delivery and continuous deployment, which need different gates.

Now:

> Continuous integration builds and tests every change automatically. Continuous delivery or deployment promotes passing builds toward production through a pipeline, with checks, approvals and rollout steps. The pipeline is the controlled path to production, so its permissions and checks need care.

Proposed:

> Continuous integration builds and tests every change automatically. Continuous delivery keeps every passing build ready to release, with a person deciding when, and continuous deployment releases every passing change automatically. Build the artifact once, identify it by version or digest, and promote that same artifact through every environment, changing only configuration. The pipeline is the controlled path to production, so who can change it, what secrets it holds and which checks it enforces need care.

**red_flags** (Opus). Accept.

Opus rated this critical: the common pipeline attack paths were missing (fork pull requests reading secrets, mutable action tags, broad default tokens, skippable gates). I merged the vague environment-separation flag with the rebuild flag to stay within six.

Add or change to:

- Required checks or approvals that can be skipped, marked allowed to fail, or bypassed by admins
- Long-lived credentials with broad access stored in the pipeline, or a token with default broad permissions
- Pull requests from forks that can run with access to secrets or write tokens
- Third-party actions or plugins referenced by a mutable tag or branch instead of a commit
- The artifact rebuilt for each environment, or the same credentials able to deploy to test and production

Replace or remove:

- No automated tests or checks before deploy
- Long-lived credentials with broad access stored in the pipeline
- No separation between environments

**good_looks_like** (Opus). Accept.

Short-lived or scoped also let a long-lived scoped key pass.

Add or change to:

- Protected main branch with required reviews, and production deployments limited to a protected environment with named approvers
- Cloud access through short-lived federated credentials, token permissions set to the minimum, and third-party actions pinned to a commit
- One artifact built once and promoted by digest

Replace or remove:

- Short-lived or scoped credentials for the pipeline

**undefined** (Opus). Accept.

The old text was two separate statements, not a trade-off.

Now:

> Fast delivery needs strong automated tests; heavy pipelines slow feedback.

Proposed:

> More gates catch more problems before production but slow feedback and delivery. Fast pipelines depend on strong automated tests to stay safe.

**search_hints** (Gemini, Opus). Accept.

deploy, pipeline, stages: and jobs: are generic. Adds the settings the red flags depend on.

Add: `.github/workflows/`, `.gitlab-ci.yml`, `azure-pipelines.yml`, `.circleci/config.yml`, `buildspec.yml`, `bitbucket-pipelines.yml`, `cloudbuild.yaml`, `pull_request_target`, `id-token: write`, `allow_failure`, `continue-on-error`, `permissions:`, `environment:`, `kind: Pipeline`

Remove: `.github/workflows`, `gitlab-ci`, `azure-pipelines`, `circleci`, `buildspec`, `deploy`, `pipeline`, `stages:`, `jobs:`

**agent check level** (Gemini, Opus). Accept.

Branch protection, environment approvers, who holds production access and whether anyone deploys from a laptop live in platform settings, not the repository.

Change from `code` to `partial`.

**evidence_to_request** (Gemini, Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Branch protection and required reviewers in the hosting platform
- Who holds production deploy access, and any deployments made outside the pipeline

**ownership** (Gemini, Opus). Accept.

The architect sets the pipeline standard (required gates, credential model, promotion rules) and teams write their own pipelines.

Change from `own` to `guardrail`.

**related** (Gemini, Opus). Accept.

Pipeline secrets (67) and migrations run by the pipeline (81). Gemini noted that 107 was missing from its list only because Part D left out the other half of this category. I dropped 107 and 55 to stay within four.

Add: `67`, `81`

Remove: `107`

### 51. Feature flags

**definition** (Opus). Accept.

Flags read from a config file at startup need a restart, so "without redeploying" is true only for dynamic flags.

Now:

> Toggle features at runtime without redeploying.

Proposed:

> Switches in code that turn behavior on or off, usually at runtime without redeploying.

**how_it_works** (Opus). Accept.

The old text treated all flags as short-lived, which conflicts with legitimate kill switches and permission flags.

Now:

> A feature flag turns behavior on or off at runtime without redeploying. It lets teams release code dark, roll out to a small percentage or group, and switch a feature off fast if it causes problems. Flags add code paths to test and must be removed when no longer needed.

Proposed:

> A feature flag turns behavior on or off, usually at runtime without redeploying. It lets teams release code dark, roll out to a small percentage or group, and switch a feature off fast if it causes problems. Flags differ by purpose: release and experiment flags are temporary and should be removed once the rollout ends, while kill switches and permission flags can be long-lived by design but should be named and reviewed. Flags add code paths to test.

**red_flags** (Gemini, Opus). Accept.

Both agents: personal data in targeting contexts, and an unsafe default when the flag service fails.

Add or change to:

- Application failing, or a protection switching off, if the flag service is unreachable
- Production flag changes made without review or approval, or with no audit trail
- Personal data sent in flag evaluation context to an external flag service without need or agreement
- Release or experiment flags left in place after the rollout ended

Replace or remove:

- Application failing if the flag service is unreachable
- Flags changed in production with no audit trail
- Long-lived flags that have become permanent configuration

**good_looks_like** (Gemini, Opus). Accept.

Gemini rated testing both states critical: when only the enabled state is tested, switching a faulty feature off in an emergency runs untested fallback code. Opus: a safe default needs a value chosen for each flag.

Add or change to:

- An explicit fallback value for each flag, chosen so that an unreachable flag service keeps protections on and new features off
- Automated tests cover both states of each active flag
- Old release and experiment flags removed regularly

Replace or remove:

- A safe default when the flag service is unavailable
- Old flags removed regularly

**review_question** (Opus). Accept.

The old question asked two things, and the outage behavior is the higher-risk one.

Now:

> Who owns flag cleanup, and what happens if the flag service is unavailable?

Proposed:

> What does each flag evaluate to when the flag service is unreachable?

**search_hints** (Gemini, Opus). Accept.

toggle and isEnabled match UI toggles and component state in most front-end code.

Add: `openfeature`, `getBooleanValue`, `boolVariation`, `ldclient`, `unleash-client`, `isFeatureEnabled`, `growthbook`, `flipt`, `configcat`, `statsig`, `FeatureManagement`, `IFeatureManager`, `togglz`

Remove: `feature flag`, `feature toggle`, `unleash`, `isEnabled`, `variation(`, `featureFlags`, `split.io`, `toggle`

**agent check level** (Opus). Accept.

Owners, removal dates, audit trails and production flag state usually live in the flag service, not the repository.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- The flag service configuration, owners and removal dates
- Who can change production flags, and the audit log

**related** (Opus). Accept.

Flag service calls need timeouts (11), and flag rollout is often part of the pipeline gate (6).

Add: `6`, `11`

### 52. Blue-green deployment

**how_it_works** (Gemini, Opus). Accept.

Both agents rated this critical: switching back is unsafe as an absolute, because the new version may have written data in a format the old version cannot read.

Now:

> Blue-green deployment keeps two production environments. The live one serves traffic while the new version is deployed and tested on the other, then traffic is switched over. Rollback is switching back. Database changes must be compatible with both versions, since they share data.

Proposed:

> Blue-green deployment keeps two production environments. The live one serves traffic while the new version is deployed and tested on the other, then traffic is switched over. Rollback is switching back, as long as the old environment is still running and the data the new version wrote is still readable by the old version. Database changes must be compatible with both versions, since they share data, and background jobs and message consumers must not run in both at once.

**undefined** (Opus). Accept.

"Instant switch" was too absolute: DNS-based switches are delayed by cached TTLs, and long-lived connections stay on the old color.

Now:

> Instant switch and rollback at the cost of duplicate capacity.

Proposed:

> Fast switch and rollback at the cost of duplicate capacity. The switch is near instant at a load balancer or router, and slower with DNS because of caching.

**red_flags** (Opus). Accept.

Missing failure modes: duplicate processing from both colors, drift, and DNS TTLs.

Add or change to:

- Background jobs or message consumers active in both environments at the same time
- Idle environment configuration drifting from the live one, or traffic switched by DNS with a long TTL

**review_question** (Opus). Accept.

The first half of the old question is a precondition that belongs in the Applies when line.

Now:

> Can you run two full environments, and how is data handled across them?

Proposed:

> Can the previous version still run against the data after the switch, if you need to switch back?

**search_hints** (Gemini, Opus). Accept.

blue, green, swap, slot and weighted match CSS colors and UI code.

Add: `blue_green`, `BlueGreen`, `activeService`, `previewService`, `autoPromotionEnabled`, `deployment_style`, `deployment slot`, `slot swap`, `aws_lb_listener_rule`, `target_group`, `traffic_routing`, `production-slot`, `staging-slot`

Remove: `blue`, `green`, `target group`, `swap`, `slot`, `traffic shifting`, `weighted`

**related** (Gemini, Opus). Accept.

Shared database compatibility (81) is the main blocker for blue-green.

Add: `81`

### 53. Canary releases

**definition** (Opus). Accept.

The old definition said a user subset while how_it_works said a share of traffic.

Now:

> Release to a small user subset first to catch problems.

Proposed:

> Release to a small share of users or traffic first to catch problems.

**how_it_works** (Gemini, Opus). Accept.

Opus: compare with a control group, as the SRE workbook says. Both agents: without stickiness a user moves between versions, which breaks sessions, and without enough traffic the comparison is noise.

Now:

> A canary release sends a small share of traffic to the new version first, watches key metrics and then increases the share or rolls back. Decisions can be automatic, from error rate and latency comparisons. It needs good observability and the ability to run two versions at once.

Proposed:

> A canary release sends a small share of traffic to the new version first, watches key metrics and then increases the share or rolls back. The canary is compared with a control group running the current version, of similar size and over the same period, rather than with the whole fleet. Route by user or session where possible, so each user stays on one version. Decisions can be automatic, from error rate and latency comparisons.

**red_flags** (Opus). Accept.

Replaces "no quick rollback", which duplicated 55.

Add or change to:

- Canary metrics not separated from the stable version
- Canary instances also consume queues or run jobs that traffic weights do not limit

Replace or remove:

- No quick rollback

**good_looks_like** (Opus). Accept.

Gating only on errors and latency misses breakage in business metrics.

Add or change to:

- Success and rollback criteria defined in numbers, including business metrics, not only errors and latency
- Each user routed to one version for the length of the rollout

Replace or remove:

- Success and rollback criteria defined in numbers

**search_hints** (Gemini, Opus). Accept.

weight, analysis and progressive are generic.

Add: `kind: Rollout`, `AnalysisTemplate`, `kind: Canary`, `canaryAnalysis`, `trafficRouting`, `canary-weight`, `kind: VirtualService`, `HTTPRoute`, `additional_version_weights`, `routing_config`

Remove: `weight`, `analysis`, `progressive`, `istio virtualservice`

**related** (Gemini, Opus). Accept.

Version compatibility depends on migrations (81).

Add: `81`

### 54. Rolling deployments

**how_it_works** (Gemini, Opus). Accept.

Both agents: shutdown handling for message consumers, the follow-up recorded in round 4. Opus: a Kubernetes Deployment stalls after progressDeadlineSeconds and does not revert by itself.

Now:

> A rolling deployment replaces instances a few at a time, so the service stays up during the release. Settings control how many instances can be unavailable or added at once. Old and new versions run side by side during the rollout, so they must be compatible with each other and with the database.

Proposed:

> A rolling deployment replaces instances a few at a time, so the service stays up during the release. Settings control how many instances can be unavailable or added at once. Old instances must shut down gracefully: they stop taking new requests and messages, and finish or return in-flight work. Old and new versions run side by side, so they must be compatible with each other and with the database. Many platforms stop a failing rollout but do not roll it back, so set a progress deadline and act when it passes.

**undefined** (Opus). Accept.

Rolling back is another rolling deployment.

Now:

> Efficient on capacity, but mixed-version periods need compatibility.

Proposed:

> Efficient on capacity, but mixed-version periods need compatibility and rollback is as slow as the rollout.

**red_flags** (Gemini, Opus). Accept.

Both agents: consumers that keep pulling messages during shutdown lose or duplicate work.

Add or change to:

- Message consumers that do not stop taking messages on shutdown

**good_looks_like** (Opus). Accept.

Readiness probes that check shared dependencies remove all capacity during a database blip.

Add or change to:

- Readiness probes check the instance itself, so a dependency outage does not remove every instance
- A progress deadline that raises an alert or triggers a rollback

Replace or remove:

- Readiness probes gate traffic to new instances

**search_hints** (Gemini, Opus). Accept.

strategy matches design patterns and caching logic.

Add: `progressDeadlineSeconds`, `deployment_minimum_healthy_percent`, `deployment_maximum_percent`, `instance_refresh`, `AutoScalingRollingUpdate`, `update_config`, `SIGTERM`

Remove: `connection draining`, `strategy`

**agent check level** (Opus). Accept.

Surge settings and probes are visible in code, but whether mixed versions were tested and whether limits match real capacity are not.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Whether mixed-version compatibility has been tested
- Capacity at the surge and unavailable limits

**ownership** (Opus). Accept.

The architect sets the standard (compatibility rule, graceful shutdown, readiness), and teams set the exact values.

Change from `own` to `guardrail`.

**related** (Gemini, Opus). Accept.

Consumer shutdown (15) and schema compatibility (81). I dropped 57 to stay within four.

Add: `15`, `81`

Remove: `57`

### 55. Rollbacks

**how_it_works** (Opus). Accept.

Only schema was mentioned.

Now:

> A rollback returns the system to the last good version after a bad release. It is quick when the previous artifact is kept, deployment is automated and data changes are reversible or compatible. The hardest part is data: a migration that dropped a column cannot simply be undone.

Proposed:

> A rollback returns the system to the last good version after a bad release. It is quick when the previous artifact is kept, deployment is automated and data changes are compatible with the previous version. Rollback restores code, not its effects: data written in a new format, events already published and external calls already made stay, so roll back configuration and flag changes with the code. The hardest part is data: a migration that dropped a column cannot simply be undone.

**decide_between** (Gemini, Opus). Accept.

Both agents: a feature flag is often the fastest and safest first response.

Now:

> Roll back or fix forward. Rollback restores service quickly when the change is the cause. Fixing forward can be better when data has already changed and a rollback would cause damage.

Proposed:

> Turn off a flag, roll back or fix forward. Turning off a flag is fastest when the change is behind one. Rollback is the default when the release is the likely cause and the previous version still works with the data. Fix forward when data has already changed so a rollback would cause damage, and only when the fix can ship quickly through the normal gates.

**undefined** (Opus). Accept.

The old wording was hard to parse.

Now:

> Fast recovery versus the constraints it places on irreversible changes like migrations.

Proposed:

> Fast recovery requires that every change, including migrations, keeps the previous version working, which slows down schema changes.

**red_flags** (Gemini, Opus). Accept.

Opus: a down migration run in production can drop columns holding data written since the release, so the safe goal is that the previous version still runs against the new schema. Gemini: down migrations are dangerous in live incidents.

Add or change to:

- Migrations that the previous version cannot run against, or down migrations that would delete data written since the release

Replace or remove:

- Migrations that cannot be reversed or are not backward compatible

**good_looks_like** (Opus). Accept.

A fold from the post-deployment verification suggestion.

Add or change to:

- Post-deploy smoke checks that trigger a rollback when they fail

**search_hints** (Gemini, Opus). Accept.

undo, revert and downgrade match git usage, UI features and package downgrades.

Add: `auto_rollback_configuration`, `deployment_circuit_breaker`, `autoRollback`, `rollback_on_failure`, `revisionHistoryLimit`, `alembic downgrade`, `flyway undo`, `migrate:rollback`, `db:rollback`, `keep_releases`, `git revert`, `lifecycle policy`

Remove: `rollback`, `revert`, `previous version`, `downgrade`, `down migration`, `undo`

**related** (Gemini, Opus). Accept.

Flags are a rollback tool (51).

Add: `51`

### 56. Health checks

**how_it_works** (Gemini, Opus). Accept.

Opus: the old text said readiness usually includes critical dependencies, which invites checking shared dependencies and contradicts its own red flag. Liveness is about progress, not whether the process runs. Gemini rated the same wording critical.

Now:

> A health endpoint reports whether an instance can serve traffic. A liveness check says the process is running. A readiness check says it can take requests, which usually includes its critical dependencies. Load balancers and orchestrators use these checks to route traffic and restart instances.

Proposed:

> A health endpoint reports whether an instance can serve traffic. A liveness check says the process can still make progress, so that restarting it would help. A readiness check says it can take requests. It should cover what is local to the instance, not a dependency every instance shares, because when a shared dependency slows, every instance goes unready at once. Platforms react differently when every check fails: some load balancers keep routing, and Kubernetes removes all endpoints.

**review_question** (Gemini, Opus). Accept.

Both agents: "including dependencies" leads the reviewer toward deep checks.

Now:

> Do checks reflect real readiness, including dependencies?

Proposed:

> Which dependencies does each check include, and what happens to the fleet if a shared dependency fails?

**undefined** (Gemini, Opus). Accept.

Deep readiness checks remove instances from traffic. Restarts come from liveness checks or load balancer driven replacement.

Now:

> Deep checks catch more problems but can cause cascading restarts when a dependency blips.

Proposed:

> Deep checks catch more problems but can remove or restart every instance at once when a shared dependency slows.

**red_flags** (Opus). Accept.

Opus: combined liveness and readiness is a common pattern, so the real flag is a liveness check that includes dependencies. Probes always have a timeout, so the real flag is a handler whose dependency calls have none. Adds information leakage.

Add or change to:

- A liveness check that includes dependency or readiness checks, so a dependency fault restarts instances
- Health handlers that call dependencies without their own short timeout
- A public health endpoint that returns dependency names, versions, hostnames or error details
- Health endpoints blocked by authentication, rate limits or WAF rules, or served from the same saturated request pool as user traffic

Replace or remove:

- Liveness and readiness combined into one check
- Checks with no timeout

**good_looks_like** (Opus). Accept.

Detailed health output helps attackers.

Add or change to:

- Public health responses return only a status, with detail restricted to internal callers

**search_hints** (Opus). Accept.

/health and /ready match many unrelated strings. A Dockerfile HEALTHCHECK is ignored by Kubernetes.

Add: `AddHealthChecks`, `MapHealthChecks`, `grpc.health.v1`, `health/liveness`, `health/readiness`, `management.endpoint.health`, `show-details`, `healthCheck`, `health_check`, `HealthCheckPath`, `terminus`

Remove: `/health`, `/ready`, `/readyz`, `/livez`, `HEALTHCHECK`, `healthCheckPath`

**ownership** (Gemini, Opus). Accept.

The architect sets health check semantics, and teams implement the endpoints.

Change from `own` to `guardrail`.

**related** (Opus). Accept.

Circuit breakers (10) are the safe alternative to deep checks. I dropped 9, 11 and 58 to stay within four.

Add: `8`, `10`

Remove: `9`

### 57. Liveness and readiness probes

**how_it_works** (Opus). Accept.

Missing: a failing readiness probe never restarts a container, and what happens when every pod is unready.

Now:

> Kubernetes uses three probes. A liveness probe restarts a container that is stuck. A readiness probe controls whether it receives traffic. A startup probe gives slow-starting applications time before the other probes begin. Wrong settings cause restart loops or traffic to unready instances.

Proposed:

> Kubernetes uses three probes. A liveness probe restarts a container that is stuck. A readiness probe controls whether it receives traffic, and a failing one removes the pod from Service endpoints without restarting it. A startup probe gives slow-starting applications time before the other probes begin. If every pod fails readiness, the Service has no endpoints. The defaults (1 second timeout, 10 second period, 3 failures) often need tuning. Wrong settings cause restart loops or traffic to unready instances.

**red_flags** (Opus). Accept.

Queue consumers and batch workers do not receive Service traffic. Shutdown behavior was missing.

Add or change to:

- No readiness probe on a workload that receives traffic through a Service
- Very short timeouts or thresholds that cause restarts under load, or a liveness probe on the same request pool as user traffic
- No graceful shutdown or preStop delay, so requests fail during rollouts

Replace or remove:

- No readiness probe
- Very short timeouts or thresholds that cause restarts under load

**undefined** (Opus). Accept.

The old text restated why_it_matters.

Now:

> Poorly tuned probes cause restart loops or send traffic to instances that are not ready.

Proposed:

> Aggressive probes detect failures quickly but risk restarting or removing busy, healthy pods. Lenient probes avoid flapping but leave broken pods running longer.

**search_hints** (Gemini, Opus). Accept.

httpGet matches HTTP client code in many languages, and /healthz and /readyz duplicate 56.

Add: `successThreshold`, `tcpSocket`, `grpc:`, `terminationGracePeriodSeconds`, `preStop`

Remove: `httpGet`, `/healthz`, `/readyz`

**agent check level** (Opus). Accept.

Tuning under load and slow-start behavior need runtime data, and manifests often live in a separate GitOps or platform repository.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Probe tuning data from load tests
- Where the manifests live, if outside this repository

**ownership** (Gemini, Opus). Accept.

Probe settings are per-service tuning within a standard.

Change from `own` to `guardrail`.

### 103. Semantic versioning

**how_it_works** (Gemini, Opus). Accept.

Both agents: version zero makes no stability promise. Opus: a breaking change is more than a changed signature, and 103 should say how it differs from 102. Gemini: internal services often use commit or calendar versions.

Now:

> Semantic versioning uses MAJOR.MINOR.PATCH numbers. A major increase signals a breaking change, a minor one adds compatible features and a patch fixes bugs compatibly. It lets consumers judge how safe an upgrade is, but only works if breaking changes are actually detected and labeled.

Proposed:

> Semantic versioning uses MAJOR.MINOR.PATCH numbers for libraries, SDKs and contracts that others depend on. A major increase signals a breaking change, a minor one adds compatible features and a patch fixes bugs compatibly. Versions below 1.0.0 make no stability promise, and pre-release labels such as 1.0.0-rc.1 sort before the release. A breaking change includes changed behavior or defaults, removed fields and dropped runtime support. It only works if breaking changes are actually detected and labeled. For HTTP APIs, see 102.

**why_it_matters** (Opus). Accept.

The main harm path was missing.

Now:

> Wrong version signals cause broken upgrades, and consumers stop trusting your numbers.

Proposed:

> Consumers usually accept new minor and patch versions automatically through version ranges, so a breaking change released as minor or patch can break their next build without any decision on their side.

**review_question** (Opus). Accept.

The old question asked two things, and the first invites a yes without evidence.

Now:

> Do you follow semantic versioning for libraries and APIs, and who enforces it?

Proposed:

> How is a breaking change detected before release, and what stops it from shipping as a minor or patch version?

**red_flags** (Opus). Accept.

Tags may be missing from a shallow clone, so the flag now includes release automation.

Add or change to:

- No release tags or release automation tying versions to source

Replace or remove:

- No tags tying versions to source

**search_hints** (Gemini, Opus). Accept.

package.json and pom.xml exist in nearly every project and show nothing about semver, and git tag is a command, not file content.

Add: `BREAKING CHANGE`, `CHANGELOG.md`, `.changeset`, `release-please`, `commitlint`, `conventional-changelog`, `goreleaser`, `bumpversion`, `cargo-semver-checks`, `api-extractor`, `japicmp`, `revapi`, `gorelease`

Remove: `CHANGELOG`, `package.json`, `pom.xml`, `git tag`, `changesets`, `version bump`, `breaking change`

### 107. Build caching

**how_it_works** (Gemini, Opus). Accept.

Both agents rated secrets in caches critical: ARG, ENV or COPY values persist in layers and shared caches, readable by anyone with cache or registry access. Opus: the inputs cache keys commonly miss.

Now:

> Build caching reuses the results of earlier build steps (compiled code, downloaded dependencies, container layers) when their inputs have not changed. It speeds up pipelines and lowers cost. Cache keys must reflect everything that affects the output, or builds can reuse stale results and produce wrong artifacts.

Proposed:

> Build caching reuses the results of earlier build steps (compiled code, downloaded dependencies, container layers) when their inputs have not changed. It speeds up pipelines and lowers cost. Cache keys must reflect everything that affects the output, including tool versions, operating system and architecture, environment variables and base image tags, or builds can reuse stale results. Fallback keys that restore a partial match suit dependency downloads, not build outputs. Caches and layers must never hold secrets.

**red_flags** (Opus). Accept.

Names the realistic poisoning paths: workflows triggered by forks writing to the default branch cache, and remote caches writable from developer machines.

Add or change to:

- Secrets passed to builds through build arguments, environment variables or copied files, so they persist in image layers or caches
- Shared or remote caches that pull request, fork or developer builds can write to, when release builds read from the same cache

Replace or remove:

- Shared caches writable by untrusted builds

**good_looks_like** (Opus). Accept.

A clean build that succeeds does not prove the cached output matches. Only comparing artifacts does.

Add or change to:

- Build secrets mounted only for the step that needs them, for example with BuildKit secret mounts
- Regular clean builds whose artifacts are compared with cached builds, so differences show up

Replace or remove:

- Regular clean builds that prove the output does not depend on the cache

**review_question** (Opus). Accept.

The old question asked two things, and reproducibility overlaps 108.

Now:

> Are builds reproducible, and how are caches invalidated?

Proposed:

> What goes into each cache key, and who can write to the caches that release builds read?

**search_hints** (Gemini, Opus). Accept.

gradle build cache and bazel remote cache are not literal text in configuration.

Add: `cache-from`, `cache-to`, `type=gha`, `--mount=type=cache`, `--mount=type=secret`, `org.gradle.caching`, `buildCache`, `--remote_cache`, `.bazelrc`, `nx.json`, `turbo.json`, `sccache`, `ccache`

Remove: `--cache-from`, `buildx`, `gradle build cache`, `bazel remote cache`, `nx cache`, `turborepo`, `COPY package.json before COPY .`, `cache key`

**agent check level** (Opus). Accept.

Whether caches are writable by untrusted runs depends partly on CI platform settings, and the clean build schedule may live outside the repository.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Who can write to the shared and remote caches, from the CI platform settings
- The schedule of clean builds

**ownership** (Opus). Accept.

Cache trust boundaries and secret handling decide whether a poisoned or leaking artifact reaches production. Key tuning stays with teams.

Change from `delegate` to `guardrail`.

**related** (Opus). Accept.

Secrets in layers and cache tokens link to 67.

Add: `67`

### 108. Dependency hell

**name** (Gemini, Opus). Accept.

Both agents asked for a rename: the old title and definition described version conflicts only, while the text covers vulnerabilities, abandonment, licenses and supply chain, and Gemini noted "hell" is jargon. The file is renamed to 108-dependency-management.yaml and the id stays 108.

Change from `Dependency hell` to `Dependency management`.

**definition** (Gemini, Opus). Accept.

Matches the new name.

Now:

> Conflicting or broken library version requirements.

Proposed:

> How third-party libraries are chosen, pinned, updated and checked, including conflicting version requirements.

**how_it_works** (Gemini, Opus). Accept.

Both agents rated install scripts critical: package managers run code at install time, often in CI with secrets present. Opus: pinning with a lockfile is not universal.

Now:

> Dependency hell is the situation where the libraries an application needs conflict, are out of date, have known vulnerabilities, or pull in many hidden sub-dependencies. Managing it means pinning versions with a lock file, scanning for vulnerabilities, updating regularly in small steps and keeping the dependency tree small.

Proposed:

> Dependency management means recording exact resolved versions, with a lockfile where the ecosystem has one, and installing from it in CI in a mode that fails on drift, such as npm ci. Lockfiles in libraries do not protect their consumers. It also means scanning for vulnerabilities and licenses, updating regularly in small steps, keeping the dependency tree small, and treating install scripts and package registries as part of the attack surface.

**red_flags** (Opus). Accept.

Ranges in manifests are normal when a lockfile is honored. The real risk is ranges with no honored lock, and floating references that lockfiles do not cover.

Add or change to:

- No lock file, or a lock file that is not committed or not used by CI installs
- Floating versions not covered by a lockfile, such as latest base images, CI actions referenced by tag, or unpinned installs in build scripts
- Dependency installs that run package install scripts in jobs with secrets
- Internal package names that can resolve from a public registry

Replace or remove:

- No lock file, or a lock file that is not committed
- Floating versions such as latest or very wide ranges in production dependencies

**good_looks_like** (Opus). Accept.

Follows the red flag changes.

Add or change to:

- Lock files committed and used for builds in a frozen mode
- Install scripts disabled or allowed per package, and internal packages scoped to a private registry

Replace or remove:

- Lock files committed and used for builds

**decide_between** (Opus). Accept.

The common hybrid, and a minimum release age to reduce exposure to freshly compromised releases.

Now:

> Update dependencies continuously in small steps, or in scheduled batches. Continuous updates keep each change small and security fixes quick. Batches reduce noise but make each upgrade larger and riskier.

Proposed:

> Update dependencies continuously in small steps, or in scheduled batches. Continuous updates keep each change small and security fixes quick. Batches reduce noise but make each upgrade larger and riskier. Many teams apply security fixes at once, batch the rest, and wait a few days after a release before adopting it.

**search_hints** (Gemini, Opus). Accept.

latest as a version is prose, and overrides and resolutions match too widely.

Add: `pnpm-lock.yaml`, `Cargo.lock`, `composer.lock`, `uv.lock`, `gradle.lockfile`, `--frozen-lockfile`, `npm ci`, `ignore-scripts`, `--hash=`, `renovate.json`, `dependabot.yml`, `pip-audit`, `govulncheck`, `osv-scanner`

Remove: `yarn.lock`, `poetry.lock`, `Gemfile.lock`, `go.sum`, `dependabot`, `renovate`, `npm audit`, `latest as a version`, `resolutions`, `overrides`

**agent check level** (Opus). Accept.

Known vulnerable or abandoned packages need current advisory data or committed scan results, and the agent cannot make network requests.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- The latest vulnerability scan results
- The dependency update cadence and the oldest outstanding update

**related** (Opus). Accept.

Install scripts run with CI secrets.

Add: `67`

---

## 5. Sources

- **Confirmed by me this round:** that a failing Kubernetes rollout stalls and reports ProgressDeadlineExceeded without reverting, so a rollback needs a pipeline step (54), through several guides, one of which cites the official documentation; and that Docker's documentation says build arguments and environment variables are not appropriate for secrets because they can persist in the final image, while BuildKit secret mounts avoid it (107). The pipeline security guidance, the feature flag and deployment strategy patterns, the SemVer specification and the supply chain guidance match what I know and what both agents independently reported. The probe behavior in 56 and 57 matches the checks I confirmed in round 5.
- **Cited by an agent and not opened by me:** the DORA research; Humble and Farley, Continuous Delivery; GitHub's guidance on hardening Actions and preventing pwn requests; Martin Fowler on feature toggles, blue-green deployment and parallel change; the OpenFeature specification; the Google SRE workbook chapter on canarying; the Kubernetes documentation on Deployments, probes and Pod termination; the AWS target group health check documentation; the Semantic Versioning specification; Docker's documentation on build secrets; SLSA and the OpenSSF Scorecard; the npm documentation on install scripts and ci; and the Renovate documentation on minimum release age. Open any you plan to cite.

## 6. Next

I'll walk through decisions 1 to 5 one at a time.
