import { NextResponse } from "next/server";
import {
  saveLeadsBulk,
  saveTemplate,
  saveCampaign,
  saveSequencesBulk,
  saveEventsBulk,
  saveReply,
  saveDnc,
  DEFAULT_TEMPLATES,
  SEED_LEADS,
  SEED_CAMPAIGNS,
  SEED_SEQUENCES,
  SEED_EVENTS,
  SEED_DNC,
  SEED_REPLIES,
  getLeads,
  getTemplates,
  getCampaigns,
  getSequences,
  getEvents,
  getReplies,
  getDncList
} from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";
    
    let leadsCount = 0;
    let templatesCount = 0;
    let campaignsCount = 0;
    let sequencesCount = 0;
    let eventsCount = 0;
    let dncCount = 0;
    let repliesCount = 0;

    if (!force) {
      // Check existing data to prevent duplicate seeds
      const [leads, templates, campaigns, sequences, events, replies, dnc] = await Promise.all([
        getLeads(),
        getTemplates(),
        getCampaigns(),
        getSequences(),
        getEvents(),
        getReplies(),
        getDncList()
      ]);

      if (
        leads.length > 0 ||
        templates.length > 0 ||
        campaigns.length > 0 ||
        sequences.length > 0 ||
        events.length > 0 ||
        replies.length > 0 ||
        dnc.length > 0
      ) {
        return NextResponse.json(
          {
            message: "Database already has data. Use POST with ?force=true query parameter to seed anyway.",
            status: {
              leads: leads.length,
              templates: templates.length,
              campaigns: campaigns.length,
              sequences: sequences.length,
              events: events.length,
              replies: replies.length,
              dnc: dnc.length
            }
          },
          { status: 400 }
        );
      }
    }

    // Seed Templates
    for (const t of DEFAULT_TEMPLATES) {
      await saveTemplate(t);
      templatesCount++;
    }

    // Seed Leads
    await saveLeadsBulk(SEED_LEADS);
    leadsCount += SEED_LEADS.length;

    // Seed Campaigns
    for (const c of SEED_CAMPAIGNS) {
      await saveCampaign(c);
      campaignsCount++;
    }

    // Seed Sequences
    await saveSequencesBulk(SEED_SEQUENCES);
    sequencesCount += SEED_SEQUENCES.length;

    // Seed Events
    await saveEventsBulk(SEED_EVENTS);
    eventsCount += SEED_EVENTS.length;

    // Seed DNC
    for (const d of SEED_DNC) {
      await saveDnc(d);
      dncCount++;
    }

    // Seed Replies
    for (const r of SEED_REPLIES) {
      await saveReply(r);
      repliesCount++;
    }

    return NextResponse.json({
      message: "Database seeded successfully!",
      seeded: {
        leads: leadsCount,
        templates: templatesCount,
        campaigns: campaignsCount,
        sequences: sequencesCount,
        events: eventsCount,
        dnc: dncCount,
        replies: repliesCount
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
