import supabaseClient from '../config/supabaseClient.js';

export async function getAllSubjectsForUser(userId) {
  const { data, error } = await supabaseClient
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createSubject(userId, payload) {
  const record = {
    user_id: userId,
    name: payload.name,
    professor: payload.professor || null,
    room: payload.room || null,
    color: payload.color || null,
    code: payload.code || null,
    mode: payload.mode || 'university',
    metadata: payload.metadata || {}
  };

  const { data, error } = await supabaseClient.from('subjects').insert([record]).select().single();
  if (error) throw error;
  return data;
}
