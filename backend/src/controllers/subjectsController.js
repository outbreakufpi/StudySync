import { getAllSubjectsForUser, createSubject, updateSubjectForUser, deleteSubjectForUser } from '../services/subjectService.js';

export async function listSubjects(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });
    const mode = String(req.query?.mode || '').trim() || null;
    const data = await getAllSubjectsForUser(client, userId, mode);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addSubject(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });
    const payload = req.body;
    const created = await createSubject(client, userId, payload);
    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}

export async function updateSubject(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });

    const subjectId = req.params.subjectId;
    const updated = await updateSubjectForUser(client, userId, subjectId, req.body || {});
    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function removeSubject(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });

    const subjectId = req.params.subjectId;
    const result = await deleteSubjectForUser(client, userId, subjectId);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
