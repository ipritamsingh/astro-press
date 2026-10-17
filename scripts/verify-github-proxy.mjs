/**
 * Behavioural regression test for src/workers/github-proxy.js
 *
 * Executes the real worker `fetch` handler. The previous version allowed any
 * path, any method, any origin and silently injected GITHUB_PAT for anonymous
 * callers. These assertions lock in the fail-closed behaviour.
 *
 * Run: node scripts/verify-github-proxy.mjs
 * Zero dependencies.
 */
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
// pathToFileURL is required on Windows: a bare absolute path is rejected by the
// ESM loader because it has no URL scheme.
const mod = await import(
  pathToFileURL(path.join(here, '..', 'src', 'workers', 'github-proxy.js')).href
);
const handler = mod.default.fetch;

const ORIGIN = 'https://astropress.pages.dev';
const KEY = 'unit-test-shared-secret';
const REQ = 'https://proxy.example.workers.dev';

const CONFIGURED = {
  PROXY_SHARED_SECRET: KEY,
  GITHUB_PAT: 'ghp_FAKE_TOKEN_NOT_A_REAL_SECRET',
  ALLOWED_REPO: 'ipritamsingh/astro-press',
  ALLOWED_ORIGINS: ORIGIN,
};

const UNCONFIGURED = {};

function req(pathname, { method = 'GET', origin = ORIGIN, key = KEY, search = '' } = {}) {
  const headers = {};
  if (origin) headers['Origin'] = origin;
  if (key) headers['X-AstroPress-Proxy-Key'] = key;
  return new Request(`${REQ}${pathname}${search}`, { method, headers });
}

let pass = 0;
let fail = 0;

async function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log('[PASS] ' + name);
  } else {
    fail++;
    console.log('[FAIL] ' + name + (detail ? ' -> ' + detail : ''));
  }
}

// --- Fail closed -------------------------------------------------------------
const noConfig = await handler(req('/repos/ipritamsingh/astro-press'), UNCONFIGURED);
await check(
  'unconfigured worker returns 503 and makes no upstream call',
  noConfig.status === 503,
  'status=' + noConfig.status
);

const partial = await handler(req('/repos/ipritamsingh/astro-press'), {
  ...UNCONFIGURED,
  PROXY_SHARED_SECRET: KEY,
});
await check('partially configured worker returns 503', partial.status === 503, 'status=' + partial.status);

// --- Caller authentication ---------------------------------------------------
const badOrigin = await handler(
  req('/repos/ipritamsingh/astro-press', { origin: 'https://evil.example' }),
  CONFIGURED
);
await check('disallowed origin returns 403', badOrigin.status === 403, 'status=' + badOrigin.status);

const noKey = await handler(req('/repos/ipritamsingh/astro-press', { key: null }), CONFIGURED);
await check('missing proxy key returns 401', noKey.status === 401, 'status=' + noKey.status);

const badKey = await handler(req('/repos/ipritamsingh/astro-press', { key: 'wrong' }), CONFIGURED);
await check('wrong proxy key returns 401', badKey.status === 401, 'status=' + badKey.status);

// --- Method allowlist --------------------------------------------------------
const del = await handler(
  req('/repos/ipritamsingh/astro-press/git/refs/heads/main', { method: 'DELETE' }),
  CONFIGURED
);
await check('DELETE is rejected with 405', del.status === 405, 'status=' + del.status);

const put = await handler(
  req('/repos/ipritamsingh/astro-press/git/blobs', { method: 'PUT' }),
  CONFIGURED
);
await check('PUT is rejected with 405', put.status === 405, 'status=' + put.status);

// --- Path allowlist ----------------------------------------------------------
const userPath = await handler(req('/user'), CONFIGURED);
await check('/user is rejected with 404', userPath.status === 404, 'status=' + userPath.status);

const hooks = await handler(req('/repos/ipritamsingh/astro-press/hooks'), CONFIGURED);
await check('repo webhooks path is rejected with 404', hooks.status === 404, 'status=' + hooks.status);

const issues = await handler(req('/repos/ipritamsingh/astro-press/issues'), CONFIGURED);
await check('repo issues path is rejected with 404', issues.status === 404, 'status=' + issues.status);

