import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function safeReactIntegration(options) {
  const integration = react(options);
  const origSetup = integration.hooks['astro:config:setup'];
  integration.hooks['astro:config:setup'] = (args) => {
    const customArgs = {
      ...args,
      injectScript: (stage, content) => {
        if (stage === 'before-hydration') {
          return;
        }
        return args.injectScript(stage, content);
      },
    };
    return origSetup(customArgs);
  };
  return integration;
}

function d1AuthPlugin() {
  return {
    name: 'd1-auth-local-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (
          req.url &&
          (req.url.includes('before-hydration') ||
            req.url.includes('astro:scripts') ||
            req.url.includes('@react-refresh'))
        ) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.end(`
export function injectIntoGlobalHook(globalObject) {
  if (typeof window !== 'undefined' && !window.$RefreshReg$) {
    window.$RefreshReg$ = function(type, id) { return type; };
    window.$RefreshSig$ = function() { return function(type) { return type; }; };
  }
}
export function register(type, id) {
  return type;
}
export function createSignatureFunctionForTransform() {
  return function(type) {
    return type;
  };
}
export function registerExportsForReactRefresh(filename, moduleExports) {}
export function validateRefreshBoundaryAndEnqueueUpdate(filename, prevExports, nextExports) {}
export const __hmr_import = (module) => Promise.resolve({});
export function performReactRefresh() {}
export function isLikelyComponentType(type) { return true; }
export function setSignature(type, key, forceReset, getCustomHooks) {}
export function collectCustomHooksForSignature(type) {}
export function getFamilyByType(type) {}
export function getFamilyByID(id) {}
export function hasUnrecoverableErrors() { return false; }

const RefreshRuntime = {
  injectIntoGlobalHook,
  register,
  createSignatureFunctionForTransform,
  registerExportsForReactRefresh,
  validateRefreshBoundaryAndEnqueueUpdate,
  performReactRefresh,
  isLikelyComponentType,
  setSignature,
  collectCustomHooksForSignature,
  getFamilyByType,
  getFamilyByID,
  hasUnrecoverableErrors,
  __hmr_import
};

if (typeof window !== 'undefined') {
  window.RefreshRuntime = RefreshRuntime;
  if (!window.$RefreshReg$) window.$RefreshReg$ = register;
  if (!window.$RefreshSig$) window.$RefreshSig$ = function() { return function(type) { return type; }; };
}

export default RefreshRuntime;
`);
          return;
        }

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
            req.url.startsWith('/api/github') ||
            req.url.startsWith('/api/media') ||
            req.url.startsWith('/api/content') ||
            req.url.startsWith('/api/newsletter'))
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
  devToolbar: {
    enabled: false,
  },
  integrations: [safeReactIntegration()],
  vite: {
    server: {
      cors: true,
      allowedHosts: true,
      ws: {
        protocol: 'wss',
        clientPort: 443,
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'lucide-react',
        'motion',
        'js-yaml',
      ],
    },
    plugins: [tailwindcss(), d1AuthPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
});
