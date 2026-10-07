import { createRoot } from 'react-dom/client';
import { TodoListPage } from '../pages/TodoListPage';
import '../styles/tokens.css';
import '../styles/globals.css';
import '../styles/components.css';
createRoot(document.getElementById('root')!).render(<TodoListPage />);
