import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAcademyApi } from './api';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '127.0.0.1';
const origin = process.env.APP_ORIGIN ?? `http://127.0.0.1:${port}`;
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT должен быть числом от 1 до 65535.');
const api = createAcademyApi({ dbPath: process.env.ACADEMY_DB_PATH ?? resolve(root, 'data', 'academy.sqlite'), origin });
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  let path: string;
  try { path = decodeURIComponent(new URL(request.url ?? '/', origin).pathname); }
  catch { response.writeHead(400); response.end('Некорректный адрес.'); return; }
  if (path === '/api' || path.startsWith('/api/')) { await api.handler(request, response); return; }
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (origin.startsWith('https://')) response.setHeader('Strict-Transport-Security', 'max-age=31536000');
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  let filename = resolve(dist, `.${path}`);
  if (filename !== dist && !filename.startsWith(dist + sep)) { response.writeHead(403); response.end(); return; }
  // Only the built dist directory is served; the database and sources are never public.
  try {
    let info = await stat(filename).catch(() => null);
    if (!info?.isFile()) {
      if (extname(path) || path.startsWith('/data/') || path.startsWith('/server/')) { response.writeHead(404); response.end(); return; }
      filename = resolve(dist, 'index.html'); info = await stat(filename);
    }
    response.writeHead(200, {
      'Content-Type': mime[extname(filename)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (request.method === 'HEAD') { response.end(); return; }
    createReadStream(filename).on('error', () => response.destroy()).pipe(response);
  } catch { response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Сначала выполните npm.cmd run build.'); }
});
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.listen(port, host, () => console.log(`Frontend Academy: ${origin} (server ${host}:${port})`));
function shutdown() { server.close(() => { api.close(); process.exit(0); }); server.closeIdleConnections(); }
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
