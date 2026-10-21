import { lessons, projects, taskIds, contents } from '../data/course';
import { lessonGuides } from '../data/guides';
import { selfChecks } from '../data/selfChecks';
import { initialProgress, statusLabels, passProblem, acceptedLatestReview } from './progress';
import type { AcademyProgress, LessonProgress, ProjectProgress, ReviewRecord } from '../types';

export const STORAGE_KEY = 'frontend-academy.progress.v1';
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
type JsonObject = Record<string, unknown>;
function object(value: unknown): value is JsonObject { return !!value && typeof value === 'object' && !Array.isArray(value); }
function fail(message: string): never { throw new Error(message); }
function string(value: unknown, label: string): string {
  return typeof value === 'string' && value.length <= 100_000 ? value : fail(`Некорректное текстовое поле: ${label}.`);
}
function list(value: unknown, allowed: string[], label: string): string[] {
  if (!Array.isArray(value) || value.length > allowed.length || !value.every(item => typeof item === 'string' && allowed.includes(item)) || new Set(value).size !== value.length)
    fail(`Некорректный чек-лист: ${label}.`);
  return [...value] as string[];
}
function dateOnly(value: unknown, empty = true): string {
  const text = string(value, 'дата');
  if (empty && text === '') return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text) fail('Некорректная дата.');
  return text;
}
function review(value: unknown): ReviewRecord {
  if (!object(value) || typeof value.independent !== 'boolean' || typeof value.verdict !== 'string' || !['accepted', 'revise'].includes(value.verdict)) fail('Некорректная запись ревью.');
  if (typeof value.id !== 'string' || !value.id.trim()) fail('Некорректный идентификатор ревью.');
  return {
    id: string(value.id, 'id ревью'), date: dateOnly(value.date, false), verdict: value.verdict as ReviewRecord['verdict'],
    independent: value.independent, explanation: string(value.explanation, 'ревью'), corrections: string(value.corrections, 'замечания'),
  };
}
export function parseProgress(raw: string): AcademyProgress {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) fail('Файл превышает 5 МБ.');
  let input: unknown;
  try { input = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { fail('Файл не является корректным JSON.'); }
  if (!object(input) || input.schemaVersion !== 1 || !object(input.lessons) || !object(input.projects)) fail('Неподдерживаемая структура или версия резервной копии.');
  if (typeof input.lastLesson !== 'number' || !lessons.some(item => item.id === input.lastLesson)) fail('Некорректный последний урок.');
  if (input.lastLesson >= 9 && !contents[input.lastLesson]) fail('Последнее место указывает на будущий урок без подробного материала. Продолжение обучения сейчас — урок 9.');
  const updatedAt = string(input.updatedAt, 'время обновления');
  if (Number.isNaN(Date.parse(updatedAt))) fail('Некорректное время обновления.');
  if (Object.keys(input.lessons).length !== lessons.length || Object.keys(input.projects).length !== projects.length) fail('Резервная копия не соответствует этой карте курса.');
  const lessonRecords: Record<string, LessonProgress> = {};
  for (const lesson of lessons) {
    const value = input.lessons[String(lesson.id)];
    if (!object(value) || typeof value.status !== 'string' || !Object.hasOwn(statusLabels, value.status) || !Number.isInteger(value.mastery) || Number(value.mastery) < 0 || Number(value.mastery) > 4 || !Array.isArray(value.reviews) || value.reviews.length > 1000) fail(`Некорректные данные урока ${lesson.id}.`);
    const record: LessonProgress = {
      status: value.status as LessonProgress['status'], notes: string(value.notes, 'заметки'),
      completedTasks: list(value.completedTasks, taskIds(lesson.id), `урок ${lesson.id}`),
      mastery: value.mastery as LessonProgress['mastery'], evidence: string(value.evidence, 'доказательства'),
      projectEvidence: value.projectEvidence === undefined ? '' : string(value.projectEvidence, 'применение в проекте'),
      weakPoints: string(value.weakPoints, 'пробелы'), repeatOn: dateOnly(value.repeatOn), reviews: value.reviews.map(review),
    };
    if (value.historicalPassed !== undefined && typeof value.historicalPassed !== 'boolean') fail('Некорректная история прохождения.');
    record.historicalPassed = lesson.id <= 8 && (value.historicalPassed === undefined ? true : value.historicalPassed);
    if (value.bookmarked !== undefined) {
      if (typeof value.bookmarked !== 'boolean') fail('Некорректная закладка.');
      record.bookmarked = value.bookmarked;
    }
    const guides = lessonGuides[lesson.id] ?? [];
    const readingMode = value.readingMode === undefined ? 'guided' : value.readingMode;
    const readingStep = value.readingStep === undefined ? 0 : value.readingStep;
    if (typeof readingMode !== 'string' || !['guided', 'practice', 'reference'].includes(readingMode) || !Number.isInteger(readingStep) || Number(readingStep) < 0 || Number(readingStep) >= Math.max(1, guides.length)) fail(`Некорректный шаг чтения урока ${lesson.id}.`);
    const drafts = value.stepDrafts === undefined ? {} : value.stepDrafts;
    if (!object(drafts) || Object.keys(drafts).some(id => !guides.some(step => step.id === id))) fail(`Некорректные черновики урока ${lesson.id}.`);
    record.readingMode = readingMode as LessonProgress['readingMode'];
    record.readingStep = readingStep as number;
    record.stepDrafts = Object.fromEntries(Object.entries(drafts).map(([id, text]) => [id, string(text, 'попытка мини-задания')]));
    if (value.selfChecks !== undefined) {
      if (!object(value.selfChecks)) fail(`Некорректные самопроверки урока ${lesson.id}.`);
      const definitions = selfChecks[lesson.id] ?? {};
      record.selfChecks = Object.fromEntries(Object.entries(value.selfChecks).map(([id, item]) => {
        if (!Object.hasOwn(definitions, id) || !object(item) || typeof item.selected !== 'number' || !Number.isInteger(item.selected) || item.selected < 0 || item.selected >= definitions[id].options.length || typeof item.attempts !== 'number' || !Number.isInteger(item.attempts) || item.attempts < 1 || item.attempts > 1000) fail(`Некорректный ответ самопроверки ${id}.`);
        return [id, { selected: item.selected, attempts: item.attempts }];
      }));
    }
    if (new Set(record.reviews.map(item => item.id)).size !== record.reviews.length) fail(`Повторные идентификаторы ревью урока ${lesson.id}.`);
    if (record.mastery > 0 && !record.evidence.trim()) fail(`Для уровня освоения урока ${lesson.id} нет доказательств.`);
    if (record.mastery >= 3 && !acceptedLatestReview(record)) fail(`Нет самостоятельного актуального принятого ревью урока ${lesson.id}.`);
    if (record.mastery === 4 && !record.projectEvidence.trim()) fail(`Для уровня 4 урока ${lesson.id} нужно доказательство применения в проекте и объяснение компромиссов.`);
    if (!record.historicalPassed && record.status === 'passed' && passProblem(lesson.id, record)) fail(`Урок ${lesson.id} отмечен пройденным без критериев проверки.`);
    if (!record.historicalPassed && record.status === 'passed') {
      const missing = lesson.prerequisites.filter(id => {
        const previous = lessonRecords[String(id)];
        return !previous || (previous.status !== 'passed' && !previous.reviews.some(item => item.verdict === 'accepted' && item.independent && item.explanation.trim()));
      });
      if (missing.length) fail(`Урок ${lesson.id} закрыт без подтверждённых предварительных уроков: ${missing.join(', ')}.`);
    }
    lessonRecords[String(lesson.id)] = record;
  }
  const projectRecords: Record<string, ProjectProgress> = {};
  for (const project of projects) {
    const value = input.projects[project.id];
    if (!object(value) || typeof value.active !== 'boolean') fail(`Некорректные данные проекта ${project.id}.`);
    projectRecords[project.id] = {
      checked: list(value.checked, project.acceptance.map((_, i) => `accept-${i}`), project.id),
      repo: string(value.repo, 'репозиторий'), demo: string(value.demo, 'демо'),
      notes: string(value.notes, 'проект'), review: string(value.review, 'ревью проекта'), active: value.active,
    };
  }
  return { schemaVersion: 1, updatedAt, lastLesson: input.lastLesson, goals: string(input.goals, 'цели'), lessons: lessonRecords, projects: projectRecords };
}
export function loadProgress(storage: Pick<Storage, 'getItem'>): { progress: AcademyProgress; error: string; damagedRaw?: string; writable: boolean } {
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
    return { progress: raw === null ? initialProgress() : parseProgress(raw), error: '', writable: true };
  } catch (error) {
    return { progress: initialProgress(), error: `Сохранённые данные не загружены: ${error instanceof Error ? error.message : 'хранилище недоступно'} Исходная запись сохранена. Экспортируйте её и импортируйте исправленную копию.`, damagedRaw: raw ?? undefined, writable: false };
  }
}
export function saveProgress(storage: Pick<Storage, 'setItem'>, progress: AcademyProgress): void {
  storage.setItem(STORAGE_KEY, serializeProgress(progress));
}
export function serializeProgress(progress: AcademyProgress): string {
  const raw = JSON.stringify(progress);
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) fail('Прогресс превышает 5 МБ. Сократите текстовые поля перед экспортом.');
  return raw;
}
export function downloadText(filename: string, text: string, mimeType = 'application/json;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
