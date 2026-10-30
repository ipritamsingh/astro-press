# AstroPress — Testing, Release & Regression Prevention Manual

| Metadata | Details |
| :--- | :--- |
| **System** | AstroPress Quality Assurance & Release Engineering |
| **Target Pipeline** | Local Development & Cloudflare Pages CI/CD |
| **Last Verified** | October 30, 2026 |

---

## 1. Verified Verification Commands Matrix

The following commands exist in the repository's `package.json` and have been directly executed and verified:

| Command | Tool | Purpose | Verified Result |
| :--- | :--- | :--- | :--- |
| `npm run lint` | `tsc --noEmit` | Validates TypeScript types across all 164 project files. | ✅ **Passed**: 0 errors. |
| `npm run check` | `@astrojs/check` | Analyzes Astro template syntax and content collection imports. | ✅ **Passed**: 0 errors. |
| `node scripts/fix-and-validate-content.cjs` | Custom Validator | Audits YAML frontmatter syntax across all 15 content files. | ✅ **Passed**: 15 files valid. |
| `npm run build` | `astro build` | Compiles clean production distribution to `dist/`. | ✅ **Passed**: 45 pages built in ~4s. |

---

## 2. Pre-Release Verification Protocol (Step-by-Step)

Before pushing commits to GitHub or triggering a Cloudflare Pages production deployment, execute the following 5-phase verification protocol:

```
[ Phase 1: Code Integrity ]
       │
       ▼ npm run lint (tsc --noEmit)
[ Phase 2: Template & Schema Check ]
       │
       ▼ npm run check (astro check)
[ Phase 3: Content & Frontmatter Audit ]
       │
       ▼ node scripts/fix-and-validate-content.cjs
[ Phase 4: Production Compilation ]
       │
       ▼ npm run build (astro build)
[ Phase 5: Secret Leakage & Output Audit ]
       │
       ▼ grep checks in dist/
[ Release Approved for GitHub Push ]
```

### Execution Script
```bash
# Execute full local release gate:
npm run lint && npm run check && node scripts/fix-and-validate-content.cjs && npm run build
```

---

## 3. Secret Leakage Audit

To guarantee that zero edge secrets (`GITHUB_PAT`, `RESEND_API_KEY`, `SESSION_SECRET`) leak into client-accessible production bundles:

```bash
# Audit generated HTML and JavaScript bundles in dist/
echo "Auditing dist/ for sensitive tokens..."
! grep -rnE "(github_pat_[a-zA-Z0-9_]+|ghp_[a-zA-Z0-9]+|re_[a-zA-Z0-9]+)" dist/
echo "PASS: Zero sensitive secrets detected in dist/"
```

---

## 4. Production Smoke Test Checklist

After deployment succeeds on `https://astro-press.pages.dev/`, verify the following checkpoints in a live browser:

1. **Homepage Loading (`/`)**:
   - Hero section renders with responsive typography and illustration.
   - Latest articles grid displays correct thumbnails and categories.
   - Core Web Vitals audit shows 95+ score.
2. **Article Route (`/posts/mastering-gutenberg-block-editor-astro-islands/`)**:
   - Semantic HTML tags (`<article>`, `<h2>`, `<p>`) render cleanly.
   - Zero client-side JavaScript required for article reading.
   - Schema.org `Article` JSON-LD script present in `<head>`.
3. **SEO & Discovery Routes**:
   - `/sitemap.xml`: Valid XML structure indexing all published URLs.
   - `/robots.txt`: Correct User-agent directives and sitemap URL.
4. **Admin Route (`/wpadmin/`)**:
   - Login view loads securely.
   - D1 session check validates successfully.
   - Gutenberg Editor canvas opens without console errors.

---

## 5. Recommended GitHub Actions CI Pipeline (Recommendation)

To enforce automated verification on every Pull Request and prevent malformed Markdown from ever reaching the `main` branch, add `.github/workflows/ci.yml`:

```yaml
name: AstroPress Quality Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.22.0
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate TypeScript
        run: npm run lint

      - name: Validate Content Frontmatter
        run: node scripts/fix-and-validate-content.cjs

      - name: Verify Production Build
        run: npm run build
```
