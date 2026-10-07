import type { FastifyInstance } from 'fastify';
import type { TodoService } from './todo.service.js';
import { createTodoController } from './todo.controller.js';
import {
  createTodoSchema,
  idSchema,
  listTodosSchema,
  updateTodoSchema,
  validate,
} from './todo.schemas.js';

export async function registerTodoRoutes(app: FastifyInstance, service: TodoService) {
  const controller = createTodoController(service);
  const config = { rateLimit: {} };
  app.get<{ Querystring: ReturnType<typeof listTodosSchema.parse> }>(
    '/',
    {
      config,
      preValidation: async (request) => {
        request.query = validate(listTodosSchema, request.query);
      },
    },
    controller.list,
  );
  app.post<{ Body: ReturnType<typeof createTodoSchema.parse> }>(
    '/',
    {
      config,
      preValidation: async (request) => {
        request.body = validate(createTodoSchema, request.body);
      },
    },
    controller.create,
  );
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      config,
      preValidation: async (request) => {
        request.params = validate(idSchema, request.params);
      },
    },
    controller.get,
  );
  app.patch<{ Params: { id: string }; Body: ReturnType<typeof updateTodoSchema.parse> }>(
    '/:id',
    {
      config,
      preValidation: async (request) => {
        request.params = validate(idSchema, request.params);
        request.body = validate(updateTodoSchema, request.body);
      },
    },
    controller.update,
  );
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      config,
      preValidation: async (request) => {
        request.params = validate(idSchema, request.params);
      },
    },
    controller.delete,
  );
}
