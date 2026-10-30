import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequest } from './d1AuthEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const d1Dir = path.join(rootDir, '.d1');
const dbPath = path.join(d1Dir, 'astropress-db.sqlite');

let localDb: any = null;

export function getLocalD1Database() {
  if (localDb) return localDb;

  if (!fs.existsSync(d1Dir)) {
    fs.mkdirSync(d1Dir, { recursive: true });
  }

  const rawDb = new DatabaseSync(dbPath);

  // Initialize schema from migrations/0001_auth_schema.sql if needed
  const schemaFile = path.join(rootDir, 'migrations', '0001_auth_schema.sql');
  if (fs.existsSync(schemaFile)) {
    const schemaSql = fs.readFileSync(schemaFile, 'utf8');
    rawDb.exec(schemaSql);
  }

  // Wrap rawDb with Cloudflare D1 API interface
  localDb = {
    prepare(sql: string) {
      let boundValues: any[] = [];
      return {
        bind(...values: any[]) {
          boundValues = values.map((v) => (v === undefined ? null : v));
          return this;
        },
        async first<T = any>(colName?: string): Promise<T | null> {
          const stmt = rawDb.prepare(sql);
          const row = stmt.get(...boundValues) as any;
          if (!row) return null;
          if (colName) return row[colName] ?? null;
          return row as T;
        },
        async all<T = any>(): Promise<{ results: T[]; success: boolean }> {
          const stmt = rawDb.prepare(sql);
          const results = stmt.all(...boundValues) as T[];
          return { results, success: true };
        },
        async run<T = any>(): Promise<{ success: boolean; meta: any }> {
          const stmt = rawDb.prepare(sql);
          const meta = stmt.run(...boundValues);
          return { success: true, meta };
        },
      };
    },
    async exec(sql: string) {
      rawDb.exec(sql);
      return { count: 0, duration: 0 };
    },
    async batch(stmts: any[]) {
      const results = [];
      for (const s of stmts) {
        results.push(await s.run());
      }
      return results;
    },
  };

  return localDb;
}

export async function handleLocalAuthRequest(req: any, res: any) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'] || 'localhost:3000';
    const fullUrl = `${protocol}://${host}${req.url}`;

    // Read body if method has body
    let bodyBuffer: Buffer | null = null;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      bodyBuffer = Buffer.concat(chunks);
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value as string);
        }
      }
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body: bodyBuffer && bodyBuffer.length > 0 ? (new Uint8Array(bodyBuffer) as any) : undefined,
    });

    const env = {
      DB: getLocalD1Database(),
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SESSION_SECRET: process.env.SESSION_SECRET,
    };

    const response = await onRequest({
      request: webRequest,
      env,
      functionPath: '/api/auth',
      waitUntil: () => {},
      next: async () => new Response(null, { status: 404 }),
      params: {} as any,
      data: {} as any,
    });

    res.statusCode = response.status;
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const respText = await response.text();
    res.end(respText);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Local D1 Server Error' }));
  }
}

async function verifyAdminSession(req: any): Promise<boolean> {
  try {
    const cookieHeader = req.headers['cookie'] || '';
    const match = cookieHeader.match(/(?:^|;\s*)astropress_session=([^;]*)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const effectiveToken = token || bearerToken;

    if (!effectiveToken) return false;

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(effectiveToken));
    const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const db = getLocalD1Database();
    const session = await db.prepare(
      `SELECT s.id FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.token_hash = ? AND u.is_active = 1 LIMIT 1`
    ).bind(tokenHash).first();

    return Boolean(session);
  } catch {
    return false;
  }
}

