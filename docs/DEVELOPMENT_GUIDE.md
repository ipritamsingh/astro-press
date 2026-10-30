# Development Guide: Step-by-Step Implementation Manual

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Scope** | Complete End-to-End Development & Implementation Instructions |
| **Audience** | Software Engineers, Full-Stack Developers, Code Reviewers |
| **Status** | Approved Implementation Blueprint |

---

## 1. Local Environment Prerequisites

Ensure your development workstation meets the minimum environment specifications:
- **Node.js**: `v20.12.0` or `v22.x` LTS (`node -v`)
- **NPM**: `v10.x` or higher (`npm -v`)
- **Git**: `v2.40+` installed and configured with your name and email
- **IDE**: VS Code (recommended extensions: *Astro*, *Tailwind CSS IntelliSense*, *ESLint*)

---

## 2. Project Conventions & Coding Standards

### 2.1 File & Directory Naming
- **Astro Pages**: Lowercase kebab-case matching URL structure (e.g., `src/pages/posts/[slug].astro`).
- **React Components**: PascalCase (e.g., `src/components/admin/GutenbergEditor.tsx`).
- **Utility Modules**: camelCase (e.g., `src/utils/slugify.ts`, `src/utils/readingTime.ts`).
- **Content Files**: Lowercase kebab-case matching article slugs (e.g., `src/content/posts/edge-computing-guide.md`).

### 2.2 TypeScript Discipline
- `tsconfig.json` runs in strict mode (`"strict": true`).
- No implicit `any`. Explicitly type component props, API request/response bodies, and state variables.
- Content Collections schemas in `src/content/config.ts` are the canonical source of truth for content types.

### 2.3 Styling Discipline (Tailwind CSS v4)
- Zero inline `style="..."` attributes on public pages.
- Use utility classes with CSS variable tokens for theming.
- Public reading typography uses `@tailwindcss/typography` with `prose prose-slate max-w-none`.

---

## 3. The 20-Milestone Implementation Plan

To build this modern publishing platform from scratch, execute the following 20 chronological milestones:

```text
[M01: Scaffolding] -> [M02: Config & Scripts] -> [M03: Content Collections] -> [M04: Base Layouts]
       │
       ▼
[M05: Public Header/Footer] -> [M06: Article Reader Page] -> [M07: Homepage & Hero] -> [M08: Taxonomy Archives]
       │
       ▼
[M09: SEO & JSON-LD] -> [M10: D1 Auth Migrations] -> [M11: Edge Auth Functions] -> [M12: Admin App Shell]
       │
       ▼
[M13: Gutenberg Canvas] -> [M14: 12 Core Block Types] -> [M15: YAML Sanitizer Engine] -> [M16: Media WebP Pipeline]
       │
       ▼
[M17: Git Proxy API] -> [M18: Ad Inserter Module] -> [M19: Automated Validation] -> [M20: Cloudflare Pages Deploy]
```

### Milestone Details & Deliverables

#### Milestone 1: Project Scaffolding & Dependencies
Initialize an empty directory, configure `package.json`, and install core dependencies:
```bash
npm init -y
npm install astro@^5.0.0 @astrojs/react @astrojs/sitemap react react-dom lucide-react js-yaml
npm install -D tailwindcss @tailwindcss/vite typescript @types/react @types/node
```

#### Milestone 2: Astro & Vite Configurations
- Create `astro.config.mjs` registering `@astrojs/react` and `@astrojs/sitemap`.
- Set `output: 'static'` for global edge pre-rendering.
- Configure `tsconfig.json` with path aliases (`@components/*`, `@utils/*`).

#### Milestone 3: Content Collection Schema Setup
- Create `src/content/config.ts` defining strict `zod` schemas for `posts` and `pages`.
- Ensure fields: `title`, `slug`, `pubDate`, `excerpt`, `category`, `tags`, `featuredImage`, `metaTitle`.

#### Milestone 4: Base Layout System
- Implement `src/layouts/BaseLayout.astro` containing the `<head>` metadata, fonts, styles, and `<slot />`.
- Ensure responsive viewport tags and open-graph fallbacks.

#### Milestone 5: Global Header & Footer Components
- Build `src/components/common/Header.astro` with sticky positioning and responsive mobile drawer.
- Build `src/components/common/Footer.astro` with sitemap links and copyright notice.

