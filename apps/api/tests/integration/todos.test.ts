import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { createDatabase } from '../../src/plugins/database.js';
import { readEnvironment } from '../../src/config/env.js';
import { getTestDatabaseUrl } from '../../../../scripts/test-database.js';
import { createTodoRepository } from '../../src/modules/todos/todo.repository.js';

const url = getTestDatabaseUrl();
const database = createDatabase(url);
const env = readEnvironment({
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: url,
  WEB_ORIGIN: 'http://localhost:5173',
});
let app: FastifyInstance;
const unknownId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
beforeAll(async () => {
  await database.$connect();
  app = await buildApp({ env });
  await app.ready();
});
beforeEach(() => database.todo.deleteMany());
afterAll(async () => {
  await app.close();
  await database.$disconnect();
});
async function create(title = 'Review release') {
  const response = await app.inject({ method: 'POST', url: '/api/v1/todos', payload: { title } });
  expect(response.statusCode).toBe(201);
  return response.json().data as { id: string };
}

describe('HTTP and PostgreSQL contracts', () => {
  it('probes the database in health', async () => {
    expect((await app.inject('/health')).json()).toEqual({ status: 'ok' });
  });
  it('creates, normalizes, serializes, and persists', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/todos',
      payload: {
        title: '  Review release  ',
        description: ' context ',
        dueAt: '2026-10-08T18:00:00+05:30',
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().data).toMatchObject({
      title: 'Review release',
      description: 'context',
      priority: 'MEDIUM',
      status: 'PENDING',
      completedAt: null,
      dueAt: '2026-10-08T12:30:00.000Z',
    });
    const id = response.json().data.id;
    expect(response.headers.location).toBe(`/api/v1/todos/${id}`);
    expect(await database.todo.findUnique({ where: { id } })).toMatchObject({
      title: 'Review release',
    });
    expect((await app.inject(`/api/v1/todos/${id}`)).statusCode).toBe(200);
  });
  it.each([
    {},
    { title: ' ' },
    { title: 'a'.repeat(161) },
    { title: 'OK', description: 'x'.repeat(5001) },
    { title: 'OK', priority: 'URGENT' },
    { title: 'OK', dueAt: 'invalid' },
    { title: 'OK', unknown: true },
  ])('rejects invalid creation %j', async (payload) => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/todos', payload });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
    expect(await database.todo.count()).toBe(0);
  });
  it('rejects malformed JSON safely', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/todos',
      payload: '{bad',
      headers: { 'content-type': 'application/json' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.requestId).toBe(response.headers['x-request-id']);
  });
  it.each(['GET', 'PATCH', 'DELETE'] as const)(
    '%s validates UUIDs and reports unknown ids',
    async (method) => {
      const options = method === 'PATCH' ? { payload: { title: 'Updated' } } : {};
      expect(
        (await app.inject({ method, url: '/api/v1/todos/invalid', ...options })).statusCode,
      ).toBe(400);
      expect(
        (await app.inject({ method, url: `/api/v1/todos/${unknownId}`, ...options })).statusCode,
      ).toBe(404);
    },
  );
  it('preserves completion for unrelated edits and clears it when reopened', async () => {
    const { id } = await create();
    const complete = await app.inject({
      method: 'PATCH',
      url: `/api/v1/todos/${id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(complete.statusCode).toBe(200);
    const stamp = complete.json().data.completedAt;
    expect(stamp).toBeTruthy();
    const edit = await app.inject({
      method: 'PATCH',
      url: `/api/v1/todos/${id}`,
      payload: { title: 'Edited', description: null, dueAt: null },
    });
    expect(edit.json().data).toMatchObject({
      title: 'Edited',
      status: 'COMPLETED',
      completedAt: stamp,
    });
    const reopen = await app.inject({
      method: 'PATCH',
      url: `/api/v1/todos/${id}`,
      payload: { status: 'IN_PROGRESS' },
    });
    expect(reopen.json().data.completedAt).toBeNull();
  });
  it.each([{}, { status: 'DONE' }, { title: ' ' }, { updatedAt: '2026-10-07' }])(
    'rejects invalid patch %j',
    async (payload) => {
      const { id } = await create();
      expect(
        (await app.inject({ method: 'PATCH', url: `/api/v1/todos/${id}`, payload })).statusCode,
      ).toBe(400);
    },
  );
  it('deletes with an empty 204 and then returns 404', async () => {
    const { id } = await create();
    const response = await app.inject({ method: 'DELETE', url: `/api/v1/todos/${id}` });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect((await app.inject(`/api/v1/todos/${id}`)).statusCode).toBe(404);
  });
  it('enforces body limits and security headers', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/todos',
      payload: { title: 'x'.repeat(70000) },
    });
    expect(response.statusCode).toBe(413);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.json().error.code).toBe('PAYLOAD_TOO_LARGE');
  });
  it('allows only the configured CORS origin', async () => {
    const allowed = await app.inject({ url: '/health', headers: { origin: env.WEB_ORIGIN } });
    expect(allowed.headers['access-control-allow-origin']).toBe(env.WEB_ORIGIN);
    const other = await app.inject({
      url: '/health',
      headers: { origin: 'https://untrusted.example' },
    });
    expect(other.headers['access-control-allow-origin']).not.toBe('https://untrusted.example');
  });
  it('returns safe errors with request correlation', async () => {
    const broken = await buildApp({
      env,
      repository: {
        ...createTodoRepository(database),
        list: async () => {
          throw new Error('private database password and stack');
        },
      },
    });
    try {
      const response = await broken.inject('/api/v1/todos');
      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain('private database');
      expect(response.json().error.requestId).toBe(response.headers['x-request-id']);
    } finally {
      await broken.close();
    }
  });
  it('rate limits todos while leaving health available', async () => {
    const limited = await buildApp({ env, rateLimitMax: 2 });
    try {
      await limited.inject('/api/v1/todos');
      await limited.inject('/api/v1/todos');
      const response = await limited.inject('/api/v1/todos');
      expect(response.statusCode).toBe(429);
      expect(response.json().error.code).toBe('RATE_LIMITED');
      expect((await limited.inject('/health')).statusCode).toBe(200);
    } finally {
      await limited.close();
    }
  });
  it('rejects inconsistent direct writes at the database boundary', async () => {
    await expect(
      database.todo.create({ data: { title: 'Invalid completion', status: 'COMPLETED' } }),
    ).rejects.toThrow();
  });
});

describe('list queries', () => {
  beforeEach(async () => {
    await database.todo.createMany({
      data: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          title: 'Alpha review',
          status: 'PENDING',
          priority: 'HIGH',
          createdAt: new Date('2026-10-01'),
          dueAt: new Date('2026-10-10'),
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          title: 'Beta review',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          createdAt: new Date('2026-10-02'),
          dueAt: new Date('2026-10-09'),
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          title: 'Gamma shipped',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          completedAt: new Date('2026-10-03'),
          createdAt: new Date('2026-10-02'),
        },
      ],
    });
  });
  it('paginates and returns filtered metadata', async () => {
    const response = await app.inject('/api/v1/todos?page=2&limit=2');
    expect(response.json().data).toHaveLength(1);
    expect(response.json().meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });
  it('searches case-insensitively and combines filters', async () => {
    const response = await app.inject('/api/v1/todos?q=REVIEW&status=PENDING&priority=HIGH');
    expect(response.json().data.map((todo: { title: string }) => todo.title)).toEqual([
      'Alpha review',
    ]);
    expect(response.json().meta.total).toBe(1);
  });
  it.each([
    ['status=IN_PROGRESS', 'Beta review'],
    ['priority=MEDIUM', 'Gamma shipped'],
  ])('filters %s', async (query, title) => {
    expect((await app.inject(`/api/v1/todos?${query}`)).json().data[0].title).toBe(title);
  });
  it.each([
    ['createdAt_desc', ['Gamma shipped', 'Beta review', 'Alpha review']],
    ['createdAt_asc', ['Alpha review', 'Beta review', 'Gamma shipped']],
    ['dueAt', ['Beta review', 'Alpha review', 'Gamma shipped']],
    ['priority_desc', ['Alpha review', 'Gamma shipped', 'Beta review']],
  ])('sorts %s with stable ties and nulls', async (sort, titles) => {
    expect(
      (await app.inject(`/api/v1/todos?sort=${sort}`))
        .json()
        .data.map((todo: { title: string }) => todo.title),
    ).toEqual(titles);
  });
  it('returns empty and out-of-range results honestly', async () => {
    expect((await app.inject('/api/v1/todos?q=unmatched')).json()).toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    expect((await app.inject('/api/v1/todos?page=20')).json().data).toEqual([]);
  });
  it.each(['page=0', 'page=1.5', 'limit=101', 'sort=title', 'status=DONE', 'priority=URGENT'])(
    'rejects %s',
    async (query) => {
      expect((await app.inject(`/api/v1/todos?${query}`)).statusCode).toBe(400);
    },
  );
});
