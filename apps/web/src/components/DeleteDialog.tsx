import type { Todo } from '../types/todo';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { useTodoMutation } from '../hooks/useTodoMutation';
import { api } from '../lib/api';

export function DeleteDialog({
  todo,
  onClose,
  onDeleted,
}: {
  todo: Todo;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const mutation = useTodoMutation();
  const busy = mutation.pending.length > 0;
  return (
    <Dialog title="Delete this todo?" busy={busy} onClose={onClose}>
      <div className="delete-body">
        <span className="state-icon danger">
          <Icon name="trash" size={28} />
        </span>
        <p className="delete-title">{todo.title}</p>
        <p>This action cannot be undone.</p>
        {mutation.error && (
          <p className="error-message" role="alert">
            {mutation.error.message}
          </p>
        )}
      </div>
      <div className="dialog-footer">
        <button className="button" data-initial-focus disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="button destructive"
          disabled={busy}
          onClick={() =>
            void mutation
              .run(todo.id, (signal) => api.delete(todo.id, signal))
              .then((result) => {
                if (result) onDeleted();
              })
          }
        >
          {busy ? 'Deleting…' : 'Delete todo'}
        </button>
      </div>
    </Dialog>
  );
}
