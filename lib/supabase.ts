import "server-only";
import { createClient } from "@supabase/supabase-js";
export function database() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
    throw new Error("Database not configured");
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function authClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY)
    throw new Error("Auth not configured");
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
