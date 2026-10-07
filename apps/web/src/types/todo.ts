export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface TodoInput {
  title: string;
  description: string | null;
  priority: TodoPriority;
  dueAt: string | null;
}
export type TodoPatch = Partial<TodoInput> & { status?: TodoStatus };
export interface TodoList {
  data: Todo[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface Filters {
  q: string;
  status: string;
  priority: string;
  sort: string;
  page: number;
}
