import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import type { ListTodosInput } from './todo.schemas.js';

export function createTodoRepository(database: PrismaClient) {
  return {
    create: async (data: Prisma.TodoCreateInput) => database.todo.create({ data }),
    findById: async (id: string) => database.todo.findUnique({ where: { id } }),
    async update(id: string, data: Prisma.TodoUpdateInput) {
      try {
        return await database.todo.update({ where: { id }, data });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
          return null;
        throw error;
      }
    },
    async delete(id: string) {
      try {
        await database.todo.delete({ where: { id } });
        return true;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
          return false;
        throw error;
      }
    },
    async list(query: ListTodosInput) {
      const where: Prisma.TodoWhereInput = {
        ...(query.q
          ? { title: { contains: query.q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' } }
          : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
      };
      const orders: Record<ListTodosInput['sort'], Prisma.TodoOrderByWithRelationInput[]> = {
        createdAt_desc: [{ createdAt: 'desc' }, { id: 'desc' }],
        createdAt_asc: [{ createdAt: 'asc' }, { id: 'asc' }],
        dueAt: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
        priority_desc: [{ priority: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      };
      const [data, total] = await Promise.all([
        database.todo.findMany({
          where,
          orderBy: orders[query.sort],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        database.todo.count({ where }),
      ]);
      return {
        data,
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    },
  };
}
export type TodoRepository = ReturnType<typeof createTodoRepository>;
