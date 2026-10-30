# Round 6 triage: Traffic, networking and APIs, and Caching and performance (concerns 1, 3, 4, 5, 22, 24, 101, 102 and 2, 48 to 50, 91 to 94)

Sources: four complete replies, one per agent and prompt. For traffic (6a): Claude Opus 5.5 and Gemini. For caching (6b): Claude Opus 5.5 and Gemini. About 95 findings from Opus and 47 from Gemini, and 20 suggested additions in total. Neither agent listed any concern as clean.

Nothing here has been applied to the repository. All 94 content edits in section 4 were applied to a scratch copy and pass the schema limits and style rules. They reflect earlier decisions: described patterns go to `look_for`, hint lists respect the cap of 15, and the edits that make a concern partial with evidence to request were checked against the schema change you approved in round 1.

---

## 1. What this round showed

**R1. The standalone prompts worked.** All four replies came back complete, in one message, with nothing cut off. Splitting large rounds into separate prompts is now the standard.

**R2. The agents agreed again.** Both agents found the same problems in almost every concern, and Opus found more of them.

**R3. The outage-safety check found more real problems.**
- **Rate limiting (1):** the limit key was never stated. Keying on the proxy address throttles everyone together, and an unvalidated forwarded header lets attackers rotate spoofed addresses (Opus rated it critical). A limit checked after expensive work still lets an attacker use the capacity it protects (Gemini rated it critical). Hard per-account lockout lets an attacker lock out any known user.
- **Load balancing (3):** the backend keep-alive timeout must be longer than the balancer's idle timeout, or the balancer returns intermittent 502s. The old text said the timeouts should be aligned. Both agents found it. A health check that depends on a shared database removes the whole fleet at once.
- **Reverse proxies (4):** forwarded-header trust was only a red flag and never explained (Opus rated it critical). Gemini added that backends reachable directly allow spoofed headers. Request smuggling was missing, found by both.
- **API gateways (5):** authentication at the gateway alone encourages services to trust forged identity headers and skip authorization.
- **WebSockets (22):** both agents rated origin checking critical, because browsers send cookies on WebSocket upgrades without CORS, so cookie-authenticated endpoints that skip the check allow cross-site hijacking. Opus adds tokens in URLs and unbounded queues for slow clients.
- **Webhooks (101):** both agents rated outbound SSRF critical: a sender pointed at internal services or cloud metadata endpoints. Both also asked for constant-time signature comparison.
- **Caching (2):** both agents rated missing memory limits critical. An unbounded cache exhausts the host, and Redis with the noeviction policy fails writes once full.
- **CDN and edge (48, 49):** both rated cookie-keyed caching of personalized responses critical. Opus adds web cache deception (a private page made cacheable through a path ending such as .css) and web cache poisoning through request headers left out of the cache key.
- **Cache invalidation (50):** the write-invalidate race: a reader fetches the old value, a writer updates and deletes the key, and the reader then stores the old value, which stays forever. Both agents found it, and both said updating the cache on write is more race-prone than deleting.
- **Performance (91 to 94):** coordinated omission in load tests (both agents), averaged percentiles hiding outages, and hedged requests with no delay threshold or quota, which can turn a slowdown into a cascade (Gemini rated it critical). Load tests that call real payment or email providers cause real charges and messages.

**R4. Hints again.** Both agents flagged generic or description-style hints in every concern: throttle, 429, nginx, upstream, sse, ping, signature, delivery, cache, ttl, expire, lru, cdn, origin, edge, workers, bust, evict.

**R5. Applies-when sentences.** Both agents proposed them for five concerns:
- 22 WebSockets: "Applies when the system keeps WebSocket connections open to clients or other services."
- 24 Server-sent events: "Applies when the system streams events to clients with server-sent events."
- 101 Webhooks: "Applies when the system sends or receives webhooks."
- 48 CDN: "Applies when the system serves content to users spread across regions or must absorb traffic spikes at the edge."
- 49 Edge caching: "Applies when the system caches pages or API responses, not just static files, at a CDN or edge runtime."

**R6. Check level.** Partial instead of code for 2 Caching (both agents), 102 API versioning (both), 4 Reverse proxies (Gemini), 22 WebSockets (Opus) and 50 Cache invalidation (Opus). Each has hints and evidence to request in its edits. Ownership: 1 Rate limiting to guardrail (Opus, low confidence).

**R7. Overlaps.** 48 and 49 repeated headers, privacy and purge, so 48 now keeps whether a CDN is used, origin protection and purge, and 49 keeps cache key and lifetime rules. 3, 4 and 5 now point to one another in their definitions. 91, 93 and 94 each explained percentiles, so 91 keeps targets and budgets, 93 keeps how percentiles are measured and aggregated, and 94 keeps causes and mitigation.

**R8. Fan-out placement.** Opus wanted the fan-out example (about 63 percent of pages hit a P99-slow call when a page makes 100 backend calls) in 93, and Gemini said fan-out belongs to 94. I put it in 94.

**R9. Gemini again proposed banning absence red flags.** It asked in both prompts that red flags be reported only with positive evidence, and that a missing control be reported through the result instead. This is the third time in a different form. Decision 1.

---

## 2. Further changes to the agent prompt

| # | Finding | Agent | Proposed change |
|---|---|---|---|
| P30 | When an absence red flag is reported, no source line exists, so the required file, line and quote force the agent to fabricate evidence or break the JSON. | Gemini (both prompts) | "For a red flag that states an absence, evidence may be an empty array. List the searches and locations in the note." |
| P31 | The absence rule (P12a) still pushes agents to treat missing search hits as proof of absence. | Gemini (both prompts) | "Report a red flag only when you find positive evidence of an unsafe pattern. If a control cannot be found, report not_found or cannot_determine instead of an absence red flag." |
| P32 | The red flag evidence shape is described as evidence: [...], without saying the items use the same file, line and quote shape. | Opus (both prompts) | "A red flag entry has the shape {\"flag\": \"<text exactly as listed>\", \"evidence\": [{\"file\": \"...\", \"line\": 1, \"quote\": \"...\"}]}." |
| P33 | The sampling rule says "every call or write" without saying which concerns it covers. | Opus | Reword it: "For concerns where the practice must hold on every endpoint, handler, client or write (for example rate limits, authentication, signature checks and timeouts), sample the main ones, report found only if every one checked has it, and say in the note how many you checked." |
| P34 | Generic hints such as ping, sse and webhook match unrelated files, so an agent may never return not_applicable or may return found on a false match. | Opus | "A hint match in unrelated code does not show the technology is used. Confirm with a handler, endpoint or client before judging the concern." |

