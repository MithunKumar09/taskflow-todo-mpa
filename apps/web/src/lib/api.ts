import type { Todo, TodoInput, TodoPatch } from '../types/todo';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly details: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const external = options.signal;
  const abort = () => controller.abort();
  external?.addEventListener('abort', abort, { once: true });
  if (external?.aborted) abort();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);
  const mutation = options.method && options.method !== 'GET';
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const body = await response.json();
    if (!response.ok)
      throw new ApiError(
        body.error?.message ?? 'The request failed. Please try again.',
        response.status,
        body.error?.details ?? [],
      );
    return body as T;
  } catch (error) {
    if (external?.aborted) throw new DOMException('Request cancelled', 'AbortError');
    if (error instanceof ApiError) throw error;
    if (mutation)
      throw new ApiError('Could not confirm the save. Check the list before trying again.');
    throw new ApiError(
      timedOut
        ? 'The request timed out. Please try again.'
        : 'Could not load your todos. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timeout);
    external?.removeEventListener('abort', abort);
  }
}
export const api = {
  async create(input: TodoInput, signal: AbortSignal) {
    return (
      await request<{ data: Todo }>('/api/v1/todos', {
        method: 'POST',
        body: JSON.stringify(input),
        signal,
      })
    ).data;
  },
  async update(id: string, input: TodoPatch, signal: AbortSignal) {
    return (
      await request<{ data: Todo }>(`/api/v1/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        signal,
      })
    ).data;
  },
  async delete(id: string, signal: AbortSignal) {
    await request<void>(`/api/v1/todos/${id}`, { method: 'DELETE', signal });
    return true;
  },
};
