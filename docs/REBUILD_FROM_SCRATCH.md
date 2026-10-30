# Rebuild From Scratch: Complete Step-by-Step Construction Manual

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Document Type** | Comprehensive End-to-End Implementation Manual |
| **Audience** | Software Developers, Systems Engineers, AI Coding Agents |
| **Status** | Approved Rebuild Specification |

---

## 1. Overview & Rebuild Philosophy

This manual provides an unambiguous, step-by-step procedure to reconstruct the entire platform from an empty directory to a fully functioning, production-ready website with integrated CMS, visual Gutenberg editor, and Git-backed persistence.

Follow these stages sequentially. At each stage, run the specified validation check to confirm success before proceeding.

---

## 2. Stage 1: Directory Setup & Package Initialization

### Step 1.1: Create Project Root
```bash
mkdir edge-publishing-platform
cd edge-publishing-platform
git init
```

### Step 1.2: Initialize `package.json`
Create `package.json` with the following configuration:

```json
{
  "name": "edge-publishing-platform",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev --port 3000",
    "start": "astro dev --port 3000",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "tsc --noEmit",
    "validate": "node scripts/fix-and-validate-content.cjs"
  },
  "dependencies": {
    "@astrojs/react": "^4.2.0",
    "@astrojs/sitemap": "^3.2.1",
    "astro": "^5.4.0",
    "js-yaml": "^4.1.0",
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

### Step 1.3: Install Dependencies
```bash
npm install
```
*Validation*: Run `node -v` (ensure >= 20.x) and confirm `node_modules` exists.

---

## 3. Stage 2: Configuration Files

### Step 2.1: `tsconfig.json`
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### Step 2.2: `astro.config.mjs`
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:3000',
  output: 'static',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/wpadmin') && !page.includes('/admin')
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

### Step 2.3: `wrangler.toml`
```toml
name = "edge-publishing-platform"
pages_build_output_dir = "dist"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "publishing-platform-db"
database_id = "placeholder-d1-id"
```

### Step 2.4: `.env.example`
```ini
SITE_URL=http://localhost:3000
GITHUB_PAT=ghp_yourPersonalAccessToken
GITHUB_REPO_OWNER=your-org-or-username
GITHUB_REPO_NAME=edge-publishing-platform
GITHUB_BRANCH=main
AUTH_SECRET=min_32_characters_random_secret_string_here
```

---

## 4. Stage 3: Content Model & Strict Validation

### Step 3.1: Define Collection Schemas (`src/content/config.ts`)
Create `src/content/config.ts` enforcing Zod validation for articles and pages:
```typescript
import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(5).max(120),
    slug: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    excerpt: z.string().default(''),
    category: z.string().default('Uncategorized'),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Editorial Staff'),
    featuredImage: z.string().default('/assets/placeholder.webp'),
    featuredImageAlt: z.string().default('Featured image'),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    noIndex: z.boolean().default(false)
  })
});

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(2).max(120),
    pubDate: z.coerce.date().default(() => new Date()),
    draft: z.boolean().default(false),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional()
  })
});

export const collections = {
  posts: postsCollection,
  pages: pagesCollection
};
```

### Step 3.2: Seed Initial Content
Create:
- `src/content/posts/welcome-to-edge-publishing.md`
- `src/content/pages/about.md`
- `src/content/pages/contact.md`

Ensure valid YAML frontmatter blocks matching the schema.

---

## 5. Stage 4: Layouts & Public Frontend Pages

### Step 4.1: Base Layout (`src/layouts/BaseLayout.astro`)
Create the global HTML wrapper including viewport tags, Google fonts, and the dynamic `<slot />`.

### Step 4.2: SEO Component (`src/components/seo/SEOHead.astro`)
Render primary meta tags, OpenGraph cards, Twitter cards, and `Article` / `FAQPage` JSON-LD schemas.

### Step 4.3: Header & Footer (`src/components/common/Header.astro` & `Footer.astro`)
Build accessible navigation bars with mobile responsiveness.

### Step 4.4: Homepage (`src/pages/index.astro`)
Query posts using `getCollection('posts')`, sort by `pubDate` descending, and render:
1. Spotlight Hero for the top post.
2. 3-Column card grid for recent posts.
3. Sidebar with categories, tags, and search.

### Step 4.5: Article Reader (`src/pages/posts/[slug].astro`)
Implement `getStaticPaths()` returning all collection entries. Render the featured image, category badge, prose body via `<Content />`, sticky table of contents, and author bio card.

*Validation*: Run `npm run build` and ensure all static pages render into `dist/`.

---

## 6. Stage 5: Gutenberg Block Editor & Admin Island

### Step 5.1: Create Admin Route (`src/pages/wpadmin/index.astro`)
Create the Astro entry point mounting the client-only React single page app:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import AdminDashboard from '../../components/admin/AdminDashboard';
---
<BaseLayout title="Admin Dashboard | AstroPress">
  <AdminDashboard client:only="react" />
</BaseLayout>
```

### Step 5.2: Implement Visual Block Editor (`src/components/admin/GutenbergEditor.tsx`)
1. Implement block state array: `const [blocks, setBlocks] = useState<ContentBlock[]>([]);`
2. Implement block addition, deletion, and reordering.
3. Implement renderers for Paragraph, Heading (H2-H4), Code, Image, Quote, Accordion, Alert, Button.
4. Implement Document Inspector Sidebar (Title, Slug, Category, Tags, Status, Featured Image).

### Step 5.3: Safe YAML Serializer
Implement `generateYamlFrontmatter()`:
- Sanitize excerpts (strip newlines, Markdown images, escape double quotes).
- Serialize via `yaml.dump(data, { lineWidth: -1, noRefs: true, sortKeys: false, quotingType: '"' } as any)`.

---

## 7. Stage 6: Edge Functions & Database Migrations

### Step 7.1: SQL Migration (`migrations/0001_auth_schema.sql`)
Write SQL schema creating `admin_users`, `admin_sessions`, `admin_password_resets`, and `admin_audit_logs`.

### Step 7.2: Serverless Auth API (`functions/api/auth/login.ts`)
Implement PBKDF2 password verification, brute-force rate limit counters, and secure cookie creation.

### Step 7.3: Serverless GitHub Proxy (`functions/api/github/commit.ts`)
Implement edge function reading `GITHUB_PAT` from environment variables, executing Git Data API transactions (blobs -> tree -> commit -> update reference).

---

## 8. Stage 7: Automated Validation & Quality Verification

### Step 8.1: Create Sanitization Script (`scripts/fix-and-validate-content.cjs`)
Script scans all `.md` files, verifies delimiters, repairs unclosed quotes, and reports anomalies.

### Step 8.2: Run Full Quality Suite
```bash
# 1. Type Check
npm run lint

# 2. Content Validation
npm run validate

# 3. Production Static Build
npm run build
```

Confirm all three commands complete with **0 errors**. Your production-ready platform is complete and ready for deployment.
