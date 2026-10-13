# Gemini-native voice and Privacy Policy sidebar pattern

## Changes

The sidebar uses the exact existing `policy-ribbons.svg` from the Privacy Policy page, with a blush background. History gutters and Connections naming remain as previously reviewed.

Voice calls now use Gemini 3.8 Live directly for listening, input transcription and planner function calls. The separate non-streaming recognition endpoint is disabled and the client never calls it. That former recognition pass was also Gemini, not an external third-party transcription provider. The legacy internal helper remains dormant for compatibility; it is not exposed to the call flow.

Native `planner_changes` requests execute bounded account-scoped server actions using the current turn's received transcript, exact authorization quote, selected board and fresh IDs/version. Native-only resolution never invokes a second text-generation action engine. Required task completion arguments are documented explicitly (`id`, boolean `done`); optional dates/times do not block ordinary creation. Task-naming captions accept the observed called/cold naming-word mismatch for add/create/make requests, while preserving exact task-name/destination matching and negative guards. Missing/ambiguous targets preserve a useful native clarification without claiming a save.

The screenshot showed the assistant's reply in the Heard field. Inspection confirmed microphone frames were forwarded during speaker playback. The client now suppresses microphone forwarding while native audio or verified fallback speech is playing, including a 350ms echo tail, and resumes automatically. The UI says Speaking during playback. Current-turn microphone input is required for actions; empty or stale turns cannot execute commands. Quiet speech can still qualify as current input.

All task effects are verified through existing transaction read-back before a receipt is committed. Native completion audio is played only when its full output transcript matches the verified receipt text; otherwise the canonical receipt is spoken through device speech synthesis. Unverified success claims remain suppressed. Physical microphone/accent/acoustic acceptance is not implied by synthesized tests. Short playback suppression prevents barge-in while the speaker is active; users can speak again automatically when the reply ends.

## Verification

235 deterministic checks passed: 50 voice action/context/clarification, 22 voice sessions, 50 commands, 10 read-back, 46 AI, 22 task history, 15 full native client/echo/playback/resume, 11 transcript/quiet input and 9 capture. Changed PHP and JavaScript files pass parsing. Sidebar screenshot uses the real page structure/styles with mocked history data.

Real acceptance uses system-synthesized 16 kHz PCM, streamed to the configured Gemini Live service; authorization comes only from its received input transcript. No fixture script is supplied as a substitute user instruction. Commands run against a private disposable SQLite planner on the hosting server. Manual tests passed creation, contextual move, completion, negative instruction, second voice and 20 dB noise. Hands-free tests exercise the same scenarios with continuous microphone silence before/after speech and reply-playback timing. The noisy hands-free request has a distinct title, separating recognition from duplicate-title clarification.

Earlier failed attempts were not counted as passes: missing turn timing, invalid completion argument names, an unnecessary duplicate-title clarification and the observed called/cold naming-caption mismatch under noise. Completion contracts were tightened and the acceptance harness was corrected to reflect continuous microphone/reply playback behavior. No production test tasks, schema changes, Google login tests, paid fallbacks or retained audio are introduced.

## Release

Asset versions: app 50, companion 48, voice 11, transcript 3, capture 2 and CSS 51. Existing calls must finish; reload Life and start a new call. Preserve the runtime rollback checkpoint and leave existing permanent history records intact. Remove private test drivers, token files, staging databases and temporary SSH access after live verification.

Primary references: [Gemini Live API](https://ai.google.dev/api/live), [current Live pricing](https://ai.google.dev/gemini-api/docs/pricing). These confirm the native transcript/tool interfaces and free-tier availability; provider quotas and outages still apply.

Released to `life.ayodsgn.com` on 13 October 2026. Both successful speech runs passed six saved-state scenarios (12 streamed-audio scenarios total): manual delivery and default hands-free delivery. The hands-free noisy caption said “cold water the plants”; the verified native action correctly created “Water the plants.” All 235 deterministic checks passed. Public hashes match the tested app/companion/voice/transcript/capture/CSS assets, and the live page loads app version 50. PHP parsing passed after deployment. Rollback archive: `/home/u630192872/domains/ayodsgn.com/private/life-native-voice-20261013-111150.tar`. No physical human microphone or accent acceptance test was performed; speech fixtures were system-synthesized and client echo/playback tests used mocked audio devices. Private staging contains no production planner records and is removed after verification.
