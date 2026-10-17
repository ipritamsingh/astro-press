import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function d1AuthPlugin() {
  return {
    name: 'd1-auth-local-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/debug-fetch')) {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            console.log('[BROWSER FETCH DESCRIPTOR]', body);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          });
          return;
        }

        if (
          req.url &&
          (req.url.startsWith('/api/auth') ||
            req.url.startsWith('/api/media') ||
            req.url.startsWith('/api/content'))
        ) {
          try {
            const { handleLocalApiRequest } = await import('./src/server/localD1Server.ts');
            await handleLocalApiRequest(req, res);
            return;
          } catch (err) {
            console.error('[Local API Plugin Error]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            return;
          }
        }
        next();
      });
    },
  };
}

// Canonical origin for the build. Sourced from the admin-controlled
// src/data/siteSettings.json so the production domain is managed from the
// dashboard (Admin -> Settings -> SEO) and republished, rather than being
// hardcoded here. Without this, Astro has no site origin and every canonical
// URL and og:url was emitted as http://localhost:3000/... at build time.
function readSiteUrl() {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'src/data/siteSettings.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const url = typeof parsed?.siteUrl === 'string' ? parsed.siteUrl.trim() : '';
    return url ? url.replace(/\/+$/, '') : undefined;
  } catch {
    return undefined;
  }
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  ...(readSiteUrl() ? { site: readSiteUrl() } : {}),
  server: {
    port: 3000,
    host: true,
  },
  // NOTE: a previous `redirects: { '/admin': '/admin/index.html' }` entry was
  // removed. Under `output: 'static'` it emitted a meta-refresh page at
  // dist/admin/index.html, the exact path that public/admin/index.html (the
  // Sveltia CMS shell) is copied to, so three artifacts competed for one output
  // file. The redirect never won and only created a fragile collision.
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), d1AuthPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
});
