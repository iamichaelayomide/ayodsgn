# Applications and mobile chat release — 14 October 2026

## Behavior

Applications is a separate owner-only workspace on web and mobile. Users create named trackers (jobs, education, fellowships, volunteering or their own), categories and custom stages. Opportunity availability (unknown/upcoming/open/closed) is separate from application progress. Search, filters, deadlines, applied dates, follow-ups, preparation checklists, notes, custom fields and summary counts are included. Mark applied records the application date; it does not submit an external application.

Opportunity details can create a linked planner task with a deadline, scheduled work and reminder. Archive and restore preserve existing content. Confirmed permanent opportunity deletion removes that opportunity and its history, archives its document references and leaves linked planner tasks intact.

The private document bank accepts Word, PDF, text and common images. Documents can be reusable at tracker/category scope or specific to an opportunity. Preferred CVs and versions are supported. Original files are never overwritten. Limits are 5 MB per file, 100 MB and 500 documents per account.

Research uses Gemini with Google Search and source links. It does not share the document bank or automatically save researched dates. The displayed result identifies missing citations and requires users to review sources. Google Search suggestions are isolated in a no-script, authenticated iframe.

CV tailoring requires selecting a CV and explicitly confirming Gemini sharing. Research combines the supplied role description with company information. Prompts prohibit invented experience and metrics; users must review drafts before saving. Word copies retain unedited ZIP content and paragraph/first-run formatting. Edited paragraphs with mixed formatting may lose that mixed formatting; PDF drafts become editable text. No ATS outcome or factual perfection is guaranteed. Original Word hashes and styles are checked in tests.

Google Docs export creates a new copy after an optional, separate drive.file connection. Calendar/Tasks OAuth is unchanged. Encrypted document tokens can be disconnected without deleting existing Drive files. Drive API must be enabled for the existing Google project and its consent configuration must allow this scope. Export receipts and a Drive app-property lookup recover interrupted create requests without blindly duplicating files.

Text and native voice can create/edit/archive/restore trackers, categories and opportunities and mark applied through the existing validated command engine. Search spans account-owned metadata; documents are excluded. Application version checks reject stale generated actions. Existing ownership, duplicate prevention, transaction rollback, truthful confirmation and Undo continue to apply. Voice does not permanently delete applications, share documents or submit external applications.

Mobile chat has a top-right chat icon opening a separate searchable list, compact conversation controls, editable contextual starter suggestions, a bottom composer, retained per-chat drafts and immediate pending messages. Mobile Enter inserts a newline; desktop Enter sends. Keyboard viewport sizing uses visualViewport. Async logout guards prevent late prior-account replies from rendering.

## Storage and rollout

New tables are created lazily: life_applications, life_application_google and life_application_exports. Existing planner snapshots, accounts, saved chats, notifications and synchronization tables remain intact. Document files live under the existing private account attachment directory in an applications subdirectory. Public application metadata responses omit file identifiers, extracted document text and replay receipts. No private application responses are cached by the PWA.

Frontend entry versions: app.js v63, companion.js v51 and voice.js v14. The new feature styles/modules are v1. Existing calls can finish; all old non-application voice operations remain supported. Partner navigation and endpoints deny private Applications access.

Pre-release production rollback checkpoint: 22718f4613a1d669fa17aca1ae4d427900602ff3. Deployment uses a leased, non-forced master update and Hostinger's existing Git integration. Rollback should preserve the new tables/files rather than delete user-created data.

## Verification

Isolated PHP-WASM SQLite tests cover application lifecycles/custom stages, ownership, destination ambiguity, dates, private documents, review/sharing gates, immutable Word copies, retry receipts, generated action rollback, Undo, stale versions, Google export recovery, and sanitized search widgets. Existing security/account/planner/Google/native voice tests also pass. JavaScript deterministic tests cover application filtering, inherited documents, contextual suggestions, native audio/turn/connection behavior, goal progress, analytics and PWA privacy.

Actual HTTP multipart tests use a disposable account and synthetic CV, verifying authentication, CSRF, server-sniffed MIME, private metadata, attachment downloads and duplicate-free upload retries. Browser checks use the same disposable workspace: opportunity creation and mark-applied saves, chat search/selection, drafts and sending. Chat provider replies are explicitly mocked in this local test helper; the release code uses the real provider.

Desktop Chrome and mobile-size Chrome previews are checked, including no horizontal overflow and bottom-composer bounds. These are not actual iPhone/Android device checks. Browser file upload was not tested through the extension because file access permission is disabled; the upload endpoint itself was tested. Live Gemini research/CV output, the user's microphone/accent and Google OAuth/Drive conversion are not verified against real provider accounts in this release. The provider-dependent live-client test requires private test-driver credentials and was not run. No claim of perfect recognition or complete physical-device coverage is made.

Availability research is user-triggered. Recurring opportunity monitoring and automatic application submission are not implemented.
