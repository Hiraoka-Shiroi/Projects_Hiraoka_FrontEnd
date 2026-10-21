import { test, expect, waitForAccountSave } from './fixtures';

test('перезагрузка после записи на сервер до получения ответа сохраняет заметку без ложного конфликта', async ({ page, request }) => {
  await page.goto('/#lesson/9');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('.personal-notes > summary').click();
  let release!: () => void; let committed!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  const written = new Promise<void>(resolve => { committed = resolve; });
  await page.route('**/api/progress', async route => {
    if (route.request().method() !== 'PUT') { await route.continue(); return; }
    const response = await route.fetch();
    expect(response.ok()).toBeTruthy(); committed(); await hold;
    await route.fulfill({ response }).catch(() => {});
  });
  try {
    await page.getByLabel('Личные заметки к уроку 9').fill('Сервер сохранил, ответ ещё в пути');
    await written;
    await page.reload();
    await page.locator('.personal-notes > summary').click();
    await expect(page.getByLabel('Личные заметки к уроку 9')).toHaveValue('Сервер сохранил, ответ ещё в пути');
    await waitForAccountSave(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect((await (await request.get('/api/progress')).json()).progress.lessons[9].notes).toBe('Сервер сохранил, ответ ещё в пути');
  } finally { release(); }
});

test('закладка урока 1 и фильтр избранного переживают перезагрузку без изменения оценки', async ({ page, request, account }) => {
  const original = account.progress.lessons[1];
  await page.goto('/#lesson/1');
  await expect(page.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
  await page.getByRole('button', { name: 'В избранное', exact: true }).click();
  await expect(page.getByRole('button', { name: 'В избранном', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await waitForAccountSave(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'В избранном', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#roadmap');
  await page.getByRole('button', { name: 'Только избранное', exact: true }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(1);
  await expect(page.locator('.lesson-row .lesson-number')).toHaveText('01');
  await page.reload();
  await page.getByRole('button', { name: 'Только избранное', exact: true }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(1);
  await expect(page.locator('.lesson-row .lesson-number')).toHaveText('01');
  const progress = (await (await request.get('/api/progress')).json()).progress;
  expect(progress.lessons[1].bookmarked).toBe(true);
  expect(progress.lessons[1].status).toBe(original.status);
  expect(progress.lessons[1].mastery).toBe(original.mastery);
  expect(progress.lessons[1].reviews).toEqual(original.reviews);
});

test('во время сохранения импорта кнопки и Escape не допускают повторного действия', async ({ page, request, account }) => {
  await page.goto('/#report');
  const imported = structuredClone(account.progress);
  imported.goals = 'Цель из дождaвшегося сервера импорта';
  let release!: () => void; let started!: () => void; let writes = 0;
  const hold = new Promise<void>(resolve => { release = resolve; });
  const received = new Promise<void>(resolve => { started = resolve; });
  await page.route('**/api/progress', async route => {
    if (route.request().method() === 'PUT') { writes++; started(); await hold; }
    await route.continue();
  });
  try {
    await page.getByLabel('Файл резервной копии').setInputFiles({ name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    const dialog = page.getByRole('dialog', { name: 'Проверенная резервная копия' });
    await dialog.getByRole('button', { name: 'Применить импорт', exact: true }).click();
    await received;
    await expect(dialog).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.getByRole('button', { name: 'Сохраняем импорт…', exact: true })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Отмена', exact: true })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Скачать текущую копию', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    expect(writes).toBe(1);
    release();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Резервная копия импортирована.');
    expect((await (await request.get('/api/progress')).json()).progress.goals).toBe(imported.goals);
    expect(writes).toBe(1);
  } finally { release(); }
});
