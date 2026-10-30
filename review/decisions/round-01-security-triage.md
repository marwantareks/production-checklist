# Round 1 triage: Security (concerns 67 to 80)

Sources: Gemini (three replies: two early tests, then one on prompt version 3) and Claude Opus 5.5 (one complete reply: 66 findings and 15 suggested additions).

Nothing here has been applied to the repository. All 61 content edits in section 4 were applied to a scratch copy and pass the schema limits and style rules. Decisions 1 to 7 are recorded in section 3, and the edits already reflect them.

## How to read this

- **Accept:** two agents agree, or I checked the claim against a source, or the reasoning is clear from the text.

---

## 1. Findings that apply beyond security

**S1. Search hints that are descriptions, not text.** Both agents flagged hints like "Action with a wildcard value" that an agent searches for literally, finds nothing, and may read as proof of absence. I audited all 99 concerns: **14 hints in 10 concerns** have this problem (for example 11 Timeouts, 27 N+1 queries, 39 Race conditions, 59 Logging, 68 IAM, 73, 78 SQL injection, 107, 108). Even Opus's own suggested hints for 78 still contain descriptions, which shows why a separate field is needed (decision D3).

**S2. Generic single-word hints.** About **105 hints across 48 concerns** are single common words (cache, lock, token, replica, event, session and so on). That count uses my own word list, so treat it as a rough size. Both agents showed these cause floods of false matches.

**S3. Advice that causes an outage if followed literally.** Opus flagged JWT key rotation, HSTS and WAF blocking mode. I'll add a check for this to the reviewer prompt for the remaining rounds and re-read other categories for the same pattern (circuit breakers, rate limiting, TLS versions, key deletion).

**S4. A single agent's "no issues found" is not evidence.** Gemini's third reply cleared 69, 71, 72, 74, 75, 76, 77 and 79. Opus found issues in all of them, and a major one in all except 75. Opus's own "no issues" list is empty: it found something in every one of the 14 concerns.

**S5. Agent check level overstated when settings live outside the repository.** Opus lowers 69, 70 and 73 from code to partial because identity provider, key management and platform settings are not in the repository. I have accepted those three.

**S6. Agent prompt changes.** Opus and Gemini together found six problems in the shared prompt (section 2 below).

**S7. A promised feature I did not build.** In October we agreed a "Not applicable" review status, so a small system could reach 100%. I did not build it. Opus's finding that the agent has no way to say a concern does not apply makes it necessary in both the prompt and the page. I'll add it when we edit the repo.

---

## 2. Changes to the agent prompt (shared rules and output format)

These are code changes in the repo (`src/lib/prompt.js`, the importer and the tests). **Decided: P1 to P5 accepted (decision 4); P6 replaced by a wording tweak (decision 5).**

| # | Finding | Agents | Proposed change | Recommendation |
|---|---|---|---|---|
| P1 | The quote required for every result can contain the secret. Opus adds that partial values, prefixes and lengths must not leak either. | Gemini, Opus | Replace the evidence rule with: "Support every result with the file path, the line number and a short quote of at most 120 characters. Never include any part of a secret value, prefix or length in a quote or note. If the line contains a credential, quote only the key name and write 'secret value redacted' in place of the value." The page will also mask likely secrets on import. | Accept |
| P2 | "Do not run anything that changes state" still allows running tests, builds, scripts or the app, which execute repository code, and network calls to addresses found in the repository, including metadata addresses. | Opus | "Do not run, build or test the code, run package scripts, or make any network request, including to URLs or addresses found in the repository. Read-only git commands such as git log and git grep are allowed." | Accept |
| P3 | No result for a concern that does not apply (CSRF in a backend with no browser clients, SQL injection with no SQL database). The agent has to pick a wrong answer. | Opus | Add the result `not_applicable`, with evidence of why. The page gets a matching "Not applicable" review status (S7). | Accept |
| P4 | `not_found` invites conclusions about controls that normally live outside the repository (WAF, IAM review, key rotation, certificate renewal). | Opus | "Use not_found only when the control would normally be configured in this repository. If it may be managed elsewhere, such as a cloud console, identity provider or platform team, return cannot_determine and say where it might live." Also say that search hints are starting points and some describe a pattern. | Accept |
| P5 | Red flags cannot be reported next to a practice that was found (a vault in use and one hard-coded key). Evidence is required even for not_found. The example uses an id that is not in the scope. JSON escaping of quotes is not mentioned. | Opus | Add a `red_flags` array to each entry, allow empty evidence for not_found, cannot_determine and not_applicable (the note then lists what was searched), tell the agent to escape double quotes and backslashes, and use the first id in scope in the example. | Accept |
| P6 | "You are Claude Code" and "plan mode" tie a vendor-neutral checklist to one product. | Opus | "You are a coding agent. Use your tool's read-only or plan mode if it has one." | **Decided (decision 5): a wording tweak instead.** The prompt opens "You are a coding agent, for example Claude Code" and says "Use plan mode in Claude Code, or your tool's read-only mode." The page and the skill stay Claude Code-specific. |

