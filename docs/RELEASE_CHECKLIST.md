# Release Checklist & Pre-Flight Verification Protocol

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Document Type** | Production Release Gate & Verification Checklist |
| **Release Target** | Version 1.0.0 Production Release |
| **Audience** | Release Managers, QA Leads, Platform Engineers, DevOps Engineers |
| **Status** | Mandatory Pre-Release Protocol |

---

## 1. Quality Gates & Automated Validation Checklist

Every release candidate must pass all automated validation checks before deployment approval:

| Gate ID | Verification Item | Command / Procedure | Acceptance Threshold | Verified |
| :--- | :--- | :--- | :--- | :--- |
| **QG-01** | **Static Type Safety** | `npm run lint` (`tsc --noEmit`) | 0 TypeScript errors | [ ] |
| **QG-02** | **Frontmatter Integrity**| `npm run validate` (`fix-and-validate-content.cjs`) | 0 YAML syntax or quote errors | [ ] |
| **QG-03** | **Production Compilation**| `npm run build` (`astro build`) | 100% pages compiled into `dist/` | [ ] |
| **QG-04** | **Node Runtime Check** | `node -v` | Node.js v20.x or v22.x LTS | [ ] |
| **QG-05** | **Zero Token Audit** | `grep -r "ghp_" src/ public/ dist/` | 0 occurrences of GitHub tokens in client assets | [ ] |

---

## 2. Security & Environment Configuration Checklist

| Security Item | Requirement | Verification Method | Verified |
| :--- | :--- | :--- | :--- |
| **SEC-01** | `GITHUB_PAT` configured as a protected server secret | Cloudflare Pages Settings > Environment Variables | [ ] |
| **SEC-02** | `AUTH_SECRET` configured with min 32 random characters | Cloudflare Pages Settings > Environment Variables | [ ] |
| **SEC-03** | Relational D1 Database binding `DB` attached | Cloudflare Pages Settings > Functions > D1 Bindings | [ ] |
| **SEC-04** | D1 SQL Migrations applied to remote database | `wrangler d1 execute astropress-auth-db --remote` | [ ] |
| **SEC-05** | Master Admin account initialized with PBKDF2 hash | Verify non-empty `admin_users` table | [ ] |
| **SEC-06** | Session cookies configured with `HttpOnly`, `Secure`, `SameSite=Lax` | Inspect Set-Cookie header on `/api/auth/login` | [ ] |
| **SEC-07** | Account lockout mechanism verified (5 failures = 15-min lockout) | Automated test or manual failed attempt simulation | [ ] |

---

## 3. SEO, Metadata & Core Web Vitals Checklist

| SEO / Performance Item | Specification Requirement | Verification Tool | Verified |
| :--- | :--- | :--- | :--- |
| **SEO-01** | Canonical URLs match `SITE_URL` on all public pages | View Source `<link rel="canonical">` | [ ] |
| **SEO-02** | OpenGraph image URLs are absolute and resolve to WebP images | Facebook Sharing Debugger / Discord preview | [ ] |
| **SEO-03** | Twitter Card tag set to `summary_large_image` | Twitter Card Validator | [ ] |
| **SEO-04** | Article JSON-LD schema present on all `/posts/*` pages | Google Rich Results Test | [ ] |
| **SEO-05** | FAQPage JSON-LD schema present on posts with FAQ accordions | Google Rich Results Test | [ ] |
| **SEO-06** | Dynamic `/sitemap.xml` returns 200 OK and lists all published posts | Browser inspection | [ ] |
| **SEO-07** | `/robots.txt` disallows `/wpadmin/`, `/admin/`, and `/api/` | Browser inspection | [ ] |
| **SEO-08** | PageSpeed Performance Score >= 95 on mobile and desktop | Google PageSpeed Insights | [ ] |
| **SEO-09** | Cumulative Layout Shift (CLS) <= 0.05 across all viewports | Chrome DevTools Web Vitals Panel | [ ] |

---

## 4. Admin CMS & Editorial Workflow Smoke Tests

Execute these end-to-end checks on the staging or production deployment:

| Flow ID | Scenario | Steps to Execute | Expected Outcome | Verified |
| :--- | :--- | :--- | :--- | :--- |
| **SMK-01** | **Admin Login** | Navigate to `/wpadmin/`, enter valid credentials. | Redirects to Dashboard, shows metrics. | [ ] |
| **SMK-02** | **Create Article** | Click "New Story", enter title, add paragraph, heading, and image block. | Canvas updates in real time, no UI lag. | [ ] |
| **SMK-03** | **Inspector Sidebar** | Set category, enter custom excerpt, select featured image. | Character counters update, preview card displays. | [ ] |
| **SMK-04** | **Save Draft** | Click "Save Draft". | Save confirmation toast appears; status marked "Draft". | [ ] |
| **SMK-05** | **Media Upload** | Drop JPEG into media library. | Image converts to WebP and appears in grid with copy link. | [ ] |
| **SMK-06** | **Git Sync Push** | Navigate to "Git Deployment", click "Push to GitHub". | Server proxy executes atomic commit; status updates to synced. | [ ] |
| **SMK-07** | **Edge Deployment** | Observe Cloudflare Pages build log. | Build finishes in < 60 seconds; new article live on public URL. | [ ] |

---

## 5. Rollback & Emergency Contingency Protocol

In the event of a critical defect, data corruption, or unexpected regression:

```text
[ Incident Triggered ]
          │
          ▼
1. INITIATE INSTANT ROLLBACK:
   - Log in to Cloudflare Dashboard > Workers & Pages > Deployments.
   - Locate the previous known-good deployment.
   - Click 'Rollback to this deployment'.
   - Edge CDN immediately reverts traffic globally in < 5 seconds.
          │
          ▼
2. NOTIFY EDITORIAL TEAM:
   - Alert authors to pause publishing while the incident is triaged.
          │
          ▼
3. LOCAL REPRODUCTION:
   - Checkout the offending commit locally.
   - Run `npm run validate` and `npm run lint` to isolate the error.
   - Apply fix, verify build locally, and commit to `main`.
```

---

## 6. Production Sign-Off Authorization

All signatories must verify their respective operational domain before production traffic is directed to the release:

| Role | Signatory Name | Date | Verification Status | Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Frontend Engineer** | | | [ ] Approved | ____________________ |
| **Lead Backend / Security** | | | [ ] Approved | ____________________ |
| **Head of Quality Assurance**| | | [ ] Approved | ____________________ |
| **Product / Editorial Lead** | | | [ ] Approved | ____________________ |
