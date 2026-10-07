import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { Environment } from '../config/env.js';

export async function registerSecurity(
  app: FastifyInstance,
  env: Environment,
  rateLimitMax?: number,
) {
  await app.register(helmet);
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: false,
    exposedHeaders: ['x-request-id'],
  });
  await app.register(rateLimit, {
    global: false,
    max: rateLimitMax ?? (env.NODE_ENV === 'test' ? 1000 : 100),
    timeWindow: '1 minute',
  });
}
