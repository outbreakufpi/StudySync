import { prisma, isPrismaEnabled, prismaConfigError } from '../config/prismaClient.js';

function getPrismaClient() {
  if (!isPrismaEnabled || !prisma) {
    const err = new Error(prismaConfigError || 'Prisma is not configured. Set DATABASE_URL with a real password.');
    err.status = 500;
    throw err;
  }
  return prisma;
}

export async function getAllTasksForUser(userId) {
  const db = getPrismaClient();
  return db.task.findMany({
    where: { user_id: userId },
    orderBy: [
      { due_date: 'asc' },
      { created_at: 'desc' }
    ],
    include: {
      subject: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

export async function updateTaskForUser(userId, taskId, payload) {
  const db = getPrismaClient();
  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'subject_id')) {
    data.subject_id = payload.subject_id ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = payload.title;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    data.description = payload.description ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'type')) {
    data.type = payload.type ?? 'task';
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    data.status = payload.status ?? 'todo';
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'priority')) {
    data.priority = Number.isInteger(payload.priority) ? payload.priority : undefined;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'due_date')) {
    data.due_date = payload.due_date ? new Date(payload.due_date) : null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'estimated_minutes')) {
    data.estimated_minutes = payload.estimated_minutes ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'recurrence')) {
    data.recurrence = payload.recurrence ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'tags')) {
    data.tags = Array.isArray(payload.tags) ? payload.tags : undefined;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) {
    data.metadata = payload.metadata ?? undefined;
  }

  const result = await db.task.updateMany({
    where: { id: taskId, user_id: userId },
    data
  });

  if (!result.count) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  return db.task.findFirst({
    where: { id: taskId, user_id: userId },
    include: { subject: { select: { id: true, name: true } } }
  });
}

export async function deleteTaskForUser(userId, taskId) {
  const db = getPrismaClient();
  const result = await db.task.deleteMany({ where: { id: taskId, user_id: userId } });

  if (!result.count) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  return { deleted: true };
}

export async function createTaskForUser(userId, payload) {
  const db = getPrismaClient();
  return db.task.create({
    data: {
      user_id: userId,
      subject_id: payload.subject_id || null,
      title: payload.title,
      description: payload.description || null,
      type: payload.type || 'task',
      status: payload.status || 'todo',
      priority: Number.isInteger(payload.priority) ? payload.priority : 0,
      due_date: payload.due_date ? new Date(payload.due_date) : null,
      estimated_minutes: payload.estimated_minutes ?? null,
      recurrence: payload.recurrence || null,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      metadata: payload.metadata || {}
    }
  });
}
