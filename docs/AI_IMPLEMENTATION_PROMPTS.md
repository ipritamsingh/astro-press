# AI Implementation Prompts: Milestone-by-Milestone AI Agent Runbook

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Document Type** | Copy-Ready AI Agent Implementation Directives |
| **Target Models** | Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, AI Studio Build Engine |
| **Status** | Approved AI Operational Prompts |

---

## 1. How to Use These Prompts

These copy-ready prompts are engineered to instruct an AI coding agent or LLM engineer to build the platform incrementally without architectural drift or hallucinated dependencies.

**Instructions for the Human Operator**:
1. Run the prompts in numerical order.
2. Provide the prompt in a fresh or existing session.
3. Verify that the agent runs the specified **Validation Command** before moving to the next prompt.

---

## 2. Phase 1: Scaffolding & Base Configurations

### Prompt 1.1: Project Scaffolding & Dependencies
```text
PROMPT 1.1: Initialize Edge Publishing Platform Project Scaffolding

OBJECTIVE:
Initialize a modern, edge-first digital publishing platform using Astro 5, React 19, and Tailwind CSS v4.

TARGET FILES:
- package.json
- tsconfig.json
- astro.config.mjs
- wrangler.toml
- .env.example

TECHNICAL CONSTRAINTS:
1. Target Node.js v22 LTS runtime.
2. Astro must be configured with `output: 'static'` for edge pre-rendering.
3. Integrations: `@astrojs/react` and `@astrojs/sitemap`.
4. Tailwind CSS v4 must be loaded via `@tailwindcss/vite` plugin.
5. Strict TypeScript mode enabled with path aliases (@components/*, @utils/*, @layouts/*).

VALIDATION COMMAND:
npm install && npx tsc --noEmit
```

---

## 3. Phase 2: Content Models & Schemas

### Prompt 2.1: Content Collection Schema & Seed Articles
```text
PROMPT 2.1: Setup Astro Content Collections with Strict Zod Validation

OBJECTIVE:
Create the type-safe Content Collection definitions and seed Markdown files.

TARGET FILES:
- src/content/config.ts
- src/content/posts/welcome-to-edge-publishing.md
- src/content/pages/about.md
- src/content/pages/contact.md

TECHNICAL CONSTRAINTS:
1. Use `defineCollection` and `z` from `astro:content`.
2. 'posts' collection schema must enforce:
   - title (string, 5-120 chars)
   - slug (optional string)
   - pubDate (coerce.date)
   - excerpt (string, max 350 chars)
   - category (string)
   - tags (array of strings)
   - featuredImage (string)
   - featuredImageAlt (string)
   - draft (boolean, default false)
3. 'pages' collection schema must enforce title, pubDate, draft.
4. Provide realistic, high-quality Markdown seed files with valid YAML frontmatter.

VALIDATION COMMAND:
npx astro check || npx tsc --noEmit
```

---

## 4. Phase 3: Public Website & Reader Layouts

### Prompt 3.1: Base Layout, Header, Footer, and Homepage
```text
PROMPT 3.1: Implement Responsive Public Layouts and Homepage

OBJECTIVE:
Build the public reading experience with zero client-side JavaScript for reading.

TARGET FILES:
- src/layouts/BaseLayout.astro
- src/components/common/Header.astro
- src/components/common/Footer.astro
- src/pages/index.astro

TECHNICAL CONSTRAINTS:
1. Header must include site branding, desktop navigation links, search icon, and a mobile hamburger menu.
2. Homepage must query posts via `getCollection('posts')` and render:
   - Spotlight Hero article (pinned or latest post) with high-res 16:9 featured image.
   - 3-column responsive post card grid.
   - Sidebar containing categories list, trending tags, and newsletter box.
3. Cumulative Layout Shift (CLS) must be 0 (all images specify width and height).
4. Tailwind CSS v4 utility classes only.

VALIDATION COMMAND:
npx astro build
```

### Prompt 3.2: Long-Form Article Reader Page
```text
PROMPT 3.2: Implement Article Reader Page with Sticky Table of Contents

OBJECTIVE:
Build the dynamic long-form article reader route at `/posts/[slug].astro`.

TARGET FILES:
- src/pages/posts/[slug].astro
- src/components/seo/SEOHead.astro

TECHNICAL CONSTRAINTS:
1. Use `getStaticPaths()` to generate routes for all non-draft posts.
2. Render:
   - Category badge with color accent.
   - Main headline (`h1`), excerpt, author byline, and estimated reading time.
   - High-resolution featured image with accessible alt text.
   - Markdown prose body via `<Content />` using `@tailwindcss/typography` styles.
   - Sticky desktop Table of Contents dynamically generated from headings.
   - Author bio showcase card and 3 related posts.
3. SEOHead must render `<title>`, meta description, canonical link, OpenGraph tags, and Article JSON-LD schema.

VALIDATION COMMAND:
npx astro build
```

---

## 5. Phase 4: Custom Admin Island & Gutenberg Editor

### Prompt 4.1: Custom Admin App Shell (`/wpadmin/`)
```text
PROMPT 4.1: Implement Single-Page Admin CMS Island

OBJECTIVE:
Create a responsive admin management application mounted inside Astro at `/wpadmin/`.

TARGET FILES:
- src/pages/wpadmin/index.astro
- src/components/admin/AdminDashboard.tsx
- src/components/admin/PostListTable.tsx

TECHNICAL CONSTRAINTS:
1. Mount the React root in Astro using `client:only="react"`.
2. Implement responsive admin layout with collapsible left sidebar and top bar.
3. Sidebar navigation: Dashboard, Posts (All), New Story, Pages, Media Library, Categories, Ads Manager, Git Deployment, Settings.
4. Posts table must display post title, author, category, publication date, and status badges (Published / Draft).
5. Include status filter tabs: "All", "Published", "Drafts".

VALIDATION COMMAND:
npx tsc --noEmit
```

