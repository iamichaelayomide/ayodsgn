# Task details and conversational actions — release notes

Start from deployed master ce1f770ea30047db4c7b7aa161dc1fbe6df32c6e. No schema changes or credential changes.

- Concrete confirmations come from saved, validated actions and exact record titles, not an AI promise. Dates use Africa/Lagos today/tomorrow labels. Undo and optimistic versions remain.
- Native voice uses the same short-lived pending creation authorization as typed/Economy chat, clears it after execution, and waits for saved previous voice turns before fetching context or executing changes. Its tool reply supplies the saved confirmation to speak aloud.
- Title-only task creation; list/status selector, manual Done/Reopen button; inline description; Dates/Checklist/Attachment/More controls; existing checklist and files remain visible; priority/goal/labels and Archive are optional. Save/error status preserves drafts. Phone detail sheet fills the viewport with safe-area padding and a reachable save footer.
- Owner completion goes directly to Done in manual mode; accepted partner accountability still routes completion through Review. This release does not bypass approvals.

Validation: 203 PHP regression checks, including native goal clarification, exact confirmation text, manual Done/Reopen, stale versions and accountability denial. Desktop and 390×844 phone preview exercised title-only creation, inline description, checklist persistence and manual Done. Actual microphones/speakers still require device testing; native provider quotas are unchanged.

Dependencies: existing PHP/JavaScript and installed ui-skills baseline-ui 0.2.4. Official Iconsax Linear attach-circle and tick-square assets; brand tokens retained.
