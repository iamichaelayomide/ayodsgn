# Design QA

## Margin and process repair — 2026-08-22

final result: passed

### Visual checks

1. Negative — Observation: the shared `.process-inner` wrapper was missing from the site container system, making the homepage and Services process content touch the viewport edges. Suggestion: use the same centered max-width and responsive gutter as the adjacent sections. Fixed.
2. Negative — Observation: the process interaction used a large spring scale and rotation that made adjacent cards jump and read as visually unstable. Suggestion: use a small vertical lift, a stable selected border, and consistent card geometry. Fixed.
3. Negative — Observation: process cards did not expose their selected state to assistive technology. Suggestion: give the keyboard-focusable cards button semantics and keep `aria-pressed` synchronized. Fixed.
4. Negative — Observation: hash navigation placed section headings underneath the sticky header at tablet and mobile widths. Suggestion: offset anchored sections by the shared header height. Fixed.
5. Positive — Observation: the existing type, blue/pink palette, icon artwork, CTA styling, and four-step content already form a coherent visual system and were preserved.

### Responsive and runtime verification

- Desktop: 1440 × 1000, seven primary routes, no horizontal overflow, broken images, empty main regions, console errors, or error overlays.
- Tablet: 768 × 900, seven primary routes, no horizontal overflow, broken images, or empty main regions.
- Mobile: 390 × 844, seven primary routes, no horizontal overflow, broken images, or empty main regions.
- Process component: verified on Home, Services, About, and Projects; click and keyboard selection update the visual state and `aria-pressed`.
- Source validation and `git diff --check`: passed.

Summary tally: 5 observations — 1 positive (20%), 4 negative corrected (80%), 0 unresolved P0/P1/P2 issues.

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

## Case-study credibility and discovery — 2026-08-03

### Source visual truth

- Caladium Foundation live homepage: `output/playwright/source-caladium-home-1440.png` — 1440 × 1000 px at a 1440 × 1000 CSS viewport, 1× density.
- Orca Securities live homepage: `output/playwright/source-orca-home-1440.png` — 1440 × 1000 px at a 1440 × 1000 CSS viewport, 1× density.
- Orca DAC live page: `output/playwright/source-orca-dac-1440.png` — 1440 × 1000 px at a 1440 × 1000 CSS viewport, 1× density.

### Implementation evidence

- Caladium case-study hero and live-site CTA: `output/playwright/local-caladium-hero-desktop.png`.
- Orca full case study with fresh live “before” screens and redesign “after” screens: `output/playwright/local-orca-case-desktop.png`.
- Projects grid after removing work without case-study routes: `output/playwright/local-projects-clean-mobile.png`.
- Related case studies on mobile: `output/playwright/local-caladium-related-mobile.png` — 358 × 853 px inside a 390 × 844 CSS viewport.

### Side-by-side comparisons

- Caladium source vs embedded implementation asset: `output/playwright/source-vs-implementation-caladium.png` — both normalized to 1440 × 1000 px at 1×.
- Orca live homepage source vs embedded “before” asset: `output/playwright/source-vs-implementation-orca-live-home.png` — both normalized to 1440 × 1000 px at 1×.
- Orca live DAC source vs embedded “before” asset: `output/playwright/source-vs-implementation-orca-live-dac.png` — both normalized to 1440 × 1000 px at 1×.

### Findings and comparison history

1. P1 — Orca’s previous “before” images were captured beneath a grey loading overlay and did not faithfully represent the live site.
   - Replaced them with fresh browser captures from Orca’s live homepage and DAC page.
   - Post-fix side-by-side comparisons show the embedded assets match the live-source captures.
2. P1 — Bloodlines appeared in Projects without a case-study route.
   - Removed it from the Projects grid and homepage carousel.
   - The remaining six project cards all link to real case-study routes.
3. P2 — Case studies ended without a next-work discovery path.
   - Added two contextual related case-study cards to all six case studies, with no page recommending itself.
4. P2 — Caladium lacked a direct live-site path.
   - Added a prominent `https://caladiumfoundation.com/` CTA in the case-study hero.
5. P2 — Lazy related-card imagery appeared blank in immediate element captures.
   - Made the two related images per case study eager and confirmed they render on desktop and mobile.

### Required surface review

- Typography: existing case-study families, weights, and hierarchy preserved.
- Spacing and layout: related cards follow the shared case shell and collapse to one column on mobile; no overflow at 390 px or 1440 px.
- Colors and tokens: existing neutral, blue, serif, and accent system preserved.
- Image quality and fidelity: Caladium imagery matches the live Caladium site; Orca “before” imagery matches the live Orca site and the “after” imagery remains the actual redesign work.
- Copy and content: project names, disciplines, live-link label, and related-case-study labels are accurate.
- Interaction and runtime: 12 responsive route checks passed; every case study has two working related links, zero self-links, zero broken related images, and zero console errors.
- Projects grid: six cards, six real case-study links, zero broken images.
- Build: `npm.cmd run build` passes.

No actionable P0, P1, or P2 issues remain.

final result: passed
