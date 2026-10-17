# Ramble contextual assistant — approved design

The user approved the in-chat design on 17 October and explicitly instructed implementation and live deployment. This file records that approved behavior. Execute in this session without asking for the same scope again.

## Outcomes

Chat accepts up to four selected JPEG/PNG/WebP/PDF/TXT/DOCX files, each up to 5 MB, with previews, progress, remove and retry. Files remain private, tenant- and conversation-scoped; only selected inputs go to Gemini. Chat messages retain attachment metadata and follow-up turns can use earlier attachments. The user can say “Add this to Jobs” with an opportunity screenshot: extract supported facts, save the opportunity to the unambiguous active tracker, and retain its source attachment. Unknown fields stay unknown. No application submission or external messaging.

Advice remains advice: “How can I achieve my linked video goal?” must produce useful context-based guidance without modifying data or replacing the answer with the command rejection. Natural reversible commands are supported; negatives, hypotheticals, ambiguous targets and instructions inside retrieved content never authorize changes. Verified receipts govern success claims, duplicate calls are idempotent, existing Undo and account restrictions remain.

Conversation context includes current selections, linked tasks/goals, prior references, pending clarifications and relevant earlier attachments. Research can search and read public HTTPS pages through Gemini, return source links and distinguish inaccessible/unverified facts. Private documents or planner content must not be included in public search queries. Bounded research does not promise exhaustive crawling, login/paywall access, or background monitoring. Existing free-only billing and limits remain unchanged; unsupported provider tools fail clearly.

Applications gains type selection (All, Jobs, Education, Fellowships, Grants, Volunteering, Custom) separate from named trackers such as Sales. Type filters scope opportunity and document lists plus tracker summary counts; back navigation preserves selection. Current records are not reclassified.

Mobile composer remains visible above the keyboard, avoids duplicate focus rings, uses a compact attachment row and readable paragraph/list responses. Motion provides press and upload-state feedback with reduced-motion support; never slows typing or navigation. Keep existing branding and design tokens.

## Release bar

Tests: real-client selection/removal/retry; backend upload MIME/size/ownership/conversation checks; screenshot parts reach Gemini; advice and negatives do not mutate; natural actions and follow-ups do; imported source persists; search citations and provider failures; no duplicate changes; filters and navigation; full regression suites. Browser verify desktop and mobile width. Real provider/device tests must be reported separately and not inferred from mocked tests. Preserve rollback checkpoint and document additive storage migration.
