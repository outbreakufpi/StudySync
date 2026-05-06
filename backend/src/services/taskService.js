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
    orderBy: { created_at: 'desc' },
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
