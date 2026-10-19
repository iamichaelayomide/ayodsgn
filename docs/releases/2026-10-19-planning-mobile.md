# Ramble planning and mobile release — 19 October 2026

## Changes
- Full-width mobile chat text field with separate attachment/voice/send controls, Photos and Files choices, immediate ready state, preserved drafts/selection, and chat-list/back navigation.
- Task-add buttons disabled until a nonblank title; ready/saving feedback, focus retained after quick add.
- Tasks/Goals board switch, goal Board/List/Cards, search and date/period filters.
- Independent goals default; optional parent links across quarter → month → week → day. Up to three active quarterly objectives and four measurable key results each. Legacy records remain readable/editable.
- Manual or linked delivery progress. Completing tasks never invents measured outcomes. Partner approval rules remain enforced.
- This week is a commitment overview, preserving underlying workflow and deadlines. A committed Idea Box task appears once; cards duplicated from other lists identify their workflow and are reference cards. Edit the task to remove its weekly commitment.
- Global contextual + action sheet and mobile sidebar swipe affordance.
- AI understands natural follow-ups and current goal hierarchy; greetings cannot approve pending actions. Receipt/ownership/version/negative intent protections retained.

## Verification before publication
- 19 existing PHP suites passed (all PHP source parsed).
- New goal model suite: 81 checks passed, including hierarchy, limits, restoration, task timestamps, linked/manual progress and partner restrictions.
- Contextual chat: 57 checks passed; private attachments: 55 plus 3 download-header checks passed.
- 17 JavaScript suites passed, including actual companion controller races, draft/file retry, native audio interruptions, navigation and goal views.
- 15 actual staging HTTP/multipart/replay/privacy checks passed. Provider is stubbed in disposable staging; this does not prove live Gemini behavior.
- Browser: desktop and 390px compact-height layouts; ready task button, weekly creation/focus, quarterly metric/monthly linkage, chat history/back draft preservation, send and attachment menu checked. No layout overflow in checked goal/mobile views.
- Scoped independent review found and fixed weekly workflow reset and the sole weekly card losing its drag affordance. No remaining blocker in final scoped review.

## Limits of evidence
- Physical Android/iPhone keyboard, touch drawer gesture and real-microphone/accent checks were not performed in this release. Desktop emulation is not actual-device verification.
- Browser screenshot upload remains blocked by the test extension file-URL permission; backend image/document and client upload/retry paths were tested separately.
- Public research depends on existing Gemini quota. No paid fallback, billing or provider changes; no claim of guaranteed recognition or response latency.

## Migration and rollback
Additive state fields only; no SQL migration, account reset or destructive record rewrite. Existing receipts/chats remain intact. New asset versions: app70, companion55, goals7, navigation3, card-drag2, chat-mobile4; new goals/interactions styles and module.

Publish only the explicitly changed Ramble sources/tests/docs atop production master 5c498d556864e4f8aca12cf9bf88261b6020d6ec (tree 47f2087a18e8609716309a63eed267c0beddde84). GitHub → Hostinger deployment. No SSH access changes. Rollback by publishing a new commit restoring changed paths from that checkpoint; retain additive data fields. Confirm the branch lease before any update.
