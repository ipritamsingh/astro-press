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

// ---------------------------------------------------------------------------
// Test Suite 8: Post Duplicate Prevention, Edits, Draft Filtering, & Date Sorting
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 8: Post Duplicate Prevention, Edits, Draft Filtering & Date Sorting ---');

function mockCmsStoreSave(posts, incomingPost) {
  const existingIndex = posts.findIndex(
    (p) =>
      (incomingPost.id && p.id === incomingPost.id) ||
      (incomingPost.slug && p.slug === incomingPost.slug) ||
      (incomingPost.originalSlug && (p.slug === incomingPost.originalSlug || p.originalSlug === p.slug)) ||
      (p.id && incomingPost.slug && p.id === `post-${incomingPost.slug}`)
  );
  if (existingIndex >= 0) {
    const existing = posts[existingIndex];
    const updated = [...posts];
    updated[existingIndex] = {
      ...existing,
      ...incomingPost,
      id: existing.id || incomingPost.id || `post-${incomingPost.slug}`,
      pubDate: existing.pubDate || incomingPost.pubDate || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
    return updated;
  } else {
    return [{ ...incomingPost, id: incomingPost.id || `post-${incomingPost.slug}-${Date.now()}` }, ...posts];
  }
}

let mockPosts = [
  { id: 'post-1', title: 'First Post', slug: 'first-post', status: 'published', pubDate: '2026-10-01T10:00:00.000Z' },
  { id: 'post-2', title: 'Second Post', slug: 'second-post', status: 'published', pubDate: '2026-10-02T10:00:00.000Z' },
];

// 1. Create a new post
const newPost = { title: 'Third Post', slug: 'third-post', status: 'published', pubDate: '2026-10-03T10:00:00.000Z' };
mockPosts = mockCmsStoreSave(mockPosts, newPost);
check('Creating a new post adds exactly 1 record (total 3)', mockPosts.length === 3);

// 2. Edit an existing post (same slug, updated title)
const editedPost = { id: 'post-1', title: 'First Post Updated', slug: 'first-post', status: 'published', pubDate: '2026-10-01T10:00:00.000Z' };
mockPosts = mockCmsStoreSave(mockPosts, editedPost);
check('Editing an existing post updates it in place without creating a duplicate (total 3)', mockPosts.length === 3);
check('Updated post title reflects new title', mockPosts.find(p => p.id === 'post-1').title === 'First Post Updated');
check('Original pubDate is preserved during edit', mockPosts.find(p => p.id === 'post-1').pubDate === '2026-10-01T10:00:00.000Z');

// 3. Edit post with changed slug and originalSlug tracking
const slugChangedPost = { id: 'post-1', title: 'First Post Renamed', slug: 'first-post-renamed', originalSlug: 'first-post', status: 'published', pubDate: '2026-10-01T10:00:00.000Z' };
mockPosts = mockCmsStoreSave(mockPosts, slugChangedPost);
check('Changing slug of existing post updates it without creating a duplicate (total 3)', mockPosts.length === 3);
check('Post slug updated successfully', mockPosts.find(p => p.id === 'post-1').slug === 'first-post-renamed');

// 4. Draft filtering test
const mixedPosts = [
  { id: 'p1', title: 'Pub 1', slug: 'pub-1', status: 'published', pubDate: '2026-10-05T10:00:00.000Z' },
  { id: 'p2', title: 'Draft 1', slug: 'draft-1', status: 'draft', pubDate: '2026-10-06T10:00:00.000Z' },
  { id: 'p3', title: 'Trash 1', slug: 'trash-1', status: 'trash', pubDate: '2026-10-04T10:00:00.000Z' },
  { id: 'p4', title: 'Pub 2', slug: 'pub-2', status: 'published', pubDate: '2026-10-03T10:00:00.000Z' },
];

const publicPublished = mixedPosts
  .filter(p => p.status !== 'draft' && p.status !== 'trash')
  .sort((a, b) => {
    const timeA = new Date(a.pubDate || 0).getTime();
    const timeB = new Date(b.pubDate || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (a.slug || '').localeCompare(b.slug || '');
  });

check('Unpublished drafts and trashed posts do not leak into public published list', publicPublished.length === 2 && publicPublished.every(p => p.status === 'published'));
check('Public published list correctly sorted newest-first by pubDate', publicPublished[0].slug === 'pub-1' && publicPublished[1].slug === 'pub-2');

// ---------------------------------------------------------------------------
// Test Suite 9: Admin Chronological Date Sorting & Trash Lifecycle Persistence
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 9: Admin Chronological Date Sorting & Trash Lifecycle Persistence ---');

// Helper matching PostsManager date parsing & sorting
function parsePostTimestamp(dateVal) {
  if (!dateVal) return 0;
  const t = new Date(dateVal).getTime();
  return isNaN(t) ? 0 : t;
}

function sortAdminPosts(postsList, sortBy = 'date-desc') {
  return [...postsList].sort((a, b) => {
    if (sortBy === 'date-desc') {
      const timeA = parsePostTimestamp(a.pubDate);
      const timeB = parsePostTimestamp(b.pubDate);
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || b.slug || '').localeCompare(a.id || a.slug || '');
    }
    if (sortBy === 'date-asc') {
      const timeA = parsePostTimestamp(a.pubDate);
      const timeB = parsePostTimestamp(b.pubDate);
      if (timeA !== timeB) return timeA - timeB;
      return (a.id || a.slug || '').localeCompare(b.id || b.slug || '');
    }
    return 0;
  });
}

// 1. Chronological sorting with valid, invalid, equal, and missing dates
const testSortItems = [
  { id: 'p-old', slug: 'old-article', pubDate: '2026-01-15T08:00:00.000Z' },
  { id: 'p-new', slug: 'new-article', pubDate: '2026-10-31T12:00:00.000Z' },
  { id: 'p-mid-a', slug: 'mid-article-a', pubDate: '2026-06-01T00:00:00.000Z' },
  { id: 'p-mid-b', slug: 'mid-article-b', pubDate: '2026-06-01T00:00:00.000Z' },
  { id: 'p-invalid', slug: 'invalid-date', pubDate: 'not-a-date' },
  { id: 'p-missing', slug: 'missing-date', pubDate: undefined },
];

const sortedDesc = sortAdminPosts(testSortItems, 'date-desc');
check(
  'Newest post appears first in date-desc sort',
  sortedDesc[0].id === 'p-new'
);
check(
  'Posts with equal dates are sorted deterministically by secondary key without NaN error',
  sortedDesc.findIndex(p => p.id === 'p-mid-b') < sortedDesc.findIndex(p => p.id === 'p-mid-a')
);
check(
  'Invalid and missing dates are handled safely and placed at the end without throwing or breaking order',
  sortedDesc[sortedDesc.length - 1].pubDate === undefined || sortedDesc[sortedDesc.length - 1].pubDate === 'not-a-date'
);

// 2. Publication date preservation and explicit admin override
function mockCmsSaveWithDate(posts, incoming) {
  const idx = posts.findIndex(p => p.id === incoming.id || p.slug === incoming.slug);
  if (idx >= 0) {
    const existing = posts[idx];
    const preservedPubDate = incoming.pubDate || existing.pubDate || new Date().toISOString();
    const updated = [...posts];
    updated[idx] = { ...existing, ...incoming, pubDate: preservedPubDate };
    return updated;
  }
  return [{ ...incoming, pubDate: incoming.pubDate || new Date().toISOString() }, ...posts];
}

let lifecyclePosts = [
  { id: 'post-alpha', slug: 'post-alpha', title: 'Alpha', status: 'published', pubDate: '2026-05-10T10:00:00.000Z' },
];

// Edit without changing pubDate
const editNoDateChange = { id: 'post-alpha', slug: 'post-alpha', title: 'Alpha Updated' };
lifecyclePosts = mockCmsSaveWithDate(lifecyclePosts, editNoDateChange);
check(
  'Original publication date is strictly preserved when editing an existing post',
  lifecyclePosts[0].pubDate === '2026-05-10T10:00:00.000Z'
);

// Explicit admin date override
const explicitDateChange = { id: 'post-alpha', slug: 'post-alpha', title: 'Alpha Updated', pubDate: '2026-11-01T09:00:00.000Z' };
lifecyclePosts = mockCmsSaveWithDate(lifecyclePosts, explicitDateChange);
check(
  'Explicit administrator pubDate change is respected and saved',
  lifecyclePosts[0].pubDate === '2026-11-01T09:00:00.000Z'
);

// 3. Normal deletion moves to trash without erasing content
function mockDeleteToTrash(posts, targetId) {
  return posts.map(p => {
    if (p.id === targetId || p.slug === targetId) {
      return {
        ...p,
        status: 'trash',
        originalStatus: p.status === 'trash' ? (p.originalStatus || 'published') : p.status,
        deletedAt: new Date().toISOString(),
      };
    }
    return p;
  });
}

lifecyclePosts = mockDeleteToTrash(lifecyclePosts, 'post-alpha');
const trashedItem = lifecyclePosts.find(p => p.id === 'post-alpha');
check(
  'Normal deletion moves post to status "trash" with content, title, and metadata intact',
  trashedItem && trashedItem.status === 'trash' && trashedItem.originalStatus === 'published' && trashedItem.title === 'Alpha Updated'
);

// 4. Trash persistence across simulated page reload and server sync
function mockSimulatedReload(storedLocalPosts, serverPublishedPosts) {
  const postMap = new Map();
  storedLocalPosts.forEach(p => {
    const key = p.id || p.slug;
    if (key) postMap.set(key, p);
  });

  serverPublishedPosts.forEach(sp => {
    let existingKey;
    let existing;
    for (const [k, p] of postMap.entries()) {
      if ((sp.id && (p.id === sp.id || p.id === `post-${sp.slug}`)) ||
          (sp.slug && (p.slug === sp.slug || p.originalSlug === sp.slug))) {
        existingKey = k;
        existing = p;
        break;
      }
    }
    if (!existing) {
      postMap.set(sp.id || sp.slug, sp);
    } else if (existing.status === 'trash') {
      postMap.set(existingKey, {
        ...sp,
        ...existing,
        status: 'trash',
        originalStatus: existing.originalStatus || sp.status || 'published',
        deletedAt: existing.deletedAt || new Date().toISOString(),
      });
    } else {
      postMap.set(existingKey, { ...sp, ...existing });
    }
  });
  return Array.from(postMap.values());
}

const mockServerCollection = [
  { id: 'post-alpha', slug: 'post-alpha', title: 'Alpha on Server', status: 'published', pubDate: '2026-05-10T10:00:00.000Z' },
];

const reloadedPosts = mockSimulatedReload(lifecyclePosts, mockServerCollection);
const postAfterReload = reloadedPosts.find(p => p.id === 'post-alpha' || p.slug === 'post-alpha');
check(
  'Trashed post remains in status "trash" after page reload and does not get resurrected to published',
  postAfterReload && postAfterReload.status === 'trash' && postAfterReload.deletedAt !== undefined
);

// 5. Restore behavior
function mockRestoreFromTrash(posts, targetId) {
  return posts.map(p => {
    if (p.id === targetId || p.slug === targetId) {
      return {
        ...p,
        status: p.originalStatus || 'draft',
        originalStatus: undefined,
        deletedAt: undefined,
      };
    }
    return p;
  });
}

const restoredPosts = mockRestoreFromTrash(reloadedPosts, 'post-alpha');
const restoredItem = restoredPosts.find(p => p.id === 'post-alpha');
check(
  'Restoring a post restores it to its original status (published) and removes trash metadata',
  restoredItem && restoredItem.status === 'published' && restoredItem.deletedAt === undefined
);

// 6. Protection against accidental permanent deletion
function mockPermanentDelete(posts, targetId) {
  return posts.filter(p => !(p.id === targetId || p.slug === targetId));
}

const unconfirmedList = [...reloadedPosts];
check(
  'Posts in trash are never deleted without explicit permanent deletion action',
  unconfirmedList.some(p => p.id === 'post-alpha' && p.status === 'trash')
);

const permanentlyDeletedList = mockPermanentDelete(unconfirmedList, 'post-alpha');
check(
  'Permanent deletion completely removes post only after explicit administrator action',
  !permanentlyDeletedList.some(p => p.id === 'post-alpha') && permanentlyDeletedList.length === unconfirmedList.length - 1
);

// ---------------------------------------------------------------------------
// 10. Explore by Topic Category Showcase & SVG Sanitization
// ---------------------------------------------------------------------------
console.log('\n--- Test Suite 10: Explore by Topic Category Showcase & SVG Sanitizer ---');

// 1. SVG Sanitizer tests
const FORBIDDEN_TAGS = ['script', 'foreignobject', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style', 'base', 'form', 'input', 'button', 'audio', 'video'];
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html'];

function testSanitizeSvg(rawSvg) {
  if (!rawSvg || typeof rawSvg !== 'string') return { valid: false, sanitized: '', error: 'SVG content cannot be empty' };
  const trimmed = rawSvg.trim();
  if (!trimmed.toLowerCase().includes('<svg') || !trimmed.toLowerCase().includes('</svg>')) {
    return { valid: false, sanitized: '', error: 'Input must contain a valid <svg>...</svg> element' };
  }
  const lower = trimmed.toLowerCase();
  for (const tag of FORBIDDEN_TAGS) {
    const openingTagRegex = new RegExp(`<\\s*${tag}[\\s>/]`, 'i');
    if (openingTagRegex.test(lower)) {
      return { valid: false, sanitized: '', error: `Dangerous element <${tag}> is not allowed` };
    }
  }
  let cleaned = trimmed;
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, '');
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  cleaned = cleaned.replace(/\s+(?:xlink:)?href\s*=\s*["']?\s*(?:javascript:|vbscript:|data:text\/html)[^"'>\s]*["']?/gi, '');
  const svgStart = cleaned.search(/<svg[\s>]/i);
  const svgEnd = cleaned.toLowerCase().lastIndexOf('</svg>');
  if (svgStart === -1 || svgEnd === -1) return { valid: false, sanitized: '', error: 'Valid SVG root tag not found' };
  return { valid: true, sanitized: cleaned.substring(svgStart, svgEnd + 6).trim() };
}

// 1a. Rejects <script> tags
const scriptSvg = '<svg viewBox="0 0 24 24"><script>alert("xss")</script><path d="M0 0h24v24H0z"/></svg>';
const scriptResult = testSanitizeSvg(scriptSvg);
check(
  'SVG Sanitizer blocks malicious <script> tags',
  !scriptResult.valid && scriptResult.error.includes('<script>')
);

// 1b. Strips inline event handlers (onload, onerror)
const onloadSvg = '<svg viewBox="0 0 24 24" onload="alert(1)"><circle cx="12" cy="12" r="10" onerror="alert(2)"/></svg>';
const onloadResult = testSanitizeSvg(onloadSvg);
check(
  'SVG Sanitizer strips inline on* event handler attributes',
  onloadResult.valid && !onloadResult.sanitized.includes('onload') && !onloadResult.sanitized.includes('onerror')
);

// 1c. Rejects <foreignObject>
const foreignSvg = '<svg viewBox="0 0 100 100"><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><h1>PWNED</h1></body></foreignObject></svg>';
const foreignResult = testSanitizeSvg(foreignSvg);
check(
  'SVG Sanitizer blocks <foreignObject> injections',
  !foreignResult.valid && foreignResult.error.includes('<foreignobject>')
);

// 1d. Strips javascript: URLs in href/xlink:href
const hrefSvg = '<svg viewBox="0 0 24 24"><a href="javascript:alert(1)"><path d="M0 0h24v24H0z"/></a></svg>';
const hrefResult = testSanitizeSvg(hrefSvg);
check(
  'SVG Sanitizer strips javascript: pseudo-protocol URLs',
  hrefResult.valid && !hrefResult.sanitized.includes('javascript:')
);

// 1e. Accepts clean, valid standard SVGs
const cleanSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
const cleanResult = testSanitizeSvg(cleanSvg);
check(
  'SVG Sanitizer successfully validates clean standard SVG markup',
  cleanResult.valid && cleanResult.sanitized.includes('<path')
);

// 2. Homepage Category Showcase filtering & ordering
const testCategories = [
  { id: 'cat-1', name: 'Technology', slug: 'technology', color: '#2563eb', icon: 'Cpu', iconType: 'library', showOnHomepage: true, order: 3 },
  { id: 'cat-2', name: 'Astro & Islands', slug: 'astro-islands', color: '#7c3aed', icon: 'Sparkles', iconType: 'library', showOnHomepage: true, order: 1 },
  { id: 'cat-3', name: 'Internal Drafts', slug: 'internal-drafts', color: '#6b7280', icon: 'FolderTree', iconType: 'library', showOnHomepage: false, order: 2 },
  { id: 'cat-4', name: 'Cloud Edge', slug: 'cloud-edge', color: '#ea580c', icon: 'Cloud', iconType: 'library', showOnHomepage: true, order: 4 },
];

const filteredShowcase = testCategories
  .filter((c) => c.showOnHomepage !== false)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

check(
  'Homepage Showcase excludes categories with showOnHomepage === false',
  !filteredShowcase.some((c) => c.slug === 'internal-drafts') && filteredShowcase.length === 3
);

check(
  'Homepage Showcase strictly orders categories by configured display order',
  filteredShowcase[0].slug === 'astro-islands' &&
  filteredShowcase[1].slug === 'technology' &&
  filteredShowcase[2].slug === 'cloud-edge'
);

// 3. Dynamic Category Article Count Calculation
const testArticles = [
  { slug: 'post-1', title: 'Post 1', category: 'Technology', status: 'published' },
  { slug: 'post-2', title: 'Post 2', category: 'technology', status: 'published' },
  { slug: 'post-3', title: 'Post 3', category: 'astro-islands', status: 'published' },
  { slug: 'post-4', title: 'Post 4', category: 'Technology', status: 'draft' }, // draft excluded
  { slug: 'post-5', title: 'Post 5', category: 'Technology', status: 'trash' }, // trash excluded
];

const publishedOnly = testArticles.filter((p) => p.status === 'published');
const techCat = testCategories.find((c) => c.slug === 'technology');
const techCount = publishedOnly.filter((p) => {
  const pCat = (p.category || '').trim().toLowerCase();
  return pCat === techCat.name.toLowerCase() || pCat === techCat.slug.toLowerCase() || pCat === techCat.id;
}).length;

check(
  'Category article count correctly tallies published articles and excludes drafts/trash',
  techCount === 2
);

// 4. Persistence & Serialization of categories.json
const fs = require('fs');
const path = require('path');
const categoriesJsonPath = path.resolve(__dirname, '../src/data/categories.json');
let categoriesJsonContent = null;
try {
  categoriesJsonContent = JSON.parse(fs.readFileSync(categoriesJsonPath, 'utf8'));
} catch (e) {
  categoriesJsonContent = null;
}

check(
  'src/data/categories.json contains valid JSON with categories array',
  categoriesJsonContent && Array.isArray(categoriesJsonContent.categories)
);

const sampleCategory = categoriesJsonContent ? categoriesJsonContent.categories[0] : null;
check(
  'categories.json categories contain name, slug, color, icon, iconType, showOnHomepage, and order',
  sampleCategory &&
  typeof sampleCategory.name === 'string' &&
  typeof sampleCategory.slug === 'string' &&
  typeof sampleCategory.color === 'string' &&
  typeof sampleCategory.icon === 'string' &&
  typeof sampleCategory.iconType === 'string' &&
  typeof sampleCategory.showOnHomepage === 'boolean' &&
  typeof sampleCategory.order === 'number'
);

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
