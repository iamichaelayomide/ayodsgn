# Economy voice release

Approved scope: Economy speech recognition -> text-only existing streaming planner pipeline -> device speech playback. Optional native Gemini voice; no automatic paid fallback. Browser recognition requires first-use consent. Hidden live transcript; correction and retry preserve captured words and request identity. Global dock stays on the current screen.

Mobile: compact board toolbar, swipeable columns, management options and collapsed filters. Sidebar: Your space / More tools, matching text and official Iconsax Linear rounded strokes.

Usage: remove owner text cap; retain generation mutex and duplicate receipts. Native reservations settle elapsed server time idempotently; expired reservations are conservatively charged fully; historical reservations are not refunded. Context uses bounded relevant records and current goals. Provider usage metadata is kept server-side. No extra close-summary request.

Dependencies: existing PHP and modular JavaScript; ui-skills 0.2.4 installed via pnpm dlx (documented `get baseline-ui` command), no production runtime dependency. npm integrity: sha512-udP3Lisi6EMTZVGVXTy2WJiaatHVtL3BKuKaG1VYLgggpSFCChR7t9G2j3aGpchbdkgzZIae2yCg6sIVTcRZyQ==. Guidance vendored under docs/skills/baseline-ui.md. Existing stack and design tokens take precedence over framework-specific defaults.

Rollback baseline: master e34928e8a0d08fd0f68376a7537571e3f5c11144. Database structure is unchanged. Private configuration and data remain outside deployments. Physical speech recognition, browser service accuracy and speaker echo require actual-device verification. Free access remains provider-limited; no savings percentage is promised.
