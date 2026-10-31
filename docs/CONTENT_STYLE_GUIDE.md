# Content style guide

`npm run validate` enforces the mechanical rules. The rest is judgment, and reviewers hold content to it.

## Voice

- Plain language. A senior engineer who is not a specialist should follow it.
- Sentence case for names and headings.
- Short sentences. Say what is true, not what is impressive.
- Neutral and fair. State trade-offs without taking a side unless the evidence is clear.

## Mechanical rules

- Use typographic apostrophes and quotes (’ “ ”). Straight ones are rejected in prose.
- Do not use dashes as punctuation. Rewrite the sentence.
- `definition`, `how_it_works`, `where_it_appears`, `trade_off`, `why_it_matters` and `decide_between` end with a full stop.
- `review_question` ends with a question mark.
- Items in `red_flags` and `good_looks_like` do not end with a full stop.
- Start every field with a capital letter. Search hints are exempt.
- No `<` or `>` in prose.
- Concern text is copied into the prompt that readers give to their agents, so write facts about a practice, never instructions to the agent. The validator rejects line breaks, hidden or direction control characters, code fences, headings, chat role labels, phrases such as “ignore the previous instructions”, and in prose also web addresses, email addresses and commands that run or change something. Search hints may contain a literal such as `http://`.

## Writing each field

- **Definition.** One sentence. No jargon that is not defined elsewhere.
- **How it works.** The mechanism, not the benefits. Include the parts a reviewer must understand to judge an implementation.
- **Where it appears.** Concrete artifacts: files, settings, layers.
- **Review question.** One question, answerable from evidence, not leading. Avoid "Do you have X?" when "How is X done, and where?" gives a better answer.
- **Trade-off.** The real cost of doing it right, in one sentence.
- **Red flags.** Observable findings, not opinions. Each should be something a reviewer can spot.
- **Good looks like.** Verifiable. Prefer "a test shows X" and "dashboards show Y" over "the team cares about Z".
- **Decide between.** Only where an architect makes a real choice between named options. Say when each fits. Do not add one for a concern with a single right answer.

## Neutrality

- Do not recommend a product. Name tools only as examples, and no more than a few.
- Avoid absolutes such as "always" and "never" unless they are true in practice.
- Do not describe a cloud provider feature as a general rule.

## Search hints

- Use literal strings: setting names, library names, file names, header names, function names. At most 20, and a few good ones beat many weak ones.
- Cover more than one language or ecosystem where it makes sense. Check the spelling in each: `HttpOnly` is `httpOnly` in many JavaScript frameworks.
- Do not use a single common word such as `cache`, `lock` or `timeout`. The validator rejects the words in `scripts/lib/generic-hints.json`. Pair the word with context, for example a setting name.
- Do not use a hint with a space in it that will not appear in code, such as `kill switch` or `global table`, and do not invent identifiers such as `degradedMode`. Use the real names.
- Do not write a description as a hint. The validator rejects sentence-like hints. Put a pattern that can only be described in words in `look_for`.
- A hint that is also what a red flag looks like (for example an unbounded thread pool constructor) is a trap. Name the safe setting, not the unsafe call.
- Remember an agent searches text. A hint that matches thousands of lines trains it to ignore the hint.

## Evidence to request

For `people` concerns, list the documents, records or reports that would settle the question. Name the artifact, not the topic. A `partial` or `code` concern can list evidence too, for the part a repository cannot show, such as the latest load test report or the access control model.

## Ownership and check level

Use the definitions in [SCHEMA.md](SCHEMA.md). If unsure, pick the more conservative level: `guardrail` over `delegate`, and `partial` over `code`. Check the level against what an agent can actually confirm: if settings, approvals, history or runtime data decide the answer, the concern is `partial` or `people`.

## Applies when

Add an `applies_when` sentence only when a concern does not apply to every system, for example multi-region deployment or WebSockets. Write the condition as a fact an agent could check. Do not put a prerequisite in it, such as good monitoring: a missing prerequisite is something to flag, not a reason the concern does not apply.

## Writing safe advice

Reviewers repeatedly found text that was correct but unsafe if followed literally. Before you finish a concern, check each `good_looks_like` item and ask whether a team could meet the wording and still be unsafe or cause an outage. Name the safe way to adopt a change (for example, add a constraint in two steps on a large table). When behavior differs by product, say so and name the product.

## Related concerns

Pick two to four concerns that a reviewer would naturally look at next. Do not link to every loosely related item.
