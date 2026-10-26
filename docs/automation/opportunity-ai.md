# Opportunity AI through Ramble

`LifeOpportunityAI` uses Life's existing private, billing-disabled Gemini configuration. It never returns provider credentials. All actions produce previews; normal opportunity mutations remain the explicit save boundary. Owner-session and workspace/CSRF controls are enforced by `ayo-os-routes.php`.

POST actions: `ayo-os.ai.research`, `ayo-os.ai.rewrite`, `ayo-os.ai.tailor`. Requests include `workspaceId`, `opportunityId` and optionally current integer `version`. Research accepts optional `instruction`. Research and rewrite return `{opportunityId,version,company:{about,recentNews,problem,fit,website},contacts,sources,checkedAt,requiresReview:true,notice}`. Research uses grounded Google Search; unsupported contacts are omitted and a published email quote is required before a proposed email is exposed. Grounding is evidence to review, not proof that every model claim is true.

Rewrite uses existing sourced research, excludes Gmail/audit records, and introduces no new research request or automatic save. Source-less company prose is not returned as a factual update. Research output and source URLs must be rendered as text/safe links, never HTML.

Tailoring requires an explicitly selected linked `documentId`, `shareDocument:true` and `jobDescription`. It validates the active tenant-owned CV and its parents before provider use. Word paragraphs are preserved by index; PDF is shared as inline document only after consent. It returns `{text,changes,recommendations,format,originalParagraphs,documentId,opportunityId,version,requiresReview:true}`. New numeric claims are flagged for review. These checks cannot verify all professional facts: the user must inspect the result before saving a new version through the existing document flow. The original is never changed.

The provider may be unconfigured or unavailable; the endpoint then returns a clear 503 or allowance 429 without claiming research succeeded. No private production configuration was read or changed while building this feature. Deterministic isolated tests use injected provider fixtures.

`ayo-os.automation.status` reads the scoped bridge status: configured means an active owner-approved token exists; connected requires recent authenticated worker polling. It never equates dispatch with research success. The local editor alone does not satisfy either condition. See `n8n-research.md` for the actual polling bridge and user credential setup. No live connection token was generated during implementation.
