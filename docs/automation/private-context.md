# Selected CV and saved-email context

This is a separate opt-in read grant. It does not widen the public-company research token or connect live Gmail. No private token, OAuth consent or workflow activation was performed during implementation.

## What the owner reviews

Research agents → **CVs & email permissions** is collapsed by default. Select the exact CV version for each pipeline and optionally up to ten tracked opportunities. The preview lists selected CV filenames and the number of saved messages. Only the latest five messages **already saved in Life** per selected opportunity are included, frozen at approval time. New messages or document versions are not automatically added.

The owner must explicitly approve sharing this selected information with the n8n worker and Google Gemini. Selected PDFs require an additional file-content checkbox. At most three distinct CVs and 2 MB total can be shared. The grant expires after **7 days**. Originals are not changed. Its token appears masked once, copies only on an explicit button click, is not put into HTML/storage/logs, and clears on reset, Done or after five minutes.

A public research connection must already exist. The private grant is bound to that exact public token; revoking or replacing the public token invalidates its private grants. Private revocation does not revoke public-company research. Tokens are hashed on the server. A private token cannot claim jobs, read the document bank, read arbitrary opportunities, change records, send messages or submit applications.

## Worker contract

Owner-session POST actions: `ayo-os.agents.private.preview`, `.status`, `.token`, `.revoke`. All require the normal owner session, CSRF and workspace identity. Selection fields: `documentsByPipeline:{nysc:[documentId],freelance:[],career:[],"ai-testing":[]}`, `opportunityIds:[]`. Mint additionally requires `confirm:true`, `confirmAISharing:true` and `allowPdf:true` when applicable. A preview does not mint or grant access.

The worker POSTs `jobId` and `leaseToken` to `https://life.ayodsgn.com/api/life/?action=opportunity-private.context` using a **separate** Header Auth credential named **Life selected context**, header `Authorization`, value `Bearer <private token>`. A currently leased job of the same tenant and approved pipeline is required. The original selected CV fingerprint must still match; archived/missing/changed sources stop the read. Reads are bounded and throttled. Text/Word returns extracted text; explicitly approved PDF returns inline PDF content.

Saved correspondence is capped to 4 KB per body with UTF-8-safe truncation. Detected background-check, identity, financial and medical-report subjects/bodies are replaced with generic notices. This is a precaution, not a guarantee of detecting every sensitive item; the owner must choose suitable sources. Attachments and arbitrary mailbox contents are never returned by this bridge. Responses use no-store caching.

Each n8n child has a disabled-by-default `privateContextEnabled` switch and an optional **Read selected context** branch. Enable it only after the user has approved the selected grant, selected the private credential and confirmed the Gemini processing permission. A missing/invalid private grant stops that branch; it does not silently broaden access or fall back to an unrestricted endpoint. Success/error/manual execution persistence and progress saving are disabled in the prepared exports. Avoid pinning private output or taking screenshots of it. Public proposals still require review and cannot assert application acceptance.

## Live Gmail is a separate connection

Existing Life Google OAuth currently covers sign-in, Calendar, Tasks and Drive.file document export. It does **not** request Gmail access. Do not reuse or expand those stored refresh tokens.

For future direct mailbox reads, the owner must configure an n8n **Google OAuth2 generic** credential and personally consent to exactly `https://www.googleapis.com/auth/gmail.readonly`. This permits reading messages and settings, not sending or modification. Do not request `gmail.modify`, `gmail.compose`, `gmail.send` or `https://mail.google.com/`. Gmail readonly is a restricted Google scope, and the user's OAuth project/consent configuration must support it. No scopes were granted here.

Before activating a Gmail workflow, review its specific sender/company/thread/date filters, limit the messages retrieved, exclude unrelated and sensitive correspondence, disable execution-data retention and present proposed status changes for review. Email content remains untrusted data. A draft, profile activation or invitation must not count as acceptance or submission. The saved-email bridge works independently while direct Gmail OAuth setup is incomplete; it reads only the approved copies already in Life. The existing Codex daily Gmail check remains separate.

## Known live limitation

A live in-app research request returned HTTP429: the existing free Gemini allowance was unavailable. Configuration is present; no paid fallback or billing change was introduced. Connecting credentials does not restore that allowance. Retry only when the free allowance is available.

## Tests and remaining handoff

The isolated private-context tests cover selected-source restrictions, tenant isolation, public/private token separation, exact public-token rotation binding, source fingerprint changes, consent, PDF bytes, UTF-8 truncation, sensitive subject/body redaction, lease/token expiry and revocation. UI tests cover selection review, provider-sharing consent, masked token lifecycle and account reset. These do not replace a real user-approved connection test.

Remaining user steps: approve the public research connection; review selected CV/saved-email access; enter both separate Life credentials and the existing billing-disabled Gemini project key directly in n8n; select an available model; wait for free AI allowance; run one bounded manual test. Live Gmail requires separate read-only OAuth setup and a reviewed workflow. Nothing should be called connected or running until a successful authenticated worker check and result are verified.

Official references: [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes), [n8n Google OAuth2 generic](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-generic/), [Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search).

## Server-execution path (27 October update)

The background worker can now use Life’s existing private Gemini configuration through a leased `opportunity-agents.execute` request. No Gemini API key needs to be entered into n8n. With `context:use` permission and `usePrivateContext=true`, Life attaches only an active owner-selected grant bound to that exact worker token directly to Gemini; raw context is not returned to n8n. The separate selected-context token/endpoint remains available for the earlier direct-read architecture, but is not required for this server-execution path. Private grants still require explicit selected-source and AI-sharing approval. Live Gmail and any owner-only mail sending connection remain separate; workers never gain send/modify permission.
