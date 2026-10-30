# Product Requirements Document (PRD): Modern Publishing Platform & Headless CMS

| Document Metadata | Specification |
| :--- | :--- |
| **Project Title** | Modern Headless Publishing Platform with Gutenberg-Style Block Editor |
| **Document Type** | Implementation-Ready Product Requirements Document (PRD) |
| **Target Architecture** | Static Edge Generation (Astro) + Dynamic Islands (React/Svelte) + Git Persistence |
| **Status** | Approved Specification for New Development |
| **Target Milestone** | Version 1.0.0 Release Blueprint |

---

## 1. Product Overview

### 1.1 Purpose & Vision
The purpose of this project is to build a high-performance, modern publishing website paired with an integrated, user-friendly Content Management System (CMS) and visual Gutenberg-style block editor. 

Content creators require an intuitive, visual editing experience with rich media handling, modular blocks, customizable categories, and built-in SEO tools. Engineering teams require static rendering, edge deployment, zero client-side JavaScript for pure article reading, zero-cost scaling, and absolute data sovereignty using standard Git version control and Markdown files.

This platform bridges that gap by providing a WordPress-like editorial workflow on top of an edge-first static architecture.

### 1.2 Target Audience & Personas
- **Content Authors & Journalists**: Require a fluid, drag-and-drop or block-based writing experience with real-time typography preview, image optimization, and no need to understand raw code or YAML syntax.
- **Managing Editors & SEO Leads**: Require control over publication schedules, taxonomy (categories, tags), meta titles, descriptions, OpenGraph share previews, and canonical links.
- **Site Administrators & Webmasters**: Require user role management, secure session controls, ad placements, and automated GitHub publishing workflows.
- **Public Readers**: Expect instant page loads (<1s FCP), mobile-responsive layouts, accessible reading typography, clean navigation, and privacy-respecting design.

### 1.3 User Problems & Proposed Solutions

| Problem | Root Cause in Legacy CMS | Solution in This Platform |
| :--- | :--- | :--- |
| Slow page speeds & poor Core Web Vitals | Heavy database queries, PHP runtime, bloated plugin scripts. | Pre-rendered static HTML at edge CDN with zero client-side JavaScript for reading. |
| Fragile Markdown & YAML editing | Non-technical authors editing raw files break builds with unescaped quotes or invalid indentation. | Visual block editor with automated serialization sanitization and schema validation. |
| Security vulnerabilities & credential leaks | Exposed database ports or personal access tokens stored insecurely in browser storage. | Server-side proxy architecture where GitHub tokens and database secrets never touch the browser. |
| Vendor lock-in & licensing costs | Proprietary SaaS headless CMS subscription tiers. | 100% open-source, Git-backed content storage in standard Markdown format. |

### 1.4 Business Goals & Measurable Success Criteria
- **PageSpeed & Web Vitals**: 95+ score on Google PageSpeed Insights across Performance, Accessibility, Best Practices, and SEO.
- **First Contentful Paint (FCP)**: <0.8 seconds on standard 4G broadband connections.
- **Zero Token Exposure**: Zero API keys or Git access tokens present in client bundles or browser storage.
- **Authoring Efficiency**: Authors can create, format, preview, and save a rich multi-block article in under 10 minutes without technical assistance.
- **Build Reliability**: Zero CI/CD deployment failures due to unescaped frontmatter characters or malformed scalar blocks.

### 1.5 Project Scope & Out-of-Scope Features
- **In Scope (v1.0.0)**:
  - Public responsive website (Home, Articles, Pages, Categories, Tags, Authors, Search, 404).
  - Gutenberg-style visual block editor with 12+ standard block types.
  - Category, tag, and author management.
  - Image optimization and WebP conversion pipeline.
  - Local content collection persistence (draft and published states).
  - Server-side GitHub API integration for atomic Git commits.
  - Cloudflare Pages static edge deployment and D1 authentication.
  - Complete SEO controls (meta tags, OpenGraph, JSON-LD schemas, sitemap, robots).
