# Phase 1A implementation checkpoint

Baseline: cb275059b6726811d6366a47cc61f33dec44762f (deployed public site).

Implemented private owner authentication, versioned persistent board, task/list editing and ordering, checklists, labels, priorities, deadlines, blockers, archive/restore, weekly sprint selection and goal, search/filter, export, no-store responses, CSRF and login throttling.

Validation: 24 PHP store checks and 20 actual PHP API checks passed using PHP 8.3 WebAssembly and SQLite. Browser exercised owner setup, task creation/editing, checklist completion, refresh persistence, explicit list movement, weekly selection and sprint goal. Production MySQL, drag/drop, mobile, save-failure browser flows and backup restoration remain to be verified.

Hostinger PHP 8.3 confirmed. Dedicated lifeprod and lifestage databases created with separate users. Their configuration files are stored in the domain-level private directory outside public_html, with permissions 600. Secrets are excluded from this repository. Schema migration has NOT been applied on Hostinger.

This release candidate is not merged or live. Public site remains unchanged.

Next batch: apply schema on staging MySQL; upload isolated staging application; run complete acceptance workflows and backup/restore; merge only after release gates pass; run production migration and owner setup, then verify live cache/authentication. Real owner passphrase must be entered by the owner.

Local test harnesses: workspace work/life-tools/runner.mjs and api-test.mjs; provisioning credentials and setup keys are workspace work/private-life, owner-only permissions. These files are outside Git. No AI, calendar, goals or business modules included.
