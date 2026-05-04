import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Default client using anon key (for user-scoped operations)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client with service role (use carefully, server-side only)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
	? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
	: supabase;

export default supabase;
