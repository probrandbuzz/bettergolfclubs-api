import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client — uses anon key, respects RLS
// Safe to use in browser / client components
export const supabaseClient = createClient(url, anon);

// Admin client — uses service_role key, bypasses RLS
// ONLY use in API routes / server-side code — never expose to browser
export const supabaseAdmin = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false }
});
