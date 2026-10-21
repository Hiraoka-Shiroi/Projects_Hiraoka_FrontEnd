import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { lessonGuides } from '../src/data/guides';
import { initialProgress } from '../src/lib/progress';
import { parseProgress } from '../src/lib/storage';

test('six small steps have honest runnable output and no future syntax', () => {
  const steps = lessonGuides[9]; assert.equal(steps.length, 6);
  assert.equal(new Set(steps.map(step => step.id)).size, 6);
  for (const step of steps) {
    assert.ok(step.text.length <= 350 && step.tryIt && step.question && step.trace.length >= 2);
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', step.code], { encoding: 'utf8' }).trim().replaceAll('\r\n', '\n');
    assert.equal(output, step.result, step.id);
    assert.ok(!/=>|\basync\b|\bawait\b|\beval\b/.test(step.code));
  }
});
test('old progress gains reading defaults without losing notes, tasks or history', () => {
  const original = initialProgress(); original.lessons[9].notes = 'Мои старые заметки';
  original.lessons[9].completedTasks = ['9-1'];
  const input = structuredClone(original);
  for (const record of Object.values(input.lessons)) { delete record.readingMode; delete record.readingStep; delete record.stepDrafts; }
  const restored = parseProgress(JSON.stringify(input));
  assert.equal(restored.lessons[9].notes, 'Мои старые заметки');
  assert.deepEqual(restored.lessons[9].completedTasks, ['9-1']);
  assert.equal(restored.lessons[9].readingMode, 'guided');
  assert.equal(restored.lessons[9].status, 'in_progress');
});
test('step drafts and position survive JSON export; invalid pointers reject', () => {
  const value = initialProgress(); value.lessons[9].readingStep = 2;
  value.lessons[9].stepDrafts = { call: 'showTip();' };
  assert.deepEqual(parseProgress(JSON.stringify(value)), value);
  value.lessons[9].readingStep = 6; assert.throws(() => parseProgress(JSON.stringify(value)), /шаг чтения/);
  value.lessons[9].readingStep = 0; value.lessons[9].stepDrafts = { missing: 'bad' }; assert.throws(() => parseProgress(JSON.stringify(value)), /черновики/);
});
test('coerced enum fields and duplicate review IDs cannot corrupt the UI', () => {
  const input = JSON.parse(JSON.stringify(initialProgress()));
  input.lessons['9'].status = ['in_progress']; assert.throws(() => parseProgress(JSON.stringify(input)));
  input.lessons['9'].status = 'in_progress'; input.lessons['9'].readingMode = ['guided']; assert.throws(() => parseProgress(JSON.stringify(input)));
  input.lessons['9'].readingMode = 'guided';
  const review = { id: 'duplicate', date: '2026-10-12', verdict: 'revise', independent: false, explanation: 'Нужна проверка', corrections: '' };
  input.lessons['9'].reviews = [review, review]; assert.throws(() => parseProgress(JSON.stringify(input)), /Повторные/);
});
