# Database & Content Model Specification

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Content Engine** | Astro Content Collections (Strict Zod Schemas) + Markdown Storage |
| **Relational Database** | Cloudflare D1 / SQLite (Admin Authentication, Sessions, and Audit Logs) |
| **Audience** | Backend Engineers, Database Architects, Content Modeling Leads |
| **Status** | Approved Data Architecture Specification |

---

## 1. Storage Topology Overview

The system strictly divides its data into two distinct layers:
1. **Content & Editorial Assets (Git Repository)**:
   - Articles (`src/content/posts/*.md`)
   - Standalone Pages (`src/content/pages/*.md`)
   - Media Assets (`public/assets/uploads/*`)
   - Taxonomy & Settings Configurations
2. **Identity, Access & Session Storage (Edge Relational SQL)**:
   - Administrator accounts and cryptographic password hashes
   - Active user authentication sessions and expiration timestamps
   - Password reset tokens and single-use emergency recovery codes
   - Security audit logs and rate-limiting lockout counters

```
+---------------------------------------------------------------------------------------+
|                                    DATA TOPOLOGY                                      |
+---------------------------------------------------+-----------------------------------+
|               GIT FILE SYSTEM STORAGE             |       EDGE SQL STORAGE (D1)       |
|            (Articles, Pages, Media)               |     (Authentication & Audits)     |
+---------------------------------------------------+-----------------------------------+
|  src/content/posts/                               |  TABLE: admin_users               |
|    ├── article-slug-1.md                          |    ├── id, email, password_hash   |
|    └── article-slug-2.md                          |    └── failed_attempts, lock_until|
|  src/content/pages/                               |  TABLE: admin_sessions            |
|    ├── about.md                                   |    ├── session_token, user_id     |
|    └── contact.md                                 |    └── expires_at, created_at     |
|  public/assets/uploads/                           |  TABLE: admin_audit_logs          |
|    └── banner-1714500000.webp                     |    ├── action, ip, timestamp      |
+---------------------------------------------------+-----------------------------------+
```

---

## 2. Astro Content Collection Schemas (`src/content/config.ts`)

Astro Content Collections enforce compile-time type safety via the `zod` library. If an author or automated script creates a post with missing or malformed fields, Astro aborts the build with an explicit type error.

### 2.1 Post Schema (`posts` collection)

```typescript
import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Primary Header Metadata
    title: z.string().min(5, "Title must be at least 5 characters").max(120, "Title cannot exceed 120 characters"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    
    // Status & Visibility
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    pinned: z.boolean().default(false),

    // Content Summaries & Excerpt
    excerpt: z.string().max(350, "Excerpt cannot exceed 350 characters").default(""),
    
    // Taxonomy & Categorization
    category: z.string().min(1, "Category is required").default("Uncategorized"),
    tags: z.array(z.string()).default([]),
    author: z.string().default("Editorial Staff"),
    authorImage: z.string().optional(),

    // Visual Media
    featuredImage: z.string().min(1, "Featured image URL is required").default("/assets/placeholder.webp"),
    featuredImageAlt: z.string().default("Featured article illustration"),
    featuredImageCaption: z.string().optional(),

    // Search Engine Optimization (SEO)
    metaTitle: z.string().max(70, "Meta title recommended under 70 chars").optional(),
    metaDescription: z.string().max(160, "Meta description recommended under 160 chars").optional(),
    canonicalURL: z.string().url("Must be a valid URL").optional(),
    noIndex: z.boolean().default(false),

    // Estimated Reading Time
    readingTime: z.number().int().positive().optional()
  }),
});
```

### 2.2 Page Schema (`pages` collection)

```typescript
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(2, "Page title must be at least 2 characters").max(120),
    slug: z.string().optional(),
    pubDate: z.coerce.date().default(() => new Date()),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    layoutTemplate: z.enum(['default', 'full-width', 'minimal', 'contact']).default('default'),
    featuredImage: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    noIndex: z.boolean().default(false)
  }),
});

export const collections = {
  posts: postsCollection,
  pages: pagesCollection,
};
```

---

## 3. Gutenberg Block Data Model

Within the visual editor, an article is maintained as an array of discrete JavaScript block objects. Upon saving, the block array is serialized into standard Markdown syntax and stored in the body of the `.md` file.

### 3.1 Block Schema Interface

