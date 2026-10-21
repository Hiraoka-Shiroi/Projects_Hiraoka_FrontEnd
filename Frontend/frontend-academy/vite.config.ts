import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { createAcademyApi } from './server/api';
export default defineConfig({
  plugins: [react(), {
    name: 'academy-account-api',
    configureServer(server) {
      const api = createAcademyApi({
        dbPath: process.env.ACADEMY_DB_PATH ?? resolve('data/academy.sqlite'),
        origin: process.env.APP_ORIGIN ?? `http://127.0.0.1:${server.config.server.port}`,
        rateLimit: process.env.NODE_ENV === 'test' && process.env.ACADEMY_TEST_SERVER === '1' ? false : undefined,
      });
      server.httpServer?.once('close', () => api.close());
      server.middlewares.use((request, response, next) => {
        if (request.url === '/api' || request.url?.startsWith('/api/')) { void api.handler(request, response); return; }
        next();
      });
    },
  }],
  server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/**', '**/academy.test-data/**', '**/*.sqlite*', '**/server/**', '**/scripts/**'] } },
  build: { rolldownOptions: { output: { codeSplitting: { groups: [
    { name: 'react-vendor', test: /node_modules/ },
    { name: 'curriculum', test: /curriculum\.json/ },
  ] } } } },
});
