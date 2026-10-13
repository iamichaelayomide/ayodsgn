# Voice execution verification and release — 13 October 2026

## Result

Released to https://life.ayodsgn.com/. Voice commands now use independent recognition of captured audio and the same server action engine as typed commands. Task effects are read back inside their transaction before a completion receipt is committed. Native voice audio is held until the result is resolved; command confirmations use the verified receipt text, spoken with device speech synthesis. The panel shows what was heard and the verified outcome.

## Deterministic verification

210 checks passed against disposable data:

| Suite | Checks |
| --- | ---: |
| Voice actions, context, unrelated-session receipts, mismatched names and false confirmations | 43 |
| Persisted task effect verification | 10 |
| Existing planner commands and rollback | 50 |
| Existing voice sessions and limits | 22 |
| Existing AI behavior | 46 |
| Independent recognition, WAV payload, negative instructions, caching and invalid audio | 14 |
| Full client, delayed transcription, save acknowledgment and stale turns | 9 |
| Transcript ordering and turn isolation | 7 |
| Audio capture, idle silence, duration cap and recognition caching | 9 |

PHP parsing passed for all changed server files and the page entry point. The full client test deliberately injects unverified success audio and a failed UI refresh: the audio is suppressed and the actual saved result remains truthful. Browser preview renders the heard phrase and no-change response without console errors. Preview uses mocked media and API responses; it is visual proof, not physical microphone acceptance.

## Real provider audio acceptance

Actual 16 kHz PCM was streamed through Gemini Live. Independent recognition and the real configured text action engine ran against an isolated SQLite planner on the hosting server. No production planner records were used.

| Spoken input | Independent recognition | Verified saved outcome |
| --- | --- | --- |
| Add a task called Buy groceries to my board | Add a task called buy groceries to my board | One buy groceries task created |
| Move that task to In Progress | Move that task to In Progress. | Same task ID moved into In Progress |
| Mark that task as done | Mark that task as done. | Same task ID moved to a done list |
| Do not move that task | Do not move that task. | Task state unchanged |
| Add a task called Read a book to my board, second system voice | Add a task called read a book to my board | Second task created |
| Same request with controlled 20 dB background noise | Add task called read a book to my board | Exactly one additional task created |

All six scenarios passed database assertions. Fixture scripts were never supplied as authorization; authorization came from recognition of their actual captured audio.

Earlier attempts were failures, not counted as passes: native recognition substituted “by groceries” and “my book”; the safe guard refused the mismatched command. Independent recognition fixed that path. A later action model unnecessarily asked for a due time; optional-field instructions were corrected. One Google Live attempt ended with provider error 1011; a fresh session then passed all scenarios. External service availability is not guaranteed.

## Deployment evidence

- Rollback archive: `/home/u630192872/domains/ayodsgn.com/private/life-voice-verified-20261013-052123.tar`, mode 0600.
- Server source hashes checked after deployment; public hashes match the tested app, companion, voice, transcript, capture and CSS files.
- Live page references app version 47 and CSS version 48; companion imports voice version 10 and voice imports transcript version 2.
- Unauthenticated requests to the recognition endpoint are rejected (403).
- Disposable server test drivers, SQLite planner and ephemeral token files removed after testing.
- No schema migration, Google login test, production test task or paid fallback was introduced.

## Practical limitations

These are synthesized English voices, not the user's physical microphone or accent. Actual desktop/mobile microphone permissions, acoustic echo, speaker audibility, barge-in and noisy human conversation still require device acceptance. Recognition cannot be guaranteed perfect; the heard phrase exposes mistakes and unclear commands produce clarification. Long instructions are limited to 45 seconds. Recognition and action generation are separate processing requests under the existing public allowance. A network failure after a possible save reports an unverified outcome and asks the user to check the board, rather than claiming rollback.

Reload the planner and start a new voice call to receive this release. Supported bounded planner actions remain subject to account ownership, existing approval constraints, provider limits and Undo history. Continuous background watching is not a supported voice action.
