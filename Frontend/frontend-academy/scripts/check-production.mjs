import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

// Run after npm run build; this never opens the learner's database.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = resolve(root, 'academy.test-data');
await mkdir(tempRoot, { recursive: true });
const temporary = await mkdtemp(resolve(tempRoot, 'production-'));
const origin = 'http://127.0.0.1:4176';
let output = '';
const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '4176', APP_ORIGIN: origin, ACADEMY_DB_PATH: resolve(temporary, 'academy.sqlite') },
});
child.stdout.on('data', data => { output += data; });
child.stderr.on('data', data => { output += data; });
const exited = new Promise(resolve => child.once('exit', resolve));
try {
  for (let attempt = 0; attempt < 100 && !output.includes('Frontend Academy:'); attempt++) {
    if (child.exitCode !== null) throw new Error(output);
    await delay(100);
  }
  assert.match(output, /Frontend Academy:/, output);
  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
  const html = await home.text();
  const asset = html.match(/src="(\/assets\/[^"\s]+\.js)"/)[1];
  const javascript = await fetch(origin + asset);
  assert.equal(javascript.status, 200);
  assert.match(javascript.headers.get('content-type'), /javascript/);
  for (const path of ['/data/academy.sqlite', '/server/api.ts', '/src/App.tsx']) assert.equal((await fetch(origin + path)).status, 404);
  const register = await fetch(origin + '/api/auth/register', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Production smoke', username: 'smoke_test', password: 'Production-smoke-password-123!' }),
  });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  const account = await register.json();
  assert.equal(account.progress.lastLesson, 1);
  const me = await fetch(origin + '/api/auth/me', { headers: { Cookie: cookie.split(';')[0] } });
  assert.equal((await me.json()).user.username, 'smoke_test');
  console.log('Production: built UI, JavaScript assets, private paths and real account session passed on isolated port 4176.');
} finally {
  child.kill('SIGTERM'); await exited;
  const checked = resolve(temporary);
  if (!checked.startsWith(tempRoot + sep) || checked === tempRoot) throw new Error('Unsafe test cleanup path.');
  await rm(checked, { recursive: true, force: true });
}
