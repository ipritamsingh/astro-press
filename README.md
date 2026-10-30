# Modern Edge Publishing Platform with Gutenberg-Style Visual CMS

> **An enterprise-grade, edge-first digital publishing platform and headless CMS blueprint built with Astro 5, React 19 islands, Tailwind CSS v4, Content Collections, and serverless edge storage.**

[![Framework](https://img.shields.io/badge/Astro-5.x-BC52EE.svg?style=flat&logo=astro)](https://astro.build/)
[![UI](https://img.shields.io/badge/React-19.x-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Runtime](https://img.shields.io/badge/Runtime-Node_22_LTS-339933.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Executive Summary & Architecture Philosophy

This repository contains the complete specification, source code, and rebuild blueprint for a production-ready publishing website with an integrated Content Management System (CMS). 

It is engineered around a core architectural principle: **Zero Client-Side JavaScript for public content reading, paired with rich, client-side visual application islands for editorial workflows.**

```
+-----------------------------------------------------------------------------------+
|                                 PUBLIC READERS                                    |
|   +---------------------------------------------------------------------------+   |
|   |  Home (/)  |  Articles (/posts/*)  |  Pages (/*)  |  Categories (/category)   |   |
|   +---------------------------------------------------------------------------+   |
|                      Static HTML / Edge CDN Cache (0 KB Client JS)                |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | Static Edge Build (Astro SSG)
+-----------------------------------------------------------------------------------+
|                                EDITORIAL WORKSPACE                                |
|   +---------------------------------------------------------------------------+   |
|   |  Admin Dashboard (/wpadmin/)  |  Gutenberg-Style Block Editor (/editor)   |   |
|   |  Media Library                |  SEO Inspector & Schema Generator         |   |
|   +---------------------------------------------------------------------------+   |
|                      Interactive React 19 Client Islands                          |
+-----------------------------------------------------------------------------------+
           |                                                      |
           v (Local / API Proxy)                                  v (Relational Storage)
+-----------------------------------------+   +-------------------------------------+
|        Git / Markdown Repository        |   |       Edge Database (D1/SQLite)     |
|   * src/content/posts/*.md              |   |   * Admin Accounts & Passwords      |
|   * src/content/pages/*.md              |   |   * Auth Sessions & Lockouts        |
|   * public/assets/uploads/*             |   |   * Password Reset Tokens           |
+-----------------------------------------+   +-------------------------------------+
```

### Core Value Drivers
1. **Speed & Web Vitals**: 100/100 Google PageSpeed scores, zero layout shifts (CLS = 0), and instant First Contentful Paint (<0.8s) delivered from global edge points of presence.
2. **Editorial Ergonomics**: Authors construct complex stories using a visual Gutenberg-style block editor featuring 12+ standard block types (headings, paragraphs, blockquotes, code, tables, accordions, galleries, callout boxes).
3. **Data Sovereignty & Versioning**: All written content is stored as clean, human-readable Markdown files with Zod-validated YAML frontmatter committed directly into Git version control.
4. **Security & Zero-Token Exposure**: Git personal access tokens and deployment credentials are managed exclusively server-side via edge proxy routes. Tokens are never exposed to browser storage.

---

## Complete Documentation Index

This project includes a comprehensive, 15-part technical documentation suite designed to guide developers, architects, and AI coding agents through building, configuring, deploying, and maintaining the system:

| Document | Primary Scope | Target Audience |
| :--- | :--- | :--- |
| [**PRD.md**](./PRD.md) | Complete Product Requirements Document, user personas, functional & non-functional requirements. | Product Managers & Engineers |
| [**docs/FEATURE_SPECIFICATION.md**](./docs/FEATURE_SPECIFICATION.md) | Granular functional specifications for all 11 system features with acceptance criteria. | Frontend & Backend Engineers |
| [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | High-level system architecture, data-flow diagrams, component boundaries, and security models. | System Architects & Tech Leads |
| [**docs/DATABASE_AND_CONTENT_MODEL.md**](./docs/DATABASE_AND_CONTENT_MODEL.md) | Content Collection schemas, Zod validations, frontmatter rules, and D1 authentication tables. | Database & Content Engineers |
| [**docs/UI_UX_SPECIFICATION.md**](./docs/UI_UX_SPECIFICATION.md) | Layout wireframes, responsive breakpoints, Gutenberg canvas controls, and design system tokens. | UI/UX Designers & Frontend Devs |
| [**docs/DEVELOPMENT_GUIDE.md**](./docs/DEVELOPMENT_GUIDE.md) | Environment setup, project structure, conventions, coding guidelines, and local workflows. | Full-Stack Developers |
| [**docs/DEPLOYMENT_GUIDE.md**](./docs/DEPLOYMENT_GUIDE.md) | Hosting infrastructure setup, Cloudflare Pages build configurations, and production release flows. | DevOps & Platform Engineers |
| [**docs/SECURITY_GUIDE.md**](./docs/SECURITY_GUIDE.md) | PBKDF2 hashing, session cookie management, server-side Git proxies, and input sanitization. | Security Engineers & Auditors |
| [**docs/SEO_AND_PERFORMANCE.md**](./docs/SEO_AND_PERFORMANCE.md) | Metadata injection, JSON-LD schemas, automated XML sitemaps, OpenGraph cards, and Core Web Vitals. | SEO Specialists & Performance Engineers |
| [**docs/TESTING_STRATEGY.md**](./docs/TESTING_STRATEGY.md) | Unit tests, schema validation scripts, build-time integrity gates, and regression audits. | QA & Test Engineers |
| [**docs/TROUBLESHOOTING.md**](./docs/TROUBLESHOOTING.md) | Diagnosis and mitigation playbooks for build failures, YAML parsing errors, and auth issues. | Support & Maintenance Engineers |
| [**docs/REBUILD_FROM_SCRATCH.md**](./docs/REBUILD_FROM_SCRATCH.md) | Complete step-by-step walkthrough to build the entire system from an empty directory. | Builders & AI Coding Agents |
| [**docs/AI_IMPLEMENTATION_PROMPTS.md**](./docs/AI_IMPLEMENTATION_PROMPTS.md) | Verified copy-ready prompt templates for directing AI assistants milestone by milestone. | AI Engineers & Operators |
| [**docs/RELEASE_CHECKLIST.md**](./docs/RELEASE_CHECKLIST.md) | Mandatory pre-flight verification matrix, smoke test checklists, and sign-off protocols. | Release Managers & QA Leads |

---

## Technology Stack

```
Frontend Public Site : Astro 5.x (Static Site Generation / Zero-JS by default)
Interactive Islands  : React 19.x (Admin dashboard, visual editor, dynamic forms)
Styling System       : Tailwind CSS v4.x (Utility-first, CSS variables)
Iconography          : Lucide React (Crisp, tree-shakable SVG icons)
Content Engine       : Astro Content Collections (Strict schema validation via Zod)
Database Storage     : Relational SQL (Cloudflare D1 / Local SQLite for Admin Auth & Logs)
Persistence Model    : Git Data API Proxy (Markdown files with YAML frontmatter)
Image Optimization   : WebP conversion pipeline with native HTML responsive srcsets
Search Optimization  : Automated XML Sitemap, JSON-LD (Article, FAQPage, Organization)
Hosting & Edge CDN   : Cloudflare Pages / Edge Functions (or any modern Jamstack host)
```

---

## Directory Structure

```text
├── .env.example                     # Environment template (no secrets committed)
├── PRD.md                           # Master Product Requirements Document
├── README.md                        # Master Project Documentation & Quickstart
├── astro.config.mjs                 # Astro configuration (integrations, output modes)
├── wrangler.toml                    # Cloudflare Pages / D1 database configuration
├── package.json                     # Node.js dependencies and operational scripts
├── tsconfig.json                    # TypeScript compiler configuration (strict mode)
├── docs/                            # 14 Detailed technical & rebuild specifications
│   ├── ARCHITECTURE.md
│   ├── FEATURE_SPECIFICATION.md
│   ├── DATABASE_AND_CONTENT_MODEL.md
│   ├── UI_UX_SPECIFICATION.md
│   ├── DEVELOPMENT_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SECURITY_GUIDE.md
│   ├── SEO_AND_PERFORMANCE.md
│   ├── TESTING_STRATEGY.md
│   ├── TROUBLESHOOTING.md
│   ├── REBUILD_FROM_SCRATCH.md
│   ├── AI_IMPLEMENTATION_PROMPTS.md
│   └── RELEASE_CHECKLIST.md
├── functions/                       # Serverless Edge API functions (Cloudflare Pages)
│   └── api/
│       ├── auth/                    # Login, session validation, logout endpoints
│       └── github/                  # Server-side Git Data API proxy routes
├── migrations/                      # Relational SQL schema migrations
│   └── 0001_auth_schema.sql         # Admin users, sessions, lockout counters, logs
├── public/                          # Static public assets
│   ├── assets/                      # Media uploads and brand illustrations
│   ├── favicon.svg                  # Vector browser favicon
│   └── robots.txt                   # Search crawler directives
├── scripts/                         # Automation & validation scripts
│   └── fix-and-validate-content.cjs # Markdown frontmatter validator & sanitizer
└── src/
    ├── components/                  # UI components
    │   ├── admin/                   # Gutenberg editor, dashboard, media manager
    │   ├── blocks/                  # Visual block renderers for Gutenberg editor
    │   ├── common/                  # Header, footer, navigation, badges
    │   └── seo/                     # Meta tags, OpenGraph cards, JSON-LD schemas
    ├── content/                     # Managed Markdown content files
    │   ├── config.ts                # Astro Content Collection Zod schemas
    │   ├── pages/                   # Static pages (About, Contact, Privacy, etc.)
    │   └── posts/                   # Editorial articles and blog posts
    ├── layouts/                     # Astro base layouts (BaseLayout, PostLayout)
    ├── pages/                       # File-based routing
    │   ├── index.astro              # Homepage with hero and featured posts
    │   ├── [page].astro             # Dynamic page routing
    │   ├── posts/                   # Post listing and [slug].astro detail page
    │   ├── category/                # Category archives
    │   ├── author/                  # Author profile archives
    │   ├── wpadmin/                 # Single-page custom admin application
    │   ├── sitemap.xml.ts           # Dynamic XML sitemap generator
    │   └── 404.astro                # Branded 404 error page
    ├── server/                      # Local development mock servers (D1/SQLite)
    │   └── localD1Server.ts         # Local auth and GitHub proxy emulator
    └── utils/                       # Shared helper utilities (slugs, dates, formatting)
```

---

## Quick-Start Installation & Setup

### Prerequisites
- **Node.js**: v20.x or v22.x LTS installed (`node -v`)
- **Package Manager**: npm v10+ (included with Node.js)
- **Git**: Installed and configured locally

### Step 1: Clone and Install Dependencies
```bash
# Clone the repository
git clone <your-repository-url>
cd <project-folder>

# Install all package dependencies
npm install
```

### Step 2: Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```

Edit `.env` with your project configurations:
```ini
# Application URL for canonical tags and sitemaps
SITE_URL=http://localhost:3000

# Server-Side GitHub Proxy Integration (REQUIRED for Git sync)
GITHUB_PAT=ghp_yourPersonalAccessTokenHere
GITHUB_REPO_OWNER=your-github-username-or-org
GITHUB_REPO_NAME=your-repository-name
GITHUB_BRANCH=main

# Edge Authentication Secret (minimum 32 random characters)
AUTH_SECRET=replace_with_a_secure_random_string_32_chars_min
```

### Step 3: Run Content Integrity Validation
Verify that all existing Markdown content files conform to the strict Zod schema:
```bash
node scripts/fix-and-validate-content.cjs
```

### Step 4: Launch the Local Development Server
```bash
npm run dev
```

The terminal will report the active local endpoints:
- **Public Website**: `http://localhost:3000/`
- **Custom Admin CMS**: `http://localhost:3000/wpadmin/`

---

## Operational Scripts Reference

The `package.json` contains predefined scripts for development, testing, building, and validation:

| Command | Action | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `astro dev --port 3000` | Starts the Astro local development server on port 3000. |
| `npm run build` | `astro build` | Executes full production static site generation into `dist/`. |
| `npm run preview` | `astro preview` | Serves the generated static `dist/` directory locally. |
| `npm run lint` | `tsc --noEmit` | Runs strict TypeScript compiler type checking across the project. |
| `npm run validate` | `node scripts/fix-and-validate-content.cjs` | Audits and automatically repairs all YAML frontmatter files. |

---

## Publishing Workflow: The Three Tiers

To prevent unintended production deployments while drafting stories, the CMS implements a transparent, three-tiered workflow:

```
[ Tier 1: Local Save ]
Author edits content in Gutenberg Editor
Click "Save Draft" or "Save Changes"
-> Writes file to src/content/posts/*.md (via local FS or dev proxy)
-> Instantly reflected in local hot-reload preview

                    |
                    v

[ Tier 2: Git Synchronization ]
Author reviews changes in Admin "Git Deployment" view
Click "Push Changes to GitHub"
-> Server proxy calls GitHub Git Data API
-> Creates an atomic commit on the target branch (e.g., main)
-> File history preserved with author attribution

                    |
                    v

[ Tier 3: Edge Production Build ]
Target branch receives new commit
-> Hosting CI/CD (e.g., Cloudflare Pages) detects commit
-> Runs `npm run build` (Astro SSG)
-> Static assets distributed globally across Edge CDN in ~45 seconds
```

---

## Security Highlights

1. **Zero Browser Tokens**: The `GITHUB_PAT` token is stored exclusively in server environment variables or Cloudflare Pages secrets. The browser interacts solely with `/api/github/*` proxy endpoints.
2. **PBKDF2 Password Hashing**: Passwords stored in the D1 relational database use salted PBKDF2-SHA256 cryptography with 100,000 iterations.
3. **Session Hardening**: Admin authentication sessions are tracked with cryptographically random tokens stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with 7-day automatic expiration.
4. **Brute Force Lockouts**: 5 consecutive failed login attempts result in a mandatory 15-minute account lockout.
5. **Frontmatter Sanitization**: The Gutenberg editor automatically sanitizes user inputs (stripping unescaped quotes and embedded Markdown images) before writing YAML frontmatter, preventing YAML-injection build crashes.

---

## Contributing & License

This project is licensed under the **MIT License**. Contributions, bug reports, and pull requests are welcome. For major architectural changes, please review [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and open an issue for discussion first.
