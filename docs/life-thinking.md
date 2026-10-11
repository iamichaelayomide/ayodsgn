# Manual planner release: thinking and continuity

The planner now includes private notes and an Ideas Inbox, one-time conversion of ideas into linked tasks or goals, a mind map with typed nodes, optional linked records, grouping labels, persistent drag positions, connections and a phone-friendly outline. Templates create boards or apply weekly intentions and review prompts. Tasks have dependency lists with cycle validation. Recent activity records who changed what, and when (latest 2,000 events).

Accountability reads cover the whole planner; partners cannot edit notes, maps, dependencies, templates, files or exports. All new mutations retain version-conflict protection. Owner uploads accept JPEG, PNG, WebP, PDF and plain text up to 5 MB each. Files live in private/life-files, outside public_html and Git. Staging uses private/life-stage-files. Downloads revalidate the current session, use attachment disposition and no-store headers. No audio or AI is involved.

JSON export includes all manual records. Full backup downloads a ZIP with planner.json plus files/<attachment ID>, including archived files. Calendar export downloads an authenticated, read-only .ics for dated tasks; it is not a public subscription or two-way Google sync.

## Recovery

Back up before every release. Keep the ZIP private. For recovery, take a fresh backup first, validate format=ayodsgn-life and schema=1, then restore planner.json.state into life_board.state using hosting database administration, increment life_board.version, and copy files/<32-character ID> into private/life-files with private file permissions. Preserve life_owner and life_partner tables; exports contain no credentials or invitation secrets. Keep accountabilityEnabled=true when any partner has previously accepted. Do not extract arbitrary archive paths into public_html. Recovery is a hosting administration procedure, not a public import endpoint.

Local tests restore a complete exported state into a disposable database. Hosted tests compare every exported state record and file byte to the ZIP snapshot. Production uploads and backups survive Git deployment because private/ is not replaced.

## Release checks

90 PHP checks; 17 hosted thinking/file/backup checks; 14 hosted partner checks; 23 hosted board/routine checks. Desktop and 390px phone workflows verify owner login, navigation, thought capture, idea conversion, map editing, outline, and private attachments. Final production smoke results and release commit are recorded in the continuation checkpoint.

## Phase two boundary

Manual workflows work without AI. No AI keys, providers, billing, microphone access or model calls have been introduced. Next bounded batch is Phase 2A: typed conversation, explicit editable memory, relevant record retrieval and reviewed proposed changes. Native two-way voice follows after text and memory tests.
