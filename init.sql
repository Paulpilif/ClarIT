-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  api_token UUID NOT NULL UNIQUE
);

COMMENT ON COLUMN companies.id IS 'Unique identifier for the company (UUID).';
COMMENT ON COLUMN companies.company_name IS 'Unique company name used for identification/login.';
COMMENT ON COLUMN companies.password_hash IS 'Password hash for company authentication (stored as text).';
COMMENT ON COLUMN companies.api_token IS 'API access token for the company (UUID, unique).';

CREATE INDEX IF NOT EXISTS idx_companies_api_token ON companies (api_token);

-- Premium whitelist table
CREATE TABLE IF NOT EXISTS premium_whitelist (
  valid_token UUID PRIMARY KEY
);

COMMENT ON COLUMN premium_whitelist.valid_token IS 'Whitelisted premium access token (UUID).';