P31 conflicts with P12a and P16, which you accepted: they allow absence red flags only after searching every hint and likely location, and not when the control may live outside the repository. Banning absence red flags would also remove per-flag detail, because most red flags in the checklist state an absence ("No limit on public endpoints").

---

## 3. Decisions for this round

| # | Decision | Status |
|---|---|---|
| 1 | Prompt changes P30 to P34 | **Decided:** accept P30, P32, P33, P34 and decline P31 (the ban on absence red flags) |
| 2 | Check level changes for 2, 4, 22, 50 and 102 | **Decided:** accept all five |
| 3 | New concerns and folds suggested this round | **Decided:** fold everything else and add "Service-to-service authentication" (own, partial), bringing the plan to 114 concerns |
| 4 | The 94 content edits in section 4 | Open |
| 5 | Round status and expert set | Open |

### Suggested additions this round (20 suggestions, 14 distinct)

| Tier | Concern | Suggested by | Why | Where it goes |
|---|---|---|---|---|
| Consider | Service-to-service authentication | Opus, Gemini (as service mesh and east-west traffic) | mTLS or workload identity between services stops gateway bypass and forged identity headers. Nothing owns east-west trust. | New concern, or stay folded into 5 and 71 to 73 |
| Consider | Frontend performance and Core Web Vitals | Opus, Gemini | User-perceived speed (page load, interaction, layout stability, bundle size) is not covered by server-side latency. | New concern, or stay folded into 91 (a real user monitoring item is in its edits) |
| Fold | Load testing and capacity planning, performance and load testing methodology | Opus, Gemini | Method, open-model load generation, isolation from third parties. | The capacity planning and load testing concern added in round 5, once drafted |
| Fold | Egress control and outbound traffic | Opus | Egress paths, NAT cost, stable egress addresses, blocking unexpected destinations. | 101 (outbound egress in the edits), 88 (NAT cost in round 5), SSRF in 80 |
| Fold | Timeout and keep-alive chain across layers | Opus | Timeouts must decrease inward and keep-alives increase inward. | 3 and 4 (in the edits) and 11 |
| Fold | Load shedding and admission control | Opus | Rejecting work early under overload. | 44 (done in round 3) |
| Fold | Pagination and response size limits | Opus | Unbounded list endpoints are a top cause of API overload and data exposure. | 26 Query optimization, as a good-looks-like item |
| Fold | API error format | Opus | A consistent error format such as RFC 9457 problem details. | 102, as a mention |
| Fold | DNS behavior | Opus | TTLs and client DNS caching affect failover. | 9 (in the round 5 edits) and 85 |
| Fold | API contract and schema validation | Gemini | Runtime validation against OpenAPI or JSON Schema. | 102 and the injection concern from round 1 |
| Fold | Global traffic routing and DNS steering | Gemini | Anycast, latency-based steering and health-checked DNS failover. | 86 Multi-region deployment |
| Fold | Response compression and payload size, payload compression and asset optimization | Opus, Gemini | Compression choice and oversized responses, and compression applied to secrets (BREACH). | 48 and 4 |
| Fold | Hot keys and hot partitions | Opus | One popular key can saturate one node regardless of cluster size. | 2 and 30 |
| Fold | Profiling, continuous profiling | Opus (Gemini in round 5) | Finds the cause of slow paths that metrics and traces cannot. | A hint in 66 (round 5) |
| Fold | Browser caching and client storage | Gemini | Client-side caching directives and service worker storage. | 2 and 48 |
| Hold | Internal RPC and service-to-service protocols | Gemini | gRPC and similar frameworks. You removed gRPC earlier as narrow protocol detail. | Not added |

---

## 4. Proposed content edits by concern

### 1. Rate limiting

**how_it_works** (Gemini, Opus). Accept.

Opus rated the missing key critical: keying on the proxy address throttles everyone together, and an unvalidated forwarded header lets attackers rotate spoofed addresses. Both agents: the failure mode of the counter store was not stated.

Now:

> A limit caps how many requests a client can make in a time window, for example 100 per minute per API key. Requests over the limit are rejected or delayed, normally with a clear response such as HTTP 429 and a Retry-After header. Common algorithms are fixed window, sliding window and token bucket, and the counters must be shared across instances to be accurate.

Proposed:

> A limit caps how many requests a client can make in a time window, for example 100 per minute per API key. Choose the key deliberately: an API key, user or tenant when callers are authenticated, and the client IP only for anonymous traffic, taken from the trusted proxy settings and allowing for many users behind one address. Over-limit requests get HTTP 429, usually with Retry-After. Accurate global limits need shared counters, so decide what happens if the counter store is down: usually fail open with a local fallback, and closed only on sensitive endpoints such as login.

**red_flags** (Gemini, Opus). Accept.

Both agents: a limit checked after expensive work still lets an attacker consume the capacity it protects (Gemini rated it critical).

Add or change to:

- Limits applied after authentication, body parsing or database work, so rejected requests still cost full capacity
- Limits keyed on a raw forwarded header or on a shared proxy address

**good_looks_like** (Opus). Accept.

Hard per-account lockout lets an attacker lock any known user out, which is a denial of service.

Add or change to:

- Limits per client, key or user on every public endpoint, stricter on expensive operations
- Login and reset endpoints limited per IP and per account, with delays or step-up challenges rather than hard account lockout
- Counters shared across instances, with a defined behavior if the store is down

Replace or remove:

- Limits per client, key or user on every public endpoint, stricter on login and expensive operations
- Counters shared across instances, for example in a cache or at the gateway

**search_hints** (Gemini, Opus). Accept.

throttle matches UI debounce helpers and 429 matches unrelated numbers. Adds common libraries for more languages.

Add: `rate_limit`, `limit_req_zone`, `@nestjs/throttler`, `slowapi`, `django-ratelimit`, `Rack::Attack`, `golang.org/x/time/rate`, `resilience4j.ratelimiter`, `RateLimit-Limit`, `TooManyRequests`

Remove: `rate limit`, `throttle`, `429`, `Retry-After`, `token bucket`

**ownership** (Opus). Accept.

The architect sets the policy (keys, tiers, failure mode) and teams set per-endpoint thresholds. Opus rated this low confidence.

