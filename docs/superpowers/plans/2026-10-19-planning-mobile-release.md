# Planning and mobile release implementation plan

> Use superpowers:subagent-driven-development with isolated module ownership, regression tests, module review and final review.

Goal: implement all approved planning feedback plus mobile chat/task/attachment/AI improvements and deploy.
Architecture: extend existing PHP state and vanilla JS; additive fields, existing receipts and transactions. No framework/provider migration.
Spec: docs/superpowers/specs/2026-10-19-planning-mobile-release.md

- [x] Task 1: backend goal hierarchy, structured key results, safe defaults/limits, daily type, status/progress mode. Tests in new PHP suite plus existing regressions. Files api/life/store.php and dedicated helper.
- [x] Task 2: goal views/editor/progress plus board integration API. Files life/goals.js, new goals.css/helper/tests, goal dialog markup only in life/index.php.
- [x] Task 3: mobile companion composer/navigation/attachments and state preservation. Files life/companion.js, chat-mobile.css, chat-files.js and associated JS tests.
- [x] Task 4: task add readiness, sidebar gestures/global +, virtual This week task lane, task/goal board toggle; integrate module hooks. Files life/app.js/life.css and dedicated interaction module/tests. Index markup coordinate after Task2.
- [x] Task 5: AI schema/context/new goal operations and natural follow-up regression fixes. Files api/life/ai.php, chat-context.php, commands.php, tests.
- [ ] Task 6: full tests, independent review/fixes, versions/docs, scoped release, live checks and cleanup.

Review focus: existing quarter goals exceeding new limit are not lost; blank/negative/greeting messages cannot approve prior changes; failed sends retain files/draft; scroll/selection survives upload and message completion; This week does not change due dates or custom lists; partial saves are rolled back and receipts match state.
