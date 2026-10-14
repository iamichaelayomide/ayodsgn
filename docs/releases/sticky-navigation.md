# Sticky app navigation — 14 October 2026

The shared planner top bar is sticky across views with an opaque paper background. It stays below the mobile drawer/backdrop and below dialog layers. Installed standalone mode uses the top safe-area inset so controls remain below the phone status area. Desktop sidebar behavior is unchanged.

Chrome mobile-width check at 390×600: after scrolling, the page heading moved above the viewport while the top bar stayed at y=0. The hamburger opened the mobile sidebar from that scrolled position. Physical iPhone safe-area behavior is not claimed as tested. CSS version 60 invalidates previous styles. Rollback checkpoint: acbb029745a6606c51b59243552093221d4c01d7. No data/schema changes.
