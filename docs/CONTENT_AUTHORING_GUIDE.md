# AstroPress — Content Authoring, Markdown & Frontmatter Safety Guide

| Metadata | Details |
| :--- | :--- |
| **Content Locations** | `src/content/posts/*.md`, `src/content/pages/*.md` |
| **Validation Engine** | Astro 5 Content Collections + Zod Schema (`src/content.config.ts`) |
| **Serialization Library**| `js-yaml` (Strict Double-Quote Scalar Mode) |
| **Last Verified** | October 30, 2026 |

---

## 1. Content Architecture & File Formats

AstroPress stores all articles and pages as Git-backed Markdown (`.md`) files composed of two distinct parts:
1. **YAML Frontmatter Block**: Enclosed between opening and closing triple-hyphen delimiters (`---`). Contains metadata, taxonomy, SEO directives, and structured Gutenberg block definitions.
2. **Markdown Content Body**: Standard CommonMark/GitHub-Flavored Markdown providing fallback readability and semantic indexing.

---

## 2. Complete Frontmatter Specification

### Blog Posts Schema (`src/content/posts/*.md`)

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | **Yes** | — | Headline of the post. Used in `<title>`, H1, and social cards. |
| `slug` | `string` | Optional | Auto-generated | URL identifier. Must be lowercase, alphanumeric, and hyphenated. |
| `pubDate` | `datetime` | **Yes** | Current ISO | Publication timestamp (e.g. `2026-10-01T10:00:00.000Z`). |
| `updatedDate` | `datetime` | Optional | — | Last modification timestamp. |
| `status` | `string` | Optional | `"draft"` | Publication state: `"published"`, `"draft"`, or `"scheduled"`. |
| `draft` | `boolean` | No | `false` | When `true`, post is excluded from production RSS and sitemaps. |
| `author` | `string` | No | `"Amit Singh"` | Author display name matching an author profile. |
| `category` | `string` | No | `"Technology"`| Primary category slug matching `src/data/categories.json`. |
| `tags` | `string[]` | No | `[]` | List of topical tag strings (e.g. `["Astro", "CMS"]`). |
| `featuredImage` | `string` | Optional | — | Absolute path to primary image (e.g. `/uploads/hero.webp`). |
| `excerpt` | `string` | No | `""` | 1–2 sentence summary. Must be single-line plain text. |
| `readingTime` | `number` | No | `5` | Estimated read time in minutes. |
| `template` | `enum` | No | `"standard"` | Layout template: `"standard"`, `"cover-hero"`, `"minimal-editorial"`, `"sidebar-right"`. |
| `blocks` | `array` | Optional | `[]` | Structured JSON representation of Gutenberg blocks. |
| `seo` | `object` | Optional | `{}` | Nested SEO and social graph controls. |

### Nested SEO Object (`seo`)

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `metaTitle` | `string` | Post title | Custom `<title>` override (50–60 characters). |
| `metaDescription` | `string` | Excerpt | Meta description for search engine snippets (120–160 characters). |
| `focusKeyword` | `string` | `""` | Target SEO keyword for in-editor content score audits. |
| `canonicalUrl` | `string` | Post URL | Canonical link tag override for syndication. |
| `robotsIndex` | `boolean` | `true` | When `false`, emits `<meta name="robots" content="noindex">`. |
| `robotsFollow` | `boolean` | `true` | When `false`, tells crawlers not to follow links on this page. |
| `ogImage` | `string` | Featured Img | OpenGraph share image override for Facebook, LinkedIn, Twitter. |

---

## 3. Supported Gutenberg Block Types

AstroPress stores structured blocks in the `blocks` frontmatter array. The editor and Astro renderers (`src/components/common/GutenbergBlockRenderer.tsx` and `.astro`) support:

