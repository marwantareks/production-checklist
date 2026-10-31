# Content schema

Each concern is one YAML file in `content/concerns/`, named `NNN-slug.yaml` where `NNN` is the zero-padded id and `slug` comes from the name. The machine-readable rules are in [`schema/concern.schema.json`](../schema/concern.schema.json). A blank starting point is [`docs/concern-template.yaml`](concern-template.yaml).

## Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable number. Never renumber or reuse. |
| `name` | yes | Short name in sentence case, for example `Circuit breakers`. |
| `category` | yes | A category id from `content/categories.yaml`. |
| `order` | yes | Position inside the category. Use steps of 10 so items can be inserted. |
| `ownership` | yes | `own`, `guardrail` or `delegate`. See below. No concern uses `delegate` today. |
| `definition` | yes | One sentence in plain language. Ends with a full stop. |
| `how_it_works` | yes | The mechanism, enough to judge whether an implementation is sound. 2 to 4 sentences. |
| `where_it_appears` | yes | The places it shows up in a real application. |
| `review_question` | yes | One question a reviewer can answer from evidence. Ends with a question mark. |
| `trade_off` | yes | The main cost of the choice, stated fairly. |
| `why_it_matters` | yes | What goes wrong when it is ignored. |
| `red_flags` | yes | 3 to 6 answers or findings that should worry a reviewer. No full stops. |
| `good_looks_like` | yes | 3 to 6 things a reviewer can ask to see. No full stops. |
| `decide_between` | no | Only for a real design choice. Names the options and says when each fits. |
| `also_fits` | no | Free text naming other categories the concern also belongs to. |
| `applies_when` | no | One sentence starting with `Applies when` that says when the concern applies. Only for a concern that does not apply to every system. |
| `related` | yes | Up to 4 ids of concerns that usually travel together. May be empty. |
| `agent_check` | yes | See below. |

## Ownership

- `own`: the architect decides. These are expensive to reverse and shape the whole system.
- `guardrail`: the architect sets the standard and teams implement it.
- `delegate`: team or tool detail. The architect only needs to know it exists.

## Agent check

```yaml
agent_check:
  level: code            # code | partial | people
  search_hints: [...]    # for code and partial, 4 to 20 literal strings
  look_for: [...]        # optional, for code and partial: patterns described in words
  evidence_to_request: [...]   # required for people, optional for code and partial
```

- `code`: a coding agent can usually settle it from the repository.
- `partial`: the repository shows part of it.
- `people`: it needs people or runtime data, such as a signed-off target or a test record.

- `search_hints` are literal strings an agent can search for: setting names, library names, file names, header names. A single common word is rejected by the validator (the list is `scripts/lib/generic-hints.json`), and so is a hint that reads like a sentence.
- `look_for` describes patterns that have no exact text to search for, for example "A database query inside a loop over query results". The agent reads code to find them.
- `evidence_to_request` names the artifacts to ask the team for. A `people` concern has this and no hints. A `partial` or `code` concern may have it too, for the part a repository cannot show.

## Applies when

A concern that only applies under a condition has an `applies_when` sentence. If the condition clearly does not hold, an agent returns `not_applicable`, and only then. A concern without the line applies to every system. The page shows the sentence under "How it works" and lets the reviewer mark a concern not applicable, which takes it out of the progress count.

## Retired concerns

`content/retired.yaml` lists ids that were retired. An id is never reused and no concern may link to it. Retire a concern by moving its file's information into the surviving concern, deleting the file and adding the id to `retired.yaml` with the reason.

## Categories

`content/categories.yaml` lists each category with `id`, `name`, `hue`, `summary`, `icon` (SVG path data on a 24 by 24 grid) and `order`.

## Site metadata

`content/meta.yaml` holds the canonical page URL (https only, URL safe characters only), the year and the "last updated" month that the build puts in the page.
