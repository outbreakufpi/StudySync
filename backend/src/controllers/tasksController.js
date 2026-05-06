import { getAllTasksForUser, createTaskForUser, updateTaskForUser, deleteTaskForUser } from '../services/taskService.js';

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

export async function updateTask(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const taskId = req.params.taskId;
    const updated = await updateTaskForUser(userId, taskId, req.body || {});
    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function removeTask(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const taskId = req.params.taskId;
    const result = await deleteTaskForUser(userId, taskId);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
