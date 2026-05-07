import { getAllTasksForUser, createTaskForUser, updateTaskForUser, deleteTaskForUser } from '../services/taskService.js';

export async function listTasks(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });

    const data = await getAllTasksForUser(client, userId);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addTask(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });

    const { title, due_date } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Field "title" is required' });
    }

    if (!due_date) {
      return res.status(400).json({ error: 'Field "due_date" is required' });
    }

    const created = await createTaskForUser(client, userId, req.body || {});
    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });

    const taskId = req.params.taskId;
    const updated = await updateTaskForUser(client, userId, taskId, req.body || {});
    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function removeTask(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const client = req.user && req.user.client;
    if (!userId || !client) return res.status(401).json({ error: 'Unauthorized' });

    const taskId = req.params.taskId;
    const result = await deleteTaskForUser(client, userId, taskId);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
