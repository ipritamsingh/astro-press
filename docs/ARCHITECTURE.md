# Technical Architecture & System Design Document

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Architecture Pattern** | Jamstack + Island Architecture + Git Data Proxy + Edge SQL |
| **Target Runtime** | Edge CDN (Cloudflare Pages / Node.js 22 LTS) |
| **Audience** | Software Architects, Principal Engineers, DevOps Specialists |
| **Status** | Approved Technical Architecture Blueprint |

---

## 1. High-Level System Architecture

The platform is designed around a dual-plane topology:
1. **Public Reading Plane (Static Edge)**: High-speed, cached static HTML pages served directly from global CDN edge caches with zero client-side JavaScript execution for reading.
2. **Editorial Control Plane (Dynamic Island)**: An interactive single-page application (SPA) loaded client-side (`client:only="react"`) under `/wpadmin/` for authoring, media management, and deployment.

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

---

## 2. Component Boundaries & Responsibilities

| Component | Technology | Execution Context | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Public Layouts & Pages** | Astro (`.astro`) | Build Time (SSG) / Edge | Render accessible, semantic HTML with zero client JS. Generates meta tags, OpenGraph headers, and JSON-LD structured data. |
| **Gutenberg Editor Island** | React 19 (`.tsx`) | Client Browser (`client:only="react"`) | Provide drag-and-drop block canvas, rich text formatting, block reordering, and safe YAML serialization. |
| **Media Pipeline** | HTML5 Canvas / WebP | Client Browser | Convert uploaded PNG/JPEG images to modern WebP format before upload to optimize file weight and Core Web Vitals. |
| **Auth & Security Proxy** | TypeScript Edge Functions | Serverless Edge (`/api/*`) | Securely handle password verification, session tokens, and proxy all Git commits using the server-side `GITHUB_PAT`. |
| **Content Collections** | Astro + Zod | Build Time / Server | Enforce strict type validation across post and page YAML frontmatter schemas. Block invalid builds before deployment. |
| **Relational Database** | Cloudflare D1 / SQLite | Serverless Edge | Store administrator accounts, password hashes, brute-force attempt counters, and audit logs. (Zero content stored in SQL). |

---

## 3. Data Flow & Publishing Pipelines

### 3.1 Content Save Pipeline (Local Development)

In local development, the admin dashboard directly accesses the local development server proxy to write Markdown files to disk without needing external network round-trips:

```text
[Author in Gutenberg Editor]
       │
       ▼ Click "Save Draft"
[Serialize Blocks to Markdown + YAML Frontmatter]
       │
       ▼ Sanitize Excerpt (strip newlines, images, unescaped quotes)
[POST /api/save { slug, content, frontmatter }]
       │
       ▼
[Local Filesystem: src/content/posts/[slug].md updated]
       │
       ▼
[Vite HMR detects change -> Hot reload instant preview]
```

### 3.2 Production Git Synchronization & Deployment Pipeline

In production, client browsers have no access to the filesystem. Content changes are pushed to GitHub via an atomic Git Data API transaction executed entirely server-side:

```text
[Author in Admin UI]
       │
       ▼ Click "Push Changes to GitHub"
[POST /api/github/commit (Authenticated via HttpOnly Cookie)]
       │
       ▼ Server reads GITHUB_PAT from protected secrets
[GitHub Git Data API: GET branch ref SHA]
       │
       ▼
[GitHub Git Data API: POST /blobs for Markdown & Images]
       │
       ▼
[GitHub Git Data API: POST /trees with updated blobs]
       │
       ▼
[GitHub Git Data API: POST /commits with tree SHA & message]
       │
       ▼
[GitHub Git Data API: PATCH /refs/heads/main to new commit]
       │
       ▼
[Cloudflare Pages CI/CD Webhook: Runs `npm run build`]
       │
       ▼
[Static HTML deployed globally across Edge CDN in ~45s]
```

---

## 4. Security Architecture & Boundary Model

The system enforces a strict zero-trust boundary separating public readers, editorial authors, and internal backend secrets:

```
[ ZONE 1: UNTRUSTED PUBLIC INTERNET ]
  - Readers requesting public URLs (/, /posts/*, /category/*)
  - Zero cookies required, zero tokens accepted
  - Cloudflare DDoS protection & rate limiting active
        │
        ▼
[ ZONE 2: AUTHENTICATED EDITORIAL BOUNDARY ]
  - Access to /wpadmin/* guarded by HttpOnly session cookie
  - Session validated against Cloudflare D1 `admin_sessions` table
  - PBKDF2-SHA256 password hashing with 100,000 iterations
  - Mandatory 15-minute lockout upon 5 consecutive failed attempts
        │
        ▼
[ ZONE 3: ISOLATED SERVER-SIDE SECRETS (NO CLIENT ACCESS) ]
  - GITHUB_PAT (Personal Access Token with repo scope)
  - AUTH_SECRET (Session encryption & signing key)
  - CLOUDFLARE_API_TOKEN (Database binding & purge cache)
  - Tokens exist ONLY in Edge Function memory during execution
```

---

## 5. Frontmatter Serialization & Sanitization Engine

A critical point of failure in Git-backed static CMS architectures is **YAML frontmatter corruption**. Non-technical authors often copy and paste text with curly quotes, unescaped double quotes, or newlines inside post excerpts, which causes the Astro static compiler to fail with parsing errors.

To guarantee 100% build reliability, the editor implements an automated sanitization and serialization engine:

```text
Raw User Input (Excerpt / Meta Title / Description)
                      │
                      ▼
1. Remove Markdown image tags: text.replace(/!\[.*?\]\(.*?\)/g, '')
                      │
                      ▼
2. Normalize all whitespace & newlines: text.replace(/[\r\n\t]+/g, ' ').trim()
                      │
                      ▼
3. Escape inner quotes and escape slashes: text.replace(/"/g, '\\"')
                      │
                      ▼
4. Pass through js-yaml with strict parameters:
   yaml.dump(frontmatter, {
     lineWidth: -1,        // Disable line wrapping to avoid unquoted line breaks
     noRefs: true,         // Disable YAML anchor references
     sortKeys: false,      // Preserve human-readable field order
     quotingType: '"'      // Enforce double quotes for all string literals
   })
                      │
                      ▼
Clean, guaranteed-compilable Markdown file with YAML header
```

---

## 6. Failure Modes & Graceful Degradation

| Failure Mode | Root Cause | System Mitigation & Graceful Degradation |
| :--- | :--- | :--- |
| **GitHub API Rate Limit Exceeded** | Excessive commit pushes or polling within 1 hour. | The proxy catches HTTP 403, caches the latest local draft in browser `localStorage`, and displays a clear countdown timer until rate limit reset. |
| **Database Connection Failure** | Cloudflare D1 transient edge disruption. | Admin login falls back to emergency environment token authentication if enabled; public website remains 100% unaffected because public pages are static HTML. |
| **Malformed Frontmatter in Pull Request** | Direct manual git commit outside of CMS editor. | Pre-build validation script (`scripts/fix-and-validate-content.cjs`) runs in CI; if malformed YAML is detected, the build halts with a precise line error rather than deploying broken pages. |
| **Image Upload Failure** | Unsupported format or file size > 10MB. | Client-side validator rejects file before upload, displays file size badge, and prompts author to choose a smaller image. |
