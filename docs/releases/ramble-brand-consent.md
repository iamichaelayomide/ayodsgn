# Ramble branding and sign-in consent — 14 October 2026

The app display name is Ramble, with ayo.ramble on onboarding (ramble italicized). Desktop uses the art-panel signature; mobile has its own compact signature. Browser title, Apple install title, manifest names, install/update instructions, offline screen and policy-page display names use Ramble. Stable manifest identity, canonical domain, routes, cookie names, existing boards/account data and Google OAuth configuration remain unchanged.

Agreement is above the email CTA and both Google CTAs. All are initially disabled and remain disabled until consent is checked. Unchecking disables them again. Server policy checks remain intact. Owner recovery keeps its agreement visible. The linked-task disclosure uses an outlined task-stack icon with a smaller rotating chevron, replacing the native solid triangle.

Verification: 42 PWA checks, 8 goal progress checks, 22 account-isolation checks and 19 reminder checks passed; PHP and modified JS parse. Desktop/mobile browser checks: email/Google signup buttons disabled before consent, enabled after checking and disabled after unchecking; login variants remain disabled without consent. On 390 px mobile, agreement ends above the CTA, and ayo.ramble is visible. The no-linked-task disclosure opens with the new icon. No real account or Google flow was submitted. Physical-device install labels can depend on the OS and installation update lifecycle.

Public offline cache increments to life-public-pwa-v2; root worker updates remain user-controlled. Cache versions: app 60, CSS 61, auth entry 3, accounts 48, goals 6, PWA client 4. Rollback checkpoint: 529b82c4d6227f29b4a58578f65538305a21ddf7. No schema migration or loss of saved login.
