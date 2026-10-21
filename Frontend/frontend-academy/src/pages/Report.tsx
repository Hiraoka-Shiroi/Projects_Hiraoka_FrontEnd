import { useRef, useState } from 'react';
import { lessons } from '../data/course';
import { masteryLabels, todayTashkent } from '../lib/progress';
import { downloadText, parseProgress, serializeProgress, MAX_BACKUP_BYTES } from '../lib/storage';
import type { AcademyProgress } from '../types';
import type { ProgressController } from '../hooks/useProgress';
import { PageHeading, Status, Empty } from '../components/common';
import { ImportDialog } from '../components/ImportDialog';
import { selfChecks } from '../data/selfChecks';

export function Report({ controller, openLesson }: { controller: ProgressController; openLesson: (id: number) => void }) {
  const [pending, setPending] = useState<AcademyProgress | null>(null);
  const [all, setAll] = useState(false);
  const [notice, setNotice] = useState('');
  const [importError, setImportError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const { progress } = controller;
  const displayed = lessons.filter(item => all || progress.lessons[item.id].status !== 'not_started' || progress.lessons[item.id].evidence || progress.lessons[item.id].weakPoints);
  const weak = lessons.filter(item => progress.lessons[item.id].weakPoints || progress.lessons[item.id].status === 'repeat');
  const reviews = lessons.flatMap(lesson => progress.lessons[lesson.id].reviews.map(review => ({ ...review, lesson }))).sort((a, b) => b.date.localeCompare(a.date));
  const checks = Object.entries(progress.lessons[9].selfChecks ?? {});
  function backupCurrent() {
    try { downloadText(`frontend-academy-${todayTashkent()}.json`, serializeProgress(progress)); }
    catch (cause) { controller.setError(cause instanceof Error ? cause.message : 'Не удалось экспортировать данные.'); }
  }
  return <><PageHeading eyebrow="ДОКАЗАТЕЛЬСТВА ВМЕСТО СЧЁТЧИКА УРОКОВ" title="Мой прогресс">История обучения, проверенные решения и конкретные пробелы.</PageHeading>
    <section className="panel backup-panel"><div><h2>Прогресс принадлежит тебе</h2><p>Резервная копия содержит статусы, заметки, чек-листы, ссылки и ревью.</p></div><div className="button-row"><button onClick={backupCurrent}>Экспорт JSON ↓</button><button onClick={() => fileInput.current?.click()}>Импорт JSON ↑</button><input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Файл резервной копии" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      try { if (file.size > MAX_BACKUP_BYTES) throw new Error('Файл превышает 5 МБ.'); setNotice(''); setImportError(''); setPending(parseProgress(await file.text())); }
      catch (cause) { controller.setError(cause instanceof Error ? cause.message : 'Не удалось прочитать файл.'); }
    }} />{controller.damagedRaw !== undefined && <button onClick={() => downloadText('frontend-academy-damaged.json', controller.damagedRaw!)}>Скачать исходную повреждённую запись</button>}</div></section>
    {pending && <ImportDialog busy={controller.replacing} pending={pending} error={importError} backup={backupCurrent} cancel={() => { setPending(null); setImportError(''); }} apply={async () => { if (await controller.replace(pending)) { setPending(null); setImportError(''); setNotice('Резервная копия импортирована.'); } else setImportError('Импорт не удалось сохранить. Текущая копия остаётся на месте. Проверь соединение с сервером и повтори попытку.'); }} />}
    {notice && <p className="success" role="status">{notice}</p>}
    <p className="local-limit">Прогресс хранится на сервере твоего аккаунта. Войди с тем же логином на другом устройстве, чтобы продолжить. Несинхронизированная копия остаётся только на текущем устройстве; регулярно экспортируй JSON. Ревью кода проводится преподавателем в чате.</p>
    <section className="panel training-summary"><h2>Тренировка понимания · функции</h2><p>{checks.length ? `Разобрано вопросов: ${checks.length} из 6. Последний ответ верный в ${checks.filter(([id, value]) => selfChecks[9][id]?.answer === value.selected).length} случаях.` : 'В коротких шагах появились вопросы с выбором ответа. После попытки увидишь объяснение и сможешь вернуться к примеру.'}</p><p className="help">Это учебная обратная связь. Самостоятельные задачи и ревью оцениваются отдельно.</p><button onClick={() => { controller.updateLesson(9, { readingMode: 'guided' }); openLesson(9); }}>Открыть самопроверки</button></section>
    <section className="panel"><div className="section-heading"><h2>Темы и доказательства</h2><label className="check-item"><input type="checkbox" checked={all} onChange={event => setAll(event.target.checked)} /><span>Показать все уроки</span></label></div><div className="table-scroll"><table><thead><tr><th scope="col">Тема</th><th scope="col">Статус</th><th scope="col">Освоение</th><th scope="col">Доказательство</th></tr></thead><tbody>{displayed.map(lesson => { const record = progress.lessons[lesson.id]; return <tr key={lesson.id}><th scope="row"><button className="text-button" onClick={() => openLesson(lesson.id)}>{lesson.id}. {lesson.title}</button></th><td><Status value={record.status} /></td><td>{masteryLabels[record.mastery]}</td><td className="evidence-cell">{record.evidence || (record.historicalPassed ? 'История ученика; независимое подтверждение пока не записано' : 'Практика ещё не проверена')}{record.projectEvidence && <p>В проекте: {record.projectEvidence}</p>}</td></tr>; })}</tbody></table></div></section>
    <div className="two-columns"><section className="panel"><h2>Что требует внимания</h2>{weak.length ? weak.map(lesson => <div className="review-entry" key={lesson.id}><button className="text-button" onClick={() => openLesson(lesson.id)}>{lesson.id}. {lesson.title}</button><p>{progress.lessons[lesson.id].weakPoints || 'Отмечено для повторения; сформулируй конкретный пробел.'}</p></div>) : <Empty>Пробелы пока не записаны. После проверки добавим короткую целевую практику.</Empty>}</section><section className="panel"><h2>Готовность к работе</h2><p>Счётчик уроков не определяет грейд. Проверяем самостоятельное выполнение задачи, объяснение решений, отладку, тестирование, доступность и качество проектов.</p><p>Контрольная точка Frontend — урок 193. Backend начинается с 194 после укрепления основ. Программа не обещает трудоустройство или уровень Middle за количество занятий.</p><small>Система оценки и матрица вакансий описаны в docs/ASSESSMENT.md и docs/CAREER.md.</small></section></div>
    <section className="panel"><h2>Журнал проверок</h2>{reviews.length ? reviews.map(review => <article className="review-entry" key={`${review.lesson.id}-${review.id}`}><button className="text-button" onClick={() => openLesson(review.lesson.id)}>{review.lesson.id}. {review.lesson.title}</button><small>{review.date} · {review.verdict === 'accepted' ? 'Принято' : 'Нужна доработка'}</small><p>{review.explanation}</p>{review.corrections && <p>{review.corrections}</p>}</article>) : <Empty>Журнал пуст: новых проверенных решений пока нет.</Empty>}</section>
  </>;
}



