import { useState } from 'react';
import type { ProgressController } from '../hooks/useProgress';
import type { LessonStatus, LessonProgress, ReviewRecord } from '../types';
import { statusLabels, masteryLabels, passProblem, prerequisiteProblem, todayTashkent } from '../lib/progress';
import { getLesson } from '../data/course';

export function LessonProgressPanel({ id, controller }: { id: number; controller: ProgressController }) {
  const record = controller.progress.lessons[id];
  const [verdict, setVerdict] = useState<ReviewRecord['verdict']>('revise');
  const [independent, setIndependent] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [corrections, setCorrections] = useState('');
  function changeStatus(status: LessonStatus) {
    const problem = status === 'passed' && status !== record.status ? prerequisiteProblem(id, controller.progress) ?? passProblem(id, record) : status === 'in_progress' ? prerequisiteProblem(id, controller.progress) : null;
    if (problem) { controller.setError(problem); return; }
    controller.updateLesson(id, { status });
  }
  return <section className="panel progress-panel" aria-label="Статус и результаты проверки"><div className="section-heading"><h2>Статус и доказательства</h2><span className="mini-tag">Без автоматических оценок</span></div><div className="two-columns compact"><label>Статус урока<select value={record.status} onChange={event => changeStatus(event.target.value as LessonStatus)}>{Object.entries(statusLabels).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label><label>Уровень освоения<select value={record.mastery} onChange={event => controller.updateLesson(id, { mastery: Number(event.target.value) as LessonProgress['mastery'] })}>{masteryLabels.map((title, i) => <option key={i} value={i}>{i}. {title}</option>)}</select></label></div>
    <p className="help">Уровни: 1 — узнаю синтаксис; 2 — объясняю и решаю простую задачу; 3 — самостоятельно применяю и отлаживаю; 4 — применяю в проекте и объясняю компромиссы. Сначала добавь доказательства; для уровней 3–4 нужно принятое самостоятельное ревью.</p>
    <label>Доказательства навыка<textarea rows={4} value={record.evidence} placeholder="Путь или ссылка на код, результаты запусков, объяснение логики и крайних случаев" onChange={event => controller.updateLesson(id, { evidence: event.target.value })} /></label>
    <label>Применение в проекте и компромиссы<textarea rows={3} value={record.projectEvidence} placeholder="Для уровня 4: проект, конкретный фрагмент кода, выбранное решение, альтернативы и проверенные границы" onChange={event => controller.updateLesson(id, { projectEvidence: event.target.value })} /></label>
    <div className="two-columns compact"><label>Что нужно закрепить<textarea value={record.weakPoints} rows={3} onChange={event => controller.updateLesson(id, { weakPoints: event.target.value })} placeholder="Конкретный пробел и короткая дополнительная практика" /></label><label>Дата повторения<input type="date" value={record.repeatOn} onChange={event => controller.updateLesson(id, { repeatOn: event.target.value })} /><small>Повторение назначается по реальному пробелу.</small></label></div>
    <details className="review-form"><summary>Записать результат полученного ревью</summary><p className="help">Заполняй после проверки решения преподавателем в чате. Эти записи вводит человек; приложение не запускает и не оценивает твой код.</p><form onSubmit={event => {
      event.preventDefault();
      const needsRework = verdict === 'revise' || !independent;
      const saved = controller.updateLesson(id, {
        reviews: [...record.reviews, { id: crypto.randomUUID(), date: todayTashkent(), verdict, independent, explanation: explanation.trim(), corrections: corrections.trim() }],
        ...(needsRework ? { mastery: record.mastery >= 3 ? 2 : record.mastery, status: record.status === 'passed' ? 'repeat' : record.status } : {}),
      });
      if (saved) { setExplanation(''); setCorrections(''); setIndependent(false); }
    }}><label>Результат<select value={verdict} onChange={event => setVerdict(event.target.value as ReviewRecord['verdict'])}><option value="revise">Нужна доработка</option><option value="accepted">Принято</option></select></label><label className="check-item"><input type="checkbox" checked={independent} onChange={event => setIndependent(event.target.checked)} /><span>Самостоятельность решения и объяснение проверены</span></label><label>Итог проверки<textarea required value={explanation} onChange={event => setExplanation(event.target.value)} rows={3} placeholder="Что принято, какие навыки продемонстрированы, как проверены границы" /></label><label>Ошибки и доработки<textarea value={corrections} onChange={event => setCorrections(event.target.value)} rows={3} placeholder="Раздели обязательные исправления и рекомендации по стилю" /></label><button type="submit">Сохранить ревью</button></form></details>
    {record.reviews.map(review => <article key={review.id} className="review-entry"><strong>{review.verdict === 'accepted' ? 'Принято' : 'Нужна доработка'}</strong><small>{review.date} · {review.independent ? 'Самостоятельность проверена' : 'Самостоятельность не подтверждена'}</small><p>{review.explanation}</p>{review.corrections && <p className="muted">{review.corrections}</p>}</article>)}
    {!record.historicalPassed && <p className="help">{passProblem(id, record) ?? 'Критерии записи выполнены. Установи статус «Пройден» после реального ревью.'} Чтобы исправить уже закрытый чек-лист или доказательства, сначала выбери «Нужно повторить» и при необходимости снизь уровень.</p>}
    {record.historicalPassed && <p className="help">{getLesson(id).title}: исторически пройден по твоему сообщению. Чтение исходного файла не заменяет самостоятельную проверку.</p>}
  </section>;
}

