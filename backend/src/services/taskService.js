import { supabaseAdmin } from '../config/supabaseClient.js';

function normalizeError(error) {
	if (!error) return null;
	const normalized = new Error(error.message || 'Database error');
	normalized.status = error.status || 500;
	return normalized;
}

export async function getAllTasksForUser(client, userId) {
	const db = supabaseAdmin || client;
	const { data, error } = await db
		.from('tasks')
		.select('*, subject:subjects(id,name)')
		.eq('user_id', userId)
		.order('due_date', { ascending: true, nullsFirst: false })
		.order('created_at', { ascending: false });

	if (error) throw normalizeError(error);
	return data || [];
}

export async function updateTaskForUser(client, userId, taskId, payload) {
	const db = supabaseAdmin || client;
	const data = {};

	if (Object.prototype.hasOwnProperty.call(payload, 'subject_id')) data.subject_id = payload.subject_id ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'title')) data.title = payload.title;
	if (Object.prototype.hasOwnProperty.call(payload, 'description')) data.description = payload.description ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'type')) data.type = payload.type ?? 'task';
	if (Object.prototype.hasOwnProperty.call(payload, 'status')) data.status = payload.status ?? 'todo';
	if (Object.prototype.hasOwnProperty.call(payload, 'priority')) data.priority = Number.isInteger(payload.priority) ? payload.priority : undefined;
	if (Object.prototype.hasOwnProperty.call(payload, 'due_date')) data.due_date = payload.due_date ? new Date(payload.due_date) : null;
	if (Object.prototype.hasOwnProperty.call(payload, 'estimated_minutes')) data.estimated_minutes = payload.estimated_minutes ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'recurrence')) data.recurrence = payload.recurrence ?? null;
	if (Object.prototype.hasOwnProperty.call(payload, 'tags')) data.tags = Array.isArray(payload.tags) ? payload.tags : undefined;
	if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) data.metadata = payload.metadata ?? undefined;

	const { data: updated, error } = await db
		.from('tasks')
		.update(data)
		.eq('id', taskId)
		.eq('user_id', userId)
		.select('*, subject:subjects(id,name)')
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			const notFound = new Error('Task not found');
			notFound.status = 404;
			throw notFound;
		}
		throw normalizeError(error);
	}

	return updated;
}

export async function deleteTaskForUser(client, userId, taskId) {
	const db = supabaseAdmin || client;
	const { error } = await db
		.from('tasks')
		.delete()
		.eq('id', taskId)
		.eq('user_id', userId);

	if (error) throw normalizeError(error);
	return { deleted: true };
}

export async function createTaskForUser(client, userId, payload) {
	const db = supabaseAdmin || client;
	const dueDate = payload.due_date ? new Date(payload.due_date) : null;
	if (!dueDate || Number.isNaN(dueDate.getTime())) {
		const err = new Error('Field "due_date" is required and must be a valid date');
		err.status = 400;
		throw err;
	}
	const { data, error } = await db
		.from('tasks')
		.insert({
			user_id: userId,
			subject_id: payload.subject_id || null,
			title: payload.title,
			description: payload.description || null,
			type: payload.type || 'task',
			status: payload.status || 'todo',
			priority: Number.isInteger(payload.priority) ? payload.priority : 0,
			due_date: dueDate,
			estimated_minutes: payload.estimated_minutes ?? null,
			recurrence: payload.recurrence || null,
			tags: Array.isArray(payload.tags) ? payload.tags : [],
			metadata: payload.metadata || {},
		})
		.select('*, subject:subjects(id,name)')
		.single();

	if (error) throw normalizeError(error);
	return data;
}
