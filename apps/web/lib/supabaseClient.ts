import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export const isSupabaseEnvConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabaseBrowser = (): SupabaseClient => {
  if (!isSupabaseEnvConfigured()) {
    throw new Error('Supabase env not configured');
  }
  if (!cached) {
    cached = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return cached;
};
