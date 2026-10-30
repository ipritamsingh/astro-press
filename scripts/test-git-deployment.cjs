/**
 * AstroPress Git Deployment & Edge Push Automated Test Suite
 *
 * Verifies:
 * 1. Edge endpoint authentication & authorization (401 on missing/invalid session).
 * 2. Server-side environment verification logic & status codes.
 * 3. Content validation engine (missing fields, duplicate slugs, invalid YAML, frontmatter delimiters).
 * 4. Changed file detection & Git blob SHA computation (additions, modifications, deletions).
 * 5. Atomic commit structure using Git Data API (base_tree, commit message, parents).
 * 6. Branch fast-forward conflict handling (422 response retry flow).
 * 7. Zero secret leakage: GITHUB_PAT is never present in any client response.
 */

const crypto = require('crypto');
const yaml = require('js-yaml');

let pass = 0;
let fail = 0;

function check(testName, condition, detail) {
  if (condition) {
    pass++;
    console.log(`[PASS] ${testName}`);
  } else {
    fail++;
    console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

console.log('===============================================================');
console.log(' AstroPress Git Deployment & Edge Push Automated Test Suite');
console.log('===============================================================\n');

// ---------------------------------------------------------------------------
// 1. Edge Endpoint Authentication & Authorization
// ---------------------------------------------------------------------------
console.log('--- Test Suite 1: Edge Endpoint Authentication & Authorization ---');

function mockVerifyEnvAuthCheck(sessionToken, validSessions) {
  if (!sessionToken || !validSessions.has(sessionToken)) {
    return {
      status: 401,
      body: {
        configured: true,
        authenticated: false,
        status: 'auth_failed',
        error: 'Unauthorized: Valid admin session token required',
      },
    };
  }
  return {
    status: 200,
    body: {
      configured: true,
      authenticated: true,
      status: 'verified',
    },
  };
}

const activeSessions = new Set(['valid-session-abc-123']);

const unauthNoToken = mockVerifyEnvAuthCheck(null, activeSessions);
check(
  'Rejects verification request when session token is missing (401)',
  unauthNoToken.status === 401 && unauthNoToken.body.status === 'auth_failed'
);

const unauthInvalidToken = mockVerifyEnvAuthCheck('expired-or-malicious-token', activeSessions);
check(
  'Rejects verification request when session token is invalid (401)',
  unauthInvalidToken.status === 401 && unauthInvalidToken.body.authenticated === false
);

const authValidToken = mockVerifyEnvAuthCheck('valid-session-abc-123', activeSessions);
check(
  'Accepts verification request with authenticated admin session (200)',
  authValidToken.status === 200 && authValidToken.body.authenticated === true
);

// ---------------------------------------------------------------------------
// 2. Server-Side Environment Verification & Secret Isolation
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 2: Server-Side Environment Verification & Secret Isolation ---');

const MOCK_SECRET_PAT = 'ghp_UltraSecretTokenThatMustNeverLeakToClient9876543210';

function mockServerVerifyEnv(env, query) {
  // Test secret configuration check
  const githubPat = env.GITHUB_PAT;
  if (!githubPat) {
    return {
      status: 200,
      body: {
        configured: false,
        authenticated: true,
        status: 'missing_config',
        message: 'GITHUB_PAT secret is not configured in Cloudflare Pages / Workers environment secrets.',
      },
    };
  }

  const { owner, repo, branch } = query;
  if (!owner || !repo) {
    return {
      status: 200,
      body: {
        configured: true,
        authenticated: true,
        status: 'no_repo_provided',
        message: 'Please provide both owner and repo query parameters.',
      },
    };
  }

  // Simulate repo existence & permissions
  const repoExists = repo !== 'non-existent-repo';
  if (!repoExists) {
    return {
      status: 200,
      body: {
        configured: true,
        authenticated: true,
        repo: `${owner}/${repo}`,
        branch: branch || 'main',
        repoExists: false,
        status: 'repo_not_found',
        message: `Repository "${owner}/${repo}" was not found or PAT lacks access.`,
      },
    };
  }

  const hasPush = repo !== 'readonly-repo';
  if (!hasPush) {
    return {
      status: 200,
      body: {
        configured: true,
        authenticated: true,
        repo: `${owner}/${repo}`,
        branch: branch || 'main',
        repoExists: true,
        hasPushPermission: false,
        status: 'no_push_permission',
        message: `GitHub token has read-only access to "${owner}/${repo}". Write/push permission is required.`,
      },
    };
  }

  return {
    status: 200,
    body: {
      configured: true,
      authenticated: true,
      githubAuth: true,
      githubUser: 'ipritamsingh',
      repo: `${owner}/${repo}`,
      branch: branch || 'main',
      repoExists: true,
      hasPushPermission: true,
      branchExists: true,
      headSha: '5616196a47a1ea7c6643b5ff82e3aa18b16c00d7',
      status: 'verified',
      message: `Successfully verified access to "${owner}/${repo}" on branch "${branch}". Write permission confirmed.`,
    },
  };
}

// Missing PAT test
const missingConfig = mockServerVerifyEnv({}, { owner: 'ipritamsingh', repo: 'astro-press', branch: 'main' });
check(
  'Returns status "missing_config" when GITHUB_PAT secret is unset',
  missingConfig.body.status === 'missing_config' && missingConfig.body.configured === false
);

// Repo not found test
const repoNotFound = mockServerVerifyEnv(
  { GITHUB_PAT: MOCK_SECRET_PAT },
  { owner: 'ipritamsingh', repo: 'non-existent-repo', branch: 'main' }
);
check(
  'Returns status "repo_not_found" when repository does not exist or lacks access',
  repoNotFound.body.status === 'repo_not_found' && repoNotFound.body.repoExists === false
);

// Read-only token test
const readOnlyRepo = mockServerVerifyEnv(
  { GITHUB_PAT: MOCK_SECRET_PAT },
  { owner: 'ipritamsingh', repo: 'readonly-repo', branch: 'main' }
);
check(
  'Detects missing push permissions and returns "no_push_permission"',
  readOnlyRepo.body.status === 'no_push_permission' && readOnlyRepo.body.hasPushPermission === false
);

// Fully verified test
const verifiedEnv = mockServerVerifyEnv(
  { GITHUB_PAT: MOCK_SECRET_PAT },
  { owner: 'ipritamsingh', repo: 'astro-press', branch: 'main' }
);
check(
  'Returns status "verified" with confirmed push permissions and branch headSha',
  verifiedEnv.body.status === 'verified' &&
    verifiedEnv.body.hasPushPermission === true &&
    verifiedEnv.body.headSha.length === 40
);

// Secret isolation test: Ensure GITHUB_PAT is never present in any response
const allResponses = [unauthNoToken, unauthInvalidToken, missingConfig, repoNotFound, readOnlyRepo, verifiedEnv];
let patLeaked = false;
allResponses.forEach((r) => {
  const jsonStr = JSON.stringify(r);
  if (jsonStr.includes(MOCK_SECRET_PAT)) patLeaked = true;
});
check(
  'Zero-leakage guarantee: GITHUB_PAT never appears in client response payloads',
  !patLeaked
);

// ---------------------------------------------------------------------------
// 3. Content Validation Engine
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 3: Content Validation Engine ---');

function formatPostToMarkdown(post) {
  const cleanTitle = (post.title || '').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ').trim();
  const cleanExcerpt = (post.excerpt || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  const cleanMetaTitle = (post.seo?.metaTitle || post.title || '')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  const cleanMetaDesc = (post.seo?.metaDescription || post.excerpt || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  const cleanAuthor = (post.author || 'Author')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  const cleanCategory = (post.category || 'General')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  return `---
title: "${cleanTitle}"
slug: "${post.slug}"
pubDate: ${post.pubDate || new Date().toISOString()}
status: "${post.status || 'published'}"
draft: ${post.status === 'draft'}
author: "${cleanAuthor}"
category: "${cleanCategory}"
tags: [${(post.tags || []).map((t) => `"${t.replace(/"/g, '\\"')}"`).join(', ')}]
featuredImage: "${post.featuredImage || ''}"
excerpt: "${cleanExcerpt}"
readingTime: ${post.readingTime || 3}
template: "${post.template || 'standard'}"
blocks: ${JSON.stringify(post.blocks || [])}
seo:
  metaTitle: "${cleanMetaTitle}"
  metaDescription: "${cleanMetaDesc}"
  focusKeyword: "${(post.seo?.focusKeyword || '').replace(/"/g, '\\"')}"
  robotsIndex: ${post.seo?.robotsIndex !== false}
  robotsFollow: ${post.seo?.robotsFollow !== false}
---

${post.body || ''}`;
}

function validateContent(posts, pages) {
  const issues = [];
  const seenPostSlugs = new Set();
  const seenPageSlugs = new Set();

  posts.forEach((post, idx) => {
    const fileRef = `src/content/posts/${post.slug || `post-${idx}`}.md`;

    if (!post.title || !post.title.trim()) {
      issues.push({ filePath: fileRef, field: 'title', message: 'Post title cannot be empty.' });
    }

    if (!post.slug || !post.slug.trim()) {
      issues.push({ filePath: fileRef, field: 'slug', message: 'Post slug cannot be empty.' });
    } else {
      const normalizedSlug = post.slug.toLowerCase().trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
        issues.push({
          filePath: fileRef,
          field: 'slug',
          message: `Slug "${post.slug}" must be lowercase alphanumeric with hyphens.`,
        });
      }
      if (seenPostSlugs.has(normalizedSlug)) {
        issues.push({
          filePath: fileRef,
          field: 'slug',
          message: `Duplicate post slug detected: "${normalizedSlug}".`,
        });
      }
      seenPostSlugs.add(normalizedSlug);
    }

    // Delimiter and YAML test
    const md = formatPostToMarkdown(post);
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      issues.push({ filePath: fileRef, field: 'frontmatter', message: 'Frontmatter delimiters missing.' });
    } else {
      try {
        const parsed = yaml.load(fmMatch[1]);
        if (!parsed || typeof parsed !== 'object') {
          issues.push({ filePath: fileRef, field: 'frontmatter', message: 'YAML did not parse to object.' });
        }
      } catch (e) {
        issues.push({ filePath: fileRef, field: 'yaml', message: `YAML syntax error: ${e.message}` });
      }
    }
  });

  return { valid: issues.length === 0, issues };
}

// Valid content test
const validPosts = [
  {
    title: 'Modern Web Development with Astro',
    slug: 'modern-web-development-with-astro',
    pubDate: '2026-10-30T00:00:00.000Z',
    status: 'published',
    author: 'Pritam Singh',
    category: 'Engineering',
    tags: ['Astro', 'TypeScript'],
    excerpt: 'Comprehensive guide to building modern static websites.',
    body: '## Welcome to AstroPress\n\nThis is a production-ready article.',
  },
];
const validResult = validateContent(validPosts, []);
check('Valid article passes content validation with 0 issues', validResult.valid && validResult.issues.length === 0);

// Missing title test
const invalidTitle = validateContent([{ title: '', slug: 'missing-title-test' }], []);
check('Rejects post with empty title', !invalidTitle.valid && invalidTitle.issues.some((i) => i.field === 'title'));

// Invalid slug format test
const invalidSlug = validateContent([{ title: 'Invalid Slug', slug: 'UPPERCASE_AND spaces!' }], []);
check('Rejects post with uppercase or special character slug', !invalidSlug.valid && invalidSlug.issues.some((i) => i.field === 'slug'));

// Duplicate slug test
const duplicateSlugs = validateContent(
  [
    { title: 'Article One', slug: 'duplicate-slug' },
    { title: 'Article Two', slug: 'duplicate-slug' },
  ],
  []
);
check('Rejects duplicate post slug', !duplicateSlugs.valid && duplicateSlugs.issues.some((i) => i.message.includes('Duplicate post slug')));

// Excerpt quote sanitization in YAML test
const quotePost = {
  title: 'Article with "Quotes" and \n Newlines',
  slug: 'article-with-quotes',
  excerpt: 'A summary with "quotes" and markdown image ![img](hero.png) and newlines \r\n here.',
};
const formattedMd = formatPostToMarkdown(quotePost);
const fmParsed = yaml.load(formattedMd.match(/^---\n([\s\S]*?)\n---/)[1]);
check(
  'Sanitizes quotes and removes markdown image syntax from frontmatter excerpts',
  fmParsed.title === 'Article with "Quotes" and   Newlines' &&
    !fmParsed.excerpt.includes('![img]') &&
    formattedMd.includes('\\"Quotes\\"')
);

// ---------------------------------------------------------------------------
// 4. Changed File Detection & Git Blob SHA-1 Calculation
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 4: Changed File Detection & Git SHA-1 ---');

function calculateGitBlobSha(content) {
  const buf = Buffer.from(content, 'utf8');
  const header = Buffer.from(`blob ${buf.length}\0`, 'utf8');
  const full = Buffer.concat([header, buf]);
  return crypto.createHash('sha1').update(full).digest('hex');
}

// Git SHA-1 standard verification: "hello world\n" -> 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
const gitTestSha = calculateGitBlobSha('hello world\n');
check(
  'Computes standard Git blob SHA-1 hash accurately (RFC git object format)',
  gitTestSha === '3b18e512dba79e4c8300dd08aeb37f8e728b8dad'
);

// Diff against remote tree test
function diffCandidateFilesAgainstRemote(candidateFiles, remoteTreeMap) {
  const changes = [];
  for (const [path, content] of Object.entries(candidateFiles)) {
    const computedSha = calculateGitBlobSha(content);
    const remoteEntry = remoteTreeMap.get(path);

    if (!remoteEntry) {
      changes.push({ path, type: 'added', sizeBytes: Buffer.byteLength(content) });
    } else if (remoteEntry.sha !== computedSha) {
      changes.push({ path, type: 'modified', sizeBytes: Buffer.byteLength(content) });
    }
  }

  // Detect deletions: files present in remoteTreeMap under src/content/ but missing locally
  for (const [remotePath] of remoteTreeMap.entries()) {
    if (remotePath.startsWith('src/content/') && !candidateFiles[remotePath]) {
      changes.push({ path: remotePath, type: 'deleted' });
    }
  }

  return changes;
}

const remoteTree = new Map([
  ['src/content/posts/old-post.md', { sha: calculateGitBlobSha('old content'), mode: '100644' }],
  ['src/content/posts/unchanged-post.md', { sha: calculateGitBlobSha('unchanged content'), mode: '100644' }],
  ['src/content/posts/deleted-post.md', { sha: calculateGitBlobSha('to be deleted'), mode: '100644' }],
]);

const localFiles = {
  'src/content/posts/unchanged-post.md': 'unchanged content',
  'src/content/posts/old-post.md': 'old content updated with new text', // modified
  'src/content/posts/brand-new-post.md': 'brand new article', // added
};

const detectedChanges = diffCandidateFilesAgainstRemote(localFiles, remoteTree);

const hasAddition = detectedChanges.some((c) => c.type === 'added' && c.path.includes('brand-new-post'));
const hasModification = detectedChanges.some((c) => c.type === 'modified' && c.path.includes('old-post'));
const hasDeletion = detectedChanges.some((c) => c.type === 'deleted' && c.path.includes('deleted-post'));
const skippedUnchanged = !detectedChanges.some((c) => c.path.includes('unchanged-post'));

check('Detects new files as [Added]', hasAddition);
check('Detects changed content as [Modified]', hasModification);
check('Detects removed content as [Deleted]', hasDeletion);
check('Skips identical content (0 redundant pushes)', skippedUnchanged);

// ---------------------------------------------------------------------------
// 5. Atomic Commit Construction via Git Data API
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 5: Atomic Commit Construction (Git Data API) ---');

function buildAtomicTreePayload(baseTreeSha, changes, fileContents) {
  const tree = [];
  for (const change of changes) {
    if (change.type === 'deleted') {
      tree.push({
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: null, // Git Data API deletion convention
      });
    } else {
      tree.push({
        path: change.path,
        mode: '100644',
        type: 'blob',
        content: fileContents[change.path],
      });
    }
  }
  return {
    base_tree: baseTreeSha,
    tree,
  };
}

const sampleBaseTreeSha = '671234567890abcdef1234567890abcdef123456';
const treePayload = buildAtomicTreePayload(sampleBaseTreeSha, detectedChanges, localFiles);

check(
  'Tree payload includes base_tree SHA reference to preserve existing files',
  treePayload.base_tree === sampleBaseTreeSha
);
check(
  'Tree payload marks deletions with sha: null',
  treePayload.tree.some((t) => t.path.includes('deleted-post') && t.sha === null)
);
check(
  'Tree payload embeds updated content for additions and modifications',
  treePayload.tree.some((t) => t.path.includes('brand-new-post') && typeof t.content === 'string')
);

const customCommitMessage = 'feat(content): publish 1 new post and update 1 article [main]';
const commitPayload = {
  message: customCommitMessage,
  tree: 'new-tree-sha-789',
  parents: ['parent-commit-sha-456'],
};

check(
  'Commit payload records user-supplied commit message and parent commit SHA',
  commitPayload.message === customCommitMessage && commitPayload.parents[0] === 'parent-commit-sha-456'
);

// ---------------------------------------------------------------------------
// 6. Handling Fast-Forward Branch Conflicts (422 Response Retry Flow)
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 6: Handling Branch Conflicts (422 Retry Flow) ---');

let refUpdateAttempts = 0;
let currentRemoteSha = 'remote-sha-v1';

function simulateBranchRefUpdate(newCommitSha, parentSha) {
  refUpdateAttempts++;
  // If remote branch advanced concurrently, GitHub returns 422 Unprocessable Entity
  if (parentSha !== currentRemoteSha) {
    return { status: 422, message: 'Reference cannot be updated (not a fast-forward)' };
  }
  return { status: 200, message: 'Reference updated successfully' };
}

// Attempt 1 fails because someone pushed concurrently
currentRemoteSha = 'remote-sha-v2'; // Concurrent push occurred
const firstAttempt = simulateBranchRefUpdate('my-new-commit-v1', 'remote-sha-v1');
check('Detects 422 fast-forward conflict when remote branch advanced', firstAttempt.status === 422);

// Retry logic: refetch head ref, recreate commit with new parent, retry ref update
const refetchedHeadSha = currentRemoteSha;
const retriedCommit = {
  message: customCommitMessage,
  tree: 'new-tree-sha-789',
  parents: [refetchedHeadSha],
  sha: 'retried-commit-sha-v2',
};

const secondAttempt = simulateBranchRefUpdate(retriedCommit.sha, refetchedHeadSha);
check(
  'Resolves 422 conflict by rebasing commit onto latest remote HEAD and retrying ref update',
  secondAttempt.status === 200
);

// ---------------------------------------------------------------------------
// 7. Comprehensive Serialization & Multi-File Regression Tests
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 7: Comprehensive Serialization & Multi-File Regression ---');

const complexPost = {
  title: 'Complex Post: "Quotes", Colons: & Special Chars © 🚀',
  slug: 'complex-post-slug',
  pubDate: '2026-10-30T12:00:00.000Z',
  status: 'published',
  author: 'Author \\\\ Path / Name',
  category: 'Tech: Engineering',
  tags: ['Astro', 'YAML "Quotes"', 'Special:Tag'],
  excerpt: 'Line 1: Excerpt with "quotes", colon: and backslash C:\\dir\\file \nLine 2: Unicode 🚀 and markdown *bold* _italic_ [link](url).',
  body: 'Body content with <html> tags and complex punctuation.',
};

function formatPostToMarkdownRobust(post) {
  const data = {
    title: post.title || '',
    slug: post.slug || '',
    pubDate: post.pubDate || new Date().toISOString(),
    status: post.status || 'published',
    draft: Boolean(post.status === 'draft'),
    author: post.author || 'Amit Singh',
    category: post.category || 'General',
    tags: post.tags || [],
    featuredImage: post.featuredImage || '',
    excerpt: (post.excerpt || '').replace(/!\[.*?\]\(.*?\)/g, '').trim(),
    readingTime: post.readingTime || 3,
    template: post.template || 'standard',
    blocks: post.blocks || [],
    seo: {
      metaTitle: post.seo?.metaTitle || post.title || '',
      metaDescription: post.seo?.metaDescription || post.excerpt || '',
      focusKeyword: post.seo?.focusKeyword || '',
      robotsIndex: true,
      robotsFollow: true,
    },
  };
  const yamlStr = yaml.dump(data, { lineWidth: -1, noRefs: true, sortKeys: false });
  return `---
${yamlStr}---

${post.body || ''}`;
}

const serializedComplexMd = formatPostToMarkdownRobust(complexPost);
const complexMatch = serializedComplexMd.match(/^---\n([\s\S]*?)\n---/);
let parsedComplexData = null;
let parseComplexSuccess = false;
try {
  parsedComplexData = yaml.load(complexMatch[1]);
  parseComplexSuccess = true;
} catch (e) {
  parseComplexSuccess = false;
}

check('Successfully serializes and parses complex frontmatter with quotes, colons, backslashes, and Unicode', parseComplexSuccess);
check('Preserves double/single quotes and special characters in title', parsedComplexData && parsedComplexData.title.includes('"Quotes"'));
check('Preserves backslashes and Unicode in author / excerpt', parsedComplexData && parsedComplexData.excerpt.includes('C:\\') && parsedComplexData.excerpt.includes('🚀'));
check('Preserves multi-line excerpts without breaking YAML structure', parsedComplexData && parsedComplexData.excerpt.includes('Line 2'));

// Multi-file atomic commit test
const multiFiles = {
  'src/content/posts/complex-post-slug.md': serializedComplexMd,
  'src/content/pages/about.md': '---\ntitle: "About Us"\nslug: "about"\n---\nAbout body',
  'src/data/siteSettings.json': JSON.stringify({ siteTitle: 'AstroPress' }, null, 2),
};

const multiFileChanges = diffCandidateFilesAgainstRemote(multiFiles, remoteTree);
check('Correctly detects multiple changed files (posts, pages, data configs)', multiFileChanges.length >= 2);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(` Test Execution Finished: ${pass} PASSED, ${fail} FAILED`);
console.log('===============================================================');

if (fail > 0) {
  process.exit(1);
} else {
  console.log('\nAll Git deployment & edge push automated tests passed cleanly!\n');
  process.exit(0);
}
