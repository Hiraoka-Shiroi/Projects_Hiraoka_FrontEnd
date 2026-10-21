import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessons, stages, projects, contents, taskIds } from '../src/data/course';
import { lessonGuides } from '../src/data/guides';
import { runInNewContext } from 'node:vm';

test('course has 220 stable numbers, all A–O stages and resolvable earlier dependencies', () => {
  assert.equal(lessons.length, 220); assert.deepEqual(stages.map(item => item.id), 'ABCDEFGHIJKLMNO'.split(''));
  assert.deepEqual(lessons.map(item => item.id), Array.from({ length: 220 }, (_, i) => i + 1));
  for (const lesson of lessons) {
    assert.ok(stages.some(stage => stage.id === lesson.stage));
    assert.ok(lesson.goal.trim().length > 20 && lesson.outcome.trim().length > 20);
    assert.ok(lesson.concepts.length >= 1 && lesson.completion.length >= 2);
    assert.equal(new Set(lesson.prerequisites).size, lesson.prerequisites.length);
    for (const previous of lesson.prerequisites) assert.ok(previous > 0 && previous < lesson.id && lessons.some(item => item.id === previous));
  }
  assert.match(lessons[1].title, /Арифмет/i); assert.match(lessons[2].title, /Типы/i);
  assert.match(lessons[8].title, /Функц/i); assert.match(lessons[9].title, /видим/i); assert.match(lessons[10].title, /стрелоч/i);
});
test('all project briefs have scenarios, acceptance, architecture and verification', () => {
  assert.equal(projects.length, 12); assert.equal(new Set(projects.map(item => item.id)).size, projects.length);
  for (const project of projects) {
    for (const key of ['requirements', 'scenarios', 'acceptance', 'steps', 'skills', 'checks', 'readme', 'demo', 'quality', 'extensions'] as const) assert.ok(project[key].length >= 2, `${project.id}.${key}`);
    assert.ok(project.summary && project.architecture && project.deployment);
    for (const id of project.lessons) assert.ok(lessons.some(item => item.id === id));
  }
  for (const stage of stages) for (const id of stage.projectIds) assert.ok(projects.some(project => project.id === id));
});
test('lessons 1–9 have complete teaching material and stable unique assignment IDs', () => {
  assert.deepEqual(Object.keys(contents), Array.from({ length: 9 }, (_, index) => String(index + 1)));
  for (let id = 1; id <= 9; id++) {
    const content = contents[id];
    assert.equal(content.id, id);
    assert.ok(content.sections.length >= 5 && content.exercises.length >= 4 && content.questions.length >= 3, `Lesson ${id} is incomplete`);
    assert.equal(new Set(taskIds(id)).size, taskIds(id).length);
    assert.match(content.reviewPolicy, /провер|ревью/i);
    if (id <= 8) assert.deepEqual(content.checklist, lessons[id - 1].completion, `Lesson ${id} criteria must preserve task meaning`);
  }
  const lesson = contents[9]; assert.equal(lesson.id, 9); assert.equal(lesson.exercises.length, 8);
  assert.ok(lesson.sections.length >= 10 && lesson.checklist.length >= 5 && lesson.questions.length >= 5);
});
test('every short lesson demonstrates the actual JavaScript output promised to the learner', () => {
  assert.deepEqual(Object.keys(lessonGuides), Object.keys(contents));
  for (const [id, steps] of Object.entries(lessonGuides)) {
    assert.ok(steps.length >= 4, `Lesson ${id} needs short steps`);
    assert.equal(new Set(steps.map(step => step.id)).size, steps.length);
    for (const step of steps) {
      assert.ok(step.text.length <= 500 && step.tryIt && step.question && step.trace.length, `${id}/${step.id} must remain short and actionable`);
      const output: string[] = [];
      runInNewContext(step.code, { console: { log: (...values: unknown[]) => output.push(values.map(String).join(' ')) } }, { timeout: 1000 });
      assert.equal(output.join('\n'), step.result, `${id}/${step.id}: displayed result differs from JavaScript execution`);
      if (Number(id) <= 8) assert.doesNotMatch(step.code, /\bfunction\b|\breturn\b|=>|\bfor\s*\(|\bwhile\s*\(/, `${id}/${step.id} introduces later syntax`);
    }
  }
});
