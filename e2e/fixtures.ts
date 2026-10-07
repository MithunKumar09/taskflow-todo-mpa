import { test as base, expect } from '@playwright/test';
import { createDatabase } from '../apps/api/src/plugins/database.js';
import type { PrismaClient, Prisma, Todo } from '../apps/api/src/generated/prisma/client.js';
import { getTestDatabaseUrl } from '../scripts/test-database.js';

export const test = base.extend<{
  database: PrismaClient;
  seed: (input?: Partial<Prisma.TodoCreateInput>) => Promise<Todo>;
}>({
  database: [
    async ({ baseURL }, use) => {
      if (baseURL !== 'http://127.0.0.1:5174')
        throw new Error('E2E must target the dedicated local application.');
      const database = createDatabase(getTestDatabaseUrl());
      await database.$connect();
      try {
        await database.todo.deleteMany();
        await use(database);
      } finally {
        await database.todo.deleteMany();
        await database.$disconnect();
      }
    },
    { auto: true },
  ],
  seed: async ({ database }, use) => {
    await use((input = {}) =>
      database.todo.create({
        data: {
          title: 'Review release checklist',
          ...input,
          completedAt: input.status === 'COMPLETED' ? new Date('2026-10-07T09:00:00Z') : null,
        },
      }),
    );
  },
});
export { expect };
