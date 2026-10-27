# First-party scheduled research

The existing hosting account can invoke `scripts/life-opportunity-research.php` every minute, using the same PHP binary and absolute repository layout as the existing Life cron tasks. No n8n account, public webhook or copied provider key is needed. The script refuses HTTP requests.

Owner API: `ayo-os.agents.runtime.status`, `.enable`, `.disable`. Each requires workspaceId. Enable requires confirm, confirmWrites and confirmProvider true; disable requires confirm true. The permission expires after 90 days. Normal session, workspace and CSRF checks apply. Status includes enabled, expiresAt, heartbeat, lastRun, lastError, dailyCount, dailyLimit (25), runtime (hostinger-cron) and privateContextEnabled (false).

A nonblocking exclusive private file lock permits only one invocation. After 9 AM Lagos it queues the bounded daily batch, then processes at most one job globally per invocation. It reuses source validation, free-provider budget, job write policy, idempotent writes, deduplication, manual-field preservation, outcome restrictions and audit records. No automatic mail or paid fallback is available.

Fresh random internal authorization exists only during an invocation; only its hash is temporarily stored and cleanup removes token and permissions in finally. No credential is returned to the browser or logged. Selected CV/mail consent from an earlier n8n grant is not inherited. This initial permission supports public/profile-grounded research; jobs requesting private context fail closed.

After deployment, verify owner status, one CLI heartbeat and persisted result before adding the cron entry. Then verify a later scheduled heartbeat. A free AI quota failure remains an explicit failure, not a completed batch. Source implementation alone does not configure cron or enable production research.
