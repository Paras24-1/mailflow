import fs from "fs";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

const DB_FILE = path.join(process.cwd(), "db.json");

export interface LocalDb {
  leads: any[];
  templates: any[];
  campaigns: any[];
  sequences: any[];
  events: any[];
  dncList: any[];
  replies: any[];
  outlookConfig: {
    msTenantId: string;
    msClientId: string;
    msSenderEmail: string;
    isConnected: boolean;
  };
}

export const DEFAULT_TEMPLATES = [
  {
    id: "e4a3b839-8670-4d5b-9d41-3b7c8df233c1",
    name: "Standard Outreach (Step 1)",
    sequenceStep: 1,
    subject: "Quick question on {{company}}'s system automation",
    body: `Hi {{first_name}},\n\nI was looking through {{company}}'s recent product launches and noticed your team is scaling systems operations.\n\nWe build streamlined client sequence automations that cut operations complexity by 40% using unified pipelines. Do you have 5 minutes this Thursday for a brief chat?\n\nBest regards,\nMailFlow Outbound Team`,
    isDefault: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "c3b0f519-74d3-4889-8d4e-28be86df11c2",
    name: "Soft Follow-up (Step 2)",
    sequenceStep: 2,
    subject: "Re: Quick question on {{company}}'s system automation",
    body: `Hey {{first_name}},\n\nJust wanted to bump this to the top of your inbox in case you missed it. I know how busy scaling teams can get.\n\nTo recap: we simplify outreach sequence tracking so you can focus purely on closed deals.\n\nLet me know if you are open to checking out a quick mock-up.\n\nCheers,\nMailFlow Outbound Team`,
    isDefault: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "a549d44f-fde2-4fcf-b68a-cf87f61c31c3",
    name: "Final Value proposition (Step 3)",
    sequenceStep: 3,
    subject: "One last try: {{company}} scaling",
    body: `Hi {{first_name}},\n\nI haven't heard back, so I'll assume timing isn't right for {{company}} to look at outbound scaling.\n\nIf anything changes and you want to scale pipelines securely without custom script headaches, feel free to reply directly to this thread.\n\nAll the best on your growth,\nMailFlow Outbound Team`,
    isDefault: true,
    updatedAt: new Date().toISOString()
  }
];

export const SEED_LEADS: any[] = [];

export const SEED_CAMPAIGNS: any[] = [];

export const SEED_SEQUENCES: any[] = [];

export const SEED_EVENTS: any[] = [];

export const SEED_DNC: any[] = [];

export const SEED_REPLIES: any[] = [];

// =====================================================
// LEGACY MOCK DB FILE UTILS
// =====================================================
export function getDb(): LocalDb {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: LocalDb = {
      leads: SEED_LEADS,
      templates: DEFAULT_TEMPLATES,
      campaigns: SEED_CAMPAIGNS,
      sequences: SEED_SEQUENCES,
      events: SEED_EVENTS,
      dncList: SEED_DNC,
      replies: SEED_REPLIES,
      outlookConfig: {
        msTenantId: "tenant-dummy-8fa8",
        msClientId: "client-dummy-932f",
        msSenderEmail: "outreach@mailflow-saas.onmicrosoft.com",
        isConnected: true
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading db file, regenerating seeds", err);
    return {
      leads: SEED_LEADS,
      templates: DEFAULT_TEMPLATES,
      campaigns: SEED_CAMPAIGNS,
      sequences: SEED_SEQUENCES,
      events: SEED_EVENTS,
      dncList: SEED_DNC,
      replies: SEED_REPLIES,
      outlookConfig: {
        msTenantId: "tenant-dummy-8fa8",
        msClientId: "client-dummy-932f",
        msSenderEmail: "outreach@mailflow-saas.onmicrosoft.com",
        isConnected: true
      }
    };
  }
}

export function saveDb(data: LocalDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing db file", err);
  }
}

// =====================================================
// MODEL MAPPINGS (JS CamelCase <-> DB SnakeCase)
// =====================================================
function mapLeadToDb(l: any) {
  return {
    id: l.id,
    first_name: l.firstName,
    last_name: l.lastName,
    email: l.email,
    company: l.company,
    phone: l.phone,
    title: l.title,
    status: l.status,
    step: l.step ?? 0,
    next_send: l.nextSend,
    last_sent: l.lastSent,
    replied: !!l.replied,
    reply_date: l.replyDate,
    custom_fields: l.customFields || {},
  };
}

