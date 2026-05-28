export type LeadStatus = 'active' | 'replied' | 'archived' | 'dnc' | 'pending';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  title: string;
  status: LeadStatus;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  sequenceStep: 1 | 2 | 3;
  subject: string;
  body: string;
  isDefault: boolean;
  updatedAt: string;
}

export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  name: string;
  templateId: string; // References the step 1 template
  status: CampaignStatus;
  attachPdf: boolean;
  pdfUrl?: string;
  totalLeads: number;
  sentCount: number;
  openCount: number;
  replyCount: number;
  launchedAt?: string;
  createdAt: string;
}

export type SequenceStatus = 'active' | 'paused' | 'replied' | 'completed' | 'dnc' | 'error';

export interface Sequence {
  id: string;
  campaignId: string;
  leadId: string;
  currentStep: 1 | 2 | 3;
  status: SequenceStatus;
  email1SentAt?: string;
  email2DueAt?: string;
  email2SentAt?: string;
  email3DueAt?: string;
  email3SentAt?: string;
  replyDetectedAt?: string;
  createdAt: string;
}

export type EmailEventType = 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';

export interface EmailEvent {
  id: string;
  sequenceId: string;
  leadId: string;
  campaignId: string;
  step: 1 | 2 | 3;
  eventType: EmailEventType;
  outlookMessageId?: string;
  subject: string;
  toEmail: string;
  bodyPreview?: string;
  occurredAt: string;
}

export interface DncEntry {
  id: string;
  email: string;
  reason: string;
  createdAt: string;
}

export interface ReplyInboxItem {
  id: string;
  sequenceId: string;
  leadId: string;
  campaignId: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  receivedAt: string;
  isRead: boolean;
  aiSuggestedDraft?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'interested' | 'not_interested';
}
