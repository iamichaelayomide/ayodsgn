# Applications regression audit — 16 October 2026

Independent review reproduced three defects: a mutation response could restore Applications data in client memory after sign-out; an earlier refresh could overwrite a committed save; opening details did not notify breadcrumbs and outer Back controls.

The client now binds requests and uploads to its current reset lifecycle. Old responses and errors cannot enter the next session. Reset releases the save lock, while an older request cannot unlock a newer save. Successful mutation, upload, draft and preparation-task responses invalidate outstanding refreshes; obsolete refresh failures are ignored. Detail opens notify navigation immediately. Backend authorization and stored account ownership remain unchanged.

Regression tests ran red before each fix, then passed. Verification: 13 new client assertions, all 12 deterministic JavaScript suites, all 19 PHP suites, 15 isolated HTTP/multipart/privacy checks. Portfolio validation passes against tracked source files restored into a temporary directory (the working checkout is sparse). Independent final review found no important issue in this patch. Browser checks confirmed detail breadcrumb text and Back visibility, and return to the list.

The two provider integration scripts require private staging credentials/audio fixtures and were not run successfully. They are not included in the passing deterministic suites. Real microphone, accent and physical iPhone/Android behavior remain unverified. This audit does not establish perfect voice recognition or a complete security certification.

No schema migration. Versions: Applications v5, entry app.js v68. Production rollback checkpoint: 3d82b3d68b59efeb966000c2f5e71240a8b6a7d7. Release only the modified files on top of that production tree.
