# Review process

The content has been through eight rounds of AI review, with every decision made by the author. It has not been reviewed by a human expert yet. The log is in [`review/LOG.md`](../review/LOG.md), the ranked plan for the expert review is in [`review/EXPERT_REVIEW_PLAN.md`](../review/EXPERT_REVIEW_PLAN.md), and every round's triage and decisions are in [`review/decisions/`](../review/decisions/).

This page describes the method, so it can be repeated, and what went wrong along the way.

## 1. Agent review (first filter)

Use reviewers from a different model family than the one that drafted the content, and use two. A reviewer from the same family tends to agree with plausible mistakes. A clean list from one reviewer is weak evidence: in every round, a second reviewer found real problems in concerns the first had cleared.

Build one self-contained prompt for a small group of concerns, about eight to eleven:

```sh
npm run review:prompt -- --ids 109,110,111 --title "New security concerns"
```

The prompt has four parts in one message: the reviewer instructions, the content under review, the prompt that coding agents will receive for those concerns, the reply schema, and an index of every other concern so the reviewer can tell what is covered elsewhere. Paste it into a fresh session of each reviewer, and paste the raw JSON replies back. Pass `--focus focus.json` to add references and attention points for the area. Run `npm run review:export` instead if you want the older multi-file pack.

Save each reply under `review/out/`, then produce a report:

```sh
npm run review:apply -- review/out/security-agent-a.json
npm run review:apply -- review/out/security-agent-a.json --min-severity major
```

This writes a Markdown report next to the file. It never edits content.

## 2. Triage and decisions

Merge the two replies into proposed edits and check them against the schema and style rules in a scratch copy before anyone decides. Then walk the decisions one at a time, each with a table of options and a recommendation: changes to the agent prompt, changes to check levels, new concerns, the batch of content edits, and the status of the round.

- **critical and major:** always examine. Do not accept an accuracy change without a source or a second opinion. Check high-risk claims against the product documentation before the edits are accepted.
- **minor:** accept when the wording is clearly better.
- **nit:** accept only if it follows the style guide.
- Reject changes that add vendor bias, absolutes, or text that does not match the style guide.
- When a topic is suggested as a new concern, check whether another concern already covers it. Most suggestions are a link or a good practice, not a new concern.

Apply accepted edits to the YAML files, run `npm run check`, and keep the decision record with the change.

## 3. Human expert review

An agent review does not replace an expert. Follow [`review/EXPERT_REVIEW_PLAN.md`](../review/EXPERT_REVIEW_PLAN.md), which ranks the concerns in tiers: security, data consistency and recovery first, then every other concern where a reviewer rated a finding critical, then the rest. Record who reviewed what and when in `review/LOG.md`. A content pull request needs at least one human reviewer before merge.

## 4. Agent prompt testing

The prompts have been reviewed as text but not run against real repositories in many stacks. Run them against a few real repositories in different stacks, then compare the findings with what you know. Note false positives and false negatives. Fix the search hints and the ground rules through pull requests and re-run. Pay particular attention to red flags that state an absence, and to concerns marked `partial`.

## 5. Keep it current

- Re-review a category when its text changes materially.
- Update `updated` in `content/meta.yaml` and `CHANGELOG.md` when you publish.
- Re-run the third-party review before a major release.

## What the rounds taught

These are the mistakes and lessons that shaped the method. Each is in the records.

- **A single reviewer's clean list is not evidence.** Neither reviewer ever cleared a concern that the other then also cleared.
- **Replies in two messages failed.** The second message of a two-part reply was lost. Keep each prompt small enough for one reply.
- **Always give the reviewer the index of every other concern.** An index that left out half of a split category made a reviewer report existing concerns as missing.
- **A rule that sounds safe can break something.** A rule to ignore lockfiles broke the dependency management concern. Check each new agent rule against every concern it touches.
- **Drafts need review.** The 17 concerns written after the first seven rounds took about six edits each from two reviewers. Do not skip the review of new content.
- **Words that were right can still be unsafe.** Most critical findings were advice that was correct in one setup and harmful in another: adding a constraint without a lock plan, vacuuming with a full rewrite, a signature check that accepts any signer, a mesh left in permissive mode.
- **Search hints go wrong in predictable ways:** single common words, hints with spaces, invented identifiers, and hints that are also what the red flag looks like.
- **Deferred, five times:** tagging every red flag and good practice as `(code)` or `(people)`. It would remove most false absence findings, and it touches about 800 items. Do it when there is time to review them all.

## Agent prompt rule changes

The agent prompt rules are numbered P1 to P48 in the decision records. They are summarized in [AGENT_REVIEW.md](AGENT_REVIEW.md) and tested in `tests/review.test.mjs`. The numbers are useful for finding why a rule exists.
