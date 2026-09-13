import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

export const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_URL.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn('[thirdeye-api] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Endpoints will use in-memory seed baseline where appropriate.');
}

export const supabase = createClient(url, key);
