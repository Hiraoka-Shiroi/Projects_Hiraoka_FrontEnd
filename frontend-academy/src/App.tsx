import { useEffect, useState } from 'react';
import { useProgress } from './hooks/useProgress';
import { useAccount } from './hooks/useAccount';
import { AuthGate } from './components/AuthGate';
import * as api from './lib/api';
import { lessons, contents, projects } from './data/course';
import { prerequisiteProblem } from './lib/progress';
import { parseRoute } from './lib/routes';
import { Shell, type View } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { Roadmap } from './pages/Roadmap';
import { LessonPage } from './pages/LessonPage';
import { Projects } from './pages/Projects';
import { Report } from './pages/Report';

function Workspace({ session, onSignedOut }: { session: api.AccountSession; onSignedOut: () => void }) {
  const controller = useProgress(session);
  const [location, setLocation] = useState(() => parseRoute(window.location.hash, controller.progress.lastLesson));
  useEffect(() => {
    const change = () => {
      if (window.location.hash === '#main-content' || window.location.hash.startsWith('#section-')) return;
      setLocation(parseRoute(window.location.hash, controller.progress.lastLesson));
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, [controller.progress.lastLesson]);
  function openLesson(id: number) {
    if (!lessons.some(lesson => lesson.id === id)) return;
    if (contents[id] && !prerequisiteProblem(id, controller.progress)) controller.setLastLesson(id);
    window.location.hash = `lesson/${id}`;
    setLocation(parseRoute(window.location.hash, controller.progress.lastLesson));
  }
  function openProject(id: string) {
    if (!projects.some(project => project.id === id)) return;
    window.location.hash = `projects/${id}`;
    setLocation(parseRoute(window.location.hash, controller.progress.lastLesson));
  }
  function navigate(view: View) {
    if (view === 'lesson') { openLesson(controller.progress.lastLesson); return; }
    window.location.hash = view; setLocation(parseRoute(window.location.hash, controller.progress.lastLesson));
  }
  async function signOut() { if (!await controller.syncNow()) return false; await api.logout(); onSignedOut(); return true; }
  return <Shell onSignOut={signOut} view={location.view} focusKey={`${location.view}/${location.id}/${location.projectId}`} navigate={navigate} openLesson={openLesson} openProject={openProject} controller={controller}>
    {location.warning && <p className="notice" role="status">{location.warning}</p>}
    {location.view === 'dashboard' && <Dashboard controller={controller} openLesson={openLesson} showProjects={() => navigate('projects')} />}
    {location.view === 'roadmap' && <Roadmap controller={controller} openLesson={openLesson} />}
    {location.view === 'lesson' && <LessonPage key={location.id} id={location.id} controller={controller} openLesson={openLesson} />}
    {location.view === 'projects' && <Projects selectedId={location.projectId} onSelect={openProject} controller={controller} openLesson={openLesson} />}
    {location.view === 'report' && <Report controller={controller} openLesson={openLesson} />}
  </Shell>;
}

export default function App() {
  const account = useAccount();
  if (account.loading) return <main className="connection-screen"><img src="/academy-mark.svg" width="64" height="64" alt="" /><h1>Подключаем твой аккаунт</h1><p>Загружаем сохранённое место обучения…</p></main>;
  if (!account.session) return <AuthGate serverError={account.error} retry={() => void account.refresh()} onAuthenticated={session => { window.location.hash = `lesson/${session.progress.lastLesson}`; window.scrollTo({ top: 0 }); account.setSession(session); }} />;
  return <Workspace key={account.session.user.id} session={account.session} onSignedOut={() => { account.setSession(null); window.location.hash = 'dashboard'; }} />;
}
