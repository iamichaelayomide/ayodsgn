# Life goals and board refinement

Release: manual goals, Idea Box, direct checklists, Today quick entry, Sunday reviews, and life.ayodsgn.com.

## Scope
- Existing Inbox becomes Idea Box. Backlog cards retain their IDs and move into Idea Box; Backlog is archived and remains restorable.
- Quick entry creates a card without opening the full form. Double-click a card title to rename; full task editing remains available.
- Card checklists save directly. Today shows deadlines/work scheduled today and overdue unfinished tasks. Checking a Today item moves that same task to Done; unchecking returns it to the first active unfinished list.
- Goals support quarterly, monthly, weekly and ad hoc periods, custom categories, task links, and explicit completion. Monthly goals must belong to their parent quarter; weekly goals use the month containing their Monday. Progress includes linked descendant goals' tasks.
- Weeks use actual Monday–Sunday dates in Africa/Lagos. Sunday review supports Monday–Saturday work planning. There is no fixed four-week month assumption.
- Reviews and goals are exported with the authenticated board state. Saves use the existing version conflict protection.
- life.ayodsgn.com shares Hostinger public_html and the production database. HTTPS is active. Root rewrite serves life/index.php; its base URL preserves assets and API paths. Existing /life/ remains supported. Login sessions are hostname-specific.

## Verification
40 backend checks; 21 isolated Hostinger MySQL/API checks. Browser checks cover quick entry, inline rename, checklist persistence, Today completion, goals, weekly review, and 390px mobile layout/navigation. Public site validation also runs before release. Production export saved privately before deployment; credentials and backups remain outside Git/public files.

## Continuation
Accountability partners will see the whole planner, per owner decision. They are NOT implemented in this release. Add invitation/revocation, separate partner identity, server-enforced approval permissions and Review-to-Done restrictions before presenting this as an accountability workflow. Manual owner completion currently remains available.

Remaining: multiple boards, routines, uploads, mind maps, AI/voice and business modules. No AI keys, charges, or third-party context sharing in this release.

Rollback: restore prior application commit 56c9fca7312211537f626202da057e076a9c219c and, if needed, restore the pre-goals private export through the documented hosting recovery process. No SQL schema migration is needed; goals/reviews extend the versioned state. Private configuration survives Git deployment.
