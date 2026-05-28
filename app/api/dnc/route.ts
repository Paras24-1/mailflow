import { NextRequest, NextResponse } from "next/server";
import { getDncList, saveDnc, getDb, saveDb } from "@/lib/db";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const dncList = await getDncList();
    return NextResponse.json(dncList);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, reason } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const dncList = await getDncList();
    const isExists = dncList.some(
      (d: any) => d.email.toLowerCase() === email.toLowerCase()
    );
    if (isExists) {
      return NextResponse.json(
        { error: "Email already exists in suppression list." },
        { status: 400 }
      );
    }

    const newDnc = {
      id: randomUUID(),
      email: email.trim().toLowerCase(),
      reason: reason || "Manual single entry",
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Save to dnc_list table
      const { error: dncErr } = await supabaseAdmin.from("dnc_list").insert({
        id: newDnc.id,
        email: newDnc.email,
        reason: newDnc.reason
      });
      if (dncErr) throw dncErr;

      // 2. Update leads with this email to 'dnc' status
      const { error: leadErr } = await supabaseAdmin
        .from("leads")
        .update({ status: "dnc" })
        .eq("email", newDnc.email);
      if (leadErr) throw leadErr;

      // 3. Find matching lead IDs to update sequences
      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("id")
        .eq("email", newDnc.email);

      if (leads && leads.length > 0) {
        const leadIds = leads.map((l: any) => l.id);
        const { error: seqErr } = await supabaseAdmin
          .from("sequences")
          .update({ status: "dnc" })
          .in("lead_id", leadIds);
        if (seqErr) throw seqErr;
      }
    } else {
      const db = getDb();
      db.dncList.push(newDnc);

      db.leads = db.leads.map((l: any) => {
        if (l.email.toLowerCase() === email.toLowerCase()) {
          return { ...l, status: "dnc" };
        }
        return l;
      });

      db.sequences = db.sequences.map((s: any) => {
        const lead = db.leads.find((l: any) => l.id === s.leadId);
        if (lead && lead.email.toLowerCase() === email.toLowerCase()) {
          return { ...s, status: "dnc" };
        }
        return s;
      });

      saveDb(db);
    }

    return NextResponse.json(newDnc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
