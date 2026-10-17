import type { APIRoute } from 'astro';
import siteSettingsJson from '../data/siteSettings.json';

/**
 * Build-time robots.txt generated from the admin-controlled settings file.
 *
 * Previously no robots.txt existed anywhere in the project. The only robots
 * content was a preview string rendered inside the admin SEO screen for manual
 * copy-paste, so nothing was ever actually served.
 *
 * Private surfaces are also covered by X-Robots-Tag in public/_headers, which
 * is required for /admin and /admin-native because those are static files copied
 * from public/ and never pass through this layout.
 */
export const GET: APIRoute = async () => {
  const settings: any = (siteSettingsJson as any) || {};
  const siteUrl = (settings.siteUrl || '').replace(/\/+$/, '');
  const indexing = settings.indexingSettings || {};

  const disallowAll = indexing.globalIndexing === false;

  const lines: string[] = [
    '# robots.txt for AstroPress CMS',
    '# Generated at build time from src/data/siteSettings.json.',
    '# Manage indexing from Admin -> Settings -> SEO -> Indexing Controls.',
    '',
    'User-agent: *',
  ];

  if (disallowAll) {
    lines.push('Disallow: /');
  } else {
    lines.push('Allow: /');
    // Never advertise the CMS, admin or API surfaces to crawlers.
    lines.push('Disallow: /admin');
    lines.push('Disallow: /admin-native');
    lines.push('Disallow: /wpadmin');
    lines.push('Disallow: /dashboard');
    lines.push('Disallow: /api/');
    lines.push('Disallow: /page'); // pagination roots
  }

  if (siteUrl) {
    lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};