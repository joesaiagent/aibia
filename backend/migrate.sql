-- Migration: Add service_interest + business_type to leads, create campaigns, update social_posts

ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_interest VARCHAR;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_type VARCHAR;

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  client_id VARCHAR REFERENCES leads(id) ON DELETE SET NULL,
  name VARCHAR NOT NULL,
  platforms VARCHAR NOT NULL DEFAULT '[]',
  status VARCHAR NOT NULL DEFAULT 'draft',
  campaign_brief TEXT,
  start_date VARCHAR,
  end_date VARCHAR,
  budget VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS campaign_id VARCHAR REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS client_id VARCHAR REFERENCES leads(id) ON DELETE SET NULL;
