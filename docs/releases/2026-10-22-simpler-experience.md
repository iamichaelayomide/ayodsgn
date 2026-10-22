# Simpler Ramble — 22 October 2026

## User-approved scope
See docs/feedback/2026-10-22-simpler-experience.md for feedback capture and competitor sources. User confirmed Week is the shortest goal period and authorised live deployment.

## Changes
- Board/List only for goals; task board now also offers a vertical List. Search and period filters remain available, with task periods moved under Filters.
- White plus on blue. Contextual menu shows only Task/Goal on planner pages and Opportunity/Group in Opportunities; no Create something heading or descriptive paragraphs.
- Short task form and optional More details. Goals show title, period and calendar; extra links/status/measurements are under More details. Friendly week/month/quarter dates, calendar selection normalized to Monday for weeks.
- New daily goals rejected by the shared validated engine, including AI paths. Existing daily goals remain editable/restorable; no stored records deleted.
- Opportunities opens on groups named by the user, then optional folders and opportunities. Main tabs and predefined type dropdown removed. Existing trackers/categories/IDs map directly to these labels. Documents stay available inside each group/folder.
- Primary palette blue/white on neutral gray. Subtle workflow accents, pink retained only as an Idea Box cue. Cards/fields use white surfaces. Reduced instructional prose.
- Long chat title keeps a compact single-row header. Rename/Archive float in a dismissible top-layer menu without growing the toolbar. Attachments, drafts, native voice, account permissions and save receipts retained.
- Fixed an existing task-date handler error caused by reading labels from an input enhanced to hidden; dates/reminders reopen normally.

## Verification
- 19 existing PHP suites passed; all PHP sources parsed.
- Goal model:83 checks passed, including weekly minimum and legacy daily edits. UI period helpers tested across month/year boundaries.
- All ordinary JavaScript suites passed. Two provider/live voice integration scripts require a configured disposable voice driver/WAV and were not run for this UI release.
- Site validator passed after materialising unchanged tracked files missing from the sparse local checkout. Normal checkout build failure (missing projects/index.html) was a checkout limitation, not an ignored product failure.
- Browser staging:390px and320px layouts, task creation, goal creation, calendar week/month selection, contextual +, group→folder→opportunity save, scoped documents, long chat title/options and back/breadcrumb flows checked.
- Actual synthetic TXT upload through the browser succeeded. Long filename wraps; Download/Use as base/Google Doc actions fit within the mobile card without horizontal overflow.
- Independent review caught mobile List being overridden by an older important flex rule. Reproduced the failure; corrected override; browser confirmed stacked350px columns and390px document width.
- Final physical iPhone/Android keyboard/drag and real-microphone checks remain unperformed; desktop responsive testing is not device proof. No claim of universal novice usability without usability testing.

## Data and rollout
No SQL migration or record rewrite. Preserve existing kinds, groups/folders, documents, receipts, chats and external connections. Backend change only prevents creation/conversion into new daily goals. Provider/billing/login configuration untouched. No SSH access changes.

Scoped GitHub→Hostinger release. Rollback checkpoint:faeab45db1d2a390ecc4310f1c3513a6b937b092, tree6aa2127f2c209766662daa7813a3ea1034489986. Restore changed paths in a new commit; do not revert user records. Asset versions app73, applications7, companion58, goals8, polish45, task-editor3, planner-interactions2; new simple-ui1, updated applications6/chat-mobile7/goals2 styles.
