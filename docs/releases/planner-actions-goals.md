# Board, calendar and goal controls — 14 October 2026

New task occupies its own full-width row on mobile board views. Desktop retains its compact button beside the board controls. Board actions are under the selector's menu; Archive board is hidden and disabled when only one board remains. Existing server last-active-board rejection remains unchanged, including for AI commands and direct API calls.

Calendar plus buttons in Day, Week and Month open the existing New task form with the selected date as dueDate. They remain enabled when there are no tasks. A New task button is also available above the calendar. Work-block planning remains separate and uses existing tasks.

Goals includes a Quarterly/Monthly/Weekly/Ad hoc/All selector. Populated sections show a compact New goal button; illustrations appear only for empty sections. Each goal shows linked-task percentage and expandable exact task names and statuses. Tasks under active descendant goals count towards the parent, archived goals/tasks are excluded, and each task can open its existing editor. Existing goal-type editing remains in the goal form.

Verification: 8 linked-goal progress checks, 40 storage checks and 19 board/public-voice regression checks passed; all PHP files parse and modified JavaScript parses. The real app was tested with a disposable storage-engine fixture in Chrome at 390 px and 1280 px: mobile full-width action, compact desktop action, hidden last-board archive, available archive with two boards, all three calendar modes and date prefill, creation from an empty calendar, weekly and monthly 50% progress with exact linked tasks, direct task-editor opening, illustrations absent when populated and present in an empty category. Browser simulations do not constitute physical-phone testing. No production tasks were created during QA.

Cache versions: app 58, CSS 59, goals 5, calendar 44, polish 44. Rollback checkpoint: 0384f461e5fab316b6ef4ce2c8eda16210e41a1d. No schema migration.
