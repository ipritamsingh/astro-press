/**
 * AstroPress Cloudflare Pages Function: /api/github/*
 *
 * Secure server-side proxy and environment verification for GitHub API operations:
 * - Reads token exclusively from env.GITHUB_PAT secret.
 * - Authenticates admin session against Cloudflare D1.
 * - Validates allowed Git Data API methods and paths.
 * - Supports /api/github/verify-env to diagnose configuration without exposing secrets.
 * - Never leaks or echoes GITHUB_PAT to client, logs, or API responses.
 */

interface Env {
  DB: D1Database;
  GITHUB_PAT?: string;
  ALLOWED_REPO?: string;
}

const REQUIRED_METHODS = ['GET', 'POST', 'PATCH'];
const ALLOWED_PATH = /^\/repos\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)(?:\/git\/(?:ref\/heads\/[A-Za-z0-9._/-]+|refs\/heads\/[A-Za-z0-9._/-]+|commits(?:\/[A-Za-z0-9]+)?|trees(?:\/[A-Za-z0-9]+)?|blobs(?:\/[A-Za-z0-9]+)?))?$/;
const MAX_BODY_BYTES = 30 * 1024 * 1024;
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

function json(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function hashSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 1. Validate HTTP Method
  if (!REQUIRED_METHODS.includes(request.method)) {
    return json({ error: 'Method not allowed.' }, 405);
  }

  // 2. Authenticate Administrator Session in D1
  if (!env.DB) {
    return json({ error: 'Database binding missing.' }, 500);
  }

  const authHeader = request.headers.get('Authorization');
  let rawToken: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  } else {
    rawToken = parseCookie(request.headers.get('Cookie'), 'astropress_session');
  }

  if (!rawToken) {
    return json({ error: 'Unauthorized. Administrator session required.' }, 401);
  }

  const tokenHash = await hashSha256(rawToken);
  const now = Date.now();
  const sessionUser = await env.DB.prepare(
    `SELECT s.id as session_id, u.id as user_id, u.role
     FROM admin_sessions s
     JOIN admin_users u ON s.user_id = u.id
     WHERE s.token_hash = ? AND u.is_active = 1
       AND s.expires_at > ?
       AND datetime(s.last_active_at) > datetime(?, ?)
     LIMIT 1`
  )
    .bind(
      tokenHash,
      new Date(now).toISOString(),
      new Date(now).toISOString(),
      `-${Math.floor(SESSION_IDLE_TIMEOUT_MS / 1000)} seconds`
    )
    .first();

  if (!sessionUser) {
    return json({ error: 'Unauthorized or expired session.' }, 401);
  }

  const url = new URL(request.url);
  const decoded = decodeURIComponent(url.pathname.replace(/^\/api\/github/, '')).replace(/\/{2,}/g, '/');
  if (decoded.includes('..') || decoded.includes('\\')) {
    return json({ error: 'Invalid path.' }, 400);
  }

  const pat = env.GITHUB_PAT?.trim();

  // 3. Special Environment Verification Endpoint: /api/github/verify-env
  if (decoded === '/verify-env' || decoded === '/verify-env/') {
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed. Use GET.' }, 405);
    }

    const owner = (url.searchParams.get('owner') || '').trim();
    const repo = (url.searchParams.get('repo') || '').trim();
    const branch = (url.searchParams.get('branch') || 'main').trim();

    if (!pat) {
      return json(
        {
          configured: false,
          authenticated: true,
          repo: `${owner}/${repo}`,
          branch,
          status: 'missing_config',
          message: 'GitHub PAT secret (GITHUB_PAT) is not configured in Cloudflare environment variables.',
        },
        200
      );
    }

    try {
      // Step A: Test PAT authentication
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
        return json(
          {
            configured: true,
            authenticated: true,
            githubAuth: false,
            repo: `${owner}/${repo}`,
            branch,
            status: 'auth_failed',
            message: 'GITHUB_PAT secret is set, but GitHub rejected it (401 Unauthorized: bad credentials or expired).',
            rateLimit,
          },
          200
        );
      }

      const userData = await userRes.json().catch(() => ({}));
      const githubLogin = userData.login || 'authenticated';

      if (!owner || !repo) {
        return json(
          {
            configured: true,
            authenticated: true,
            githubAuth: true,
            githubUser: githubLogin,
            status: 'no_repo_provided',
            message: `GitHub token verified for user "${githubLogin}". Provide repository owner and name to verify repository permissions.`,
            rateLimit,
          },
          200
        );
      }

      // Step B: Test repository access and push permissions
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AstroPress-CMS-Server',
        },
      });

      if (repoRes.status === 404) {
        return json(
          {
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
          },
          200
        );
      }

      if (repoRes.status === 403) {
        const errBody = await repoRes.json().catch(() => ({}));
        return json(
          {
            configured: true,
            authenticated: true,
            githubAuth: true,
            githubUser: githubLogin,
            repo: `${owner}/${repo}`,
            branch,
            status: 'forbidden',
            message: `Access to "${owner}/${repo}" forbidden (403): ${errBody.message || 'Rate limit or missing token repository permission'}.`,
            rateLimit,
          },
          200
        );
      }

      const repoData = await repoRes.json().catch(() => ({}));
      const permissions = repoData.permissions || { push: true, pull: true, admin: false };
      const hasPush = Boolean(permissions.push);

      // Step C: Test target branch existence
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

      return json(
        {
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
        },
        200
      );
    } catch (err: any) {
      return json(
        {
          configured: true,
          authenticated: true,
          status: 'network_error',
          message: `Network error connecting to GitHub: ${err.message || 'Connection failure'}`,
        },
        502
      );
    }
  }

  // 4. Validate Server-Side PAT Secret for all other proxy routes
  if (!pat) {
    return json({ error: 'GitHub PAT secret (GITHUB_PAT) is not configured on the server.' }, 503);
  }

  // 5. Validate Path against allowed Git Data API endpoints
  const match = ALLOWED_PATH.exec(decoded);
  if (!match) {
    return json({ error: 'Path not allowed.' }, 404);
  }

  // 6. Optional Repository allowlist validation
  if (env.ALLOWED_REPO) {
    const requestedRepo = `${match[1]}/${match[2]}`.toLowerCase();
    if (requestedRepo !== env.ALLOWED_REPO.trim().toLowerCase()) {
      return json({ error: 'Repository not allowed.' }, 403);
    }
  }

  // 7. Upstream proxy request to GitHub API
  const upstreamHeaders = new Headers();
  upstreamHeaders.set('User-Agent', 'AstroPress-CMS-Server');
  upstreamHeaders.set('Accept', request.headers.get('Accept') || 'application/vnd.github.v3+json');
  upstreamHeaders.set('Authorization', `Bearer ${pat}`);
  const contentType = request.headers.get('Content-Type');
  if (contentType) upstreamHeaders.set('Content-Type', contentType);

  let bodyBuffer: ArrayBuffer | null = null;
  if (['POST', 'PATCH'].includes(request.method)) {
    bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > MAX_BODY_BYTES) {
      return json({ error: 'Payload too large.' }, 413);
    }
  }

  const target = `https://api.github.com${decoded}${url.search}`;

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: upstreamHeaders,
      body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
    });

    const responseHeaders = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return json({ error: 'Upstream GitHub request failed.' }, 502);
  }
};