Change from `own` to `guardrail`.

**related** (Opus). Accept.

IP-keyed limits depend on forwarded-header trust (4), and backpressure (44) is the internal counterpart. I dropped 11 to stay within four.

Add: `4`, `44`

Remove: `11`

### 2. Caching

**how_it_works** (Gemini, Opus). Accept.

Both agents: the review question asked about miss storms but the text never explained them.

Now:

> A cache keeps a copy of data that is expensive to fetch or compute so later requests are served faster. Caches can sit in the browser, at a CDN, in the application, or next to the database. Each entry needs a key, a lifetime and a rule for when it is refreshed or removed.

Proposed:

> A cache keeps a copy of data that is expensive to fetch or compute so later requests are served faster. Caches can sit in the browser, at a CDN, in the application, or next to the database. Each entry needs a key, a lifetime and a rule for when it is refreshed or removed. When a popular entry expires, many requests can miss at once and hit the source together, a cache stampede, so let one request refill it while others wait or get the stale value, and add jitter to lifetimes.

**red_flags** (Gemini, Opus). Accept.

Both agents rated memory limits critical: an unbounded in-process cache exhausts the host, and Redis with the noeviction policy fails writes once a limit is reached. Opus: no expiry is too absolute (immutable data needs none), and negative caching was missing.

Add or change to:

- Cached data that changes but has neither an expiry nor a reliable invalidation
- A cache with no size or memory limit, or no eviction policy chosen
- Lookups for missing records never cached, so repeated requests for absent keys reach the database

Replace or remove:

- Cached data with no expiry

**good_looks_like** (Gemini, Opus). Accept.

Without short timeouts a slow cache stalls every request, and an empty cache after a restart can send full load to the database.

Add or change to:

- Every cache has a size or memory limit and an eviction policy chosen for its access pattern
- Cache calls have short timeouts and the system works acceptably, though slower, when the cache is empty or down
- Stampede protection, for example single-flight refill or jittered lifetimes

Replace or remove:

- The system works acceptably, though slower, when the cache is empty or down

**decide_between** (Opus). Accept.

Omitted the most consequential choice, in-process versus shared, and write-behind's data loss risk.

Now:

> Cache-aside, read-through or write-through. Cache-aside is the simplest and most common. Read-through and write-through keep application code simpler but depend on the caching layer’s features.

Proposed:

> In-process or shared cache. In-process is fastest but each instance holds its own copy and invalidation must reach all of them. A shared cache such as Redis keeps one copy but adds a network hop and a dependency. Then choose cache-aside, read-through, write-through or write-behind. Write-behind is fastest for writes but can lose data if the cache fails before flushing.

**search_hints** (Gemini, Opus). Accept.

cache, ttl, expire and lru match almost every codebase.

Add: `go-redis`, `StackExchange.Redis`, `aws_elasticache`, `IDistributedCache`, `IMemoryCache`, `Caffeine.newBuilder`, `maximumSize`, `lru_cache`, `cachetools`, `singleflight`, `maxmemory`, `maxmemory-policy`

Remove: `cache`, `Cache-Control`, `ttl`, `expire`, `lru`, `caffeine`, `getOrSet`, `ETag`

**agent check level** (Gemini, Opus). Accept.

Hit rate, evictions and behavior when the cache is down need runtime evidence.

Change from `code` to `partial`.

