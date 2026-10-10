# Phase 1A release checkpoint

Baseline deployed public site: cb275059b6726811d6366a47cc61f33dec44762f.

Implemented isolated owner login, persistent board, lists, tasks, notes/checklists/labels, priorities/deadlines/blockers, ordering and movement, archive/restore, weekly goal and task selection, search/filters, JSON export and conflict recovery.

Validation passed:
- 24 PHP store checks and 22 PHP API security/persistence checks with PHP 8.3.
- 29 actual Hostinger MySQL/API checks: secure cookies, no-store/Cloudflare DYNAMIC, anonymous denial, CSRF, writes, stale-version conflicts, checklist IDs, movement/order, archive/restore, sprints, exports and cross-session persistence.
- Browser: 390px mobile editing/list selection/save, desktop drag from In Progress to Review followed by reload, search/priority filters, archive/restore and two-tab conflict/retry preserving the draft.
- Staging SQL data backup exported through phpMyAdmin, restored after mutations, and the original task notes recovered. Schema is retained in versioned source.
- Existing portfolio validator passed.

Staging uses dedicated lifestage database and isolated /life-stage/ application. Production uses dedicated lifeprod database. Their config files are outside public_html with permissions 600; no secrets are in Git. Migration version 1. The stage test account is never copied to production.

Deployment is authorized. Release checks and production owner initialization must be recorded after deployment. Real owner passphrase is entered by the owner. Private pages/API are no-store; static app assets use versioned URLs.

Recovery: docs/life-phase-1a.md. Local private backups/configuration are in workspace work/private-life (owner-only). Test harnesses are work/life-tools. Next bounded batch: calendar/goals/routines, then thinking system, AI, and business modules. Those later phases are not implemented.
