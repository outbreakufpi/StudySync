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

export async function updateSubjectForUser(userId, subjectId, payload) {
  const db = getPrismaClient();
  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    data.name = payload.name;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'professor')) {
    data.professor = payload.professor ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'room')) {
    data.room = payload.room ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'color')) {
    data.color = payload.color ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'code')) {
    data.code = payload.code ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'mode')) {
    data.mode = payload.mode ?? 'university';
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) {
    data.metadata = payload.metadata ?? {};
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'is_active')) {
    data.is_active = payload.is_active ?? true;
  }

  const result = await db.subject.updateMany({
    where: { id: subjectId, user_id: userId },
    data
  });

  if (!result.count) {
    const err = new Error('Subject not found');
    err.status = 404;
    throw err;
  }

  return db.subject.findFirst({ where: { id: subjectId, user_id: userId } });
}

export async function deleteSubjectForUser(userId, subjectId) {
  const db = getPrismaClient();
  const result = await db.subject.deleteMany({ where: { id: subjectId, user_id: userId } });

  if (!result.count) {
    const err = new Error('Subject not found');
    err.status = 404;
    throw err;
  }

  return { deleted: true };
}
