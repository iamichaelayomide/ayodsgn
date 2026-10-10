# Boards and routines checkpoint

Adds multiple named boards with independent lists, daily/weekly/monthly recurring tasks, pause/resume, task effort in minutes, weekly capacity in hours, and quarterly reviews. Existing tasks and stable IDs are preserved. Today/calendar/goals and sprint selection operate across boards; the board selector determines which lists are shown. Weekly capacity measures the entire sprint and reports tasks without effort estimates.

Recurring rules create independent dated occurrences when the owner opens the planner, in batches of up to 100. A stable rule/date key and versioned transaction prevent duplicate generation. Monthly rules retain the starting day when possible and clamp to the last day of shorter months. Resuming skips paused dates. Archived destination lists pause generation until restored. There is no background cron or notification delivery in this release.

Verification: 40 existing backend checks, 18 accountability checks, 15 board/routine checks; 22 existing API security checks from the accountability release. Hostinger staging passed 23 workflow checks for board separation, effort/capacity, generation/deduplication, pause/resume, quarterly reviews and export. Browser flows covered creating boards, routine generation, effort estimates, weekly capacity, quarterly review, and 390px mobile fit/navigation.

Schema: existing versioned JSON gains boards, routines, effortMinutes, sprint capacityMinutes and quarterReviews. No new SQL tables beyond the previously deployed life_partner table. Authenticated JSON export includes all new manual records; partner credentials remain excluded. Private production backup exists outside Git. Temporary staging application is removed on production release.

Remaining Phase 1B: private attachments and attachment backup/restore coverage. Phase 1C has NOT been implemented: notes/Ideas Inbox, mind map, conversion links, templates, task dependencies, activity history, full backup/export coverage and read-only iCalendar export. AI/voice and business modules remain deferred.

Next bounded batch: authenticated attachments with private storage, upload validation, owner/partner download checks, backup and restoration tests. Then implement Phase 1C module by module. No public registration, external notifications or AI billing.
