# Scoped n8n research bridge

The five exports in `automation/n8n/` implement polling from n8n to Life. They are inactive until the user finishes connection setup. Localhost n8n need not be publicly reachable: it claims jobs from Life over HTTPS and returns proposals. Life never calls localhost.

## User setup

1. Complete the local owner setup at http://localhost:5678 (see `local-n8n.md`). No owner password was created by the assistant.
2. In Life's signed-in research connection controls, explicitly approve creating a research-only connection token. It is returned once; store it in an n8n Header Auth credential: name `Authorization`, value `Bearer <token>`. Do not paste it into chat, a URL, source files or workflow node parameters. The token expires after 90 days, and creating a replacement revokes the previous token.
3. Create a second Header Auth credential for your own existing billing-disabled Gemini project: header `x-goog-api-key`, value the project key. This is a user-controlled credential transfer; the assistant must not extract Life's server key or change billing. No OpenAI account is needed. Confirm the selected model and Google Search allowance are available in that project.
4. Import `nysc.json`, `freelance.json`, `career.json`, `ai_testing.json`. In every **Agent brief**, set the available Gemini model. Select Gemini Header Auth on **Grounded Gemini research** and the research bridge Header Auth on **Submit proposal only**.
5. Import `coordinator.json`. Select the bridge credential on **Claim public research jobs**. Put the four real child IDs into **Connection gate** and set enabled=true only after the children are configured. Exports contain no credentials or account-specific IDs.
6. Queue a small public research task in Life, run coordinator manually, inspect all child executions and review returned results in Life. Only then publish/activate the coordinator's once-per-minute schedule. Four non-waiting sub-workflow launches allow independent execution; actual overlap depends on instance resources.

## Contract and limits

Owner-session actions `ayo-os.agents.status/queue/token/revoke/review` retain normal workspace and CSRF controls. Queue input: `{workspaceId,pipelines:["nysc","freelance","career","ai-testing"],query,maxProspects:3}`; one to four agents, one to five prospects each,20 active jobs and500 retained jobs per tenant. Token/revoke also require `confirm:true`. Token scope permits public query claims and proposal submission only. It cannot read mail/CVs/documents, mutate companies/opportunities or send messages.

The worker POSTs to `https://life.ayodsgn.com/api/life/?action=opportunity-agents.poll` with `{limit:4}` and the bearer credential. Each returned job has `id,pipeline,query,maxProspects,leaseToken,leaseUntil`. Claims last 600 seconds and can retry up to 3 attempts; poll at most once every 10 seconds. The coordinator polls once per minute. Empty queues yield no provider calls.

Each child performs a bounded grounded Gemini request, checks source URLs against provider grounding, validates contacts, then POSTs `{jobId,leaseToken,proposals}` to `?action=opportunity-agents.result`. Valid empty results complete normally. Provider/format failure submits a generic error without raw provider details. Source URLs support human checking; neither model quotes nor the presence of a link proves a claim true. Read every source before applying a proposal. Never execute model/web content or treat it as HTML.

Server validation bounds proposal/source/contact counts, requires public HTTPS sources and explicit published-email evidence, rejects duplicate company/role proposals, strips unsupported fields and forces `stage=researched`, `acceptance=unknown`, `requiresReview=true`. It stores results only in the isolated research queue. Company/application/document snapshots stay unchanged. Duplicate callback retries are idempotent; mismatched results, stale lease tokens, expired leases and revoked/expired bearer tokens are rejected. Reviewing marks the result reviewed/rejected; applying changes uses the ordinary explicit Life save flow with its version conflict handling.

The local editor is not 24/7 hosting. Keep the computer/process running for polling. A permanent host is a separate decision. n8n successful executions and leases contain public research plus scoped job tokens, so retain data only as long as useful and protect the local owner account. Last-seen means authenticated polling, not proof that research or applications succeeded. All child failures must be inspected; dispatch success does not imply research success.

## Verification

`node automation/n8n/generate.mjs` regenerates exports. `node automation/n8n/test.mjs` checks gates, grounded proposal validation and independent dispatch structure. `tests/life-opportunity-agents.php` checks tenant isolation, token hash/revocation/expiry, leases, bounded claims, callback retries and no implicit application changes. Real account connection/provider execution remains unverified until the user finishes setup.

Official references checked 26 October 2026: [n8n sub-workflows](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/), [Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/), [Gemini Google Search](https://ai.google.dev/gemini-api/docs/google-search).
