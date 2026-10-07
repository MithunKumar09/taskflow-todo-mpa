import { useEffect, useState } from 'react';
import { useTodo } from '../hooks/useTodo';
import { useTodoMutation } from '../hooks/useTodoMutation';
import { isUuid } from '../lib/query';
import { api } from '../lib/api';
import { formatDate, priorityLabels, statusLabels } from '../lib/format';
import type { TodoStatus } from '../types/todo';
import { Shell } from '../components/Shell';
import { Icon } from '../components/Icon';
import { PageState, Skeleton } from '../components/PageState';
import { TodoForm } from '../components/TodoForm';
import { DeleteDialog } from '../components/DeleteDialog';

export function TodoDetailPage() {
  const id = new URLSearchParams(window.location.search).get('id');
  const valid = isUuid(id);
  const result = useTodo(valid ? id : null);
  const todo = result.data?.data;
  const mutation = useTodoMutation();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (todo) document.title = `${todo.title} · TaskFlow`;
  }, [todo]);
  async function statusChange(status: TodoStatus) {
    if (!todo) return;
    const updated = await mutation.run(todo.id, (signal) =>
      api.update(todo.id, { status }, signal),
    );
    if (updated) {
      setNotice('Status updated.');
      result.reload();
    }
  }
  return (
    <Shell>
      <a className="back-link" href="/" data-focus-fallback>
        <Icon name="arrow" />
        Back to todos
      </a>
      {!valid ? (
        <PageState
          title={id ? 'Invalid todo ID' : 'Missing todo ID'}
          message={
            id
              ? 'Check the link, or return to your list.'
              : 'Open a todo from the list to view its details.'
          }
          error
        >
          <a className="button" href="/">
            Back to todos
          </a>
        </PageState>
      ) : result.error ? (
        <PageState
          title={result.error.status === 404 ? 'Todo not found' : 'Could not load this todo'}
          message={
            result.error.status === 404
              ? 'This todo may have been deleted. Your other todos are still in the list.'
              : result.error.message
          }
          error
        >
          {result.error.status === 404 ? (
            <a className="button" href="/">
              Back to todos
            </a>
          ) : (
            <button className="button primary" onClick={result.reload}>
              Try again
            </button>
          )}
        </PageState>
      ) : !todo ? (
        <>
          <h1 className="sr-only">Todo details</h1>
          <Skeleton detail />
        </>
      ) : (
        <>
          <div className="detail-heading">
            <div>
              <p className="eyebrow">TODO DETAILS</p>
              <h1>{todo.title}</h1>
              <span className={`status-badge ${todo.status.toLowerCase()}`}>
                {statusLabels[todo.status]}
              </span>
            </div>
            <div className="detail-actions">
              <button
                className="button"
                disabled={mutation.pending.length > 0}
                onClick={() => setEditing(true)}
              >
                <Icon name="edit" />
                Edit todo
              </button>
              <button
                className="button danger-text"
                disabled={mutation.pending.length > 0}
                onClick={() => setDeleting(true)}
              >
                <Icon name="trash" />
                Delete todo
              </button>
            </div>
          </div>
          <div className="feedback" aria-live="polite">
            {result.loading ? 'Updating todo…' : notice}
          </div>
          {mutation.error && (
            <p className="error-message" role="alert">
              {mutation.error.message}
            </p>
          )}
          <div className="detail-layout">
            <section className="detail-panel" aria-label="Todo information">
              <h2>At a glance</h2>
              <dl>
                <div>
                  <dt>
                    <label htmlFor="detail-status">Status</label>
                  </dt>
                  <dd>
                    <select
                      id="detail-status"
                      className={`status-select ${todo.status.toLowerCase()}`}
                      value={todo.status}
                      disabled={mutation.pending.length > 0}
                      onChange={(event) => void statusChange(event.target.value as TodoStatus)}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd>
                    <span className={`priority ${todo.priority.toLowerCase()}`}>
                      {priorityLabels[todo.priority]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Due date</dt>
                  <dd>{formatDate(todo.dueAt, true)}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(todo.createdAt, true)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDate(todo.updatedAt, true)}</dd>
                </div>
                <div>
                  <dt>Completed</dt>
                  <dd>{formatDate(todo.completedAt, true)}</dd>
                </div>
              </dl>
            </section>
            <section className="detail-panel description-panel">
              <h2>Description</h2>
              <p>
                {todo.description ??
                  'No description added. A clear title is sometimes all you need.'}
              </p>
            </section>
          </div>
          {editing && (
            <TodoForm
              todo={todo}
              onClose={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                setNotice('Changes saved.');
                result.reload();
              }}
            />
          )}
          {deleting && (
            <DeleteDialog
              todo={todo}
              onClose={() => setDeleting(false)}
              onDeleted={() => window.location.assign('/')}
            />
          )}
        </>
      )}
    </Shell>
  );
}
