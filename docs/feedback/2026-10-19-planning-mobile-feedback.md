# Planning and mobile feedback — 19 October 2026

Status: feedback captured and proposed design; no product implementation or deployment in this pass.
Source: three user-provided screenshots and the clarification “Four key results per objective.” The first screenshot is cropped at its bottom; text below its last fully visible message is not captured.

## Intended outcome

Give people a clear connection between long-term objectives and daily work, while allowing a lightweight independent workflow. Make the mobile app comfortable to navigate, add to and converse with. Keep the existing planner, accounts, AI receipts, partner permissions and history intact.

## Complete feedback inventory

| ID | Feedback | Required change / interpretation | Evidence or decision |
|---|---|---|---|
| G1 | Three quarterly objectives | Support up to three active objectives per quarter; explain the limit before creation, including through AI | Explicit feedback; limit scope proposed per personal workspace and quarter |
| G2 | Four key results below each objective | Up to four results per objective, not four overall | User explicitly clarified this |
| G3 | Metrics/results should be output-driven | Capture measurable evidence of success: baseline, current value, target, unit and direction; wording guidance focuses on delivered results | Explicit; outcomes versus activity must be distinguished |
| G4 | Monthly goals derive from key results | Link a monthly goal to a particular quarterly key result; show the parent objective in context | Explicit |
| G5 | Unlinked goals go to ad hoc; ad hoc is default | Default new goals to independent/ad hoc; preserve any chosen date or period instead of silently losing it | Explicit default; period-preservation design recommendation |
| G6 | Weekly goals are subsets of monthly goals, with independent work allowed | Optional weekly → monthly linkage; make independent goals easy to create and find | Explicit |
| G7 | Daily goals work similarly | Add daily goal support, with optional daily → weekly link and direct task links | Explicit; proposed immediate parent relationship |
| G8 | Goal views should include list/card and board | Provide Board / List / Cards views over the same goal records, with creation in each view | Explicit; no duplicated goal data |
| G9 | Switch between tasks and goals in the board | Add a Tasks / Goals switch to the board experience; keep selection visible and preserve each view’s filters | Explicit |
| G10 | Choose day/week/month/etc in either mode | Period and date controls apply to the selected entity; include quarter, day, week, month and all-time where meaningful | Explicit; task membership rules need a defined model |
| G11 | Search goals or tasks depending on mode | Search only the current entity/filter scope, with a clear no-results state and reset | Explicit |
| G12 | Idea Box is all-time | Keep unscheduled ideas accessible independently of period filters | Explicit |
| G13 | Add a This week list before In Progress | Provide a clear weekly commitment lane; preserve existing custom lists | Explicit; rollout must not overwrite an existing board |
| G14 | Linked completion should roll up automatically | Calculate progress from linked work without double-counting; support an explicit automatic progress mode | Explicit; measured key-result progress is separate from task completion |
| G15 | Users can skip links and move/complete goals manually | Provide manual goal workflow and progress/completion controls; linking remains optional | Explicit |
| M1 | Side navigation cannot be dragged; user must tap the top | Add mobile drawer swipe-open and drag/swipe-close, retaining the menu button and independent drawer scrolling | Explicit |
| M2 | Action button should be a plus opening a bottom sheet | Replace the global voice-only floating action with a context-aware + sheet containing quick creation actions and Talk to Ramble | Explicit; exact action ordering is a design proposal |
| M3 | Board screenshot shows a focused quick-add input with keyboard open | Review keyboard visibility, row alignment, add-button reachability, scroll stability and focus treatment on an actual iPhone | Visual follow-up; screenshot alone does not establish a keyboard failure |
| M4 | Chat screenshot shows focused composer, keyboard and large reply | Review compact composer spacing, attachment/mic/send alignment, one unclipped accessible focus indicator, message readability and stable scrolling | Visual follow-up; do not assume the pictured layout is a verified functional defect |
| A1 | AI recognises an already-saved opportunity and asks whether to update | Preserve duplicate-aware context and safe update clarification; accepting must update the right existing record, declining must not mutate | Observed existing behaviour worth preserving; not a request to remove the clarification |
| Q1 | “What’s a balanced scorecard?” | Explain the concept separately; do not silently add a new scorecard module | Question, not a confirmed feature request |

## Current implementation findings

- `life/goals.js` already supports quarterly, monthly, weekly and ad hoc goals, monthly → quarter / weekly → month parents, linked-task drill-down and task-based progress through descendants.
- It defaults to quarterly goals and renders cards. There is no goal board, list mode, daily type or structured key-result model.
- `api/life/store.php` validates the current goal types and parent relationships. Completion and partner approval restrictions must remain enforced server-side.
- `life/card-drag.js` already handles touch task dragging through the grip. Sidebar gestures must not hijack card dragging or horizontal board scrolling.
- The mobile sidebar is currently button-controlled. Its existing sticky positioning and independent scrolling should be preserved.
- `life/companion.js` already listens to the visual viewport for keyboard changes. Diagnose on-device behaviour before replacing it.

## Proposed product design

### 1. Goal structure

Quarterly objective → measurable key results → monthly goals → weekly goals → daily goals → tasks. Permit direct task links when the extra levels would add unnecessary work. Show the selected parent with enough context to distinguish similar names. Prevent cycles and invalid period relationships on the server.

Keep time period and linkage as separate concepts internally. An unlinked monthly commitment can appear under independent/ad hoc work while retaining its month. Avoid converting dated records into timeless goals. Use concise creation: title, period, optional parent; disclose metrics and other details when relevant.

