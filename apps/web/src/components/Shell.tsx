import type { ReactNode } from 'react';
import { Icon } from './Icon';
export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="TaskFlow home">
            <span className="brand-mark">
              <Icon name="check" size={19} />
            </span>
            TaskFlow
          </a>
          <a
            className="nav-link"
            href="/"
            aria-current={window.location.pathname === '/' ? 'page' : undefined}
          >
            Todos
          </a>
          <span className="header-note">A little clarity, every day.</span>
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        TaskFlow <span>Simple plans. Meaningful progress.</span>
      </footer>
    </>
  );
}
