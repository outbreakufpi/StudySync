import { prisma, isPrismaEnabled, prismaConfigError } from '../config/prismaClient.js';

function getPrismaClient() {
  if (!isPrismaEnabled || !prisma) {
    const err = new Error(prismaConfigError || 'Prisma is not configured. Set DATABASE_URL with a real password.');
    err.status = 500;
    throw err;
  }
  return prisma;
}

export async function getAllSessionsForUser(userId) {
  const db = getPrismaClient();
  return db.studySession.findMany({
    where: { user_id: userId },
    orderBy: { started_at: 'desc' },
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

export async function createSessionForUser(userId, payload) {
  const db = getPrismaClient();
  return db.studySession.create({
    data: {
      user_id: userId,
      subject_id: payload.subject_id || null,
      started_at: new Date(payload.started_at),
      ended_at: new Date(payload.ended_at),
      questions_answered: payload.questions_answered ?? 0,
      depth: payload.depth ?? null,
      notes: payload.notes || null,
      metadata: payload.metadata || {}
    }
  });
}
