import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

// Server-only Supabase client with the service-role key. Never import this
// from client components — it bypasses RLS.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): any {
  if (adminClient) return adminClient;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