The three/four limits apply to new active planning records. Do not delete or hide existing goals that exceed those limits. Existing records stay readable/editable; additional creation is blocked until the user resolves the excess. Archived records do not consume the active limit. Enforce the same limits in UI and AI transactions.

### 2. Progress and completion

Manual mode: move a goal or mark it complete explicitly, subject to current permissions. Linked-work mode: calculate progress from unique linked tasks and child goals. Make the mode and source of progress understandable. A parent with no linked work starts at 0%, not 100%.

Key results report measured progress from baseline to target, including decreasing targets. Completing tasks can advance delivery progress but cannot fabricate the key-result measurement. Show these separately. Do not average percentages over an empty set, count a task twice through multiple paths, or silently override an explicit manual completion. Reopened tasks/goals must recalculate linked progress consistently. Existing partner approval rules continue to govern final completion.

### 3. Board and goal views

Use a compact Tasks / Goals control, a period/date selector, search and a view selector. Do not stack several competing tab rows. Remember filters separately for tasks and goals and preserve them when navigating back.

Task board: retain Idea Box across periods; offer This week as a deliberate weekly commitment, then existing workflow lists such as In Progress, Review, Blocked and Done. Keep commitment week separate from a task’s deadline. A task can be overdue while still committed this week. Respect existing custom list order and names.

Goal board: workflow lanes act on goal status; period controls select the goals shown. Dragging changes status, not the parent, period or deadline. List/cards and board are presentations of the same records. Creation, editing and search work in every view. Keep manual and automatic goal behaviour visible rather than allowing contradictory drag results.

### 4. Mobile navigation and quick creation

Drawer: narrow left-edge gesture opens it; dragging the drawer or backdrop closes it. Reserve browser back navigation and avoid broad full-screen swipe capture. Respect vertical scroll, multi-touch, interrupted gestures and reduced motion. Keep keyboard/menu-button alternatives and focus restoration.

Global +: opens a short bottom sheet with New task, New goal, New opportunity, Note and Talk to Ramble; prioritise the current page’s action. Only show actions permitted for the signed-in role. Date/period defaults come from the current calendar or board selection. Use a desktop popover/menu for the equivalent action, preserving compact desktop controls.

Keyboard/focus: keep the focused field and submit action reachable, avoid page jumps and horizontal overflow, preserve the draft, and keep content above safe areas. Refine the heavy/clipped focus appearance without removing keyboard focus visibility. Keep animation brief, interruptible and purposeful; motion must not delay input or submission.

### 5. AI integration

Expose the new goal/result relationships, period selection, metric values and progress mode as bounded context and validated operations. Natural requests can create/link/update them within the same limits as manual UI. Never guess an ambiguous parent or invent a metric, target or saved result. A clarification can retain a pending request; a greeting such as “Hiii” must not approve it. Save confirmations still require committed receipts. Keep duplicate opportunity detection shown in the feedback.

## Delivery order

1. Mobile interaction pass: reproduce keyboard/focus issues, implement sidebar gestures and contextual + sheet; leave goal data unchanged.
2. Goal model: additive fields/entities, daily type, measurable key results, optional linkage and explicit progress modes. Preserve existing IDs and data with migration tests.
3. Unified views: task/goal switch, period scope, search, cards/list/board and This week commitment behaviour.
4. AI integration: extend search/context, typed validated actions, limits, clarification and verified receipts for the new model.
5. Staging and release: regression tests, live checks and a rollback checkpoint before a scoped production release.

## Acceptance checks

- Three objectives and four results per objective are enforced consistently, without removing older records.
- Independent/ad hoc defaults retain user-selected time periods; daily/week/month/quarter timezone boundaries work in Africa/Lagos and other account timezones.
- Parent cycles, cross-account links, ambiguous parents and invalid periods are rejected. Unlinking, archiving and restoring preserve data.
- Metric direction/baseline/target calculations, missing values and task roll-ups are correct; no duplicate task count or false outcome completion.
- Switching entity/view/period and navigating back preserves scope. Search and creation work in each view.
- This week commitment is separate from due dates; Idea Box and existing custom boards/lists remain accessible.
- Sidebar gestures do not break browser back, vertical scrolling, card drag or board swipe. Menu/keyboard alternatives remain available.
- iPhone Safari and installed PWA checks cover keyboard open/close, rotation, safe areas, draft preservation and visible submit controls. Android and desktop have separate checks.
- AI suggestion/discussion/greeting creates no changes; explicit requests and clarification follow-ups create the correct records once. Failed operations do not claim success.
- No raw private screenshots/documents are added to telemetry. Existing account, partner, reminder, sync, attachment and history tests still pass.

## Decisions to settle before implementation

1. Daily goal versus daily task: proposed support is a daily intention linked to tasks, not a duplicate task type.
2. Progress mode: proposed manual completion or linked-work calculation; measured results always require actual metric evidence.
3. Ad hoc presentation: proposed independent/ad hoc classification plus a retained time period, rather than discarding the chosen period.
4. This week: proposed separate weekly commitment field, surfaced as a board lane; migrate existing lists conservatively.
5. Balanced scorecard: explanatory only for now. It balances objectives and measures across financial, customer, internal-process and learning/growth perspectives; an OKR-style quarterly goal structure does not require adding it.

The quarterly result-count clarification is settled. The remaining items are proposed design choices, not claims that the screenshots explicitly specified them.
