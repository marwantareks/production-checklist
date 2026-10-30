# Security and safety

## Report unsafe or wrong advice

If a concern could lead someone to an unsafe design or a security mistake, open a "Content correction" issue. Say which concern and field, why it is wrong, and give a source if you have one. Wrong advice is treated as a priority.

## Report a vulnerability in the page or tooling

Use GitHub's private vulnerability reporting for this repository (Security tab, "Report a vulnerability"). Do not open a public issue for a vulnerability. If private reporting is not enabled, open an issue that asks for a private channel and leave out the details.

## What the page does with data

- It makes no network requests.
- Review marks and imported agent findings are stored in your browser only (`localStorage`).
- Imported findings can contain file paths and short code quotes. Use "Clear findings" when you are done on a shared machine.
- Imported text is shown as plain text and never as HTML.

## Agent review

Prompts ask the agent to work read-only and never print secret values. These are instructions, not enforcement. Run agents in plan mode, on a repository you trust, and review what they report. See [docs/AGENT_REVIEW.md](docs/AGENT_REVIEW.md).
