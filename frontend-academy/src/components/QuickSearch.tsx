import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { contents, lessons, projects, stages } from '../data/course';
import { Icon, type IconName } from './Icon';
import './quick-search.css';

type SearchPage = 'dashboard' | 'roadmap' | 'lesson' | 'projects' | 'report';
export interface QuickSearchProps {
  open: boolean;
  onClose: () => void;
  onLesson: (id: number) => void;
  onProject: (id: string) => void;
  onPage: (view: SearchPage) => void;
  currentLesson?: number;
}
type Destination = { kind: 'lesson'; id: number } | { kind: 'project'; id: string } | { kind: 'page'; id: SearchPage };
type SearchResult = Destination & { key: string; title: string; detail: string; badge: string; icon: IconName; label: string; score: number };

const navigation: { id: SearchPage; title: string; icon: IconName }[] = [
  { id: 'dashboard', title: 'Главная', icon: 'dashboard' },
  { id: 'roadmap', title: 'Дорожная карта', icon: 'roadmap' },
  { id: 'projects', title: 'Практика и проекты', icon: 'projects' },
  { id: 'report', title: 'Мой прогресс', icon: 'chart' },
];
const normalize = (text: string) => text.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();
const stageNames = new Map(stages.map(stage => [stage.id, stage.title]));

function lessonResult(id: number, resume = false): SearchResult {
  const lesson = lessons.find(item => item.id === id) ?? lessons[8];
  return {
    kind: 'lesson', id: lesson.id, key: `lesson-${lesson.id}`, score: 0, icon: 'book',
    title: `${resume ? 'Продолжить: ' : ''}${lesson.id}. ${lesson.title}`,
    detail: `Этап ${lesson.stage} · ${stageNames.get(lesson.stage) ?? lesson.stage}`,
    badge: contents[lesson.id] ? 'Материал' : lesson.id <= 8 ? 'История' : 'План',
    label: `${resume ? 'Продолжить. ' : ''}Урок ${lesson.id}. ${lesson.title}`,
  };
}

export function QuickSearch({ open, onClose, onLesson, onProject, onPage, currentLesson = 9 }: QuickSearchProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const id = useId();
  const resultsId = `${id}-results`;
  const term = normalize(query);
  const results = useMemo<SearchResult[]>(() => {
    if (!term) return [lessonResult(currentLesson, true), ...navigation.map(item => ({
      kind: 'page' as const, id: item.id, key: `page-${item.id}`, title: item.title,
      detail: 'Перейти в раздел', badge: 'Раздел', icon: item.icon, label: item.title, score: 0,
    }))];
    const tokens = term.split(/\s+/);
    const found: SearchResult[] = [];
    for (const lesson of lessons) {
      const title = normalize(`${lesson.id} ${lesson.title}`);
      const text = `${title} ${normalize(lesson.concepts.join(' '))} ${normalize(stageNames.get(lesson.stage) ?? '')}`;
      if (tokens.every(token => text.includes(token))) found.push({
        ...lessonResult(lesson.id), score: term === String(lesson.id) ? 0 : title.includes(term) ? 1 : 2,
      });
    }
    for (const project of projects) {
      if (tokens.every(token => normalize(`${project.title} ${project.id}`).includes(token))) found.push({
        kind: 'project', id: project.id, key: `project-${project.id}`, title: project.title,
        detail: `Проект · этап ${project.stage}`, badge: 'Проект', icon: 'projects',
        label: `Проект. ${project.title}`, score: 1,
      });
    }
    return found.sort((a, b) => a.score - b.score).slice(0, 10);
  }, [term, currentLesson]);
  const selected = results.length ? Math.min(active, results.length - 1) : -1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setQuery('');
        setActive(0);
        dialog.showModal();
      }
      inputRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    }
  }, [open]);

  useEffect(() => () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
  }, []);

  useEffect(() => {
    if (open) optionRefs.current[selected]?.scrollIntoView({ block: 'nearest' });
  }, [open, selected, term]);

  function choose(result: SearchResult | undefined) {
    if (!result) return;
    onClose();
    if (result.kind === 'lesson') onLesson(result.id);
    else if (result.kind === 'project') onProject(result.id);
    else onPage(result.id);
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length) setActive(index => (Math.min(index, results.length - 1) + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[selected]);
    }
  }

  return <dialog ref={dialogRef} className="quick-search" aria-labelledby={`${id}-title`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="quick-search-heading">
      <h2 id={`${id}-title`}>Быстрый поиск</h2>
      <button type="button" className="quick-search-close" aria-label="Закрыть быстрый поиск" onClick={onClose}>×</button>
    </div>
    <div className="quick-search-field">
      <label htmlFor={`${id}-input`}>Поиск уроков и проектов</label>
      <input ref={inputRef} id={`${id}-input`} type="text" role="combobox" autoComplete="off" spellCheck={false}
        aria-controls={resultsId} aria-expanded={open} aria-autocomplete="list"
        aria-activedescendant={selected >= 0 ? `${id}-option-${selected}` : undefined}
        aria-describedby={`${id}-hint`} placeholder="Название, навык или номер урока"
        value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={handleKey} />
      <p id={`${id}-hint`} className="quick-search-hint">{term ? 'Первые 10 совпадений по названию и навыкам.' : 'Продолжите обучение или откройте раздел.'}</p>
    </div>
    <div id={resultsId} role="listbox" aria-label="Результаты поиска" className="quick-search-results">
      {results.map((result, index) => <button key={result.key} ref={element => { optionRefs.current[index] = element; }}
        id={`${id}-option-${index}`} type="button" role="option" aria-selected={selected === index}
        aria-label={result.label} tabIndex={-1} className="quick-search-result"
        onMouseMove={() => setActive(index)} onClick={() => choose(result)}>
        <Icon name={result.icon} size={19} />
        <span className="quick-search-result-copy"><strong>{result.title}</strong><small>{result.detail}</small></span>
        <span className={`quick-search-badge ${result.badge === 'Материал' ? 'available' : ''}`}>{result.badge}</span>
      </button>)}
    </div>
    {results.length === 0 && <p className="quick-search-empty">Ничего не найдено. Попробуйте название темы, например «функции», или проекта.</p>}
    <div className="quick-search-footer">
      <span role="status" aria-live="polite">{term ? `Найдено: ${results.length}${results.length === 10 ? ' (первые 10)' : ''}` : 'Быстрые переходы'}</span>
      <span><kbd>↑ ↓</kbd> выбрать · <kbd>Enter</kbd> открыть · <kbd>Esc</kbd> закрыть</span>
    </div>
  </dialog>;
}
