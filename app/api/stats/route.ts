import { NextResponse } from "next/server";
import { getLeads, getSequences, getEvents, getReplies, getDncList } from "@/lib/db";

export async function GET() {
  try {
    const [leads, sequences, events, replies, dncList] = await Promise.all([
      getLeads(),
      getSequences(),
      getEvents(),
      getReplies(),
      getDncList()
    ]);

    const totalLeadsCount = leads.length;
    const dncCount = dncList.length;

    const activeSequencesCount = sequences.filter((s: any) => s.status === "active").length;
    const repliedSequencesCount = sequences.filter((s: any) => s.status === "replied").length;
    const completedSequencesCount = sequences.filter((s: any) => s.status === "completed").length;

    const totalEmailsSent = events.filter((e: any) => e.eventType === "sent").length;
    const totalEmailsOpened = events.filter((e: any) => e.eventType === "opened").length;
    const totalEmailsClicked = events.filter((e: any) => e.eventType === "clicked").length;
    const totalReplies = replies.length;

    const openRate = totalEmailsSent > 0 ? Math.round((totalEmailsOpened / totalEmailsSent) * 100) : 0;
    const clickRate = totalEmailsSent > 0 ? Math.round((totalEmailsClicked / totalEmailsSent) * 100) : 0;
    const replyRate = totalEmailsSent > 0 ? Math.round((totalReplies / totalEmailsSent) * 100) : 0;

    const stepStats = {
      step1Sent: events.filter((e: any) => e.step === 1 && e.eventType === "sent").length,
      step1Open: events.filter((e: any) => e.step === 1 && e.eventType === "opened").length,
      step1Reply: events.filter((e: any) => e.step === 1 && e.eventType === "replied").length,
      step2Sent: events.filter((e: any) => e.step === 2 && e.eventType === "sent").length,
      step2Open: events.filter((e: any) => e.step === 2 && e.eventType === "opened").length,
      step2Reply: events.filter((e: any) => e.step === 2 && e.eventType === "replied").length,
      step3Sent: events.filter((e: any) => e.step === 3 && e.eventType === "sent").length,
      step3Open: events.filter((e: any) => e.step === 3 && e.eventType === "opened").length,
      step3Reply: events.filter((e: any) => e.step === 3 && e.eventType === "replied").length,
    };

    const recentEvents = [...events]
      .sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalLeadsCount,
      dncCount,
      activeSequencesCount,
      repliedSequencesCount,
      completedSequencesCount,
      totalEmailsSent,
      totalEmailsOpened,
      totalEmailsClicked,
      totalReplies,
      openRate,
      clickRate,
      replyRate,
      stepStats,
      recentEvents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
