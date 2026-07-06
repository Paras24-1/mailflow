import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, saveCampaign, getTemplates, getLeads, saveSequencesBulk, saveEventsBulk, getDb, saveDb } from "@/lib/db";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json(campaigns);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, templateId, templateStep2Id, templateStep3Id, leadIds, attachPdf, pdfUrl } = await req.json();

    if (!name || !templateId || !leadIds || leadIds.length === 0) {
      return NextResponse.json(
        { error: "Campaign name, template reference, and target leads are required." },
        { status: 400 }
      );
    }

    const templates = await getTemplates();
    const templateStep1 = templates.find((t: any) => t.id === templateId);

    if (!templateStep1) {
      return NextResponse.json({ error: "Chosen campaign template not found" }, { status: 404 });
    }

    if (templateStep1.sequenceStep !== 1) {
      return NextResponse.json(
        { error: "Campaigns must be launched using a Step 1 (Introduction) template." },
        { status: 400 }
      );
    }

    const leads = await getLeads();
    const eligibleLeads = leads.filter(
      (l: any) => leadIds.includes(l.id) && l.status === "active"
    );

    if (eligibleLeads.length === 0) {
      return NextResponse.json(
        { error: "No active eligible leads selected for this campaign." },
        { status: 400 }
      );
    }

    const campaignId = randomUUID();

    const newCampaign = {
      id: campaignId,
      name,
      templateId,
      templateStep2Id: templateStep2Id || null,
      templateStep3Id: templateStep3Id || null,
      status: "running",
      attachPdf: !!attachPdf,
      pdfUrl: pdfUrl || "",
      totalLeads: eligibleLeads.length,
      sentCount: isSupabaseConfigured ? 0 : eligibleLeads.length,
      openCount: 0,
      replyCount: 0,
      launchedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const savedCampaign = await saveCampaign(newCampaign);

    const sequencesToSave: any[] = [];
    const eventsToSave: any[] = [];
    const campaignLeadsToSave: any[] = [];

    for (const lead of eligibleLeads) {
      const sequenceId = randomUUID();
      const email1SentAt = new Date().toISOString();
      const email2DueAt = new Date(Date.now() + 4 * 1000).toISOString();

      const subjectTemplate = templateStep1.subject;
      const bodyTemplate = templateStep1.body;

      const subject = subjectTemplate
        .replace(/{{first_name}}/g, lead.firstName)
        .replace(/{{company}}/g, lead.company || "your company");
      const body = bodyTemplate
        .replace(/{{first_name}}/g, lead.firstName)
        .replace(/{{company}}/g, lead.company || "your company");

      campaignLeadsToSave.push({
        campaign_id: campaignId,
        lead_id: lead.id
      });

      if (isSupabaseConfigured) {
        // In live Supabase mode: sequences start at step 0 so n8n handles sending the actual Step 1 template
        sequencesToSave.push({
          id: sequenceId,
          campaignId,
          leadId: lead.id,
          currentStep: 0,
          status: "active",
          createdAt: new Date().toISOString(),
        });
      } else {
        // In local mock DB mode: start at step 1 and mock the Step 1 sent event immediately
        sequencesToSave.push({
          id: sequenceId,
          campaignId,
          leadId: lead.id,
          currentStep: 1,
          status: "active",
          email1SentAt,
          email2DueAt,
          createdAt: new Date().toISOString(),
        });

        eventsToSave.push({
          id: randomUUID(),
          sequenceId,
          leadId: lead.id,
          campaignId,
          step: 1,
          eventType: "sent",
          subject,
          toEmail: lead.email,
          bodyPreview: body.substring(0, 100) + "...",
          occurredAt: email1SentAt,
        });
      }
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      // Save campaign_leads
      const { error: clErr } = await supabaseAdmin.from("campaign_leads").insert(campaignLeadsToSave);
      if (clErr) throw clErr;
    }

    await saveSequencesBulk(sequencesToSave);
    if (eventsToSave.length > 0) {
      await saveEventsBulk(eventsToSave);
    }

    if (isSupabaseConfigured) {
      const webhookUrl = process.env.N8N_LAUNCH_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            record: {
              id: campaignId,
              status: "running"
            }
          })
        }).catch(err => console.error("Error triggering n8n campaign-launch webhook:", err));
      }
    }

    return NextResponse.json(savedCampaign, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
