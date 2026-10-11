# Life companion — Phase 2A

Owner-only typed conversations, approved memory, context preview, reviewed proposals, and guarded undo. Voice conversation is Phase 2B and is not included in this release.

## Configuration

Companion → Connection stores the Gemini API key in `../private/life-ai-config.php`; staging uses `life-stage-ai-config.php`. Neither file belongs in Git or public_html. Permissions are 0600. The owner confirms billing is disabled; the application cannot independently verify Google billing. There is no automatic paid fallback.

## Persistence and migrations

First authenticated use creates additive `life_ai` with one CAS-versioned JSON state row. Existing manual tables and records are unchanged. No destructive migration is required. It stores conversations (up to 500, each up to 2,000 messages), explicitly accepted memory (up to 500 facts), consent, and 32 days of request-attempt counts. Archived conversations can be restored from Connection.

JSON export includes `ai` state. Full private ZIP backup includes `ai.json` separately from `planner.json` and attachment files. Keep private configuration in hosting backups separately. A restore must replace `life_ai.state` from `ai.json` and increment its version, together with manual planner restoration while the application is offline. Test restore with a separate staging database; never restore a backup over active writes. No public import endpoint exists.

## Retrieval and safety

Each request includes at most 24 active goal/task/note/map records, at most 40 relevant/recent memory facts, the current Lagos sprint, two recent reviews, active lists, and selected mind-map connections. It includes the latest 12 messages and a short conversation summary. Memory correction increments an epoch and clears summaries, so earlier claims are not retrieved again as conversation context. Source buttons open the referenced planner record.

AI replies are plain text, escaped before display. Provider JSON must pass server validation. Allowed proposals: create a task in an active unfinished list, schedule an existing task, update the current sprint goal, save a memory fact. Suggestions never apply automatically. Application and receipt writes occur in one transaction. Undo rejects newer conflicting planner edits or corrected memory. Partner completion rules still apply.

Permanent keys only travel server-to-Google in headers. The provider endpoint is fixed. Every private route requires an owner session; POSTs require CSRF. Responses are no-store. Partners cannot read AI history/configuration even when they can read the manual planner.

## Free-only limits and errors

30 attempted text requests per Lagos day; failed calls count. Provider limits may stop replies earlier. Quota/connection failures preserve the browser composer and never disable the manual planner. Session-only conversation is held only in the current tab and is not persisted or exported; usage counters still apply. No background AI calls run.

## Release validation

120 PHP checks, 18 hosted privacy/persistence checks, local browser reviewed-task apply/undo, desktop and mobile layout checks. Live Google/model/quota evaluation requires the owner's private connection. Fixtures are injected only by the local WASM test server, never by a public endpoint or production flag.

## Rollback

Restore the prior code release. Leave the additive life_ai table and private configuration intact. The manual planner has no dependency on Gemini availability.
