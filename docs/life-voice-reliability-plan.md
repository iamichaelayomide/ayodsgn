# Voice planner reliability: implementation and release plan

## Objective and limits

A spoken planner request should use the authenticated account’s real records, apply only the requested supported changes, verify the stored result, and report that result accurately. A model’s spoken “done” is not evidence. The release must prevent unverified native completion audio from reaching the user and from being saved as a success message.

Speech recognition cannot be guaranteed perfect across accents, noise, interruptions and task names. Unclear speech must lead to clarification, not silent guessing. Tests must distinguish mocked transcripts, real provider text input, synthesized spoken audio, and a human’s physical microphone. Passing one category does not imply the others passed.

## 1. Establish the current failure cases

- Preserve the user’s reported case: an incorrect transcription of a task name, a claimed move without a corresponding board change, and leaked control tokens.
- Trace microphone capture, provider transcription, tool calls, command authorization, state writes, receipts, UI refresh, spoken output and saved chat independently.
- Confirm that provider events can arrive out of order; avoid waiting for transcription inside the same serialized queue that must process it.
- Use disposable accounts/planners for live tests. Do not create, move or complete production user records as test fixtures.

Acceptance: a delayed transcript does not deadlock or reuse an old instruction; a false native confirmation cannot be played or stored as an executed result.

## 2. Capture and retain trustworthy turn context

- Associate incoming transcript fragments and native tool requests with a provider turn.
- Retain current selected board, screen, fresh record identifiers, planner version and recent chat context.
- Capture the current utterance as bounded 16 kHz PCM; discard idle silence and reject audio longer than 45 seconds.
- Independently transcribe the captured audio on the server, using active planner names as vocabulary hints. Preserve negatives and return clarification for unintelligible speech. Cache recognition per session/turn so tool delivery and turn completion do not transcribe twice.
- Authorize actions from that independent transcript, not a native voice model’s suggested tool arguments. Typed input during a call remains explicit text input.
- Preserve cancellations and interruptions. Closing a call must not emit an unverified success reply.
- Remove provider control tokens from displayed/saved transcripts; show the latest heard phrase in the voice panel.
- Encourage English conversation by default while keeping the distinction between speech recognition and instruction generation clear.

Acceptance: subsequent “that task” refers to the freshly created task ID; previous-turn text cannot authorize a new change; the heard line makes recognition mistakes visible.

## 3. Resolve explicit requests using real planner records

- Request current account-scoped context before resolving ambiguous IDs.
- Default new tasks to an active list on the selected board; use an explicitly named destination when supplied.
- Reject contradictory interpretation such as an “add” transcript being executed as a move.
- Reject mismatched spoken task names rather than substituting a similarly named record.
- Preserve discussion, negative instructions and existing partner/ownership restrictions.
- Keep unsupported capabilities, such as continuous background monitoring, outside planner action execution.
- Every clear explicit spoken request uses the same server command engine as typed requests. Native planner tools are triggers, never mutation authority. Independent recognition and action generation consume separate processing requests under existing public quotas, provider limits and billing settings. Optional task fields do not cause unnecessary clarification.

Acceptance: a specific known task can be moved; a conflicting/missing target yields clarification with no mutation; unrelated planner content remains unchanged.

## 4. Execute and verify before confirming

- Execute bounded operations through existing server actions, never arbitrary model code.
- Preserve transaction rollback, optimistic versions, account ownership and duplicate request protection.
- Read persisted planner state after each task mutation, within the transaction.
- Verify creation/edit fields, destination list, completion state, due date/time, archive state and checklist/dependency changes that were requested.
- Roll back if the stored state does not match the requested supported effect.
- Issue a receipt only after these checks. Include fresh IDs and version for subsequent references.
- Associate native command receipts with the active voice session. A native reply alone cannot mint a receipt.

Acceptance: a wrong stored destination cannot produce a success receipt; repeated requests do not duplicate tasks; a failed multi-operation transaction produces no partial success claim.

## 5. Make spoken and saved outcomes authoritative

- Buffer native response audio until the turn is resolved.
- Replace command confirmations with text built from verified server receipts.
- Speak that verified text through device speech synthesis; retain native audio for ordinary checked conversation. When device synthesis is unavailable or muted, show the verified text visibly.
- Suppress raw native completion audio that lacks a receipt.
- On tool failure, say that the requested change was not saved and report the relevant reason.
- On an uncertain network outcome, say the result could not be verified and ask the user to check the board before repeating. Do not incorrectly assert either success or rollback.
- Store only the resolved reply; keep chat history and refreshed board consistent. Avoid double-saving turns handled by the typed-command fallback.

Acceptance: injecting “I have moved every task” with no actual mutation produces an honest failure/clarification instead; an actual move produces the canonical receipt and correct board state.

## 6. Verification matrix

### Deterministic client tests

- Tool before transcription; fragmented transcription; punctuation variation.
- Separate turns, stale quotations, cancellation and interrupted replies.
- Buffered false success audio, canonical spoken receipt and safe failure speech.
- UI refresh failure after a real save must not be reported as failed storage.
- Verify heard/result text on desktop and mobile.

### Backend and regression tests

- Create, rename, move, complete/reopen, archive/restore and date changes.
- Read-back checks for correct effects and deliberate incorrect state fixtures.
- Duplicate turn/request IDs, failed second action rollback and stale versions.
- Discussion, negative requests, mismatched names and temporary-chat restrictions.
- Valid versus forged/session-unrelated receipts; tool errors and sanitized control tokens.
- Typed-engine fallback both with valid actions and dishonest no-action model output.
- Existing command, AI and voice suites; account boundaries and existing permission behavior.

### Real provider spoken-audio tests

- Generate disposable spoken commands locally using installed system voices.
- Stream actual 16 kHz PCM audio to the configured Gemini Live session, not a typed substitute.
- Derive backend authorization from independent recognition of the captured PCM, not the known fixture script or the native model’s rough transcript.
- Verify add, contextual move and completion in the persisted disposable planner.
- Include a second English voice and a controlled noise variant where feasible.
- Record heard text, requested tools, canonical response and database assertions; never record provider secrets.
- For unclear/negative speech, require either no mutation or the correct explicitly authorized result. Do not count a wrong mutation as a pass.

### Human/device acceptance still required

A synthesized voice is not the user’s accent or microphone. A human should run the listed commands on their actual desktop/mobile device, with permission granted, speaker playback, interruptions and realistic background noise. If this cannot be performed in the session, mark it unverified rather than claiming complete microphone coverage.

## 7. Release and rollback

- Run the isolated server tests and real provider spoken-audio tests before deployment.
- Save the test report, implementation plan and source changes in Git.
- Back up the production runtime files before replacing them. No production user test records or schema migrations are required for this release.
- Deploy only runtime files; keep tokens, temporary databases, fixtures and test drivers private and disposable.
- Update asset versions so a reload loads the new client; existing voice sessions need to finish and restart to receive new instructions.
- Verify live file hashes and PHP parsing, then remove temporary SSH credentials and disable access.
- Preserve a rollback archive; unused newly added client modules can remain inert if the old entry client is restored.

Release criteria: required deterministic checks pass; real spoken-audio execution is demonstrated or explicitly reported blocked; no known unverified completion path remains for planner commands; any physical-device limitation is stated honestly.
