import { test, expect } from './fixtures';

for (const [width, height] of [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 900],
  [1440, 900],
] as const) {
  test.describe(`${width}px viewport`, () => {
    test.use({ viewport: { width, height }, hasTouch: width < 600, isMobile: width < 600 });
    test('content, controls, dialogs, and pagination remain usable', async ({ page, seed }) => {
      const longTitle = 'A meaningful task with a long title '.repeat(4).slice(0, 160);
      const long = await seed({
        title: longTitle,
        description: 'LongUnbrokenDescription'.repeat(180),
      });
      for (let index = 0; index < 20; index++) await seed({ title: `Responsive task ${index}` });
      await page.goto('/');
      await expect(page.getByTestId('todo-row')).toHaveCount(20);
      const checkOverflow = async () => {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          ),
        ).toBe(true);
      };
      await checkOverflow();
      for (const label of ['Filter by status', 'Filter by priority', 'Sort todos']) {
        const control = page.getByLabel(label);
        await control.scrollIntoViewIfNeeded();
        const box = await control.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      }
      await page.getByLabel('Filter by status').selectOption('COMPLETED');
      await expect(
        page.getByRole('heading', { name: 'No todos match your filters' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      await expect(page.getByTestId('todo-row')).toHaveCount(20);
      await page.getByLabel('Filter by priority').selectOption('HIGH');
      await expect(
        page.getByRole('heading', { name: 'No todos match your filters' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      await expect(page.getByTestId('todo-row')).toHaveCount(20);
      await page.getByRole('button', { name: 'Next', exact: true }).scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByTestId('todo-row')).toHaveCount(1);
      await expect(page.getByRole('link', { name: longTitle })).toBeVisible();
      await page.getByRole('button', { name: `Edit ${longTitle}`, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.width).toBeLessThanOrEqual(width);
      expect(box!.height).toBeLessThanOrEqual(height);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await checkOverflow();
      if (width < 600) {
        const action = page.getByRole('button', { name: `Edit ${longTitle}`, exact: true });
        const actionBox = await action.boundingBox();
        expect(actionBox!.width).toBeGreaterThanOrEqual(44);
        expect(actionBox!.height).toBeGreaterThanOrEqual(44);
      }
      await page.goto(`/todo/?id=${long.id}`);
      await expect(page.getByRole('heading', { name: longTitle })).toBeVisible();
      await checkOverflow();
      const edit = page.getByRole('button', { name: 'Edit todo', exact: true });
      await edit.focus();
      expect(await edit.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
        'none',
      );
    });
  });
}
