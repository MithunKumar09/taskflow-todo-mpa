import { test, expect } from './fixtures';

test('accepted application list and detail snapshots', async ({ page, seed }) => {
  test.skip(
    process.env.VISUAL_BASELINES_APPROVED !== '1',
    'Generate baselines only after the actual application is visually accepted.',
  );
  const todo = await seed({
    title: 'Review release checklist',
    description: 'Keep the release focused and easy to verify.',
    createdAt: new Date('2026-10-07T09:00:00Z'),
    updatedAt: new Date('2026-10-07T10:00:00Z'),
    priority: 'HIGH',
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByTestId('todo-row')).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('todo-list.png', { fullPage: true, animations: 'disabled' });
  await page.goto(`/todo/?id=${todo.id}`);
  await expect(page.getByRole('heading', { name: todo.title })).toBeVisible();
  await expect(page).toHaveScreenshot('todo-detail.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
