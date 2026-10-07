import type { Todo } from '../../generated/prisma/client.js';

export interface TodoDto {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export function toTodoDto(todo: Todo): TodoDto {
  return {
    ...todo,
    dueAt: todo.dueAt?.toISOString() ?? null,
    completedAt: todo.completedAt?.toISOString() ?? null,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}
