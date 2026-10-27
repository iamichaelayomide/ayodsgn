CREATE TABLE IF NOT EXISTS life_opportunity_runtime (
 tenant_id INT PRIMARY KEY,
 enabled INT NOT NULL,
 expires_at VARCHAR(30) NOT NULL,
 heartbeat VARCHAR(30) NOT NULL,
 last_run VARCHAR(30) NOT NULL,
 last_error VARCHAR(300) NOT NULL
);
