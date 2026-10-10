# Phase 1B, first batch: Today and calendar

Adds Today and day/week/month calendar views. A task's deadline remains `dueDate`; its optional `schedule` is `{date,time,minutes}` using Africa/Lagos local time. There is one work block per task in this batch. Scheduling, rescheduling and removal use authenticated, CSRF-protected `task.schedule` mutations with the existing version conflict protection. Existing records without `schedule` remain valid.

The calendar renders the same tasks as the board. Dragging an entry to another date changes only the planned work date. On phones, use Plan time/Edit work block; month and week grids scroll inside their panel. Today groups unfinished tasks into scheduled today, due today and overdue deadlines. A task may appear in more than one group when relevant; these are references to the same record.

No SQL schema migration or new credentials are required. Backup before release and retain the previous code revision for rollback. Export includes schedule fields automatically. An old frontend can still edit existing tasks without deleting their schedules.

Validation: backend tests cover date/time/duration validation, day-boundary rules, conflict handling, schedule persistence, deadline independence and removal. Browser workflows cover scheduling, Today, day/week/month, responsive layout, board consistency and drag rescheduling. Staging uses the dedicated MySQL database and private staging configuration.

Remaining Phase 1B: multiple boards, goals/milestones, effort and capacity, recurrence, private attachments, and structured reviews. This batch does not include AI.
