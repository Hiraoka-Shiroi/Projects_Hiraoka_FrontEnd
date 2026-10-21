import { useDeferredValue, useState } from 'react';
import { lessons, stages, getLesson, contents } from '../data/course';
import type { ProgressController } from '../hooks/useProgress';
import { statusLabels } from '../lib/progress';
import { PageHeading, Status, Meter, Empty } from '../components/common';

const searchIndex = new Map(lessons.map(lesson => [lesson.id, `${lesson.id} ${lesson.title} ${lesson.concepts.join(' ')} ${lesson.goal} ${lesson.outcome}`.toLocaleLowerCase('ru')]));

export function Roadmap({ controller, openLesson }: { controller: ProgressController; openLesson: (id: number) => void }) {
  const [search, setSearch] = useState(''); const [stage, setStage] = useState(''); const [status, setStatus] = useState('');
  const [favorites, setFavorites] = useState(false);
  const currentStage = getLesson(controller.progress.lastLesson).stage;
  const deferredSearch = useDeferredValue(search);
  const query = deferredSearch.trim().toLocaleLowerCase('ru');
  const filtered = lessons.filter(lesson => (!favorites || controller.progress.lessons[lesson.id].bookmarked) && (!stage || lesson.stage === stage) && (!status || controller.progress.lessons[lesson.id].status === status) && (!query || searchIndex.get(lesson.id)!.includes(query)));
  return <><PageHeading eyebrow="220 УРОКОВ · 15 ЭТАПОВ" title="Дорожная карта">Последовательность известна заранее. Освоение определяется практикой.</PageHeading>
    <div className="filter-bar"><label className="search-field">Поиск по урокам и навыкам<input type="search" placeholder="Например, замыкания или WebSocket" value={search} onChange={event => setSearch(event.target.value)} /></label><label>Этап<select value={stage} onChange={event => setStage(event.target.value)}><option value="">Все этапы</option>{stages.map(item => <option key={item.id} value={item.id}>{item.id}. {item.title}</option>)}</select></label><label>Статус<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Все статусы</option>{Object.entries(statusLabels).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label></div>
    <div className="roadmap-tools"><p className="result-count" aria-live="polite">Найдено {filtered.length} из {lessons.length} уроков</p><button aria-pressed={favorites} onClick={() => setFavorites(value => !value)}>Только избранное</button></div>
    {!filtered.length && <Empty>По этим условиям уроков нет. Измени запрос или фильтры.</Empty>}
    {stages.map(item => {
      const rows = filtered.filter(lesson => lesson.stage === item.id); if (!rows.length) return null;
      const all = lessons.filter(lesson => lesson.stage === item.id);
      const passed = all.filter(lesson => controller.progress.lessons[lesson.id].status === 'passed').length;
      return <details className="stage-panel" key={item.id} open={!!query || !!stage || !!status || favorites || item.id === currentStage}><summary className="stage-heading"><span className="stage-letter">{item.id}</span><div><p className="eyebrow">УРОКИ {all[0].id}–{all.at(-1)?.id}</p><h2>{item.title}</h2><p>{item.description}</p></div><div className="stage-progress"><span>{passed} / {all.length}</span><Meter value={passed} total={all.length} /></div><span className="stage-toggle" aria-hidden="true">+</span></summary><details className="stage-details"><summary>Результат этапа и контрольная точка</summary><ul>{item.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul><p><strong>Проверка:</strong> {item.checkpoint}</p></details><div className="lesson-list">{rows.map(lesson => <button className={`lesson-row ${lesson.id === controller.progress.lastLesson ? 'current-lesson' : ''}`} key={lesson.id} onClick={() => openLesson(lesson.id)}><span className="lesson-number">{String(lesson.id).padStart(2, '0')}</span><div><strong>{lesson.title}</strong><small>{lesson.outcome}</small><span className="dependency">Предварительно: {lesson.prerequisites.length ? lesson.prerequisites.join(', ') : 'начальный урок'} · {contents[lesson.id] ? 'Урок по шагам и практика' : 'План урока'}</span></div><Status value={controller.progress.lessons[lesson.id].status} /><span aria-hidden="true" className="row-arrow">→</span></button>)}</div></details>;
    })}
  </>;
}


