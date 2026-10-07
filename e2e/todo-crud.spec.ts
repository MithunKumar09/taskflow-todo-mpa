import { test, expect } from './fixtures';

test('create, list, edit, complete, reopen, and delete a todo', async ({ page, database }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New todo' }).click();
  await page.getByLabel('Title', { exact: false }).fill('Prepare release');
  await page.getByLabel('Description', { exact: false }).fill('Review the final checklist.');
  await page.getByLabel('Priority', { exact: true }).selectOption('HIGH');
  await page.getByRole('button', { name: 'Create todo', exact: true }).click();
  const row = page.getByTestId('todo-row');
  await expect(row.getByRole('link', { name: 'Prepare release' })).toBeVisible();
  await row.getByRole('button', { name: 'Edit Prepare release' }).click();
  await page.getByLabel('Title', { exact: false }).fill('Publish release');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(row.getByRole('link', { name: 'Publish release' })).toBeVisible();
  await row.getByRole('combobox', { name: 'Status for Publish release' }).selectOption('COMPLETED');
  await expect.poll(async () => (await database.todo.findFirst())?.completedAt).not.toBeNull();
  await expect(row.getByRole('combobox')).toBeEnabled();
  await row.getByRole('combobox').selectOption('IN_PROGRESS');
  await expect.poll(async () => (await database.todo.findFirst())?.status).toBe('IN_PROGRESS');
  expect((await database.todo.findFirst())?.completedAt).toBeNull();
  await expect(row.getByRole('button', { name: 'Delete Publish release' })).toBeEnabled();
  await row.getByRole('button', { name: 'Delete Publish release' }).click();
  await page.getByRole('button', { name: 'Delete todo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No todos yet' })).toBeVisible();
  expect(await database.todo.count()).toBe(0);
});

test('search, filter, sort, and paginate persisted todos', async ({ page, seed }) => {
  await seed({
    title: 'Alpha review',
    priority: 'HIGH',
    createdAt: new Date('2026-10-01'),
    dueAt: new Date('2026-10-20'),
  });
  await seed({
    title: 'Beta meeting',
    priority: 'LOW',
    status: 'IN_PROGRESS',
    createdAt: new Date('2026-10-02'),
    dueAt: new Date('2026-10-10'),
  });
  await page.goto('/');
  await expect(page.getByTestId('todo-row')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Search todos' }).fill('ALPHA');
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Alpha review' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel('Filter by status').selectOption('IN_PROGRESS');
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Beta meeting' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel('Filter by priority').selectOption('HIGH');
  await expect(page.getByRole('link', { name: 'Alpha review' })).toBeVisible();
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByTestId('todo-row')).toHaveCount(2);
  await page.getByLabel('Sort todos').selectOption('createdAt_asc');
  await expect(page.getByTestId('todo-row').first()).toContainText('Alpha review');
  await page.getByLabel('Sort todos').selectOption('dueAt');
  await expect(page.getByTestId('todo-row').first()).toContainText('Beta meeting');
  for (let index = 0; index < 20; index++) await seed({ title: `Task ${index}` });
  await page.reload();
  await expect(page.getByTestId('todo-row')).toHaveCount(20);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByTestId('todo-row')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
});
