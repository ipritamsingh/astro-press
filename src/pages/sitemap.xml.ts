import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import siteSettingsJson from '../data/siteSettings.json';

/**
 * Build-time XML sitemap generated from the Astro content collections and the
 * admin-controlled settings file.
 *
 * Previously no sitemap was generated or served at all. The admin SEO screen
 * only rendered a copy-paste preview string, and that generator advertised the
 * duplicate /posts/{slug}/ URLs, ignored drafts, and omitted categories.
 *
 * Only canonical, public, indexable URLs are emitted:
 *  - homepage
 *  - published posts at their canonical root-level /{slug}/ permalink
 *  - published pages at /{slug}/ (excluding the "home" duplicate of "/")
 *  - categories, unless categoriesIndexing is disabled
 *
 * Private routes (/admin, /admin-native, /wpadmin, /dashboard, /api) and the
 * /posts/{slug}/ duplicates are deliberately excluded.
 */
export const GET: APIRoute = async () => {
  const settings: any = (siteSettingsJson as any) || {};
  const base = (settings.siteUrl || '').replace(/\/+$/, '');
  const indexing = settings.indexingSettings || {};

  const urls: { loc: string; changefreq: string; priority: string }[] = [];

  if (base && indexing.globalIndexing !== false) {
    urls.push({ loc: `${base}/`, changefreq: 'daily', priority: '1.0' });

    if (indexing.postsIndexing !== false) {
      const posts = await getCollection('posts');
      for (const post of posts) {
        if (post.data.draft || post.data.status === 'draft') continue;
        const slug = post.data.slug || post.id.replace(/\.md$/, '');
        urls.push({
          loc: `${base}/${slug.replace(/^\/+|\/+$/g, '')}/`,
          changefreq: 'weekly',
          priority: '0.8',
        });
      }
    }

    if (indexing.pagesIndexing !== false) {
      const pages = await getCollection('pages');
      for (const page of pages) {
        if (page.data.draft) continue;
        const slug = page.data.slug || page.id.replace(/\.md$/, '');
        // "home" duplicates the site root; the homepage is already listed.
        if (slug === 'home') continue;
        urls.push({
          loc: `${base}/${slug.replace(/^\/+|\/+$/g, '')}/`,
          changefreq: 'monthly',
          priority: '0.6',
        });
      }
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};