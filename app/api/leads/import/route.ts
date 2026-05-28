import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeadsBulk, getDncList, getDb, saveDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid rows format provided." }, { status: 400 });
    }

    const dncList = await getDncList();
    const leads = await getLeads();

    const dncEmails = new Set(dncList.map((d: any) => d.email.toLowerCase()));
    const leadEmails = new Set(leads.map((l: any) => l.email.toLowerCase()));

    let imported = 0;
    let dupes = 0;
    let dncCount = 0;
    const leadsToSave: any[] = [];

    for (const row of rows) {
      const rawEmail = row.email || row.Email || "";
      if (!rawEmail) continue;

      const email = rawEmail.trim().toLowerCase();
      const firstName =
        row.firstName ||
        row.first_name ||
        row["First Name"] ||
        row.Name ||
        "";
      const lastName = row.lastName || row.last_name || row["Last Name"] || "";
      const company = row.company || row.Company || "";
      const phone = row.phone || row.Phone || row["Phone Number"] || "";
      const title = row.title || row.Title || row["Job Title"] || "";

      if (dncEmails.has(email)) {
        dncCount++;
        continue;
      }

      if (leadEmails.has(email)) {
        dupes++;
        continue;
      }

      const newLead = {
        id: randomUUID(),
        firstName: firstName || "Lead",
        lastName: lastName,
        email: email,
        company: company,
        phone: phone,
        title: title,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      leadsToSave.push(newLead);
      imported++;
      // Add to set to prevent duplicates within the same import file!
      leadEmails.add(email);
    }

    if (leadsToSave.length > 0) {
      await saveLeadsBulk(leadsToSave);
    }

    return NextResponse.json({
      success: true,
      imported,
      dupes,
      dncCount,
      total: rows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
