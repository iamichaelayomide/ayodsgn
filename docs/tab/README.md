# Tab team workspace

Tab runs at `tab.ayodsgn.com`, from the same Hostinger `public_html` deployment as the portfolio and Life. The root rewrite routes only the Tab hostname to `tab/index.php`; personal Life routes are forbidden on that hostname.

## Data and access

`api/tab/team.php` creates additive `tab_workspace`, `tab_member`, `tab_event`, and `tab_bridge` tables in the existing database. It does not read or migrate personal planner state. The first team has six pending memberships; only verified Google identities for the two configured initial admins can activate themselves without an invitation. Other members need an unexpired email-bound invitation plus a matching signed-in account.

The `tabteam` cookie is host-only, HttpOnly, Secure on HTTPS, SameSite=Lax, with a 24-hour idle limit and seven-day absolute lifetime. Identity removal or credential changes invalidate the session. Team access is rechecked on every read/write. A two-minute one-use sign-in bridge lets Tab reuse Life identity without sharing personal data or cookies. The browser binds it to a ten-minute sign-in state. The bridge is minted only by the authenticated Life API with its CSRF check; Tab consumes it with its own CSRF and state checks. Google callbacks stay on the existing authorized Life URL.

All mutations use a transaction and compare-and-swap workspace version. Membership changes and audit entries commit with the state change. Requests carry `{version, action, args}`. A stale version returns 409; the editor retains the draft and offers refresh. Activity is paginated in groups of 50, globally or per item. No endpoint accepts a caller-selected workspace.

Only an admin can move a task from Review to Done. No role can create directly in Done. Material edits to completed tasks reopen Review. Roadmap and goal edits are collaborative. Comments and activity stay attached to archived records; archived views support restoration.

## Deployment and invitations

1. Merge the verified branch through the existing GitHub → Hostinger deployment.
2. Add `tab.ayodsgn.com` to the existing website, using the same `/public_html` folder. Verify DNS and HTTPS. No separate Google callback registration is needed.
3. Sign in to Tab with one of the two initial admin Google accounts. This creates the isolated team and activates that admin.
4. Prepare invitations in Members. Review the recipient, role and final message before sending. Preparing a replacement revokes the previous link. Invitations expire in seven days; raw links are returned once and never stored in the audit log.
5. Verify the blank board, five blank roadmap slots, goals, members and audit. Do not populate production with test tasks.

The first version deliberately has no email-send endpoint. Invitation messages must be sent only after explicit batch review. No invitations are sent by deploying or signing in.

## Verification

`tests/tab-team.php` exercises permissions, task approval/reopening, conflict handling, invitation binding/expiry, one-use bridges, parent goal periods, roadmap icons/order, audit and workspace isolation. Run with PHP 8.3 and PDO SQLite. Existing `tests/life-accounts.php` and `tests/life-security.php` cover unchanged account and planner isolation.

Browser verification uses a disposable SQLite database and exercises real Tab PHP endpoints, forms, comments, admin/member identities, invitation previews and desktop/320px/390px layouts. Physical phone keyboard/safe-area verification remains a hardware check.

Rollback: revert the source commit to disable the feature. Leave additive Tab tables intact to retain team data. Do not delete personal or team tables during rollback.
