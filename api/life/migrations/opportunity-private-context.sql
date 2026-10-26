CREATE TABLE IF NOT EXISTS life_opportunity_private_tokens (
 token_hash VARCHAR(64) PRIMARY KEY,
 tenant_id INT NOT NULL,
 selection_json LONGTEXT NOT NULL,
 created_at VARCHAR(30) NOT NULL,
 expires_at VARCHAR(30) NOT NULL,
 revoked_at VARCHAR(30) NOT NULL,
 last_seen VARCHAR(30) NOT NULL
);
CREATE TABLE IF NOT EXISTS life_opportunity_private_reads (
 id VARCHAR(64) PRIMARY KEY,
 token_hash VARCHAR(64) NOT NULL,
 job_id VARCHAR(32) NOT NULL,
 read_count INT NOT NULL,
 last_seen VARCHAR(30) NOT NULL
);
