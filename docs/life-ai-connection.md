# Life planner AI connection

## What it does

Connect normal AI chat to the signed-in user's own Life planner. Retrieval is on demand: discover collections, search, list summaries, then read complete records in chunks. All stored planner collections, archived content, Ramble conversations/memories, opportunities, applications, extracted document text, original stored file bytes and task/goal history are available through the read grant. Pagination limits each response, not the total accessible content. External Gmail, Google Drive and other remote service data require their own provider connections; saved planner copies are included. Tab is a separate team application and is not part of this personal grant.

Write access permits explicit, version-checked planner changes via existing storage models. This includes tasks, goals, notes, routines, lists, weekly planning, reviews, mind maps, opportunity records and memories. It does not confer email sending, outreach approval, account/security changes, partner approval or permanent deletion. Existing accountability rules remain authoritative.

## Connect ChatGPT

1. In regular ChatGPT web, open Plugins, Add, Add custom MCP server (availability depends on account/workspace settings).
2. Name: **Life planner**. URL: **https://life.ayodsgn.com/api/planner/mcp/**.
3. Authentication: **OAuth**. Use dynamic client registration (no static client secret).
4. Review ChatGPT's warning and create the connection. Sign in to Life in the authorization page.
5. Review the client callback host. Allow read access, and select **Allow planner changes too** if wanted.
6. Install/select the resulting plugin in a normal chat. Try: “Use Life planner to review this week and my current goals. Challenge what is unrealistic.” Then explicitly ask for any desired changes.

The assistant retains its own reasoning and available tools; this service supplies planner context and actions. It does not import all prior ChatGPT conversations into Life, force every chat to load the planner, or remove model context limits.

Claude or another MCP client can use the same endpoint if it supports remote Streamable HTTP, OAuth authorization-code flow, S256 PKCE and dynamic registration. Gemini compatibility must be checked on the particular client surface; a generic HTTP API is also available for future integrations.

## Manage and revoke

Life → Connections → AI assistants → Manage AI connections, or https://life.ayodsgn.com/life/connections/. Each grant is account-bound. Disconnect immediately invalidates its access and refresh tokens. Recent authorization/write activity is shown there; native planner activity and task/goal history also record changes.

No production user data is accessible before consent. Public `initialize`, `ping`, `tools/list` and OAuth metadata disclose capabilities only. Private tool calls require a valid bearer token. Do not embed tokens in URLs, commits or prompts.

## Protocol/API

- `POST /api/planner/mcp/` — stateless JSON-RPC Streamable HTTP. Supports initialize, ping, tools/list, tools/call and initialized notification.
- `POST /api/planner/rest/` — same account-bound tools as JSON `{ "tool": "life_overview", "arguments": {} }`, with Authorization bearer header.
- `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server` — discovery.
- `/api/planner/server.php?action=register|authorize|token|revoke` — OAuth endpoints.
- `connections.*` on the existing session API — consent, list, revocation and account-only request details, with existing CSRF and session validation.

Tools: life_overview, life_search, life_list, life_get, life_file, life_change. Overview returns write operation and field guidance. Fetch current record/module version before changes. `requestId` is a per-grant retry key: reuse for the same intended operation only; after a conflict re-read and ask/reconcile before retrying a fresh change. Task notes edits clear stale rich formatting; unspecified task/map/sprint/review fields are preserved. Native Google sync is enqueued following planner changes.

OAuth: public clients, exact HTTPS redirects, S256 PKCE, resource binding, 5-minute single-use codes, 10-minute pending requests, one-hour access tokens, rotating 30-day refresh tokens if offline_access was granted. Tokens stored hashed; replay revokes the grant after binding checks. Tokens also become invalid if account credentials/identity change. MySQL/SQLite-compatible additive tables. No new model API call or paid service is required.

## Verify

Runtime dependencies: @php-wasm/node and @php-wasm/universal in TAB_PHP_RUNTIME; Playwright in TAB_BROWSER_RUNTIME. Set CHROMIUM_EXECUTABLE_PATH where needed and TAB_TEST_OUTPUT for screenshots.

- `node tests/run-ai-connection.mjs`: syntax + backend/tenant/PKCE/resource/replay/content/preservation tests, plus existing storage/account/history regressions.
- `node tests/ai-connection-browser.mjs`: actual PHP session → discovery → consent → token → MCP read/write → native storage → retry → REST → revoke. Disposable database; desktop/390/320 screenshot checks.

These tests do not establish a connected regular ChatGPT account. That requires the final real-account linking step and an actual tool invocation from that chat surface. Never describe a public endpoint or local test as a completed ChatGPT connection.
