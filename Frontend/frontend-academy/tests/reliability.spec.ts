import { test, expect, accountCache } from './fixtures';
import { readFile } from 'node:fs/promises';

test('server error leaves import dialog and both original copies intact; backup is available inside', async ({ page, request }, testInfo) => {
  await page.goto('/'); await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  const original = await accountCache(page);
  const originalServer = await (await request.get('/api/progress')).json();
  const incoming = structuredClone(original.progress); incoming.goals = 'Incoming goal that must not replace the original';
  await page.goto('/#report');
  await page.getByLabel('Файл резервной копии').setInputFiles({ name: 'copy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(incoming)) });
  const dialog = page.getByRole('dialog', { name: 'Проверенная резервная копия' });
  await expect(dialog).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Скачать текущую копию', exact: true }).click();
  const backupPath = testInfo.outputPath('before-import.json');
  await (await downloaded).saveAs(backupPath);
  expect(JSON.parse(await readFile(backupPath, 'utf8'))).toEqual(original.progress);
  await page.route('**/api/progress', async route => {
    if (route.request().method() === 'PUT') await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Тест: сервер временно недоступен.' }) });
    else await route.continue();
  });
  await dialog.getByRole('button', { name: 'Применить импорт', exact: true }).click();
  await expect(dialog).toBeVisible(); await expect(dialog.getByRole('alert')).toContainText('Текущая копия остаётся');
  await expect(page.getByText('Резервная копия импортирована.', { exact: true })).toHaveCount(0);
  expect((await accountCache(page)).progress).toEqual(original.progress);
  expect(await (await request.get('/api/progress')).json()).toEqual(originalServer);
  await dialog.getByRole('button', { name: 'Отмена', exact: true }).click();
  await page.goto('/'); await expect(page.getByLabel('Текущие цели')).toHaveValue(original.progress.goals);
});

test('failed autosave can be retried without losing the typed text', async ({ page }) => {
  let blocked = false;
  await page.route('**/api/progress', async route => {
    if (route.request().method() === 'PUT' && blocked) await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Не удалось сохранить: тестовая ошибка сервера.' }) });
    else await route.continue();
  });
  await page.goto('/'); await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  blocked = true;
  await page.getByLabel('Текущие цели').fill('Текст не должен потеряться');
  await expect(page.getByRole('alert')).toContainText('Не удалось сохранить');
  expect((await accountCache(page)).progress.goals).toBe('Текст не должен потеряться');
  blocked = false;
  await page.getByRole('button', { name: 'Повторить сохранение', exact: true }).click();
  await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  await page.reload(); await expect(page.getByLabel('Текущие цели')).toHaveValue('Текст не должен потеряться');
});

test('conflict keeps recovery and export actions available', async ({ page, request, baseURL }) => {
  await page.goto('/'); await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  const current = await (await request.get('/api/progress')).json(); current.progress.goals = 'Other device';
  expect((await request.put('/api/progress', { headers: { Origin: baseURL! }, data: current })).status()).toBe(200);
  await page.getByLabel('Текущие цели').fill('Local draft to export');
  await expect(page.getByRole('alert')).toContainText('другой вкладке');
  await expect(page.getByRole('button', { name: 'Загрузить сохранённую версию', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Скачать текущую копию JSON', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Скрыть сообщение', exact: true })).toHaveCount(0);
});

test('project content follows direct hashes, selection and Back', async ({ page }) => {
  await page.goto('/#projects/js-lab');
  const original = await page.locator('.project-detail h2').first().textContent();
  await page.evaluate(() => { window.location.hash = 'projects/interactive'; });
  await expect(page.locator('.project-menu button[aria-pressed=true]')).toContainText(/интерактивной программой/i);
  expect(await page.locator('.project-detail h2').first().textContent()).not.toBe(original);
  await page.getByRole('navigation', { name: 'Выбор проекта' }).getByRole('button', { name: /Большая административная/ }).click();
  await expect(page).toHaveURL(/#projects\/admin$/);
  await page.goBack(); await expect(page).toHaveURL(/#projects\/interactive$/);
  await expect(page.locator('.project-menu button[aria-pressed=true]')).toContainText(/интерактивной программой/i);
});

test('self-check gives feedback after an attempt, persists and never closes the lesson', async ({ page }) => {
  await page.goto('/#lesson/9');
  await expect(page.locator('.check-feedback')).toHaveCount(0);
  await page.getByLabel('«Начало» и подсказка', { exact: true }).check();
  await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
  await expect(page.locator('.check-feedback')).toContainText('Разберём причину');
  await page.getByLabel('Только «Начало»', { exact: true }).check();
  await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
  await expect(page.locator('.check-feedback')).toContainText('Верно');
  await page.reload(); await expect(page.getByLabel('Только «Начало»', { exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Следующий урок →', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Следующий шаг →', exact: true }).click();
  await expect(page.getByRole('heading', { name: '2. Одна функция, разные данные', exact: true })).toBeFocused();
});

test('copy uses actual example text and clearly handles clipboard denial', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as unknown as { copied: string }).copied = text; } } });
  });
  await page.goto('/#lesson/9');
  await page.getByRole('button', { name: 'Скопировать пример', exact: true }).click();
  await expect(page.getByText('Скопировано', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toContain('function showTip()');
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } } }); });
  await page.getByRole('button', { name: 'Скопировать пример', exact: true }).click();
  await expect(page.locator('.copy-control')).toContainText('Браузер не разрешил копирование');
});

