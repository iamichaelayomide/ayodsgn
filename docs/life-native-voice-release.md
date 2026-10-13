# Ramble native voice protocol 2 — 13 October 2026

## Result and scope

New calls use one Gemini 3.8 Live conversation for listening, native captions, understanding, function calling and native speech. The browser recognizer, device speech synthesis, Economy voice client, secondary capture/transcript helpers and server transcription helper are removed from this flow. Typed Ramble and separately uploaded audio remain unchanged. Billing, allowances, account isolation and partner restrictions remain unchanged.

The microphone stays active during replies for natural interruptions. Capture uses browser echo cancellation, noise suppression and automatic gain control. PCM is labeled with the actual AudioContext rate; the worklet emits 20 ms frames without crude decimation. Ordinary conversation audio streams as it arrives after classification; mutation confirmations wait for saved receipts. Browser microphone permission remains mandatory. No new recording-consent modal is added.

## Components and protocol

- `voice-audio.js`: microphone lifecycle, actual-rate PCM, native audio queue, mute and playback cancellation.
- `voice-connection.js`: ephemeral connection, frame delivery independent of HTTP tools, reconnect/resumption and stale socket rejection.
- `voice-turns.js`: separate input/response lifetimes, interim/final captions, held late captions, turn IDs and tool cancellation.
- `voice.js`: orchestration, serialized account API calls, native tools, status recovery, truthful playback, transcript persistence and accessible controls.
- `voice-protocol.php`: operation-specific typed schemas, natural intent/target guards, full-account search and confirmation matching.
- `native-voice.php`: turn registry, idempotent actions/status, interruption recovery, navigation, Undo and receipt-only resolution.

`ai.voice.start` receives/returns protocolVersion 2 and constrained native setup. `ai.voice.turn`, `command`, `cancel`, `status`, `navigate`, `undo`, `resolve` and `save` require authentication and the account-owned session. Mutation requests include session, turn, tool-call and stable request IDs, current board version and typed arguments. New calls use protocol 2; already-running protocol 1 calls retain their handlers for a ten-minute compatibility window. No database schema migration is needed; existing chats, receipts and planner records remain intact.

Gemini uses BLOCKING declarations: a classification tool, context/search tool, navigation, Undo, a bounded atomic multi-action batch and dedicated `life_*` functions exposing only relevant fields. Search scans the full account before limiting returned matches, including records beyond 500. English/Nigerian English hints and current planner vocabulary are sent. Kore is the native voice. Automatic detection starts with a 300 ms prefix and 900 ms silence; the optional “Let me finish” setting uses 1800 ms and reconnects the call. Captions are display/audit data, not an exact quote with a 2.5-second deadline.

## Actions and truthful speech

Clear reversible requests execute immediately. Suggestions, hypotheticals, negatives, stale turns and uncertain/duplicate targets are rejected or clarified. Missing details can remain pending across follow-ups. “Remove” archives; permanent deletion and external messaging are unavailable. Existing ownership, transaction rollback, version, read-back, omitted-field preservation and Undo checks remain in force.

Receipts and latest referenced IDs are saved inside the mutation transaction before any spoken response. Retries recover by request ID; semantic fingerprints prevent duplicate changes even if Gemini retries with reordered fields or a different tool ID in the same turn. An interrupted request is recovered through command status rather than treated as failure.

A server-generated confirmation identifies saved effects. Mutation audio stays buffered until its full caption agrees with that receipt, apart from harmless framing. Unsupported claims are discarded; one native readback attempt is permitted in the same session with tool calls disabled. If repair fails, the verified result is displayed with a speech error. Device voice is never substituted. Saved assistant transcripts are recomputed on the server from receipts.

Reminder fields and scheduled work blocks are distinct. Names/title aliases are normalized and irrelevant fields are rejected. New unspecified goals use ad hoc type. Existing routine edits preserve routine identity. New boards start with Idea Box so board refinement does not introduce a surprise version change.

## Verification evidence

521 deterministic checks passed: 471 PHP backend checks and 50 JavaScript client/turn/connection/worklet checks. Coverage includes isolation, history, command transactions/read-back, planner operations, retries/semantic dedupe, permission denial, quota/session errors, missing/delayed captions, canceled tools, reconnect/stale frames, uninterrupted microphone forwarding during playback and native-only repair. Changed PHP/JavaScript parse; diff whitespace checks pass.

Real Gemini integration used synthetic speech streamed as PCM to constrained ephemeral sessions with a disposable private SQLite planner on Hostinger. No production planner changes or provider billing changes were made. The clean extended run passed 13 turns (greeting plus reopen, rename, schedule, reminder, archive, restore, create/complete goal, create board/list/note and Undo). A final basic run left the verified state with Buy groceries created/moved/completed, the negative instruction leaving it intact, and Water the plants created from noisy speech. The final saved-state read verified two tasks, no unintended archive and the completion timestamp.

Earlier failures were not counted as passes: provider calls without IDs, broad tool fields producing name/title or kind/type confusion, reminders mistaken for work blocks, a disposable fixture schema reinitialization, stale harness board versions and caption whitespace lost between chunks. These led to operation-specific schemas, strict field guards, safe alias handling, explicit reminder contracts and stable request keys. The dedicated-schema extended run completed without malformed action retries.

The mocked browser preview fits desktop and a 390 px viewport without horizontal overflow. Microphone/speaker/Finish controls, optional captions, patient setting reconnection and finish cleanup were checked. These are UI/client tests, not physical microphone tests.

## Acceptance limitations

A session with the user's real microphone, accent and normal phrasing is still required. Physical Android Chrome and iPhone Safari permission/playback/interruption checks remain unverified. Browser echo cancellation cannot be certified with synthetic PCM or mocks. No tested false-success confirmation reached verified playback or persisted chat, but this is not a promise of perfect recognition or all possible model behavior.

Ordinary reply latency target of roughly two seconds is not certified. Integration first-audio timings include the spoken utterance, artificial silence and multiple SSH driver round trips; they do not measure browser HTTP latency. Runtime logs record event/timing categories only. Raw microphone audio is not retained by default, and credentials/unused planner content are not logged.

## Release and rollback

Runtime versions: app 53, companion 49, voice 12, new modules 1, worklet 2 and CSS 55. Finish an existing call and reload before starting a protocol 2 call.

Previous live GitHub master: `9403e4aac4e5f718735d1f946e6aa13b1840ef59`. Private runtime rollback archive: `/home/u630192872/domains/ayodsgn.com/private/life-native-v2-rollback-20261013.tar` (mode 600). Deployment uses the existing GitHub master → Hostinger workflow. Verify runtime hashes after deployment; remove disposable staging, ephemeral tokens/drivers and the temporary SSH key, then disable temporary SSH access. The rollback archive remains private.

Primary references: [Live API](https://ai.google.dev/api/live), [Live capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities), [Gemini 3.8 Live](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live).
