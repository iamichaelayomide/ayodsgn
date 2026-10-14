# Life phone installation

## Release

Online-only PWA. Canonical identity, launch address and scope are `/`; display is standalone. Existing planner storage, accounts, OAuth configuration and AI behavior are unchanged. No database migration or raw audio retention change.

The existing favicon vector is rasterized as a white mark on opaque Life blue: 192 and 512 normal icons, a 512 maskable icon with a smaller safe-area mark, and a 180 Apple icon. Metadata covers Apple app launch and phone safe areas. Install Life appears in the sidebar and sign-in page, opens a captured native install prompt where available, otherwise gives installation instructions. Controls are hidden in standalone mode. Browser fullscreen alone does not count as installation. There are no automatic install or notification permission prompts.

## Privacy and worker transition

`/life/reminder-sw.js` now registers at root on application startup, independently of notification consent. The server permits root scope with Service-Worker-Allowed and supplies no-cache worker/manifest headers. Preserve Options -Indexes and DirectoryIndex index.php.

The explicit cache allowlist has exactly six files: offline.html, offline.css and the four PNG installation icons. Installation fetches omit credentials and reject redirects, unexpected MIME, non-success, private and no-store responses. All app HTML, app code/styles, authentication, API responses, attachments and AI remain network-only. Failed navigation returns the public offline page. There is no offline save queue.

Legacy `/life/` registrations remain push-only. Existing legacy subscriptions are reused; new subscriptions use the root worker. Disabling notifications and logging out revoke all matching worker subscriptions on this device. Server unsubscribe is account-scoped; browser unsubscribe is still attempted when the server cannot be reached. If device revocation fails, logout warns the user. Notification clicks open `/` plus only a validated task ID, never arbitrary payload URLs.

## Updates

Later workers wait for explicit Update Life. Saving, an open form/voice dialog, dirty sprint goals and unsaved visible form input prevent reload. If work starts while activation is occurring, Reload Life waits for a later safe click. Only the requesting tab reloads. Future public asset changes must increment PUBLIC_CACHE in reminder-sw.js. Cleanup removes only older life-public-pwa-* caches. Do not broaden the allowlist to application documents or API content.

## Verification

- 42 deterministic PWA checks: manifest/icon dimensions, root and legacy worker behavior, exact cache contents, network-only routes, offline fallback, update activation/cleanup, notification navigation, device unsubscribe despite server failure, installation instructions.
- Existing PHP suite: 22 account isolation and 19 reminder/editor checks; all PHP files parse.
- Isolated Chrome browser: real root worker activates, diagnostics show only six public cache entries; install instruction dialog opens only on click; waiting update shows Update ready; unsaved draft survives attempted update; clearing the draft allows explicit activation; stopping the local server produces offline launch; Try again returns to sign-in after reconnection.
- Narrow 390 px desktop browser simulation: offline layout has no horizontal overflow and Try again is 48 px high; sign-in remains a single column. This is not a physical phone test.
- Actual Android Chrome/iPhone Safari install, virtual keyboard, microphone and real push delivery require physical devices and are not claimed as tested here. Existing login/OAuth paths are unchanged; no Google consent test was run.

## Deployment and rollback

Deploy changed public assets, HTML metadata and server header directives through existing GitHub master → Hostinger workflow. Confirm live root page, manifest MIME and canonical identity, Service-Worker-Allowed: /, worker no-cache, four PNGs and online-only behavior. Pre-release code rollback checkpoint: 5dfa03f55a76d113cb0b846453cbea1914c8b517. Roll back by creating a new forward commit restoring those files; if clients already installed the worker, ship a new waiting worker with a higher cache version and retain root scope/notification support rather than orphaning installations. Account data requires no rollback.

## Phone installation

Android: open https://life.ayodsgn.com/ in Chrome; tap Install Life or Chrome's Install app menu, then confirm.

iPhone: open the same address in Safari; Share → Add to Home Screen; keep Open as Web App enabled if offered; Add.

Internet is needed for planner edits, calendar sync and Ramble. Notifications retain their separate explicit settings toggle.

Hostinger overrides expiry headers for static JavaScript. Root registration therefore uses `/life/pwa-worker.php?v=1`, a public, session-free wrapper which emits the existing worker source with explicit no-store/no-cache and root-scope headers. The original reminder-sw.js remains for legacy subscriptions. Subscription matching accepts both same-origin worker paths, with queries ignored. App version 57, accounts 47 and PWA client 3 avoid older cached imports.
