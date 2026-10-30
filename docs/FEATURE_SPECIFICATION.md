# Feature Specification Document: Modern Edge Publishing Platform & CMS

| Document Metadata | Specification |
| :--- | :--- |
| **Document Type** | Comprehensive Functional Feature Specification |
| **Target System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Audience** | Frontend Engineers, Backend Engineers, QA Testers, Product Designers |
| **Status** | Approved Specification for New Development |

---

## 1. System Overview & Feature Inventory

The system comprises eleven primary functional modules:

```
[Module 1: Public Web Experience]  --> Fast, static, accessible reading surface (0 KB JS)
[Module 2: Custom Admin CMS]       --> Responsive single-page management island (/wpadmin/)
[Module 3: Gutenberg Block Editor] --> Visual canvas with 12+ modular content blocks
[Module 4: Media Library Engine]   --> Asset upload, WebP optimization, metadata tagging
[Module 5: Git Persistence Proxy]  --> Zero-token edge proxy for atomic Git data commits
[Module 6: Taxonomy & Authors]     --> Dynamic categories, tags, and multi-author profiles
[Module 7: Dynamic SEO & Metadata] --> JSON-LD schemas, OpenGraph cards, dynamic sitemaps
[Module 8: Ad Inserter Engine]     --> Algorithmic ad unit injection and placement rules
[Module 9: Edge Authentication]    --> PBKDF2 hashing, session cookies, brute-force lockout
[Module 10: Build & Static Engine] --> Astro SSG compilation, Zod collection validation
[Module 11: Backup & Recovery]     --> JSON/ZIP archive exports and recovery verification
```

---

## 2. Feature Specifications

### 2.1 Feature 1: Public Reading Experience (Static Surface)

#### 2.1.1 Description & User Story
- **As a** public reader on desktop or mobile,
- **I want** to browse articles, search content, filter by category or author, and read long-form posts instantly,
- **So that** I have a distraction-free, lightning-fast reading experience with zero layout shift and readable typography.

#### 2.1.2 Functional Capabilities
1. **Homepage (`/`)**:
   - Hero spotlight section featuring the latest or pinned article with high-resolution responsive featured image.
   - Grid listing of recent posts with pagination (9 posts per page).
   - Sidebar displaying categories list, trending tags, search input, and newsletter subscription form.
2. **Article Reader (`/posts/[slug]`)**:
   - Clean, typographic layout (`prose` styling via Tailwind typography).
   - Header with category badge, title, subtitle/excerpt, author avatar with name, reading time calculation, and formatted publish date.
   - Featured image banner with accessible alt text and photographer caption.
   - Article body rendered directly from sanitized Markdown.
   - Sticky table of contents generated dynamically from `<h2>` and `<h3>` headings.
   - Social share actions (Twitter/X, LinkedIn, Facebook, native Web Share API with clipboard fallback).
   - Author bio card with links to other articles by the same author.
   - Related articles widget showing 3 contextual posts sharing tags or categories.
3. **Static Pages (`/[page]`)**:
   - Flexible rendering of standalone pages (e.g., About, Contact, Privacy Policy, Terms).
4. **Taxonomy Archives**:
   - Category archive (`/category/[slug]`): Curated list of posts matching the target category.
   - Author profile archive (`/author/[slug]`): Author bio, social links, and all published articles.
5. **Search & 404**:
   - Client-side static search index or instant filter on archive pages.
   - Custom 404 page with return-home navigation and search recommendation.

#### 2.1.3 Acceptance Criteria
- [ ] Public article pages emit zero render-blocking JavaScript for article body reading.
- [ ] Cumulative Layout Shift (CLS) is strictly `< 0.05` across all viewports.
- [ ] Largest Contentful Paint (LCP) is strictly `< 1.2s` on standard mobile connections.
- [ ] Heading anchors are automatically generated and keyboard-focusable.

---

### 2.2 Feature 2: Custom Admin CMS Dashboard (`/wpadmin/`)

#### 2.2.1 Description & User Story
- **As an** editorial writer, editor, or administrator,
- **I want** a secure, responsive management dashboard,
- **So that** I can view post lists, create drafts, inspect deployment status, manage media, and configure settings from any device.

#### 2.2.2 Functional Capabilities
1. **Unified Dashboard View**:
   - Metric cards: Total Published Posts, Draft Count, Total Pages, Active Categories.
   - Quick action buttons: "New Story", "Upload Asset", "Deploy to Git".
   - Recent activity log showing last 10 modified or created documents.
