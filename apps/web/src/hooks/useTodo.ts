import type { Todo } from '../types/todo';
import { useResource } from './useResource';
export function useTodo(id: string | null) {
  return useResource<{ data: Todo }>(id ? `/api/v1/todos/${id}` : null);
}
