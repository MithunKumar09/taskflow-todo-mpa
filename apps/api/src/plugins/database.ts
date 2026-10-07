import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { FastifyInstance } from 'fastify';

export function createDatabase(connectionString: string) {
  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  return new PrismaClient({ adapter });
}
export function registerDatabase(
  app: FastifyInstance,
  database: Pick<PrismaClient, '$connect' | '$disconnect'> & {
    $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
  },
) {
  app.addHook('onReady', () => database.$connect());
  app.addHook('onClose', () => database.$disconnect());
  app.get('/health', async (request, reply) => {
    try {
      await database.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      request.log.error({ err: error }, 'Database health check failed');
      return reply.code(503).send({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Service temporarily unavailable.',
          details: [],
          requestId: request.id,
        },
      });
    }
  });
}
