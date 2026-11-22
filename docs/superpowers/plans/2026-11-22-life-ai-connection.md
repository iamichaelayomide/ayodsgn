# Life AI Connection Implementation Plan

Goal: Connect ordinary ChatGPT to an account's Life content on demand and allow explicit planner changes, with a provider-neutral authenticated MCP/HTTP service.

Architecture: PHP stateless Streamable HTTP MCP service, OAuth authorization-code with S256 PKCE and dynamic public-client registration. Existing Life session validation gates user consent and revocation. Tokens are hashed, account-bound, resource-bound, expiring and revocable. Logical planner content is discoverable and paginated without a collection-wide access ceiling; credentials and infrastructure secrets are excluded. Existing domain models enforce mutations, optimistic versioning and audit records. No message sending, security setting edits or permanent deletions.

- [x] OAuth storage, registration, pending authorization, consent, tokens, refresh/revoke with replay tests.
- [x] Account-scoped context catalogue, search, full-record fetch and module pagination. Preserve all text; fetch long contents by continuation.
- [x] Explicit task/goal/note and opportunity mutations with version checks, request receipts and audit.
- [x] MCP discovery/JSON-RPC and authenticated HTTP endpoints with correct read/write annotations.
- [x] Life connection/consent UI, account identity, read-only/read-write choice, revocation and audit.
- [x] Real PHP tests for isolation, PKCE, replay, resource binding, revoked grants, pagination, idempotency and writes. Browser UI checks with disposable data.
- [ ] Publish, verify public discovery and auth boundaries, prepare actual ChatGPT setup. Final account linking is a reviewable user approval step.

Implementation uses the existing PHP/PDO hosting, no new paid service or model API key. MCP is an integration protocol; each assistant provider controls its own supported clients and plan availability. Tab is separate and excluded from this personal planner grant.
