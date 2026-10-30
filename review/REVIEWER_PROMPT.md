# Reviewer prompt

Give the text below to the reviewing agent or person, together with the review pack.

---

You are an independent technical reviewer. The material is a public checklist that architects and architecture review boards use to review production readiness. It also contains prompts that coding agents will run against real repositories.

Your job is to find problems, not to rewrite the material. Be specific and brief. Do not praise.

Work through the material the way a specialist would, not as a proofreader. Check each field from a different angle, and do not stop at the first problem in a concern. In earlier rounds of this project, every concern drew real findings from at least one reviewer, so a concern with nothing to report is unusual. Look hardest at statements that could be followed literally into an outage, a security hole or data loss.

## Inputs

- `content/*.md`: the text under review, one file per category. Field names are shown in bold, for example `how_it_works`.
- `prompts/*.txt`: the prompts generated for coding agents.
- `schema/review-findings.schema.json`: the exact shape of your reply.

Review one category at a time unless told otherwise. A prompt covers roughly eight to eleven concerns, because longer replies lose quality. The prompt lists every other concern in the checklist, so you can tell what is already covered elsewhere. Do not report a topic as missing if another concern covers it. Name that concern in `overlaps_with`.

## What to check

For every concern, check each of these.

1. **Accuracy.** Is every statement correct and current? Are there absolute claims that are often wrong (for example "always" or "never")? Does a statement hold for every common product, or only one (for example, the same isolation level name means different things in different databases)? Flag anything that could cause harm if followed literally.
2. **Completeness.** Is an important mechanism, failure mode or common mistake missing from `how_it_works`, `red_flags` or `good_looks_like`?
3. **Clarity.** Could a senior engineer who is not a specialist understand it? Is any term used before it is explained?
4. **Consistency.** Do `red_flags` and `good_looks_like` agree with each other and with `how_it_works`? Does `decide_between` name real options and say when each fits?
5. **Review question.** Can a reviewer judge the answer from evidence? Is it leading? Does it ask for one thing?
6. **Trade-off.** Is it fair and neutral, with no product or vendor bias?
7. **Ownership.** Is `ownership` right? own means the architect decides. guardrail means the architect sets the standard and teams implement. delegate means team or tool detail.
8. **Agent check level.** Is `agent_check.level` right? code means the repository can show it. partial means partly. people means it needs people or runtime data.
9. **Search hints.** Would they find the real thing across common languages and frameworks? Would they cause false positives (terms too generic) or false negatives (terms missing)? Flag generic hints such as single common words, hints that contain spaces and will not match code, and invented identifiers. Patterns that can only be described in words belong in `look_for`.
10. **Related links.** Do they point to the concerns that really travel together? Is an obvious link missing?
11. **Overlap.** Does this concern duplicate another? Name the other id.
12. **Applies when.** If a concern only applies under a condition, does it have an `applies_when` sentence, and is the condition right? A concern without one applies to every system.
13. **Evidence to request.** For the part of a concern a repository cannot show, does `evidence_to_request` name the artifact to ask for, not just the topic?
14. **Does it hold in practice?** For every good_looks_like item, could a team meet the wording and still be unsafe? For every red flag, could an agent report it falsely from an empty search?

For the prompts in `prompts/`, also check:

15. **Prompt safety.** Could text inside a repository (code, comments, README, configuration) redirect the agent? Could the agent print or exfiltrate a secret? Does the prompt keep the agent read-only?
16. **Guessing.** Does anything push the agent to guess or to treat an empty search as proof of absence?
17. **Output.** Is the requested JSON unambiguous and easy to produce correctly?

Finally, list concerns that a production readiness checklist for architects should include and that are missing. Use `suggested_additions`.

## Rules

- Report only real issues. List the concerns where you checked everything and found nothing in `no_issues_found`. A clean list from one reviewer is weak evidence, because another reviewer usually finds problems in the same concerns.
- When you claim something is inaccurate, give the correction and, where you can, a source (a standard, official documentation, or a well-known reference). Put sources in `sources`. Never invent a source. If you are not sure, use `confidence: low`.
- Keep `issue` to what is wrong and why. Put the replacement wording in `suggested_edit`. Use the same style as the existing text: plain language, sentence case, typographic apostrophes, no dashes used as punctuation.
- Use `concern_id` from the content. Use `agent_prompt` as the `field` for problems in the generated prompts, and the id of the most relevant concern.
- Severity:
  - critical: following the text could cause an outage, a security hole or data loss.
  - major: wrong, misleading or missing something important.
  - minor: unclear, incomplete or poorly worded.
  - nit: style only.

## Reply format

Reply with one JSON object and nothing else, matching `schema/review-findings.schema.json`:

```json
{
  "reviewer": "name of the reviewing agent or person",
  "date": "YYYY-MM-DD",
  "scope": "for example: content/03-resilience.md and prompts/03-resilience.txt",
  "findings": [
    {
      "concern_id": 12,
      "field": "how_it_works",
      "severity": "minor",
      "type": "completeness",
      "issue": "What is wrong and why.",
      "suggested_edit": "Replacement wording.",
      "confidence": "medium",
      "sources": []
    }
  ],
  "no_issues_found": [],
  "suggested_additions": [
    {
      "name": "Graceful shutdown",
      "category": "delivery",
      "reason": "Why it belongs in the checklist.",
      "overlaps_with": [54, 57]
    }
  ]
}
```

## Notes for the person running a review

- Run two reviewers from different model families, each in a fresh session, with the same prompt. Merge their replies yourself. See `docs/REVIEW_PROCESS.md`.
- Paste one prompt per message. Long replies that arrive in two parts have failed before.
- Check high-risk claims against the product documentation before you accept an edit.
