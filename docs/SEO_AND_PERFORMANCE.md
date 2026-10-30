# SEO & Performance Optimization Guide

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Core Web Vitals Target** | 95+ PageSpeed on Mobile & Desktop |
| **Structured Data Standard**| Schema.org JSON-LD (Article, FAQPage, Organization, BreadcrumbList) |
| **Audience** | SEO Specialists, Growth Engineers, Frontend Architects |
| **Status** | Approved SEO & Performance Blueprint |

---

## 1. Core Web Vitals Benchmarks & Architecture

The platform is engineered to achieve perfect Core Web Vitals out-of-the-box by eliminating the two biggest causes of web performance degradation: bloated client-side JavaScript runtimes and unconstrained media elements.

| Web Vital Metric | Target Benchmark | Architectural Mechanism |
| :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | `< 0.8s` | Static HTML pre-rendered at edge CDN; inlined critical CSS. |
| **Largest Contentful Paint (LCP)** | `< 1.2s` | High-priority WebP hero images with `fetchpriority="high"` and preconnect links. |
| **Cumulative Layout Shift (CLS)** | `0.00` | Explicit `width` and `height` dimensions on all images and reserved ad containers. |
| **Interaction to Next Paint (INP)**| `< 50ms` | Zero render-blocking JavaScript; pure native HTML/CSS interactive elements. |
| **Time to First Byte (TTFB)** | `< 150ms` | Globally distributed Cloudflare edge caching across 300+ edge nodes. |

---

## 2. Meta Tag Architecture & Social Share Cards

Every public page dynamically renders comprehensive header metadata via `src/components/seo/SEOHead.astro`:

```html
<!-- Primary Search Engine Tags -->
<title>{metaTitle ? `${metaTitle} | AstroPress` : `${title} | AstroPress`}</title>
<meta name="description" content={metaDescription || excerpt} />
<link rel="canonical" href={canonicalURL || `${SITE_URL}${currentPath}`} />
<meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />

<!-- OpenGraph Social Tags (Facebook, LinkedIn, Discord) -->
<meta property="og:site_name" content="AstroPress" />
<meta property="og:type" content={isArticle ? "article" : "website"} />
<meta property="og:title" content={title} />
<meta property="og:description" content={excerpt} />
<meta property="og:url" content={`${SITE_URL}${currentPath}`} />
<meta property="og:image" content={absoluteImageUrl} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={featuredImageAlt || title} />

<!-- Twitter / X Card Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@astropress" />
<meta name="twitter:creator" content={authorTwitterHandle || "@astropress"} />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={excerpt} />
<meta name="twitter:image" content={absoluteImageUrl} />
```

---

## 3. JSON-LD Structured Data Schemas

Search engines use structured data to generate rich snippets in search results (article carousels, FAQ accordions, author cards).

### 3.1 Article & BlogPosting Schema
Automatically injected on all `/posts/[slug]` reader pages:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://yourdomain.com/posts/edge-publishing-architecture"
  },
  "headline": "Modern Edge Publishing Platform with Gutenberg-Style Visual CMS",
  "description": "How static generation and edge computing deliver instant reading speeds.",
  "image": [
    "https://yourdomain.com/assets/uploads/featured-edge-architecture.webp"
  ],
  "datePublished": "2026-10-30T10:00:00Z",
  "dateModified": "2026-10-30T12:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Jane Doe",
    "url": "https://yourdomain.com/author/jane-doe"
  },
  "publisher": {
    "@type": "Organization",
    "name": "AstroPress",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yourdomain.com/assets/logo.png"
    }
  }
}
```

### 3.2 Dynamic FAQPage Schema
When the author inserts an **Accordion / FAQ block** in the Gutenberg editor, the system parses the items and injects an `FAQPage` schema into the HTML `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does zero-JS reading improve mobile performance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "By eliminating client-side JavaScript bundles, low-end mobile devices can parse and render the page immediately without CPU bottleneck."
      }
    }
  ]
}
```

---

## 4. Automated XML Sitemap (`/sitemap.xml`)

The dynamic endpoint `src/pages/sitemap.xml.ts` generates a search-engine compliant XML sitemap at build time or edge request:

### 4.1 Inclusions
- Homepage (`/`) with priority `1.0` and `changefreq: daily`.
- All published articles (`/posts/*`) with priority `0.8` and `changefreq: weekly`.
- All published static pages (`/[page]`) with priority `0.6` and `changefreq: monthly`.
- All category archive pages (`/category/*`) with priority `0.5`.
- All author profile pages (`/author/*`) with priority `0.5`.

### 4.2 Exclusions
- Draft posts (`draft: true`).
- Posts or pages with `noIndex: true`.
- Internal administration pages (`/wpadmin/*`, `/admin/*`).
- API proxy endpoints (`/api/*`).

---

## 5. Robots Directives (`/robots.txt`)

Direct search engine crawlers with an optimized `public/robots.txt`:

```text
User-agent: *
Allow: /
Disallow: /wpadmin/
Disallow: /admin/
Disallow: /api/

Sitemap: https://yourdomain.com/sitemap.xml
```

---

## 6. Image Optimization & Layout Shift (CLS) Elimination

1. **Automatic WebP Conversion**: Image uploads are converted to WebP with 0.82 compression, reducing file weights by 60–80% compared to raw PNG/JPEG files.
2. **Explicit Dimensions**: Every image tag emitted by Astro or the Markdown renderer includes explicit `width="1200"` and `height="675"` attributes, allowing the browser layout engine to allocate the exact aspect ratio before the image bytes download.
3. **Native Lazy Loading**: Non-hero images receive `loading="lazy"` and `decoding="async"`. Hero spotlight images receive `loading="eager"` and `fetchpriority="high"`.
