import { test, expect } from './fixtures';

test('короткие шаги, мини-попытка и место чтения сохраняются; урок не закрывается', async ({ page }) => {
  await page.goto('/#lesson/9');
  await expect(page.getByRole('region', { name: 'Короткий разбор функций' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '1. Написать функцию ≠ запустить её', exact: true })).toBeVisible();
  await page.getByLabel('Мой ответ или код').fill('showTip(); // ещё один вызов');
  await page.getByRole('button', { name: 'Показать разбор вывода', exact: true }).click();
  await expect(page.locator('.execution-trace')).toContainText('Начало');
  await page.getByRole('button', { name: 'Следующий шаг →', exact: true }).click();
  await expect(page.getByRole('heading', { name: '2. Одна функция, разные данные', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '2. Одна функция, разные данные', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Шаг 1: 1. Написать функцию ≠ запустить её', exact: true }).click();
  await expect(page.getByLabel('Мой ответ или код')).toHaveValue('showTip(); // ещё один вызов');
  await expect(page.getByRole('button', { name: 'Следующий урок →', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /^Справочник/ }).click();
  await expect(page.getByRole('heading', { name: 'Когда нужны подробности', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Все задания/ }).click();
  await expect(page.locator('.exercise-card')).toHaveCount(8);
});

test('демонстрация на главной реагирует на кнопки и ведёт к нужному шагу', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '3. Результат', exact: true }).click();
  await expect(page.locator('.demo-result')).toHaveText('25');
  await page.getByRole('button', { name: /Разобрать return в уроке/ }).click();
  await expect(page).toHaveURL(/#lesson\/9$/);
  await expect(page.getByRole('heading', { name: '4. Забрать результат через return', exact: true })).toBeVisible();
});

test('набор текста не создаёт запись на каждый символ; reload сбрасывает очередь', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    (window as unknown as { writes: number }).writes = 0;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('frontend-academy.account.')) (window as unknown as { writes: number }).writes++;
      return original.call(this, key, value);
    };
  });
  await page.goto('/');
  await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  const before = await page.evaluate(() => (window as unknown as { writes: number }).writes);
  await page.getByLabel('Текущие цели').fill('');
  await page.getByLabel('Текущие цели').pressSequentially('Понятная небольшая задача', { delay: 1 });
  await expect(page.getByLabel('Текущие цели')).toHaveValue('Понятная небольшая задача');
  await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  const writes = await page.evaluate(() => (window as unknown as { writes: number }).writes);
  expect(writes - before).toBeLessThan(5);
  await page.getByLabel('Текущие цели').fill('Последнее изменение перед reload');
  await page.reload();
  await expect(page.getByLabel('Текущие цели')).toHaveValue('Последнее изменение перед reload');
});

test('другое устройство не теряет данные из-за отложенной записи', async ({ page, request, baseURL }) => {
  await page.goto('/');
  await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
  const server = await (await request.get('/api/progress')).json();
  server.progress.goals = 'Новая запись другого устройства';
  const remote = await request.put('/api/progress', { headers: { Origin: baseURL! }, data: server });
  expect(remote.status()).toBe(200);
  await page.getByLabel('Текущие цели').fill('Текущая несохранённая попытка');
  await expect(page.getByRole('alert')).toContainText('другой вкладке или на другом устройстве');
  await expect(page.getByLabel('Текущие цели')).toHaveValue('Текущая несохранённая попытка');
  const stored = await (await request.get('/api/progress')).json();
  expect(stored.progress.goals).toBe('Новая запись другого устройства');
});
