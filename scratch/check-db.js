import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  try {
    const { data: templates, error: tErr } = await supabase
      .from("email_templates")
      .select("*");
    
    if (tErr) throw tErr;
    console.log("TEMPLATES IN DB:");
    console.log(JSON.stringify(templates, null, 2));

    const { data: sequences, error: sErr } = await supabase
      .from("sequences")
      .select("*");
    
    if (sErr) throw sErr;
    console.log("\nSEQUENCES IN DB:");
    console.log(JSON.stringify(sequences, null, 2));
  } catch (err) {
    console.error("Error checking DB:", err);
  }
}

checkDb();
