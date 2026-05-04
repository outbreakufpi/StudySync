import { getAllSubjectsForUser, createSubject } from '../services/subjectService.js';

export async function listSubjects(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await getAllSubjectsForUser(userId);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addSubject(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = req.body;
    const created = await createSubject(userId, payload);
    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}