2. **Post & Page Management Table**:
   - Tabbed view: "All", "Published", "Drafts", "Trash".
   - Search filter by title, author, or category.
   - Row actions: "Edit", "Quick Edit" (inline title/slug/status update), "View Live", "Delete".
3. **Quick Edit Modal**:
   - Allows changing publication status (`draft` vs `published`), title, category, and date without entering the full block editor.
4. **Responsive Layout**:
   - Desktop: Persistent collapsible left sidebar navigation.
   - Mobile: Slide-out drawer menu with touch-friendly tap targets (minimum 44x44px).

#### 2.2.3 Acceptance Criteria
- [ ] Unauthenticated requests to `/wpadmin/` redirect immediately to `/wpadmin/login`.
- [ ] Post filtering by status operates instantaneously with zero server round-trips for local state.
- [ ] Deleting a post requires a two-step confirmation modal to prevent accidental data loss.

---

### 2.3 Feature 3: Gutenberg-Style Visual Block Editor

#### 2.3.1 Description & User Story
- **As a** content creator,
- **I want** to write stories using modular, draggable blocks rather than raw Markdown or HTML,
- **So that** I can compose rich multimedia articles without formatting errors.

#### 2.3.2 Functional Capabilities
1. **Canvas Architecture**:
   - Central writing canvas with dynamic inline block inserting (`/` slash command or `+` button).
   - Drag-and-drop or up/down arrow reordering for every block.
   - Duplicate, copy, and delete block actions.
2. **Supported Block Types**:
   - **Paragraph**: Rich text editing with bold, italic, strikethrough, inline code, and hyperlinks.
   - **Heading**: Levels `H2`, `H3`, `H4` with automated slug ID generation for table of contents.
   - **Blockquote**: Stylized quote with optional author attribution line.
   - **Code Block**: Monospace editor with syntax highlighting language selector (JavaScript, TypeScript, Python, HTML, Bash, etc.).
   - **Image**: Single image with upload trigger, URL input, alt text, caption, and alignment (center, wide, full-width).
   - **Image Gallery**: Multi-image grid layout (2, 3, or 4 columns) with lightbox option.
   - **Accordion / FAQ**: Collapsible disclosure items with automated `FAQPage` JSON-LD schema generation.
   - **Alert / Callout Box**: Contextual banners (Info, Success, Warning, Danger) with customizable icon.
   - **Button / Call-to-Action**: Customizable label, destination URL, style (primary, outline), and target (`_blank`).
   - **Author Showcase**: Inline contributor card with avatar, bio, and social handles.
   - **Table**: Interactive grid editor supporting row/column insertion, deletion, and header toggling.
   - **Download Box**: File asset card with file size, format tag, and direct download button.
3. **Inspector Sidebar**:
   - **Document Tab**: Slug editor, status selector (`draft` / `published`), publication date picker, category dropdown, tag pills input, featured image uploader, and custom excerpt.
   - **SEO Tab**: Meta title counter (warns if > 60 chars), meta description counter (warns if > 160 chars), canonical URL override, and real-time Google search result preview card.
   - **Block Tab**: Context-specific settings for the currently active block (e.g., column count, alert variant, heading level).
4. **Safe YAML Serialization**:
   - The editor converts block arrays into standard Markdown syntax with frontmatter.
   - Excerpts and meta descriptions are automatically stripped of newlines (`\r\n`) and unescaped markdown image tags before YAML serialization.
   - Strings are dumped using `lineWidth: -1` and strict double quotes (`"`) to eliminate multiline quote termination errors in Astro's build parser.

#### 2.3.3 Acceptance Criteria
- [ ] Pressing `Enter` in a paragraph block creates a new paragraph block immediately below.
- [ ] Pressing `Backspace` on an empty block removes the block and focuses the previous block.
- [ ] Saving an article with double quotes, special characters, and code snippets produces 100% valid YAML frontmatter that compiles without Astro parse errors.

---

### 2.4 Feature 4: Media Library & Asset Optimization

#### 2.4.1 Description & User Story
- **As an** author,
- **I want** to upload photos and illustrations directly in the editor,
- **So that** images are automatically converted to modern WebP format and organized into the media library.

#### 2.4.2 Functional Capabilities
1. **Upload Pipeline**:
   - Drag-and-drop file dropzone accepting JPEG, PNG, GIF, SVG, and WebP files up to 10MB.
   - Client-side Canvas API converts JPEG/PNG files to optimized WebP format prior to storage.
   - Automatic generation of unique filenames (e.g., `featured-image-1714589201.webp`).
