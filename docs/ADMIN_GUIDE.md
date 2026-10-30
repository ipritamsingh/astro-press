# AstroPress — Administrator Dashboard & Publishing Workflows

| Metadata | Details |
| :--- | :--- |
| **Admin Route** | `/wpadmin/` (Interactive React Island SPA) & `/admin/` (Sveltia CMS) |
| **Authentication System** | Cloudflare D1 Edge SQL Session (`astropress_session`) |
| **Document Target** | Content Editors, Site Administrators & Webmasters |
| **Last Verified** | October 30, 2026 |

---

## 1. Navigating the Admin Dashboard

Access the administration dashboard by navigating to `https://your-domain.pages.dev/wpadmin/` (or `http://localhost:3000/wpadmin/` in development).

```
┌────────────────────────────────────────────────────────────────────────┐
│  AstroPress Admin Studio                                               │
├─────────────────┬──────────────────────────────────────────────────────┤
│ 📝 Posts        │ Dashboard Summary                                    │
│ 📄 Pages        │ ─────────────────                                    │
│ 🎨 Gutenberg    │ Total Published Articles: 11                         │
│ 🖼️ Media Library│ Draft Articles: 4                                    │
│ 📢 Ads Manager  │ Total Pages: 4                                       │
│ 🧭 Menus        │ Cloudflare Edge Status: Connected (D1 Active)        │
│ 🏷️ Categories   │ GitHub Sync Status: Ready for Commit                 │
│ 🔍 SEO Manager  │ ───────────────────────────────────────────────────  │
│ ⚙️ Settings     │ Quick Actions:                                       │
│ 🚀 GitHub & CI  │ [ + Create New Post ]   [ Push Changes to GitHub ]   │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 2. The 6-Stage Publishing Lifecycle

To prevent confusion and broken builds, AstroPress strictly decouples local editing from production deployment:

```
[ Stage A: Draft & Edit ]
          │
          ▼
[ Stage B: Local Collection Save ] ── (Stored in src/content/posts/<slug>.md)
          │
          ▼
[ Stage C: Content Update / Iteration ]
          │
          ▼
[ Stage D: Push to GitHub ] ───────── (Atomic commit via server-side GITHUB_PAT)
          │
          ▼
[ Stage E: Cloudflare Pages Build ] ─ (Astro build generates static dist/)
          │
          ▼
[ Stage F: Production Edge Verification ]
```

---

## 3. Detailed Workflows

### Stage A: Create or Edit an Article / Page
1. From the left sidebar, click **Posts** (or **Pages**).
2. Click **"+ Add New Post"** at the top right.
3. The **Gutenberg Editor** opens in a clean full-screen modal:
   - Enter your article headline in the title input.
   - Click **"+ Add Block Here"** or the floating toolbar button to insert headings, paragraphs, images, columns, FAQs, or tables.
   - Use the **Block Inspector** sidebar on the right to customize colors, alignments, typography scales, and aspect ratios.
   - In the **Document** tab, assign an Author, Category, Tags, and Featured Image.

---

### Stage B: Save Local Content
1. Click **"Save Draft"** or **"Publish"** in the top navigation bar.
2. The editor automatically:
   - Sanitizes excerpts and meta descriptions (removes carriage returns and Markdown image tags).
   - Serializes clean YAML frontmatter with strict double-quoted strings.
   - Sends a `POST` request to `/api/content/publish`.
   - Writes the `.md` file directly to `src/content/posts/<slug>.md`.
3. **Feedback Notice**: An emerald badge appears: `Post published successfully in local content collection.`
4. **Important**: At this stage, your post is saved to local disk and visible in local previews, but **has NOT been sent to GitHub or production yet**.

---

### Stage C: Update Existing Content
1. Navigate to **Posts** and locate the post in the table.
2. Click the **Edit** icon (pencil).
3. Make your revisions in the Gutenberg canvas.
4. Click **"Update"**.
5. The local file is updated in place. If you changed the URL slug, AstroPress automatically deletes the old `.md` file on disk to prevent orphaned content duplicates.

---

### Stage D: Push Accumulated Changes to GitHub
When you are ready to ship your local changes to production:
1. From the left sidebar, click **GitHub & Deployment**.
2. Click **"Test GitHub Connection"** to verify that your server-side token has write access.
3. Review the **Modified Files Summary** (e.g., `src/content/posts/new-post.md`, `src/data/categories.json`).
4. Click **"Push All Changes to GitHub"**.
5. The server creates an atomic Git tree and commit on the `main` branch.
6. **Expected Feedback**:
   ```
   ✅ Synchronized 3 modified files successfully!
   Commit SHA: 6fcfd588f6ca1e473136c93a89eb9329a8589b97
   Branch: main
   ```

---

### Stage E: Cloudflare Pages Build & Deployment
1. Pushing to `main` automatically triggers Cloudflare Pages' build webhook.
2. Monitor build progress in **Cloudflare Dashboard &rarr; Pages &rarr; astropress &rarr; Deployments**.
3. Cloudflare executes `npm run build`, generating the static HTML in `dist/` in ~45 seconds.

---

### Stage F: Production Edge Verification
1. Visit `https://astro-press.pages.dev/posts/your-new-slug/`.
2. Inspect the page to confirm:
   - Semantic HTML rendering (<article>, <h2>, <p>).
   - Core Web Vitals score (0 KB runtime JS for pure reading).
   - OpenGraph and Twitter card tags in `<head>`.
   - FAQPage or Article JSON-LD structured data.

---

## 4. Diagnosing Publishing Issues by Stage

| Stage | Symptom | How to Diagnose | Exact Resolution |
| :--- | :--- | :--- | :--- |
| **Stage B (Local Save)** | "Failed to save post to local content collection" | Check browser network tab on `/api/content/publish`. | Verify development server is running and `src/content/posts` has write permissions. |
| **Stage D (Git Push)** | "GitHub PAT secret (GITHUB_PAT) is not configured" | `/api/github/*` returns HTTP 503. | Add `GITHUB_PAT` encrypted secret in Cloudflare Pages Dashboard &rarr; Settings &rarr; Environment variables. |
| **Stage D (Git Push)** | "Token does not have Push/Write permissions" | Connection status shows 403. | Re-generate GitHub PAT with **Contents: Read and write** permissions. |
| **Stage E (Build)** | "Missing closing quote at line X" in build logs | Cloudflare build failed at `astro build`. | Run `node scripts/fix-and-validate-content.cjs` locally, verify `npm run build` succeeds, then push. |
| **Stage F (Live Site)** | Old content still showing on production | HTTP Cache hit on Cloudflare Edge. | Purge Cloudflare cache or perform a hard refresh (`Ctrl + Shift + R`). |
