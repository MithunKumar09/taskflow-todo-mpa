import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, request, resolveApiUrl } from './api';

beforeEach(() => vi.stubEnv('VITE_API_BASE_URL', undefined));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('API URL resolution', () => {
  it.each([
    [undefined, '/api/v1/todos'],
    ['', '/api/v1/todos'],
    ['   ', '/api/v1/todos'],
    ['https://example-api.test', 'https://example-api.test/api/v1/todos'],
    ['https://example-api.test/', 'https://example-api.test/api/v1/todos'],
    ['  https://example-api.test///  ', 'https://example-api.test/api/v1/todos'],
  ])('resolves base %j without changing the API path', (baseUrl, expected) => {
    expect(resolveApiUrl('/api/v1/todos', baseUrl)).toBe(expected);
  });

  it('keeps an unset environment same-origin at the fetch boundary', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () => new Response(JSON.stringify({ data: [] })),
    );
    vi.stubGlobal('fetch', fetch);
    await request('/api/v1/todos?page=2&q=review');
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      '/api/v1/todos?page=2&q=review',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('uses the configured origin for list/detail reads and every CRUD mutation', async () => {
    vi.stubEnv('VITE_API_BASE_URL', ' https://example-api.test/ ');
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () => new Response(JSON.stringify({ data: {} })),
    );
    vi.stubGlobal('fetch', fetch);
    const signal = new AbortController().signal;

    await request('/api/v1/todos?page=2&q=review');
    await request('/api/v1/todos/todo-id');
    await api.create(
      { title: 'Review release', description: null, priority: 'MEDIUM', dueAt: null },
      signal,
    );
    await api.update('todo-id', { title: 'Updated title' }, signal);
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await api.delete('todo-id', signal);

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://example-api.test/api/v1/todos?page=2&q=review',
      'https://example-api.test/api/v1/todos/todo-id',
      'https://example-api.test/api/v1/todos',
      'https://example-api.test/api/v1/todos/todo-id',
      'https://example-api.test/api/v1/todos/todo-id',
    ]);
  });
});
