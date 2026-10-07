import { createRoot } from 'react-dom/client';
import { TodoDetailPage } from '../pages/TodoDetailPage';
import '../styles/tokens.css';
import '../styles/globals.css';
import '../styles/components.css';
createRoot(document.getElementById('root')!).render(<TodoDetailPage />);
