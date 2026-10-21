import { useState } from 'react';
import type { SelfCheck as Definition } from '../data/selfChecks';
import type { LessonProgress } from '../types';
import type { ProgressController } from '../hooks/useProgress';

export function SelfCheck({ lessonId, stepId, definition, record, controller }: {
  lessonId: number; stepId: string; definition: Definition; record: LessonProgress; controller: ProgressController;
}) {
  const stored = record.selfChecks?.[stepId];
  const [selected, setSelected] = useState<number | null>(stored?.selected ?? null);
  const [submitted, setSubmitted] = useState(stored !== undefined);
  const correct = selected === definition.answer;
  return <section className="self-check" aria-label="Тренировочная самопроверка"><p className="eyebrow">ПРОВЕРЬ СЕБЯ</p><h3>{definition.question}</h3><fieldset><legend className="sr-only">Выбери один ответ</legend>{definition.options.map((option, index) => <label key={index} className={`answer-option ${selected === index ? 'selected' : ''}`}><input type="radio" name={`check-${lessonId}-${stepId}`} checked={selected === index} onChange={() => { setSelected(index); setSubmitted(false); }} /><span>{option}</span></label>)}</fieldset><button disabled={selected === null} onClick={() => {
    if (selected === null) return;
    const saved = controller.updateLesson(lessonId, { selfChecks: { ...record.selfChecks, [stepId]: { selected, attempts: Math.min(1000, (stored?.attempts ?? 0) + 1) } } });
    if (saved) setSubmitted(true);
  }}>Проверить ответ</button>{submitted && <div className={`check-feedback ${correct ? 'correct' : 'try-again'}`} role="status"><strong>{correct ? 'Верно — объясни это своими словами.' : 'Разберём причину.'}</strong><p>{definition.explanation}</p>{!correct && <p>Вернись к примеру, затем выбери ответ снова.</p>}</div>}<p className="help">Тренировка понимания. Результат не заменяет твоё решение и преподавательское ревью.</p></section>;
}
