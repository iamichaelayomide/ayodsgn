# Background research and tracking worker

The prepared coordinator and four child workflows now call **Life's server-side Gemini bridge**. No Gemini/OpenAI provider key is entered into n8n or exported from Life. Existing private billing-disabled provider configuration remains on the server. Last verified live research returned429 because the free allowance was unavailable; no paid fallback is introduced.

## One explicit owner-approved worker grant

In Life Settings, review and approve the selected worker permissions. Token creation still requires an explicit action and the unchecked consent control. Recommended permissions are:

`research:claim`, `research:execute`, `research:propose`, `daily:queue`, `context:use`, `tracking:read`, `company:write`, `contact:write`, `research:write`, `opportunity:write`, `pipeline:write`, `status:write`.

Tracking read can instead be limited per collection with `company:read`, `contact:read`, `research:read`, `opportunity:read`, `pipeline:read`, `status:read`. Write permissions are checked separately. Legacy proposal-only grants do not automatically gain execution or write access. Creating a token with write scopes requires `confirmWrites:true`; server Gemini execution requires `confirmProvider:true`, in addition to ordinary owner/CSRF/workspace and `confirm:true` controls. No live grant was minted during implementation.

Store the token in an n8n Header Auth credential named **Life research & tracking**: header `Authorization`, value `Bearer <token>`. Keep it out of chat, URLs, node parameters and source files. It expires after 90 days and is revocable/replaced by the owner. No email permissions or provider keys are contained in this credential.

## Daily plan

At 09:00 Africa/Lagos, the coordinator asks Life to queue today's bounded plan, once per tenant/date:

- 5 NYSC prospects: Lagos/Nigeria technology consulting and digital transformation first; healthtech, enterprise AI, edtech/govtech, venture building and technology teams beyond design titles.
- 5 Nigerian freelance prospects: paying B2B SaaS, agencies, AI, enterprise software and healthtech, with dated business signals and a specific potential service.
- 5 international freelance prospects: remote/client geography and current signals verified.
- 5 career roles spanning product, technology, healthcare, AI and business.
- 5 AI evaluation/testing niches, without inferring acceptance.

These are ceilings, not promised results. Recent 2–9-month funding and small teams are heuristics. The provider prompt prioritises official sources, published contacts, up to two named decision-makers, distinct NYSC/freelance positioning and Ayo's actual experience. No invented qualifications, guessed emails or internal business problems.

The once-per-minute polling trigger claims up to four jobs and dispatches independent child executions; remaining jobs are claimed on the next check. Actual overlap depends on the n8n host. Manual check only processes already queued jobs; it does not automatically create 25 prospects. Daily queue retries are idempotent. Server provider reservations cap all worker executions to 25 requested prospect slots per Lagos date, including failed attempts; quota failure does not trigger paid/repeated fallbacks.

## Execution and updates

Worker POST endpoints are under `https://life.ayodsgn.com/api/life/?action=opportunity-agents.`:

- `daily`: once-per-day bounded queue.
- `poll`: up to four leased jobs, ten-minute leases, three claim attempts, no faster than ten seconds.
- `execute`: validates worker scope, tenant, lease and daily budget; calls Life's free-only Gemini configuration; verifies proposal sources against provider grounding; stores the result. Repeating a completed execution does not call the provider again.
- `apply`: requires company/opportunity/research write scopes and contact write if contacts exist. It applies only a stored completed result, with deterministic dedupe and an atomic receipt/audit trail. It fills missing company/person details, preserves existing manual details/statuses, and adds sourced research. New AI testing records are pending; other prospects are researched. It never marks acceptance, submission, sending or revenue.
- `read`: scoped, paginated projection of allowed tracker collections, excluding documents, mail and approval content.
- `write`: specific approved `company/contact/research/opportunity/pipeline/status.save` operations only, optimistic version required, stable request ID, atomic audit/idempotency. No mail, drafts, approvals, documents, arbitrary actions or destructive deletes. Outcome/status assertions are blocked.

`execute` and `apply` have different purposes: execution alone does not update tracked records. Each child has `autoWriteEnabled=false` until the matching owner-approved write grant and workflow setting are deliberately enabled. `usePrivateContext=false` is also default. All imported/exported workflows remain inactive until setup and one verified manual test.

## Selected private context

The optional `context:use` execution permission does not read the whole CV bank or live mailbox. The owner separately selects exact CV versions and saved email context, approving Gemini processing; that grant is bound to this exact worker token and expires after 7 days. When enabled, the server attaches only that approved pipeline context directly to Gemini. Raw CVs and saved mail are not returned to n8n by the server-execution path. A missing or changed grant stops private-context execution. Public token rotation invalidates the selected grant.

Live Gmail OAuth is separate and unconnected unless the user personally completes it; current saved correspondence in Life can provide selected context. No worker permission enables sending, changing Gmail or submitting applications. Even when owner-only mail features are separately connected, external worker routes cannot invoke them.

## Setup and remaining dependencies

1. Finish owner approval of the worker's explicit scopes and, if desired, selected private context.
2. Select **Life research & tracking** on the coordinator's HTTP nodes and each child execute/apply node. No Gemini credential is required.
3. Set the coordinator's four real child IDs and `enabled=true` only after credentials are selected. Enable each child's tracking writes/private-context switches only for approved capabilities.
4. Wait for free Gemini allowance. Queue one small manual research task, run manual check, verify Life's job result and audited saved records, then activate/publish the coordinator schedules.
5. Keep the local n8n process/computer running, or choose an always-on host separately. Localhost setup does not imply 24/7 hosting.

Success/error/manual execution persistence and progress saving are disabled. Do not pin private outputs. Failed provider runs remain visible in Life instead of being represented as successful research. A successful dispatch/last-seen is not proof of research, applications or accepted outcomes.

Tests: `node automation/n8n/test.mjs`, `tests/life-opportunity-agent-access.php` plus existing lease/private-context suites. These are deterministic fixture tests; a live authenticated end-to-end run remains required before claiming connected background research.

## Company research from Life

The owner queues `ayo-os.agents.queue` with `workspaceId`, `opportunityId`, an optional focused `query`, and explicit boolean `usePrivateContext` and `autoApply` preferences. The server pins the selected opportunity’s pipeline and limits the job to one company; execution rejects results for a different company. Private context requires the separate active selected-source grant and `context:use` permission. Manual jobs default to research-only. Applying a stored result requires both an explicit job `autoApply: true` policy and the matching tracking write permissions. Daily prospecting jobs request automatic sourced tracking additions; they still cannot mark outreach sent or infer accepted outcomes.
