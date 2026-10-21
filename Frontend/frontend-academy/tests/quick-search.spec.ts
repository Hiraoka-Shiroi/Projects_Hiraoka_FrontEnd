import { test, expect, accountCache } from './fixtures';

test('поиск открывает план урока, сохраняя учебный прогресс', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  const progressBefore = (await accountCache(page)).progress;
  const before = { lastLesson: progressBefore.lastLesson, lessons: progressBefore.lessons };
  await page.getByRole('button', { name: 'Быстрый поиск', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Быстрый поиск' });
  const input = dialog.getByRole('combobox', { name: 'Поиск уроков и проектов' });
  await expect(input).toBeFocused();
  await input.fill('WebSocket');
  const result = dialog.getByRole('option', { name: /^Урок 89\./ });
  await expect(result).toContainText('План');
  await input.press('Enter');
  await expect(page).toHaveURL(/#lesson\/89$/);
  await expect(dialog).not.toBeVisible();
  const progressAfter = (await accountCache(page)).progress;
  const after = { lastLesson: progressAfter.lastLesson, lessons: progressAfter.lessons };
  expect(after).toEqual(before);
});

test('Ctrl+K, стрелки и Enter открывают раздел; проект открывается по прямой ссылке', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: 'Быстрый поиск' });
  const input = dialog.getByRole('combobox', { name: 'Поиск уроков и проектов' });
  await expect(dialog.getByRole('option', { name: /^Продолжить\. Урок 9\./ })).toContainText('Материал');
  await input.press('ArrowDown');
  await input.press('ArrowDown');
  await expect(dialog.getByRole('option', { name: 'Дорожная карта', exact: true })).toHaveAttribute('aria-selected', 'true');
  await input.press('Enter');
  await expect(page).toHaveURL(/#roadmap$/);
  await page.keyboard.press('Control+k');
  await input.fill('административная');
  await dialog.getByRole('option', { name: 'Проект. Большая административная панель сервиса', exact: true }).click();
  await expect(page).toHaveURL(/#projects\/admin$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Большая административная панель сервиса', exact: true })).toBeVisible();
});

test('Escape и фон закрывают поиск и возвращают фокус; нет результатов и лимит обрабатываются', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Быстрый поиск', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Быстрый поиск' });
  const input = dialog.getByRole('combobox', { name: 'Поиск уроков и проектов' });
  await input.fill('несуществующая_тема_987');
  await expect(dialog).toContainText('Ничего не найдено');
  await input.press('Enter');
  await expect(dialog).toBeVisible();
  await input.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(input).toHaveValue('');
  await input.fill('React');
  await expect(dialog.getByRole('option')).toHaveCount(10);
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('быстрый поиск доступен на экране 320px без горизонтального переполнения', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Быстрый поиск', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Быстрый поиск' });
  await dialog.getByRole('combobox').fill('приложение');
  await expect(dialog.getByRole('option').first()).toBeVisible();
  const sizes = await dialog.evaluate(element => ({
    width: element.getBoundingClientRect().width, scroll: element.scrollWidth, client: element.clientWidth,
    pageScroll: document.documentElement.scrollWidth, viewport: window.innerWidth,
  }));
  expect(sizes.width).toBeLessThanOrEqual(320);
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
  expect(sizes.pageScroll).toBeLessThanOrEqual(sizes.viewport + 1);
  await dialog.getByRole('button', { name: 'Закрыть быстрый поиск' }).click();
  await expect(dialog).not.toBeVisible();
});