function mapLeadFromDb(l: any) {
  return {
    id: l.id,
    firstName: l.first_name,
    lastName: l.last_name,
    email: l.email,
    company: l.company,
    phone: l.phone,
    title: l.title,
    status: l.status,
    step: l.step,
    nextSend: l.next_send,
    lastSent: l.last_sent,
    replied: l.replied,
    replyDate: l.reply_date,
    customFields: l.custom_fields,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

function mapTemplateToDb(t: any) {
  return {
    id: t.id,
    name: t.name,
    sequence_step: t.sequenceStep,
    subject: t.subject,
    body: t.body,
  };
}

function mapTemplateFromDb(t: any) {
  return {
    id: t.id,
    name: t.name,
    sequenceStep: t.sequence_step,
    subject: t.subject,
    body: t.body,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

function mapCampaignToDb(c: any) {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    attach_pdf: c.attachPdf,
    pdf_url: c.pdfUrl,
    total_leads: c.totalLeads,
    sent_count: c.sentCount,
    open_count: c.openCount,
    reply_count: c.replyCount,
    launched_at: c.launchedAt,
    completed_at: c.completedAt,
    template_id: c.templateId,
    template_step2_id: c.templateStep2Id || null,
    template_step3_id: c.templateStep3Id || null,
  };
}

function mapCampaignFromDb(c: any) {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    attachPdf: c.attach_pdf,
    pdfUrl: c.pdf_url,
    totalLeads: c.total_leads,
    sentCount: c.sent_count,
    openCount: c.open_count,
    replyCount: c.reply_count,
    launchedAt: c.launched_at,
    completedAt: c.completed_at,
    templateId: c.template_id,
    templateStep2Id: c.template_step2_id,
    templateStep3Id: c.template_step3_id,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

function mapSequenceToDb(s: any) {
  return {
    id: s.id,
    campaign_id: s.campaignId,
    lead_id: s.leadId,
    current_step: s.currentStep,
    status: s.status,
    email1_sent_at: s.email1SentAt,
    email2_sent_at: s.email2SentAt,
    email3_sent_at: s.email3SentAt,
    email2_due_at: s.email2DueAt,
    email3_due_at: s.email3DueAt,
    reply_detected_at: s.replyDetectedAt,
    last_error: s.lastError,
  };
}

function mapSequenceFromDb(s: any) {
  return {
    id: s.id,
    campaignId: s.campaign_id,
    leadId: s.lead_id,
    currentStep: s.current_step,
    status: s.status,
    email1SentAt: s.email1_sent_at,
    email2SentAt: s.email2_sent_at,
    email3SentAt: s.email3_sent_at,
    email2DueAt: s.email2_due_at,
    email3DueAt: s.email3_due_at,
    replyDetectedAt: s.reply_detected_at,
    lastError: s.last_error,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function mapEventToDb(e: any) {
  return {
    id: e.id,
    sequence_id: e.sequenceId,
    lead_id: e.leadId,
    campaign_id: e.campaignId,
    step: e.step,
    event_type: e.eventType,
    provider: e.provider || "outlook",
    subject: e.subject,
    to_email: e.toEmail,
    body_preview: e.bodyPreview,
    metadata: e.metadata || {},
    occurred_at: e.occurredAt,
  };
}

function mapEventFromDb(e: any) {
  return {
    id: e.id,
    sequenceId: e.sequence_id,
    leadId: e.lead_id,
    campaignId: e.campaign_id,
    step: e.step,
    eventType: e.event_type,
    provider: e.provider,
    subject: e.subject,
    toEmail: e.to_email,
    bodyPreview: e.body_preview,
    metadata: e.metadata,
    occurredAt: e.occurred_at,
  };
}

function mapReplyToDb(r: any) {
  return {
    id: r.id,
    sequence_id: r.sequenceId,
    lead_id: r.leadId,
    campaign_id: r.campaignId,
    from_name: r.fromName,
    from_email: r.fromEmail,
    subject: r.subject,
    body: r.body,
    is_read: r.isRead,
    sentiment: r.sentiment || "neutral",
    received_at: r.receivedAt,
  };
}

function mapReplyFromDb(r: any) {
  return {
    id: r.id,
    sequenceId: r.sequence_id,
    leadId: r.lead_id,
    campaignId: r.campaign_id,
    fromName: r.from_name,
    fromEmail: r.from_email,
    subject: r.subject,
    body: r.body,
    isRead: r.is_read,
    sentiment: r.sentiment,
    receivedAt: r.received_at,
  };
}

function mapDncToDb(d: any) {
  return {
    id: d.id,
    email: d.email,
    reason: d.reason,
  };
}

function mapDncFromDb(d: any) {
  return {
    id: d.id,
    email: d.email,
    reason: d.reason,
    createdAt: d.created_at,
  };
}

function mapConfigToDb(cfg: any) {
  return {
    ms_tenant_id: cfg.msTenantId,
    ms_client_id: cfg.msClientId,
    ms_sender_email: cfg.msSenderEmail,
    is_connected: cfg.isConnected,
    access_token: cfg.accessToken,
    refresh_token: cfg.refreshToken,
    expires_at: cfg.expiresAt,
  };
}

function mapConfigFromDb(cfg: any) {
  if (!cfg) return null;
  return {
    msTenantId: cfg.ms_tenant_id,
    msClientId: cfg.ms_client_id,
    msSenderEmail: cfg.ms_sender_email,
    isConnected: cfg.is_connected,
    accessToken: cfg.access_token,
    refreshToken: cfg.refresh_token,
    expiresAt: cfg.expires_at,
  };
}

// =====================================================
// ASYNC ADAPTER LAYER (SUPABASE & MOCK FALLBACKS)
// =====================================================

// LEADS
export async function getLeads(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapLeadFromDb);
  }
  return getDb().leads;
}

export async function saveLead(lead: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapLeadToDb(lead);
    const { data, error } = await supabaseAdmin
      .from("leads")
      .upsert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return mapLeadFromDb(data);
  }
  const db = getDb();
  const index = db.leads.findIndex((l) => l.id === lead.id);
  if (index !== -1) {
    db.leads[index] = { ...db.leads[index], ...lead };
  } else {
    db.leads.push(lead);
  }
  saveDb(db);
  return lead;
}

export async function saveLeadsBulk(leads: any[]): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayloads = leads.map(mapLeadToDb);
    const { data, error } = await supabaseAdmin
      .from("leads")
      .upsert(dbPayloads)
      .select();
    if (error) throw error;
    return (data || []).map(mapLeadFromDb);
  }
  const db = getDb();
  leads.forEach((lead) => {
    const index = db.leads.findIndex((l) => l.id === lead.id);
    if (index !== -1) {
      db.leads[index] = { ...db.leads[index], ...lead };
    } else {
      db.leads.push(lead);
    }
  });
  saveDb(db);
  return leads;
}

export async function deleteLead(id: string): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("leads").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = getDb();
  db.leads = db.leads.filter((l) => l.id !== id);
  saveDb(db);
}

