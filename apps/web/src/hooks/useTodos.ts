import { useEffect, useState } from 'react';
import type { Filters, TodoList } from '../types/todo';
import { listPath } from '../lib/query';
import { useResource } from './useResource';

export function useTodos(filters: Filters) {
  return useResource<TodoList>(listPath(filters));
}
export function useDebouncedValue(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}
