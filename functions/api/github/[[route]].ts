/**
 * AstroPress Cloudflare Pages Function: /api/github/*
 *
 * Secure server-side proxy for GitHub API operations:
 * - Reads token exclusively from env.GITHUB_PAT secret.
 * - Authenticates admin session against Cloudflare D1.
 * - Validates allowed Git Data API methods and paths.
 * - Never leaks or echoes GITHUB_PAT to client or API responses.
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

  // 2. Validate Server-Side PAT Secret
  const pat = env.GITHUB_PAT;
  if (!pat) {
    return json({ error: 'GitHub PAT secret (GITHUB_PAT) is not configured on the server.' }, 503);
  }

  // 3. Authenticate Administrator Session in D1
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

  // 4. Validate Path
  const url = new URL(request.url);
  const decoded = decodeURIComponent(url.pathname.replace(/^\/api\/github/, '')).replace(/\/{2,}/g, '/');
  if (decoded.includes('..') || decoded.includes('\\')) {
    return json({ error: 'Invalid path.' }, 400);
  }

  const match = ALLOWED_PATH.exec(decoded);
  if (!match) {
    return json({ error: 'Path not allowed.' }, 404);
  }

  // 5. Optional Repository allowlist validation
  if (env.ALLOWED_REPO) {
    const requestedRepo = `${match[1]}/${match[2]}`.toLowerCase();
    if (requestedRepo !== env.ALLOWED_REPO.trim().toLowerCase()) {
      return json({ error: 'Repository not allowed.' }, 403);
    }
  }

  // 6. Upstream proxy request to GitHub API
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
