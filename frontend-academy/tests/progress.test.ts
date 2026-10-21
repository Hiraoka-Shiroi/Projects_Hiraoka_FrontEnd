import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress, passProblem, prerequisiteProblem, safeLink } from '../src/lib/progress';
import { parseProgress, loadProgress, saveProgress, STORAGE_KEY } from '../src/lib/storage';
import { taskIds } from '../src/data/course';

test('historical progress is preserved without inventing assessments', () => {
  const progress = initialProgress();
  for (let id = 1; id <= 8; id++) { assert.equal(progress.lessons[id].status, 'passed'); assert.equal(progress.lessons[id].mastery, 0); assert.deepEqual(progress.lessons[id].reviews, []); }
  assert.equal(progress.lastLesson, 9); assert.equal(progress.lessons[9].status, 'in_progress');
  assert.equal(progress.lessons[10].status, 'not_started');
  assert.match(prerequisiteProblem(10, progress)!, /9/);
});
test('a fresh beginner keeps lessons 1–8 unpassed and cannot bypass their practice gates', () => {
  const progress = parseProgress(JSON.stringify(initialProgress('beginner')));
  assert.equal(progress.lastLesson, 1);
  for (let id = 1; id <= 8; id++) { assert.equal(progress.lessons[id].historicalPassed, false); assert.equal(progress.lessons[id].mastery, 0); }
  assert.equal(progress.lessons[1].status, 'in_progress');
  assert.equal(progress.lessons[2].status, 'not_started');
  assert.match(prerequisiteProblem(2, progress)!, /1/);
  progress.lessons[1].status = 'passed';
  assert.throws(() => parseProgress(JSON.stringify(progress)), /Урок 1.*без критериев/);
});
test('backup roundtrip retains Cyrillic notes, checklists, links and reviews', () => {
  const progress = initialProgress();
  progress.lessons[9].notes = 'Я понял параметры 🎯'; progress.lessons[9].completedTasks = ['9-1'];
  progress.projects['js-lab'].repo = 'https://github.com/example/academy';
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
});
test('lesson 9 needs all practice, evidence and independent accepted review', () => {
  const record = initialProgress().lessons[9];
  assert.ok(passProblem(9, record));
  record.completedTasks = taskIds(9); assert.match(passProblem(9, record)!, /доказательство/);
  record.evidence = 'Самостоятельный файл, границы0 и50, выводы проверены'; assert.match(passProblem(9, record)!, /ревью/);
  record.reviews = [{ id: 'review-1', date: '2026-10-12', verdict: 'accepted', independent: false, explanation: 'Код работает', corrections: '' }];
  assert.ok(passProblem(9, record)); record.reviews[0].independent = true; assert.equal(passProblem(9, record), null);
});
test('imports cannot claim passed or assessed skills without evidence', () => {
  const progress = initialProgress(); progress.lessons[9].status = 'passed';
  assert.throws(() => parseProgress(JSON.stringify(progress)), /без критериев/);
  progress.lessons[9].status = 'in_progress'; progress.lessons[9].mastery = 1;
  assert.throws(() => parseProgress(JSON.stringify(progress)), /нет доказательств/);
  progress.lessons[9].evidence = 'Только пример'; progress.lessons[9].mastery = 3;
  assert.throws(() => parseProgress(JSON.stringify(progress)), /Нет самостоятельного/);
});
test('new revision supersedes earlier accepted review', () => {
  const progress = initialProgress(); const record = progress.lessons[9];
  record.completedTasks = taskIds(9); record.evidence = 'Самостоятельная практика и проверки';
  record.reviews = [{ id: 'accepted', date: '2026-10-12', verdict: 'accepted', independent: true, explanation: 'Принято', corrections: '' }];
  assert.equal(passProblem(9, record), null);
  record.reviews.push({ id: 'revision', date: '2026-10-12', verdict: 'revise', independent: true, explanation: 'Обнаружена ошибка на границе', corrections: 'Исправить условие' });
  assert.ok(passProblem(9, record)); record.status = 'passed';
  assert.throws(() => parseProgress(JSON.stringify(progress)), /без критериев/);
});
test('future continuation, skipped prerequisites and project-free level 4 reject', () => {
  const progress = initialProgress(); progress.lastLesson = 200;
  assert.throws(() => parseProgress(JSON.stringify(progress)), /будущий урок/);
  progress.lastLesson = 9; const record = progress.lessons[10];
  record.completedTasks = taskIds(10); record.evidence = 'Код и проверки'; record.status = 'passed';
  record.reviews = [{ id: 'r', date: '2026-10-12', verdict: 'accepted', independent: true, explanation: 'Принято', corrections: '' }];
  assert.throws(() => parseProgress(JSON.stringify(progress)), /предварительных/);
  record.status = 'not_started'; record.mastery = 4;
  assert.throws(() => parseProgress(JSON.stringify(progress)), /уровня 4/);
  record.projectEvidence = 'Проект planner: изоляция функций; сравнение вариантов и границы';
  assert.equal(parseProgress(JSON.stringify(progress)).lessons[10].mastery, 4);
});
test('malformed backups, future schemas and invalid fields reject atomically', () => {
  assert.throws(() => parseProgress('{bad'), /JSON/);
  const mutate = (fn: (value: Record<string, any>) => void) => { const value = JSON.parse(JSON.stringify(initialProgress())); fn(value); return JSON.stringify(value); };
  const cases = [
    mutate(value => { value.schemaVersion = 2; }), mutate(value => { value.lastLesson = 900; }),
    mutate(value => { delete value.lessons['9']; }), mutate(value => { value.lessons['9'].status = 'invented'; }),
    mutate(value => { value.lessons['9'].notes = null; }), mutate(value => { value.lessons['9'].completedTasks = ['9-1', '9-1']; }),
    mutate(value => { value.lessons['9'].completedTasks = ['fake']; }), mutate(value => { value.lessons['9'].repeatOn = '2026-02-30'; }),
    mutate(value => { value.projects['js-lab'].active = 'yes'; }), mutate(value => { value.projects['js-lab'].checked = ['nonexistent']; }),
  ];
  for (const raw of cases) assert.throws(() => parseProgress(raw));
});
test('corrupt storage is retained and automatic writes are blocked', () => {
  const raw = '{broken original record'; let reads = 0;
  const loaded = loadProgress({ getItem: key => { assert.equal(key, STORAGE_KEY); reads++; return raw; } });
  assert.equal(reads, 1); assert.equal(loaded.writable, false); assert.equal(loaded.damagedRaw, raw); assert.match(loaded.error, /Исходная запись сохранена/);
});
test('unavailable storage and quota errors surface instead of reporting a save', () => {
  const loaded = loadProgress({ getItem: () => { throw new Error('Denied'); } }); assert.equal(loaded.writable, false);
  assert.throws(() => saveProgress({ setItem: () => { throw new Error('Quota'); } }, initialProgress()), /Quota/);
});
test('export/import parsing preserves original object and strips unknown top-level keys', () => {
  const progress = initialProgress(); const original = JSON.stringify(progress);
  const raw = JSON.stringify({ ...progress, '__proto__': { injected: true }, unwanted: 'ignored' });
  const parsed = parseProgress(raw); assert.equal(JSON.stringify(progress), original); assert.equal(Object.hasOwn(parsed, 'unwanted'), false);
  assert.equal(Object.hasOwn(parsed, 'injected'), false);
});
test('project links only allow full HTTP and HTTPS URLs', () => {
  assert.equal(safeLink('javascript:alert(1)'), undefined); assert.equal(safeLink('data:text/html,hello'), undefined);
  assert.equal(safeLink('file:///tmp/secret'), undefined); assert.equal(safeLink('relative'), undefined);
  assert.equal(safeLink('https://github.com/example/repo'), 'https://github.com/example/repo');
});
