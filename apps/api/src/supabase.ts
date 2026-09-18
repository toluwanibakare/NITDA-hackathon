import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'placeholder-service-role-key';

export const isSupabaseConfigured = Boolean(
  url && key && !url.includes('placeholder') && !key.includes('placeholder')
);

export const runtimeMode = isSupabaseConfigured ? 'supabase' : 'demo';

if (!isSupabaseConfigured) {
  console.warn(
    '[thirdeye-api] SUPABASE_URL or service role key not configured. Endpoints will use in-memory seed baseline where appropriate.'
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
