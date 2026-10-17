# Ramble contextual chat and attachments — 17 October 2026

Saved chat now accepts JPEG, PNG, WebP, PDF, TXT and DOCX attachments (four files per turn, 5 MB each). Private originals are account- and conversation-scoped; file type, size, CSRF and download ownership are validated. Native Gemini image/PDF parts and bounded extracted document text are included. A source attachment is copied into the document bank atomically when a validated opportunity is created. Failed sends retain the draft and attachments. Temporary chats do not upload files.

Natural action permission is separate from advisory discussion. Recent verified record references and pending clarification retain context; refusals and topic changes clear pending requests. Mutations retain existing ownership, transaction, version, receipt and duplicate controls. Destination checks reject guessed boards, lists, categories and trackers. Source material is evidence rather than action authorization. Only receipt-backed saves produce completion confirmations. Public research uses bounded Google Search and URL Context requests and displays sources or explicit availability errors. It does not crawl authenticated/private websites, and it cannot perform arbitrary unsupported actions.

Applications separates type filters (Jobs, Education, Fellowships, Grants, Volunteering, Custom) from named trackers. The mobile composer has attachment chips, compact controls, a single focus ring and reduced-motion support. Existing native voice is unchanged.

## Storage and release

Additive life_chat_attachment table is initialized before mutation transactions. Files use private account directories; no original planner/chat data is removed. No billing expansion or provider fallback. New versions: app v69, companion v54, Applications v6/model v3, chat CSS v3, Applications CSS v5. Rollback checkpoint: a997363b51fbd205b07edbae45df5eedae578012. Revert only release files to that checkpoint; retain the additive table and private files to avoid data loss.

## Evidence and limits

Fresh verification: all 19 existing PHP suites, 47 contextual/action/research checks, 55 attachment checks plus 3 private download checks, 15 JavaScript suites, 15 actual HTTP/multipart/privacy checks and site validation passed. Independent scoped review found no additional blocking issue. Tests include negatives, source injection, wrong destinations, save rollback, retry deduplication, cross-account isolation, delayed client responses, and a two-turn screenshot clarification preserving the source. Provider calls in deterministic tests are mocked. Browser checks show no horizontal overflow at 390 and 320 pixels, readable attachment metadata and separate type filtering.

The browser extension currently blocks local file selection unless its file-URL permission is enabled. Real Gemini screenshot extraction, live web research and physical phone/keyboard/microphone checks are not established by these tests. The live site currently requires user login before authenticated verification. No perfect-recognition or complete-security guarantee is made. Emil design engineering/mobile/animation skills installed from official emilkowalski/skills commit 2d228630ba1446365f614a108cb8252f1feda202; relevant Superpowers design, TDD, review and verification workflows applied.
