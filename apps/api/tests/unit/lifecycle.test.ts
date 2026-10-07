import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { registerDatabase } from '../../src/plugins/database.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { registerRequestContext } from '../../src/plugins/request-context.js';
import { getTestDatabaseUrl } from '../../../../scripts/test-database.js';

describe('database ownership and isolation', () => {
  it('returns safe 503 with correlation and disconnects its owned database', async () => {
    const connect = vi.fn<PrismaClient['$connect']>().mockResolvedValue(undefined);
    const disconnect = vi.fn<PrismaClient['$disconnect']>().mockResolvedValue(undefined);
    const probe = vi
      .fn<PrismaClient['$queryRaw']>()
      .mockRejectedValue(new Error('private connection details'));
    const database = { $connect: connect, $disconnect: disconnect, $queryRaw: probe };
    const app = Fastify();
    registerRequestContext(app);
    registerDatabase(app, database);
    try {
      await app.ready();
      expect(connect).toHaveBeenCalledOnce();
      const response = await app.inject('/health');
      expect(probe).toHaveBeenCalledOnce();
      expect(response.statusCode).toBe(503);
      expect(response.json().error).toMatchObject({
        code: 'DATABASE_UNAVAILABLE',
        requestId: response.headers['x-request-id'],
      });
      expect(response.body).not.toContain('private');
    } finally {
      await app.close();
    }
    expect(disconnect).toHaveBeenCalledOnce();
  });
  it.each([
    {},
    { TEST_DATABASE_URL: 'postgresql://localhost/taskflow' },
    {
      TEST_DATABASE_URL: 'postgresql://localhost/taskflow_test',
      DATABASE_URL: 'postgresql://localhost/taskflow_test',
    },
    { TEST_DATABASE_URL: 'postgresql://remote.example/taskflow_test' },
    { TEST_DATABASE_URL: 'https://localhost/taskflow_test' },
  ])('rejects unsafe cleanup target %j', (input) => {
    expect(() => getTestDatabaseUrl(input)).toThrow();
  });
  it('accepts a distinct loopback test database', () => {
    const TEST_DATABASE_URL = 'postgresql://localhost/taskflow_test';
    expect(
      getTestDatabaseUrl({ TEST_DATABASE_URL, DATABASE_URL: 'postgresql://localhost/taskflow' }),
    ).toBe(TEST_DATABASE_URL);
  });
});
