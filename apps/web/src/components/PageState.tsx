import type { ReactNode } from 'react';
import { Icon } from './Icon';
export function PageState({
  title,
  message,
  error = false,
  children,
}: {
  title: string;
  message: string;
  error?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="page-state" aria-live="polite">
      <span className={`state-icon ${error ? 'danger' : ''}`}>
        <Icon name={error ? 'alert' : 'list'} size={30} />
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {children}
    </section>
  );
}
export function Skeleton({ detail = false }: { detail?: boolean }) {
  return (
    <div
      className={`skeleton ${detail ? 'detail-skeleton' : ''}`}
      data-testid="loading-skeleton"
      role="status"
      aria-label="Loading todos"
    >
      <span className="sr-only">Loading todos…</span>
      {Array.from({ length: detail ? 4 : 6 }, (_, index) => (
        <div className="skeleton-row" key={index} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
