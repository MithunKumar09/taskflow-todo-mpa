import { test, expect } from './fixtures';

test('anchor performs a document request; detail survives refresh and edits', async ({
  page,
  seed,
}) => {
  const todo = await seed({ title: 'Open this todo' });
  await page.goto('/');
  const anchor = page.getByRole('link', { name: todo.title });
  await expect(anchor).toHaveAttribute('href', `/todo/?id=${todo.id}`);
  const [navigation] = await Promise.all([
    page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        request.resourceType() === 'document' &&
        request.isNavigationRequest() &&
        url.pathname === '/todo/' &&
        url.searchParams.get('id') === todo.id
      );
    }),
    anchor.click(),
  ]);
  const response = await navigation.response();
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-type']).toContain('text/html');
  await expect(page).toHaveURL(`/todo/?id=${todo.id}`);
  await expect(page.getByRole('heading', { name: todo.title, exact: true })).toBeVisible();
  const refresh = await page.reload();
  expect(refresh?.request().resourceType()).toBe('document');
  expect(refresh?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: todo.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit todo', exact: true }).click();
  await page.getByLabel('Title', { exact: false }).fill('Updated from detail');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Updated from detail' })).toBeVisible();
});
