import { randomBytes, randomUUID, scrypt, createHash, timingSafeEqual } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { initialProgress } from '../src/lib/progress';
import { parseProgress } from '../src/lib/storage';
import type { AcademyProgress } from '../src/types';

const SESSION_SECONDS = 7 * 24 * 60 * 60;
const MAX_BODY = 6 * 1024 * 1024;
const COOKIE = 'academy_session';
const SCRYPT_OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
type UserRow = { id: string; username: string; name: string; password_hash: string; password_salt: string; progress: string; revision: number };
export interface ApiOptions {
  dbPath: string;
  origin?: string;
  /** Disabling the limiter is supported only in isolated NODE_ENV=test runs. */
  rateLimit?: false | { maxAttempts?: number; windowMs?: number };
}
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
function publicUser(user: UserRow) { return { id: user.id, username: user.username, name: user.name }; }
function sessionHash(token: string): string { return createHash('sha256').update(token).digest('hex'); }
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function invalid(message: string): never { throw new HttpError(400, message); }
function validatedProgress(value: unknown): AcademyProgress {
  try { return parseProgress(JSON.stringify(value)); }
  catch (error) { return invalid(error instanceof Error ? error.message : 'Некорректные данные прогресса.'); }
}
async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Ожидается JSON.');
  const length = Number(request.headers['content-length']);
  if (Number.isFinite(length) && length > MAX_BODY) throw new HttpError(413, 'Запрос превышает 6 МБ.');
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY) throw new HttpError(413, 'Запрос превышает 6 МБ.');
    chunks.push(bytes);
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!object(parsed)) return invalid('Ожидается объект JSON.');
    return parsed;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    return invalid('Некорректный JSON.');
  }
}
function credentials(body: Record<string, unknown>, register: boolean) {
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!/^[a-z0-9_]{3,32}$/.test(username)) invalid('Логин: 3–32 латинских буквы, цифры или знак _.');
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) invalid('Пароль должен содержать от 12 до 128 символов.');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (register && (!name || name.length > 80)) invalid('Имя должно содержать от 1 до 80 символов.');
  return { username, password: body.password as string, name };
}

