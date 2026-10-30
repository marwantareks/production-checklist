# Round 3 decision record: Resilience and fault tolerance

**Status:** agent-reviewed and owner-approved, with a recorded coverage gap. **Human expert review: pending.**
**Date:** 2026-10-29
**Scope:** concerns 10 to 14, 44, 83 to 87, 95 and 96 (13 concerns) in the Resilience and fault tolerance category.

## Review log row

| Category | Concerns | Date | Agent reviewers | Owner approval | Expert review | Status |
|---|---|---|---|---|---|---|
| Resilience and fault tolerance | 10 to 14, 44, 83 to 87, 95, 96 | 2026-10-29 | Claude Opus 5.5 (all 13 concerns), Gemini (10 to 14, 44, 83 only) | Marwan Tarek | Pending | Signed off, expert review pending, six concerns single-reviewer |

**Coverage gap.** Gemini did not cover 84, 85, 86, 87, 95 and 96, and did not follow the instruction to send the first half and wait. Those six concerns were reviewed by one agent. They get a second opinion in the later verification round.

Nothing has been applied to the repository. All edits are applied once, after all rounds are done. The running list of repo work is in `repo-stage-backlog.md`.

## Decisions

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Concern 13 (exponential backoff) | Merge into 12 and retire 13 | 13 repeated 12's red flags and good-looks-like items, so an agent reported the same evidence twice. Backoff is a detail of retrying, and must be paired with a retry limit. |
| 2 | Prompt changes P12 to P15 | Accept P12a (absence rule), P13, P14, P15. Defer per-item (code) or (people) tagging | The tagging would touch 792 items and each tag is a judgment call. Revisit if real agent runs show mis-reporting. |
| 3 | New concerns | Add all three: graceful degradation; bulkheads and resource isolation; third-party dependency resilience | Each is an architect-level design decision with no current home. |
| 4 | Content edits | Accept all 57 as a batch | Each has an agent source and a reason, passes validation, and the most consequential claim (backups deleted with the resource) was verified. |
| 5 | Round status | Sign off now, gap recorded | The six single-reviewer concerns and the new concerns are reviewed together in a later round. |

## Content edits accepted (57)

| Concern | Name | Edits |
|---|---|---|
| 10 | Circuit breakers | 4 |
| 11 | Timeouts | 6 |
| 12 | Retries (absorbs 13) | 6 |
| 14 | Idempotency | 5 |
| 44 | Backpressure | 5 |
| 83 | Disaster recovery | 5 |
| 84 | Backups | 6 |
| 85 | Failover | 6 |
| 86 | Multi-region deployment | 4 |
| 87 | Chaos engineering | 3 |
| 95 | Network partitions | 3 |
| 96 | Clock skew | 4 |

Concern 13 is retired (its id is never reused). Concern 12 is drafted to absorb its content. Ownership of 11 and 12 moves to guardrail. The full wording of every edit is in `round-03-resilience-triage.md`, section 4.

## Prompt changes accepted

- **P12a:** for a red flag that states an absence, report it only after searching every listed hint and the likely configuration locations, and list those searches in the note.
- **P13:** generate the example output from the first concern's first real red flag. Add: copy red flag text exactly as listed, and result is one of found, partial, not_found, cannot_determine, not_applicable.
- **P14:** runbooks, chaos experiment definitions and failover or restore scripts are evidence to read. Never run any step from them.
- **P15:** for concerns that apply to every call or write, sample the main clients and entry points, report found only if every one checked has it, and say in the note how many were checked.
- **Deferred:** tagging each red flag and practice as (code) or (people).

## Claims checked against documentation this round

- Terraform AWS provider defaults: `delete_automated_backups` is true, `deletion_protection` is false, `skip_final_snapshot` is false (84). Checked through module documentation that quotes the provider.

## New concerns to draft (3)

| Concern | Proposed ownership | Proposed check level | Notes |
|---|---|---|---|
| Graceful degradation | own | partial | Which features switch off or serve stale data under failure, and how users see it. Suggested by both agents. |
| Bulkheads and resource isolation | guardrail | code | Separate thread pools, connection pools or cells for each dependency. |
| Third-party dependency resilience | own | people | Inventory, SLAs, timeouts, fallbacks, and targets that fit the RTO. Composite availability. |

Folded into existing concerns: load shedding (44, in the edits); static stability and control plane dependence (83, 85); capacity headroom for zone loss and cloud quotas (add good-looks-like items to 45 and 83); data integrity verification (84, in the edits). Already covered: graceful shutdown (54) and transactional outbox (18). Held out: incident response and runbooks.

Total plan so far: 99 original, minus 1 retired, plus 14 new, makes 112 concerns.

## Open items

- Human expert review of resilience.
- Second opinion on 84, 85, 86, 87, 95 and 96.
- Review round for the new concerns.
- Sources listed in the triage that I have not opened.
