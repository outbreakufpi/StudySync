import { supabaseAdmin } from '../config/supabaseClient.js';

function normalizeError(error) {
	if (!error) return null;
	const normalized = new Error(error.message || 'Database error');
	normalized.status = error.status || 500;
	return normalized;
}

export async function getAllSessionsForUser(client, userId) {
	const db = supabaseAdmin || client;
	const { data, error } = await db
		.from('study_sessions')
		.select('id, user_id, subject_id, started_at, ended_at, duration_minutes, questions_answered, depth, notes, metadata, created_at')
		.eq('user_id', userId)
		.order('started_at', { ascending: false });

	if (error) throw normalizeError(error);
	return data || [];
}

export async function createSessionForUser(client, userId, payload) {
	const db = supabaseAdmin || client;
	const { data, error } = await db
		.from('study_sessions')
		.insert({
			user_id: userId,
			subject_id: payload.subject_id || null,
			started_at: new Date(payload.started_at),
			ended_at: new Date(payload.ended_at),
			questions_answered: payload.questions_answered ?? 0,
			depth: payload.depth ?? null,
			notes: payload.notes || null,
			metadata: payload.metadata || {},
		})
		.select('id, user_id, subject_id, started_at, ended_at, duration_minutes, questions_answered, depth, notes, metadata, created_at')
		.single();

	if (error) throw normalizeError(error);
	return data;
}
