import { getLesson, contents } from '../data/course';
import { lessonGuides } from '../data/guides';
import { statusLabels } from './progress';
import type { LessonProgress } from '../types';
export function buildReviewBundle(id: number, record: LessonProgress): string {
  const lesson = getLesson(id);
  const lines = [`# Урок ${id} — ${lesson.title}`, '', `Статус: ${statusLabels[record.status]}`, '', 'Это мои черновики для обсуждения. Самостоятельные основные решения прикладываю отдельным .js-файлом.', ''];
  for (const step of lessonGuides[id] ?? []) {
    const draft = record.stepDrafts?.[step.id]?.trim();
    if (draft) lines.push(`## ${step.title}`, '', ...draft.split('\n').map(line => `    ${line}`), '');
  }
  if (record.notes) lines.push('## Мои заметки и вопросы', '', record.notes, '');
  if (record.weakPoints) lines.push('## Что пока не получается', '', record.weakPoints, '');
  if (record.evidence) lines.push('## Код и результаты запусков', '', record.evidence, '');
  const exercises = contents[id]?.exercises ?? [];
  lines.push('## Мой чек-лист практики', '', ...exercises.map(item => `- [${record.completedTasks.includes(item.id) ? 'x' : ' '}] ${item.title}`), '', 'Прошу проверить логику, возвращаемые значения и крайние случаи. Самопроверки в интерфейсе не заменяют ревью моего кода.');
  return lines.join('\n');
}
