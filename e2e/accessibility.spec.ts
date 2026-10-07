import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';

test('list, detail, create and edit dialogs have no detected axe violations', async ({
  page,
  seed,
}) => {
  const todo = await seed();
  await page.goto('/');
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
  const scan = async () => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  };
  await scan();
  const opener = page.getByRole('button', { name: 'New todo' });
  await opener.click();
  await expect(page.getByLabel('Title', { exact: false })).toBeFocused();
  await scan();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(
      true,
    );
  }
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.goto(`/todo/?id=${todo.id}`);
  await expect(page.getByRole('heading', { name: todo.title })).toBeVisible();
  await scan();
  await page.getByRole('button', { name: 'Edit todo', exact: true }).click();
  await scan();
  await page.getByLabel('Title', { exact: false }).fill('   ');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByLabel('Title', { exact: false })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Edit todo', exact: true })).toBeFocused();
  const deleteOpener = page.getByRole('button', { name: 'Delete todo', exact: true });
  await deleteOpener.click();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(deleteOpener).toBeFocused();
});
