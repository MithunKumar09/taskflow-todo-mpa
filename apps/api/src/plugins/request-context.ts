import type { FastifyInstance } from 'fastify';

export function registerRequestContext(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
    reply.header('cache-control', 'no-store');
  });
}
