import { test, expect, type Page } from './fixtures';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Every test uses an isolated browser context. These records never enter the learner's browser.
async function openNavigation(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('button', { name, exact: true }).click();
}

async function openLesson9(page: Page) {
  await page.goto('/#lesson/9');
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeVisible();
  await page.getByRole('button', { name: /^Все задания/ }).click();
  await page.getByRole('button', { name: 'Развернуть все задачи', exact: true }).click();
  await expandWorkspace(page);
}

async function expandWorkspace(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const selector of ['.review-workspace', '.personal-notes']) {
    const details = page.locator(selector);
    if (await details.count() && !await details.evaluate(element => (element as HTMLDetailsElement).open)) {
      await details.locator(':scope > summary').click();
    }
  }
}
async function saveAcceptedReview(page: Page) {
  await page.getByText('Записать результат полученного ревью', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Результат', exact: true }).selectOption('accepted');
  await page.getByLabel('Самостоятельность решения и объяснение проверены').check();
  await page.getByLabel('Итог проверки').fill('Тест интерфейса: самостоятельность, объяснение и крайние случаи приняты.');
  await page.getByRole('button', { name: 'Сохранить ревью', exact: true }).click();
}

test('история 1–8 сохранена, урок 9 в процессе, освоение не выдумано', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Продолжение обучения' })
    .getByText('В процессе', { exact: true })).toBeVisible();
  await openNavigation(page, 'Мой прогресс');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(9);
  for (let index = 0; index < 8; index++) {
    await expect(rows.nth(index).getByText('Пройден', { exact: true })).toBeVisible();
    await expect(rows.nth(index).getByText('Не оценён', { exact: true })).toBeVisible();
  }
  await expect(rows.nth(8).getByText('В процессе', { exact: true })).toBeVisible();
  await expect(page.getByText('Журнал пуст: новых проверенных решений пока нет.', { exact: true })).toBeVisible();
});

