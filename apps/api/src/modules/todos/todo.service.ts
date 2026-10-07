import { AppError } from '../../errors/app-error.js';
import type { CreateTodoInput, UpdateTodoInput, ListTodosInput } from './todo.schemas.js';
import type { TodoRepository } from './todo.repository.js';
import type { Prisma } from '../../generated/prisma/client.js';

const notFound = () => new AppError('TODO_NOT_FOUND', 'This todo no longer exists.');
export function createTodoService(repository: TodoRepository, clock = () => new Date()) {
  return {
    create: (input: CreateTodoInput) =>
      repository.create({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        dueAt: input.dueAt ?? null,
        status: 'PENDING',
        completedAt: null,
      }),
    async get(id: string) {
      const todo = await repository.findById(id);
      if (!todo) throw notFound();
      return todo;
    },
    async update(id: string, input: UpdateTodoInput) {
      const data: Prisma.TodoUpdateInput = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
        ...(input.status !== undefined
          ? { status: input.status, completedAt: input.status === 'COMPLETED' ? clock() : null }
          : {}),
      };
      const todo = await repository.update(id, data);
      if (!todo) throw notFound();
      return todo;
    },
    async delete(id: string) {
      if (!(await repository.delete(id))) throw notFound();
    },
    list: (query: ListTodosInput) => repository.list(query),
  };
}
export type TodoService = ReturnType<typeof createTodoService>;