// TEMPLATES
export async function getTemplates(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .order("sequence_step", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapTemplateFromDb);
  }
  return getDb().templates;
}

export async function saveTemplate(template: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapTemplateToDb(template);
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .upsert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return mapTemplateFromDb(data);
  }
  const db = getDb();
  const index = db.templates.findIndex((t) => t.id === template.id);
  if (index !== -1) {
    db.templates[index] = { ...db.templates[index], ...template };
  } else {
    db.templates.push(template);
  }
  saveDb(db);
  return template;
}

export async function deleteTemplate(id: string): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("email_templates").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = getDb();
  db.templates = db.templates.filter((t) => t.id !== id);
  saveDb(db);
}

// CAMPAIGNS
export async function getCampaigns(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCampaignFromDb);
  }
  return getDb().campaigns;
}

export async function saveCampaign(campaign: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapCampaignToDb(campaign);
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .upsert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return mapCampaignFromDb(data);
  }
  const db = getDb();
  const index = db.campaigns.findIndex((c) => c.id === campaign.id);
  if (index !== -1) {
    db.campaigns[index] = { ...db.campaigns[index], ...campaign };
  } else {
    db.campaigns.push(campaign);
  }
  saveDb(db);
  return campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = getDb();
  db.campaigns = db.campaigns.filter((c) => c.id !== id);
  db.sequences = db.sequences.filter((s) => s.campaignId !== id);
  db.events = db.events.filter((e) => e.campaignId !== id);
  db.replies = db.replies.filter((r) => r.campaignId !== id);
  saveDb(db);
}

// SEQUENCES
export async function getSequences(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from("sequences").select("*");
    if (error) throw error;
    return (data || []).map(mapSequenceFromDb);
  }
  return getDb().sequences;
}

export async function saveSequence(sequence: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapSequenceToDb(sequence);
    const { data, error } = await supabaseAdmin
      .from("sequences")
      .upsert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return mapSequenceFromDb(data);
  }
  const db = getDb();
  const index = db.sequences.findIndex((s) => s.id === sequence.id);
  if (index !== -1) {
    db.sequences[index] = { ...db.sequences[index], ...sequence };
  } else {
    db.sequences.push(sequence);
  }
  saveDb(db);
  return sequence;
}