export async function handleLocalApiRequest(req: any, res: any) {
  const url = req.url || '';

  // Auth requests
  if (url.startsWith('/api/auth') || url === '/api/auth') {
    return handleLocalAuthRequest(req, res);
  }

  // GitHub Proxy requests
  if (url.startsWith('/api/github')) {
    try {
      const isAuthenticated = await verifyAdminSession(req);
      if (!isAuthenticated) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized. Admin session required.' }));
        return;
      }

      const parsedUrl = new URL(url, 'http://localhost:3000');
      const githubPath = parsedUrl.pathname.replace(/^\/api\/github/, '');
      const pat = process.env.GITHUB_PAT;

      // Special Environment Verification Endpoint: /api/github/verify-env
      if (githubPath === '/verify-env' || githubPath === '/verify-env/') {
        const owner = (parsedUrl.searchParams.get('owner') || '').trim();
        const repo = (parsedUrl.searchParams.get('repo') || '').trim();
        const branch = (parsedUrl.searchParams.get('branch') || 'main').trim();

        if (!pat) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: false,
              authenticated: true,
              repo: `${owner}/${repo}`,
              branch,
              status: 'missing_config',
              message: 'GitHub PAT secret (GITHUB_PAT) is not configured in server environment (.env).',
            })
          );
          return;
        }

        try {
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${pat}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AstroPress-CMS-Server',
            },
          });

          const rateLimit = {
            remaining: userRes.headers.get('x-ratelimit-remaining'),
            limit: userRes.headers.get('x-ratelimit-limit'),
            reset: userRes.headers.get('x-ratelimit-reset'),
          };

          if (userRes.status === 401) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                configured: true,
                authenticated: true,
                githubAuth: false,
                repo: `${owner}/${repo}`,
                branch,
                status: 'auth_failed',
                message: 'GITHUB_PAT secret is set, but GitHub returned 401 Unauthorized (token is invalid or expired).',
                rateLimit,
              })
            );
            return;
          }

          const userData = await userRes.json().catch(() => ({}));
          const githubLogin = userData.login || 'authenticated';

          if (!owner || !repo) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                configured: true,
                authenticated: true,
                githubAuth: true,
                githubUser: githubLogin,
                status: 'no_repo_provided',
                message: `GitHub token verified for user "${githubLogin}". Provide repository owner and name to verify permissions.`,
                rateLimit,
              })
            );
            return;
          }

          const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
              Authorization: `Bearer ${pat}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AstroPress-CMS-Server',
            },
          });

          if (repoRes.status === 404) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                configured: true,
                authenticated: true,
                githubAuth: true,
                githubUser: githubLogin,
                repo: `${owner}/${repo}`,
                branch,
                repoExists: false,
                status: 'repo_not_found',
                message: `Repository "${owner}/${repo}" was not found (404 Not Found). Verify spelling or grant repository access to the token.`,
                rateLimit,
              })
            );
            return;
          }

          if (repoRes.status === 403) {
            const errBody = await repoRes.json().catch(() => ({}));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                configured: true,
                authenticated: true,
                githubAuth: true,
                githubUser: githubLogin,
                repo: `${owner}/${repo}`,
                branch,
                status: 'forbidden',
                message: `Access to "${owner}/${repo}" forbidden (403): ${errBody.message || 'Rate limit or missing token repository permission'}.`,
                rateLimit,
              })
            );
            return;
          }

          const repoData = await repoRes.json().catch(() => ({}));
          const permissions = repoData.permissions || { push: true, pull: true, admin: false };
          const hasPush = Boolean(permissions.push);

          const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
            headers: {
              Authorization: `Bearer ${pat}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AstroPress-CMS-Server',
            },
          });

          let branchExists = false;
          let headSha: string | null = null;
          if (branchRes.ok) {
            branchExists = true;
            const branchData = await branchRes.json().catch(() => ({}));
            headSha = branchData.object?.sha || null;
          }

          let status = 'verified';
          let message = `Edge environment, GitHub token, and repository "${owner}/${repo}" (${branch}) verified successfully with push permissions.`;

          if (!hasPush) {
            status = 'no_push_permission';
            message = `Connected to repository "${owner}/${repo}", but token lacks push/write permissions. Fine-grained PAT needs "Contents: Read and write" access.`;
          } else if (!branchExists) {
            status = 'branch_not_found';
            message = `Connected to "${owner}/${repo}", but target branch "${branch}" was not found. Default branch is "${repoData.default_branch || 'main'}".`;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: true,
              authenticated: true,
              githubAuth: true,
              githubUser: githubLogin,
              repo: repoData.full_name || `${owner}/${repo}`,
              branch,
              repoExists: true,
              isPrivate: Boolean(repoData.private),
              defaultBranch: repoData.default_branch || 'main',
              hasPushPermission: hasPush,
              branchExists,
              headSha: headSha ? headSha.substring(0, 7) : null,
              rateLimit,
              status,
              message,
            })
          );
          return;
        } catch (err: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: true,
              authenticated: true,
              status: 'network_error',
              message: `Network error connecting to GitHub: ${err.message || 'Connection failure'}`,
            })
          );
          return;
        }
      }

      if (!pat) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'GitHub PAT secret (GITHUB_PAT) is not configured on the server.' }));
        return;
      }

      const ALLOWED_METHODS = ['GET', 'POST', 'PATCH'];
      if (!ALLOWED_METHODS.includes(req.method)) {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed.' }));
        return;
      }

      const ALLOWED_PATH = /^\/repos\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)(?:\/git\/(?:ref\/heads\/[A-Za-z0-9._/-]+|refs\/heads\/[A-Za-z0-9._/-]+|commits(?:\/[A-Za-z0-9]+)?|trees(?:\/[A-Za-z0-9]+)?|blobs(?:\/[A-Za-z0-9]+)?))?$/;
      if (!ALLOWED_PATH.test(githubPath)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'GitHub API path not allowed.' }));
        return;
      }

      let bodyBuffer: Buffer | null = null;
      if (['POST', 'PATCH'].includes(req.method)) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        bodyBuffer = Buffer.concat(chunks);
      }

      const targetUrl = `https://api.github.com${githubPath}${parsedUrl.search}`;
      const upstreamRes = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': req.headers['accept'] || 'application/vnd.github.v3+json',
          'User-Agent': 'AstroPress-CMS-Server',
          ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}),
        },
        body: bodyBuffer && bodyBuffer.length > 0 ? new Uint8Array(bodyBuffer) : undefined,
      });

      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      const text = await upstreamRes.text();
      res.end(text);
      return;
    } catch (err: any) {
      console.error('[GitHub Proxy Error]', err);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Upstream GitHub request failed.' }));
      return;
    }
  }

  // Media upload endpoint
  if (url.startsWith('/api/media/upload') && req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const body = JSON.parse(rawBody);

      const filename = body.filename || `upload-${Date.now()}.webp`;
      const dataUrl = body.dataUrl || '';

      if (!dataUrl) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing image dataUrl' }));
        return;
      }

      // Extract base64 part
      const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      const base64Data = matches ? matches[2] : dataUrl;
      const fileBuffer = Buffer.from(base64Data, 'base64');

      const uploadsDir = path.join(rootDir, 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, fileBuffer);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          url: `/uploads/${filename}`,
          name: filename,
        })
      );
      return;
    } catch (err: any) {
      console.error('[Media Upload Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to save media asset' }));
      return;
    }
  }

  // Content publish endpoint
  if (url.startsWith('/api/content/publish') && req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const body = JSON.parse(rawBody);

      const slug = body.slug;
      const previousSlug = body.previousSlug;
      const isPage = Boolean(body.isPage);
      const content = body.content || '';

      if (!slug || !content) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing slug or content' }));
        return;
      }

      const targetDir = isPage
        ? path.join(rootDir, 'src', 'content', 'pages')
        : path.join(rootDir, 'src', 'content', 'posts');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // If slug was renamed, clean up previous file on disk
      if (previousSlug && previousSlug !== slug) {
        const oldPath = path.join(targetDir, `${previousSlug}.md`);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {}
        }
      }

      const filePath = path.join(targetDir, `${slug}.md`);
      fs.writeFileSync(filePath, content, 'utf8');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          filePath: isPage ? `src/content/pages/${slug}.md` : `src/content/posts/${slug}.md`,
        })
      );
      return;
    } catch (err: any) {
      console.error('[Content Publish Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to write content file' }));
      return;
    }
  }

  // Content delete endpoint
  if (url.startsWith('/api/content/delete') && req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const body = JSON.parse(rawBody);

      const slug = body.slug;
      const isPage = Boolean(body.isPage);

      if (slug) {
        const targetDir = isPage
          ? path.join(rootDir, 'src', 'content', 'pages')
          : path.join(rootDir, 'src', 'content', 'posts');
        const filePath = path.join(targetDir, `${slug}.md`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    } catch (err: any) {
      console.error('[Content Delete Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to delete content file' }));
      return;
    }
  }

  // Newsletter Subscribe Endpoint
  if (url.startsWith('/api/newsletter/subscribe') && req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const body = JSON.parse(rawBody);

      const email = (body.email || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !emailRegex.test(email)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Please enter a valid email address.' }));
        return;
      }

      const db = getLocalD1Database();
      await db.exec(`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          subscribed_at TEXT NOT NULL
        )
      `);

      const existing = await db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').bind(email).first();
      if (existing) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: 'You are already subscribed to the newsletter!', duplicate: true }));
        return;
      }

      const id = 'sub-' + Date.now();
      const subscribedAt = new Date().toISOString();
      await db.prepare('INSERT INTO newsletter_subscribers (id, email, status, subscribed_at) VALUES (?, ?, ?, ?)').bind(id, email, 'active', subscribedAt).run();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Thanks for subscribing to The Headless Dispatch!' }));
      return;
    } catch (err: any) {
      console.error('[Newsletter Subscribe Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to process subscription' }));
      return;
    }
  }

  // Newsletter List Subscribers Endpoint
  if (url.startsWith('/api/newsletter/subscribers') && req.method === 'GET') {
    try {
      const db = getLocalD1Database();
      await db.exec(`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          subscribed_at TEXT NOT NULL
        )
      `);

      const { results } = await db.prepare('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC').all();
      const subscribers = (results || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        status: row.status,
        subscribedAt: row.subscribed_at,
      }));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, subscribers }));
      return;
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to fetch subscribers' }));
      return;
    }
  }

  // Newsletter Delete / Unsubscribe Endpoint
  if (url.startsWith('/api/newsletter/subscribers') && req.method === 'DELETE') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const body = JSON.parse(rawBody);
      const id = body.id || '';
      const email = body.email || '';

      const db = getLocalD1Database();
      if (id) {
        await db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').bind(id).run();
      } else if (email) {
        await db.prepare('DELETE FROM newsletter_subscribers WHERE email = ?').bind(email).run();
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to delete subscriber' }));
      return;
    }
  }

  // Content sync/list endpoint: Reads all disk posts, pages, data files and uploads
  if (url.startsWith('/api/content/all') && req.method === 'GET') {
    try {
      const postsDir = path.join(rootDir, 'src', 'content', 'posts');
      const pagesDir = path.join(rootDir, 'src', 'content', 'pages');
      const posts: Array<{ filename: string; slug: string; content: string }> = [];
      const pages: Array<{ filename: string; slug: string; content: string }> = [];

      if (fs.existsSync(postsDir)) {
        const postFiles = fs.readdirSync(postsDir);
        for (const f of postFiles) {
          if (f.endsWith('.md')) {
            const raw = fs.readFileSync(path.join(postsDir, f), 'utf8');
            posts.push({ filename: f, slug: f.replace(/\.md$/, ''), content: raw });
          }
        }
      }

      if (fs.existsSync(pagesDir)) {
        const pageFiles = fs.readdirSync(pagesDir);
        for (const f of pageFiles) {
          if (f.endsWith('.md')) {
            const raw = fs.readFileSync(path.join(pagesDir, f), 'utf8');
            pages.push({ filename: f, slug: f.replace(/\.md$/, ''), content: raw });
          }
        }
      }

      // Read json configs if present
      const readJsonSafe = (p: string) => {
        try {
          if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
        } catch (e) {}
        return null;
      };

      const categories = readJsonSafe(path.join(rootDir, 'src', 'data', 'categories.json'));
      const authors = readJsonSafe(path.join(rootDir, 'src', 'data', 'authors.json'));
      const heroConfig = readJsonSafe(path.join(rootDir, 'src', 'data', 'heroConfig.json'));
      const themeSettings = readJsonSafe(path.join(rootDir, 'src', 'data', 'themeSettings.json'));
      const menus = readJsonSafe(path.join(rootDir, 'src', 'data', 'menus.json'));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          posts,
          pages,
          categories: categories?.categories,
          tags: categories?.tags,
          authors,
          heroConfig,
          themeSettings,
          menus,
        })
      );
      return;
    } catch (err: any) {
      console.error('[Content All Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to list content' }));
      return;
    }
  }

  // Write synced remote content back to local disk (ONLY if changed)
  if (url.startsWith('/api/content/sync-disk') && req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const body = JSON.parse(rawBody);
      const files: Array<{ path: string; content: string }> = body.files || [];

      let updatedCount = 0;
      for (const file of files) {
        if (!file.path || typeof file.content !== 'string') continue;
        const targetPath = path.join(rootDir, file.path);
        const targetDir = path.dirname(targetPath);

        let existingContent = '';
        if (fs.existsSync(targetPath)) {
          try {
            existingContent = fs.readFileSync(targetPath, 'utf8');
          } catch (e) {}
        }

        // Only write if content actually changed on disk!
        if (existingContent !== file.content) {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.writeFileSync(targetPath, file.content, 'utf8');
          updatedCount++;
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, count: files.length, updated: updatedCount }));
      return;
    } catch (err: any) {
      console.error('[Content Sync Disk Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Failed to sync content to disk' }));
      return;
    }
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
}