```typescript
export type BlockType = 
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'code'
  | 'image'
  | 'gallery'
  | 'accordion'
  | 'alert'
  | 'button'
  | 'table'
  | 'author'
  | 'download';

export interface BaseBlock {
  id: string; // Unique UUID v4
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  data: {
    level: 2 | 3 | 4;
    text: string;
    slug?: string;
  };
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  data: {
    text: string; // HTML-supported rich text string
  };
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  data: {
    quote: string;
    citation?: string;
  };
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  data: {
    code: string;
    language: string; // e.g., 'typescript', 'bash'
  };
}

export interface AccordionBlock extends BaseBlock {
  type: 'accordion';
  data: {
    items: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  };
}

export interface AlertBlock extends BaseBlock {
  type: 'alert';
  data: {
    variant: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    message: string;
  };
}

export type ContentBlock = 
  | HeadingBlock 
  | ParagraphBlock 
  | QuoteBlock 
  | CodeBlock 
  | AccordionBlock 
  | AlertBlock;
```

### 3.2 Block-to-Markdown Serialization Rules

| Block Type | Stored Markdown Representation | Rendering Strategy |
| :--- | :--- | :--- |
| **Heading** | `## Level 2 Heading` or `### Level 3 Heading` | Native HTML `<h2>`, `<h3>` tags with automated anchor links |
| **Paragraph** | Multi-paragraph text separated by double newlines (`\n\n`) | Standard `<p>` tag with responsive typography |
| **Quote** | `> "Quoted text string"\n> — Attribution` | Semantic `<blockquote>` with `<cite>` attribution |
| **Code** | ` ```typescript\nconst x: number = 42;\n``` ` | `<pre><code class="language-typescript">` with Shiki syntax highlighting |
| **Accordion** | Standard HTML disclosure: `<details><summary>Title</summary>Body</details>` | Native browser `<details>` accordion; zero JS required |
| **Alert** | `> **INFO:** Alert message text here.` or custom HTML container | Styled callout box with icon |

---

## 4. Edge Relational SQL Schema (Cloudflare D1 / SQLite)

The authentication database schema is defined in `migrations/0001_auth_schema.sql` and deployed to Cloudflare D1:

```sql
-- Migration 0001: Admin Identity, Sessions, and Security Logs

-- Administrator Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,                       -- UUID v4
    email TEXT UNIQUE NOT NULL,                -- Login identity
    username TEXT UNIQUE NOT NULL,             -- Display handle
    password_hash TEXT NOT NULL,               -- PBKDF2-SHA256 hex string
    password_salt TEXT NOT NULL,               -- 16-byte hex cryptographic salt
    role TEXT NOT NULL DEFAULT 'editor',       -- 'admin', 'editor', 'author'
    is_active INTEGER NOT NULL DEFAULT 1,      -- Boolean 1=Active, 0=Disabled
    failed_attempts INTEGER NOT NULL DEFAULT 0,-- Consecutive failed login attempts
    locked_until INTEGER DEFAULT 0,            -- Unix timestamp until lockout ends
    recovery_code_hash TEXT,                   -- Single-use emergency recovery token
    created_at INTEGER NOT NULL,               -- Unix timestamp (milliseconds)
    updated_at INTEGER NOT NULL                -- Unix timestamp (milliseconds)
);

-- Active User Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
    session_token TEXT PRIMARY KEY,            -- 32-byte cryptographically secure hex
    user_id TEXT NOT NULL,                     -- Foreign Key to admin_users.id
    user_agent TEXT,                           -- Client browser user agent
    ip_address TEXT,                           -- Client IP address
    expires_at INTEGER NOT NULL,               -- Unix timestamp (7 days TTL)
    created_at INTEGER NOT NULL,               -- Unix timestamp
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Password Reset Verification Tokens
CREATE TABLE IF NOT EXISTS admin_password_resets (
    token TEXT PRIMARY KEY,                    -- Secure 32-byte hex reset token
    user_id TEXT NOT NULL,                     -- Foreign Key to admin_users.id
    expires_at INTEGER NOT NULL,               -- Unix timestamp (15 minutes TTL)
    used INTEGER NOT NULL DEFAULT 0,           -- 1 if token already redeemed
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Security and Publishing Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,                       -- UUID v4
    user_id TEXT,                              -- User responsible (or NULL for unauth)
    action TEXT NOT NULL,                      -- e.g. 'LOGIN_SUCCESS', 'PUSH_GIT_COMMIT'
    details TEXT,                              -- JSON payload of affected entities
    ip_address TEXT,                           -- Client IP
    created_at INTEGER NOT NULL                -- Unix timestamp
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs(created_at);
```