```json
[
  { "id": "b-1", "type": "heading", "content": "Headline", "settings": { "level": 2, "align": "left" } },
  { "id": "b-2", "type": "paragraph", "content": "Body text...", "settings": { "fontSize": "medium" } },
  { "id": "b-3", "type": "quote", "content": "Compelling quote", "settings": { "imageCaption": "Author" } },
  { "id": "b-4", "type": "code", "content": "console.log('hello');", "settings": { "codeLanguage": "typescript" } },
  { "id": "b-5", "type": "image", "content": "/uploads/example.webp", "settings": { "imageUrl": "/uploads/example.webp", "imageAlt": "Alt text", "borderRadius": "100%" } },
  { "id": "b-6", "type": "columns", "content": "", "settings": { "columnLayout": "50-50", "columns": [{ "id": "c1", "content": "Left" }, { "id": "c2", "content": "Right" }] } },
  { "id": "b-7", "type": "accordion", "content": "FAQ Title", "settings": { "accordionItems": [{ "title": "Q1?", "content": "A1." }] } },
  { "id": "b-8", "type": "table", "content": "", "settings": { "tableData": { "headers": ["A", "B"], "rows": [["1", "2"]], "alignments": ["left", "left"] } } },
  { "id": "b-9", "type": "button", "content": "Button Label", "settings": { "buttonUrl": "https://...", "buttonStyle": "primary" } },
  { "id": "b-10", "type": "download-button", "content": "Download Guide", "settings": { "downloadUrl": "/uploads/doc.pdf", "downloadFileName": "guide.pdf" } },
  { "id": "b-11", "type": "alert", "content": "Contextual notice message", "settings": { "alertType": "info" } },
  { "id": "b-12", "type": "author-box", "content": "Amit Singh", "settings": {} },
  { "id": "b-13", "type": "divider", "content": "", "settings": {} }
]
```

---

## 4. Frontmatter Safety & Build Failure Prevention

Historical build failures on Cloudflare Pages were primarily caused by YAML parser composition errors. AstroPress employs strict frontmatter sanitization rules:

### 1. Protection Against Unescaped Quotes & Multiline Strings
In YAML, a double quote within double quotes (`"He said "Hello""`) or a raw newline inside quotes breaks the composer (`Missing closing " quote`).
- **Solution**: The editor sanitizes `excerpt` and `metaDescription` before serialization:
  ```typescript
  const cleanExcerpt = (rawExcerpt || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')   // Strip Markdown image tags
    .replace(/[\r\n]+/g, ' ')          // Replace linebreaks with single spaces
    .trim();
  ```

### 2. Protection Against Markdown Image Tag Collisions
Strings starting with `!` (such as `![alt](url)`) are treated by YAML parsers as custom type tags (e.g. `!tag`).
- **Solution**: All scalar fields are serialized using `yaml.dump` with explicit double quoting:
  ```typescript
  yaml.dump(frontmatterObj, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
  } as any);
  ```

---

## 5. Valid Frontmatter Example

```yaml
---
title: "Deploying Sveltia CMS with Cloudflare Pages and Workers Authenticator"
slug: "deploying-sveltia-cms-cloudflare-pages-workers"
pubDate: 2026-10-01T10:00:00.000Z
status: "published"
draft: false
author: "Amit Singh"
category: "Technology"
tags:
  - "Cloudflare"
  - "Sveltia CMS"
  - "Astro"
featuredImage: "/uploads/cloudflare-edge.webp"
excerpt: "Learn how to configure Cloudflare Pages and D1 for high-speed headless content delivery."
readingTime: 6
template: "standard"
blocks:
  - id: "b-head-1"
    type: "heading"
    content: "Architecting for Edge Performance"
    settings:
      level: 2
  - id: "b-para-1"
    type: "paragraph"
    content: "By offloading static rendering to build time, reader requests hit Cloudflare Edge CDN caches with 0ms server execution time."
    settings:
      fontSize: "medium"
seo:
  metaTitle: "Deploying Sveltia CMS with Cloudflare Pages and Workers"
  metaDescription: "Learn how to configure Cloudflare Pages and D1 for high-speed headless content delivery."
  focusKeyword: "Cloudflare Sveltia CMS"
  robotsIndex: true
  robotsFollow: true
---

## Architecting for Edge Performance

By offloading static rendering to build time, reader requests hit Cloudflare Edge CDN caches with 0ms server execution time.
```

---

## 6. Automated Validation & Content Repair Procedure

If a Markdown file is accidentally corrupted:
```bash
# Run the automated repair script
node scripts/fix-and-validate-content.cjs
```
This script audits every `.md` file in `src/content/posts` and `src/content/pages`, cleans multiline scalar fields, re-serializes with strict double quoting, and preserves 100% of the author's Markdown body content.
