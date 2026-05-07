import { supabaseAdmin, createSupabaseUserClient } from '../config/supabaseClient.js';

function buildProfilePayload(authUser) {
	const metadata = authUser?.user_metadata || {};
	const authUid = authUser?.id;

	return {
		id: authUid,
		auth_uid: authUid,
		full_name: metadata.full_name || metadata.fullname || metadata.name || null,
		email: authUser?.email || null,
		avatar_url: metadata.avatar_url || metadata.avatar || null,
		current_mode: metadata.current_mode || 'university',
		timezone: metadata.timezone || null,
		locale: metadata.locale || 'pt-BR',
		metadata,
	};
}

export async function getAuthenticatedUserContext(accessToken) {
	const client = createSupabaseUserClient(accessToken);
	const { data, error } = await client.auth.getUser(accessToken);

	if (error || !data?.user) {
		const authError = new Error('Invalid or expired token');
		authError.status = 401;
		throw authError;
	}

	const authUser = data.user;
	const profile = await ensureProfile(client, authUser);

	return { client, authUser, profile };
}

export async function ensureProfile(client, authUser) {
	const db = supabaseAdmin || client;
	const payload = buildProfilePayload(authUser);

	const { data: profileByAuthUid, error: authUidError } = await db
		.from('profiles')
		.select('*')
		.eq('auth_uid', authUser.id)
		.maybeSingle();

	if (authUidError && authUidError.code !== 'PGRST116') {
		throw authUidError;
	}

	if (profileByAuthUid) {
		return profileByAuthUid;
	}

	if (authUser.email) {
		const { data: profileByEmail, error: emailError } = await db
			.from('profiles')
			.select('*')
			.eq('email', authUser.email)
			.maybeSingle();

		if (emailError && emailError.code !== 'PGRST116') {
			throw emailError;
		}

		if (profileByEmail) {
			if (!profileByEmail.auth_uid) {
				const { data: claimedProfile, error: claimError } = await db
					.from('profiles')
					.update({
						auth_uid: authUser.id,
						full_name: payload.full_name || profileByEmail.full_name,
						avatar_url: payload.avatar_url || profileByEmail.avatar_url,
						current_mode: payload.current_mode || profileByEmail.current_mode || 'university',
						locale: payload.locale || profileByEmail.locale || 'pt-BR',
						timezone: payload.timezone || profileByEmail.timezone,
						metadata: {
							...(profileByEmail.metadata && typeof profileByEmail.metadata === 'object' ? profileByEmail.metadata : {}),
							...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
						},
						updated_at: new Date().toISOString(),
					})
					.eq('email', authUser.email)
					.select('*')
					.single();

				if (!claimError && claimedProfile) {
					return claimedProfile;
				}
			}

			return profileByEmail;
		}
	}

	const { data: insertedProfile, error: insertError } = await db
		.from('profiles')
		.insert(payload)
		.select('*')
		.single();

	if (insertError) {
		throw insertError;
	}

	return insertedProfile;
}

export async function recordLoginMetadata(client, authUser) {
	const db = supabaseAdmin || client;
	const profile = await ensureProfile(client, authUser);
	const metadata = profile?.metadata && typeof profile.metadata === 'object' ? { ...profile.metadata } : {};
	const loginCount = Number(metadata.login_count || 0) + 1;

	const { data, error } = await db
		.from('profiles')
		.update({
			metadata: {
				...metadata,
				login_count: loginCount,
				last_login_at: new Date().toISOString(),
			},
			updated_at: new Date().toISOString(),
		})
		.eq('auth_uid', authUser.id)
		.select('*')
		.single();

	if (error) {
		return profile;
	}

	return data;
}

export function getProfileDisplayName(profile, authUser) {
	return profile?.full_name || authUser?.user_metadata?.full_name || authUser?.email || 'Você';
}

export function getDatabaseClient(client) {
	return supabaseAdmin || client;
}