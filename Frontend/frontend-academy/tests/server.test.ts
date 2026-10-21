import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createAcademyApi, type ApiOptions } from '../server/api';
import { initialProgress } from '../src/lib/progress';
import type { AccountSession, ServerProgress } from '../src/lib/api';

const testRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'academy.test-data');
const password = 'Safe-test-password-123!';
async function start(dbPath: string, rateLimit?: ApiOptions['rateLimit']) {
  let api: ReturnType<typeof createAcademyApi>;
  const server = createServer((request, response) => { void api.handler(request, response); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  api = createAcademyApi({ dbPath, origin, rateLimit });
  async function call(path: string, body?: unknown, cookie?: string, method = body === undefined ? 'GET' : 'POST', headers?: Record<string, string>) {
    const response = await fetch(`${origin}/api${path}`, {
      method,
      headers: { Origin: origin, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const value = await response.json();
    return { status: response.status, body: value, cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  }
  return { origin, call, server, close: async () => { await closeServer(server); api.close(); } };
}
async function closeServer(server: Server) { const done = once(server, 'close'); server.close(); server.closeIdleConnections(); await done; }
function tempDirectory() { mkdirSync(testRoot, { recursive: true }); return mkdtempSync(join(testRoot, 'server-')); }
function removeDirectory(path: string) { assert.ok(resolve(path).startsWith(testRoot + sep)); rmSync(path, { recursive: true, force: true }); }

test('server-backed accounts preserve isolated progress and protect credentials', async t => {
  const directory = tempDirectory(); const dbPath = join(directory, 'academy.sqlite');
  let app = await start(dbPath);
  let student: AccountSession; let firstCookie = ''; let secondCookie = '';
  try {
    await t.test('guest session and authenticated progress have distinct behavior', async () => {
      assert.deepEqual((await app.call('/auth/me')).body, { user: null });
      assert.equal((await app.call('/progress')).status, 401);
      assert.equal((await app.call('/progress')).headers.get('cache-control'), 'no-store');
    });
    await t.test('registration creates a real beginner account and HttpOnly session', async () => {
      const result = await app.call('/auth/register', { username: 'Student_1', name: 'Ученик', password });
      assert.equal(result.status, 201); assert.ok(result.cookie); firstCookie = result.cookie;
      student = result.body;
      assert.match(student.user.id, /^[0-9a-f-]{36}$/); assert.equal(student.user.username, 'student_1');
      assert.equal(student.user.name, 'Ученик'); assert.equal(student.revision, 0);
      assert.equal(student.progress.lastLesson, 1); assert.equal(student.progress.lessons[1].status, 'in_progress');
      for (let id = 2; id <= 9; id++) assert.equal(student.progress.lessons[id].status, 'not_started');
      assert.match(result.headers.get('set-cookie')!, /HttpOnly/); assert.match(result.headers.get('set-cookie')!, /SameSite=Lax/);
      assert.equal(Object.hasOwn(student.user, 'password_hash'), false);
      assert.equal((await app.call('/auth/me', undefined, firstCookie)).body.user.id, student.user.id);
    });
    await t.test('explicit migration carries original progress into another account', async () => {
      const existing = initialProgress(); existing.lessons[9].notes = 'Мои прежние заметки';
      const result = await app.call('/auth/register', { username: 'owner_2', name: 'Владелец', password, progress: existing });
      assert.equal(result.status, 201); secondCookie = result.cookie!;
      assert.equal(result.body.progress.lessons[1].status, 'passed');
      assert.equal(result.body.progress.lessons[9].notes, 'Мои прежние заметки');
      assert.notEqual(result.body.user.id, student.user.id);
    });
    await t.test('password rules and duplicate case-insensitive logins reject cleanly', async () => {
      assert.equal((await app.call('/auth/register', { username: 'weak_1', name: 'Имя', password: 'short' })).status, 400);
      assert.equal((await app.call('/auth/register', { username: 'weak_1', name: 'Имя', password: 'a'.repeat(129) })).status, 400);
      assert.equal((await app.call('/auth/register', { username: 'bad login', name: 'Имя', password })).status, 400);
      assert.equal((await app.call('/auth/register', { username: 'STUDENT_1', name: 'Другое имя', password })).status, 409);
    });
    await t.test('server stores only scrypt hashes and hashed random session tokens', () => {
      const db = new DatabaseSync(dbPath, { readOnly: true });
      try {
        const user = db.prepare('SELECT password_hash,password_salt FROM users WHERE username = ?').get('student_1')!;
        assert.match(String(user.password_hash), /^[0-9a-f]{128}$/); assert.match(String(user.password_salt), /^[0-9a-f]{32}$/);
        assert.notEqual(user.password_hash, password);
        const token = firstCookie.split('=')[1];
        assert.match(token, /^[0-9a-f]{64}$/);
        assert.equal(db.prepare('SELECT count(*) AS total FROM sessions WHERE token_hash = ?').get(token)!.total, 0);
        assert.equal(db.prepare('SELECT count(*) AS total FROM sessions').get()!.total, 2);
      } finally { db.close(); }
    });
    await t.test('incorrect credentials use one generic error', async () => {
      const wrong = await app.call('/auth/login', { username: 'student_1', password: 'incorrect-password' });
      const unknown = await app.call('/auth/login', { username: 'unknown_1', password: 'incorrect-password' });
      assert.equal(wrong.status, 401); assert.equal(unknown.status, 401); assert.deepEqual(wrong.body, unknown.body);
    });
    await t.test('same-origin checks prevent cross-site mutation and login', async () => {
      const login = { username: 'student_1', password };
      assert.equal((await app.call('/auth/login', login, undefined, 'POST', { Origin: 'https://attacker.example' })).status, 403);
      assert.equal((await app.call('/auth/login', login, undefined, 'POST', { Origin: '' })).status, 403);
      assert.equal((await app.call('/auth/logout', undefined, firstCookie, 'POST', { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
      assert.equal((await app.call('/auth/me', undefined, firstCookie, 'GET', { Origin: 'https://attacker.example' })).status, 403);
    });
    await t.test('revision compare-and-swap rejects stale writes without losing data', async () => {
      const progress = structuredClone(student.progress); progress.lessons[1].notes = 'Сохранено с первого устройства';
      const saved = await app.call('/progress', { progress, revision: 0 }, firstCookie, 'PUT');
      assert.equal(saved.status, 200); assert.equal(saved.body.revision, 1);
      const stale = structuredClone(progress); stale.lessons[1].notes = 'Устаревшее второе устройство';
      assert.equal((await app.call('/progress', { progress: stale, revision: 0 }, firstCookie, 'PUT')).status, 409);
      const current = (await app.call('/progress', undefined, firstCookie)).body as ServerProgress;
      assert.equal(current.revision, 1); assert.equal(current.progress.lessons[1].notes, 'Сохранено с первого устройства');
      assert.equal((await app.call('/progress', undefined, secondCookie)).body.progress.lessons[9].notes, 'Мои прежние заметки');
    });
    await t.test('invalid progress and revisions reject without updating the database', async () => {
      const invalid = structuredClone(student.progress); invalid.lessons[9].status = 'passed';
      assert.equal((await app.call('/progress', { progress: invalid, revision: 1 }, firstCookie, 'PUT')).status, 400);
      assert.equal((await app.call('/progress', { progress: student.progress, revision: -1 }, firstCookie, 'PUT')).status, 400);
      assert.equal((await app.call('/progress', { progress: { schemaVersion: 2 }, revision: 1 }, firstCookie, 'PUT')).status, 400);
      assert.equal((await app.call('/progress', undefined, firstCookie)).body.revision, 1);
    });
    await t.test('body limits and HTTP methods reject oversized or unsupported requests', async () => {
      assert.equal((await app.call('/auth/register', { unused: 'x'.repeat(6 * 1024 * 1024 + 1) })).status, 413);
      assert.equal((await app.call('/auth/me', undefined, undefined, 'POST')).status, 405);
      assert.equal((await app.call('/missing')).status, 404);
    });
    await t.test('SQLite progress and sessions survive server restart', async () => {
      await app.close(); app = await start(dbPath);
      const me = await app.call('/auth/me', undefined, firstCookie);
      assert.equal(me.body.user.id, student.user.id); assert.equal(me.body.revision, 1);
      assert.equal(me.body.progress.lessons[1].notes, 'Сохранено с первого устройства');
    });
    await t.test('logout revokes server session; fresh login restores account progress', async () => {
      const result = await app.call('/auth/logout', undefined, firstCookie, 'POST');
      assert.equal(result.status, 200); assert.match(result.headers.get('set-cookie')!, /Max-Age=0/);
      assert.deepEqual((await app.call('/auth/me', undefined, firstCookie)).body, { user: null });
      assert.equal((await app.call('/progress', undefined, firstCookie)).status, 401);
      const logged = await app.call('/auth/login', { username: 'student_1', password });
      assert.equal(logged.status, 200); assert.notEqual(logged.cookie, firstCookie);
      assert.equal(logged.body.progress.lessons[1].notes, 'Сохранено с первого устройства');
      firstCookie = logged.cookie!;
    });
    await t.test('expired sessions cannot access personal progress', async () => {
      const db = new DatabaseSync(dbPath);
      try { db.prepare('UPDATE sessions SET expires_at = ?').run(Date.now() - 1); } finally { db.close(); }
      assert.deepEqual((await app.call('/auth/me', undefined, firstCookie)).body, { user: null });
      assert.equal((await app.call('/progress', undefined, secondCookie)).status, 401);
    });
  } finally { await app.close(); removeDirectory(directory); }
});

test('login and registration share a bounded IP attempt limit', async () => {
  const directory = tempDirectory(); const app = await start(join(directory, 'rate.sqlite'), { maxAttempts: 2, windowMs: 60_000 });
  try {
    const invalid = { username: 'rate_user', name: 'Имя', password: 'short' };
    assert.equal((await app.call('/auth/register', invalid)).status, 400);
    assert.equal((await app.call('/auth/login', invalid)).status, 400);
    const limited = await app.call('/auth/register', invalid);
    assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 0);
  } finally { await app.close(); removeDirectory(directory); }
});