---

## 3. Decision log

| # | Decision | Choice | Status |
|---|---|---|---|
| 1 | Hints that are descriptions | Add a `look_for` field for described patterns | Decided |
| 2 | Evidence to request on partial concerns | Allow it on partial and code concerns, optional | Decided |
| 3 | Overlapping concerns | Split all four. Rename 70 to "JWT signing keys and validation". 69 keeps the flow, 70 owns token validation, 71 covers public endpoints and certificate lifecycle, 73 covers internal traffic and client-side checks | Decided |
| 4 | Agent prompt changes | Accept P1 to P5 | Decided |
| 5 | Claude Code wording | Claude Code first, with one wording tweak | Decided |
| 6 | New security concerns, "add now" | Add all five: application authorization, authentication and session management, software supply chain security, other injection and unsafe deserialization, security logging and audit trails | Decided |
| 7 | New security concerns, "consider" | Add threat modeling and data classification and privacy. Fold patch timelines into the supply chain concern. Fold container hardening into 8 Kubernetes | Decided |
| 8 | Section 4 content edits | Pending | **Open** |
| 9 | Sign-off and recording | Pending | **Open** |

Held out unless you object at sign-off: security headers, security testing in the pipeline, file upload handling, multi-tenant isolation, security incident response, AI and LLM security.

Consequences of the decisions that are not in section 4 and will be done at the repo stage: moving the 14 descriptive hints to `look_for` (the three in this round are in 68, 73 and 78), moving 75 to partial with hints and its evidence list, a schema change to allow evidence on partial concerns, a "Not applicable" review status, drafting the seven new concerns for review before they merge, and a suggested rise of the hint cap from 15 to 20.

---

## 4. Proposed content edits by concern


### 67. Secrets management

**decide_between** (Opus). Accept.

Environment variables are not shown by default in process listings; the real leak paths are crash dumps, debug endpoints, child processes and container inspection. Mounted files were a missing option.

Now:

> Secrets injected as environment variables, or fetched from the secret store by the application at runtime. Environment variables are simple but can leak through logs and process listings. Runtime fetching is safer and supports rotation but adds a dependency.

Proposed:

> Secrets injected as environment variables, mounted as files, or fetched from the secret store at runtime. Environment variables are simple but can leak through crash dumps, debug endpoints, child processes and container inspection, and change only on restart. Mounted files can refresh without a restart. Runtime fetching supports rotation best but adds a startup dependency.

**good_looks_like** (Opus). Accept.

Revocation must come before history rewriting, and workload identity removes long-lived keys.

Add or change to:

- A leaked secret is revoked and replaced first, because rewriting history does not remove copies
- Workload identity or OIDC federation used instead of stored long-lived keys where the platform supports it

**red_flags** (Opus). Accept.

Adds two common leak paths.

Add or change to:

- Kubernetes Secret manifests committed with real values, since base64 is encoding and not encryption
- Secrets printed in logs or error messages

**search_hints** (Gemini, Opus). Accept.

Both agents flag the bare words password, secret and token as false-positive floods. Pairing them with an assignment and adding common key prefixes fixes it.

Add: `password =`, `secret =`, `token =`, `PRIVATE KEY-----`, `ghp_`, `sk_live_`, `kind: Secret`, `.gitleaks.toml`

Remove: `password`, `secret`, `apikey`, `token`, `BEGIN PRIVATE KEY`, `gitleaks`

**related** (Opus). Accept.

Secrets travel with CI/CD and logging. Dropped infrastructure as code to stay within four.

Add: `6`, `59`

Remove: `104`

### 68. IAM

**red_flags** (Opus). Accept.

A literal reading flagged valid policies, since some cloud actions cannot be scoped to a resource. Adds break-glass access.

Add or change to:

- Wildcard actions, or wildcard resources without conditions where the service supports narrower scoping
- Standing administrator access with no just-in-time or break-glass process

