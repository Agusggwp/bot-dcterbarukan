import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let prismaInstance = null;

export function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log:
        env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
            ]
          : [{ emit: 'event', level: 'error' }],
    });

    if (env.NODE_ENV === 'development') {
      prismaInstance.$on('query', (e) => {
        logger.debug({ query: e.query, durationMs: e.duration }, 'Prisma Query');
      });
    }

    prismaInstance.$on('error', (e) => {
      logger.error({ error: e.message }, 'Prisma Database Error');
    });

    prismaInstance.$on('warn', (e) => {
      logger.warn({ warning: e.message }, 'Prisma Database Warning');
    });
  }

  return prismaInstance;
}

export const prisma = getPrismaClient();

export async function disconnectPrisma() {
  if (prismaInstance) {
    logger.info('Disconnecting Prisma Client...');
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
