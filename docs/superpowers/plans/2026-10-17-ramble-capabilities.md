# Ramble capabilities implementation plan

> Execute with superpowers:subagent-driven-development for isolated module tasks, TDD, task reviews and final independent review.

**Goal:** Deliver the approved contextual, multimodal assistant and tracker-type UI.
**Architecture:** Extend the existing PHP/Gemini client and validated transaction engine. Add private chat attachment storage and a bounded research helper, retain receipts, and extend existing vanilla JS controls.
**Tech stack:** PHP 8.3, SQLite/MySQL, Gemini REST, vanilla JS/CSS, Node and PHP-WASM tests.
**Spec:** docs/superpowers/specs/2026-10-17-ramble-capabilities-design.md

## Constraints and review focus

No billing/access expansion. No false-success confirmation, source-instruction execution, cross-account file access or guessed destinations. Preserve chats, planner data and existing native voice. Handle stale lifecycle responses, missing captions, long names, duplicate requests and unavailable research. Existing linked-document consent remains.

## Task 1 — private chat attachments

Files: api/life/chat-attachments.php (new), api/life/index.php route wiring, tests/life-chat-attachments.php (new).
Interface: LifeChatAttachments($store): upload(array $input), resolve(array $ids,string $conversationId): array {attachments,parts}; GET download. POST ai.attachment.upload multipart file/conversationId/requestId returns {attachment:{id,name,mime,size,url}}. Resolve limits four files and returns native Gemini parts; owner/conversation scope required. Optional atomic attachToOpportunity method for already validated inputs, used inside command transaction.
Steps: failing tests → run red → implement private validated storage → run green → self-review.

## Task 2 — contextual chat and research

Files: api/life/ai.php, api/life/commands.php, api/life/chat-context.php and chat-research.php (new), tests/life-chat-capabilities.php (new).
Consume attachment resolve; accept attachmentIds in ai.send. Include prior referenced records and relevant prior attachment parts without treating them as authorization. Advice answers normally, mutation gate accepts natural explicit requests and preserves negative/hypothetical rejection. Research helper accepts minimally scoped query/URLs and returns text/sources/status. Keep raw provider evidence out of mutation authorization and retain receipts. Source attachment copies belong to created opportunities. Test red/green each behavior and run existing command/voice regressions.

## Task 3 — mobile UI and tracker types

Files: life/companion.js, life/app.js upload dependency wiring, life/chat-mobile.css, life/applications.js, life/applications-model.js, life/applications.css, supporting client helpers/tests.
Expose selected-file chips, remove/retry and attachment messages; preserve draft/files after errors; prevent send while uploading. Type filter is distinct from named tracker selection and survives navigation. Add restrained press/state feedback and reduced motion. Test helpers using real behavior, then browser keyboard/desktop/mobile smoke checks.

## Task 4 — review and release

Independent review both modules and complete diff. Run deterministic JS + PHP + isolated HTTP tests; real Gemini inputs on private staging if accessible. Validate all PHP syntax, public paths, privacy and loading behavior. Bump versioned imports, document limits/migrations/rollback, scoped GitHub release atop current master. Verify actual live entry/assets/UI; never claim unrun real microphone/device checks.

## Progress

- [x] Task 1
- [x] Task 2
- [x] Task 3
- [ ] Task 4 — local checks and independent review passed; publish and live verification pending
