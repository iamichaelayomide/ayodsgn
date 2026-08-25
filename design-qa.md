# Testimonial Section Design QA

## Source and implementation

- Source: `/Users/mac/Downloads/MacBook Pro 16_ - 29.png`
- Normalized source: `/Users/mac/Documents/Codex/2026-08-25/s/work/figma-testimonial/source-pil-1728x1205.jpg`
- Desktop implementation: `/Users/mac/Documents/Codex/2026-08-25/s/work/figma-testimonial/implementation-desktop-final.png`
- Mobile implementation: `/Users/mac/Documents/Codex/2026-08-25/s/work/figma-testimonial/implementation-mobile-final.png`
- Desktop comparison viewport: 1728 px wide, initial carousel state
- Mobile comparison viewport: 390 x 844 px, initial carousel state

## Full-view comparison

The implemented section preserves the source composition: heading and paired calls to action at the top, a layered five-card fan as the dominant visual, centered pagination, supporting copy at lower left, and four proof statistics beneath the carousel. The live site's fixed navigation remains above the section; it was not present in the standalone Figma frame.

### Typography

- The editorial serif heading, button labels, proof numerals, and sans-serif testimonial content follow the existing site type system and the reference hierarchy.
- The large quote mark and compact rating treatment now match the visual weight of the source.
- Real client names, roles, and testimonials are retained instead of the placeholder copy in the reference.

### Spacing and layout

- Desktop card spread, overlap, rotation, and scale match the source's fan composition.
- The supporting copy, pagination, and statistics maintain the reference's visual rhythm.
- Mobile reflows the heading and actions vertically, keeps the active card readable, and allows neighboring cards to peek without horizontal page overflow.

### Colors and material

- The established cobalt background, white cards, pink primary action, blue rating details, and subtle outlined watermark remain consistent with the source and site brand.
- Borders, radii, and card shadows are restrained and coherent with the existing design language.

### Imagery and assets

- The reference uses typographic testimonial cards rather than photographic imagery; the implementation keeps that same asset model.
- No placeholder boxes, synthetic icons, or unrelated graphics were introduced.

### Copy

- The section heading is now `What clients say`, matching the supplied design.
- The source's proof labels are preserved while testimonial content uses verified live-site client copy.

## Focused component comparison

The focused center-card comparison confirmed the quote glyph, rating placement, body-copy position, author block, rotation, and proportions. The center card is the primary readable surface while side cards remain intentionally subordinate and layered.

## Iteration record

1. Replaced the flat horizontal testimonial ticker with the five-card fan carousel shown in the source.
2. Refined desktop offsets, card spread, and section spacing to match the 1728 px reference composition.
3. Corrected the primary testimonial call to action to pink after a more specific legacy button rule overrode it.
4. Added mobile top clearance so the fixed header no longer clips the section heading.
5. Refined the center-card quote scale, rating position, and body-copy alignment.
6. Added five stateful pagination controls, keyboard navigation, pause behavior, reduced-motion support, and timed rotation.

## Responsive and interaction verification

- Checked Home, Projects, Services, and About at 320, 390, 768, 1440, and 1728 px.
- Confirmed one active card, five visible fan cards, five pagination controls, and four proof statistics.
- Confirmed no horizontal document overflow, broken images, or blocking overlays at the tested widths.
- Confirmed timed auto-advance, clickable pagination, side-card selection, and left/right keyboard navigation.
- Confirmed mobile swipe handling with horizontal intent locking, drag resistance, touch and pointer fallbacks, and vertical page scrolling preserved.
- Confirmed reduced-motion users receive a stable, non-automated state.

## Remaining intentional differences

- The live fixed header is retained above the section.
- Real testimonial content replaces the Figma placeholder content.
- The source's faint purple lower glow and additional cropped watermark fragments are treated as optional polish; no P0, P1, or P2 visual discrepancy remains.

## Result

passed
