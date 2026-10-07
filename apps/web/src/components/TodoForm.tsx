import { useId, useRef, useState, type FormEvent } from 'react';
import type { Todo, TodoInput, TodoPatch, TodoPriority, TodoStatus } from '../types/todo';
import { api } from '../lib/api';
import { localDateInput, priorityLabels, statusLabels } from '../lib/format';
import { useTodoMutation } from '../hooks/useTodoMutation';
import { Dialog } from './Dialog';

export function TodoForm({
  todo,
  onClose,
  onSaved,
}: {
  todo?: Todo;
  onClose: () => void;
  onSaved: (todo: Todo) => void;
}) {
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState<TodoStatus>(todo?.status ?? 'PENDING');
  const [dueAt, setDueAt] = useState(localDateInput(todo?.dueAt ?? null));
  const [validation, setValidation] = useState('');
  const mutation = useTodoMutation();
  const busy = mutation.pending.length > 0;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim() || title.trim().length > 160) {
      setValidation('Enter a title with 1 to 160 characters.');
      titleRef.current?.focus();
      return;
    }
    const date = dueAt ? new Date(dueAt) : null;
    if (date && Number.isNaN(date.getTime())) {
      setValidation('Enter a valid due date and time.');
      return;
    }
    setValidation('');
    const input: TodoInput = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      dueAt: date?.toISOString() ?? null,
    };
    const patch: TodoPatch = {};
    if (todo) {
      if (input.title !== todo.title) patch.title = input.title;
      if (input.description !== todo.description) patch.description = input.description;
      if (input.priority !== todo.priority) patch.priority = input.priority;
      if (dueAt !== localDateInput(todo.dueAt)) patch.dueAt = input.dueAt;
      if (status !== todo.status) patch.status = status;
      if (Object.keys(patch).length === 0) {
        setValidation('No changes to save yet.');
        return;
      }
    }
    const result = await mutation.run('form', (signal) =>
      todo ? api.update(todo.id, patch, signal) : api.create(input, signal),
    );
    if (result) onSaved(result);
  }
  const titleError =
    validation || mutation.error?.details.find((detail) => detail.field === 'title')?.message;
  return (
    <Dialog title={todo ? 'Edit todo' : 'Create todo'} busy={busy} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} noValidate>
        <div className="form-body">
          <label htmlFor={`${id}-title`}>
            Title <span className="required">*</span>
          </label>
          <input
            ref={titleRef}
            id={`${id}-title`}
            data-initial-focus
            value={title}
            maxLength={160}
            required
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? `${id}-error` : `${id}-count`}
            disabled={busy}
            onChange={(event) => {
              setTitle(event.target.value);
              setValidation('');
            }}
            placeholder="What would you like to get done?"
          />
          <div className="field-meta">
            <span id={`${id}-error`} className="field-error">
              {titleError}
            </span>
            <span id={`${id}-count`}>{title.length}/160</span>
          </div>
          <label htmlFor={`${id}-description`}>
            Description <span className="optional">optional</span>
          </label>
          <textarea
            id={`${id}-description`}
            value={description}
            maxLength={5000}
            rows={4}
            disabled={busy}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a little context…"
          />
          <div className="field-meta">
            <span />
            <span>{description.length}/5000</span>
          </div>
          <div className="form-grid">
            {todo && (
              <div>
                <label htmlFor={`${id}-status`}>Status</label>
                <select
                  id={`${id}-status`}
                  value={status}
                  disabled={busy}
                  onChange={(event) => setStatus(event.target.value as TodoStatus)}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor={`${id}-priority`}>Priority</label>
              <select
                id={`${id}-priority`}
                value={priority}
                disabled={busy}
                onChange={(event) => setPriority(event.target.value as TodoPriority)}
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label htmlFor={`${id}-due`}>
            Due date and time <span className="optional">optional</span>
          </label>
          <input
            id={`${id}-due`}
            type="datetime-local"
            value={dueAt}
            disabled={busy}
            onChange={(event) => setDueAt(event.target.value)}
          />
          <p className="field-hint">Shown in your local time zone.</p>
          {mutation.error && (
            <p className="error-message" role="alert">
              {mutation.error.message}
            </p>
          )}
        </div>
        <div className="dialog-footer">
          <button className="button" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy} type="submit">
            {busy ? 'Saving…' : todo ? 'Save changes' : 'Create todo'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
