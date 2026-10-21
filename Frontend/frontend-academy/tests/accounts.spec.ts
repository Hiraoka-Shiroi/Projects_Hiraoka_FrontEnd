import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { initialProgress } from '../src/lib/progress';
import { STORAGE_KEY } from '../src/lib/storage';
import { mkdir } from 'node:fs/promises';

const password = 'Account-test-password-123!';
const username = () => `student_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
test.beforeEach(async ({ baseURL }) => { expect(baseURL).toBe('http://127.0.0.1:4175'); });
async function register(page: Page, login: string, name = 'Новый ученик') {
  await page.getByLabel('Как тебя называть').fill(name);
  await page.getByLabel('Логин', { exact: true }).fill(login);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByLabel('Повтори пароль').fill(password);
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
}
async function login(page: Page, name: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Вход', exact: true }).click();
  await page.getByLabel('Логин', { exact: true }).fill(name);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Войти в аккаунт', exact: true }).click();
}
async function session(context: BrowserContext) {
  const response = await context.request.get('/api/auth/me');
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function notes(page: Page, id: number) {
  const details = page.locator('.personal-notes');
  if (!await details.evaluate(element => (element as HTMLDetailsElement).open)) await details.locator(':scope > summary').click();
  return page.getByLabel(`Личные заметки к уроку ${id}`);
}
async function saved(page: Page) { await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте'); }

test('регистрация доступна на узком экране, проверяет пароли и начинает с полноценного урока 1', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Создай свой аккаунт', exact: true })).toBeVisible();
  await mkdir('docs/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/screenshots/desktop-registration.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: 'docs/screenshots/mobile-registration.png', fullPage: true });
  const accountName = username();
  await page.getByLabel('Как тебя называть').fill('Начинающий');
  await page.getByLabel('Логин', { exact: true }).fill(accountName);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByLabel('Повтори пароль').fill(`${password}-different`);
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Пароли не совпадают.');
  expect((await session(context)).user).toBeNull();
  await page.getByLabel('Повтори пароль').fill(password);
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^По шагам/ })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/mobile-lesson1.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const account = await session(context);
  expect(account.user.username).toBe(accountName);
  expect(account.progress.lastLesson).toBe(1);
  expect(account.progress.lessons[1].status).toBe('in_progress');
  expect(account.progress.lessons[1].historicalPassed).toBe(false);
  for (let id = 2; id <= 9; id++) expect(account.progress.lessons[id].status).toBe('not_started');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
});

test('явный перенос сохраняет историю Hiraoka, заметки и исходную браузерную копию', async ({ page, context }) => {
  const legacy = initialProgress('historical');
  legacy.lessons[9].notes = 'Моя прежняя попытка с showTip';
  const original = JSON.stringify(legacy);
  await page.addInitScript(({ key, raw }) => { localStorage.setItem(key, raw); }, { key: STORAGE_KEY, raw: original });
  await page.goto('/');
  await expect(page.getByLabel('Перенести мой текущий прогресс')).toBeChecked();
  await expect(page.getByLabel('Как тебя называть')).toHaveValue('Hiraoka');
  await register(page, username(), 'Hiraoka');
  await expect(page.getByRole('heading', { level: 1, name: /^9\. Функции/ })).toBeVisible();
  await expect(await notes(page, 9)).toHaveValue(legacy.lessons[9].notes);
  const account = await session(context);
  for (let id = 1; id <= 8; id++) {
    expect(account.progress.lessons[id].status).toBe('passed');
    expect(account.progress.lessons[id].historicalPassed).toBe(true);
  }
  expect(account.progress.lessons[9].status).toBe('in_progress');
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
});

test('выход, повторный вход и второй профиль сохраняют отдельные данные', async ({ page, context }) => {
  const first = username();
  await page.goto('/');
  await register(page, first, 'Первый ученик');
  await expect(page.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
  await (await notes(page, 1)).fill('Личные заметки первого профиля');
  await saved(page);
  await page.getByRole('button', { name: 'Открыть мой аккаунт', exact: true }).click();
  await page.getByRole('dialog', { name: 'Мой аккаунт' }).getByRole('button', { name: 'Выйти из аккаунта', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Создай свой аккаунт', exact: true })).toBeVisible();
  expect((await session(context)).user).toBeNull();
  await register(page, username(), 'Второй ученик');
  await expect(page.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
  await expect(await notes(page, 1)).toHaveValue('');
  await page.getByRole('button', { name: 'Открыть мой аккаунт', exact: true }).click();
  await page.getByRole('dialog', { name: 'Мой аккаунт' }).getByRole('button', { name: 'Выйти из аккаунта', exact: true }).click();
  await login(page, first);
  await expect(page.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
  await expect(await notes(page, 1)).toHaveValue('Личные заметки первого профиля');
});

test('новое устройство получает заметки с сервера после входа в тот же аккаунт', async ({ page, browser, baseURL }) => {
  const name = username();
  await page.goto('/');
  await register(page, name);
  await expect(page.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
  await (await notes(page, 1)).fill('Синхронизация между независимыми устройствами');
  await saved(page);
  const second = await browser.newContext({ baseURL });
  try {
    const otherPage = await second.newPage();
    await login(otherPage, name);
    await expect(otherPage.getByRole('heading', { level: 1, name: /^1\./ })).toBeVisible();
    await expect(await notes(otherPage, 1)).toHaveValue('Синхронизация между независимыми устройствами');
    await (await notes(otherPage, 1)).fill('Изменено на втором устройстве');
    await saved(otherPage);
    await page.reload();
    await expect(await notes(page, 1)).toHaveValue('Изменено на втором устройстве');
  } finally { await second.close(); }
});
