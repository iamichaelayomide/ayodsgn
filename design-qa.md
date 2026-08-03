# Design QA

final result: blocked

Build validation passed with `npm.cmd run build`.

Visual browser QA was blocked by the local environment:
- In-app browser connection failed at the Windows sandbox layer.
- Headless Edge did not produce screenshots.
- Starting the local preview server with redirected output was rejected by the environment approval reviewer.

Deployment was also blocked:
- `vercel.cmd deploy . --prod -y` reached Vercel CLI but outbound HTTPS was blocked by the sandbox.
- Escalated network approval was rejected because the account has hit its usage limit.

## Responsive spacing normalization — 2026-08-03

### Source visual truth

- Live source captured at 390 × 844 CSS px for Projects, Services, Blog, Playground, About, and Contact.
- Captures: `output/playwright/spacing-source-01-projects-mobile.png` through `spacing-source-06-contact-mobile.png`.
- Initial variance included 0 px, 12 px, 16 px, 24 px, 32 px, and 48 px outer rails across primary mobile sections.

### Implementation visual truth

- Local implementation captured at the same 390 × 844 viewport and 1× density.
- Captures: `output/playwright/spacing-local-01-projects-mobile.png` through `spacing-local-06-contact-mobile.png`.
- Full side-by-side comparisons: `output/playwright/spacing-comparison-01-projects-mobile.png` through `spacing-comparison-06-contact-mobile.png`.
- Focused top-region comparisons: `output/playwright/spacing-focus-01-projects-mobile.png` through `spacing-focus-06-contact-mobile.png`.
- Additional full-page checks: `spacing-local-article-mobile.png`, `spacing-local-case-study-mobile.png`, and `spacing-local-playground-tablet-final.png`.
- Desktop regression captures: `spacing-local-projects-desktop.png`, `spacing-local-services-desktop.png`, and `spacing-local-blog-desktop.png`.

### Comparison findings and fixes

1. P1 — Primary page shells used different mobile rails. Projects used 24 px, service rows 12 px, blog cards 0 px with a 32 px hero, and About nested to 48 px.
   - Fixed with a shared responsive `--site-gutter` rail across page heroes, grids, process/testimonial/FAQ sections, blog layouts, case studies, and contact cards.
2. P2 — Playground “See all” and the shared footer retained separate outer padding in the first implementation pass.
   - Fixed by aligning the action rail and removing the footer’s double outer inset.
3. P2 — Playground canvas remained at a legacy 24 px tablet rail.
   - Fixed by applying the shared 4vw tablet gutter; verified at 768 × 900.
4. P1 — Case-study HTML referenced project imagery absent from the clean deploy checkout.
   - Restored the exact existing project assets for all six case studies and verified every image loads.

### Required surface review

- Typography: unchanged; hierarchy and wrapping remain intact.
- Colors and effects: unchanged.
- Images: exact existing project assets; no generated substitutes.
- Copy and values: unchanged.
- Spacing and layout: mobile outer rails normalize to 16 px at 390 px; tablet primary rails normalize to 31 px at 768 px.
- Overflow: 0 px on all 17 public routes at 390 px, all six primary routes at 768 px, and all six primary routes at 1440 px.
- Interactions: mobile navigation opens and closes; article TOC updates the hash and reading progress; Playground category filters update the visible card set.
- Runtime: no page errors or console errors in the all-route browser audit.
- Assets: six case-study routes report zero broken images.
- Build: `npm.cmd run build` passes.

No remaining P0, P1, or P2 issues were found after the final comparison pass.

final result: passed

