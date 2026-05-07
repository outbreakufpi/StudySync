import { supabaseAdmin } from '../config/supabaseClient.js';

function normalizeOrderError(error) {
	if (!error) return null;
	const normalized = new Error(error.message || 'Database error');
	normalized.status = error.status || 500;
	return normalized;
}

export async function getAllSubjectsForUser(client, userId, mode = null) {
	const db = supabaseAdmin || client;
	let query = db
		.from('subjects')
		.select('*')
		.eq('user_id', userId);

	if (mode) {
		query = query.eq('mode', mode);
	}

	const { data, error } = await query.order('created_at', { ascending: false });

	if (error) throw normalizeOrderError(error);
	return data || [];
}

export async function createSubject(client, userId, payload) {
	const db = supabaseAdmin || client;
	const { data, error } = await db
		.from('subjects')
		.insert({
			user_id: userId,
			name: payload.name,
			professor: payload.professor || null,
			room: payload.room || null,
			color: payload.color || null,
			code: payload.code || null,
			mode: payload.mode || 'university',
			metadata: payload.metadata || {},
		})
		.select('*')
		.single();

	if (error) throw normalizeOrderError(error);
	return data;
}

export async function updateSubjectForUser(client, userId, subjectId, payload) {
	const db = supabaseAdmin || client;
	const data = {};

	if (Object.prototype.hasOwnProperty.call(payload, 'name')) data.name = payload.name;
	if (Object.prototype.hasOwnProperty.call(payload, 'professor')) data.professor = payload.professor ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'room')) data.room = payload.room ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'color')) data.color = payload.color ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'code')) data.code = payload.code ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'mode')) data.mode = payload.mode ?? 'university';
	if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) data.metadata = payload.metadata ?? {};
	if (Object.prototype.hasOwnProperty.call(payload, 'is_active')) data.is_active = payload.is_active ?? true;

	const { data: updated, error } = await db
		.from('subjects')
		.update(data)
		.eq('id', subjectId)
		.eq('user_id', userId)
		.select('*')
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			const notFound = new Error('Subject not found');
			notFound.status = 404;
			throw notFound;
		}
		throw normalizeOrderError(error);
	}

	return updated;
}

export async function deleteSubjectForUser(client, userId, subjectId) {
	const db = supabaseAdmin || client;
	const { error } = await db
		.from('subjects')
		.delete()
		.eq('id', subjectId)
		.eq('user_id', userId);

	if (error) throw normalizeOrderError(error);
	return { deleted: true };
}
