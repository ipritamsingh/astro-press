/**
 * Cloudflare Pages Server-Side GitHub Engine
 * 
 * Handles secure GitHub connection testing and full repository publishing
 * on the server side using encrypted Cloudflare secret `GITHUB_PAT` and
 * D1 admin session verification.
 */

import {
  checkGitHubConnection,
  executeFullRepositoryPush,
} from '../data/githubPublishService';

export interface Env {
  DB: D1Database;
  GITHUB_PAT?: string;
}

async function hashSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = request.headers.get('X-Auth-Token');
  if (customHeader) {
    return customHeader.trim();
  }
  const cookieToken = parseCookie(request.headers.get('Cookie'), 'astropress_session');
  if (cookieToken) {
    return cookieToken.trim();
  }
  return null;
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...headers,
    },
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.pathname.replace(/^\/api\/github\/?/, '').split('/')[0] || '';

  if (!env.DB) {
    return jsonResponse({ error: 'Database binding missing.' }, 500);
  }

  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    // 1. Authenticate Admin Session via D1
    const token = extractToken(request);
    if (!token) {
      return jsonResponse({ success: false, error: 'Unauthorized. No active admin session found.' }, 401);
    }

    const tokenHash = await hashSha256(token);
    const session = await env.DB.prepare(
      `SELECT s.id as session_id, s.expires_at, s.last_active_at, u.id, u.username, u.role
       FROM admin_sessions s
       JOIN admin_users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND u.is_active = 1 LIMIT 1`
    )
      .bind(tokenHash)
      .first();

    if (!session) {
      return jsonResponse({ success: false, error: 'Unauthorized. Invalid or expired admin session.' }, 401);
    }

    const now = Date.now();
    const expiresAt = new Date(session.expires_at as string).getTime();
    if (now > expiresAt) {
      return jsonResponse({ success: false, error: 'Unauthorized. Admin session has expired.' }, 401);
    }

    // 2. Retrieve GITHUB_PAT from Server-Side Environment Secret
    const rawPat = env.GITHUB_PAT ? env.GITHUB_PAT.trim() : '';
    const pat = rawPat.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
    if (!pat) {
      return jsonResponse(
        {
          success: false,
          error:
            'Server-side GitHub Personal Access Token (GITHUB_PAT) secret is not configured in Cloudflare Pages environment variables.',
        },
        500
      );
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/github/test-connection
    // ------------------------------------------------------------------------
    if (action === 'test-connection') {
      const body = (await request.json().catch(() => ({}))) as any;
      let owner = (body.owner || '').trim();
      let repoName = (body.repoName || '').trim();
      if (owner.includes('/')) {
        const parts = owner.split('/');
        owner = parts[0].trim();
        if (!repoName && parts[1]) repoName = parts[1].trim();
      }
      if (repoName.includes('/')) {
        const parts = repoName.split('/');
        owner = parts[0].trim();
        repoName = parts[1].trim();
      }
      const branch = (body.branch || 'main').trim();
      const workerUrl = (body.workerUrl || '').trim();

      const connectionStatus = await checkGitHubConnection(owner, repoName, branch, pat, workerUrl);
      return jsonResponse(connectionStatus);
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/github/publish
    // ------------------------------------------------------------------------
    if (action === 'publish' || action === '') {
      const body = (await request.json().catch(() => ({}))) as any;
      const {
        posts,
        pages,
        heroConfig,
        themeSettings,
        siteSettings,
        categories,
        tags,
        authors,
        media,
        menus,
        deploymentSettings,
      } = body;

      if (!deploymentSettings) {
        return jsonResponse({ success: false, error: 'Deployment settings are required.' }, 400);
      }

      let repoString = (deploymentSettings.githubRepo || '').trim();
      if (repoString.includes('/')) {
        const parts = repoString.split('/');
        if (parts.length > 2) {
          repoString = `${parts[0].trim()}/${parts[1].trim()}`;
        }
      }

      // Inject server-side GITHUB_PAT securely into deployment settings
      const secureSettings = {
        ...deploymentSettings,
        githubRepo: repoString || deploymentSettings.githubRepo,
        githubToken: pat,
      };

      const result = await executeFullRepositoryPush({
        posts: posts || [],
        pages: pages || [],
        heroConfig,
        themeSettings,
        siteSettings,
        categories,
        tags,
        authors,
        media,
        menus,
        deploymentSettings: secureSettings,
        sessionToken: pat,
      });

      return jsonResponse(result);
    }

    return jsonResponse({ error: 'Endpoint not found.' }, 404);
  } catch (err: any) {
    console.error('[GitHub Server Engine Error]', err);
    return jsonResponse({ success: false, error: err.message || 'Internal server error during GitHub operation.' }, 500);
  }
};
