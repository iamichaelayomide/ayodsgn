# Ayo OS initial module — 2026-10-25

## Verified source

This repository contains both the public portfolio and the private Life app. The root `.htaccess` maps `life.ayodsgn.com` to `life/index.php`, with backend routes under `api/life/`. The public homepage is the portfolio. Only Life files, tests and documentation change.

The referenced ChatGPT chat was read, but its assistant responses are cached reference placeholders. Its full earlier architecture could not be recovered. The available brief is the current request and supplied Ayo outreach strategy.

## Included

- Owner-only Ayo OS sidebar entry and `#ayo-os` entry point, using Life session, CSRF, request helper, navigation and design tokens.
- Overview, separate NYSC/Freelance/Career filters, opportunity details/stages/follow-up dates/material references.
- Companies and up to two contacts per company, professional contact source URLs.
- Research notes with explicit cited-observation or hypothesis labels. A citation is not a claim that the system independently verified the content.
- Editable subject/body drafts linked to the correct company's contacts and opportunity research.
- Review Queue, explicit recipient/content/materials/schedule checkbox, approval/rejection history with actor, timestamp, fingerprint and immutable snapshot.
- Approval becomes stale after company/contact/opportunity/research/draft changes. Approval never marks an opportunity sent.
- Separate tenant-keyed versioned PDO snapshot; existing planner and application records remain intact. Ayo OS is included in JSON export and full ZIP backup.
- Stale saves preserve the form. Mutations are pinned to the loaded workspace, so CSRF retries cannot replay into a different signed-in account. Focus/visibility checks clear cached records when session identity changes; logout/401 clear records and invalidate pending responses.

There is no sending endpoint, provider integration, external scheduler, automatic follow-up, URL fetcher or autonomous agent. Research and draft authoring are manual in this initial MVP. Existing Opportunities/document/AI tools remain available via the link. CV/portfolio materials are versioned references entered by the user, not new generated CV files; the user reviews their actual documents before approval. No CVs or recipient addresses are fabricated.

## Database / release

The idempotent migration is `api/life/migrations/ayo-os.sql`. The constructor runs the same CREATE TABLE IF NOT EXISTS pattern as LifeApplications; each account gets an empty snapshot on first use. No existing records are migrated or seeded. The database account needs the existing CREATE/INSERT/UPDATE privileges. Apply and verify on private staging before production; no production deployment or migration was performed in this task.

Rollback removes the navigation/module/API changes while retaining the table for recovery. Do not drop the table as part of rollback. Private JSON export contains the full Ayo OS snapshot and ZIP backup contains `ayo-os.json`; no new restore UI is introduced.

## Verification

- New PHP suite: 26 checks passed for persistence/readback, tenant isolation, stale saves, HTTPS/email/stage/timezone validation, sourced observations, approval prerequisites, exact snapshots, rejection history, edit invalidation and cross-account workspace guard.
- PHP regression files: 22 passed out of 23, using isolated PHP 8.3.33 WebAssembly with SQLite. `life-chat-attachments.php` could not complete because it requires real multipart upload fixtures not supplied to the runner. No app dependencies changed for the runtime.
- JavaScript files: 20 existing/new unit scripts passed. Two existing live tests, `life-live-client.mjs` and `life-live-audio.mjs`, require disposable staging credentials and audio fixtures and could not run.
- Browser fixture test passed in headless Chrome: escaped hostile text, form preservation after conflict, exact review payload/workspace identity, 390px layout, cross-account cache cleanup, and navigation among Ayo OS/Board/existing Opportunities in the full Life page. Browser API responses are fixtures; this is not a live MySQL end-to-end check.
- Site validator, changed PHP syntax parsing, JS syntax checks and whitespace check passed.
- Independent read-only review identified a cross-tab account-switch replay risk; fixed with server workspace guard, pinned client payload, lifecycle cleanup and regression checks. No other important findings.

Before merge/release: run the new SQL and full browser/API flow against private staging MySQL; supply the existing multipart/live-audio fixtures if those integrations are to be released at the same time. Verify real account login, save/reload, approval invalidation and backups. Nothing has been sent, scheduled externally or deployed.

## Reproduce

With PHP 8.3 plus PDO SQLite: `php tests/life-ayo-os.php`.
With Node: `node tests/life-ayo-os.mjs` and `node scripts/validate-site.mjs`.
Browser: install/use Playwright outside production dependencies, then run `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/life-ayo-os-browser.mjs`. Optional `CHROME_PATH` overrides the Chrome executable; optional `AYO_SCREENSHOT` writes a mobile fixture capture.
