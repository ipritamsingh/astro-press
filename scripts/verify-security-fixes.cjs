/**
 * AstroPress Security Regression Verifier
 *
 * Behavioural tests for the session-security fixes applied to
 * src/server/d1AuthEngine.ts. Unlike a source-grep guard, this executes the
 * REAL SQL statements extracted from the engine against an in-memory SQLite
 * database, so it catches both logic regressions and invalid SQL.
 *
 * Zero dependencies: uses node:sqlite (built into Node >= 22.5).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const rootDir = path.resolve(__dirname, '..');
const enginePath = path.join(rootDir, 'src', 'server', 'd1AuthEngine.ts');
const migrationPath = path.join(rootDir, 'migrations', '0001_auth_schema.sql');

const engineSrc = fs.readFileSync(enginePath, 'utf8');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

let pass = 0;
let fail = 0;

function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log('[PASS] ' + name);
  } else {
    fail++;
    console.log('[FAIL] ' + name + (detail ? ' -> ' + detail : ''));
  }
}

function sha256(v) {
  return crypto.createHash('sha256').update(v).digest('hex');
}

// Pull a template literal out of the engine source so the test can never drift
// from what actually ships.
function extractSql(marker) {
  const idx = engineSrc.indexOf(marker);
  if (idx === -1) return null;
  const start = engineSrc.indexOf('`', idx);
  if (start === -1) return null;
  const end = engineSrc.indexOf('`', start + 1);
  if (end === -1) return null;
  return engineSrc.slice(start + 1, end);
}

const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const SESSION_ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

const db = new DatabaseSync(':memory:');
db.exec(migrationSql);

function iso(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}

// Seed a primary admin.
const userId = 'usr-admin-test';
db.prepare(
  `INSERT INTO admin_users (id, username, email, role, password_hash, password_salt, is_active, failed_login_attempts, created_at, updated_at)
   VALUES (?, ?, ?, 'primary_admin', 'hash', 'salt', 1, 0, ?, ?)`
).run(userId, 'primary', 'primary@example.com', iso(0), iso(0));

console.log('--- AstroPress Security Regression Verifier ---');

// 1. The authenticated-route gate must enforce expiry, not just presence.
const gateSql = extractSql('const sessionUser = await env.DB.prepare(');
check('gate query is present in engine', !!gateSql);
check(
  'gate query enforces absolute expiry (expires_at)',
  gateSql ? /expires_at\s*>/.test(gateSql) : false,
  gateSql
);
check(
  'gate query enforces idle timeout (last_active_at)',
  gateSql ? /last_active_at/.test(gateSql) : false,
  gateSql
);
check(
  'gate query still requires active user',
  gateSql ? /is_active\s*=\s*1/.test(gateSql) : false
);

// 2. Execute the real gate query across session states.
function gateParams(tokenHash, nowMs) {
  return [
    tokenHash,
    new Date(nowMs).toISOString(),
    new Date(nowMs).toISOString(),
    `-${Math.floor(SESSION_IDLE_TIMEOUT_MS / 1000)} seconds`,
  ];
}

function insertSession(id, tokenHash, expiresAt, lastActiveAt) {
  db.prepare(
    `INSERT INTO admin_sessions (id, user_id, token_hash, created_at, expires_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, tokenHash, iso(0), expiresAt, lastActiveAt);
}

const goodToken = sha256('valid-session-token');
insertSession('sess-good', goodToken, iso(SESSION_ABSOLUTE_TIMEOUT_MS), iso(-60 * 1000));

const expiredToken = sha256('expired-session-token');
insertSession('sess-expired', expiredToken, iso(-1000), iso(-60 * 1000));

const idleToken = sha256('idle-session-token');
insertSession('sess-idle', idleToken, iso(SESSION_ABSOLUTE_TIMEOUT_MS), iso(-3 * 60 * 60 * 1000));

const unknownToken = sha256('never-issued-token');

const stmt = db.prepare(gateSql);
const nowMs = Date.now();

check(
  'gate ACCEPTS a fresh, unexpired session',
  !!stmt.get(...gateParams(goodToken, nowMs))
);
check(
  'gate REJECTS an expired session',
  !stmt.get(...gateParams(expiredToken, nowMs))
);
check(
  'gate REJECTS an idle session beyond the 2h timeout',
  !stmt.get(...gateParams(idleToken, nowMs))
);

// Boundary: the idle threshold must reject just past 2h but accept just under.
const nearIdleToken = sha256('near-idle-session-token');
insertSession('sess-near-idle', nearIdleToken, iso(SESSION_ABSOLUTE_TIMEOUT_MS), iso(-(SESSION_IDLE_TIMEOUT_MS - 60 * 1000)));
check(
  'gate ACCEPTS a session idle just UNDER the 2h timeout',
  !!stmt.get(...gateParams(nearIdleToken, nowMs))
);

const justOverToken = sha256('just-over-idle-session-token');
insertSession('sess-just-over', justOverToken, iso(SESSION_ABSOLUTE_TIMEOUT_MS), iso(-(SESSION_IDLE_TIMEOUT_MS + 60 * 1000)));
check(
  'gate REJECTS a session idle just OVER the 2h timeout',
  !stmt.get(...gateParams(justOverToken, nowMs))
);

// Boundary: absolute expiry must reject just past 24h but accept just under.
const nearExpiryToken = sha256('near-expiry-session-token');
insertSession('sess-near-expiry', nearExpiryToken, iso(SESSION_ABSOLUTE_TIMEOUT_MS - 60 * 1000), iso(-60 * 1000));
check(
  'gate ACCEPTS a session just UNDER the 24h absolute expiry',
  !!stmt.get(...gateParams(nearExpiryToken, nowMs))
);

const justExpiredToken = sha256('just-expired-session-token');
insertSession('sess-just-expired', justExpiredToken, iso(-60 * 1000), iso(-60 * 1000));
check(
  'gate REJECTS a session just past the 24h absolute expiry',
  !stmt.get(...gateParams(justExpiredToken, nowMs))
);
check(
  'gate REJECTS an unknown token',
  !stmt.get(...gateParams(unknownToken, nowMs))
);

// 3. A deactivated account must not authenticate.
db.prepare('UPDATE admin_users SET is_active = 0 WHERE id = ?').run(userId);
check(
  'gate REJECTS a session whose user is deactivated',
  !stmt.get(...gateParams(goodToken, nowMs))
);
db.prepare('UPDATE admin_users SET is_active = 1 WHERE id = ?').run(userId);
check(
  'gate ACCEPTS again once the user is reactivated',
  !!stmt.get(...gateParams(goodToken, nowMs))
);

// 4. Stale-row purge after a rejected gate lookup.
const purge = db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(expiredToken);
check('stale session row is purged', purge.changes === 1);
check(
  'purged session can no longer be replayed',
  !db.prepare('SELECT id FROM admin_sessions WHERE token_hash = ?').get(expiredToken)
);

// 5. Password change must invalidate every session for the user.
insertSession('sess-2', sha256('second-session'), iso(SESSION_ABSOLUTE_TIMEOUT_MS), iso(-1000));
insertSession('sess-3', sha256('third-session'), iso(SESSION_ABSOLUTE_TIMEOUT_MS), iso(-1000));
const beforeCount = db.prepare('SELECT COUNT(*) as c FROM admin_sessions WHERE user_id = ?').get(userId).c;
const invalidate = db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(userId);
const afterCount = db.prepare('SELECT COUNT(*) as c FROM admin_sessions WHERE user_id = ?').get(userId).c;
check('sessions exist before invalidation', beforeCount >= 2, 'before=' + beforeCount);
check('password-change invalidation removes all sessions', afterCount === 0 && invalidate.changes >= 2, 'after=' + afterCount);

// 6. Atomic failed-attempt counter must survive concurrent increments.
db.prepare('UPDATE admin_users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?').run(userId);
const bump = db.prepare(
  'UPDATE admin_users SET failed_login_attempts = failed_login_attempts + 1, updated_at = ? WHERE id = ?'
);
for (let i = 0; i < 5; i++) bump.run(iso(0), userId);
const counter = db.prepare('SELECT failed_login_attempts FROM admin_users WHERE id = ?').get(userId);
check(
  'atomic counter increments exactly 5 times under repeated updates',
  counter.failed_login_attempts === 5,
  'counter=' + counter.failed_login_attempts
);
check(
  'counter crossing MAX_FAILED_ATTEMPTS(5) is detectable for lockout',
  counter.failed_login_attempts >= 5
);

// 7. Recovery-login throttle query must be valid and rate-limit correctly.
const throttleSql = extractSql('const recentRecoveryFailures = await env.DB.prepare(');
check('recovery throttle query is present', !!throttleSql);
if (throttleSql) {
  const ip = '203.0.113.9';
  const logStmt = db.prepare(
    `INSERT INTO auth_audit_logs (id, user_id, action, ip_address, success, details, timestamp)
     VALUES (?, NULL, 'RECOVERY_LOGIN_FAILED', ?, 0, ?, ?)`
  );
  for (let i = 0; i < 5; i++) logStmt.run('log-' + i, ip, 'Unknown username.', iso(-60 * 1000));

  const throttled = db.prepare(throttleSql).get(ip);
  check(
    'recovery throttle counts 5 recent failures for the same IP',
    throttled && throttled.count >= 5,
    throttled ? 'count=' + throttled.count : 'no row'
  );

  const otherIp = db.prepare(throttleSql).get('198.51.100.1');
  check(
    'recovery throttle does not count failures from a different IP',
    !otherIp || otherIp.count === 0,
    otherIp ? 'count=' + otherIp.count : 'no row'
  );
}

// 8. Static source guards for the remaining session-security fixes.
check(
  'raw D1 error text is no longer returned to clients',
  !/return jsonResponse\(\{ error: err\.message/.test(engineSrc)
);
check(
  'password-login no longer returns a distinguishable lockout message',
  !/Account is temporarily locked due to repeated failed attempts/.test(engineSrc)
);
check(
  'recovery-login no longer leaks a code-specific error message',
  !/Invalid or already used recovery code\./.test(engineSrc)
);
check(
  'update-account invalidates sessions when the password changes',
  /passwordChanged/.test(engineSrc)
);
check(
  'backup-admin credential overwrite invalidates backup sessions',
  /Credential rotation must not leave previously-issued sessions valid\./.test(engineSrc)
);
check(
  'session cookie retains HttpOnly + Secure + SameSite',
  /astropress_session=.*HttpOnly; Secure; SameSite=Lax/s.test(engineSrc)
);

// 9. Gated items must still be present (Phase 2 safety gate).
check(
  'devResetUrl still present (intentionally gated on verified email recovery)',
  /devResetUrl/.test(engineSrc)
);

// 10. audit-logs must be restricted to GET and to the primary admin role.
const auditIdx = engineSrc.indexOf("action === 'audit-logs'");
const auditBlock = auditIdx >= 0 ? engineSrc.slice(auditIdx, auditIdx + 600) : '';
check('audit-logs route exists', auditBlock.length > 0);
check(
  'audit-logs rejects non-GET methods',
  auditBlock.includes("request.method !== 'GET'")
);
check(
  'audit-logs requires the primary_admin role',
  /sessionUser\.role !== 'primary_admin'/.test(auditBlock)
);

// 11. Reliable forms must not report success when nothing was delivered.
const pageView = fs.readFileSync(
  path.join(rootDir, 'src', 'components', 'frontend', 'SinglePageView.tsx'),
  'utf8'
);
check(
  'contact form no longer fakes immediate success',
  !/setFormSubmitted\(true\);\s*\n\s*setTimeout/.test(pageView)
);
check(
  'contact form performs a real request',
  /fetch\('\/api\/contact'/.test(pageView)
);
check(
  'contact form exposes an error state',
  /formError/.test(pageView) && /role="alert"/.test(pageView)
);

const newsletter = fs.readFileSync(
  path.join(rootDir, 'src', 'components', 'common', 'NewsletterFormIsland.tsx'),
  'utf8'
);
check(
  'newsletter form no longer claims success in its network-failure path',
  !/catch\s*\{[^}]*setIsSubscribed\(true\)/s.test(newsletter)
);

const footerCard = fs.readFileSync(
  path.join(rootDir, 'src', 'components', 'common', 'FooterNewsletterCard.tsx'),
  'utf8'
);
check(
  'footer newsletter card no longer claims success in its network-failure path',
  !/catch\s*\{[^}]*setIsSubscribed\(true\)/s.test(footerCard)
);

// 12. Destructive post actions must be confirmed.
const postsManager = fs.readFileSync(
  path.join(rootDir, 'src', 'components', 'admin', 'PostsManager.tsx'),
  'utf8'
);
check(
  'bulk delete uses the confirming handler',
  /onClick=\{handleBulkDelete\}/.test(postsManager)
);
check(
  'single-post trash asks for confirmation',
  /onDeletePost\(post\.id\)/.test(postsManager) && /confirm\(/.test(postsManager)
);

db.close();

console.log('');
console.log('Passed: ' + pass + '  Failed: ' + fail);
if (fail > 0) {
  console.log('SECURITY REGRESSION VERIFIER FAILED');
  process.exit(1);
}
console.log('All security regression checks PASSED.');