- **Out of Scope (v1.0.0)**:
  - Multi-tenant enterprise workspaces (single-publication focus for v1).
  - Paid subscription paywalls or e-commerce carts (planned for v2).
  - Real-time collaborative multi-cursor editing (planned for v2).

---

## 2. User Roles & Access Control

For v1.0.0, the platform implements a secure, focused 4-tier role hierarchy:

```
┌────────────────────────────────────────────────────────┐
│                   Administrator                        │
│   • Full system settings, deployments, users, secrets  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                      Editor                            │
│   • Publish, update, unpublish, delete any article     │
│   • Manage categories, tags, menus, and site media     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                      Author                            │
│   • Create and edit own drafts and submitted articles  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Public Visitor                        │
│   • Read-only access to published public web pages     │
└────────────────────────────────────────────────────────┘
```

| Role | Permissions & Boundaries |
| :--- | :--- |
| **Public Visitor** | Read-only access to `/`, `/posts/*`, `/[page]`, `/category/*`, `/tag/*`, `/author/*`. No CMS access. |
| **Author** | Access to `/admin/`. Can create, edit, and save drafts of articles authored by themselves. Cannot push to GitHub or modify global site settings. |
| **Editor** | Can edit, approve, publish, and delete all posts, pages, categories, tags, and media assets. Cannot modify server secrets or deployment settings. |
| **Administrator** | Full access to `/admin/`. Manages user accounts, GitHub repository sync, deployment triggers, theme customization, ads, and system backups. |

---

## 3. Public Website Requirements

### 3.1 Homepage (`/`)
- **Hero Section**: Configurable hero banner supporting headline, highlight text, eyebrow badge, call-to-action buttons, trust badges, and responsive illustration/image.
- **Featured Articles Grid**: Showcase 3–5 curated articles with high-resolution responsive cards.
- **Category Carousel / Pills**: Quick visual filtering by topical categories.
- **Recent Articles Feed**: Paginated list of latest published articles with author avatar, publication date, reading time estimate, and category tag.
- **Newsletter Subscription Card**: Inline newsletter capture form with client-side email validation and spam protection.

### 3.2 Header & Navigation
- **Branding**: Site logo and title linking directly to `/`.
- **Navigation Menu**: Customizable menu supporting top-level links and category dropdowns.
- **Search Trigger**: Prominent search button opening an accessible modal with instantaneous title/keyword filtering.
- **Theme Controls**: Optional dark mode toggle and responsive mobile hamburger menu.

### 3.3 Article Detail View (`/posts/[slug]`)
- **Header Elements**: Category badge, headline (H1), publish/update date, author profile pill, estimated reading time, and featured image with aspect-ratio preservation.
- **Semantic Article Body**: Clean `<article>` markup rendering Gutenberg blocks to pure HTML without client JavaScript execution.
- **Social Sharing Toolbar**: Instant share buttons for Twitter/X, LinkedIn, Facebook, WhatsApp, and copy link.
- **Author Bio Card**: Display author avatar, bio description, and social profile links.
- **Related Articles**: Algorithmically selected list of 3 articles sharing the same primary category or tags.
- **Interactive Comments Island**: Lazy-hydrated comment stream (`client:visible`) preventing performance penalties during initial article load.

### 3.4 Archive & Taxonomy Views (`/category/[slug]`, `/tag/[slug]`, `/author/[slug]`)
- Archive header displaying taxonomy title, description, and article count.
- Responsive grid of article cards matching the main feed design.
- Empty states with helpful guidance if no articles exist under the selected filter.

### 3.5 Static Standalone Pages (`/[page]`)
- Dedicated layout for About, Contact, Privacy Policy, and Terms of Service.
- Optional full-width or narrow editorial column template selection.

### 3.6 Discovery & System Endpoints
- `/sitemap.xml`: Valid XML sitemap indexing all published articles and pages with dynamic `<lastmod>` timestamps.
- `/robots.txt`: Configurable crawler rules pointing to the canonical sitemap.
- `/404`: User-friendly error page with search bar and recommended articles.

---

## 4. CMS Dashboard Requirements

