# Google accounts and integration — implementation checkpoint

Approved requirements: Google-only public accounts; preserve legacy owner login/data; separate planner, AI, files, partners and push devices per account. Explicitly link owner Google identity while signed in. Dedicated Life Google Calendar and Life Tasks list; work blocks map to events and to-dos map to Google Tasks. Public AI: 50 text/Economy turns per user, 500 total daily, Lagos reset, native voice owner-only, no billing/fallback.

## Private configuration

Google OAuth is independent of the Gemini key. Create a Web application OAuth client in Google Auth Platform. Production redirect URI:

`https://life.ayodsgn.com/api/life/?action=google.callback`

Authorized JavaScript origin: `https://life.ayodsgn.com`.

Enable Google Calendar API and Google Tasks API. Use an External audience. Google sign-in asks only for basic profile identity; Calendar and Tasks are separate, optional consent steps. The app can be published for sign-in after account-isolation staging checks. Calendar/Tasks scopes require the applicable Google consent review before public connections are enabled. Do not enable billing.

Place the downloaded OAuth client JSON at `private/life-google/config.json`, then run `php public_html/scripts/life-google-setup.php` from hosting CLI. The setup command validates the exact production callback, writes mode-0600 PHP configuration, verifies the official Composer checksum, and installs the pinned `google/apiclient` version `2.19.4`. Composer's lockfile and vendor files stay outside public_html. Private config.php stores clientId, clientSecret, redirectUri, encryptionKey (base64 32 cryptographically random bytes), enabled (false until the OAuth client and sign-in consent screen are confirmed), and syncEnabled (false until Calendar/Tasks verification and remote acceptance checks pass). Never commit credentials or tokens.

## Current checkpoint

Implemented locally: account allocation and legacy linking; tenant-aware board/AI/Undo/partner/storage/push; per-account generation mutex; atomic public AI quota; OAuth code flow with state, nonce, PKCE and Google identity verification; encrypted refresh-token storage; separate Calendar and Tasks consent; synchronization worker with polling, mappings and conflict preservation. Local account-isolation and simulated sync suites pass; no live Google API acceptance check has run.

Public sign-in also requires public Privacy Policy and Terms pages at `/life/privacy.php` and `/life/terms.php`, policy links on the sign-in screen, and an account-scoped acceptance record. Acceptance is checked by the server on Google, legacy owner and invited-partner sign-in. Calendar and Tasks remain separate optional permissions; `syncEnabled` must remain false until Google scope review, real synchronization checks, and the scheduled worker are complete.

## Release notes — 12 October 2026

- Added Google account creation/sign-in and explicit owner-account linking while preserving the existing password login and planner records.
- Added account-scoped data access, public-account AI quotas, separate optional Calendar/Tasks connections, encrypted credentials, conflict handling, and per-account push delivery.
- Added account settings for workspace, timezone, Google connections, and device notifications.
- Added public privacy and terms pages, required sign-in acceptance, and versioned account-scoped acceptance records. Google passwords are never sent to or stored by Life; the existing legacy sign-in uses a separate passphrase hash.
- Verified PHP parsing, JavaScript syntax, account-isolation checks, partner checks, existing planner/AI/voice/reminder suites, and simulated Google synchronization including separate consent and reconnect after disconnect.
- Google sign-in may be enabled independently of Calendar/Tasks. Calendar/Tasks sync remains feature-gated; no live Google sync connection was enabled. Real OAuth, two-account staging, Google API sync, and device push delivery remain release checks.

## Release constraints

The local working tree includes previous deployed changes that are not reflected in its old baseline. Create a release based on verified current remote master and include only this feature diff. Back up the DB and private files first. Retain original owner ID 1 and all existing record IDs/versions. Do not deploy an incomplete public authentication path.