**evidence_to_request** (Gemini, Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Cache hit rate and eviction metrics
- What happens to database load when the cache restarts

**related** (Opus). Accept.

Edge caching carries the same key-leak risk, and timeouts handle a failed cache. I dropped 92 to stay within four.

Add: `49`, `11`

Remove: `92`

### 3. Load balancing

**how_it_works** (Opus). Accept.

Connection draining was missing, so deployments and scale-in cut off in-flight requests.

Now:

> A load balancer spreads incoming requests across several instances and stops sending traffic to unhealthy ones. It works at layer 4 (connections) or layer 7 (HTTP requests, which allows routing by path or header). The algorithm, such as round robin or least connections, and the health checks decide how evenly and safely traffic is spread.

Proposed:

> A load balancer spreads incoming requests across several instances and stops sending traffic to unhealthy ones. It works at layer 4 (connections) or layer 7 (HTTP requests, which allows routing by path or header). The algorithm, such as round robin or least connections, and the health checks decide how evenly and safely traffic is spread. Before an instance is removed for a deployment or scale-in, the balancer should stop sending new requests and let in-flight ones finish, which is called connection draining.

**red_flags** (Gemini, Opus). Accept.

Both agents: aligned timeouts is misleading. The backend keep-alive timeout must be longer than the balancer's idle timeout, or the backend closes reused connections and the balancer returns intermittent 502s. Opus rated it critical.

Add or change to:

- Backend keep-alive timeout shorter than the balancer’s idle timeout, causing intermittent 502 errors

Replace or remove:

- Balancer idle timeouts that differ from the application’s, so requests are cut off

**good_looks_like** (Gemini, Opus). Accept.

Opus: a deep health check that depends on a shared database fails on every instance at once, and the balancer removes the whole fleet. Both agents: draining and keep-alive.

Add or change to:

- Health checks that test the instance itself, not shared dependencies, and remove unhealthy targets quickly
- Connection draining enabled so in-flight requests finish before an instance is removed
- Backend keep-alive timeout longer than the balancer’s idle timeout, with request timeouts consistent across layers

Replace or remove:

- Health checks that remove unhealthy targets quickly
- Balancer timeouts aligned with application timeouts

**decide_between** (Opus). Accept.

The old text overstated layer 7 cost and missed the main functional case.

Now:

> Layer 4 or layer 7. Layer 4 is faster and simpler. Layer 7 gives routing, header handling and per-request metrics at higher cost and latency.

Proposed:

> Layer 4 or layer 7. Layer 4 is simpler and passes any protocol through. Layer 7 gives routing, header handling and per-request metrics, and is needed to spread HTTP/2 and gRPC requests, which layer 4 pins to one backend per connection.

**review_question** (Gemini). Accept.

The old question asked two things.

Now:

> Which layer balances traffic, and how are unhealthy instances removed?

Proposed:

> How does the load balancer detect unhealthy targets and drain in-flight connections during removal?

**search_hints** (Opus). Accept.

nginx, upstream, ingress and sticky are generic. Adds other clouds and the settings this concern cares about.

Add: `aws_lb_target_group`, `health_check`, `deregistration_delay`, `idle_timeout`, `google_compute_backend_service`, `azurerm_lb`, `azurerm_application_gateway`, `type: LoadBalancer`, `sessionAffinity`, `stickiness`, `keepAliveTimeout`, `connection_draining`, `least_conn`

Remove: `aws_alb`, `load_balancer`, `LoadBalancer`, `upstream`, `nginx`, `ingress`, `target_group`, `backend_service`, `sticky`, `session affinity`

### 4. Reverse proxies

**definition** (Opus). Accept.

Overlaps heavily with 3 and 5, and the text never said how they differ.

Now:

> A server in front of backends handling routing, TLS and caching (Nginx, HAProxy).

Proposed:

> A server in front of backends handling routing, TLS and caching (Nginx, HAProxy). See 3 for balancing and 5 for API policy.

**how_it_works** (Opus). Accept.

Opus rated this critical: header trust was only a red flag and never explained. Spoofed addresses bypass rate limits and allowlists, and a spoofed protocol header breaks secure-cookie and redirect logic.

Now:

> A reverse proxy sits in front of backend services and receives client requests on their behalf. It can terminate TLS, route by host or path, cache responses, compress, add headers and hide internal topology. Common examples are Nginx, HAProxy, Envoy and cloud ingress controllers.

Proposed:

> A reverse proxy sits in front of backend services and receives client requests on their behalf. It can terminate TLS, route by host or path, cache responses, compress, add headers and hide internal topology. The application then sees the proxy as the client, so it must trust forwarded headers only from known proxy addresses and take the client IP from the rightmost entry added by a trusted proxy. If the proxy terminates TLS, decide whether traffic to the backends is re-encrypted.

**red_flags** (Gemini, Opus). Accept.

Both agents: HTTP request smuggling was missing. Opus: defaults are not always unsafe (nginx's 1 MB body limit often breaks uploads), so the flag is unreviewed limits.

Add or change to:

- Body size and timeout limits left at defaults without a decision, or set very large
- Proxy and backend that parse requests differently, such as ambiguous Content-Length and Transfer-Encoding not rejected, allowing request smuggling

Replace or remove:

- Default or very large body size and timeout limits

**good_looks_like** (Gemini). Accept.

Gemini rated this critical: overwriting headers at the proxy is not enough if backends accept direct requests with spoofed forwarded headers.

Add or change to:

- Backends accept traffic only from the proxy, for example by source range or mutual TLS

**review_question** (Opus). Accept.

The old question asked two unrelated things and omitted header trust, the highest-risk item.

Now:

> What does the proxy terminate or cache, and is it a single point of failure?

Proposed:

> Which proxy settings, such as forwarded-header trust, timeouts and body limits, are set deliberately and kept in version control?

**search_hints** (Opus). Accept.

envoy, upstream and Ingress are generic. Adds the application-side trust settings, where spoofing is actually prevented.

Add: `set_real_ip_from`, `real_ip_header`, `trust proxy`, `ForwardedHeaders`, `KnownProxies`, `SECURE_PROXY_SSL_HEADER`, `ProxyFix`, `forward-headers-strategy`, `proxy_buffering`, `Caddyfile`

Remove: `nginx.conf`, `envoy`, `upstream`, `X-Forwarded-Proto`, `Ingress`

**agent check level** (Gemini). Accept.

The proxy is often managed in cloud consoles or separate platform repositories.

Change from `code` to `partial`.

**evidence_to_request** (Gemini). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Where the proxy configuration is managed, if outside this repository
- The forwarded-header trust settings of the application

**related** (Opus). Accept.

Rate limiting depends on header trust. I dropped 22, 24 and 73 to stay within four.

Add: `1`

### 5. API gateways

**how_it_works** (Opus). Accept.

Managed gateways cut off long requests and add surprise bills at high volume. AWS API Gateway, for example, has a default 29 second integration timeout and a 10 MB payload limit.

Now:

> An API gateway is a single entry point for client requests to many services. It handles cross-cutting work such as authentication, routing, rate limiting, request transformation, logging and sometimes caching, so each service doesn’t need its own copy.

Proposed:

> An API gateway is a single entry point for client requests to many services. It handles cross-cutting work such as authentication, routing, rate limiting, request transformation, logging and sometimes caching, so each service doesn’t need its own copy. Managed gateways impose their own timeouts, payload limits and per-request charges, so check them against your slowest and largest requests and your expected volume.

**red_flags** (Opus). Accept.

Opus: a single-region gateway is correct for a single-region service, so the flag now compares it with the services behind it.

Add or change to:

- Services that trust identity headers from the gateway without verifying them
- Gateway running as a single instance, or in fewer regions than the services behind it

Replace or remove:

- Gateway running as a single instance or in a single region

**good_looks_like** (Gemini, Opus). Accept.

Opus rated this critical: authentication at the gateway alone encourages services to trust forged identity headers and skip authorization. Gemini: slow external authorizers cause latency spikes across every API.

Add or change to:

- Services accept traffic only from the gateway, verify the identity token or signed headers it forwards, and still enforce authorization on each resource
- Gateway authorizers and plugins have strict timeouts and token caching

**search_hints** (Gemini, Opus). Accept.

routes:, plugins: and authorizer match almost any YAML. Ambassador is now Emissary-ingress.

Add: `aws_api_gateway`, `aws_apigatewayv2`, `azurerm_api_management`, `x-google-backend`, `KongPlugin`, `emissary`, `HTTPRoute`, `spring-cloud-gateway`, `YARP`, `ocelot`, `tyk`

Remove: `api gateway`, `apigateway`, `ambassador`, `routes:`, `plugins:`, `authorizer`

### 22. WebSockets

**how_it_works** (Opus). Accept.

A deploy or failover drops every connection, and clients reconnect at once unless there is jitter, which overloads the new instances.

Now:

> A WebSocket is a long-lived two-way connection between client and server, opened with an HTTP upgrade request. It lets the server push data at any time with low latency, which suits chat, live dashboards and collaboration. Each open connection holds server resources, so capacity is planned by connection count, not request rate.

Proposed:

> A WebSocket is a long-lived two-way connection between client and server, opened with an HTTP upgrade request. It lets the server push data at any time with low latency, which suits chat, live dashboards and collaboration. Each open connection holds server resources, so capacity is planned by connection count, not request rate. Deployments and failures drop connections in bulk, so clients reconnect with backoff and jitter and servers close connections gradually.

**red_flags** (Gemini, Opus). Accept.

Both agents rated origin checking critical: browsers send cookies on WebSocket upgrades without CORS, so cookie-authenticated endpoints that skip the check allow cross-site WebSocket hijacking. Opus adds tokens in URLs, which leak into logs, and unbounded queues for slow clients.

Add or change to:

- No reconnection with backoff and jitter in the client
- Origin header not checked on the upgrade request for cookie-authenticated connections, or tokens passed in the connection URL
- No bound on outgoing messages queued for a slow client

Replace or remove:

- No reconnection and backoff logic in the client

**good_looks_like** (Gemini, Opus). Accept.

Resuming without losing messages needs a replay buffer, and reconnect without jitter causes a thundering herd.

Add or change to:

- Authentication checked when the connection opens and when the token expires, with a short-lived ticket instead of a token in the URL
- Client reconnects with backoff and jitter, and resumes from its last sequence number where the server keeps a replay buffer
- Heartbeats run more often than the shortest idle timeout on any proxy or balancer

Replace or remove:

- Authentication checked when the connection opens and when the token expires
- Client reconnects with backoff and resumes without losing messages

**search_hints** (Opus). Accept.

ping, heartbeat and onopen are generic.

Add: `WebSocketServer`, `@WebSocketGateway`, `WebSocketHandler`, `SimpMessagingTemplate`, `AsyncWebsocketConsumer`, `MapHub`, `proxy_set_header Upgrade`, `maxPayload`, `checkOrigin`, `SignalR`

Remove: `WebSocket`, `ws://`, `onopen`, `heartbeat`, `ping`

**agent check level** (Opus). Accept.

Monitoring and connection limits need runtime evidence.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- Load balancer and proxy idle timeouts for the WebSocket path
- Peak connection counts and the limits set

### 24. Server-sent events

**how_it_works** (Gemini, Opus). Accept.

Both agents: the six-connection limit over HTTP/1.1. Opus: no custom headers and resuming needs replay.

Now:

> Server-sent events keep one HTTP response open so the server can stream events to a browser. The format is plain text, reconnection is built into the browser, and a last event identifier lets a client resume after a drop. Data flows in one direction only, from server to client.

Proposed:

> Server-sent events keep one HTTP response open so the server can stream events to a browser. The format is plain text, reconnection is built into the browser, and a last event identifier lets a client resume after a drop, if the server keeps recent events to replay. The browser EventSource API cannot set custom headers, so authentication uses cookies or a short-lived token, and over HTTP/1.1 browsers allow only about six connections per site across all tabs. Data flows from server to client only.

**undefined** (Opus). Accept.

"Proxy-friendly" contradicted why_it_matters and the red flags, which say proxies buffer and break it.

Now:

> Simpler than WebSockets and proxy-friendly, but one-directional with browser connection limits.

Proposed:

> Simpler than WebSockets and runs over plain HTTP, but one-directional, limited per browser over HTTP/1.1, and broken by proxies or compression that buffer the response.

**red_flags** (Opus). Accept.

Compression delays events, and token expiry on long-lived streams was not covered.

Add or change to:

- Proxy, CDN or compression buffering enabled for the stream
- Streams kept open after the user’s session or token has expired

Replace or remove:

- Proxy or CDN buffering enabled for the stream

**good_looks_like** (Gemini). Accept.

HTTP/2 lifts the per-site connection limit.

Add or change to:

- Served over HTTP/2 or HTTP/3 to avoid the HTTP/1.1 six-connection browser limit

**search_hints** (Opus). Accept.

sse as a substring matches processes, addresses and classes, so it floods results.

Add: `ServerSentEvent`, `EventSourceResponse`, `sse-starlette`, `sse_starlette`, `proxy_buffering off`

Remove: `sse`

**related** (Opus). Accept.

Buffering and idle timeouts live in 4 and 3.

Add: `4`, `3`

### 48. CDN

**definition** (Opus). Accept.

The definition said static content, but how_it_works covers dynamic responses. The concern also needs an Applies when line (below).

Now:

> Globally distributed servers delivering static content near users.

Proposed:

> Globally distributed servers that deliver content close to users and shield the origin.

**how_it_works** (Gemini, Opus). Accept.

Both agents: origin shielding. Opus: a purge-all can overload the origin.

Now:

> A content delivery network serves content from servers close to users. It caches static files and can cache some dynamic responses, absorb traffic spikes and terminate TLS at the edge. Cache behavior is controlled by response headers and CDN rules.

Proposed:

> A content delivery network serves content from servers close to users. It caches static files and can cache some dynamic responses, absorb traffic spikes and terminate TLS at the edge. Cache behavior is controlled by response headers and CDN rules. Purges are not instant, and a purge of everything sends a burst of requests to the origin, so purge by key or path and use an origin shield tier where the CDN offers one.

**red_flags** (Opus). Accept.

Opus rated this critical: a CDN rule can override origin headers (cache everything), responses with Set-Cookie can be cached, and web cache deception makes a private page cacheable through a path ending such as /account/x.css.

Add or change to:

- CDN rules that override origin Cache-Control for dynamic paths, or caching decided by file extension alone
- Responses that set cookies or carry private data that the CDN is allowed to cache

Replace or remove:

- Private or personalized responses that the CDN is allowed to cache

**good_looks_like** (Opus). Accept.

A plain IP allowlist alone can be weak on shared CDN ranges, and unexpected egress costs were not covered.

Add or change to:

- Authenticated responses send Cache-Control private or no-store, and the CDN is set to respect it
- Origin accepts traffic only from the CDN, using origin access control, a secret header or mutual TLS
- Cache hit ratio and egress volume are monitored

Replace or remove:

- Private data marked uncacheable at the edge
- Origin locked to accept traffic only from the CDN

**search_hints** (Gemini, Opus). Accept.

cdn and origin are generic: origin matches git remotes and CORS code.

Add: `aws_cloudfront_distribution`, `cache_policy_id`, `origin_access_control`, `cloudflare_ruleset`, `azurerm_cdn_frontdoor_profile`, `google_compute_backend_bucket`, `enable_cdn`, `fastly_service_vcl`, `akamai_property`, `immutable`

Remove: `cloudflare`, `akamai`, `azure front door`, `cdn`, `origin`

**related** (Opus). Accept.

48 and 49 overlap on headers, privacy and purge. 48 now keeps whether a CDN is used, origin protection and purge, and 49 keeps cache key and lifetime rules. I dropped 74 and 71 to stay within four.

Add: `75`

### 49. Edge caching

**definition** (Opus). Accept.

The old definition was circular and did not separate edge caching from the CDN concern.

Now:

> Caching at locations close to users.

Proposed:

> Rules for which responses are cached at the edge, for how long and under which key.

**how_it_works** (Opus). Accept.

The old text listed cookies as part of the key, which invites caching personalized responses at a shared edge. Web cache poisoning was missing.

Now:

> Edge caching stores responses at locations near users, often at the CDN or in an edge runtime. It can cache static files, API responses and rendered pages for a short time. The cache key, which includes parts such as path, query string, headers and cookies, decides what is shared between users.

Proposed:

> Edge caching stores responses at locations near users, often at the CDN or in an edge runtime. It can cache static files, API responses and rendered pages for a short time. The cache key, which includes parts such as path, query string and some headers, decides what is shared between users. Any request header or parameter that changes the response must be in the key, or an attacker can poison the cache.

**red_flags** (Gemini, Opus). Accept.

Both agents rated this critical: adding cookies or Authorization to the cache key still stores private responses at a shared edge and contradicts good_looks_like. Opus: error responses cached briefly are fine, and stale-if-error is good practice.

Add or change to:

- Personalized or authenticated responses cacheable at the shared edge instead of being marked private or no-store
- Request headers or parameters that change the response but are not in the cache key, allowing cache poisoning
- Error responses cached for long periods, or temporary server errors cached as if final

Replace or remove:

- Cookies or authorization headers left out of the cache key for personalized responses
- Error responses cached at the edge

**good_looks_like** (Opus). Accept.

Follows the red flag changes.

Add or change to:

- Personal parts are split from shared content rather than keyed by cookie or token
- Short lifetimes or tag-based purge for content that changes, and stale-if-error to serve the last good copy

Replace or remove:

- Short lifetimes or tag-based purge for content that changes

**where_it_appears** (Opus). Accept.

Targeted cache-control headers let edge lifetimes differ from browser lifetimes.

Now:

> CDN cache rules and cache key settings, edge function code, and response headers such as Cache-Control, Vary and Surrogate-Key.

Proposed:

> CDN cache rules and cache key settings, edge function code, and response headers such as Cache-Control, CDN-Cache-Control, Surrogate-Control, Vary and Surrogate-Key.

**search_hints** (Gemini, Opus). Accept.

edge matches graph code and browser names, and workers matches thread pools and queue workers.

Add: `stale-if-error`, `CDN-Cache-Control`, `Surrogate-Control`, `caches.default`, `cacheTtl`, `cache_key`, `CacheKeyPolicy`, `vcl_hash`, `export const revalidate`, `export const runtime`

Remove: `edge`, `cache key`, `Vary`, `workers`, `edge function`

### 50. Cache invalidation

**definition** (Gemini). Accept.

"Notoriously hard" is informal commentary.

Now:

> Removing or refreshing stale cache entries; notoriously hard.

Proposed:

> Removing or refreshing stale cache entries when source data changes.

**how_it_works** (Gemini, Opus). Accept.

Both agents: the write-invalidate race. A reader fetches the old value, a writer updates the database and deletes the key, and the reader then stores the old value, which stays forever with no lifetime. Opus rated it critical.

Now:

> Invalidation removes or refreshes cached data when the source changes. Approaches include expiry (time to live), explicit deletion when data is written, versioned keys and event-driven purge. The cost is a trade between staleness, complexity and load on the source.

Proposed:

> Invalidation removes or refreshes cached data when the source changes. Approaches include expiry (time to live), explicit deletion when data is written, versioned keys and event-driven purge. Invalidate after the write commits and keep a lifetime on every entry as a backstop, because a concurrent read can put an old value back after an invalidation, and do not refill the cache from a replica that may lag. The cost is a trade between staleness, complexity and load on the source.

**decide_between** (Opus). Accept.

The safe norm combines the two.

Now:

> Time-based expiry or explicit invalidation. Expiry is simple and tolerates staleness. Explicit invalidation is fresher but needs every write path to be covered.

Proposed:

> Expiry alone, or explicit invalidation with expiry as a backstop. Expiry alone is simple and fits data that can be stale for its lifetime. Explicit invalidation gives fresher data but must cover every write path, so keep a lifetime to bound the damage from a missed one.

**undefined** (Opus). Accept.

"Short TTLs lose the benefit" was overstated.

Now:

> Short TTLs are simple but lose the benefit; event-driven invalidation is precise but harder to get right.

Proposed:

> Short lifetimes are simple and still help hot data, but lower hit rates for the rest. Event-driven invalidation is precise but harder to get right.

**red_flags** (Opus). Accept.

Opus also asked that the agent not judge a lifetime as long, so the flag no longer says long.

Add or change to:

- Every cache entry using the same lifetime with no reasoning behind it
- Explicit invalidation with no lifetime as a backstop

Replace or remove:

- Every cache entry using the same long TTL

**good_looks_like** (Gemini, Opus). Accept.

Both agents: updating the cache on write is race-prone, since concurrent writers can store values out of order, and deletion is the safer default.

Add or change to:

- Writes delete the matching entries after commit, rather than writing new values into the cache
- Versioned keys or reliable events, such as an outbox or change data capture, where several services write the data
- Every entry has a safety lifetime even when explicit invalidation is used

Replace or remove:

- Writes invalidate or update the matching entries
- Versioned keys or events used where several services write the data

**search_hints** (Gemini, Opus). Accept.

bust, expire, ttl and evict are generic.

Add: `@CacheEvict`, `@CachePut`, `cache.delete`, `unlink`, `revalidateTag`, `revalidatePath`, `invalidateQueries`, `createInvalidation`, `purge_cache`, `Surrogate-Key`, `stale-while-revalidate`, `cache_key_version`

Remove: `invalidate`, `evict`, `purge`, `expire`, `ttl`, `revalidate`, `bust`

**agent check level** (Opus). Accept.

A stated freshness rule, an owner and an operational purge path are team process.

Change from `code` to `partial`.

**evidence_to_request** (Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- The freshness rule and owner for each main cache
- The operational procedure to purge a bad entry

**related** (Opus). Accept.

Race conditions (39) is the cause of the write-invalidate race. I dropped 29 and 16 to stay within four.

Add: `39`

### 91. Latency

**how_it_works** (Gemini, Opus). Accept.

Both agents: coordinated omission. Closed-loop load generators wait for slow responses before sending more, so they understate latency under load.

Now:

> Latency is the time a request takes from start to finish, measured at the user and at each hop. It is reported as percentiles, not averages. Targets come from the user journey: how fast a page, search or payment must feel, and how much of that budget each component may use.

Proposed:

> Latency is the time a request takes from start to finish, measured at the user and at each hop. It is reported as percentiles, not averages. Targets come from the user journey: how fast a page, search or payment must feel, and how much of that budget each component may use. Latency rises steeply as a component nears full utilization, because requests queue, and load tests must send requests at a fixed rate rather than wait for each response, or they hide the slowest results.

**red_flags** (Opus). Accept.

Fast errors lower the measured latency and hide slow successes.

Add or change to:

- Latency of failed and successful requests measured together, so fast errors hide slow successes

**good_looks_like** (Gemini). Accept.

Averaging percentile values across instances is mathematically invalid and masks node-level spikes.

Add or change to:

- Percentiles (P50, P95, P99) tracked using histograms or sketches, never averaged across nodes
- Real user monitoring captures client-side network and rendering delays
- Load tests that show latency at expected peak, sending requests at a fixed rate

Replace or remove:

- Percentiles (P50, P95, P99) tracked on dashboards
- Load tests that show latency at expected peak

**related** (Opus). Accept.

91 now keeps targets and budgets per journey, 93 keeps how percentiles are measured and aggregated, and 94 keeps causes and mitigation of slow outliers.

Add: `92`, `63`

Remove: `2`

### 92. Throughput

**how_it_works** (Gemini, Opus). Accept.

Opus: Little's Law is the basic sizing tool, and batching can also cut latency under load. Gemini: queueing delay grows steeply near saturation, well before maximum throughput.

Now:

> Throughput is how much work the system completes per unit of time, such as requests per second or messages per minute. Capacity planning compares expected peak throughput with what the system sustains, leaving headroom. Throughput and latency trade off: batching raises throughput and increases latency.

Proposed:

> Throughput is how much work the system completes per unit of time, such as requests per second or messages per minute. Capacity planning compares expected peak throughput with what the system sustains, leaving headroom below the point where latency climbs steeply. Throughput, latency and concurrency are linked: work in progress equals throughput times latency, which helps size pools and queues. Batching usually raises throughput and can add latency for individual items.

**red_flags** (Opus). Accept.

Load tests against live payment, email or SMS providers cause real charges, rate limiting and messages to customers.

Add or change to:

- Load tests that call real third-party services or shared production systems

**good_looks_like** (Opus). Accept.

Maximum throughput at any latency is meaningless. The useful number is the highest rate sustained while latency targets hold.

Add or change to:

- Load tests find the highest rate the system sustains while meeting its latency targets, and the point where it degrades

Replace or remove:

- Load tests find the point where the system degrades

**undefined** (Gemini). Accept.

The old trade-off repeated how_it_works.

Now:

> Throughput often trades against latency; batching raises one while hurting the other.

Proposed:

> Maximizing throughput through batching and high concurrency increases queuing and tail latency, and reserving headroom increases infrastructure cost.

**related** (Opus). Accept.

Connection pooling is a common throughput limit. The new capacity planning concern will be linked once it has an id.

Add: `28`

### 93. P99 latency

**definition** (Opus). Accept.

"Beat" was imprecise.

Now:

> The latency 99% of requests beat; shows near-worst-case experience.

Proposed:

> The time within which 99 percent of requests complete, showing near worst-case experience.

**how_it_works** (Gemini, Opus). Accept.

Opus: sample size. Gemini: aggregation. Opus also wanted the fan-out example here, and Gemini said fan-out belongs to 94, so I moved the example to 94.

Now:

> P99 latency is the time under which 99% of requests complete, so the slowest 1% take longer. It shows what unlucky users experience. When one page makes many backend calls, the chance of hitting a slow one is much higher than 1%.

Proposed:

> P99 latency is the time under which 99% of requests complete, so the slowest 1% take longer. It shows what unlucky users experience. Percentiles cannot be averaged across instances, so they are computed from histograms or sketches. A P99 needs enough requests to mean anything, so use longer windows for low-traffic paths.

**good_looks_like** (Opus). Accept.

Alerting on a P99 value is noisy, and bucket edges need to sit near the target.

Add or change to:

- P99 target stated for key journeys, expressed in SLOs as the share of requests faster than a threshold
- Percentiles computed from histograms or sketches, not averaged, with buckets placed around the target

Replace or remove:

- P99 target stated for key journeys
- Percentiles computed from histograms or raw data, not averaged

**review_question** (Gemini, Opus). Accept.

"Alongside the average" contradicted the concern, and the old question asked two things.

Now:

> Is there a P99 target alongside the average, and who tracks it?

Proposed:

> What is the P99 target for each key journey, and how is it measured across instances?

### 94. Tail latency

**how_it_works** (Opus). Accept.

Opus: the most common causes were missing, and hedging duplicates side effects on non-idempotent calls.

Now:

> Tail latency is the behavior of the slowest requests in the distribution. It grows when requests fan out to many services, because the response waits for the slowest. Causes include garbage collection pauses, noisy neighbors, cold caches and retries. Mitigations include timeouts, hedged requests and reducing fan-out.

Proposed:

> Tail latency is the behavior of the slowest requests in the distribution. It grows when requests fan out to many services, because the response waits for the slowest: with 100 backend calls per page, about 63 percent of pages include a call slower than the backend’s P99. Causes include queueing near saturation, pool or lock waits, garbage collection pauses, background jobs, noisy neighbors and cold caches. Mitigations include timeouts, reducing fan-out and hedged requests for idempotent reads only.

**good_looks_like** (Gemini, Opus). Accept.

Both agents: hedging without a delay threshold doubles backend load, and Gemini rated it critical because under degraded conditions it can turn a slowdown into a cascading failure.

Add or change to:

- Hedged requests only for idempotent reads, after a delay such as the P95, with cancellation when the first reply arrives and a quota on extra load
- Tail latency tracked in production across percentiles up to P99.9

Replace or remove:

- Hedging or retries used with limits and a measured effect
- Tail latency tracked in production

**related** (Opus). Accept.

Retries (12) and idempotency (14) are what hedging depends on. I dropped 14 and 42 to stay within four.

Add: `12`

### 101. Webhooks

**how_it_works** (Opus). Accept.

Signature details that commonly go wrong: verify the raw body before parsing, compare in constant time, reject stale timestamps to stop replay, and support two secrets during rotation.

Now:

> A webhook is an HTTP callback one system sends to another when an event happens. As a receiver you expose an endpoint, verify the sender (usually with a signature), respond quickly and process the work asynchronously. As a sender you must sign requests and retry failed deliveries.

Proposed:

> A webhook is an HTTP callback one system sends to another when an event happens. As a receiver you expose an endpoint, verify the signature over the raw request body with a constant-time comparison, reject stale timestamps, respond quickly and process the work asynchronously. Accept both old and new secrets during rotation. As a sender you must sign requests, retry failed deliveries, set a request timeout and never send to internal addresses.

**red_flags** (Gemini, Opus). Accept.

Both agents rated this critical: SSRF. When users register webhook URLs, the sender can be pointed at internal services or cloud metadata endpoints through redirects and DNS rebinding as well as direct addresses.

Add or change to:

- Outbound webhooks to user-supplied URLs without blocking private, loopback and metadata addresses, including after redirects
- Outbound deliveries with no request timeout or retry limit, or failing endpoints never disabled
- Outbound webhooks with no delivery log

Replace or remove:

- Outbound webhooks with no retry limit or no delivery log

**good_looks_like** (Gemini, Opus). Accept.

Both agents: constant-time comparison. Opus: deduplication does not stop an older event overwriting newer state, and a check-then-insert dedupe races under concurrent retries.

Add or change to:

- Every incoming webhook verified by signature using a constant-time comparison and checked for replay
- Event ids deduplicated with a unique constraint, and handlers that do not rely on delivery order
- Outbound delivery goes through an egress path that blocks internal addresses

Replace or remove:

- Every incoming webhook verified by signature and checked for replay
- Event ids deduplicated so repeats are harmless

**search_hints** (Opus). Accept.

signature, delivery, hmac and event_id are generic. X-Hub-Signature is GitHub's legacy SHA-1 header.

Add: `X-Hub-Signature-256`, `X-Slack-Signature`, `X-Shopify-Hmac-Sha256`, `webhook-signature`, `svix`, `compare_digest`, `hmac.Equal`, `MessageDigest.isEqual`, `express.raw`, `rawBody`

Remove: `X-Hub-Signature`, `hmac`, `signature`, `event_id`, `delivery`

**related** (Opus). Accept.

Adds SSRF (80) and timeouts (11). I dropped 12 to stay within four.

Add: `80`, `11`

Remove: `12`

### 102. API versioning

**how_it_works** (Opus). Accept.

"Adding optional fields needs no new version" holds only if clients are tolerant readers. Strict deserializers and generated clients can fail on new response fields.

Now:

> API versioning lets you change an API without breaking existing clients. Versions are exposed in the URL path, a header or a media type. Compatible changes, such as adding optional fields, need no new version. Breaking changes ship as a new version while the old one is supported for a defined period.

Proposed:

> API versioning lets you change an API without breaking existing clients. Versions are exposed in the URL path, a query parameter, a header, a media type or a date. Compatible changes, such as adding optional request fields or new response fields, need no new version if clients are documented to ignore unknown fields. New enum values and changed defaults often break clients. Breaking changes ship as a new version while the old one is supported for a defined period.

**decide_between** (Opus). Accept.

Omitted query parameter and date-based versioning, and that header versioning needs Vary.

Now:

> Version in the URL path, in a header or in the media type. Path versions are the easiest to see and cache. Header or media type versions keep URLs stable but are harder to use and test.

Proposed:

> Version in the URL path, a query parameter, a header or the media type, or by date. Path versions are the easiest to see and cache. Header and media type versions keep URLs stable but need a Vary header for caches and are harder to test. GraphQL and gRPC usually evolve one schema with additive rules instead.

**good_looks_like** (Gemini, Opus). Accept.

Both agents: name the standards. Deprecation is RFC 9745 and Sunset is RFC 8594.

Add or change to:

- Deprecation signalled with the Deprecation and Sunset headers and in notices, and tracked by client usage

Replace or remove:

- Deprecation signalled with headers and notices, and tracked by client usage

**search_hints** (Opus). Accept.

/v1/ matches every call to third-party APIs, and Deprecation matches DeprecationWarning.

Add: `@ApiVersion`, `Asp.Versioning`, `URLPathVersioning`, `AcceptHeaderVersioning`, `application/vnd.`, `oasdiff`, `openapi-diff`, `buf breaking`, `Sunset:`, `Deprecation:`

Remove: `/v1/`, `/v2/`, `Accept: application/vnd`, `swagger`, `Deprecation`, `Sunset`, `apiVersion`

**agent check level** (Gemini, Opus). Accept.

Support periods, usage tracking and the deprecation process are team policy and runtime data.

Change from `code` to `partial`.

**evidence_to_request** (Gemini, Opus). Accept.

Evidence for the parts the repository cannot show.

Add or change to:

- The published deprecation policy and support periods
- Usage per API version and per client

---

## 5. Sources

- **Confirmed by me this round:** AWS's own troubleshooting guidance that the backend keep-alive timeout must be greater than the load balancer's idle timeout, with a 60 second default on an ALB (3); and the Redis documentation that the memory limit defaults to unlimited on 64-bit systems and that the noeviction policy returns an error instead of storing new data once the limit is reached (2). The RFC-level claims (forwarded headers, WebSocket origin, HTTP caching, Retry-After, Deprecation and Sunset headers), SSRF, web cache deception and poisoning, the write-invalidate race, coordinated omission and Little's Law match what I know and what both agents independently reported.
- **Cited by an agent and not opened by me:** RFC 7239, RFC 6455, RFC 6585, RFC 9110, RFC 9111, RFC 9112, RFC 9213, RFC 5861, RFC 8594 and RFC 9745; the OWASP API Security Top 10, the SSRF and WebSocket cheat sheets; PortSwigger's research on request smuggling, cache deception and cache poisoning; the AWS load balancer, API Gateway and CloudFront documentation; the nginx and Node.js documentation; the Redis eviction documentation; Nishtala et al. on Facebook's memcache; Dean and Barroso, The Tail at Scale; Gil Tene on coordinated omission; Little's Law; the Google SRE book and workbook; and the Stripe and GitHub webhook documentation. Open any you plan to cite.

## 6. Next

I'll walk through decisions 1 to 5 one at a time.
