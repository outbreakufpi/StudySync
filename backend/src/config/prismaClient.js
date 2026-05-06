import { PrismaClient } from '@prisma/client';

const rawDatabaseUrl = process.env.DATABASE_URL || '';
const hasPlaceholderPassword = rawDatabaseUrl.includes('[YOUR-PASSWORD]');
const hasDatabaseUrl = Boolean(rawDatabaseUrl) && !hasPlaceholderPassword;

let prisma = null;
if (hasDatabaseUrl) {
  prisma = new PrismaClient();
}

export { prisma };
export const isPrismaEnabled = hasDatabaseUrl;
export const prismaConfigError = hasPlaceholderPassword
  ? 'DATABASE_URL still has [YOUR-PASSWORD]. Replace with the real database password.'
  : null;
