# Task editor and push reminders

Icon-only task actions preserve accessible names. Descriptions use locally pinned Quill 2.0.3 with a neutral editing surface and a focus-only toolbar. Plaintext remains the canonical AI/export description; a server-validated Delta preserves bold, italic, underline, headings, lists and HTTP(S) links. No embeds or HTML are accepted.

Dates use a branded calendar and DD/MM/YYYY entry. Due time and reminder offsets use Africa/Lagos. Reminders require a due date and time; completed and archived tasks are excluded. No recurrence was added in this release.

Push is opt-in per device. Service workers do not cache planner data. Subscription records and VAPID secrets stay server-side. Browser permission is requested only through Enable push notifications. On iOS/iPadOS, open the installed Home Screen web app. Unsupported/denied browsers retain in-app delivery while open.

Hostinger cron: run `domains/ayodsgn.com/public_html/scripts/life-reminders.php` every minute with PHP. CLI-only entry point installs checksum-verified Composer 2.8.12, pins minishlink/web-push 9.0.4 and persists its lockfile/vendor directory outside public_html. No scripts/plugins enabled. Setup lock and delivery lock prevent overlapping jobs. Ready status requires a recent scheduler heartbeat. Sending uses encrypted Web Push, unique per-device/task/schedule receipts, one-day catch-up, one-hour TTL, and expired subscription removal. Provider/network failures retry on the next run. The browser’s push provider receives encrypted notification payloads; task titles may appear on the device lock screen.

Rollback to previous deployed Git commit preserves task plaintext and private push credentials. Disable the cron when rolling back. Device permissions and actual closed-app notification delivery must be verified on physical supported devices.
