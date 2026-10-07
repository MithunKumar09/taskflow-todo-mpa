import { test, expect } from './fixtures';

for (const [path, title] of [
  ['/todo/', 'Missing todo ID'],
  ['/todo/?id=invalid', 'Invalid todo ID'],
]) {
  test(title!, async ({ page }) => {
    let reads = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/v1/todos/')) reads++;
    });
    await page.goto(path!);
    await expect(page.getByRole('heading', { name: title! })).toBeVisible();
    expect(reads).toBe(0);
  });
}
test('unknown valid id returns a real 404', async ({ page }) => {
  const response = page.waitForResponse((response) =>
    response.url().includes('/api/v1/todos/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  );
  await page.goto('/todo/?id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  expect((await response).status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Todo not found' })).toBeVisible();
});
test('distinguishes empty database and filtered empty results', async ({ page, seed }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No todos yet' })).toBeVisible();
  await seed();
  await page.reload();
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
  await page.getByRole('searchbox').fill('nothing matches this');
  await expect(page.getByRole('heading', { name: 'No todos match your filters' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
});
test('API failure provides retry and recovers', async ({ page, seed }) => {
  await seed();
  await page.route('**/api/v1/todos?*', (route) =>
    route.fulfill({
      status: 500,
      json: {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong. Please try again.',
          details: [],
          requestId: 'test',
        },
      },
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Could not load todos' })).toBeVisible();
  await page.unroute('**/api/v1/todos?*');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
});

test('failed submission preserves inputs and allows deliberate retry', async ({
  page,
  database,
}) => {
  let writes = 0;
  const failWrite = async (route: import('@playwright/test').Route) => {
    if (route.request().method() !== 'POST') return route.continue();
    writes++;
    await route.fulfill({
      status: 500,
      json: {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'The save failed. Try again.',
          details: [],
          requestId: 'test',
        },
      },
    });
  };
  await page.route('**/api/v1/todos', failWrite);
  await page.goto('/');
  await page.getByRole('button', { name: 'New todo' }).click();
  await page.getByLabel('Title', { exact: false }).fill('Preserve my draft');
  await page.getByLabel('Description', { exact: false }).fill('Keep this context after a failure.');
  await page.getByRole('button', { name: 'Create todo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The save failed.');
  await expect(page.getByLabel('Title', { exact: false })).toHaveValue('Preserve my draft');
  await expect(page.getByLabel('Description', { exact: false })).toHaveValue(
    'Keep this context after a failure.',
  );
  expect(writes).toBe(1);
  expect(await database.todo.count()).toBe(0);
  await page.unroute('**/api/v1/todos', failWrite);
  await page.getByRole('button', { name: 'Create todo', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await database.todo.count()).toBe(1);
});
test('slow read displays a stable skeleton then content', async ({ page, seed }) => {
  await seed();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/todos?*', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto('/');
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
  await expect(page.getByTestId('loading-skeleton')).toHaveCount(0);
});
test('duplicate mutation is blocked and Escape cannot dismiss a pending save', async ({
  page,
  database,
}) => {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/todos', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    requests++;
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'New todo' }).click();
    await page.getByLabel('Title', { exact: false }).fill('One write only');
    await page.getByRole('button', { name: 'Create todo', exact: true }).dblclick();
    await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect.poll(() => requests).toBe(1);
  } finally {
    release();
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await database.todo.count()).toBe(1);
});
test('out-of-order filter reads cannot replace the newest result', async ({ page, seed }) => {
  await seed({ title: 'Pending item' });
  await seed({ title: 'Working item', status: 'IN_PROGRESS' });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto('/');
  await expect(page.getByTestId('todo-row')).toHaveCount(2);
  await page.route('**/api/v1/todos?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('status') === 'PENDING') await gate;
    if (!page.isClosed()) {
      try {
        await route.continue();
      } catch {
        /* Superseded browser requests may already be cancelled. */
      }
    }
  });
  try {
    await page.getByLabel('Filter by status').selectOption('PENDING');
    await page.getByLabel('Filter by status').selectOption('IN_PROGRESS');
    await expect(page.getByTestId('todo-row')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Working item' })).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByTestId('todo-row')).toContainText('Working item');
});