2. **Media Browser**:
   - Grid view with thumbnail preview, file name, dimensions, and file size.
   - Metadata editor: Alt text, caption, and title.
   - Copy URL button for immediate reuse across multiple articles.
3. **Storage Backends**:
   - Local storage in `public/assets/uploads/` during local development.
   - Direct Git repository commit or edge bucket integration for production.

#### 2.4.3 Acceptance Criteria
- [ ] Uploaded PNGs and JPEGs are compressed and converted to WebP with a default quality factor of 0.82.
- [ ] Image dimensions are extracted and stored to ensure all `<img>` tags specify `width` and `height`, preventing CLS.

---

### 2.5 Feature 5: Git Persistence & Deployment Integration

#### 2.5.1 Description & User Story
- **As a** publisher,
- **I want** changes pushed atomically into a Git repository via a secure server proxy,
- **So that** all article changes are version-controlled, auditable, and trigger automated builds.

#### 2.5.2 Functional Capabilities
1. **Three-Tier Publishing Workflow**:
   - **Local Draft Save**: Saves changes directly to local memory/filesystem without committing to Git.
   - **Git Push**: Stages modified/new `.md` files and uploads, creating an atomic commit via Git Data API.
   - **Build Trigger**: Pushing to the target branch triggers the host's CI/CD pipeline (e.g., Cloudflare Pages build).
2. **Server-Side Proxy Architecture**:
   - Browser client makes calls only to internal endpoints: `POST /api/github/commit`, `GET /api/github/status`.
   - The server function accesses `GITHUB_PAT` from environment variables, performs API operations, and returns status.
   - The browser never receives or stores the GitHub PAT.
3. **Commit Metadata**:
   - Automated commit messages: `feat(content): update post [slug] by [author]`.
   - Git author attribution using the logged-in administrator's name and email.

#### 2.5.3 Acceptance Criteria
- [ ] No GitHub token or personal access secret is ever logged in client console or inspectable in browser storage.
- [ ] Atomic commits bundle both the updated Markdown document and any newly uploaded image assets in a single Git tree update.

---

### 2.6 Feature 6: Taxonomy & Multi-Author Management

#### 2.6.1 Description & User Story
- **As an** editorial manager,
- **I want** to categorize posts and assign multiple authors with rich profiles,
- **So that** readers can navigate topics easily and explore specific contributor portfolios.

#### 2.6.2 Functional Capabilities
1. **Category Management**:
   - Name, slug, description, and optional color accent.
   - Post count counter displayed in admin list.
2. **Tag Management**:
   - Ad-hoc tag creation from within the Gutenberg editor inspector.
   - Unified tag management screen for deduplication and renaming.
3. **Author Profiles**:
   - Name, slug, avatar image URL, bio (up to 300 characters), role/title, and social links (Twitter/X, GitHub, Website).
   - Automatic generation of author profile page at `/author/[slug]`.

#### 2.6.3 Acceptance Criteria
- [ ] Renaming a category updates the slug without breaking existing published post associations.
- [ ] Deleting a category with active posts prompts for re-categorization to a default fallback.

---

### 2.7 Feature 7: Dynamic SEO & Structured Data Engine

#### 2.7.1 Description & User Story
- **As an** SEO specialist,
- **I want** comprehensive search metadata, OpenGraph tags, and JSON-LD schemas generated automatically,
- **So that** every published article ranks effectively on search engines and displays rich preview cards on social networks.

#### 2.7.2 Functional Capabilities
1. **Header Meta Tags**:
   - Primary: `<title>`, `<meta name="description">`, `<link rel="canonical">`.
   - OpenGraph: `og:title`, `og:description`, `og:image`, `og:url`, `og:type="article"`, `article:published_time`.
   - Twitter Cards: `twitter:card="summary_large_image"`, `twitter:site`, `twitter:creator`.
2. **JSON-LD Structured Data**:
   - `Article` / `BlogPosting` schema on all article pages with headline, image, datePublished, dateModified, and author.
   - `FAQPage` schema automatically injected when an article includes Accordion/FAQ blocks.
   - `Organization` schema on homepage and about page.
3. **Automated XML Sitemap (`/sitemap.xml`)**:
   - Dynamically generated during build or edge request.
   - Includes all published posts, static pages, categories, and author URLs.
   - Respects `draft: true` and `noindex: true` flags (excludes them from sitemap).
4. **Robots Directives (`/robots.txt`)**:
   - Allows public crawling of all content while disallowing `/wpadmin/`, `/admin/`, and `/api/`.

