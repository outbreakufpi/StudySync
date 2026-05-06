import { prisma, isPrismaEnabled, prismaConfigError } from '../config/prismaClient.js';

function getPrismaClient() {
  if (!isPrismaEnabled || !prisma) {
    const err = new Error(prismaConfigError || 'Prisma is not configured. Set DATABASE_URL with a real password.');
    err.status = 500;
    throw err;
  }
  return prisma;
}

export async function getAllSubjectsForUser(userId) {
  const db = getPrismaClient();
  return db.subject.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' }
  });
}

export async function createSubject(userId, payload) {
  const db = getPrismaClient();
  return db.subject.create({
    data: {
      user_id: userId,
      name: payload.name,
      professor: payload.professor || null,
      room: payload.room || null,
      color: payload.color || null,
      code: payload.code || null,
      mode: payload.mode || 'university',
      metadata: payload.metadata || {}
    }
  });
}
