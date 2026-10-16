# Applications audit fixes implementation plan

> **For agentic workers:** Use executing-plans task-by-task with regression tests and independent review.

**Goal:** Prevent stale Applications responses from changing a new session, preserve newer saves, and update navigation immediately when opening a record.

**Architecture:** Keep the existing client. Bind asynchronous requests to a reset lifecycle; invalidate outstanding reads when state changes. Notify the existing navigation callback on detail opens.

**Tech stack:** Browser JavaScript, Node assertions, PHP/SQLite regression tests.

**Spec:** User requested relevant Superpowers workflows, tests and fixes; findings reproduced by independent code review.

## Constraints

Preserve planner data and existing APIs. Do not claim live Gemini or physical-device verification from deterministic tests. No speculative redesign.

## Tasks

- [x] Add failing real-client deferred-response tests for sign-out and save/read ordering.
- [x] Guard request/upload completion and failures after reset; reset locks without allowing an old finally to unlock a new save.
- [x] Invalidate refreshes on successful writes.
- [x] Test and fix immediate breadcrumb notification on detail open.
- [x] Run deterministic JavaScript and PHP tests, build validation and isolated HTTP checks. Browser confirmed detail breadcrumbs and Back. Live Gemini and physical-device checks remain unverified.
- [x] Request independent final review and document evidence and remaining verification limits.