Replace or remove:

- Wildcard permissions on actions and resources

**good_looks_like** (Opus). Accept.

Verified: CISA's fact sheet names FIDO/WebAuthn and PKI-based authentication as phishing-resistant, and NIST's 2025 revision of SP 800-63B defines the property. Security keys and passkeys qualify.

Add or change to:

- Phishing-resistant multi-factor authentication, such as security keys or passkeys, for people with privileged access

Replace or remove:

- Multi-factor authentication for people with privileged access

**review_question** (Opus). Accept.

The current question asks three things.

Now:

> Is access least-privilege, reviewed regularly and audited?

Proposed:

> Does every person and workload have only the permissions it needs, with evidence of a recent access review?

**search_hints** (Gemini, Opus). Accept.

Both agents flag the descriptive hints that an agent would search for literally.

Add: `"Action": "*"`, `"Resource": "*"`, `AdministratorAccess`, `roles/owner`, `roles/editor`, `cluster-admin`, `aws_iam_policy`, `aws_iam_access_key`, `iam:PassRole`, `google_project_iam`, `azurerm_role_assignment`

Remove: `iam`, `policy`, `Action with a wildcard value`, `Resource with a wildcard value`, `role`, `permissions`

### 69. OAuth

**red_flags** (Gemini (earlier run), Opus). Accept.

RFC 9700 deprecates the less secure modes. Opus also notes that nearly every single-page app stores tokens where scripts can read them, so the flag needs to point at the better option, a backend-for-frontend. The browser-apps guidance is still an IETF draft. Token validation checks (issuer, audience, expiry) moved to 70, as decided.

Add or change to:

- Implicit flow or password grant used
- Browser apps storing tokens in localStorage or sessionStorage where a backend-for-frontend is feasible
- Missing or unchecked state and nonce values
- ID tokens sent to APIs as access tokens

Replace or remove:

- Implicit flow or password grant used for new applications
- Access tokens stored where scripts can read them
- Tokens accepted without checking issuer, audience and expiry

**good_looks_like** (Opus). Accept.

Verified against summaries of RFC 9700: refresh tokens for public clients must be sender-constrained or rotated, and PKCE is recommended for confidential clients too (OAuth 2.1 makes it mandatory). Token validation moved to 70, as decided.

Add or change to:

- Authorization code flow with PKCE for all clients
- Refresh tokens for public clients rotated on use with reuse detection, or bound to the client

Replace or remove:

- Authorization code flow with PKCE for public clients
- Validation of issuer, audience, signature and expiry on every token

**review_question** (Opus). Accept.

Which identity provider is used cannot be judged good or bad from evidence.

Now:

> Which flows and scopes are used, and who is the identity provider?

Proposed:

> Does each client use the flow that current OAuth security guidance recommends for its type, with exact redirect matching and minimal scopes?

**agent_check level** (Opus). Accept.

Redirect URIs, allowed grants and token lifetimes usually live in the identity provider, not the repository.

Now:

> code

Proposed:

> partial

**search_hints** (Gemini (earlier run), Opus). Accept.

Both add response_type. scope matches unrelated code and is dropped.

Add: `code_verifier`, `response_type=token`, `grant_type=password`, `refresh_token`, `nonce`, `localStorage.setItem`

Remove: `openid`, `scope`, `grant_type`

**related** (Opus). Accept.

Token theft through XSS and login CSRF travel with OAuth.

Add: `77`, `79`

Remove: `68`

### 70. JWT rotation

**how_it_works** (Gemini, Opus). Accept.

Two different problems, both real. Gemini: the text only fits asymmetric keys. Opus: followed literally, replacing a key rejects every live token, so the new key must be published before use and the old one kept until its tokens expire. The merged text covers both.

Now:

> JSON Web Tokens are signed so services can trust them without calling the issuer. Rotation means replacing signing keys regularly and when compromised, publishing the current public keys (a key set with key ids) so verifiers pick up changes, and keeping token lifetimes short. Revocation needs extra design because tokens are valid until they expire.

Proposed:

> JSON Web Tokens are signed so services can trust them without calling the issuer. Rotation means adding a new signing key, publishing it before it is used, and removing the old key only after the tokens it signed have expired. Asymmetric keys are published as a key set such as a JWKS, and verifiers refetch it, with a rate limit, when they see an unknown key id. Symmetric secrets must be distributed to every verifier securely. Revocation needs extra design because tokens are valid until they expire.

