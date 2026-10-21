import { useEffect, useRef, useState } from 'react';
import type { ProgressController } from '../hooks/useProgress';
import { Icon, type IconName } from './Icon';
import { QuickSearch } from './QuickSearch';
import { AccountDialog } from './AccountDialog';
import { downloadText, serializeProgress } from '../lib/storage';
import { todayTashkent } from '../lib/progress';

export type View = 'dashboard' | 'roadmap' | 'lesson' | 'projects' | 'report';
const navigation: { id: View; title: string; icon: IconName }[] = [
  { id: 'dashboard', title: 'Главная', icon: 'dashboard' },
  { id: 'roadmap', title: 'Дорожная карта', icon: 'roadmap' },
  { id: 'lesson', title: 'Текущий урок', icon: 'book' },
  { id: 'projects', title: 'Практика и проекты', icon: 'projects' },
  { id: 'report', title: 'Мой прогресс', icon: 'chart' },
];
export function Shell({ view, focusKey, navigate, openLesson, openProject, controller, children, onSignOut }: { view: View; focusKey: string; navigate: (view: View) => void; openLesson: (id: number) => void; openProject: (id: string) => void; controller: ProgressController; children: React.ReactNode; onSignOut: () => Promise<boolean> }) {
  const mainRef = useRef<HTMLElement>(null);
  const previousView = useRef(focusKey);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => {
    if (previousView.current === focusKey) return;
    previousView.current = focusKey;
    mainRef.current?.querySelector<HTMLHeadingElement>('h1')?.focus();
    window.scrollTo({ top: 0 });
  }, [focusKey]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(current => !current); }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  function exportCurrent() {
    try { downloadText(`frontend-academy-${todayTashkent()}.json`, serializeProgress(controller.progress)); }
    catch (cause) { controller.setError(cause instanceof Error ? cause.message : 'Не удалось экспортировать прогресс.'); }
  }
  return <div className="app-layout">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); mainRef.current?.focus(); mainRef.current?.scrollIntoView({ block: 'start' }); }}>Перейти к содержимому</a>
    <aside className="sidebar">
      <a className="brand" href="#dashboard" onClick={event => { event.preventDefault(); navigate('dashboard'); }}>
        <img className="academy-mark" src="/academy-mark.svg" alt="" width="46" height="46" /><span>frontend<span className="brand-caption">ИНЖЕНЕРНАЯ АКАДЕМИЯ</span></span>
      </a>
      <p className="nav-label">РАБОЧАЯ СРЕДА</p>
      <nav aria-label="Основная навигация">{navigation.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} aria-current={view === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>
        <span className="nav-icon"><Icon name={item.icon} /></span><span>{item.title}</span>
      </button>)}</nav>
      <div className="sidebar-bottom"><button className="learner account-trigger" onClick={() => setAccountOpen(true)} aria-label="Открыть мой аккаунт"><span className="avatar">{Array.from(controller.profile.name)[0]}</span><span>{controller.profile.name}<small>@{controller.profile.username}</small></span></button><p>Темп задаёт понимание.<br />Результат подтверждает практика.</p></div>
    </aside>
    <div className="workspace">
      <div className="topbar"><button className="mobile-account" aria-label="Открыть мой аккаунт" onClick={() => setAccountOpen(true)}>{Array.from(controller.profile.name)[0]}</button><span className="topbar-breadcrumb">Моя академия <span className="separator">/</span> {navigation.find(item => item.id === view)?.title}</span><button className="search-trigger" aria-label="Быстрый поиск" onClick={() => setSearchOpen(true)}><Icon name="search" size={17} /><span>Найти урок или проект</span><kbd>Ctrl K</kbd></button><span className={`save-state ${controller.saved ? '' : 'unsaved'} ${controller.pending ? 'pending' : ''}`} aria-live="polite"><i />{controller.pending ? 'Синхронизация…' : controller.saved ? 'Сохранено в аккаунте' : controller.localOnly ? 'Есть локальная копия' : 'Не сохранено'}</span></div>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {(controller.error || controller.conflict || controller.loadBlocked) && <div className="alert" role="alert"><p>{controller.error || (controller.conflict ? 'Прогресс изменён в другой вкладке. Сохраните текущую копию перед перезагрузкой.' : controller.loadError)}</p>{(controller.conflict || controller.loadBlocked || controller.canRetrySave) && <button onClick={exportCurrent}>Скачать текущую копию JSON</button>}{controller.damagedRaw !== undefined && controller.loadBlocked && <button onClick={() => downloadText('frontend-academy-damaged.json', controller.damagedRaw!)}>Скачать исходную запись</button>}{(controller.conflict || controller.loadBlocked) && <button onClick={() => void controller.loadServerVersion()}>Загрузить сохранённую версию</button>}{controller.canRetrySave && <button onClick={controller.retrySave}>Повторить сохранение</button>}{!controller.conflict && !controller.loadBlocked && <button className="subtle" onClick={controller.clearError} aria-label="Скрыть сообщение">Закрыть</button>}</div>}
        {children}
      </main>
      <footer className="footer">Frontend Academy <span>Личный аккаунт · резервная копия в разделе «Мой прогресс»</span></footer>
    </div>
    <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} onLesson={openLesson} onProject={openProject} onPage={navigate} currentLesson={controller.progress.lastLesson} />
    {accountOpen && <AccountDialog controller={controller} close={() => setAccountOpen(false)} signOut={onSignOut} />}
  </div>;
}


