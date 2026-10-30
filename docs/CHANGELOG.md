# AstroPress — Factual Project Changelog

All notable changes, architectural milestones, and verified regression fixes for the AstroPress project are documented in this file based strictly on verifiable Git commits and codebase records.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-10-30

### Added
- **Complete Technical Documentation Suite**: Added comprehensive project documentation including `docs/PRD.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_GUIDE.md`, `docs/DEPLOYMENT_GUIDE.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/CONTENT_AUTHORING_GUIDE.md`, `docs/ADMIN_GUIDE.md`, `docs/TROUBLESHOOTING.md`, `docs/TESTING_AND_RELEASE.md`, and `docs/REBUILD_FROM_SCRATCH.md`.
- **Automated Frontmatter Sanitizer**: Implemented `scripts/fix-and-validate-content.cjs` to audit, sanitize, and safely re-serialize all Markdown YAML frontmatter files across `src/content/posts/` and `src/content/pages/`.
- **Canonical Site Origin Resolution**: Enhanced `astro.config.mjs` with `readSiteUrl()` to read the canonical domain dynamically from `src/data/siteSettings.json`, preventing `localhost:3000` overrides on production OpenGraph and canonical URL tags.
- **TypeScript Options Hardening**: Cast `yaml.dump()` options in `src/components/admin/GutenbergEditor.tsx` to resolve `TS2353: 'quotingType' does not exist in type 'DumpOptions'` during `npm run lint`.

### Changed
- **Server-Side GitHub PAT Migration**: Migrated the GitHub Personal Access Token from browser `localStorage` to Cloudflare server-side secrets (`GITHUB_PAT`), routed through `functions/api/github/[[route]].ts` and `src/server/localD1Server.ts`.
- **Gutenberg Frontmatter Compiler**: Hardened `generateYamlFrontmatter()` in `src/components/admin/GutenbergEditor.tsx` to automatically strip Markdown image syntax (`![...]`) and carriage returns from `excerpt` and `metaDescription` before serialization.
- **Astro Content Schema**: Updated `src/content.config.ts` to add schema validation for `pages` SEO metadata matching the `posts` collection.

### Fixed
- **YAML Parser Composition Failure**: Resolved recurring `Missing closing " quote at line X, column Y` build errors during Cloudflare Pages deployments caused by unescaped multiline scalar values in Markdown content files (`new-vheck.md`, `this-is-demo.md`).
- **Zero Token Exposure**: Fixed vulnerability where GitHub Personal Access Tokens could be read from browser dev tools or network inspect panels.

---

## [0.9.0] - 2026-10-29

### Added
- **Commit Synchronization**: Commit `579787b` synchronized 14 modified Markdown files across posts and pages.
- **YAML Frontmatter Refactor**: Commit `6fcfd58` converted all Markdown frontmatter scalar fields to strict YAML blocks.
- **Git Push Multi-File Tree Commit**: Enhanced `src/data/githubPublishService.ts` to perform atomic tree commits using GitHub's Git Data API (`POST /git/blobs`, `POST /git/trees`, `POST /git/commits`, `PATCH /git/refs/heads/main`).

---

## [0.8.0] - 2026-10-01 (Initial Architecture)

### Added
- **Initial Schema & Migration**: Added `migrations/0001_auth_schema.sql` defining Cloudflare D1 tables: `admin_users`, `admin_sessions`, `password_reset_tokens`, `recovery_codes`, and `auth_audit_logs`.
- **Gutenberg Block Editor**: Added interactive React block builder with live settings inspector for headings, paragraphs, images, columns, and accordions.
- **Sveltia CMS Configuration**: Added `public/admin/config.yml` configuring GitHub backend and collections for Decap/Sveltia CMS compatibility.
- **Core Astro Pages**: Created static page routes in `src/pages/` for `/`, `/posts`, `/category/[slug]`, `/author/[slug]`, `/sitemap.xml`, and `/robots.txt`.