export async function saveSequencesBulk(sequences: any[]): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayloads = sequences.map(mapSequenceToDb);
    const { data, error } = await supabaseAdmin
      .from("sequences")
      .upsert(dbPayloads)
      .select();
    if (error) throw error;
    return (data || []).map(mapSequenceFromDb);
  }
  const db = getDb();
  sequences.forEach((sequence) => {
    const index = db.sequences.findIndex((s) => s.id === sequence.id);
    if (index !== -1) {
      db.sequences[index] = { ...db.sequences[index], ...sequence };
    } else {
      db.sequences.push(sequence);
    }
  });
  saveDb(db);
  return sequences;
}

// EVENTS
export async function getEvents(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from("email_events").select("*");
    if (error) throw error;
    return (data || []).map(mapEventFromDb);
  }
  return getDb().events;
}

export async function saveEvent(event: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapEventToDb(event);
    const { data, error } = await supabaseAdmin
      .from("email_events")
      .upsert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return mapEventFromDb(data);
  }
  const db = getDb();
  const index = db.events.findIndex((e) => e.id === event.id);
  if (index !== -1) {
    db.events[index] = { ...db.events[index], ...event };
  } else {
    db.events.push(event);
  }
  saveDb(db);
  return event;
}

export async function saveEventsBulk(events: any[]): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayloads = events.map(mapEventToDb);
    const { data, error } = await supabaseAdmin
      .from("email_events")
      .upsert(dbPayloads)
      .select();
    if (error) throw error;
    return (data || []).map(mapEventFromDb);
  }
  const db = getDb();
  events.forEach((event) => {
    const index = db.events.findIndex((e) => e.id === event.id);
    if (index !== -1) {
      db.events[index] = { ...db.events[index], ...event };
    } else {
      db.events.push(event);
    }
  });
  saveDb(db);
  return events;
}

// REPLIES
export async function getReplies(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("replies")
      .select("*")
      .order("received_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapReplyFromDb);
  }
  return getDb().replies;
}

export async function saveReply(reply: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapReplyToDb(reply);
    const { data, error } = await supabaseAdmin
      .from("replies")
      .upsert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return mapReplyFromDb(data);
  }
  const db = getDb();
  const index = db.replies.findIndex((r) => r.id === reply.id);
  if (index !== -1) {
    db.replies[index] = { ...db.replies[index], ...reply };
  } else {
    db.replies.push(reply);
  }
  saveDb(db);
  return reply;
}

export async function deleteReply(id: string): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("replies").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = getDb();
  db.replies = db.replies.filter((r) => r.id !== id);
  saveDb(db);
}

// DNC LIST
export async function getDncList(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("dnc_list")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDncFromDb);
  }
  return getDb().dncList;
}

export async function saveDnc(dnc: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapDncToDb(dnc);
    const { data, error } = await supabaseAdmin
      .from("dnc_list")
      .upsert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return mapDncFromDb(data);
  }
  const db = getDb();
  const index = db.dncList.findIndex((d) => d.id === dnc.id);
  if (index !== -1) {
    db.dncList[index] = { ...db.dncList[index], ...dnc };
  } else {
    db.dncList.push(dnc);
  }
  saveDb(db);
  return dnc;
}

export async function deleteDnc(id: string): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("dnc_list").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = getDb();
  db.dncList = db.dncList.filter((d) => d.id !== id);
  saveDb(db);
}

// OUTLOOK CONFIG
export async function getOutlookConfig(): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("outlook_configs")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return mapConfigFromDb(data);
  }
  return getDb().outlookConfig;
}

export async function saveOutlookConfig(config: any): Promise<any> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const dbPayload = mapConfigToDb(config);
    // Find the first ID to update, or let it generate a new one
    const { data: existing } = await supabaseAdmin
      .from("outlook_configs")
      .select("id")
      .limit(1)
      .maybeSingle();
    
    const payloadWithId = existing?.id 
      ? { ...dbPayload, id: existing.id } 
      : dbPayload;

    const { data, error } = await supabaseAdmin
      .from("outlook_configs")
      .upsert(payloadWithId)
      .select()
      .single();
    if (error) throw error;
    return mapConfigFromDb(data);
  }
  const db = getDb();
  db.outlookConfig = { ...db.outlookConfig, ...config };
  saveDb(db);
  return config;
}
