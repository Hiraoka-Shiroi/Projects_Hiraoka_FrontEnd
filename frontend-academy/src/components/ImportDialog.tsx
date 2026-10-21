import { useEffect, useRef } from 'react';
import type { AcademyProgress } from '../types';
import { lessons } from '../data/course';

export function ImportDialog({ pending, apply, cancel, backup, error, busy }: { pending: AcademyProgress; apply: () => void; cancel: () => void; backup: () => void; error: string; busy: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="import-dialog" aria-labelledby="import-title" aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) cancel(); }}><h2 id="import-title">Проверенная резервная копия</h2><p>Уроков: {lessons.length}. Пройдено: {Object.values(pending.lessons).filter(item => item.status === 'passed').length}. Последнее место: урок {pending.lastLesson}.</p><p>Применение заменит текущие заметки, статусы и проекты. Сначала можно сохранить свою копию прямо здесь.</p>{error && <p className="import-error" role="alert">{error}</p>}<div className="button-row"><button autoFocus disabled={busy} onClick={cancel}>Отмена</button><button disabled={busy} onClick={backup}>Скачать текущую копию</button><button className="primary" disabled={busy} onClick={apply}>{busy ? 'Сохраняем импорт…' : 'Применить импорт'}</button></div></dialog>;
}
