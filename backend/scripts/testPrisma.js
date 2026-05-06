import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Prefer DIRECT_URL (direct DB connection) for tests/migrations when available
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
if (!databaseUrl) {
  console.error('DATABASE_URL is missing in backend/.env');
  process.exit(1);
}
if (databaseUrl.includes('[YOUR-PASSWORD]')) {
  console.error('DATABASE_URL still contains [YOUR-PASSWORD]. Replace it before running this test.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function run() {
  const suffix = Date.now();
  const authUid = `prisma-test-${suffix}`;
  const email = `prisma-test-${suffix}@studysync.local`;

  console.log('--- Prisma integration test ---');

  await prisma.$connect();
  console.log('Connected to database');

  const profile = await prisma.profile.create({
    data: {
      auth_uid: authUid,
      email,
      full_name: 'Prisma Test User',
      locale: 'pt-BR'
    }
  });

  const subject = await prisma.subject.create({
    data: {
      user_id: profile.id,
      name: 'Arquitetura de Software',
      mode: 'university',
      metadata: { source: 'prisma-test' }
    }
  });

  const task = await prisma.task.create({
    data: {
      user_id: profile.id,
      subject_id: subject.id,
      title: 'Validar Prisma no backend',
      status: 'todo',
      type: 'task',
      tags: ['prisma', 'smoke-test'],
      metadata: { source: 'prisma-test' }
    }
  });

  const now = Date.now();
  const session = await prisma.studySession.create({
    data: {
      user_id: profile.id,
      subject_id: subject.id,
      started_at: new Date(now - 45 * 60000),
      ended_at: new Date(now),
      notes: 'Sessao criada por script de teste Prisma',
      metadata: { source: 'prisma-test' }
    }
  });

  const [subjects, tasks, sessions] = await Promise.all([
    prisma.subject.findMany({ where: { user_id: profile.id } }),
    prisma.task.findMany({ where: { user_id: profile.id } }),
    prisma.studySession.findMany({ where: { user_id: profile.id } })
  ]);

  console.log('Inserted profile:', profile.id);
  console.log('Subjects found:', subjects.length);
  console.log('Tasks found:', tasks.length);
  console.log('Sessions found:', sessions.length);

  await prisma.studySession.delete({ where: { id: session.id } });
  await prisma.task.delete({ where: { id: task.id } });
  await prisma.subject.delete({ where: { id: subject.id } });
  await prisma.profile.delete({ where: { id: profile.id } });

  console.log('Cleanup done');
  console.log('Prisma test finished successfully');
}

run()
  .catch((error) => {
    console.error('Prisma test failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
