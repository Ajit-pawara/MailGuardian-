-- MailGuardian Database Schema
-- Supabase PostgreSQL Migration

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ─── MAIL ACCOUNTS ─────────────────────────
CREATE TABLE mail_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  provider TEXT NOT NULL DEFAULT 'gmail',
  provider_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync TIMESTAMPTZ,
  history_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_mail_accounts_user_id ON mail_accounts(user_id);
CREATE INDEX idx_mail_accounts_email ON mail_accounts(email);

-- ─── EMAILS ────────────────────────────────
CREATE TYPE email_category AS ENUM (
  'otp', 'password_reset', 'security_alert', 'bank_transaction',
  'bug_bounty_response', 'interview_invitation', 'internship_acceptance',
  'professor', 'assignment', 'github', 'invoice', 'meeting', 'recruiter',
  'college', 'friends', 'general', 'advertisement', 'newsletter',
  'marketing', 'shopping_promotion', 'spam'
);

CREATE TYPE category_group AS ENUM (
  'critical', 'important', 'normal', 'ignore', 'spam'
);

CREATE TABLE emails (
  id TEXT PRIMARY KEY, -- Gmail message ID
  account_id UUID NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  label_ids TEXT[] NOT NULL DEFAULT '{}',
  history_id TEXT,
  internal_date TIMESTAMPTZ NOT NULL,
  size_estimate BIGINT NOT NULL DEFAULT 0,

  -- Parsed fields
  from_name TEXT NOT NULL DEFAULT '',
  from_address TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL DEFAULT '{}',
  cc_addresses TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL DEFAULT '(no subject)',
  snippet TEXT NOT NULL DEFAULT '',
  body_text TEXT,
  body_html TEXT,
  headers JSONB NOT NULL DEFAULT '{}',

  -- Flags
  is_unread BOOLEAN NOT NULL DEFAULT TRUE,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  is_important_mail BOOLEAN NOT NULL DEFAULT FALSE,

  -- Classification
  category email_category,
  category_group category_group,
  priority_score INTEGER DEFAULT 0,
  ai_summary TEXT,
  estimated_read_time_seconds INTEGER DEFAULT 0,
  classification_confidence REAL DEFAULT 0,

  -- Extracted info
  deadlines JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  people TEXT[] DEFAULT '{}',
  links TEXT[] DEFAULT '{}',
  meeting_info JSONB,

  -- Sync meta
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_email_per_account UNIQUE(id, account_id)
);

CREATE INDEX idx_emails_account_id ON emails(account_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_internal_date ON emails(internal_date DESC);
CREATE INDEX idx_emails_category ON emails(category);
CREATE INDEX idx_emails_category_group ON emails(category_group);
CREATE INDEX idx_emails_priority ON emails(priority_score DESC);
CREATE INDEX idx_emails_is_unread ON emails(is_unread);
CREATE INDEX idx_emails_is_important ON emails(is_important_mail);
CREATE INDEX idx_emails_from_address ON emails(from_address);
CREATE INDEX idx_emails_subject ON emails(subject);
CREATE INDEX idx_emails_labels ON emails USING GIN(label_ids);
CREATE INDEX idx_emails_people ON emails USING GIN(people);
CREATE INDEX idx_emails_fulltext ON emails USING GIN(
  to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(snippet, '') || ' ' || coalesce(body_text, ''))
);

-- ─── ATTACHMENTS ──────────────────────────
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id TEXT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  attachment_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_email_id ON attachments(email_id);

-- ─── PUSH SUBSCRIPTIONS ───────────────────
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ─── NOTIFICATION LOG ─────────────────────
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id TEXT REFERENCES emails(id) ON DELETE SET NULL,
  account_id UUID REFERENCES mail_accounts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  from_address TEXT NOT NULL,
  category email_category,
  priority_score INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_notification_log_user ON notification_log(user_id);
CREATE INDEX idx_notification_log_sent ON notification_log(sent_at DESC);

-- ─── SYNC STATE ──────────────────────────
CREATE TABLE sync_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  last_history_id TEXT,
  last_full_sync TIMESTAMPTZ,
  last_partial_sync TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'idle',
  error_message TEXT,
  emails_synced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id)
);

-- ─── USER SETTINGS ───────────────────────
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  language TEXT NOT NULL DEFAULT 'en',
  notification_prefs JSONB NOT NULL DEFAULT '{"enabled":true,"importantOnly":true,"minPriority":60,"soundEnabled":true,"vibration":true,"desktopEnabled":true,"mobileEnabled":true,"quietHoursEnabled":false,"quietHoursStart":"22:00","quietHoursEnd":"07:00","rules":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── ROW LEVEL SECURITY ──────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_isolation ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY account_isolation ON mail_accounts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY email_isolation ON emails
  FOR ALL USING (
    account_id IN (SELECT id FROM mail_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY attachment_isolation ON attachments
  FOR ALL USING (
    email_id IN (SELECT id FROM emails WHERE account_id IN (SELECT id FROM mail_accounts WHERE user_id = auth.uid()))
  );

CREATE POLICY push_isolation ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY notification_log_isolation ON notification_log
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY sync_state_isolation ON sync_state
  FOR ALL USING (
    account_id IN (SELECT id FROM mail_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY settings_isolation ON user_settings
  FOR ALL USING (user_id = auth.uid());

-- ─── TRIGGERS ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_mail_accounts_updated_at
  BEFORE UPDATE ON mail_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sync_state_updated_at
  BEFORE UPDATE ON sync_state FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
