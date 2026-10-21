import { useState } from 'react';
import { contents, getLesson, lessons } from '../data/course';
import { lessonNotes, referenceNotes } from '../data/notes';
import { lessonGuides } from '../data/guides';
import { downloadText } from '../lib/storage';
import { prerequisiteProblem } from '../lib/progress';
import type { ProgressController } from '../hooks/useProgress';
import { PageHeading, Status, Checklist, Bullets } from '../components/common';
import { LessonProgressPanel } from '../components/LessonProgressPanel';
import { GuidedLesson } from '../components/GuidedLesson';
import { Icon } from '../components/Icon';
import { CopyButton } from '../components/CopyButton';
import { buildReviewBundle } from '../lib/reviewBundle';

export function LessonPage({ id, controller, openLesson }: { id: number; controller: ProgressController; openLesson: (id: number) => void }) {
  const lesson = getLesson(id);
  const content = contents[id];
  const record = controller.progress.lessons[id];
  const steps = lessonGuides[id] ?? [];
  const mode = record.readingMode ?? 'guided';
  const note = mode === 'reference' ? referenceNotes[id] ?? lessonNotes[id] : lessonNotes[id];
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => content?.exercises[0] ? { [content.exercises[0].id]: true } : {});
  const allExpanded = !!content && content.exercises.every(exercise => expanded[exercise.id]);
  const checklist = content?.checklist ?? lesson.completion;
  const prerequisite = prerequisiteProblem(id, controller.progress);
  function scrollToSection(event: React.MouseEvent<HTMLAnchorElement>, target: string) {
    event.preventDefault();
    const section = document.getElementById(target);
    section?.scrollIntoView({ block: 'start' }); section?.focus({ preventScroll: true });
  }
  return <>
    <PageHeading eyebrow={`ЭТАП ${lesson.stage} · УРОК ${id} / ${lessons.length}`} title={`${id}. ${lesson.title}`}>{lesson.goal}</PageHeading>
    <div className="lesson-toolbar"><Status value={record.status} /><span className="environment-label"><Icon name="code" size={16} />{content ? 'VS Code + Node.js · отдельный .js-файл' : 'План будущего занятия'}</span><button className="bookmark-button" aria-pressed={!!record.bookmarked} onClick={() => controller.updateLesson(id, { bookmarked: !record.bookmarked })}><Icon name="bookmark" size={16} />{record.bookmarked ? 'В избранном' : 'В избранное'}</button></div>
    {content && <nav className="lesson-modes" aria-label="Формат урока">
      <button aria-pressed={mode === 'guided'} onClick={() => controller.updateLesson(id, { readingMode: 'guided' })}><Icon name="play" />По шагам <small>{steps.length} коротких разборов</small></button>
      <button aria-pressed={mode === 'practice'} onClick={() => controller.updateLesson(id, { readingMode: 'practice' })}><Icon name="code" />Все задания <small>Самостоятельная работа</small></button>
      <button aria-pressed={mode === 'reference'} onClick={() => controller.updateLesson(id, { readingMode: 'reference' })}><Icon name="book" />Справочник <small>Подробности по необходимости</small></button>
    </nav>}
    <div className="lesson-layout"><article className="lesson-reading">
      {prerequisite && <p className="notice">{prerequisite} Карту можно просматривать заранее.</p>}
      {content && mode === 'guided' && steps.length > 0 && <GuidedLesson id={id} steps={steps} record={record} controller={controller} showPractice={() => controller.updateLesson(id, { readingMode: 'practice' })} />}
      {!content && <section className="panel"><h2>{id <= 8 ? 'Сохранённая история обучения' : 'План занятия'}</h2><p>{id <= 8 ? 'Урок пройден ранее по твоему сообщению. Оригинальный конспект сохранён в Frontend; здесь можно записывать новые доказательства и заметки.' : 'Подробный материал подготовим после предыдущего шага. Сейчас здесь цель, зависимости и критерии будущего занятия.'}</p><h3>Практический результат</h3><p>{lesson.outcome}</p><Bullets items={lesson.completion} /><Checklist items={checklist.map((text, i) => ({ id: `skill-${i}`, text }))} checked={record.completedTasks} onChange={completedTasks => controller.updateLesson(id, { completedTasks })} /><LessonProgressPanel key={id} id={id} controller={controller} /></section>}
      {content && mode === 'reference' && <>
        <section className="panel"><h2>Когда нужны подробности</h2><p>Выбирай нужную тему в оглавлении. Для первого знакомства достаточно режима «По шагам».</p><p>{content.connection}</p><details><summary>Среда и запуск</summary><p>{content.environment}</p></details></section>
        {content.sections.map((section, i) => <section className="panel theory-section" key={i} id={`section-${i}`} tabIndex={-1}><h2>{section.title}</h2><p className="preserve-lines">{section.text}</p>{section.code && <pre className="code-block"><code>{section.code}</code></pre>}{section.explanation && <details><summary>Разобрать строки</summary><p className="preserve-lines code-explanation">{section.explanation}</p></details>}</section>)}
      </>}
      {content && mode === 'practice' && <>
        <section className="panel practice-intro"><div className="section-heading"><div><p className="eyebrow">САМОСТОЯТЕЛЬНАЯ РАБОТА</p><h2>Начни с первой задачи</h2></div><span className="mini-tag">Заданий: {content.exercises.length} · от простого к сложному</span></div><p>Не нужно решать всё за раз. Напиши своё решение, проверь примеры и пришли код в чат.</p><button onClick={() => setExpanded(Object.fromEntries(content.exercises.map(exercise => [exercise.id, !allExpanded])))}>{allExpanded ? 'Свернуть задачи' : 'Развернуть все задачи'}</button></section>
        <div className="exercise-deck">{content.exercises.map(exercise => <details className="panel exercise-card" key={exercise.id} open={expanded[exercise.id] ?? false} onToggle={event => {
          const open = event.currentTarget.open; setExpanded(previous => previous[exercise.id] === open ? previous : { ...previous, [exercise.id]: open });
        }}><summary><span>{exercise.title}</span>{record.completedTasks.includes(exercise.id) && <Icon name="check" size={18} />}</summary><p>{exercise.instructions}</p><h3>Проверь своё решение</h3><Bullets items={exercise.checks} /><Checklist items={[{ id: exercise.id, text: 'Решение написано самостоятельно, проверки выполнены' }]} checked={record.completedTasks} onChange={completedTasks => controller.updateLesson(id, { completedTasks })} /></details>)}</div>
        <section className="panel"><h2>Проверка понимания</h2><details><summary>Вопросы для объяснения</summary><Bullets items={content.questions} /></details><details><summary>Предскажи вывод до запуска</summary><pre className="code-block"><code>{content.prediction}</code></pre></details><p className="help">Ответы и решение присылай в чат. Готовый ответ до твоей попытки не показывается.</p></section>
        <section className="panel review-handoff"><h2>Подготовь попытку для проверки</h2><p>Собери сохранённые мини-попытки и заметки в один текст. Основные решения приложи полным .js-файлом.</p><CopyButton label="Скопировать попытки для чата" text={buildReviewBundle(id, record)} /><button onClick={() => downloadText(`${id}_попытка-для-ревью.md`, buildReviewBundle(id, record), 'text/markdown;charset=utf-8')}>Скачать попытку .md</button></section>
        <details className="panel review-workspace"><summary>Проверка и статус урока</summary><h2>Критерии завершения</h2><Checklist items={checklist.map((text, i) => ({ id: `skill-${i}`, text }))} checked={record.completedTasks} onChange={completedTasks => controller.updateLesson(id, { completedTasks })} /><LessonProgressPanel key={id} id={id} controller={controller} /><details><summary>Правила преподавательской проверки</summary><p className="preserve-lines">{content.reviewPolicy}</p></details></details>
      </>}
      {content && note && <section className="panel note-download"><Icon name="download" /><div><h2>{mode === 'reference' ? 'Полный конспект' : 'Короткий конспект для VS Code'}</h2><p>{note.filename}</p></div><button onClick={() => downloadText(note.filename, note.text, 'text/javascript;charset=utf-8')}>Скачать .js</button></section>}
      <details className="panel lesson-context"><summary>Связь с предыдущими темами</summary><p>{content?.connection ?? lesson.outcome}</p><p><strong>Предварительно:</strong> {lesson.prerequisites.map(number => <button className="inline-link" key={number} onClick={() => openLesson(number)}>{number}. {getLesson(number).title}</button>)}</p><div className="tags">{lesson.concepts.map(concept => <span key={concept}>{concept}</span>)}</div></details>
      <div className="lesson-end"><button disabled={id <= 1} onClick={() => openLesson(id - 1)}>← Предыдущий урок</button><button disabled={id >= lessons.length || record.status !== 'passed'} onClick={() => openLesson(id + 1)}>Следующий урок →</button></div>
    </article><aside className="lesson-notes">
      {content && mode === 'guided' && <section className="panel lesson-route"><p className="eyebrow">МАРШРУТ УРОКА</p><h2>{id === 9 ? 'Функции за 6 идей' : `${steps.length} понятных шага`}</h2>{steps.map((step, i) => <button key={step.id} aria-current={(record.readingStep ?? 0) === i ? 'step' : undefined} onClick={() => controller.updateLesson(id, { readingStep: i })}><span>{i + 1}</span>{step.title.replace(/^\d+\.\s*/, '')}</button>)}<p className="help">Можно вернуться к любой идее. Урок остаётся в процессе до проверки практики.</p></section>}
      <details className="panel personal-notes"><summary><Icon name="bookmark" />Личные заметки</summary><label htmlFor="lesson-notes" className="sr-only">Личные заметки к уроку {id}</label><textarea id="lesson-notes" value={record.notes} rows={7} placeholder="Запиши мысль или непонятное место" onChange={event => controller.updateLesson(id, { notes: event.target.value })} /><p className="help">Сохраняются вместе с прогрессом.</p></details>
      {content && mode === 'reference' && <section className="panel contents-nav"><h3>Оглавление справочника</h3><a href="#main-content" onClick={event => scrollToSection(event, 'main-content')}>Цель и зависимости</a>{content.sections.map((section, i) => <a key={i} href={`#section-${i}`} onClick={event => scrollToSection(event, `section-${i}`)}>{section.title}</a>)}</section>}
    </aside></div>
  </>;
}
