import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { readEnvironment } from '../../src/config/env.js';
import { getTestDatabaseUrl } from '../../../../scripts/test-database.js';

const env = readEnvironment({
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: getTestDatabaseUrl(),
  WEB_ORIGIN: 'https://taskflow-mpa.onrender.com',
});
const todoPath = '/api/v1/todos/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ env });
  await app.ready();
});
afterAll(async () => app.close());

describe('Todo mutation CORS preflights', () => {
  it.each(['POST', 'PATCH', 'DELETE'] as const)(
    'allows %s with JSON headers from the configured frontend',
    async (method) => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: method === 'POST' ? '/api/v1/todos' : todoPath,
        headers: {
          origin: env.WEB_ORIGIN,
          'access-control-request-method': method,
          'access-control-request-headers': 'content-type',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(response.headers['access-control-allow-origin']).toBe(env.WEB_ORIGIN);
      const methods = String(response.headers['access-control-allow-methods'])
        .split(',')
        .map((value) => value.trim());
      expect(methods).toEqual(['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS']);
      expect(methods).toContain(method);
      expect(String(response.headers['access-control-allow-headers']).toLowerCase()).toBe(
        'content-type',
      );
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    },
  );

  it('does not grant an unrelated origin browser access', async () => {
    const unrelatedOrigin = 'https://malicious.example';
    const response = await app.inject({
      method: 'OPTIONS',
      url: todoPath,
      headers: {
        origin: unrelatedOrigin,
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'content-type',
      },
    });

    // A fixed allowed-origin header differs from the requester and fails browser CORS checks.
    expect(response.headers['access-control-allow-origin']).toBe(env.WEB_ORIGIN);
    expect(response.headers['access-control-allow-origin']).not.toBe(unrelatedOrigin);
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });
});
