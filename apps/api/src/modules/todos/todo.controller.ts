import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TodoService } from './todo.service.js';
import type { CreateTodoInput, UpdateTodoInput, ListTodosInput } from './todo.schemas.js';
import { toTodoDto } from './todo.types.js';

export type IdRequest = FastifyRequest<{ Params: { id: string } }>;
export type CreateRequest = FastifyRequest<{ Body: CreateTodoInput }>;
export type UpdateRequest = FastifyRequest<{ Params: { id: string }; Body: UpdateTodoInput }>;
export type ListRequest = FastifyRequest<{ Querystring: ListTodosInput }>;
export function createTodoController(service: TodoService) {
  return {
    async list(request: ListRequest) {
      const result = await service.list(request.query);
      return { data: result.data.map(toTodoDto), meta: result.meta };
    },
    async get(request: IdRequest) {
      return { data: toTodoDto(await service.get(request.params.id)) };
    },
    async create(request: CreateRequest, reply: FastifyReply) {
      const todo = await service.create(request.body);
      return reply
        .code(201)
        .header('location', `/api/v1/todos/${todo.id}`)
        .send({ data: toTodoDto(todo) });
    },
    async update(request: UpdateRequest) {
      return { data: toTodoDto(await service.update(request.params.id, request.body)) };
    },
    async delete(request: IdRequest, reply: FastifyReply) {
      await service.delete(request.params.id);
      return reply.code(204).send();
    },
  };
}
