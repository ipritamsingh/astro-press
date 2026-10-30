# AstroPress — Environment Variables & Secrets Configuration

| Metadata | Details |
| :--- | :--- |
| **Document Target** | AstroPress Security & Operations |
| **Classification** | Public Configuration Reference |
| **Last Verified** | October 30, 2026 |

---

## 1. Security Principles & Secret Handling

AstroPress enforces strict **Zero Token Leakage**:
1. **No Client Secrets**: Client-side browser code (`src/components/`, `src/layouts/`) contains **zero** API keys, personal access tokens, or database credentials.
2. **Exclusively Server-Side**: All sensitive variables (`GITHUB_PAT`, `RESEND_API_KEY`, `SESSION_SECRET`) are consumed exclusively in Cloudflare Pages Functions (`functions/api/*`) or the local development server proxy (`src/server/localD1Server.ts`).
3. **Never Echoed**: Server endpoints never return authorization tokens, request headers, or secrets in API JSON responses or error logs.

---

## 2. Environment Variables Specification

### `SITE_URL`
- **Purpose**: Canonical origin URL for the production website. Used to generate OpenGraph URLs, canonical link headers, XML sitemap paths, and password reset email links.
- **Required**: Required for production; defaults to `http://localhost:3000` in local development.
- **Where Configured**: `.env.local` (local development); Cloudflare Pages Dashboard &rarr; Settings &rarr; Environment variables.
- **Read by**: `astro.config.mjs`, `functions/api/auth/[[route]].ts`, `src/utils/seoUtils.ts`.
- **Exposed to Browser**: Yes (Public URL metadata).
- **Format**: `https://astro-press.pages.dev` (No trailing slash).
- **Missing Behavior**: Falls back to `http://localhost:3000`.

---

### `GITHUB_PAT`
- **Purpose**: GitHub Fine-Grained Personal Access Token with repository write permissions. Used by the server-side proxy to commit updated Markdown articles and media files directly to the GitHub repository.
- **Required**: Required for GitHub publishing and automated Cloudflare edge deployments. Optional for offline local authoring.
- **Where Configured**: `.env.local` (local); Cloudflare Pages Dashboard &rarr; Settings &rarr; Environment variables (Production secret).
- **Read by**: `functions/api/github/[[route]].ts`, `src/server/localD1Server.ts`.
- **Exposed to Browser**: **NO. Strict server secret.**
- **Format**: `github_pat_11...` or classic `ghp_...`.
- **Required GitHub Scopes**:
  - Fine-Grained PAT: Repository permissions &rarr; **Contents: Read and write**.
  - Classic PAT: `repo` scope.
- **Missing Behavior**: The `/api/github/*` proxy returns HTTP 503 (`GitHub PAT secret (GITHUB_PAT) is not configured on the server`).

---

### `RESEND_API_KEY`
- **Purpose**: API key for Resend transactional email service. Used to send secure, single-use, 15-minute expiring password reset links to administrators.
- **Required**: Optional. If omitted, administrators can reset passwords using offline Emergency Recovery Codes generated during initial setup.
- **Where Configured**: `.env.local` (local); Cloudflare Pages Dashboard &rarr; Settings &rarr; Environment variables.
- **Read by**: `functions/api/auth/[[route]].ts`, `src/server/d1AuthEngine.ts`.
- **Exposed to Browser**: **NO. Strict server secret.**
- **Format**: `re_YourResendApiKeyHere`.
- **Missing Behavior**: Password reset attempts return a user notice advising them to use their offline Emergency Recovery Codes.

---

### `SESSION_SECRET`
- **Purpose**: Cryptographic entropy string used to salt session token hashing and cookie validation.
- **Required**: Optional (falls back to a built-in cryptographic salt if unspecified).
- **Where Configured**: `.env.local` (local); Cloudflare Pages Dashboard &rarr; Settings &rarr; Environment variables.
- **Read by**: `functions/api/auth/[[route]].ts`, `src/server/d1AuthEngine.ts`.
- **Exposed to Browser**: **NO. Strict server secret.**
- **Format**: Random 32+ character hexadecimal string.

---

### `NODE_VERSION`
- **Purpose**: Defines the Node.js runtime version for the Cloudflare Pages build pipeline.
- **Required**: Recommended to match repository engine specification.
- **Where Configured**: Cloudflare Pages Dashboard &rarr; Settings &rarr; Environment variables (Build).
- **Value**: `22.22.0`.
- **Exposed to Browser**: No (Build environment only).

---

## 3. Local Development Template (`.env.example`)

```bash
# Production domain origin used for canonical metadata and password reset links
SITE_URL=http://localhost:3000

# Resend API Key for sending transactional password reset emails (optional)
RESEND_API_KEY=re_YourResendApiKeyHere

# GitHub Personal Access Token (PAT) for server-side repository commits
# Required: Fine-grained token with "Contents: Read and write"
GITHUB_PAT=github_pat_YourFineGrainedTokenHere

# Session encryption secret (optional)
SESSION_SECRET=your_random_32_character_secret_here
```

---

## 4. Verification & Secret Leakage Audits

To audit your repository and build artifacts for accidental secret exposure:

```bash
# 1. Verify no secrets are bundled in the static output
npm run build
grep -rn "github_pat_" dist/ || echo "PASS: No GitHub tokens in dist/"
grep -rn "re_" dist/ || echo "PASS: No Resend keys in dist/"

# 2. Verify git status ignores local environment files
git status --ignored
# Expected output includes: .env, .env.local, .d1/
```
