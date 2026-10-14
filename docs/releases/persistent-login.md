# Stay signed in — 14 October 2026

Life now keeps this device signed in across app/browser closure. Existing authenticated sessions receive a device token automatically; email signup/login, legacy owner login and verified Google callbacks issue it immediately. The previous one-hour idle logout is removed. No passwords are stored in browser storage.

The first request after losing a temporary PHP session validates a separate HttpOnly, Secure-on-HTTPS, SameSite=Lax, host-only cookie and creates a fresh session ID/CSRF token for the same account. Device secrets are 256-bit random values; only their SHA-256 hash is stored. Account identity and credential fingerprints are checked before restoration. Logout revokes the current device row, destroys the temporary session and expires both cookies; other devices remain signed in. Deleted accounts and changed credentials cannot restore old device tokens. Existing partner restrictions and push cleanup on logout remain intact.

Cookie/device expiry is one year, renewed on activity at most daily. Browser data clearing, OS eviction, browser cookie restrictions, expiry after extended non-use and security/account changes can require a new login. Do not promise authentication can survive cleared site data. The privacy page explains necessary persistent login cookies.

The standard JSON client retries an explicit CSRF-session-change rejection once, after fetching the fresh authenticated session, with the original draft intact. It does not retry other permission failures or failed writes. Server CSRF validation still runs before mutations.

Migration: CREATE TABLE IF NOT EXISTS life_device_login in remember.php, matching the app's existing idempotent table setup. No planner records change. Anonymous visits do not receive a device login. Existing session credential checks remain. API replies remain private/no-store and PWA caches remain public-only.

Verification: 26 device-token tests, 12 actual-API cookie/login/reopen/logout tests in an isolated PHP runtime, 22 email-account tests, 22 account-isolation tests and 19 reminder/editor tests passed; all PHP parses. Reopening was simulated by removing the temporary session cookie while retaining the persistent cookie; the correct private planner returned without a password, and reusing the saved token after logout was rejected. This does not claim a physical iPhone test or production Google sign-in test.

Release cache: app 59. Rollback code checkpoint: 2a412a023503c4529aa09749e423be9663882310. The device-login table may safely remain if code is rolled back; no schema destruction is needed. Keep backups and do not log cookie values, passwords or raw secret hashes. Deploy through GitHub master to Hostinger.