export function createAcademyApi(options: ApiOptions) {
  const appOrigin = new URL(options.origin ?? 'http://127.0.0.1:4173').origin;
  const secure = new URL(appOrigin).protocol === 'https:';
  if (!['http:', 'https:'].includes(new URL(appOrigin).protocol)) throw new Error('APP_ORIGIN должен быть адресом HTTP или HTTPS.');
  if (options.rateLimit === false && process.env.NODE_ENV !== 'test') throw new Error('Отключение лимита входа разрешено только в NODE_ENV=test.');
  const dbPath = resolve(options.dbPath);
  mkdirSync(dirname(dbPath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(dbPath);
  if (process.platform !== 'win32') chmodSync(dbPath, 0o600);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
    progress TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
  ); CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL
  ); CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);`);
  const getUser = db.prepare('SELECT * FROM users WHERE username = ?');
  const getSession = db.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?');
  const insertUser = db.prepare('INSERT INTO users (id,username,name,password_hash,password_salt,progress,created_at) VALUES (?,?,?,?,?,?,?)');
  const insertSession = db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)');
  const updateProgress = db.prepare('UPDATE users SET progress = ?, revision = revision + 1 WHERE id = ? AND revision = ?');
  const rates = new Map<string, { count: number; expires: number }>();
  const rateMax = options.rateLimit ? options.rateLimit.maxAttempts ?? 12 : 12;
  const rateWindow = options.rateLimit ? options.rateLimit.windowMs ?? 15 * 60 * 1000 : 15 * 60 * 1000;
  let hashJobs = 0;
  async function hashPassword(password: string, salt: string) {
    // Each scrypt job uses about 128 MiB; bound expensive work even under concurrent requests.
    if (hashJobs >= 2) throw new HttpError(503, 'Сервер занят. Попробуйте вход через несколько секунд.');
    hashJobs++;
    try {
      return await new Promise<Buffer>((resolveHash, reject) => {
        scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, key) => error ? reject(error) : resolveHash(key));
      });
    } finally { hashJobs--; }
  }
  function rateLimit(request: IncomingMessage, response: ServerResponse) {
    if (options.rateLimit === false) return;
    const now = Date.now();
    for (const [key, entry] of rates) if (entry.expires <= now) rates.delete(key);
    const key = request.socket.remoteAddress ?? 'unknown';
    let entry = rates.get(key);
    if (!entry) {
      if (rates.size >= 5000) { response.setHeader('Retry-After', '60'); throw new HttpError(429, 'Слишком много попыток входа. Повторите позже.'); }
      entry = { count: 0, expires: now + rateWindow }; rates.set(key, entry);
    }
    entry.count++;
    if (entry.count > rateMax) {
      response.setHeader('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
      throw new HttpError(429, 'Слишком много попыток входа. Повторите позже.');
    }
  }
  function tokenFrom(request: IncomingMessage) {
    const value = request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
  }
  function cookie(response: ServerResponse, token: string, maxAge = SESSION_SECONDS) {
    response.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`);
  }
  function userFrom(request: IncomingMessage) {
    const token = tokenFrom(request);
    return token ? getSession.get(sessionHash(token), Date.now()) as UserRow | undefined : undefined;
  }
  function newSession(response: ServerResponse, user: UserRow) {
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    const token = randomBytes(32).toString('hex');
    insertSession.run(sessionHash(token), user.id, Date.now() + SESSION_SECONDS * 1000);
    cookie(response, token);
    return { user: publicUser(user), progress: parseProgress(user.progress), revision: user.revision };
  }
  function send(response: ServerResponse, status: number, payload: unknown) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(payload));
  }
  async function dispatch(request: IncomingMessage, response: ServerResponse) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    if (secure) response.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const path = request.url?.split('?')[0]; const method = request.method;
    const requestOrigin = request.headers.origin;
    if ((method !== 'GET' && requestOrigin !== appOrigin) || (requestOrigin && requestOrigin !== appOrigin) || request.headers['sec-fetch-site'] === 'cross-site')
      throw new HttpError(403, 'Запрос должен исходить с сайта курса.');
    if (path === '/api/auth/me' && method === 'GET') {
      const user = userFrom(request);
      return send(response, 200, user ? { user: publicUser(user), progress: parseProgress(user.progress), revision: user.revision } : { user: null });
    }
    if (path === '/api/auth/register' && method === 'POST') {
      rateLimit(request, response);
      const body = await readBody(request); const fields = credentials(body, true);
      const progress = body.progress === undefined ? initialProgress('beginner') : validatedProgress(body.progress);
      if (getUser.get(fields.username)) throw new HttpError(409, 'Этот логин уже занят.');
      const salt = randomBytes(16).toString('hex'); const hash = await hashPassword(fields.password, salt);
      const id = randomUUID();
      try { insertUser.run(id, fields.username, fields.name, hash.toString('hex'), salt, JSON.stringify(progress), Date.now()); }
      catch (error) {
        if (getUser.get(fields.username)) throw new HttpError(409, 'Этот логин уже занят.');
        throw error;
      }
      return send(response, 201, newSession(response, getUser.get(fields.username) as UserRow));
    }
    if (path === '/api/auth/login' && method === 'POST') {
      rateLimit(request, response);
      const fields = credentials(await readBody(request), false);
      const user = getUser.get(fields.username) as UserRow | undefined;
      // Missing users still pay the same hashing cost; do not reveal whether a login exists.
      const hash = await hashPassword(fields.password, user?.password_salt ?? '00000000000000000000000000000000');
      if (!user || !timingSafeEqual(hash, Buffer.from(user.password_hash, 'hex'))) throw new HttpError(401, 'Неверный логин или пароль.');
      const previousToken = tokenFrom(request);
      if (previousToken) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sessionHash(previousToken));
      return send(response, 200, newSession(response, user));
    }
    if (path === '/api/auth/logout' && method === 'POST') {
      const token = tokenFrom(request);
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sessionHash(token));
      cookie(response, '', 0); return send(response, 200, { ok: true });
    }
    if (path === '/api/progress' && (method === 'GET' || method === 'PUT')) {
      const user = userFrom(request);
      if (!user) throw new HttpError(401, 'Войдите в аккаунт, чтобы сохранить прогресс.');
      if (method === 'GET') return send(response, 200, { progress: parseProgress(user.progress), revision: user.revision });
      const body = await readBody(request);
      if (!Number.isSafeInteger(body.revision) || Number(body.revision) < 0) invalid('Некорректная версия прогресса.');
      const progress = validatedProgress(body.progress);
      progress.updatedAt = new Date().toISOString();
      const result = updateProgress.run(JSON.stringify(progress), user.id, body.revision as number);
      if (result.changes !== 1) throw new HttpError(409, 'Прогресс изменился в другой вкладке или на другом устройстве. Загрузите серверную версию; ваши изменения остаются в локальной копии.');
      return send(response, 200, { progress, revision: Number(body.revision) + 1 });
    }
    if (['/api/auth/me', '/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/progress'].includes(path ?? '')) {
      response.setHeader('Allow', path === '/api/auth/me' ? 'GET' : path === '/api/progress' ? 'GET, PUT' : 'POST');
      throw new HttpError(405, 'Метод не поддерживается.');
    }
    throw new HttpError(404, 'API не найден.');
  }
  return {
    handler(request: IncomingMessage, response: ServerResponse) {
      return dispatch(request, response).catch(error => {
        if (response.headersSent) { response.end(); return; }
        if (error instanceof HttpError) send(response, error.status, { error: error.message });
        else { console.error('Academy API:', error instanceof Error ? error.message : 'Internal error'); send(response, 500, { error: 'Не удалось выполнить запрос. Повторите позже.' }); }
      });
    },
    close() { db.close(); },
  };
}
