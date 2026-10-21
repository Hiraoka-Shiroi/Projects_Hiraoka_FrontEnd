import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testRoot = resolve(root, 'academy.test-data');
mkdirSync(testRoot, { recursive: true });
const directory = mkdtempSync(join(testRoot, `browser-${process.pid}-`));
process.env.NODE_ENV = 'test';
process.env.ACADEMY_TEST_SERVER = '1';
process.env.ACADEMY_DB_PATH = resolve(directory, 'academy.sqlite');
process.env.APP_ORIGIN = 'http://127.0.0.1:4175';
const server = await createServer({ root, server: { host: '127.0.0.1', port: 4175, strictPort: true } });
await server.listen(); server.printUrls();
let closing = false;
async function close() {
  if (closing) return; closing = true;
  await server.close();
  if (!resolve(directory).startsWith(testRoot + sep)) throw new Error('Некорректный каталог теста.');
  rmSync(directory, { recursive: true, force: true });
}
process.once('SIGINT', () => { void close().then(() => process.exit(0)); });
process.once('SIGTERM', () => { void close().then(() => process.exit(0)); });
