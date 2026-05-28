import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeadsBulk, saveDnc, getDncList, getSequences, saveSequencesBulk, getDb, saveDb } from "@/lib/db";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { leadIds, reason } = await req.json();

    if (!leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json({ error: "leadIds array is required" }, { status: 400 });
    }

    let count = 0;

    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Fetch emails of matching leads
      const { data: leads, error: leadsErr } = await supabaseAdmin
        .from("leads")
        .select("id, email")
        .in("id", leadIds);
      if (leadsErr) throw leadsErr;

      if (leads && leads.length > 0) {
        const emails = leads.map((l: any) => l.email);

        // 2. Update leads to status = 'dnc'
        const { error: updErr } = await supabaseAdmin
          .from("leads")
          .update({ status: "dnc" })
          .in("id", leadIds);
        if (updErr) throw updErr;

        // 3. Insert into DNC list (upsert)
        const dncPayloads = emails.map((email: string) => ({
          email: email.trim().toLowerCase(),
          reason: reason || "Manual bulk opt-out",
        }));
        
        const { error: dncErr } = await supabaseAdmin
          .from("dnc_list")
          .upsert(dncPayloads, { onConflict: "lower(email)" });
        if (dncErr) throw dncErr;

        // 4. Update sequences to status = 'dnc'
        const { error: seqErr } = await supabaseAdmin
          .from("sequences")
          .update({ status: "dnc" })
          .in("lead_id", leadIds)
          .eq("status", "active");
        if (seqErr) throw seqErr;

        count = leads.length;
      }
    } else {
      const db = getDb();
      for (const lid of leadIds) {
        const idx = db.leads.findIndex((l: any) => l.id === lid);
        if (idx !== -1) {
          const email = db.leads[idx].email;
          db.leads[idx].status = "dnc";

          if (!db.dncList.some((d: any) => d.email.toLowerCase() === email.toLowerCase())) {
            db.dncList.push({
              id: randomUUID(),
              email,
              reason: reason || "Manual bulk opt-out",
              createdAt: new Date().toISOString(),
            });
          }
          count++;
        }

        const seqs = db.sequences.filter((s: any) => s.leadId === lid && s.status === "active");
        for (const s of seqs) {
          s.status = "dnc";
        }
      }
      saveDb(db);
    }

    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
