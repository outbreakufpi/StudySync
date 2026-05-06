import { getAllSessionsForUser, createSessionForUser } from '../services/sessionService.js';

export async function listSessions(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = await getAllSessionsForUser(userId);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addSession(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { started_at, ended_at } = req.body || {};
    if (!started_at || !ended_at) {
      return res.status(400).json({ error: 'Fields "started_at" and "ended_at" are required' });
    }

    const start = new Date(started_at);
    const end = new Date(ended_at);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format in "started_at" or "ended_at"' });
    }
    if (end <= start) {
      return res.status(400).json({ error: '"ended_at" must be greater than "started_at"' });
    }

    const created = await createSessionForUser(userId, req.body || {});
    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}
