# Simpler Ramble — user feedback and release direction

Approved request: implement and deploy the simpler web/mobile experience, retaining existing data.

## What the user asked to change
- Goals: only Board and List; remove Cards. Less explanatory text, remove redundant status actions, fix Start wrapping and squeezed inputs. Put advanced options under More details.
- Creation: white plus on blue; remove Create something heading and long descriptions. Board/home offers Task and Goal; Opportunities offers local creation choices. No voice/note/opportunity choices in the main planner add menu.
- Opportunities: remove confusing top-level Opportunities/Trackers/Documents tabs and predefined Jobs/Education/Custom type selection. User names groups and optional folders: e.g. Jobs → Research / Marketing → opportunities. Landing screen shows groups/counts; search across opportunities; documents remain accessible inside each group.
- Forms: common fields first; optional fields folded away; fewer steps and plain words.
- Visuals: white writable fields on neutral gray; blue/white primary palette. Keep a subtle Idea Box pink cue; muted status accents rather than saturated full columns. No pink task-card backgrounds by default.
- Fix mobile/desktop compression, clipped files, wrapping controls and long chat title/options menu. Preserve sticky navigation, drafts, selection, uploads, permissions and verified AI actions.
- Confirmed: Week is the shortest new goal period. UI and validated API reject new daily goals; existing daily records remain editable. New goals default to Week.

## Research and applied principles
- Todoist Quick Add: start with task name; reveal optional details/actions. https://www.todoist.com/help/todoist/features/use-task-quick-add-in-todoist-va4Lhpzz
- Todoist boards/list: distinct views of the same work. https://www.todoist.com/help/todoist/features/use-the-board-layout-in-todoist-AiAVsyEI
- Teal: saved opportunities and application-stage progression. https://help.tealhq.com/en/collections/9568977-job-tracker
- Huntr: documents categorised and accessible alongside job tracking. https://help.huntr.co/en/articles/10089169-contacts-and-documents
These support reducing initial choices and retaining optional depth; the requested named-group hierarchy is Ramble's own design, not a claim copied from competitors.

## Implementation boundaries
UI terminology maps to existing tracker/category storage; no SQL/data migration or deletion. New named groups use existing custom kind internally, with no type question presented. Legacy kinds and IDs preserved. Provider/billing/login unchanged. Parallel ownership: goals, chat, applications; root integrates contextual creation, task board/list, forms, shared styles and verification.
