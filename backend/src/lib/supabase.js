import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("[Supabase Init] URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
console.log("[Supabase Init] Service Role Key:", supabaseKey ? "✓ Set" : "✗ Missing");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("[Supabase Init] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

console.log("[Supabase Init] Client initialized successfully ✓");
