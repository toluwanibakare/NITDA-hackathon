import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) console.warn('[thirdeye-api] missing SUPABASE_URL / SERVICE_ROLE_KEY');

export const supabase = createClient(url, key);
