import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import siteSettingsJson from '../data/siteSettings.json';
import authorsJson from '../data/authors.json';
import categoriesJson from '../data/categories.json';
import { initialAuthors, initialCategories } from '../data/initialData';

/**
 * Build-time XML sitemap generated from the Astro content collections and the
 * admin-controlled settings file.
 *
 * Only canonical, public, indexable URLs are emitted:
 *  - homepage
 *  - all articles archive at /posts/
 *  - published posts at their canonical root-level /{slug}/ permalink
 *  - published pages at /{slug}/ (excluding the "home" duplicate of "/")
 *  - active categories at /category/{slug}/
 *  - authors at /author/{slug}/
 *
 * Private routes (/admin, /admin-native, /wpadmin, /dashboard, /api) and the
 * /posts/{slug}/ duplicates are deliberately excluded.
 */
export const GET: APIRoute = async () => {
  const settings: any = (siteSettingsJson as any) || {};
  const rawBase = (settings.siteUrl || '').trim();
  const base = (rawBase === 'https://astropress.pages.dev' || !rawBase ? 'https://astro-press.pages.dev' : rawBase).replace(/\/+$/, '');
  const indexing = settings.indexingSettings || {};

  interface SitemapUrlEntry {
    loc: string;
    lastmod?: string;
    changefreq: string;
    priority: string;
  }

  const urls: SitemapUrlEntry[] = [];

  if (base && indexing.globalIndexing !== false) {
    urls.push({ loc: `${base}/`, changefreq: 'daily', priority: '1.0' });

    if (indexing.postsIndexing !== false) {
      // All posts index
      urls.push({
        loc: `${base}/posts/`,
        changefreq: 'daily',
        priority: '0.8',
      });

      const posts = await getCollection('posts');
      for (const post of posts) {
        if (post.data.draft || post.data.status === 'draft' || post.data.status === 'trash') continue;
        const slug = post.data.slug || post.id.replace(/\.md$/, '');
        const dateVal = post.data.updatedDate || post.data.pubDate;
        const lastmod = dateVal ? new Date(dateVal).toISOString().split('T')[0] : undefined;

        urls.push({
          loc: `${base}/${slug.replace(/^\/+|\/+$/g, '')}/`,
          lastmod,
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

    // Categories
    if (indexing.categoriesIndexing !== false) {
      const catsList = (categoriesJson as any)?.categories || initialCategories;
      for (const cat of catsList) {
        if (!cat.slug || cat.isActive === false) continue;
        urls.push({
          loc: `${base}/category/${cat.slug.replace(/^\/+|\/+$/g, '')}/`,
          changefreq: 'weekly',
          priority: '0.7',
        });
      }
    }

    // Authors
    const authorsList = (Array.isArray(authorsJson) && authorsJson.length > 0)
      ? authorsJson
      : initialAuthors;
    for (const author of authorsList) {
      if (!author.slug) continue;
      urls.push({
        loc: `${base}/author/${author.slug}/`,
        changefreq: 'monthly',
        priority: '0.7',
      });
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};