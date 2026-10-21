import { useState } from 'react';
import * as api from '../lib/api';
import { parseProgress, STORAGE_KEY, downloadText } from '../lib/storage';
import type { AcademyProgress } from '../types';
import { Icon } from './Icon';

export function AuthGate({ onAuthenticated, serverError, retry }: { onAuthenticated: (session: api.AccountSession) => void; serverError: string; retry: () => void }) {
  const [legacy] = useState(() => {
    let raw: string | null = null;
    try { raw = localStorage.getItem(STORAGE_KEY); return { raw, progress: raw ? parseProgress(raw) : null, error: '' }; }
    catch { return { raw, progress: null, error: raw ? 'Старая копия повреждена. Скачай исходную запись перед созданием аккаунта; данные не удалены.' : 'Браузер не разрешил прочитать старую копию. Проверь разрешения хранилища перед переносом данных.' }; }
  });
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState(legacy.progress ? 'Hiraoka' : '');
  const [username, setUsername] = useState(legacy.progress ? 'hiraoka' : '');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [migrate, setMigrate] = useState(!!legacy.progress);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (mode === 'register' && password !== confirmation) { setError('Пароли не совпадают.'); return; }
    setBusy(true);
    try {
      const session = mode === 'register' ? await api.register({ username, name, password, ...(migrate && legacy.progress ? { progress: legacy.progress as AcademyProgress } : {}) }) : await api.login({ username, password });
      setPassword(''); setConfirmation(''); onAuthenticated(session);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось войти.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-layout"><section className="auth-intro"><a href="#dashboard" className="auth-brand"><img src="/academy-mark.svg" width="56" height="56" alt="" /><span>frontend<small>ИНЖЕНЕРНАЯ АКАДЕМИЯ</small></span></a><p className="eyebrow">ТВОЙ ПУТЬ · ТВОИ ДАННЫЕ</p><h1>Учись в своём темпе.<br />Продолжай с любого устройства.</h1><p>Аккаунт хранит твои уроки, заметки, попытки и проекты на сервере курса.</p><div className="auth-benefits"><p><Icon name="book" />9 полноценных уроков · карта на 220</p><p><Icon name="bookmark" />Личная рабочая тетрадь и избранное</p><p><Icon name="check" />Практика и честная проверка навыков</p></div><p className="help">Сейчас сервер работает на этом компьютере. Для доступа через интернет размести его по инструкции DEPLOYMENT.md.</p></section><section className="panel auth-card"><div className="auth-modes"><button aria-pressed={mode === 'register'} disabled={busy} onClick={() => { setMode('register'); setError(''); }}>Регистрация</button><button aria-pressed={mode === 'login'} disabled={busy} onClick={() => { setMode('login'); setError(''); }}>Вход</button></div><h2>{mode === 'register' ? 'Создай свой аккаунт' : 'С возвращением'}</h2>{serverError && <div className="alert" role="alert"><p>{serverError}</p><button onClick={retry}>Проверить сервер снова</button></div>}{error && <p className="auth-error" role="alert">{error}</p>}<form onSubmit={submit}><fieldset disabled={busy}>
      {mode === 'register' && <label>Как тебя называть<input required maxLength={80} autoComplete="name" value={name} onChange={event => setName(event.target.value)} /></label>}
      <label>Логин<input required minLength={3} maxLength={32} aria-label="Логин" pattern="[A-Za-z0-9_]{3,32}" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="hiraoka" /><small>Латинские буквы, цифры и _. Регистр не важен.</small></label>
      <label>Пароль<div className="password-field"><input aria-label="Пароль" required minLength={12} maxLength={128} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Скрыть' : 'Показать'}</button></div><small>От 12 символов. Выбери пароль самостоятельно.</small></label>
      {mode === 'register' && <label>Повтори пароль<input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}
      {mode === 'register' && legacy.progress && <div className="migration-choice"><label className="check-item"><input type="checkbox" checked={migrate} onChange={event => setMigrate(event.target.checked)} /><span>Перенести мой текущий прогресс</span></label><p>{migrate ? `Сохраним заметки и статусы. Текущий урок: ${legacy.progress.lastLesson}; пройдено ${Object.values(legacy.progress.lessons).filter(item => item.status === 'passed').length}.` : 'Новый аккаунт начнёт с урока 1. Старая копия остаётся в этом браузере.'}</p></div>}
      <button className="primary auth-submit" type="submit">{busy ? 'Подождите…' : mode === 'register' ? 'Создать аккаунт' : 'Войти в аккаунт'}</button>
    </fieldset></form>{legacy.raw && <button className="text-button" onClick={() => downloadText('frontend-academy-before-account.json', legacy.raw!)}>Скачать старую копию JSON</button>}{legacy.error && <p className="help">{legacy.error}</p>}<p className="help">Пароль проверяется сервером. Очистка браузера не удаляет данные аккаунта; несинхронизированные изменения сохраняются только на текущем устройстве.</p></section></main>;
}

