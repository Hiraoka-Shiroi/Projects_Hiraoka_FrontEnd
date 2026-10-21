import { lessons, projects, taskIds, getLesson } from '../data/course';
import type { AcademyProgress, LessonProgress, LessonStatus, ProjectProgress } from '../types';

export const statusLabels: Record<LessonStatus, string> = {
  not_started: 'Не начат', in_progress: 'В процессе', awaiting_review: 'Ожидает проверки',
  passed: 'Пройден', repeat: 'Нужно повторить',
};
export const masteryLabels = ['Не оценён', 'Знакомство', 'Базовое понимание', 'Самостоятельное применение', 'Уверенное применение'];
export function blankLesson(): LessonProgress {
  return { status: 'not_started', notes: '', completedTasks: [], mastery: 0, evidence: '', projectEvidence: '', weakPoints: '', repeatOn: '', reviews: [], readingMode: 'guided', readingStep: 0, stepDrafts: {} };
}
export function blankProject(): ProjectProgress {
  return { checked: [], repo: '', demo: '', notes: '', review: '', active: false };
}
export function initialProgress(mode: 'historical' | 'beginner' = 'historical'): AcademyProgress {
  const historical = mode === 'historical';
  return {
    schemaVersion: 1, updatedAt: new Date().toISOString(), lastLesson: historical ? 9 : 1,
    goals: historical ? 'Самостоятельно решить практику урока 9 и объяснить разницу между return и console.log.' : 'Понять let и const, написать свою первую практику и объяснить результат.',
    lessons: Object.fromEntries(lessons.map(lesson => [String(lesson.id), {
      ...blankLesson(), status: historical && lesson.id <= 8 ? 'passed' : lesson.id === (historical ? 9 : 1) ? 'in_progress' : 'not_started',
      historicalPassed: historical && lesson.id <= 8,
      notes: historical && lesson.id <= 8 ? 'Пройден ранее по сообщению ученика. Новый экзамен не проводился; исходный конспект находится в папке Frontend.' : '',
    }])),
    projects: Object.fromEntries(projects.map(project => [project.id, blankProject()])),
  };
}
export function passProblem(id: number, record: LessonProgress): string | null {
  if (!taskIds(id).every(task => record.completedTasks.includes(task))) return 'Завершите практику и отметьте критерии освоения.';
  if (!record.evidence.trim()) return 'Добавьте доказательство: код, результаты запусков и объяснение крайних случаев.';
  if (!acceptedLatestReview(record))
    return 'Нужна запись принятого ревью самостоятельного решения с объяснением. Отметка в приложении сама по себе не проверяет знания.';
  return null;
}
export function acceptedLatestReview(record: LessonProgress): boolean {
  const latest = record.reviews.at(-1);
  return !!latest && latest.verdict === 'accepted' && latest.independent && !!latest.explanation.trim();
}
export function prerequisiteProblem(id: number, progress: AcademyProgress): string | null {
  const missing = getLesson(id).prerequisites.filter(number => progress.lessons[String(number)].status !== 'passed');
  return missing.length ? `Сначала закрепите предварительные уроки: ${missing.join(', ')}.` : null;
}
export function todayTashkent(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tashkent' }).format(new Date());
}
export function safeLink(value: string): string | undefined {
  if (!value.trim()) return undefined;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
