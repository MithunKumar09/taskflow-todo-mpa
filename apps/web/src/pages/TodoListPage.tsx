import { useEffect, useState } from 'react';
import type { Filters, Todo, TodoStatus } from '../types/todo';
import { defaultFilters } from '../lib/query';
import { api } from '../lib/api';
import { statusLabels, priorityLabels } from '../lib/format';
import { useTodos, useDebouncedValue } from '../hooks/useTodos';
import { useTodoMutation } from '../hooks/useTodoMutation';
import { Shell } from '../components/Shell';
import { Icon } from '../components/Icon';
import { TodoRow } from '../components/TodoRow';
import { TodoForm } from '../components/TodoForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { PageState, Skeleton } from '../components/PageState';

export function TodoListPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const q = useDebouncedValue(filters.q);
  const todos = useTodos({ ...filters, q });
  const mutation = useTodoMutation();
  const [form, setForm] = useState<Todo | 'create' | null>(null);
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [notice, setNotice] = useState('');
  const filtered = Boolean(filters.q.trim() || filters.status || filters.priority);
  function change(field: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value, page: 1 }));
  }
  function saved(todo: Todo) {
    setForm(null);
    setNotice(`“${todo.title}” saved.`);
    todos.reload();
  }
  async function updateStatus(todo: Todo, status: TodoStatus) {
    const result = await mutation.run(todo.id, (signal) => api.update(todo.id, { status }, signal));
    if (result) {
      setNotice('Status updated.');
      todos.reload();
    }
  }
  useEffect(() => {
    if (
      !todos.loading &&
      !todos.error &&
      todos.data &&
      filters.page > Math.max(1, todos.data.meta.totalPages)
    )
      setFilters((current) => ({ ...current, page: Math.max(1, todos.data!.meta.totalPages) }));
  }, [todos.data, todos.error, todos.loading, filters.page]);
  const meta = todos.data?.meta;
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORK, AT A GLANCE</p>
          <h1>My todos</h1>
          <p className="page-subtitle">Stay organized and make room for what matters.</p>
        </div>
        <button
          className="button primary new-todo"
          data-focus-fallback
          onClick={() => setForm('create')}
        >
          <Icon name="plus" />
          New todo
        </button>
      </div>
      <div className="filters">
        <label className="search-control">
          <span className="sr-only">Search todos</span>
          <Icon name="search" />
          <input
            type="search"
            placeholder="Search todos…"
            aria-label="Search todos"
            value={filters.q}
            maxLength={160}
            onChange={(event) => change('q', event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(event) => change('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by priority</span>
          <select
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(event) => change('priority', event.target.value)}
          >
            <option value="">All priorities</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort todos</span>
          <select
            aria-label="Sort todos"
            value={filters.sort}
            onChange={(event) => change('sort', event.target.value)}
          >
            <option value="createdAt_desc">Newest first</option>
            <option value="createdAt_asc">Oldest first</option>
            <option value="dueAt">Due date</option>
            <option value="priority_desc">Highest priority</option>
          </select>
        </label>
        <button
          className="button reset-button"
          disabled={!filtered && filters.sort === defaultFilters.sort}
          onClick={() => setFilters({ ...defaultFilters })}
        >
          Reset
        </button>
      </div>
      <div className="feedback" aria-live="polite">
        {todos.loading && todos.data ? 'Updating your list…' : notice}
      </div>
      {mutation.error && (
        <p className="error-message" role="alert">
          {mutation.error.message}
        </p>
      )}
      <section className="list-surface" aria-label="Todo list" aria-busy={todos.loading}>
        {todos.error ? (
          <PageState title="Could not load todos" message={todos.error.message} error>
            <button className="button primary" onClick={todos.reload}>
              Try again
            </button>
          </PageState>
        ) : !todos.data ? (
          <Skeleton />
        ) : todos.data.data.length === 0 ? (
          <PageState
            title={filtered ? 'No todos match your filters' : 'No todos yet'}
            message={
              filtered
                ? 'Try adjusting your search, status, or priority.'
                : 'Create your first todo and give your day a little direction.'
            }
          >
            {filtered ? (
              <button className="button" onClick={() => setFilters({ ...defaultFilters })}>
                Clear filters
              </button>
            ) : (
              <button className="button primary" onClick={() => setForm('create')}>
                <Icon name="plus" />
                Create your first todo
              </button>
            )}
          </PageState>
        ) : (
          <>
            <div className="list-columns" aria-hidden="true">
              <span>Title</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Due date</span>
              <span>Actions</span>
            </div>
            {todos.data.data.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                busy={mutation.pending.includes(todo.id)}
                onStatus={(status) => void updateStatus(todo, status)}
                onEdit={() => setForm(todo)}
                onDelete={() => setDeleting(todo)}
              />
            ))}
          </>
        )}
        {meta && meta.total > 0 && (
          <nav className="pagination" aria-label="Pagination">
            <span>
              Showing {(meta.page - 1) * meta.limit + (todos.data!.data.length ? 1 : 0)}–
              {(meta.page - 1) * meta.limit + todos.data!.data.length} of {meta.total} todos
            </span>
            <div>
              <button
                className="button"
                disabled={filters.page <= 1 || todos.loading}
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              >
                Previous
              </button>
              <span className="page-number">
                {meta.page} / {meta.totalPages}
              </span>
              <button
                className="button"
                disabled={filters.page >= meta.totalPages || todos.loading}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>
      {form && (
        <TodoForm
          {...(form === 'create' ? {} : { todo: form })}
          onClose={() => setForm(null)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <DeleteDialog
          todo={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setNotice('Todo deleted.');
            todos.reload();
          }}
        />
      )}
    </Shell>
  );
}
