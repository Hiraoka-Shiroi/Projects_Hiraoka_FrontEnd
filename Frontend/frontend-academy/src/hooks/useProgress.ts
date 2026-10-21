import { useEffect, useRef, useState } from 'react';
import { lessonGuides } from '../data/guides';
import { parseProgress, serializeProgress, MAX_BACKUP_BYTES } from '../lib/storage';
import * as api from '../lib/api';
import type { AcademyProgress, LessonProgress, ProjectProgress } from '../types';

export const accountCacheKey = (id: string) => `frontend-academy.account.${id}.progress.v1`;
interface Cache { progress: AcademyProgress; revision: number; dirty: boolean }
// A request may reach the server even when its response is lost during reload.
function sameLearningData(a: AcademyProgress, b: AcademyProgress) { return JSON.stringify({ ...a, updatedAt: '' }) === JSON.stringify({ ...b, updatedAt: '' }); }
const encoder = new TextEncoder();
const bytes = (value: unknown) => encoder.encode(JSON.stringify(value)).byteLength;
const memberBytes = (key: string, value: unknown) => value === undefined ? 0 : bytes(key) + 2 + bytes(value);
function text(value: unknown): string { if (typeof value !== 'string' || value.length > 100_000) throw new Error('Текст должен содержать не более 100 000 символов.'); return value; }
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
const routineKeys = new Set(['notes', 'weakPoints', 'readingMode', 'readingStep', 'stepDrafts', 'bookmarked']);
const lessonKeys = new Set([...routineKeys, 'status', 'completedTasks', 'mastery', 'evidence', 'projectEvidence', 'repeatOn', 'reviews', 'selfChecks']);
const projectKeys = new Set(['checked', 'repo', 'demo', 'notes', 'review', 'active']);

