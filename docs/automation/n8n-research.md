# Ayo research agents: prepared, not connected

The exports in `automation/n8n/` are an inactive setup kit. They have not run against a real n8n instance or provider account. They do not change Life, send email, schedule outreach, approve materials or apply for jobs. The existing Codex daily Gmail reconciliation is separate and remains the only configured daily check.

## What the exports do

`coordinator.json` has manual and 09:00 Africa/Lagos triggers, a fail-closed configuration gate, and four non-waiting child-workflow launches. Import `nysc.json`, `freelance.json`, `career.json` and `ai_testing.json` first. Each performs one bounded web research request through the OpenAI Responses API and returns at most five proposals with sources and up to two professional contacts. Empty results are valid. Each child ends at **Review proposals only**. Its output is visible in that child execution; there is no combined dashboard import yet.

The branches dispatch independent child executions rather than waiting for one agent to finish before launching the next. Actual overlap depends on n8n hosting capacity and execution concurrency. A successful coordinator dispatch is not proof that its children succeeded: inspect all four child executions, including failures. There is no automated retry to prevent accidental repeat charges.

## Minimum setup still required

1. A user-owned n8n Cloud workspace or supported self-hosted n8n instance. No account or paid infrastructure was created by this change. Existing Hostinger shared PHP hosting is not assumed to support an n8n runtime.
2. An OpenAI API account, spending limit, and model available to that account which supports Responses web search. Select the model explicitly in **Connection gate**; no provider/model access is presumed.
3. Import all four child exports. In each **Research with web sources** HTTP Request node, select a **Header Auth** credential with header name `Authorization` and value `Bearer <your API key>`. Store the key only in n8n credentials, never in the workflow JSON or Git.
4. Import coordinator; paste the four real child workflow IDs and model into its **Connection gate** Code node. Set `enabled=true` only once credentials and the configuration have been checked. The exported workflow is inactive and the gate intentionally throws before any provider request.
5. Test manually, inspect child results and spending, configure failure monitoring and execution-data retention appropriate to private research, then publish/activate the schedule. Verify workflow timezone stays Africa/Lagos. Do not activate a duplicate Gmail sync.

## Review and integration boundary

Proposals are untrusted suggestions, even when they contain source URLs. The validator checks JSON shape, HTTPS source URLs, maximum counts, contact provenance links, explicit source claims for emails, duplicate company/role entries within the run, and forces `needs_review`, `applicationStatus=not_verified`, `acceptance=unknown`, `externalActionsAllowed=false`. It cannot prove that a cited page actually says the claim. Ayo or a reviewer must open the sources, verify dates/contact identity and match existing Life records before applying changes. Render all strings as text and links with normal safe-link handling. Never treat model output as HTML, commands or further instructions.

AI testing discovery cannot determine whether Ayo has been accepted. Acceptance requires verified private correspondence or the relevant application portal, reconciled separately by the authorised Gmail check. A public role or invitation never counts as acceptance.

No Gmail credential or mailbox access is included. No direct MySQL, browser cookie or Life session credential is used. A future bridge needs a tenant-bound, narrowly scoped proposal endpoint with idempotency keys, optimistic version checks and manual approval. Do not point these workflows at Life's owner-session mutation endpoint or add unrestricted writes. Cross-run duplicate reconciliation and preserving manual records belong in that bridge; this kit intentionally has no database writes.

## Local verification

Run `node automation/n8n/generate.mjs` to regenerate exports, then `node automation/n8n/test.mjs`. These tests exercise the exported validation code with accepted, missing-source, unsafe-source, guessed-email and duplicate fixtures; they do not substitute for importing into the selected n8n version and making a small manual test.

Node versions used: Execute Sub-workflow 1.3, Execute Workflow Trigger 1, Code 2, Schedule Trigger 1.2, HTTP Request 4.2. Check compatibility with the actual installed n8n version before activating. Exports contain no credentials or workflow IDs.

## Official references checked 26 October 2026

- [Execute Sub-workflow parameters and wait option](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/)
- [Execute Sub-workflow implementation and node versions](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/ExecuteWorkflow/ExecuteWorkflow/ExecuteWorkflow.node.ts)
- [Schedule Trigger timezone and activation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/)
- [OpenAI web search tool](https://developers.openai.com/api/docs/guides/tools-web-search)