#### 2.7.3 Acceptance Criteria
- [ ] Google Rich Results Test passes for `Article` and `FAQPage` schemas with zero warnings.
- [ ] OpenGraph image tags resolve to absolute URLs using the configured `SITE_URL`.
- [ ] Draft posts and admin endpoints never appear in `/sitemap.xml`.

---

### 2.8 Feature 8: Dynamic Ad Inserter Engine

#### 2.8.1 Description & User Story
- **As a** publisher,
- **I want** to manage advertising units and inject them conditionally into articles,
- **So that** the publication can monetize traffic without manual code edits or layout disruption.

#### 2.8.2 Functional Capabilities
1. **Ad Placement Zones**:
   - Header banner (top of page).
   - Sidebar banner (desktop sidebar).
   - Footer banner (above footer).
   - In-content dynamic paragraphs: Insert after paragraph *N* (e.g., after paragraph 3, and every 4 paragraphs thereafter).
2. **Ad Configuration**:
   - Name, placement zone, HTML/JS embed code or image banner URL with affiliate link.
   - Target device filter: Desktop only, Mobile only, or All devices.
   - Status toggle: Active vs Paused.

#### 2.8.3 Acceptance Criteria
- [ ] In-content ads only insert between top-level paragraphs, never inside blockquotes, code blocks, or tables.
- [ ] Ad slots reserve minimum CSS aspect ratio boxes to prevent Cumulative Layout Shift (CLS) when third-party ad scripts load.

---

### 2.9 Feature 9: Edge Authentication & Access Control

#### 2.9.1 Description & User Story
- **As a** site administrator,
- **I want** secure edge-based authentication with password hashing and session tokens,
- **So that** only authorized personnel can access the CMS admin panel.

#### 2.9.2 Functional Capabilities
1. **Password Security**:
   - Passwords hashed using PBKDF2-SHA256 with 100,000 iterations and a unique 16-byte cryptographic salt.
2. **Session Security**:
   - Sessions generated as cryptographically secure 32-byte hex strings.
   - Stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with 7-day expiration.
3. **Brute Force Defense**:
   - IP and username failed attempt tracking in relational database table (`admin_users.failed_attempts`).
   - 5 failed attempts trigger a mandatory 15-minute lockout.
4. **Password Reset Flow**:
   - Secure reset tokens with 15-minute time-to-live (TTL).
   - One-time recovery codes generated during initial admin onboarding.

#### 2.9.3 Acceptance Criteria
- [ ] Plaintext passwords are never stored in databases, logs, or response payloads.
- [ ] Expired or invalidated session cookies return HTTP 401 and redirect to `/wpadmin/login`.

---

### 2.10 Feature 10: Static Site Compilation & Schema Validation

#### 2.10.1 Description & User Story
- **As a** DevOps engineer,
- **I want** automated content validation during build time,
- **So that** malformed Markdown files or invalid frontmatter cannot break the production website.

#### 2.10.2 Functional Capabilities
1. **Content Collection Schema**:
   - Defined in `src/content/config.ts` using Astro's native `zod` helper.
   - Enforces types for `title` (string, max 120), `pubDate` (Date), `excerpt` (string, max 300), `featuredImage` (string URL or path), `category` (string), and `tags` (array of strings).
2. **Pre-Build Validation Script (`scripts/fix-and-validate-content.cjs`)**:
   - Scans all files in `src/content/posts/` and `src/content/pages/`.
   - Validates YAML delimiters (`---`) and structure.
   - Sanitizes multiline strings and unescaped quotes.
   - Emits human-readable error messages pointing to specific file paths and line numbers if errors exist.

#### 2.10.3 Acceptance Criteria
- [ ] Running `npm run validate` passes with 0 errors across all content files.
- [ ] Running `npm run build` compiles 100% of pages into `dist/` without warnings.

---

### 2.11 Feature 11: Backup & Recovery Engine

#### 2.11.1 Description & User Story
- **As an** administrator,
- **I want** to export a complete snapshot of all content and settings,
- **So that** the site can be restored rapidly in the event of accidental deletion or platform migration.

#### 2.11.2 Functional Capabilities
1. **Export Engine**:
   - One-click export bundling all Markdown posts, pages, and media metadata into a downloadable JSON or ZIP archive.
2. **Import & Restore**:
   - Validation parser checks archive integrity prior to overwriting existing files.
   - Dry-run mode displays changes (Added, Modified, Unchanged) before applying.

#### 2.11.3 Acceptance Criteria
- [ ] Export archive contains 100% of content files and preserves exact YAML frontmatter structure.
- [ ] Restoring an archive restores full site fidelity without requiring manual database repairs.
