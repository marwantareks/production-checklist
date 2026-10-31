# Security and safety

## Report unsafe or wrong advice

If a concern could lead someone to an unsafe design or a security mistake, open a "Content correction" issue. Say which concern and field, why it is wrong, and give a source if you have one. Wrong advice is treated as a priority.

## Report a vulnerability in the page or tooling

Use GitHub's private vulnerability reporting for this repository (Security tab, "Report a vulnerability"). Do not open a public issue for a vulnerability. If private reporting is not enabled, open an issue that asks for a private channel and leave out the details.

## What the page does with data

- It makes no network requests.
- Review marks and the theme are stored in your browser (`localStorage`, keys start with `prc.`). Imported agent findings are kept in `sessionStorage`, so they stay in the tab you imported them in and are gone when it closes.
- Imported findings can contain file paths and short code quotes. Use "Clear findings" when you are done on a shared machine.
- Imported text is shown as plain text and never as HTML.

## Agent review

Prompts ask the agent to work read-only and never print secret values. These are instructions, not enforcement. Run agents in plan mode, on a repository you trust, and review what they report. See [docs/AGENT_REVIEW.md](docs/AGENT_REVIEW.md).

## Use the real page

Anyone can copy this project and host a changed version, including a changed agent prompt. The canonical address is set in `content/meta.yaml` (`url`). Each deploy publishes the SHA-256 of `index.html` in `index.html.sha256` next to the page and in the deploy run summary. If you build the page yourself, run `npm run build` and compare `dist/index.html` with that file. Read a prompt before you give it to an agent.

## Page protections

- The page carries a Content Security Policy that allows only its own inline script and style by hash, and no network access, form submission or base URL change. GitHub Pages cannot set response headers, so the policy is a meta tag and cannot stop other sites from framing the page.
- `localStorage` is shared by every page on the same origin, and a github.io user site is one origin. That is why findings use `sessionStorage`, why keys are prefixed, and why stored values are validated when they are read. Any other page published under the same github.io user name could still read or overwrite review marks and the theme, so do not publish untrusted pages there.
- Masking of imported findings is best-effort. Do not paste secrets, and use "Clear findings" on a shared machine.
