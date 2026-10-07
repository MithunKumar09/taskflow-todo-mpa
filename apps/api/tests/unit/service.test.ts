import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Todo } from '../../src/generated/prisma/client.js';
import { createTodoService } from '../../src/modules/todos/todo.service.js';
import type { TodoRepository } from '../../src/modules/todos/todo.repository.js';

const now = new Date('2026-10-07T12:00:00Z');
const todo: Todo = {
  id: 'a689bf04-9ce1-4273-a8ba-441dbb6fb151',
  title: 'Review release',
  description: null,
  status: 'PENDING',
  priority: 'MEDIUM',
  dueAt: null,
  completedAt: null,
  createdAt: now,
  updatedAt: now,
};
const repository: TodoRepository = {
  create: vi.fn(async () => todo),
  findById: vi.fn(async () => todo),
  update: vi.fn(async () => todo),
  delete: vi.fn(async () => true),
  list: vi.fn(async () => ({
    data: [todo],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  })),
};
const service = createTodoService(repository, () => now);
beforeEach(() => vi.clearAllMocks());
describe('todo business rules', () => {
  it('creates pending todos with normalized defaults', async () => {
    await service.create({ title: 'Review release', priority: 'MEDIUM' });
    expect(repository.create).toHaveBeenCalledWith({
      title: 'Review release',
      description: null,
      priority: 'MEDIUM',
      dueAt: null,
      status: 'PENDING',
      completedAt: null,
    });
  });
  it('completes in one update, without reading existing state', async () => {
    await service.update(todo.id, { status: 'COMPLETED' });
    expect(repository.update).toHaveBeenCalledExactlyOnceWith(todo.id, {
      status: 'COMPLETED',
      completedAt: now,
    });
    expect(repository.findById).not.toHaveBeenCalled();
  });
  it.each(['PENDING', 'IN_PROGRESS'] as const)('clears completion on %s', async (status) => {
    await service.update(todo.id, { status });
    expect(repository.update).toHaveBeenCalledWith(todo.id, { status, completedAt: null });
  });
  it('leaves status and completion out of unrelated patches', async () => {
    await service.update(todo.id, { title: 'Updated title' });
    expect(repository.update).toHaveBeenCalledWith(todo.id, { title: 'Updated title' });
  });
  it('returns existing todos', async () => {
    expect(await service.get(todo.id)).toEqual(todo);
  });
  it('reports missing read/update/delete', async () => {
    vi.mocked(repository.findById).mockResolvedValueOnce(null);
    vi.mocked(repository.update).mockResolvedValueOnce(null);
    vi.mocked(repository.delete).mockResolvedValueOnce(false);
    await expect(service.get(todo.id)).rejects.toMatchObject({ code: 'TODO_NOT_FOUND' });
    await expect(service.update(todo.id, { title: 'Gone' })).rejects.toMatchObject({
      code: 'TODO_NOT_FOUND',
    });
    await expect(service.delete(todo.id)).rejects.toMatchObject({ code: 'TODO_NOT_FOUND' });
  });
});
