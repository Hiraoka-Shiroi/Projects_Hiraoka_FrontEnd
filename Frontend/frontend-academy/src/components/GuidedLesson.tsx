import { useEffect, useRef, useState } from 'react';
import type { GuidedStep, LessonProgress } from '../types';
import type { ProgressController } from '../hooks/useProgress';
import { selfChecks } from '../data/selfChecks';
import { SelfCheck } from './SelfCheck';
import { CopyButton } from './CopyButton';

export function GuidedLesson({ id, steps, record, controller, showPractice }: {
  id: number; steps: GuidedStep[]; record: LessonProgress; controller: ProgressController; showPractice: () => void;
}) {
  const index = record.readingStep ?? 0;
  const step = steps[index];
  const [revealed, setRevealed] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previous = useRef(step.id);
  useEffect(() => {
    if (previous.current === step.id) return;
    previous.current = step.id;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start' });
  }, [step.id]);
  function move(next: number) {
    if (controller.updateLesson(id, { readingStep: next })) setRevealed(null);
  }
  return <section className="guided-lesson" aria-label={id === 9 ? 'Короткий разбор функций' : 'Короткий разбор урока'}>
    <div className="guided-heading"><span className="eyebrow">ШАГ {index + 1} ИЗ {steps.length}</span><span className="mini-tag">Одна идея за раз</span></div>
    <nav className="step-dots" aria-label="Шаги урока">{steps.map((item, i) => <button key={item.id} className={i === index ? 'selected' : ''} onClick={() => move(i)} aria-current={i === index ? 'step' : undefined} aria-label={`Шаг ${i + 1}: ${item.title}`}>{i + 1}</button>)}</nav>
    <article className="panel guided-card" key={step.id}>
      <h2 ref={heading} tabIndex={-1}>{step.title}</h2><p className="step-goal">{step.goal}</p><p>{step.text}</p>
      <CopyButton text={step.code} />
      <pre className="code-block"><code>{step.code}</code></pre>
      <div className="line-reading">{step.lines.map((line, i) => <p key={i}><span aria-hidden="true">↳</span>{line}</p>)}</div>
      {selfChecks[id]?.[step.id] && <SelfCheck key={step.id} lessonId={id} stepId={step.id} definition={selfChecks[id][step.id]} record={record} controller={controller} />}
      {!selfChecks[id]?.[step.id] && <p className="notice"><strong>Подумай перед запуском:</strong> {step.question}</p>}
      <div className="prediction-prompt"><button onClick={() => setRevealed(revealed === step.id ? null : step.id)} aria-expanded={revealed === step.id} aria-controls={`trace-${step.id}`}>{revealed === step.id ? 'Скрыть разбор вывода' : 'Показать разбор вывода'}</button><p className="help">Разбор относится к примеру выше. Выполняй свой код в Node.js.</p></div>
      {revealed === step.id && <div className="execution-trace" id={`trace-${step.id}`}><p className="eyebrow">КАК ВЫПОЛНЯЕТСЯ ЭТОТ ПРИМЕР</p><ol>{step.trace.map((item, i) => <li key={i}>{item}</li>)}</ol><span className="code-kicker">Ожидаемый вывод в Node.js</span><pre><code>{step.result}</code></pre><small>Это разбор примера. Чтобы выполнить код, запусти его в VS Code через Node.js.</small></div>}
      <div className="micro-practice"><span className="eyebrow">ТВОЯ ПОПЫТКА · БЕЗ СПЕШКИ</span><h3>Попробуй сам</h3><p>{step.tryIt}</p><label>Мой ответ или код<textarea rows={4} spellCheck={false} placeholder="Напиши свою попытку. Ошибаться здесь нормально — разберём в чате." value={record.stepDrafts?.[step.id] ?? ''} onChange={event => controller.updateLesson(id, { stepDrafts: { ...record.stepDrafts, [step.id]: event.target.value } })} /></label><p className="help">Это черновик, а не запуск JavaScript. Код запускай в своём .js-файле через Node.js. Ответ сохраняется и входит в экспорт JSON; пришли попытку в чат для проверки.</p></div>
    </article>
    <div className="step-actions"><button disabled={index === 0} onClick={() => move(index - 1)}>← Назад к шагу</button>{index < steps.length - 1 ? <button className="primary" onClick={() => move(index + 1)}>Следующий шаг →</button> : <button className="primary" onClick={showPractice}>Перейти к заданиям →</button>}</div>
    <p className="help">Переход между шагами сохраняет место чтения. Урок завершается после самостоятельной практики и ревью.</p>
  </section>;
}
