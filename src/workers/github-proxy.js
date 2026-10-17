/**
 * AstroPress GitHub API proxy (Cloudflare Worker)
 *
 * ---------------------------------------------------------------------------
 * STATUS: NOT CURRENTLY DEPLOYED. Retained only as a hardened reference.
 * ---------------------------------------------------------------------------
 * This worker is OPTIONAL. AstroPress talks to GitHub directly from the admin
 * browser by default. It is only useful if you deploy it yourself.
 *
 * SECURITY NOTE (previously critical, now fixed):
 *   This worker used to forward ANY GitHub API path to any caller, served
 *   `Access-Control-Allow-Origin: *`, allowed DELETE, and silently injected the
 *   GITHUB_PAT secret whenever the caller sent no Authorization header. Any
 *   website on the internet could therefore read AND write your repository.
 *
 * It now fails closed and only works when explicitly configured:
 *   1. PROXY_SHARED_SECRET  (required) - random value; callers must send it
 *                                   as the X-AstroPress-Proxy-Key header.
 *   2. GITHUB_PAT           (required) - fine-grained token scoped to ONE repo.
 *   3. ALLOWED_ORIGINS      (required) - comma-separated exact origins.
 *   4. ALLOWED_REPO         (required) - "owner/repo", e.g. "ipritamsingh/astro-press".
 *
 * If any of these is missing the worker returns 503 and makes NO outbound call.
 * The GITHUB_PAT is never echoed in a response and never sent to the browser.
 */

const REQUIRED_METHODS = ['GET', 'POST', 'PATCH'];

// Only the low-level Git Data API paths this CMS actually uses. Anything else
// (/user, /orgs/*, /repos/*/hooks, /repos/*/issues, ...) is rejected.
const ALLOWED_PATH = /^\/repos\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)(?:\/git\/(?:ref\/heads\/[A-Za-z0-9._/-]+|refs\/heads\/[A-Za-z0-9._/-]+|commits(?:\/[A-Za-z0-9]+)?|trees(?:\/[A-Za-z0-9]+)?|blobs(?:\/[A-Za-z0-9]+)?))?$/;

const MAX_BODY_BYTES = 30 * 1024 * 1024;

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(extraHeaders || {}),
    },
  });
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    // 1. Fail closed if not configured.
    const secret = env.PROXY_SHARED_SECRET;
    const pat = env.GITHUB_PAT;
    const allowedRepo = (env.ALLOWED_REPO || '').trim();
    const allowedOrigins = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (!secret || !pat || !allowedRepo || allowedOrigins.length === 0) {
      return json({ error: 'Proxy is not configured.' }, 503);
    }

    // 2. Origin allowlist. No wildcard, ever.
    const origin = request.headers.get('Origin');
    const corsHeaders = {};
    if (origin) {
      if (!allowedOrigins.includes(origin)) {
        return json({ error: 'Origin not allowed.' }, 403);
      }
      corsHeaders['Access-Control-Allow-Origin'] = origin;
      corsHeaders['Vary'] = 'Origin';
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-AstroPress-Proxy-Key',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 3. Authenticate the caller with the shared secret.
    const providedKey = request.headers.get('X-AstroPress-Proxy-Key');
    if (!timingSafeEqual(providedKey || '', secret)) {
      return json({ error: 'Unauthorized.' }, 401, corsHeaders);
    }

    // 4. Method allowlist. DELETE is deliberately excluded.
    if (!REQUIRED_METHODS.includes(request.method)) {
      return json({ error: 'Method not allowed.' }, 405, corsHeaders);
    }

    const url = new URL(request.url);

    // 5. Normalise, then reject traversal attempts before matching.
    const decoded = decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/');
    if (decoded.includes('..') || decoded.includes('\\')) {
      return json({ error: 'Invalid path.' }, 400, corsHeaders);
    }

    const match = ALLOWED_PATH.exec(decoded);
    if (!match) {
      return json({ error: 'Path not allowed.' }, 404, corsHeaders);
    }

    // 6. Repository allowlist.
    const requestedRepo = `${match[1]}/${match[2]}`;
    if (requestedRepo.toLowerCase() !== allowedRepo.toLowerCase()) {
      return json({ error: 'Repository not allowed.' }, 403, corsHeaders);
    }

    // 7. Query allowlist. Only `recursive` is used by the CMS.
    const allowedQuery = new URLSearchParams();
    for (const [k, v] of url.searchParams) {
      if (k !== 'recursive') return json({ error: 'Query parameter not allowed.' }, 400, corsHeaders);
      allowedQuery.append(k, v);
    }

    // 8. Body cap.
    const rawBody = ['GET', 'HEAD'].includes(request.method) ? null : await request.text();
    if (rawBody && new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return json({ error: 'Payload too large.' }, 413, corsHeaders);
    }

    // 9. Build the upstream request. Only Content-Type/Accept are forwarded;
    //    any client-supplied Authorization is discarded so a caller can never
    //    choose which credential is used.
    const upstreamHeaders = new Headers();
    upstreamHeaders.set('User-Agent', 'AstroPress-CMS-Worker');
    upstreamHeaders.set('Accept', request.headers.get('Accept') || 'application/vnd.github.v3+json');
    upstreamHeaders.set('Authorization', `Bearer ${pat}`);
    const contentType = request.headers.get('Content-Type');
    if (contentType) upstreamHeaders.set('Content-Type', contentType);

    const query = allowedQuery.toString();
    const target = `https://api.github.com${decoded}${query ? `?${query}` : ''}`;

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers: upstreamHeaders,
        body: rawBody ? rawBody : undefined,
      });

      const responseHeaders = new Headers({
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-store',
      });
      for (const [k, v] of Object.entries(corsHeaders)) responseHeaders.set(k, v);

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      // Never surface the internal error message.
      return json({ error: 'Upstream request failed.' }, 502, corsHeaders);
    }
  },
};