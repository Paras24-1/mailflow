import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLead, getDncList, deleteLead, getDb, saveDb } from "@/lib/db";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const leads = await getLeads();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase();
    const status = searchParams.get("status");

    let filtered = leads;

    if (q) {
      filtered = filtered.filter(
        (l: any) =>
          (l.firstName || "").toLowerCase().includes(q) ||
          (l.lastName || "").toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q) ||
          (l.company || "").toLowerCase().includes(q) ||
          (l.title || "").toLowerCase().includes(q)
      );
    }

    if (status) {
      filtered = filtered.filter((l: any) => l.status === status);
    }

    filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, company, phone, title } = await req.json();

    if (!email || !firstName) {
      return NextResponse.json({ error: "First name and Email are required." }, { status: 400 });
    }

    const dncList = await getDncList();
    const isDnc = dncList.some((d: any) => d.email.toLowerCase() === email.toLowerCase());
    if (isDnc) {
      return NextResponse.json(
        { error: "This email address is on the global DNC (Do Not Contact) suppression list." },
        { status: 400 }
      );
    }

    const leads = await getLeads();
    const isDup = leads.some((l: any) => l.email.toLowerCase() === email.toLowerCase());
    if (isDup) {
      return NextResponse.json({ error: "A lead with this email address already exists." }, { status: 400 });
    }

    const newLead = {
      id: randomUUID(),
      firstName: firstName || "",
      lastName: lastName || "",
      email: email.trim(),
      company: company || "",
      phone: phone || "",
      title: title || "",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const saved = await saveLead(newLead);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { leadIds } = await req.json();

    if (!leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json({ error: "leadIds array is required" }, { status: 400 });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin.from("leads").delete().in("id", leadIds);
      if (error) throw error;
    } else {
      const db = getDb();
      db.leads = db.leads.filter((l: any) => !leadIds.includes(l.id));
      db.sequences = db.sequences.filter((s: any) => !leadIds.includes(s.leadId));
      db.events = db.events.filter((e: any) => !leadIds.includes(e.leadId));
      db.replies = db.replies.filter((r: any) => !leadIds.includes(r.leadId));
      saveDb(db);
    }

    return NextResponse.json({ success: true, count: leadIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
