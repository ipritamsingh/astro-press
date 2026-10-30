# Deployment Guide: Cloudflare Pages, Edge Functions & Git Hosting

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Primary Host** | Cloudflare Pages (Jamstack Edge Network) |
| **Edge Compute** | Cloudflare Pages Functions (`functions/api/*`) |
| **Database** | Cloudflare D1 (Serverless Relational SQLite) |
| **Audience** | DevOps Engineers, Platform Administrators, Release Managers |
| **Status** | Approved Deployment Blueprint |

---

## 1. Hosting Architecture Overview

The production architecture deploys to **Cloudflare Pages**, combining ultra-fast static asset distribution from 300+ global edge locations with serverless edge functions for authentication and Git synchronization:

```text
[ Git Push to Main Branch ]
             │
             ▼
[ Cloudflare Pages CI/CD Pipeline ]
   1. Detects Node.js 22 LTS via `.node-version`
   2. Runs `npm ci`
   3. Executes `npm run build` (Astro SSG)
   4. Packages `dist/` and `functions/`
             │
             ▼
[ Global Edge Network Deployment ]
   ├── Static Files (HTML, WebP, CSS) -> Global CDN Edge Cache
   ├── Edge Functions (/api/*)         -> Cloudflare V8 Workers
   └── D1 Database Binding             -> Edge Relational SQL
```

---

## 2. Prerequisites & Accounts

Before initiating deployment, ensure you have:
1. A **Cloudflare Account** (Free or Paid plan).
2. A **GitHub Account** with repository ownership or administrative access.
3. A custom domain name (optional for production, or use `*.pages.dev` subdomain).
4. Local CLI: `npm install -g wrangler` (optional for manual CLI deployments).

---

## 3. Step-by-Step Deployment Instructions

### Step 3.1: Create GitHub Personal Access Token (PAT)
To enable the server-side CMS to commit changes back into your Git repository:
1. Log in to GitHub and navigate to: **Settings** > **Developer Settings** > **Personal access tokens** > **Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Name the token: `AstroPress-Production-CMS`.
4. Expiration: Choose 90 days, 1 year, or No expiration according to your organization's policy.
5. Select Scopes: Check the **`repo`** scope (Full control of private repositories).
6. Click **Generate token** and copy the string (e.g., `ghp_xxxxxxxxxxxxxxxxxxxx`). *Keep this secure.*

### Step 3.2: Provision Cloudflare D1 Database
If using the Cloudflare Dashboard:
1. Navigate to **Workers & Pages** > **D1 SQL Database**.
2. Click **Create database**, enter database name: `astropress-auth-db`, and click **Create**.
3. Note the generated **Database ID** (UUID).

If using Wrangler CLI:
```bash
npx wrangler d1 create astropress-auth-db
```

### Step 3.3: Configure `wrangler.toml`
Ensure your project root `wrangler.toml` binds the D1 database correctly:
```toml
name = "astro-press"
pages_build_output_dir = "dist"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "astropress-auth-db"
database_id = "YOUR_DATABASE_ID_FROM_STEP_3_2"
```

### Step 3.4: Apply SQL Migrations to Production D1
Apply the authentication and sessions schema:
```bash
npx wrangler d1 execute astropress-auth-db --file=./migrations/0001_auth_schema.sql --remote
```

### Step 3.5: Create Cloudflare Pages Project
1. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository.
3. Configure **Build Settings**:
   - **Framework Preset**: `Astro`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Root Directory**: `/` (or leave blank)
4. Expand **Environment Variables** and add the configuration keys:

| Variable Name | Environment | Value Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `NODE_VERSION` | Production & Preview | Node runtime version | `22.22.0` |
| `SITE_URL` | Production | Canonical site URL | `https://your-domain.com` |
| `GITHUB_PAT` | Production & Preview (Secret) | GitHub access token | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_REPO_OWNER`| Production & Preview | GitHub username / Org | `your-github-handle` |
| `GITHUB_REPO_NAME` | Production & Preview | Repository name | `my-publishing-website` |
| `GITHUB_BRANCH` | Production | Target Git branch | `main` |
| `AUTH_SECRET` | Production & Preview (Secret) | Cryptographic salt | `random-32-char-string-minimum` |

5. Click **Save and Deploy**. Cloudflare will run the initial build and deploy your site to `https://your-project.pages.dev`.

### Step 3.6: Attach D1 Database Binding to Cloudflare Pages
1. Go to your Pages project in Cloudflare Dashboard: **Settings** > **Functions**.
2. Scroll down to **D1 Database Bindings**.
3. Click **Add binding**:
   - **Variable Name**: `DB`
   - **D1 Database**: Select `astropress-auth-db`.
4. Click **Save**.

---

## 4. Initial Administrator Account Setup

Once deployed, initialize your primary administrator account:
1. Navigate to: `https://your-domain.com/wpadmin/setup` (or execute the initial admin script).
2. Enter your desired Admin Email and a secure Master Password (minimum 12 characters).
3. The server hashes the password with PBKDF2-SHA256, generates an emergency recovery key, and records the admin user into `admin_users`.
4. Save the displayed emergency recovery code in a secure password manager.

---

## 5. Domain Configuration & SSL

1. In Cloudflare Pages project, go to **Custom domains** > **Set up a custom domain**.
2. Enter your apex domain (`yourdomain.com`) or subdomain (`blog.yourdomain.com`).
3. Cloudflare automatically provisions a free, managed Universal SSL certificate and configures DNS routing.
4. Ensure **Always Use HTTPS** is enabled under Cloudflare SSL/TLS settings.

---

## 6. Edge Caching & Cache Purging Protocols

- **Static Content (HTML/WebP/CSS)**: Cached globally at Cloudflare edge with standard `stale-while-revalidate` policies.
- **Cache Invalidation**: Every new deployment on Cloudflare Pages automatically flushes the edge cache instantly across all 300+ edge data centers.
- **Manual Purge**: If you ever need to manually invalidate cached assets without re-deploying, use Cloudflare Dashboard: **Caching** > **Configuration** > **Purge Everything**.

---

## 7. Rollback & Disaster Recovery Procedures

Cloudflare Pages maintains permanent snapshots of every past deployment. If an unintended change or regression reaches production:
1. Go to **Workers & Pages** > Select your Pages project > **Deployments**.
2. Locate the previous healthy deployment in the deployment list.
3. Click the three dots (`...`) icon next to that deployment and select **Rollback to this deployment**.
4. The edge CDN instantly shifts traffic back to the chosen release in under 5 seconds.
