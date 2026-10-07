import type { Filters } from '../types/todo';
export const defaultFilters: Filters = {
  q: '',
  status: '',
  priority: '',
  sort: 'createdAt_desc',
  page: 1,
};
export function listPath(filters: Filters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: '20',
    sort: filters.sort,
  });
  if (filters.q.trim()) query.set('q', filters.q.trim());
  if (filters.status) query.set('status', filters.status);
  if (filters.priority) query.set('priority', filters.priority);
  return `/api/v1/todos?${query}`;
}
export function isUuid(value: string | null): value is string {
  return (
    value !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}
