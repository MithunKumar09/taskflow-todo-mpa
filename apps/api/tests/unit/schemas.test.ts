import { describe, expect, it } from 'vitest';
import {
  createTodoSchema,
  updateTodoSchema,
  listTodosSchema,
  idSchema,
} from '../../src/modules/todos/todo.schemas.js';
import { readEnvironment } from '../../src/config/env.js';

describe('request boundaries', () => {
  it('normalizes create inputs and defaults', () => {
    expect(createTodoSchema.parse({ title: '  Review release  ', description: '  ' })).toEqual({
      title: 'Review release',
      description: null,
      priority: 'MEDIUM',
    });
  });
  it.each([
    {},
    { title: '' },
    { title: '   ' },
    { title: 'a'.repeat(161) },
    { title: 'OK', description: 'a'.repeat(5001) },
    { title: 'OK', priority: 'URGENT' },
    { title: 'OK', dueAt: '2026-02-30T10:00:00Z' },
    { title: 'OK', dueAt: 'tomorrow' },
    { title: 'OK', status: 'COMPLETED' },
    { title: 'OK', id: 'client-id' },
  ])('rejects invalid create %j', (input) => {
    expect(createTodoSchema.safeParse(input).success).toBe(false);
  });
  it('accepts offset dates and explicit nullable clears', () => {
    expect(
      createTodoSchema
        .parse({ title: 'OK', dueAt: '2026-10-07T18:00:00+05:30' })
        .dueAt?.toISOString(),
    ).toBe('2026-10-07T12:30:00.000Z');
    expect(updateTodoSchema.parse({ description: null, dueAt: null })).toEqual({
      description: null,
      dueAt: null,
    });
  });
  it.each([
    {},
    { title: '  ' },
    { status: 'DONE' },
    { updatedAt: '2026-10-07' },
    { priority: 'URGENT' },
  ])('rejects invalid patch %j', (input) => {
    expect(updateTodoSchema.safeParse(input).success).toBe(false);
  });
  it.each([
    { page: '0' },
    { page: '1.5' },
    { page: '2147483647', limit: '100' },
    { limit: '101' },
    { limit: '0' },
    { status: 'DONE' },
    { priority: 'URGENT' },
    { sort: 'title' },
    { q: 'a'.repeat(161) },
  ])('rejects invalid query %j', (input) => {
    expect(listTodosSchema.safeParse(input).success).toBe(false);
  });
  it('rejects malformed ids', () => {
    expect(idSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });
  it('reports missing configuration without disclosing values', () => {
    expect(() =>
      readEnvironment({ DATABASE_URL: 'secret-invalid-url', WEB_ORIGIN: 'wildcard' }),
    ).toThrow('Invalid startup configuration');
    expect(() =>
      readEnvironment({ DATABASE_URL: 'secret-invalid-url', WEB_ORIGIN: 'wildcard' }),
    ).not.toThrow('secret-invalid-url');
  });
});
