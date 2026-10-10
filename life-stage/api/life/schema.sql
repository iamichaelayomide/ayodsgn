CREATE TABLE IF NOT EXISTS life_migration (version INT PRIMARY KEY, applied_at VARCHAR(30) NOT NULL);
CREATE TABLE IF NOT EXISTS life_owner (id INT PRIMARY KEY, password_hash VARCHAR(255) NOT NULL, created_at VARCHAR(30) NOT NULL);
CREATE TABLE IF NOT EXISTS life_board (id INT PRIMARY KEY, version INT NOT NULL, state LONGTEXT NOT NULL, updated_at VARCHAR(30) NOT NULL);
CREATE TABLE IF NOT EXISTS life_login_attempt (id VARCHAR(32) PRIMARY KEY, ip_hash VARCHAR(64) NOT NULL, attempted_at BIGINT NOT NULL);
CREATE INDEX life_login_window ON life_login_attempt (attempted_at, ip_hash);