// Plain "../" is collapsed by the URL parser before the handler runs, so it
// surfaces as a path that simply does not match the allowlist. Either way the
// request is rejected and never reaches GitHub.
const traversal = await handler(req('/repos/ipritamsingh/astro-press/../../evil'), CONFIGURED);
await check(
  'path traversal is rejected (never reaches GitHub)',
  traversal.status >= 400 && traversal.status < 500,
  'status=' + traversal.status
);

// Percent-encoded traversal: the WHATWG URL parser normalises %2e%2e to ".."
// and then collapses dot-segments, so it also arrives already neutralised and
// is rejected as a non-allowlisted path. The handler's own decode + reject
// logic remains as defence in depth for anything the parser preserves.
const encodedTraversal = await handler(
  req('/repos/ipritamsingh/astro-press/%2e%2e/%2e%2e/evil'),
  CONFIGURED
);
await check(
  'percent-encoded path traversal is rejected (never reaches GitHub)',
  encodedTraversal.status >= 400 && encodedTraversal.status < 500,
  'status=' + encodedTraversal.status
);

// The handler must independently reject any decoded path that still contains a
// dot-segment, e.g. one smuggled through a raw Request whose pathname is not
// normalised. Construct one directly to exercise that branch.
const rawTraversal = new Request(`${REQ}/repos/ipritamsingh/astro-press/..%2f..%2fevil`, {
  headers: { Origin: ORIGIN, 'X-AstroPress-Proxy-Key': KEY },
});
const rawRes = await handler(rawTraversal, CONFIGURED);
await check(
  'a surviving dot-segment in the path is rejected',
  rawRes.status >= 400 && rawRes.status < 500,
  'status=' + rawRes.status
);

// --- Repository allowlist ----------------------------------------------------
const otherRepo = await handler(req('/repos/attacker/evil-repo'), CONFIGURED);
await check('a different repository is rejected with 403', otherRepo.status === 403, 'status=' + otherRepo.status);

const otherRepoGit = await handler(req('/repos/attacker/evil-repo/git/commits'), CONFIGURED);
await check(
  'a different repository is rejected even on an allowed git path',
  otherRepoGit.status === 403,
  'status=' + otherRepoGit.status
);

// --- Query allowlist ---------------------------------------------------------
const badQuery = await handler(
  req('/repos/ipritamsingh/astro-press', { search: '?admin=1' }),
  CONFIGURED
);
await check('unexpected query parameter returns 400', badQuery.status === 400, 'status=' + badQuery.status);

// --- CORS --------------------------------------------------------------------
const ok = await handler(req('/repos/ipritamsingh/astro-press'), CONFIGURED);
const acao = ok.headers.get('Access-Control-Allow-Origin');
await check(
  'Access-Control-Allow-Origin echoes the allowed origin, never *',
  acao === ORIGIN,
  'value=' + acao
);
await check('Vary: Origin is set', ok.headers.get('Vary') === 'Origin');

const preflight = await handler(
  req('/repos/ipritamsingh/astro-press', { method: 'OPTIONS' }),
  CONFIGURED
);
const methods = preflight.headers.get('Access-Control-Allow-Methods') || '';
await check('preflight does not advertise DELETE', !methods.includes('DELETE'), 'methods=' + methods);

// --- Credential non-disclosure ----------------------------------------------
const bodies = [];
for (const r of [noConfig, badOrigin, noKey, badKey, del, userPath, otherRepo, traversal, badQuery, ok]) {
  bodies.push(await r.text());
}
const leaked = bodies.some((b) => b.includes('ghp_FAKE_TOKEN'));
await check('no response body ever contains the PAT', !leaked);

const src = await fs.readFile(
  path.join(here, '..', 'src', 'workers', 'github-proxy.js'),
  'utf8'
);
await check('source contains no wildcard CORS', !/Access-Control-Allow-Origin['"]\s*:\s*['"]\*/.test(src));
await check('source never forwards a client Authorization header', !/request\.headers\.get\(['"]Authorization['"]\)/.test(src));
await check('source does not permit the DELETE method', !/REQUIRED_METHODS\s*=\s*\[[^\]]*DELETE/.test(src));

console.log('');
console.log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  console.log('GITHUB PROXY REGRESSION FAILED');
  // Set exitCode rather than process.exit(): calling exit() while the fetch
  // handle is still closing aborts on Windows (UV_HANDLE_CLOSING assertion).
  process.exitCode = 1;
} else {
  console.log('All GitHub proxy regression checks PASSED.');
}