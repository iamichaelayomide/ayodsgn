# My Life — phase 1A

Private board and Monday–Sunday weekly planning at `/life/`. No AI or third-party database. The existing public portfolio is unchanged.

## Hostinger setup

1. Create dedicated production and staging MySQL databases/users. Keep their passwords outside Git and chat history.
2. Create `private/` beside `public_html/`, not inside it. Restrict access to the hosting user. Create `life-config.php` there, with permissions 0600:

```php
<?php
return [
    'dsn' => 'mysql:host=localhost;dbname=YOUR_DATABASE;charset=utf8mb4',
    'user' => 'YOUR_DATABASE_USER',
    'password' => 'YOUR_DATABASE_PASSWORD',
    'setup_token_hash' => 'SHA256_OF_A_RANDOM_ONE_TIME_SETUP_KEY',
];
```

3. Generate a cryptographically random setup key of at least 32 bytes through a private server/local command. Only its SHA-256 hash goes in the configuration. Keep the original key private for the owner's setup form. Never place either database credentials or the setup key in a URL, repository, screenshot, or public directory.
4. From `public_html`, run `php scripts/life-migrate.php`. If SSH is unavailable, import `api/life/schema.sql` once through phpMyAdmin and add migration version 1 to `life_migration`. The SQL is a new-database initialization; do not repeatedly import the index statement.
5. Open `/life/`, enter the setup key and choose the owner passphrase. Setup cannot run again after the owner row exists. No public signup is provided.
6. Verify authentication, writes, logout, and caching on the staging MySQL database before switching the configuration to production. Never copy test owner credentials into production.

PHP 8.3, PDO MySQL, JSON, and sessions are required. The config path defaults to `public_html/../private/life-config.php`; CLI deployments may override it with `LIFE_CONFIG_PATH`. Preserve private configuration and database contents across Git deployments.

## Data and APIs

The version-1 database contains a singleton owner, a board document, login-attempt records, and a migration ledger. Board/list/task/checklist/sprint records have stable IDs inside the document. Labels belong to task records; sprint task IDs reference existing tasks. This deliberately small first-release model supports transactional updates and later additive migrations.

`GET /api/life/?action=session` reports authentication/setup status and the session CSRF token. Authenticated `board` reads return `{version,state,week}`. Authenticated `export` returns the same records in a downloadable versioned JSON envelope, excluding credentials and login attempts.

POST requests require JSON and `X-CSRF-Token`. Actions: `setup`, `login`, `logout`, and `mutate`. Mutations use `{version,action,args}`. Board actions include `task.save/move/archive/restore`, `list.save/move/archive/restore`, and `sprint.save`. A compare-and-swap version prevents stale writes. HTTP 409 keeps the browser draft intact and requires loading the latest version. Task creation and sprint membership update in one transaction.

Completion is defined by the initial completion list's stable `isDone` marker, not its editable display name. The completion list can be renamed/reordered but not archived. Lists with active tasks must be emptied before archiving. Archived tasks retain historical sprint membership. New weeks do not auto-copy unfinished work.

## Security and recovery

Passwords are hashed using PHP's password hashing API. Sessions rotate after login/setup, expire after one hour without activity, and use HttpOnly/SameSite cookies with Secure enabled on HTTPS. Credential changes invalidate existing sessions on the next API request. Login throttling limits attempts per address and globally in a rolling 15-minute window; private responses emit no-store for browser and CDN caches.

To recover the owner's password, the owner runs `php scripts/life-recover.php` through the hosting terminal and enters a new passphrase interactively. This is deliberately not a public reset endpoint. Database backups are the recovery mechanism for data. JSON export is portable data; it is not an unauthenticated import mechanism.

## Backup and rollback

Before production migration/deployment, export the dedicated MySQL database through Hostinger/phpMyAdmin. Confirm a restore into the isolated staging database, compare owner/board versions and task counts, then test login and a read. Keep backups in private hosting storage; never in `public_html` or Git. Verify Hostinger daily backups include the new database.

Revert application code to the previous release to roll back a deployment. Never delete the production database or its private configuration as part of rollback. Phase 1A makes no destructive schema changes.

## Test commands and release gate

Run `php tests/life-store.php` on PHP with PDO SQLite for the deterministic store suite. Run the same API/browser acceptance flows against staging MySQL before production. Run the public site's existing validation as a regression check.

Release gate: login/setup/CSRF/logout/throttling; cross-session persistence; task/list ordering; explicit move and drag; search/filters; checklist IDs; archive/restore; weekly goal and selection; conflict/draft preservation; export; backup restoration; desktop/mobile; no public-page regression; private no-store headers on the real Cloudflare route.

Next batch after verified phase 1A: calendar, goals, multiple boards, recurring tasks, private attachments, and reviews. Mind maps follow, then typed/voice AI, then CRM/invoices/blog. Do not label these later phases as implemented.
