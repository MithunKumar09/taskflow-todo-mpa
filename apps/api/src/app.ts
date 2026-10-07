import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { Environment } from './config/env.js';
import { createDatabase, registerDatabase } from './plugins/database.js';
import { registerSecurity } from './plugins/security.js';
import { registerRequestContext } from './plugins/request-context.js';
import { registerErrorHandler } from './errors/error-handler.js';
import { createTodoRepository, type TodoRepository } from './modules/todos/todo.repository.js';
import { createTodoService } from './modules/todos/todo.service.js';
import { registerTodoRoutes } from './modules/todos/todo.routes.js';

export async function buildApp(options: {
  env: Environment;
  repository?: TodoRepository;
  rateLimitMax?: number;
}) {
  const app = Fastify({
    bodyLimit: 64 * 1024,
    requestTimeout: 15000,
    genReqId: () => randomUUID(),
    requestIdHeader: false,
    logger:
      options.env.NODE_ENV === 'test'
        ? false
        : { redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'] },
  });
  const database = createDatabase(options.env.DATABASE_URL);
  registerErrorHandler(app);
  registerRequestContext(app);
  registerDatabase(app, database);
  await registerSecurity(app, options.env, options.rateLimitMax);
  const repository = options.repository ?? createTodoRepository(database);
  await app.register((instance) => registerTodoRoutes(instance, createTodoService(repository)), {
    prefix: '/api/v1/todos',
  });
  return app;
}
