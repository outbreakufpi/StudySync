import { getAllTasksForUser, createTaskForUser } from '../services/taskService.js';

export async function listTasks(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = await getAllTasksForUser(userId);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addTask(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Field "title" is required' });
    }

    const created = await createTaskForUser(userId, req.body || {});
    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}