**red_flags** (Opus). Accept.

The real flaw is trusting the algorithm named in the token (alg none and RS256 to HS256 confusion). With a shared symmetric secret every verifier can also mint tokens. RFC 8725 is the right source.

Add or change to:

- A symmetric signing secret shared by several services, so any of them can create valid tokens
- Verifiers that take the algorithm from the token header instead of a fixed allow list, or that accept none
- Tokens decoded without signature verification
- Tokens accepted without checking issuer, audience and expiry

Replace or remove:

- A single long-lived signing secret shared by services
- Verifiers that do not check algorithm, issuer or audience

**search_hints** (Opus). Accept.

Drops alg, kid and verify( as generic. Adds the risky patterns.

Add: `algorithms=`, `jwt.decode(`, `verify_signature`, `ignoreExpiration`, `ValidateIssuer`, `ValidateAudience`, `clockTolerance`, `nimbus`, `JwtBearer`

Remove: `kid`, `expiresIn`, `verify(`, `signing key`, `alg`

**agent_check level** (Opus). Accept.

Rotation schedules usually live in a key management service or identity provider.

Now:

> code

Proposed:

> partial

**good_looks_like** (Decision 3). Accept.

Takes over token validation from 69, as decided.

Add or change to:

- Validation of issuer, audience, signature and expiry on every token

**name** (Opus, Decision 3). Accept.

Tokens are not rotated, signing keys are, and the concern also covers validation and revocation. The id stays 70 and the file is renamed.

Now:

> JWT rotation

Proposed:

> JWT signing keys and validation

**definition** (Opus, Decision 3). Accept.

Matches the new scope.

Now:

> Regularly replacing signing keys and tokens to limit exposure.

Proposed:

> Managing the keys that sign JSON Web Tokens, validating tokens safely and limiting how long a stolen token works.

### 71. TLS

**how_it_works** (Opus). Accept.

"Current protocol versions" is not something a non-specialist can judge. TLS 1.0 and 1.1 are deprecated by RFC 8996.

Now:

> Transport Layer Security encrypts traffic between a client and a server and proves the server’s identity with a certificate. Good practice is current protocol versions, strong ciphers, certificates from a trusted authority renewed automatically, HTTP redirected to HTTPS, and HSTS.

Proposed:

> Transport Layer Security encrypts traffic between a client and a server and proves the server’s identity with a certificate. Good practice is TLS 1.2 as the minimum with TLS 1.3 preferred, strong ciphers, certificates from a trusted authority renewed automatically, HTTP redirected to HTTPS for web pages, and HSTS.

**why_it_matters** (Opus). Accept.

Verified: Ballot SC-081v3 sets 200 days from 15 March 2026, 100 days from 2027 and 47 days from 2029. The 200-day limit is already in effect.

Now:

> Without TLS, traffic can be read and modified, and expired certificates cause outages that are entirely avoidable.

Proposed:

> Without TLS, traffic can be read and modified, and expired certificates cause outages that are avoidable. Public certificate lifetimes are shrinking toward 47 days by 2029, so manual renewal will not keep up.

**red_flags** (Opus). Accept.

The current flag contradicts the advice to redirect HTTP to HTTPS. For APIs, redirecting means the first request already went out in clear text. Client-side certificate validation moved to 73, as decided.

Add or change to:

- Content or APIs served over plain HTTP, where APIs should reject it and web pages should redirect

Replace or remove:

- Plain HTTP served or accepted
- Certificate validation disabled in client code

**good_looks_like** (Opus). Accept.

Safety: a long HSTS lifetime with includeSubDomains or preload can break subdomains still on HTTP, and preload is slow to undo. Advice that causes an outage when followed literally is a pattern I will check in other categories. "Clients validate certificates" moved to 73, as decided.

Add or change to:

- HTTP redirected to HTTPS and HSTS enabled, starting with a short max-age and adding includeSubDomains or preload only after every subdomain serves HTTPS

Replace or remove:

- HTTP redirected to HTTPS and HSTS enabled
- Clients validate certificates

**review_question** (Opus). Accept.

Narrows 71 to public endpoints and certificate lifecycle, leaving internal traffic to 73. See decision D2.

Now:

> Is TLS enforced end to end, and who manages certificate renewal?

Proposed:

> Is TLS enforced on every public endpoint, and is certificate renewal automated?

**search_hints** (Opus). Accept.

tls, ssl, certificate and https match almost everything. The hints for switching validation off moved to 73 with the rest of client-side checks, as decided.

Add: `ssl_protocols`, `Strict-Transport-Security`, `certbot`, `ssl_certificate`, `SSLProtocol`, `includeSubDomains`

Remove: `tls`, `ssl`, `certificate`, `https`, `TLSv1`, `InsecureSkipVerify`, `verify=False`, `rejectUnauthorized`

### 72. Encryption at rest

**how_it_works** (Opus). Accept.

"A stolen disk or snapshot is unreadable" overstates provider-managed encryption. Anyone with valid access still sees plaintext.

Now:

> Encryption at rest protects stored data in databases, disks, object storage and backups, so a stolen disk or snapshot is unreadable. It relies on keys held in a key management service. Decisions include who controls the keys, how often they rotate and who can use them.

Proposed:

> Encryption at rest protects stored data in databases, disks, object storage and backups against lost or stolen media. With transparent encryption, anyone with valid access to the service still sees plaintext, so it does not replace access control. It relies on keys held in a key management service, and field-level or customer-managed keys narrow who can read data. Decisions include who controls the keys, how often they rotate and who can use them.

**red_flags** (Opus). Accept.

Defaults differ by service: some object stores encrypt by default, while some Terraform database settings default to off. An agent that only looks for a setting can mis-judge either way.

Add or change to:

- Storage, databases or backups with encryption off, judged against each service’s default rather than whether a setting is present
- One key for every data set, or keys never rotated

Replace or remove:

- Storage, databases or backups with encryption off
- One key for everything with no rotation

**decide_between** (Opus). Accept.

A deleted customer-managed key makes every copy of the data unreadable.

Now:

> Provider-managed keys or customer-managed keys. Provider-managed is simpler. Customer-managed gives more control and audit but adds operating work and the risk of losing access.

Proposed:

> Provider-managed keys or customer-managed keys. Provider-managed is simpler. Customer-managed gives more control and audit but adds operating work, and a deleted key makes every copy of the data, including backups, unreadable, so it needs deletion protection and a waiting period.

**search_hints** (Gemini (earlier run), Opus). Accept.

Both flag AES as too generic. Opus also notes that sse collides with server-sent events (concern 24).

Add: `server_side_encryption_configuration`, `encrypt_at_rest`, `kms_key_name`, `aws_ebs_encryption_by_default`, `disk_encryption_set_id`, `encryption_configuration`, `TDE`

Remove: `encrypted`, `encryption`, `sse`, `at rest`, `AES`

### 73. Encryption in transit

**red_flags** (Opus). Accept.

An encrypted database connection is not automatically verified. In PostgreSQL the default sslmode falls back to plain text, and require does not check the server certificate. Absorbs the client-side validation flag from 71, as decided.

Add or change to:

- Certificate validation disabled in client code, including for internal calls
- Database connections that allow fallback to plain text or skip certificate checks, for example sslmode set to prefer or require instead of verify-full
- TLS terminated at a load balancer with plain traffic onward across networks you do not control

Replace or remove:

- TLS verification turned off for internal calls

**search_hints** (Gemini, Opus, Decision 3). Accept.

Both agents flag the descriptive hint "http:// between services". Takes over the validation-off hints from 71. The current cap of 15 forced me to leave out CURLOPT_SSL_VERIFYPEER, TrustAllCerts, ServerCertificateCustomValidationCallback and check_hostname. I suggest raising the cap to 20 when we edit the repo.

Add: `http://`, `sslmode=disable`, `sslmode=prefer`, `useSSL=false`, `Encrypt=false`, `TrustServerCertificate=true`, `redis://`, `amqp://`, `security.protocol=PLAINTEXT`, `mode: PERMISSIVE`, `InsecureSkipVerify`, `verify=False`, `rejectUnauthorized`, `NODE_TLS_REJECT_UNAUTHORIZED`, `HostnameVerifier`

Remove: `http:// between services`, `sslmode`, `ssl=true`, `tls`, `mtls`, `PeerAuthentication`, `require_ssl`, `rediss://`, `verify`, `STRICT`

**agent_check level** (Opus). Accept.

Mesh and database TLS enforcement is often set by the platform, outside the application repository.

Now:

> code

Proposed:

> partial

### 74. WAF

**good_looks_like** (Opus). Accept.

Safety: blocking managed rules before tuning stops legitimate traffic, so a time-boxed detection period comes first. This matches common vendor guidance; the AWS page Opus cited is the usual reference.

Add or change to:

- WAF in blocking mode in front of public applications, after a time-boxed period in detection mode to tune rules

Replace or remove:

- WAF in blocking mode in front of public applications

**red_flags** (Opus). Accept.

An origin that accepts traffic directly bypasses the WAF completely, the most common WAF failure. Verified: PCI DSS 4.0 requirement 6.4.2 (mandatory since 31 March 2025) requires an automated solution in front of public-facing web applications that either blocks attacks or raises alerts that are immediately investigated. So detection mode is acceptable only when someone acts on the alerts, and I changed the wording to say that.

Add or change to:

- No WAF or equivalent control on public web applications that handle sensitive data, with no recorded reason
- A WAF left in detection mode indefinitely, with alerts nobody investigates
- Origin reachable without passing through the WAF

Replace or remove:

- No WAF on public web applications
- A WAF left in detection mode forever

**search_hints** (Opus). Accept.

Adds Google and Azure equivalents. Drops owasp and rule group as generic.

Add: `aws_wafv2_web_acl_association`, `SecRuleEngine`, `coreruleset`, `google_compute_security_policy`, `cloud armor`, `azurerm_cdn_frontdoor_firewall_policy`

Remove: `web application firewall`, `owasp`, `rule group`

**related** (Opus). Accept.

WAF rate rules travel with rate limiting, and WAFs often sit on the CDN.

Add: `1`, `48`

Remove: `78`

### 75. DDoS protection

**why_it_matters** (Opus). Accept.

The current text repeats the trade-off. Adds the cost risk of uncapped autoscaling.

Now:

> Self-defense rarely scales, and without planning you only find your options during an attack.

Proposed:

> An attack can take a service offline for hours, and autoscaling without limits can turn an attack into a large bill. Options found only during an attack are slow and expensive.

**how_it_works** (Opus). Accept.

Adds protocol-level attacks that bypass volumetric defenses, such as HTTP/2 Rapid Reset (CVE-2023-44487).

Now:

> A distributed denial of service attack floods a service with traffic to make it unavailable. Defenses work in layers: absorb volumetric attacks at the network edge or CDN, filter at the application layer, rate limit, and design the system so that expensive operations cannot be triggered cheaply.

Proposed:

> A distributed denial of service attack floods a service with traffic to make it unavailable. Defenses work in layers: absorb volumetric attacks at the network edge or CDN, filter at the application layer, rate limit, and design the system so that expensive operations cannot be triggered cheaply. Keep proxies and servers patched against protocol-level attacks such as HTTP/2 Rapid Reset, and cap autoscaling so an attack cannot cause unlimited cost.

**related** (Opus). Accept.

CDN, autoscaling and cost control travel with this concern.

Add: `48`, `45`

Remove: `3`

### 76. CORS

**definition** (Me (self-audit)). Accept.

The current definition says CORS controls which origins can call your API. It controls which origins’ scripts can read responses.

Now:

> Browser policy controlling which origins can call your API.

Proposed:

> Browser rule that lets a server choose which other origins’ scripts may read its responses.

**how_it_works** (Gemini (earlier run), Opus, me). Accept.

All three agree the old wording was wrong. Opus’s rewrite is the most accurate: CORS relaxes the same-origin policy, simple requests are still sent, and it is not a CSRF defense. Gemini’s replacement still got the mechanism wrong.

Now:

> Cross-origin resource sharing is a browser mechanism that decides which other origins may call an API from scripts. The server sends headers naming allowed origins, methods and headers. It protects users’ browsers but is not a server-side access control, since non-browser clients ignore it.

Proposed:

> Cross-origin resource sharing lets a server relax the browser’s same-origin policy so that named origins can read its responses from scripts. Simple requests are still sent, so CORS does not stop cross-site requests from happening and is not a CSRF defense. Non-browser clients ignore it, so it is not access control. The server sends headers naming the allowed origins, methods and headers.

**why_it_matters** (Opus, me). Accept.

Browsers reject a wildcard origin combined with credentials, so the dangerous case is reflecting or trusting an untrusted origin.

Now:

> Allowing any origin with credentials lets any website make authenticated requests as your user.

Proposed:

> Allowing untrusted origins with credentials lets any website read responses as your user.

**red_flags** (Opus, me). Accept.

Replaces the wildcard-with-credentials flag, which browsers reject anyway. Adds missing Vary: Origin and trusting every subdomain.

Add or change to:

- Credentials allowed together with a reflected origin or the null origin
- Origin reflected without a Vary: Origin header, which allows cache poisoning
- All subdomains trusted, so one compromised subdomain can read user data

Replace or remove:

- Access-Control-Allow-Origin set to a wildcard together with credentials
- The origin reflected back from the request with no check

**review_question** (Opus). Accept.

The current question is yes or no and misses the credentials case.

Now:

> Are allowed origins explicit rather than wildcards?

Proposed:

> Which origins can read responses with credentials, and how is that list enforced?

### 77. CSRF

**how_it_works** (Opus). Accept.

SameSite is presented as a full defense but OWASP treats it as defense in depth: it does not separate subdomains of the same site, and browser defaults differ. Adds Origin and Sec-Fetch-Site checks, and says that APIs authenticated by a header (not cookies) are not exposed to CSRF. I left out the browser-by-browser defaults because they change.

Now:

> Cross-site request forgery tricks a logged-in user’s browser into sending an unwanted request, such as a transfer, because browsers attach cookies automatically. Defenses are SameSite cookies, anti-forgery tokens for state-changing requests, checking the origin of requests and avoiding state changes on GET.

Proposed:

> Cross-site request forgery tricks a logged-in user’s browser into sending an unwanted request, such as a transfer, because browsers attach cookies automatically. The main defenses are anti-forgery tokens, or checks of the Origin or Sec-Fetch-Site headers, on every state-changing request, plus no state changes on GET. SameSite cookies add a layer but are not enough alone, because they do not separate subdomains of the same site and browser defaults differ. APIs that authenticate with a header such as a bearer token, not cookies, are not exposed to CSRF.

**good_looks_like** (Gemini (earlier run), Opus). Accept.

Both agents flag the bare SameSite item. Gemini: SameSite=None disables the protection. Opus: it suggests SameSite alone is enough, and naive double-submit cookies can be bypassed from a subdomain.

Add or change to:

- SameSite=Lax or SameSite=Strict on session cookies, as an extra layer
- Double-submit tokens, where used, signed and tied to the session

Replace or remove:

- SameSite set on session cookies

**search_hints** (Opus). Accept.

Two hints were descriptions. Adds the opt-out markers used in Django, Rails, .NET and Laravel, which are the highest-value things to find.

Add: `csrf_exempt`, `skip_before_action :verify_authenticity_token`, `protect_from_forgery`, `IgnoreAntiforgeryToken`, `ValidateAntiForgeryToken`, `VerifyCsrfToken`, `csrf: false`, `Sec-Fetch-Site`

Remove: `anti-forgery`, `Origin header`, `double submit`

### 78. SQL injection

**search_hints** (Gemini, Opus). Accept.

Both flag the descriptive hints. Gemini’s replacement (SELECT, INSERT, UPDATE, DELETE) would match every migration and query, so I used Opus’s direction with literal strings only. Opus’s own list still contains descriptions such as "createQuery with +", which go in the new look_for field (decision 1): a SELECT or WHERE built with + or string formatting; an ORDER BY clause that takes a request value; a createQuery call built with +.

Add: `$queryRawUnsafe`, `$executeRawUnsafe`, `sequelize.query`, `knex.raw`, `createNativeQuery`, `FromSqlRaw`, `ExecuteSqlRaw`, `RawSQL`, `extra(where=`, `cursor.execute(f`, `f"SELECT`, `"SELECT " +`, `'SELECT`, `String.format("SELECT`

Remove: `execute(`, `query(`, `raw(`, `SELECT with string concatenation`, `f-string SQL`, `template literal SQL`, `String.format SQL`, `ORDER BY with a variable`

**how_it_works** (Opus). Accept.

Using an ORM was presented as a fix, but ORMs have raw and unsafe functions. Second-order injection, where stored data is later used in a query, was missing.

Now:

> SQL injection happens when user-supplied input is joined into a query string, so the input can change what the query means. The fix is to keep code and data separate: queries use parameters, or an ORM that binds values, and the database account has only the privileges it needs.

Proposed:

> SQL injection happens when user-supplied input is joined into a query string, so the input can change what the query means. The fix is to keep code and data separate: queries use bound parameters, and the database account has only the privileges it needs. ORMs are safe only through their binding functions, and their raw query functions need the same care. Data read back from the database is also untrusted when it is used to build a query.

**review_question** (Opus). Accept.

The current question asks two things.

Now:

> Is parameterized access mandatory, and are database privileges minimal?

Proposed:

> Is every query built with bound parameters or allow-listed identifiers, with no exceptions?

### 79. XSS

**good_looks_like** (Opus). Accept.

Verified against web.dev guidance: allow-list policies are often bypassable, nonce or hash based policies with strict-dynamic are the strict form, and report-only mode is the safe way to roll out. Trusted Types is hedged with "where browser support fits" because support varies.

Add or change to:

- A content security policy based on nonces or hashes, rolled out in report-only mode first
- Trusted Types where browser support fits
- HttpOnly session cookies, which limit theft of the cookie

Replace or remove:

- A strict content security policy
- HttpOnly cookies for sessions

**red_flags** (Opus). Accept.

URL-based XSS was missing. Most frameworks do not block javascript: URLs built from user input.

Add or change to:

- User-supplied URLs placed in href, src or redirects without checking the scheme

**how_it_works** (Opus). Accept.

"Safe cookie settings" was listed as an XSS defense. HttpOnly limits cookie theft but does not stop a script from acting as the user.

Now:

> Cross-site scripting happens when an application includes untrusted input in a page so that a browser runs it as code. Defenses are output encoding for the right context, avoiding unsafe DOM and HTML insertion, framework templating that escapes by default, a content security policy and safe cookie settings.

Proposed:

> Cross-site scripting happens when an application includes untrusted input in a page so that a browser runs it as code. Defenses are output encoding for the right context, avoiding unsafe DOM and HTML insertion, framework templating that escapes by default, and a content security policy. HttpOnly cookies limit theft of the session cookie but do not stop an injected script from acting as the user.

**search_hints** (Opus). Accept.

raw( duplicates 78 and sanitize is generic. Adds framework bypass functions.

Add: `bypassSecurityTrust`, `mark_safe`, `Html.Raw`, `th:utext`, `insertAdjacentHTML`, `javascript:`, `trustAsHtml`

Remove: `raw(`, `sanitize`

### 80. SSRF

**red_flags** (Gemini, Opus (same ground in good_looks_like)). Accept.

Alternative address forms (0.0.0.0, IPv6, decimal and hex notation) bypass simple string blocks. Both agents raised this, in different fields.

Add or change to:

- Checking the URL text but not the address it resolves to, including forms such as 0.0.0.0, IPv6 and decimal or hex notation

Replace or remove:

- Checking the URL text but not the address it resolves to

**good_looks_like** (Opus). Accept.

Blocking after name resolution fails if the HTTP client resolves the name again (DNS rebinding), so the checked address must be the one connected to. Also limits the allowed schemes.

Add or change to:

- Private, loopback, link-local and metadata ranges blocked for IPv4 and IPv6, with the connection pinned to the checked address
- Only http and https schemes allowed

Replace or remove:

- Private, loopback and metadata ranges blocked after resolution

**search_hints** (Opus). Accept.

fetch(, axios, url=, redirect and localhost match most web code. Adds metadata hardening settings and non-AWS metadata hosts.

Add: `fd00:ec2::254`, `metadata.google.internal`, `http_tokens`, `HttpTokens`, `metadata_options`, `file://`, `gopher://`, `maxRedirects`, `follow_redirects`

Remove: `axios`, `url=`, `webhook url`, `redirect`, `localhost`

**related** (Opus). Accept.

Webhooks with user-supplied URLs are a primary SSRF entry point.

Add: `101`

---

## 5. Sources

- **Opened or confirmed by me:** RFC 9700 (through summaries; confirm sections 2.1.1 and 2.2.2 if you cite it), CA/Browser Forum Ballot SC-081v3, PCI DSS 4.0 requirement 6.4.2, CISA's phishing-resistant MFA fact sheet, NIST SP 800-63B (2025 revision, through summaries), web.dev strict CSP guidance.
- **Cited by an agent and not opened by me:** the OWASP cheat sheets (secrets, CSRF, SQL injection, XSS, SSRF, TLS, HSTS), RFC 8725, RFC 7517, OpenID Connect Core, RFC 6797, RFC 8996, NIST SP 800-52, 800-111 and 800-57, the Kubernetes, AWS, Terraform and PostgreSQL documentation, the W3C Trusted Types draft and the Chromium SameSite notes. Open any you plan to cite in a change description.
- **Left out on purpose:** Opus's browser-by-browser SameSite defaults for 77, because they change over time.

## 6. Next

Decision 8 is whether to accept the section 4 edits, as a batch or one concern at a time. After that, decision 9 is the sign-off, and I'll record everything for the repo update.
