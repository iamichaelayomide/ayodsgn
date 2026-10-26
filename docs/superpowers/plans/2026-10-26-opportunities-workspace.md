# Opportunities Workspace Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task-by-task.

**Goal:** One concise company-first Opportunities experience with stable modal details and safe parallel-agent workflow preparation.
**Architecture:** Existing PHP/PDO tenant snapshot, vanilla JS UI, native dialogs, existing Life navigation. Backward-compatible fields and communication records; retain legacy applications behind a secondary link.
**Tech Stack:** PHP, MySQL, vanilla JS/CSS, Node tests, n8n JSON export.
**Spec:** docs/superpowers/specs/2026-10-26-opportunities-workspace.md

## Global Constraints
- No automatic sending, new credentials, accounts, deployments or irreversible data edits.
- Preserve existing tenant/session/CSRF/approval boundaries and portfolio.
- Company and role only on compact card; detailed evidence in modal.

## Review Focus
- Legacy snapshot missing new fields must load and remain editable.
- Long titles, missing contact details and unsafe URLs must not break display or execute content.
- Opening/closing/editing details must preserve list position and focus.
- Conflict must retain form; changed account clears private dialogs.
- AI profile activation is not acceptance; n8n export is inactive and not called connected.

## Task 1: Backend contract
- [ ] Add regression checks for optional company/contact fields, AI stages and communication provenance/deduplication; run red.
- [ ] Extend LifeAyoOS normalization/validation; run PHP suite.

## Task 2: UI and navigation
- [ ] Add browser regression for company-first cards, modal scroll/focus, concise status, safe links and old navigation compatibility; run red.
- [ ] Replace Ayo OS view with company cards and dialogs; add new field editors, copy/compose and structured email history.
- [ ] Merge sidebar entry, old hash alias, quick-add, keep legacy records/docs accessible; test integration.

## Task 3: Automation export
- [ ] Prepare importable disabled n8n bounded research workflow and setup documentation.
- [ ] Validate export and safeguards without executing live external actions.

## Task 4: Verification and delivery
- [ ] Run functional/session/navigation/PHP tests, inspect desktop/mobile in supported browser, independent review.
- [ ] Fix findings, create feature PR, attach and report exact remaining n8n setup blocker.
