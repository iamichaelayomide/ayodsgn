# Accountability release

Additive migration: life_partner table (private database only); no existing table or owner password changes. Planner state adds accountabilityEnabled and approval metadata. Existing JSON export remains owner-only and excludes partner credentials and invite hashes.

Owner creates a named invitation in Accountability, then shares its one-time link manually. Invitations expire after seven days. Partners choose their own 14+ character passphrase, then sign in with partner ID and password. No email delivery is implemented. Lost partner credentials: revoke access and create a fresh invitation.

Accepted partners can read the whole planner and approve goals or tasks in Review. They cannot edit planner records, export data, manage partners, or issue invitations. Revocation is checked on every API request and invalidates existing sessions. CSRF, session expiry, throttling and private no-store headers apply to partners.

Accountability becomes active only on invitation acceptance. Once active, owner actions cannot mark goals complete or move/create/restore tasks into Done, including direct API calls. Revoking all partners pauses approval until a replacement joins; it does not disable enforcement. Existing completed records remain intact. Review cannot be renamed or archived while enforcement is active.

Verification: 40 existing backend checks, 18 partner store checks, 22 existing API security checks, 14 partner workflow checks locally and on Hostinger staging. Desktop accountability UI inspected. Staging uses dedicated private configuration and database, with separate session cookies. Production export saved before deployment.

Next module: multiple boards and routines/capacity, then attachments and complete manual thinking system. No AI or voice integration yet.
