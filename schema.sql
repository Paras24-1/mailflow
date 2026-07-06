-- MailFlow Supabase DB Schema
-- Execute this script in the Supabase SQL Editor to set up all tables

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sequence_step INTEGER NOT NULL CHECK (sequence_step IN (1, 2, 3)),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LEADS
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    company TEXT,
    phone TEXT,
    title TEXT,
    status TEXT DEFAULT 'active',
    step INTEGER DEFAULT 0,
    next_send TIMESTAMP WITH TIME ZONE,
    last_sent TIMESTAMP WITH TIME ZONE,
    replied BOOLEAN DEFAULT FALSE,
    reply_date TIMESTAMP WITH TIME ZONE,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    attach_pdf BOOLEAN DEFAULT FALSE,
    pdf_url TEXT,
    total_leads INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    launched_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    template_step2_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    template_step3_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table linking campaigns to target leads
CREATE TABLE IF NOT EXISTS campaign_leads (
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, lead_id)
);

-- 4. SEQUENCES (Outreach progress trackers per lead)
CREATE TABLE IF NOT EXISTS sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    email1_sent_at TIMESTAMP WITH TIME ZONE,
    email2_sent_at TIMESTAMP WITH TIME ZONE,
    email3_sent_at TIMESTAMP WITH TIME ZONE,
    email2_due_at TIMESTAMP WITH TIME ZONE,
    email3_due_at TIMESTAMP WITH TIME ZONE,
    reply_detected_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_campaign_lead UNIQUE (campaign_id, lead_id)
);

-- 5. EMAIL EVENTS (Tracking opens, clicks, dispatches)
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    step INTEGER NOT NULL,
    event_type TEXT NOT NULL, -- 'sent', 'opened', 'clicked', 'bounced'
    provider TEXT DEFAULT 'outlook',
    subject TEXT,
    to_email TEXT NOT NULL,
    body_preview TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REPLIES
CREATE TABLE IF NOT EXISTS replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    from_name TEXT,
    from_email TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sentiment TEXT DEFAULT 'neutral', -- 'interested', 'not_interested', 'neutral'
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. DNC LIST (Do Not Contact / Suppression list)
CREATE TABLE IF NOT EXISTS dnc_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. OUTLOOK CONFIGS
CREATE TABLE IF NOT EXISTS outlook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ms_tenant_id TEXT,
    ms_client_id TEXT,
    ms_sender_email TEXT,
    is_connected BOOLEAN DEFAULT FALSE,
    access_token TEXT,
    refresh_token TEXT,
    expires_at NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for fast query performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_sequences_campaign_lead ON sequences(campaign_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_sequences_status ON sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_replies_sequence ON replies(sequence_id);
CREATE INDEX IF NOT EXISTS idx_dnc_list_email ON dnc_list(email);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_camp ON campaign_leads(campaign_id);
