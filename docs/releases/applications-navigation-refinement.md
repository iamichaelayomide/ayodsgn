# Applications controls and back navigation — 14 October 2026

Opportunity archive is directly available on list cards and in the sticky details header. Archived opportunities remain recoverable through the Archived filter and Restore. Details use consistent sans-serif headings, compact metadata and expandable preparation, documents, notes and activity sections. Main forms now expose five fields: name, status, deadline, optional URL and optional linked goal. Existing optional content is preserved.

Tracker stage editing uses compact named rows with aligned Submitted/Successful controls and remove actions. Downloads are styled as 44px buttons with the same typography as document actions. Primary-button icons use the correct white contrast.

All four summary cards open their matching opportunity lists. Counts and drill-down lists share the filtering engine, including custom successful stages and archive exclusion. Summary and tracker cards show only a small accordion chevron at the side; the extra View opportunities text is removed. Tracker editing remains in Manage.

A session-only back stack supports the app header and Applications subviews. Opportunity Back/Escape returns to the prior tracker, filter and search; cross-page Back restores the previous view and Applications context. Breadcrumb parent buttons open the workspace board, Applications home or originating opportunity list. Mobile chat list Back returns to the conversation before leaving Ramble. Navigation histories clear on logout and do not mutate planner data. The controls are in-app navigation; browser route history is unchanged.

Verification: 18 filtering/custom-success/archive checks, 13 navigation-state checks, 15 upload-control checks, 42 PWA checks and 15 isolated HTTP/multipart checks pass. Browser tests verified archive disappearance and restore, submitted/waiting/success card drill-downs, preserved search/destination on Back, clickable breadcrumbs, five main fields, stage saves, multiline chat layout and Download's 44px/no-underline style. Desktop and 390px mobile Chrome previews were checked. Mobile opportunity details occupy the full 390×844 viewport with no horizontal overflow. Physical-device behavior remains unverified.

No database migration or Google/OAuth setting change. Versions: app.js v67, Applications module/CSS v4, model v2, companion v53, navigation history v1, life.css v63. Rollback checkpoint: 3396371350eeb79864fe731bc2ac594698fb7405.
