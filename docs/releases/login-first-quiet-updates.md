# Login-first onboarding and quiet updates — 14 October 2026

Correct the branding scope: ayo.ramble is only the signature in the desktop onboarding art panel. Mobile returns to an unbranded form; installed-app and policy display names remain Life. Existing account data, saved device login and app identity are preserved.

Login is the default, including the initial server-rendered markup. Create an account switches to signup; explicit ?auth=signup still opens signup. Consent remains above the CTA and gates both email and Google methods. Tightened the OR divider spacing and removed the onboarding install link; browser/home-screen installation and the sidebar option remain available.

No update banner is created. Startup explicitly checks the existing root worker; updates activate and reload automatically when the current tab has no open form/call, unsaved input or in-flight save. A two-second idle check applies deferred updates. If work begins during activation, reload waits until that work closes. Other tabs are not forcibly reloaded. Page lifecycle/visibility handling resumes checks after a back-forward cache restore. Offline cache version advances to life-public-pwa-v3.

Verification: 42 PWA checks pass and JavaScript parses. Mobile browser fixture shows Welcome back first, no wordmark/install/update control, checkbox above inactive CTAs, and working signup switch with consent enabling both signup methods. Isolated real-worker fixture: waiting update stayed pending with an active test-call dialog and no banner, then automatically activated after finishing. This is a browser simulation, not physical-phone testing. No real signup or Google flow was submitted.

Cache versions: app 61, CSS 62, auth entry 4, accounts 49, PWA client 5. Rollback checkpoint: 72e340851df20827e3a8c414190d7f8161a309e7. No database changes.
