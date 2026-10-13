# Natural voice booking and reply latency — 13 October 2026

## User story

“Book a call for 9 p.m.” creates one Call item in the selected board’s default unfinished list and a 30-minute Life calendar block at 21:00 on the current date in the account timezone. No title, list, date or duration question is required for this clear request. Today comes from the server clock, not model memory: a UTC instant at 23:30 on October 13 is October 14 in Lagos. An explicit tomorrow overrides today; explicit other dates and times remain supported. Booking does not send invitations or claim an external Google Calendar save.

The old native intent gate did not accept book/plan/arrange. Those explicit verbs are now supported. New task.book is one atomic action that creates the task and work block inside the existing transaction and verifies both writes. life_task_book exposes typed optional title/list/date/time/minutes fields; server defaults infer the spoken activity, selected board’s Idea Box/first unfinished list, the current account date and 30 minutes. A clear spoken AM/PM time overrides a mismatched model time. Failures roll back the task too, and stable request/fingerprint receipts prevent duplicate retries. Existing-item scheduling remains task.schedule. Booked confirmations include date, time, duration and Life calendar explicitly.

## Interface and internal transcription

The voice panel shows status, microphone, speaker and Finish, plus close/reconnect when needed. Captions, transcript, result text, chat-opening shortcut and patient/settings controls are removed. Native transcription remains internal for verification and server-side conversation context. API responses filter voice messages and session transcripts from public chat state; typed chat still renders and works. Backend transcripts are retained for continuity and receipts. No raw microphone recordings are retained.

## Faster path

Ordinary native conversation no longer waits for a classification HTTP request or a resolution HTTP request before playback. Classification is local unless a pending clarification must be retained. A clear mutation includes foreground speech/source and request metadata in one command HTTP request; the server registers and validates that turn before executing it. Greeting/silence cannot authorize a mutation. Cancellation tombstones protect a queued command whose turn has not yet been registered.

New bookings do not require a planner lookup because the server resolves the default list and authoritative date. Context queries remain required for unknown existing IDs or ambiguous names. A board refresh runs independently of the native tool response. Verified receipt confirmations are compared locally to server-generated receipt text; saved conversation text is still reverified by the server. Generation-complete releases verified native audio immediately, without waiting for the later playback-related turn-complete signal. Response generations stay bound to their own turn so late completion signals cannot finish a newer input; duplicate finalization and interruption during verification are guarded.

## Verification

561 deterministic checks passed (507 PHP backend and 54 client/turn/connection/PCM checks). Tests cover verb recognition, inferred Call title, October 14 timezone boundary, today overriding stale model dates, tomorrow, AM/PM conversion, duration, list default, retry dedupe, failed schedule rollback, cancellation before registration, greeting/silence rejection, hidden API transcripts, next-turn isolation and verified generation-complete playback.

A new real-service test streams synthetic 48 kHz speech through the production voice.js client, with the real Gemini socket and a disposable private planner. It verifies the exact booking utterance, one saved Call, date/time/duration, no duplicate item and native confirmed audio reaching playback. This catches client/event/transport failures that a server-only test misses. The initial old flow exceeded the test deadline under repeated SSH request setup; a persistent private driver separates that handshake overhead from the app’s command execution. The reduced path passed native audio and saved-state verification. A warm run measured the command round trip at 522 ms and initial greeting audio at 854 ms. The final generation-complete run measured greeting audio at 784 ms, command round trip at 942 ms and first verified booking playback at 3146 ms after the utterance ended; these are synthetic client test timings, not a guarantee for every device/network.

Physical user microphone/accent, acoustic echo cancellation, Android and iPhone acceptance still require a human session. Recognition and provider quotas remain fallible; failures must be stated truthfully. No promise of perfect or universally instant replies is made.

## Release

App 54, companion 50, voice 13, voice-turns 2, CSS 56. Finish old calls and reload before testing. Existing account data, allowances, billing settings and Google authorization settings are unchanged. Previous live commit: 220be5a425aadde3455b44a0c9300a7a709059fb. Private rollback archive: /home/u630192872/domains/ayodsgn.com/private/life-voice-booking-rollback-20261013.tar (mode 600). Remove disposable staging, test key and local credentials, then disable SSH after deployment.

API timing reference: [Gemini Live server content](https://ai.google.dev/api/live) documents that output transcription precedes generation-complete and that turn-complete can include playback delay.
