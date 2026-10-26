CREATE TABLE IF NOT EXISTS life_opportunity_agent_tokens (
 token_hash VARCHAR(64) PRIMARY KEY,
 tenant_id INT NOT NULL,
 created_at VARCHAR(30) NOT NULL,
 expires_at VARCHAR(30) NOT NULL,
 revoked_at VARCHAR(30) NOT NULL,
 last_seen VARCHAR(30) NOT NULL
);
CREATE TABLE IF NOT EXISTS life_opportunity_agent_jobs (
 id VARCHAR(32) PRIMARY KEY,
 tenant_id INT NOT NULL,
 pipeline VARCHAR(40) NOT NULL,
 query_text VARCHAR(1000) NOT NULL,
 max_prospects INT NOT NULL,
 status VARCHAR(20) NOT NULL,
 created_at VARCHAR(30) NOT NULL,
 lease_until VARCHAR(30) NOT NULL,
 lease_hash VARCHAR(64) NOT NULL,
 attempts INT NOT NULL,
 result_json LONGTEXT NOT NULL,
 result_hash VARCHAR(64) NOT NULL,
 completed_at VARCHAR(30) NOT NULL,
 reviewed_at VARCHAR(30) NOT NULL
);
