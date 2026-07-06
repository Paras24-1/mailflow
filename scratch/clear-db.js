import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the environment variables from the MailFlow project directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log("🧹 Clearing all tables in Supabase...");
  
  // Deleting records in reverse dependency order to prevent foreign key violations
  const tables = [
    "replies",
    "email_events",
    "sequences",
    "campaign_leads",
    "campaigns",
    "leads",
    "dnc_list",
    "csv_imports",
    "outlook_configs",
    "email_templates"
  ];

  for (const table of tables) {
    console.log(`Truncating table: ${table}...`);
    // Supabase requires a filter for deletes; filtering on a non-existent UUID deletes all rows
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error(`❌ Error clearing table ${table}:`, error.message);
    } else {
      console.log(`✅ Cleared ${table}.`);
    }
  }

  console.log("\n🎉 All Supabase tables cleared successfully! The database is now empty.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
