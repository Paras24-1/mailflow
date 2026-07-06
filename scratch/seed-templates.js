import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const DEFAULT_TEMPLATES = [
  {
    id: "e4a3b839-8670-4d5b-9d41-3b7c8df233c1",
    name: "Standard Outreach (Step 1)",
    sequence_step: 1,
    subject: "Quick question on {{company}}'s system automation",
    body: `Hi {{first_name}},\n\nI was looking through {{company}}'s recent product launches and noticed your team is scaling systems operations.\n\nWe build streamlined client sequence automations that cut operations complexity by 40% using unified pipelines. Do you have 5 minutes this Thursday for a brief chat?\n\nBest regards,\nMailFlow Outbound Team`,
  },
  {
    id: "c3b0f519-74d3-4889-8d4e-28be86df11c2",
    name: "Soft Follow-up (Step 2)",
    sequence_step: 2,
    subject: "Re: Quick question on {{company}}'s system automation",
    body: `Hey {{first_name}},\n\nJust wanted to bump this to the top of your inbox in case you missed it. I know how busy scaling teams can get.\n\nTo recap: we simplify outreach sequence tracking so you can focus purely on closed deals.\n\nLet me know if you are open to checking out a quick mock-up.\n\nCheers,\nMailFlow Outbound Team`,
  },
  {
    id: "a549d44f-fde2-4fcf-b68a-cf87f61c31c3",
    name: "Final Value proposition (Step 3)",
    sequence_step: 3,
    subject: "One last try: {{company}} scaling",
    body: `Hi {{first_name}},\n\nI haven't heard back, so I'll assume timing isn't right for {{company}} to look at outbound scaling.\n\nIf anything changes and you want to scale pipelines securely without custom script headaches, feel free to reply directly to this thread.\n\nAll the best on your growth,\nMailFlow Outbound Team`,
  }
];

async function main() {
  console.log("🌱 Seeding default sequence templates to Supabase...");
  for (const t of DEFAULT_TEMPLATES) {
    const { error } = await supabase.from("email_templates").upsert(t);
    if (error) {
      console.error(`❌ Error seeding template ${t.name}:`, error.message);
    } else {
      console.log(`✅ Seeded template: ${t.name}`);
    }
  }
  console.log("🎉 Seeding complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
