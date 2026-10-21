import { test as base, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { initialProgress } from '../src/lib/progress';
import type { AccountSession } from '../src/lib/api';

type Fixtures = { account: AccountSession };
// Every UI test receives its own account in the isolated test database on port 4175.
// The legacy localStorage key is deliberately left untouched for migration coverage.
export const test = base.extend<Fixtures>({
  request: async ({ context }, use) => { await use(context.request); },
  account: [async ({ request, baseURL }, use) => {
    if (baseURL !== 'http://127.0.0.1:4175') throw new Error('Browser tests must use isolated port 4175.');
    const response = await request.post('/api/auth/register', {
      headers: { Origin: baseURL },
      data: { username: `test_${randomUUID().replaceAll('-', '').slice(0, 24)}`, name: 'Тестовый ученик', password: 'Isolated-test-password-123!', progress: initialProgress('historical') },
    });
    expect(response.status()).toBe(201);
    await use(await response.json() as AccountSession);
  }, { auto: true }],
});
export { expect };
export type { Page };
export async function accountCache(page: Page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find(item => /^frontend-academy\.account\.[\w-]+\.progress\.v1$/.test(item));
    if (!key) throw new Error('Account cache not found.');
    return JSON.parse(localStorage.getItem(key)!);
  });
}
export async function waitForAccountSave(page: Page) {
  await expect(page.locator('.save-state')).toContainText('Сохранено в аккаунте');
}