### Prompt 4.2: Gutenberg-Style Visual Block Editor
```text
PROMPT 4.2: Implement Gutenberg Visual Block Editor Canvas and 12 Core Blocks

OBJECTIVE:
Build a visual, modular block editor for writing and editing articles.

TARGET FILES:
- src/components/admin/GutenbergEditor.tsx
- src/components/admin/BlockRenderer.tsx
- src/components/admin/InspectorSidebar.tsx

TECHNICAL CONSTRAINTS:
1. Block canvas manages state as an array of typed block objects (`ContentBlock[]`).
2. Supported blocks: Paragraph, Heading (H2-H4), Blockquote, Code (with language selector), Image, Gallery, Accordion/FAQ, Alert Callout, Button, Table, Author Showcase, Download Box.
3. Support block reordering (up/down arrows), duplicate, and delete actions.
4. Right-hand Inspector Sidebar with three tabs:
   - Document: Title, Slug, Category, Tags, Status, Featured Image, Excerpt.
   - Block: Settings specific to the active focused block.
   - SEO: Meta title counter, meta description counter, Google search preview card.
5. Auto-calculate reading time based on total word count.

VALIDATION COMMAND:
npx tsc --noEmit
```

### Prompt 4.3: Safe YAML Frontmatter Sanitizer
```text
PROMPT 4.3: Implement Frontmatter Sanitizer & YAML Serialization Engine

OBJECTIVE:
Build the frontmatter generation utility to guarantee that saving articles never breaks the Astro compiler.

TARGET FILES:
- src/utils/frontmatterSanitizer.ts

TECHNICAL CONSTRAINTS:
1. Strip all newlines (`\r\n`) and tabs from excerpt and metaDescription fields.
2. Strip embedded Markdown image syntax (`![...]`) from excerpt fields.
3. Escape inner quotes.
4. Serialize using `js-yaml` with:
   - `lineWidth: -1` (prevent line wrapping)
   - `noRefs: true`
   - `sortKeys: false`
   - `quotingType: '"'` (cast as any to satisfy TypeScript TS2353)
5. Return complete Markdown file string with `---` frontmatter delimiters.

VALIDATION COMMAND:
npx tsc --noEmit
```

---

## 6. Phase 5: Edge Functions, D1 Auth & Git Proxy

### Prompt 5.1: D1 Database Migrations and Edge Auth Functions
```text
PROMPT 5.1: Implement Relational D1 Auth Schema and Edge Authentication Functions

OBJECTIVE:
Implement secure edge-based authentication with password hashing and session tokens.

TARGET FILES:
- migrations/0001_auth_schema.sql
- functions/api/auth/login.ts
- functions/api/auth/logout.ts
- functions/api/auth/session.ts

TECHNICAL CONSTRAINTS:
1. SQL schema must create `admin_users`, `admin_sessions`, `admin_password_resets`, `admin_audit_logs`.
2. Passwords hashed using PBKDF2-SHA256 with 100,000 iterations and 16-byte random salt.
3. Session tokens (32 bytes hex) stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with 7-day TTL.
4. Implement brute-force defense: lock account for 15 minutes upon 5 consecutive failed attempts.

VALIDATION COMMAND:
npx tsc --noEmit
```

### Prompt 5.2: Server-Side GitHub Git Data API Proxy
```text
PROMPT 5.2: Implement Server-Side Git Persistence Proxy

OBJECTIVE:
Create the serverless edge proxy to commit article updates to GitHub without exposing tokens.

TARGET FILES:
- functions/api/github/commit.ts
- functions/api/github/status.ts

TECHNICAL CONSTRAINTS:
1. Protect all `/api/github/*` routes by verifying active session cookie against D1 `admin_sessions`.
2. Retrieve `GITHUB_PAT` strictly from environment secrets. Zero tokens sent to browser.
3. Execute GitHub Git Data API workflow:
   - GET current branch reference SHA.
   - POST blob for modified Markdown/image files.
   - POST new tree referencing parent tree SHA.
   - POST new commit.
   - PATCH branch reference to point to new commit.
4. Return commit SHA and branch name upon success.

VALIDATION COMMAND:
npx tsc --noEmit
```

---

## 7. Phase 6: Validation Scripts & Release Verification

### Prompt 7.1: Automated Content Validator & Build Gate
```text
PROMPT 7.1: Create Automated Content Validation Script and Build Verification

OBJECTIVE:
Create the pre-build validation script and verify that the complete site builds cleanly.

TARGET FILES:
- scripts/fix-and-validate-content.cjs

TECHNICAL CONSTRAINTS:
1. Node.js CommonJS script scanning all `.md` files in `src/content/posts/` and `src/content/pages/`.
2. Validate YAML delimiters and parse frontmatter.
3. Verify presence of required fields (`title`, `pubDate`, `featuredImage`, `category`).
4. Automatically repair unescaped quotes or illegal line breaks.
5. Exit with code 0 on success, code 1 on unrecoverable failure.

VALIDATION COMMAND:
node scripts/fix-and-validate-content.cjs && npm run lint && npm run build
```