test('дорожная карта ищет по навыку, фильтрует этап и статус, открывает урок', async ({ page }) => {
  await page.goto('/#roadmap');
  await expect(page.locator('.lesson-row')).toHaveCount(220);
  await page.getByLabel('Поиск по урокам и навыкам').fill('WebSocket');
  await expect(page.locator('.lesson-row').first()).toBeVisible();
  const matches = await page.locator('.lesson-row').count();
  expect(matches).toBeGreaterThan(0);
  expect(matches).toBeLessThan(220);
  await page.getByLabel('Поиск по урокам и навыкам').fill('');
  await page.getByRole('combobox', { name: 'Этап', exact: true }).selectOption('B');
  await expect(page.locator('.lesson-row')).toHaveCount(20);
  await page.getByRole('combobox', { name: 'Статус', exact: true }).selectOption('passed');
  await expect(page.getByText('По этим условиям уроков нет. Измени запрос или фильтры.', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Этап', exact: true }).selectOption('A');
  await expect(page.locator('.lesson-row')).toHaveCount(8);
  await page.getByRole('combobox', { name: 'Статус', exact: true }).selectOption('in_progress');
  await expect(page.locator('.lesson-row')).toHaveCount(1);
  await page.locator('.lesson-row').click();
  await expect(page).toHaveURL(/#lesson\/9$/);
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeVisible();
  await page.getByRole('button', { name: /^Все задания/ }).click();
  await page.getByRole('button', { name: 'Развернуть все задачи', exact: true }).click();
  await expandWorkspace(page);
});

test('заметки и выполненная практика сохраняются после перезагрузки', async ({ page }) => {
  await openLesson9(page);
  await page.getByLabel('Личные заметки к уроку 9').fill('Тест интерфейса: return передаёт значение вызывающему коду.');
  const exercise = page.getByRole('checkbox', { name: 'Решение написано самостоятельно, проверки выполнены' }).first();
  await exercise.check();
  await page.reload();
  await expandWorkspace(page);
  await expect(page.getByLabel('Личные заметки к уроку 9')).toHaveValue('Тест интерфейса: return передаёт значение вызывающему коду.');
  await expect(page.getByRole('checkbox', { name: 'Решение написано самостоятельно, проверки выполнены' }).first()).toBeChecked();
  await expect(page.getByRole('button', { name: 'Следующий урок →', exact: true })).toBeDisabled();
});

test('приёмка требует практику, доказательства и самостоятельное принятое ревью', async ({ page }) => {
  await openLesson9(page);
  const status = page.getByRole('combobox', { name: 'Статус урока', exact: true });
  await status.selectOption('passed');
  await expect(status).toHaveValue('in_progress');
  await expect(page.getByRole('alert')).toContainText('Завершите практику');
  const required = page.locator('.lesson-reading .checklist input[type="checkbox"]');
  expect(await required.count()).toBeGreaterThan(5);
  for (const checkbox of await required.all()) await checkbox.check();
  await status.selectOption('passed');
  await expect(status).toHaveValue('in_progress');
  await expect(page.getByRole('alert')).toContainText('Добавьте доказательство');
  await page.getByLabel('Доказательства навыка').fill('Тест интерфейса: учебный файл, объяснение return, обычный и граничный запуск.');
  await status.selectOption('passed');
  await expect(status).toHaveValue('in_progress');
  await expect(page.getByRole('alert')).toContainText('Нужна запись принятого ревью');
  await page.getByText('Записать результат полученного ревью', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Результат', exact: true }).selectOption('accepted');
  await page.getByLabel('Самостоятельность решения и объяснение проверены').check();
  await page.getByLabel('Итог проверки').fill('Тест интерфейса: самостоятельность, объяснение и крайние случаи приняты.');
  await page.getByRole('button', { name: 'Сохранить ревью', exact: true }).click();
  await status.selectOption('passed');
  await expect(status).toHaveValue('passed');
  await expect(page.getByRole('button', { name: 'Следующий урок →', exact: true })).toBeEnabled();
  await page.reload();
  await expandWorkspace(page);
  await expect(page.getByRole('combobox', { name: 'Статус урока', exact: true })).toHaveValue('passed');
  await page.getByRole('button', { name: 'Следующий урок →', exact: true }).click();
  await expect(page).toHaveURL(/#lesson\/10$/);
  await expect(page.getByText('План будущего занятия', { exact: true })).toBeVisible();
});

test('экспорт, подтверждение импорта и отклонение повреждённой копии сохраняют данные', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByLabel('Текущие цели').fill('Цель из проверяемой резервной копии');
  await openNavigation(page, 'Мой прогресс');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Экспорт JSON ↓', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/^frontend-academy-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = testInfo.outputPath('exported-progress.json');
  await download.saveAs(backupPath);
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.schemaVersion).toBe(1);
  expect(Object.keys(backup.lessons)).toHaveLength(220);
  expect(Object.keys(backup.projects)).toHaveLength(12);
  expect(backup.lessons['9'].status).toBe('in_progress');
  await openNavigation(page, 'Главная');
  await page.getByLabel('Текущие цели').fill('Существующая цель перед импортом');
  await openNavigation(page, 'Мой прогресс');
  const file = page.getByLabel('Файл резервной копии');
  await file.setInputFiles({ name: 'valid-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  const dialog = page.getByRole('dialog', { name: 'Проверенная резервная копия' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Отмена', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await openNavigation(page, 'Главная');
  await expect(page.getByLabel('Текущие цели')).toHaveValue('Существующая цель перед импортом');
  await openNavigation(page, 'Мой прогресс');
  await file.setInputFiles({ name: 'valid-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Применить импорт', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Резервная копия импортирована.');
  await openNavigation(page, 'Главная');
  await expect(page.getByLabel('Текущие цели')).toHaveValue('Цель из проверяемой резервной копии');
  await openNavigation(page, 'Мой прогресс');
  await file.setInputFiles({ name: 'invalid-version.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...backup, schemaVersion: 99 })) });
  await expect(page.getByRole('alert')).toContainText('Неподдерживаемая структура');
  await expect(dialog).not.toBeVisible();
  await file.setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByRole('alert')).toContainText('не является корректным JSON');
  await file.setInputFiles({ name: 'future-position.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...backup, lastLesson: 117 })) });
  await expect(page.getByRole('alert')).toContainText('будущий урок без подробного материала');
  const invalidDependency = structuredClone(backup);
  const curriculum = JSON.parse(await readFile(resolve('src/data/curriculum.json'), 'utf8'));
  const lesson10 = curriculum.find((lesson: { id: number }) => lesson.id === 10);
  invalidDependency.lessons['10'] = {
    ...invalidDependency.lessons['10'], status: 'passed',
    completedTasks: lesson10.completion.map((_: string, index: number) => `skill-${index}`),
    evidence: 'Тест импорта: критерии заполнены, но урок 9 не принят.',
    reviews: [{ id: 'test-future-review', date: '2026-10-12', verdict: 'accepted', independent: true, explanation: 'Тест проверки зависимости.', corrections: '' }],
  };
  await file.setInputFiles({ name: 'false-prerequisites.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalidDependency)) });
  await expect(page.getByRole('alert')).toContainText('предваритель');
  backup.lessons['9'].status = 'passed';
  await file.setInputFiles({ name: 'false-pass.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByRole('alert')).toContainText('без критериев проверки');
  await openNavigation(page, 'Главная');
  await expect(page.getByLabel('Текущие цели')).toHaveValue('Цель из проверяемой резервной копии');
  await page.reload();
  await expandWorkspace(page);
  await expect(page.getByLabel('Текущие цели')).toHaveValue('Цель из проверяемой резервной копии');
});

test('уровень 4 требует отдельное доказательство применения в проекте', async ({ page }) => {
  await openLesson9(page);
  await page.getByLabel('Доказательства навыка').fill('Тест интерфейса: самостоятельное применение функции проверено.');
  await saveAcceptedReview(page);
  const mastery = page.getByRole('combobox', { name: 'Уровень освоения', exact: true });
  await mastery.selectOption('4');
  await expect(mastery).toHaveValue('0');
  await expect(page.getByRole('alert')).toContainText('доказательство применения в проекте');
  await page.getByLabel('Применение в проекте и компромиссы').fill('Тест интерфейса: js-lab, функция расчёта; выбран return для композиции, проверены ноль и граница.');
  await mastery.selectOption('4');
  await expect(mastery).toHaveValue('4');
  await page.reload();
  await expandWorkspace(page);
  await expect(page.getByRole('combobox', { name: 'Уровень освоения', exact: true })).toHaveValue('4');
});

test('новое ревью с доработкой отменяет прежнюю приёмку и уровень самостоятельности', async ({ page }) => {
  await openLesson9(page);
  for (const checkbox of await page.locator('.lesson-reading .checklist input[type="checkbox"]').all()) await checkbox.check();
  await page.getByLabel('Доказательства навыка').fill('Тест интерфейса: самостоятельное решение и проверки записаны.');
  await saveAcceptedReview(page);
  const status = page.getByRole('combobox', { name: 'Статус урока', exact: true });
  const mastery = page.getByRole('combobox', { name: 'Уровень освоения', exact: true });
  await status.selectOption('passed');
  await mastery.selectOption('3');
  await expect(status).toHaveValue('passed');
  await expect(mastery).toHaveValue('3');
  await page.getByRole('combobox', { name: 'Результат', exact: true }).selectOption('revise');
  await page.getByLabel('Итог проверки').fill('Тест интерфейса: новая проверка выявила обязательную ошибку на границе.');
  await page.getByRole('button', { name: 'Сохранить ревью', exact: true }).click();
  await expect(status).toHaveValue('repeat');
  await expect(mastery).toHaveValue('2');
  await status.selectOption('passed');
  await expect(status).toHaveValue('repeat');
  await expect(page.getByRole('alert')).toContainText('Нужна запись принятого ревью');
  await page.reload();
  await expandWorkspace(page);
  await expect(page.getByRole('combobox', { name: 'Статус урока', exact: true })).toHaveValue('repeat');
  await expect(page.getByRole('combobox', { name: 'Уровень освоения', exact: true })).toHaveValue('2');
});

test('проект сохраняет ссылки, критерии, этапы и результаты ревью', async ({ page }) => {
  await page.goto('/#projects');
  await expect(page.getByRole('navigation', { name: 'Выбор проекта' }).getByRole('button')).toHaveCount(12);
  await page.getByLabel('Проект в работе').check();
  const acceptance = page.locator('.project-detail .checklist input[type="checkbox"]').first();
  await acceptance.check();
  await page.getByLabel('Ссылка на GitHub').fill('https://github.com/example/learning-project');
  await page.getByLabel('Ссылка на демо').fill('https://example.com/learning-demo');
  await page.getByLabel('Рабочие заметки и этапы').fill('Тест интерфейса: сначала контракт, затем проверки.');
  await page.getByLabel('Найденные ошибки и результаты ревью').fill('Тест интерфейса: проверка граничного ввода записана.');
  await page.reload();
  await expandWorkspace(page);
  await expect(page.getByLabel('Проект в работе')).toBeChecked();
  await expect(page.locator('.project-detail .checklist input[type="checkbox"]').first()).toBeChecked();
  await expect(page.getByLabel('Ссылка на GitHub')).toHaveValue('https://github.com/example/learning-project');
  await expect(page.getByRole('link', { name: 'Открыть репозиторий ↗', exact: true })).toHaveAttribute('href', 'https://github.com/example/learning-project');
  await expect(page.getByRole('link', { name: 'Открыть демо ↗', exact: true })).toHaveAttribute('href', 'https://example.com/learning-demo');
  await expect(page.getByLabel('Рабочие заметки и этапы')).toHaveValue('Тест интерфейса: сначала контракт, затем проверки.');
  await expect(page.getByLabel('Найденные ошибки и результаты ревью')).toHaveValue('Тест интерфейса: проверка граничного ввода записана.');
  await page.getByLabel('Ссылка на демо').fill('javascript:alert(1)');
  await expect(page.getByRole('link', { name: 'Открыть демо ↗', exact: true })).toHaveCount(0);
  await expect(page.getByText('Для открываемой ссылки нужен полный адрес с http:// или https://.', { exact: true })).toBeVisible();
});

test('предварительный просмотр будущего урока не заменяет текущее место обучения', async ({ page }) => {
  await openLesson9(page);
  await openNavigation(page, 'Дорожная карта');
  await page.getByRole('combobox', { name: 'Этап', exact: true }).selectOption('G');
  await page.locator('.lesson-row').first().click();
  await expect(page).toHaveURL(/#lesson\/117$/);
  await expect(page.getByText('План будущего занятия', { exact: true })).toBeVisible();
  await openNavigation(page, 'Главная');
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeVisible();
  await page.reload();
  await expandWorkspace(page);
  await page.getByRole('button', { name: 'Продолжить обучение', exact: false }).click();
  await expect(page).toHaveURL(/#lesson\/9$/);
});

test('клавиатура достигает навигации, фокус страницы и якорь конспекта сохраняют урок', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Твоя академия', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Перейти к содержимому', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /frontend/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('button', { name: 'Главная', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Дорожная карта', exact: true })).toBeFocused();
  await openNavigation(page, 'Текущий урок');
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeFocused();
  await page.getByRole('button', { name: /^Справочник/ }).click();
  const contents = page.locator('.contents-nav');
  await contents.getByRole('link').nth(1).click();
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeVisible();
  await expect(page.locator('#section-0')).toBeInViewport();
  await expect(page).toHaveURL(/#lesson\/9$/);
  await page.reload();
  await expandWorkspace(page);
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeVisible();
  await openNavigation(page, 'Дорожная карта');
  await page.goBack();
  await expect(page).toHaveURL(/#lesson\/9$/);
  await expect(page.getByRole('heading', { name: /^9\. Функции/ })).toBeVisible();
  await page.getByRole('button', { name: /^Все задания/ }).click();
  await page.getByRole('button', { name: 'Развернуть все задачи', exact: true }).click();
  await expandWorkspace(page);
});

test('мобильные страницы не создают горизонтальную прокрутку', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const hash of ['dashboard', 'roadmap', 'lesson/9', 'projects', 'report']) {
      await page.goto(`/#${hash}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const sizes = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(sizes.document, `${hash} at ${width}px`).toBeLessThanOrEqual(sizes.viewport + 1);
    }
  }
});

test('сохраняет реальные снимки главной страницы и урока на desktop и mobile', async ({ page }) => {
  const screenshotDir = resolve('docs/screenshots');
  await mkdir(screenshotDir, { recursive: true });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'desktop-dashboard.png'), fullPage: true });
  await page.goto('/#lesson/9');
  await page.getByRole('button', { name: /^По шагам/ }).click();
  await expect(page.getByRole('region', { name: 'Короткий разбор функций' })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'desktop-lesson9.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: resolve(screenshotDir, 'mobile-dashboard.png'), fullPage: true });
  await page.goto('/#lesson/9');
  await page.getByRole('button', { name: /^По шагам/ }).click();
  await expect(page.getByRole('region', { name: 'Короткий разбор функций' })).toBeVisible();
  await page.screenshot({ path: resolve(screenshotDir, 'mobile-lesson9.png'), fullPage: true });
});