### 4.1 Authentication & Session Management
- Dedicated admin portal at `/admin/` (or configurable `/wpadmin/`).
- Secure login interface verifying username/email and password against PBKDF2/Argon2 password hashes.
- Cryptographic session issuance via HTTP-only, secure, SameSite cookies or bearer tokens with a 2-hour sliding window.
- Rate-limiting defense: Automatic 15-minute account lockout after 5 consecutive failed attempts.
- Password reset flow via single-use 15-minute expiring tokens or offline recovery codes.

### 4.2 Content Management Dashboard
- **Overview Metrics**: Total published articles, pending drafts, total media items, and GitHub sync status.
- **Posts & Pages Table**:
  - Filter by status (`Published`, `Draft`, `Scheduled`, `Trash`).
  - Search by title or keyword.
  - Sort by publication date, title, or last modified.
  - Inline quick actions: Edit, Quick View, Duplicate, and Move to Trash.
  - Bulk actions: Bulk publish, draft, or delete.
- **Taxonomy Managers**: Dedicated interfaces to add, edit, or remove Categories, Tags, and Author profiles with custom slugs and color codes.
- **Media Library**:
  - Drag-and-drop file uploader supporting PNG, JPEG, SVG, WebP, and PDF documents.
  - Automatic client-side or edge WebP optimization.
  - Media picker modal accessible directly within block editors.

---

## 5. Gutenberg-Style Block Editor Requirements

The visual editor must provide an uninterrupted, continuous writing canvas paired with a contextual block inspector sidebar.

### 5.1 Supported Block Specifications

| Block Name | Schema Key | Editable Settings | Serialized Output |
| :--- | :--- | :--- | :--- |
| **Heading** | `heading` | Level (H1–H6), Text Alignment (Left, Center, Right). | `## Heading Text` or HTML `<h2>` |
| **Paragraph** | `paragraph` | Font Size (Small, Medium, Large), Alignment. | Raw paragraph text separated by `\n\n` |
| **Image** | `image` | URL, Alt text, Caption, Alignment, Width (25%, 50%, 75%, 100%), Aspect Ratio. | `![Alt](URL)` with optional `<figure>` |
| **Quote** | `quote` | Quote body, Author/Citation text. | `> Quote\n>\n> — Citation` |
| **Code Block** | `code` | Language syntax identifier, Code string. | ` ```lang\ncode\n``` ` |
| **Columns** | `columns` | Column layout (50/50, 33/33/33, 70/30), Per-column rich text. | Multi-column HTML grid container |
| **Accordion / FAQ** | `accordion` | Array of Question and Answer pairs. | HTML `<details><summary>` + FAQPage JSON-LD |
| **Table** | `table` | Headers, Rows, Column alignments, Caption, CSV/Markdown import. | Standard GFM Markdown table |
| **Button / CTA** | `button` | Label, Destination URL, Style (Primary, Secondary, Outline), Alignment. | Accessible anchor tag with styling |
| **Download Button**| `download-button`| Label, File URL, Filename, New Tab toggle. | Accessible download anchor tag |
| **Callout / Alert** | `alert` | Type (Info, Warning, Success, Error), Message text. | Styled notice box with icon |
| **Author Showcase**| `author-box` | Author selection dropdown. | Styled author showcase card |
| **Divider** | `divider` | Visual style (Line, Dots, Spacing). | `---` |

### 5.2 Editor Canvas & Interaction Behavior
- **Block Reordering**: Move blocks up or down with keyboard shortcuts or click controls.
- **Block Duplication & Deletion**: Duplicate any block with unique ID regeneration; delete with undo support.
- **Responsive Viewport Simulator**: Preview content instantly in Desktop (100%), Tablet (768px), or Mobile (375px) frame modes.
- **Unsaved Changes Guard**: Prompt browser confirmation if navigating away with dirty state.

---

## 6. Content Model & Markdown Specification

All articles and pages are stored as individual Markdown (`.md`) files containing structured YAML frontmatter:

```yaml
---
title: "Building Modern High-Performance Web Architectures"
slug: "building-modern-high-performance-web-architectures"
pubDate: 2026-10-30T10:00:00.000Z
updatedDate: 2026-10-30T12:00:00.000Z
status: "published"
draft: false
author: "Lead Architect"
category: "Technology"
tags:
  - "Architecture"
  - "Web Performance"
featuredImage: "/uploads/architecture-hero.webp"
excerpt: "A comprehensive breakdown of static island rendering and edge publishing."
readingTime: 6
template: "standard"
blocks:
  - id: "b-1"
    type: "heading"
    content: "The Evolution of Edge CMS"
    settings:
      level: 2
seo:
  metaTitle: "Building Modern High-Performance Web Architectures"
  metaDescription: "A comprehensive breakdown of static island rendering and edge publishing."
  focusKeyword: "Edge CMS"
  canonicalUrl: "https://example.com/posts/building-modern-high-performance-web-architectures"
  robotsIndex: true
  robotsFollow: true
---

## The Evolution of Edge CMS

Article body content starts here...
```

### 6.1 Frontmatter Sanitization & Serialization Rules
- **Safe Scalar Handling**: To eliminate YAML composer failures, all string fields (specifically `excerpt` and `metaDescription`) must strip unescaped carriage returns (`\r\n`) and Markdown image syntax (`![...]`).
- **Strict Serialization**: Serialization must use an established YAML engine (such as `js-yaml`) with `lineWidth: -1` and explicit double-quote scalar wrapping.

---

## 7. GitHub Integration & Edge Publishing Model

The platform enforces strict separation between **saving locally** and **publishing to GitHub**:

```
[ Step 1: Author edits in Gutenberg Canvas ]
                   │
                   ▼ Click "Save Draft" or "Update"
[ Step 2: Local Persistence ]
• Frontmatter sanitized and verified against Zod schema
• File written to src/content/posts/<slug>.md
• Instant preview in local dev environment
                   │
                   ▼ Click "Push Changes to GitHub" (Admin Dashboard)
[ Step 3: Server-Side Git Data API Pipeline ]
• Admin session authenticated against server
• Server injects GITHUB_PAT secret (never sent to browser)
• POST /git/blobs (upload modified files)
• POST /git/trees (create atomic tree referencing parent)
• POST /git/commits (sign commit message)
• PATCH /git/refs/heads/main (advance branch HEAD)
                   │
                   ▼ GitHub Webhook triggers Edge CI/CD
[ Step 4: Edge Build & Deploy ]
• Platform executes: npm run build
• Static distribution deployed to global edge CDN in <60 seconds
```

---

## 8. Requirements Traceability Matrix

| Req ID | Category | Description | Priority | Target Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Public | Static homepage with responsive hero and article feed. | Must | Milestone 6 |
| **FR-02** | Public | Dynamic post routing (`/posts/[slug]`) with 0 KB reader JS. | Must | Milestone 7 |
| **FR-03** | Public | Category and tag archive pages with dynamic filtering. | Must | Milestone 7 |
| **FR-04** | Public | Instant search modal with client-side keyword filtering. | Should | Milestone 7 |
| **FR-05** | CMS | Secure admin login with PBKDF2 hashing and session management. | Must | Milestone 9 |
| **FR-06** | CMS | Post and page management table with search and status filters. | Must | Milestone 10 |
| **FR-07** | Editor | Gutenberg block canvas supporting 12+ modular block types. | Must | Milestone 11 |
| **FR-08** | Editor | Safe YAML frontmatter compiler stripping unescaped newlines. | Must | Milestone 12 |
| **FR-09** | Git | Server-side GitHub API proxy with zero token leakage. | Must | Milestone 13 |
| **FR-10** | SEO | Automated XML sitemap, robots.txt, and JSON-LD schemas. | Must | Milestone 8 |
| **FR-11** | Deploy | Automated Cloudflare Pages build configuration (`npm run build`).| Must | Milestone 16 |
| **NFR-01**| Security | Zero sensitive tokens (`GITHUB_PAT`) in browser bundles. | Must | Milestone 14 |
| **NFR-02**| Performance| Core Web Vitals score >= 95 on mobile and desktop. | Must | Milestone 18 |