export function useProgress(session: api.AccountSession) {
  const cacheKey = accountCacheKey(session.user.id);
  const [bootstrap] = useState(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(cacheKey);
      if (raw) {
        const value = JSON.parse(raw) as Cache;
        if (value.dirty === true && Number.isSafeInteger(value.revision) && value.revision >= 0) {
          const cached = parseProgress(JSON.stringify(value.progress));
          if (sameLearningData(cached, session.progress)) return { progress: session.progress, revision: session.revision, dirty: false, conflict: false, blocked: false, raw: undefined as string | undefined, error: '' };
          return { progress: cached, revision: value.revision, dirty: true, conflict: value.revision !== session.revision, blocked: false, raw: undefined as string | undefined, error: value.revision !== session.revision ? 'Есть несинхронизированная копия, а сервер уже содержит другую версию. Скачайте текущую копию или загрузите серверную.' : '' };
        }
      }
      return { progress: session.progress, revision: session.revision, dirty: false, conflict: false, blocked: false, raw: undefined as string | undefined, error: '' };
    } catch { return { progress: session.progress, revision: session.revision, dirty: false, conflict: false, blocked: raw !== null, raw: raw ?? undefined, error: 'Локальная копия не прочитана. Данные аккаунта загружены с сервера. Скачайте исходную запись или загрузите серверную версию для восстановления.' }; }
  });
  const [progress, setProgress] = useState(bootstrap.progress);
  const current = useRef(progress); const revision = useRef(bootstrap.revision);
  const dirty = useRef(bootstrap.dirty); const version = useRef(0);
  const byteSize = useRef(bytes(progress)); const blocked = useRef(bootstrap.blocked);
  const [error, setError] = useState(bootstrap.error);
  const [saved, setSaved] = useState(!bootstrap.dirty);
  const [pending, setPending] = useState(bootstrap.dirty && !bootstrap.conflict);
  const [conflict, setConflict] = useState(bootstrap.conflict); const conflictRef = useRef(conflict);
  const [localOnly, setLocalOnly] = useState(bootstrap.dirty);
  const cacheTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const exclusive = useRef(false); const [replacing, setReplacing] = useState(false);
  const active = useRef(true);
  function cancelTimers() { if (cacheTimer.current) clearTimeout(cacheTimer.current); if (syncTimer.current) clearTimeout(syncTimer.current); cacheTimer.current = null; syncTimer.current = null; }
  function cache(report = true): boolean {
    if (blocked.current) return false;
    try { localStorage.setItem(cacheKey, JSON.stringify({ progress: current.current, revision: revision.current, dirty: dirty.current } satisfies Cache)); return true; }
    catch { if (report && active.current) setError('Не удалось сохранить локальную копию. Не закрывайте вкладку до синхронизации с сервером или скачайте JSON.'); return false; }
  }
  async function syncNow(): Promise<boolean> {
    if (exclusive.current) return false;
    if (inFlight.current) { const result = await inFlight.current; if (!result) return false; if (dirty.current && !conflictRef.current && !blocked.current) return syncNow(); return !dirty.current; }
    if (!dirty.current) return true;
    if (conflictRef.current || blocked.current) return false;
    if (syncTimer.current) clearTimeout(syncTimer.current); syncTimer.current = null;
    cache(); if (active.current) setPending(true);
    const snapshot = current.current; const generation = version.current;
    const work = (async () => {
      try {
        let result: api.ServerProgress;
        try { result = await api.saveProgress(snapshot, revision.current); }
        catch (cause) {
          if (!(cause instanceof api.ApiError) || cause.status !== 409) throw cause;
          const remote = await api.getProgress();
          if (!sameLearningData(parseProgress(JSON.stringify(snapshot)), remote.progress)) throw cause;
          result = remote;
        }
        revision.current = result.revision;
        if (version.current === generation) { current.current = result.progress; byteSize.current = bytes(result.progress); dirty.current = false; if (active.current) setProgress(result.progress); }
        const cached = cache();
        if (active.current) { setSaved(!dirty.current); setPending(dirty.current); setLocalOnly(dirty.current); if (cached) setError(''); }
        return true;
      } catch (cause) {
        if (cause instanceof api.ApiError && cause.status === 409) { conflictRef.current = true; if (active.current) setConflict(true); }
        cache();
        if (active.current) { setSaved(false); setPending(false); setLocalOnly(true); setError(cause instanceof Error ? cause.message : 'Не удалось синхронизировать прогресс.'); }
        return false;
      }
    })();
    inFlight.current = work;
    const result = await work; inFlight.current = null;
    if (result && dirty.current && active.current) syncTimer.current = setTimeout(() => void syncNow(), 100);
    return result && !dirty.current;
  }
  function schedule() {
    dirty.current = true; setSaved(false); setPending(true); setLocalOnly(true); setError(''); cancelTimers();
    cacheTimer.current = setTimeout(() => cache(), 250);
    syncTimer.current = setTimeout(() => void syncNow(), 500);
  }
  useEffect(() => {
    active.current = true;
    cache(); if (bootstrap.dirty && !bootstrap.conflict && !bootstrap.blocked) syncTimer.current = setTimeout(() => void syncNow(), 300);
    const flush = () => { cache(); };
    const hidden = () => { if (document.visibilityState === 'hidden') { cache(); void syncNow(); } };
    const online = () => { if (dirty.current) void syncNow(); };
    window.addEventListener('pagehide', flush); window.addEventListener('beforeunload', flush);
    window.addEventListener('online', online); document.addEventListener('visibilitychange', hidden);
    return () => { cache(false); active.current = false; cancelTimers(); window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', flush); window.removeEventListener('online', online); document.removeEventListener('visibilitychange', hidden); };
  }, [cacheKey]);
  function invalid(cause: unknown): false { setError(cause instanceof Error ? cause.message : 'Некорректные данные.'); return false; }
  function writable() { if (exclusive.current) { setError('Дождись загрузки или импорта данных.'); return false; } if (conflictRef.current || blocked.current) { setError('Сначала сохраните локальную копию и разрешите конфликт с серверной версией.'); return false; } return true; }
  function commit(next: AcademyProgress, size?: number): boolean {
    if (!writable()) return false;
    try {
      next = { ...next, updatedAt: new Date().toISOString() };
      if (size === undefined) { next = parseProgress(JSON.stringify(next)); size = bytes(next); }
      else size += bytes(next.updatedAt) - bytes(current.current.updatedAt);
      if (size > MAX_BACKUP_BYTES) throw new Error('Прогресс превышает 5 МБ. Сократите текстовые поля.');
      current.current = next; byteSize.current = size; version.current++; setProgress(next); schedule(); return true;
    } catch (cause) { return invalid(cause); }
  }
  function updateLesson(id: number, patch: Partial<LessonProgress>) {
    if (!writable()) return false;
    const state = current.current; const record = state.lessons[id]; const keys = Object.keys(patch);
    if (!record || keys.some(key => !lessonKeys.has(key))) return invalid(new Error('Некорректный урок или поле.'));
    if (!keys.every(key => routineKeys.has(key))) return commit({ ...state, lessons: { ...state.lessons, [id]: { ...record, ...patch } } });
    try {
      const clean: Partial<LessonProgress> = {};
      for (const key of keys) {
        const value = patch[key as keyof LessonProgress];
        if (key === 'notes' || key === 'weakPoints') clean[key] = text(value);
        else if (key === 'bookmarked') { if (typeof value !== 'boolean') throw new Error('Некорректная закладка.'); clean.bookmarked = value; }
        else if (key === 'readingMode') { if (value !== 'guided' && value !== 'practice' && value !== 'reference') throw new Error('Некорректный режим.'); clean.readingMode = value; }
        else if (key === 'readingStep') { if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= Math.max(1, lessonGuides[id]?.length ?? 0)) throw new Error('Некорректный шаг.'); clean.readingStep = value; }
        else if (key === 'stepDrafts') { if (!object(value) || Object.keys(value).some(step => !lessonGuides[id]?.some(item => item.id === step))) throw new Error('Некорректные черновики.'); clean.stepDrafts = Object.fromEntries(Object.entries(value).map(([step, draft]) => [step, text(draft)])); }
      }
      const size = byteSize.current + keys.reduce((difference, key) => difference + memberBytes(key, clean[key as keyof LessonProgress]) - memberBytes(key, record[key as keyof LessonProgress]), 0);
      return commit({ ...state, lessons: { ...state.lessons, [id]: { ...record, ...clean } } }, size);
    } catch (cause) { return invalid(cause); }
  }
  function updateProject(id: string, patch: Partial<ProjectProgress>) {
    const state = current.current; const record = state.projects[id]; const keys = Object.keys(patch);
    if (!record || keys.some(key => !projectKeys.has(key))) return invalid(new Error('Некорректный проект.'));
    if (!keys.every(key => ['repo', 'demo', 'notes', 'review'].includes(key))) return commit({ ...state, projects: { ...state.projects, [id]: { ...record, ...patch } } });
    try { const clean = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, text(value)])); const size = byteSize.current + keys.reduce((difference, key) => difference + memberBytes(key, clean[key]) - memberBytes(key, record[key as keyof ProjectProgress]), 0); return commit({ ...state, projects: { ...state.projects, [id]: { ...record, ...clean } } }, size); }
    catch (cause) { return invalid(cause); }
  }
  async function replace(next: AcademyProgress): Promise<boolean> {
    if (exclusive.current) return false;
    exclusive.current = true; setReplacing(true);
    try {
      next = parseProgress(serializeProgress(next)); cancelTimers(); cache();
      if (inFlight.current) await inFlight.current;
      const result = await api.saveProgress(next, revision.current);
      revision.current = result.revision; current.current = result.progress; byteSize.current = bytes(result.progress); version.current++; dirty.current = false;
      blocked.current = false; conflictRef.current = false; setConflict(false); setProgress(result.progress); setSaved(true); setPending(false); setLocalOnly(false); setError(''); cache(); return true;
    } catch (cause) { setPending(false); setError(cause instanceof Error ? cause.message : 'Импорт не сохранён.'); return false; }
    finally { exclusive.current = false; setReplacing(false); }
  }
  async function loadServerVersion(): Promise<void> {
    if (exclusive.current) return;
    exclusive.current = true; setReplacing(true);
    try {
      cancelTimers(); cache(); if (inFlight.current) await inFlight.current;
      const result = await api.getProgress();
      revision.current = result.revision; current.current = result.progress; byteSize.current = bytes(result.progress); dirty.current = false; version.current++;
      blocked.current = false; conflictRef.current = false; setConflict(false); setProgress(result.progress); setSaved(true); setPending(false); setLocalOnly(false); setError(''); cache();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить серверную копию.'); }
    finally { exclusive.current = false; setReplacing(false); }
  }
  function setGoals(goals: string) { try { const value = text(goals); return commit({ ...current.current, goals: value }, byteSize.current + bytes(value) - bytes(current.current.goals)); } catch (cause) { return invalid(cause); } }
  return {
    progress, error, saved, pending, conflict, localOnly, replacing, profile: session.user, damagedRaw: bootstrap.raw,
    loadBlocked: blocked.current, loadError: bootstrap.error, canRetrySave: dirty.current && !conflictRef.current && !blocked.current,
    retrySave: syncNow, syncNow, loadServerVersion, updateLesson, updateProject, replace, setError,
    clearError: () => setError(''), setLastLesson: (id: number) => commit({ ...current.current, lastLesson: id }), setGoals,
  };
}
export type ProgressController = ReturnType<typeof useProgress>;