#### Milestone 6: Long-Form Post Reader (`src/pages/posts/[slug].astro`)
- Fetch articles using `getCollection('posts', filterDrafts)`.
- Render post header, category badge, author byline, featured image, reading time, and `<Content />`.
- Inject sticky Table of Contents based on `headings`.

#### Milestone 7: Homepage & Spotlight Hero (`src/pages/index.astro`)
- Query top featured/pinned post for the Hero section.
- Query subsequent recent posts into a responsive 3-column card grid.
- Build desktop sidebar featuring search, categories list, and newsletter callout.

#### Milestone 8: Taxonomy & Author Archives
- Create dynamic routes: `src/pages/category/[category].astro` and `src/pages/author/[author].astro`.
- Filter collection entries matching route params.

#### Milestone 9: Dynamic SEO, Sitemap & JSON-LD
- Create `src/components/seo/SEOHead.astro` generating `<meta>`, OpenGraph, and Twitter tags.
- Inject `Article` and `FAQPage` JSON-LD schemas.
- Configure automatic XML sitemap endpoint at `src/pages/sitemap.xml.ts`.

#### Milestone 10: Relational SQL Migrations (Cloudflare D1)
- Write `migrations/0001_auth_schema.sql` creating tables: `admin_users`, `admin_sessions`, `admin_password_resets`, and `admin_audit_logs`.
- Configure `wrangler.toml` binding D1 database to the project.

#### Milestone 11: Serverless Edge Auth Functions (`functions/api/auth/*`)
- Implement PBKDF2 password verification with salt in `functions/api/auth/login.ts`.
- Issue 32-byte session tokens stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
- Implement rate limiting with 15-minute lockouts upon 5 failed attempts.

#### Milestone 12: Admin App Shell (`src/pages/wpadmin/index.astro`)
- Mount single-page React app with client hydration: `<AdminDashboard client:only="react" />`.
- Build navigation sidebar: Posts, New Post, Media, Categories, Ads, Git Deployment, Settings.

#### Milestone 13: Gutenberg Block Canvas Foundation
- Implement React canvas component handling state as an array of block objects.
- Implement block insertion via `/` slash shortcut and floating `+` buttons.
- Implement block reordering (up/down arrow buttons and drag handles).

#### Milestone 14: Core Gutenberg Block Components
- Implement renderers and editors for all 12 core blocks:
  - Paragraph, Heading (H2-H4), Blockquote, Code (with syntax highlighting), Image, Gallery, Accordion, Alert, Button, Author Showcase, Table, Download Box.

#### Milestone 15: Safe YAML Frontmatter Sanitizer
- Build serialization logic in `src/utils/frontmatterSanitizer.ts`.
- Automatically strip newlines and embedded markdown images from excerpts and meta fields.
- Serialize via `yaml.dump` using `lineWidth: -1` and strict double quotes (`quotingType: '"'`).

#### Milestone 16: Media Library & WebP Conversion Pipeline
- Build `src/components/admin/MediaLibrary.tsx`.
- Implement client-side Canvas WebP compression (0.82 quality) before file upload.
- Display media grid with copy-link buttons and alt-text editing.

#### Milestone 17: Server-Side Git Persistence Proxy (`functions/api/github/*`)
- Implement edge endpoint `functions/api/github/commit.ts`.
- Read `GITHUB_PAT` from environment secrets.
- Execute GitHub Git Data API calls: create blob -> create tree -> create commit -> update branch reference.
- Zero Git tokens exposed to client storage.

#### Milestone 18: Ad Inserter Module
- Create ad injection utility in `src/utils/adInserter.ts`.
- Automatically inject designated ad units after paragraph *N* without breaking markdown syntax or layout structure.

#### Milestone 19: Pre-Build Validation & Test Suite
- Write `scripts/fix-and-validate-content.cjs` to audit all `.md` files prior to build.
- Add `npm run validate` and `npm run lint` commands to `package.json`.

#### Milestone 20: Production Build & Cloudflare Pages Release
- Execute `npm run build` and verify that all static pages generate in `dist/`.
- Connect repository to Cloudflare Pages, configure secrets (`GITHUB_PAT`, `AUTH_SECRET`), and verify global edge deployment.

---

## 4. Local Development Workflows

### Starting the Environment
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Access local endpoints
# Public Site: http://localhost:3000
# Admin CMS:   http://localhost:3000/wpadmin/
```

### Validating Content & Types
```bash
# Verify frontmatter formatting across all posts
npm run validate

# Run strict TypeScript type checks
npm run lint

# Test static production build locally
npm run build
```
