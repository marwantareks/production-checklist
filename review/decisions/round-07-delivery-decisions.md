# Round 7 decision record: Build, deployment and release

**Status:** agent-reviewed and owner-approved. **Human expert review: pending**, with concerns 6, 52, 107 and 108 added to the expert review set.
**Date:** 2026-10-30
**Scope:** concerns 6, 51 to 57, 103, 107 and 108 (11 concerns), reviewed through two separate prompts.

## Review log row

| Category | Concerns | Date | Agent reviewers | Owner approval | Expert review | Status |
|---|---|---|---|---|---|---|
| Build, deployment and release | 6, 51 to 57, 103, 107, 108 | 2026-10-29 | Gemini, Claude Opus 5.5 (both complete, on both prompts) | Marwan Tarek | Pending, for 6, 52, 107 and 108 | Signed off, expert review pending |

Nothing has been applied to the repository. All edits are applied once, after all rounds are done. The running list of repo work is in `repo-stage-backlog.md`.

## Decisions

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Prompt changes P35 to P40 | Accept all six | Fixes my lockfile rule from round 4, closes an author-email leak, and fixes the not_applicable gap for universal concerns. |
| 2 | Check level changes | Accept all six: 6, 51, 54, 57, 107 and 108 from code to partial | Each level now matches what an agent can confirm from the repository. |
| 3 | New concerns and folds | Fold the rest, and add "Environment configuration management" (own, partial) | Raised independently in three of the four replies and in round 5, an architect-level control, and nothing covers it. |
| 4 | Content edits | Accept all 85 as a batch | Each has an agent source and a reason, passes validation, and the rollout and build secret claims were checked. |
| 5 | Round status | Sign off now, expert review pending, adding 6, 52, 107 and 108 to the expert set | The four had critical findings from both agents: pipeline attack paths, blue-green rollback data loss, secrets in build caches, and install scripts. |

## Content edits accepted (85)

| Concern | Name | Edits |
|---|---|---|
| 6 | CI/CD | 9 |
| 51 | Feature flags | 9 |
| 52 | Blue-green deployment | 6 |
| 53 | Canary releases | 6 |
| 54 | Rolling deployments | 9 |
| 55 | Rollbacks | 7 |
| 56 | Health checks | 8 |
| 57 | Liveness and readiness probes | 7 |
| 103 | Semantic versioning | 5 |
| 107 | Build caching | 9 |
| 108 | Dependency management (renamed from Dependency hell) | 10 |

The full wording of every edit is in `round-07-delivery-triage.md`, section 4. Concern 108 is renamed (file renamed, id stays 108).

## Prompt changes accepted

- **P35:** for git log, use only `--no-pager log --format='%h %ad %s' --no-patch`. Never run gh, glab, CI or deployment CLIs.
- **P36:** when the evidence is a file's existence, use line 1 and quote the first line. References to secrets by name, such as secrets.DEPLOY_KEY, are not secret values and may be quoted.
- **P37:** revises P24. Use `not_applicable` only for a concern that has an Applies when line whose condition clearly fails. A concern without one applies to every system.
- **P38:** tags and branches may be missing from the local clone. Do not report a missing tag as evidence.
- **P39:** revises P17. Do not search inside lockfiles, but confirm they exist with `git ls-files` and check how CI installs from them. Report vulnerable packages only from scan results committed to the repository, never from the agent's own knowledge.
- **P40:** widens P27. Treat tokens, authorization headers, webhook URLs, integration keys and routing keys as secrets. Quote only the key name.
- **Still deferred (raised four times):** tagging each red flag and practice as (code) or (people), about 800 items.

## Applies-when sentences proposed (for the new field)

- 52 Blue-green deployment: applies when the system can run two full production environments and switch traffic between them at a load balancer, router or platform slot.
- 53 Canary releases: applies when the system can run two versions at once with routing control, and has enough traffic for canary metrics to be meaningful.
- 57 Liveness and readiness probes: applies when workloads run on Kubernetes or another orchestrator that manages traffic and restarts with probes.
- 103 Semantic versioning: applies when the team publishes libraries, packages, SDKs or contracts that other teams or customers depend on.

## Claims checked against documentation this round

- A failing Kubernetes rollout stalls and reports ProgressDeadlineExceeded, and the cluster takes no further action, so rollback needs a pipeline step (54). Confirmed through several guides, one citing the official documentation.
- Docker's documentation says build arguments and environment variables are not appropriate for secrets because they can persist in the final image, and BuildKit secret mounts avoid that (107).

## New concern to draft (1)

| Concern | Proposed ownership | Proposed check level | Notes |
|---|---|---|---|
| Environment configuration management | own | partial | How configuration differs between environments, is validated at startup and in the pipeline, is versioned, and is rolled out and back safely. Hints: ConfigMap, appsettings, dotenv, envalid, BaseSettings, viper, process.env. Evidence of how configuration differs between environments and how a change is rolled out. |

Folded: software supply chain and artifact integrity (the round 1 supply chain concern, plus 6 and 108), CI/CD pipeline security, deployment access and build once and promote (6), graceful shutdown and draining (54 and 57, with 8 and 45 from round 5), dependency and vulnerability management (108), runtime and base image lifecycle (the supply chain concern and 108), post-deployment verification (a good-looks-like item in 55). Held out: delivery performance metrics (DORA).

Total plan: 99 original, minus 1 retired, plus 17 new, equals 115 concerns.

## Process lessons

- Splitting one category into two prompts left the other half out of the index, and Gemini twice reported that existing concerns "do not exist". Always list every concern that is not under review in the index.
- A rule that sounds safe (P17, ignore lockfiles) can break a concern that depends on the thing it ignores. Check new agent rules against every concern they touch.

## Open items

- Human expert review of security, databases, resilience, and the concerns added by rounds 4 to 7: 18, 19, 20, 39, 88, 104, 4, 22, 48, 49, 101, 6, 52, 107 and 108. About 59 of the planned 115 concerns. At the end, rank the set by severity so the expert reviews the highest-risk concerns first.
- Second opinion on 84, 85, 86, 87, 95 and 96 (round 3 single-reviewer gap).
- Draft and review the 17 new concerns.
- Sources listed in the triage that I have not opened.
