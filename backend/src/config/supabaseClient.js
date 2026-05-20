import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Default Supabase client for normal user operations.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function createSupabaseUserClient(accessToken) {
	return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		global: {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
		},
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	});
}

// Optional admin client that uses the service role key for privileged server actions.
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
	? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
	: null;

export default supabase;
