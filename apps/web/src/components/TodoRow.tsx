import type { Todo, TodoStatus } from '../types/todo';
import { formatDate, priorityLabels, statusLabels } from '../lib/format';
import { Icon } from './Icon';
export function TodoRow({
  todo,
  busy,
  onStatus,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  busy: boolean;
  onStatus: (status: TodoStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="todo-row" data-testid="todo-row" aria-label={todo.title}>
      <div className="todo-title-cell">
        <span className={`row-marker ${todo.status.toLowerCase()}`} aria-hidden="true">
          {todo.status === 'COMPLETED' && <Icon name="check" size={14} />}
        </span>
        <div className="todo-copy">
          <a href={`/todo/?id=${todo.id}`} className="todo-title">
            {todo.title}
          </a>
          {todo.description && <p className="description-preview">{todo.description}</p>}
        </div>
      </div>
      <select
        className={`status-select ${todo.status.toLowerCase()}`}
        aria-label={`Status for ${todo.title}`}
        value={todo.status}
        disabled={busy}
        onChange={(event) => onStatus(event.target.value as TodoStatus)}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <span className={`priority ${todo.priority.toLowerCase()}`}>
        {priorityLabels[todo.priority]}
      </span>
      <span className="due-date">{todo.dueAt ? formatDate(todo.dueAt) : 'No due date'}</span>
      <div className="row-actions">
        <button
          className="icon-button"
          aria-label={`Edit ${todo.title}`}
          title="Edit todo"
          disabled={busy}
          onClick={onEdit}
        >
          <Icon name="edit" />
        </button>
        <button
          className="icon-button danger-text"
          aria-label={`Delete ${todo.title}`}
          title="Delete todo"
          disabled={busy}
          onClick={onDelete}
        >
          <Icon name="trash" />
        </button>
      </div>
    </article>
  );
}
