# Company-first Opportunities — 26 October 2026

## Behaviour

One Opportunities sidebar destination opens the existing Ayo OS snapshot. `#ayo-os` and `#applications` both enter it. The original applications and document bank remain accessible from Saved applications & documents (`#application-library`); no records are deleted or copied automatically. The global new-opportunity action opens the same module.

Cards show company, short role/area, pipeline and status. Imported full subjects remain stored and accessible under original evidence. Search and NYSC/Freelance/Career/AI testing filters replace the overview/count-card screen. Known AI contract platforms Mercor, Taste/TasteMakers and micro1 appear in AI testing without rewriting stored pipelines; other Career records stay Career. AI testing presents Pending / Accepted / Not accepted; profile activation and invitations remain Pending. Explicit saved statuses override legacy prefixes.

Company details use native modal dialogs with contained scroll, keyboard focus and Escape return; list position is preserved. Company, People, Emails and Research sections progressively expose the record. Company about/website/LinkedIn/social link and contact LinkedIn/notes persist through the existing API. New structured correspondence records require source URL, direction and timestamp and reject duplicate message IDs. Old imported email notes remain available without pretending a structured history was automatically imported.

Drafts can be copied or opened in the user's email application. There is no send endpoint, no automatic scheduling and no automatic approval. Mail compose does not attach files; the UI asks the user to check attachments there. New fields and all old data are backward-compatible in the tenant-keyed JSON snapshot; there is no destructive SQL migration.

## Verification

- 65 PHP persistence, validation, tenant-isolation, approval and communication checks passed. Broad PHP run 22/23 suites passed; existing `life-chat-attachments.php` needs real multipart fixtures.
- JS model/session tests and workflow safety validation passed. Broad JS run reports existing live-audio/client fixture requirements separately.
- Browser interaction checked through the supported in-app browser against a loopback fixture: company cards/search, detail tabs, saved manual acceptance, contact/draft editors, compose URL, Escape focus, scroll position and 390px responsive containment. No emails sent.
- Site validation, syntax and diff whitespace checks passed. The updated standalone browser regression file was syntax checked; browser interaction evidence above comes from the supported browser, not a headless CLI run.
- Independent review found status-prefix precedence, first-use quick-add loading and stale card/selection on close; fixed before delivery.

## Agent integration boundary

`automation/n8n` contains inactive coordinator and four research child exports with bounded source-grounded proposals and review gates. No n8n account, model credential, Gmail connection or Life write bridge is configured. Offline safety tests are not a live n8n integration test. See `docs/automation/n8n-research.md`. Existing Codex Gmail heartbeat remains separate.

## Private research

Company enrichment is collected outside Git and is not bundled into public source or fixture files. Company/contact facts need their supporting sources retained when imported into the owner workspace. Westa Care's identity/domain remains unresolved; do not guess a replacement or change its scheduled email automatically.
