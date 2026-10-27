CREATE TABLE IF NOT EXISTS life_opportunity_agent_permissions (token_hash VARCHAR(64) PRIMARY KEY,permissions_json LONGTEXT NOT NULL);
CREATE TABLE IF NOT EXISTS life_opportunity_agent_receipts (id VARCHAR(64) PRIMARY KEY,tenant_id INT NOT NULL,fingerprint VARCHAR(64) NOT NULL,response_json LONGTEXT NOT NULL,created_at VARCHAR(30) NOT NULL);
CREATE TABLE IF NOT EXISTS life_opportunity_agent_audit (id VARCHAR(32) PRIMARY KEY,tenant_id INT NOT NULL,token_hash VARCHAR(64) NOT NULL,operation VARCHAR(60) NOT NULL,record_id VARCHAR(32) NOT NULL,before_json LONGTEXT NOT NULL,after_json LONGTEXT NOT NULL,created_at VARCHAR(30) NOT NULL);
CREATE TABLE IF NOT EXISTS life_opportunity_agent_daily (id VARCHAR(64) PRIMARY KEY,tenant_id INT NOT NULL,day VARCHAR(10) NOT NULL,jobs_json LONGTEXT NOT NULL);
CREATE TABLE IF NOT EXISTS life_opportunity_agent_budget (id VARCHAR(64) PRIMARY KEY,tenant_id INT NOT NULL,day VARCHAR(10) NOT NULL,reserved INT NOT NULL);
CREATE TABLE IF NOT EXISTS life_opportunity_agent_execution (job_id VARCHAR(32) PRIMARY KEY,tenant_id INT NOT NULL,token_hash VARCHAR(64) NOT NULL,lease_hash VARCHAR(64) NOT NULL,status VARCHAR(20) NOT NULL,response_json LONGTEXT NOT NULL,created_at VARCHAR(30) NOT NULL);
CREATE TABLE IF NOT EXISTS life_opportunity_agent_job_policy (job_id VARCHAR(32) PRIMARY KEY,policy_json LONGTEXT NOT NULL);
