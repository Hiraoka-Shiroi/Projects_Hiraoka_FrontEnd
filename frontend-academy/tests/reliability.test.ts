import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress } from '../src/lib/progress';
import { serializeProgress, parseProgress, MAX_BACKUP_BYTES } from '../src/lib/storage';
import { parseRoute } from '../src/lib/routes';
import { buildReviewBundle } from '../src/lib/reviewBundle';

test('large valid backup can always be imported after export', () => {
  const value = initialProgress();
  const encoder = new TextEncoder(); const target = MAX_BACKUP_BYTES - 1000;
  for (let id = 1; id <= 220; id++) {
    const size = encoder.encode(JSON.stringify(value)).byteLength;
    if (size >= target) break;
    const previous = encoder.encode(JSON.stringify(value.lessons[id].notes)).byteLength - 2;
    value.lessons[id].notes = 'x'.repeat(Math.min(100_000, target - size + previous));
  }
  assert.ok(encoder.encode(JSON.stringify(value, null, 2)).byteLength > MAX_BACKUP_BYTES);
  const raw = serializeProgress(value);
  assert.ok(encoder.encode(raw).byteLength <= MAX_BACKUP_BYTES);
  assert.deepEqual(parseProgress(raw), value);
});
test('direct routes identify the actual project and reject malformed lesson numbers', () => {
  assert.equal(parseRoute('#projects/admin', 9).projectId, 'admin');
  assert.equal(parseRoute('#projects/interactive', 9).projectId, 'interactive');
  assert.equal(parseRoute('#lesson/8', 9).id, 8);
  for (const hash of ['#lesson/900', '#lesson/0x9', '#lesson/nope']) { const route = parseRoute(hash, 9); assert.equal(route.id, 9); assert.ok(route.warning); }
  assert.ok(parseRoute('#projects/missing', 9).warning);
});
test('self-check results roundtrip without claiming mastery or completion', () => {
  const value = initialProgress(); value.lessons[9].selfChecks = { call: { selected: 0, attempts: 2 } };
  const restored = parseProgress(serializeProgress(value));
  assert.equal(restored.lessons[9].status, 'in_progress'); assert.equal(restored.lessons[9].mastery, 0);
  assert.deepEqual(restored.lessons[9].selfChecks, value.lessons[9].selfChecks);
  value.lessons[9].selfChecks.call.selected = 8;
  assert.throws(() => parseProgress(JSON.stringify(value)), /самопроверки/);
});
test('review handoff contains learner drafts and does not inject exercise solutions', () => {
  const record = initialProgress().lessons[9]; record.stepDrafts = { call: 'showTip();' }; record.notes = 'Не понял return';
  const bundle = buildReviewBundle(9, record);
  assert.ok(bundle.includes('showTip();') && bundle.includes('Не понял return'));
  assert.ok(!bundle.includes('return first * second'));
  assert.ok(bundle.includes('не заменяют ревью'));
});
