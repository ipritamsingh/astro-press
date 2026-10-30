# Testing Strategy & Quality Assurance Manual

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **QA Focus** | Build Reliability, Frontmatter Integrity, Security Gates & Regressions |
| **Audience** | QA Engineers, Test Automation Specialists, Release Managers |
| **Status** | Approved Testing Strategy Document |

---

## 1. Quality Assurance Pyramid & Test Layers

The platform's testing strategy is organized into five complementary testing layers to prevent regressions from reaching production:

```text
                  ▲
                 / \
                /   \     E2E / Smoke Tests (Browser Playwright Flows)
               /-----\
              /       \    Integration Tests (Edge Functions & Git Proxy)
             /---------\
            /           \   Build-Time Schema Gate (Astro SSG + Zod Collections)
           /-------------\
          /               \  Automated Frontmatter Sanitizer Audits
         /-----------------\
        /                   \ Type Safety & Static Analysis (TypeScript Strict)
       +---------------------+
```

---

## 2. Layer 1: Static Type Checking (`npm run lint`)

- **Tool**: TypeScript Compiler (`tsc --noEmit`)
- **Scope**: All `.ts`, `.tsx`, and `.astro` components.
- **Rules**:
  - Enforces `"strict": true` in `tsconfig.json`.
  - Zero tolerance for missing imports, incorrect prop types, or unsafe `any` usage.
  - Guarantees compatibility between block data models and editor state handlers.

---

## 3. Layer 2: Frontmatter & Content Validation Script (`npm run validate`)

Because invalid YAML frontmatter crashes the Astro compiler, content files must pass an automated validation audit before build execution:

- **Script**: `scripts/fix-and-validate-content.cjs`
- **Validation Rules**:
  1. **Delimiters**: Verifies file starts and ends frontmatter with valid `---` lines.
  2. **Quote Balancing**: Scans for unclosed double or single quotes within scalar fields.
  3. **Newline Violations**: Detects illegal line breaks inside `excerpt` or `metaDescription`.
  4. **Required Keys**: Verifies presence of `title`, `pubDate`, `featuredImage`, `category`.
  5. **Auto-Repair**: Automatically strips Markdown images and normalizes multiline text if anomalies are detected.

---

## 4. Layer 3: Build Integrity Gate (`npm run build`)

- **Command**: `npx astro build`
- **Behavior**:
  - Astro parses every Markdown file through the Zod schema defined in `src/content/config.ts`.
  - Generates 100% of static HTML pages, category archives, author pages, and the XML sitemap.
  - If a single page fails to generate or has invalid frontmatter, the command exits with a non-zero exit code (`1`), aborting deployment.

---

## 5. Layer 4: Integration & Security Test Suites

### 5.1 Authentication Flow Tests
- Verify successful login generates an `HttpOnly` session cookie with valid 7-day expiration.
- Verify 5 consecutive failed logins lock the account for exactly 15 minutes.
- Verify unauthenticated requests to `/wpadmin/` redirect to `/wpadmin/login`.
- Verify logging out deletes the session from `admin_sessions` and clears the cookie.

### 5.2 Server-Side GitHub Proxy Tests
- Verify `POST /api/github/commit` rejects requests lacking an active session cookie (HTTP 401).
- Verify the server proxy reads `GITHUB_PAT` without exposing the token in response headers or body.
- Verify Git Data API calls create atomic commits containing both Markdown text and image assets.

---

## 6. Layer 5: End-to-End Smoke Test Checklist

Execute this manual or automated smoke test on every release candidate:

| Test Case ID | Test Flow Description | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **TC-01** | Load homepage (`/`) on mobile viewport (375px) | Hero article, post grid, and header render with zero horizontal scroll; FCP < 1.0s. | [ ] Pass |
| **TC-02** | Navigate to `/posts/[slug]` | Full article body renders, reading time displays, TOC links navigate to sections, CLS = 0. | [ ] Pass |
| **TC-03** | Verify `/sitemap.xml` | XML document contains all published posts; excludes drafts and `/wpadmin/`. | [ ] Pass |
| **TC-04** | Access `/wpadmin/` unauthenticated | Browser redirects to `/wpadmin/login`. | [ ] Pass |
| **TC-05** | Login with valid admin credentials | Session cookie created; redirects to Admin Dashboard with metrics visible. | [ ] Pass |
| **TC-06** | Create new article in Gutenberg Editor | Enter title, insert 3 blocks (Heading, Paragraph, Image), add tags, click Save. | [ ] Pass |
| **TC-07** | Inspect saved Markdown file | Frontmatter is 100% valid YAML; image dimensions and tags properly formatted. | [ ] Pass |
| **TC-08** | Trigger Git Deployment Push | Proxy creates commit on target branch; status badge updates to "Synchronized". | [ ] Pass |

---

## 7. Performance & Accessibility Automated Audits

- **Lighthouse CI**: Must score **>= 95** on Performance, Accessibility, Best Practices, and SEO.
- **Axe Core Accessibility**: Zero critical or serious accessibility violations. Form labels, image alt tags, and color contrast must satisfy WCAG 2.1 AA.
