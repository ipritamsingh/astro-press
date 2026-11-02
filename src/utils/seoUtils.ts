import { IndexingSettings, Post, Page, Category, Tag } from '../types/cms';

export interface RouteInfo {
  type: 'home' | 'post' | 'page' | 'archive' | 'search' | 'author';
  pageNum?: number;
  post?: Post;
  page?: Page;
  archiveType?: 'category' | 'tag';
  item?: Category | Tag;
  author?: any;
}

export function calculateRobotsDirective(
  route: RouteInfo,
  indexingSettings?: IndexingSettings
): string {
  // Safe defaults
  const globalIndexing = indexingSettings?.globalIndexing ?? true;
  const postsIndexing = indexingSettings?.postsIndexing ?? true;
  const pagesIndexing = indexingSettings?.pagesIndexing ?? true;
  const categoriesIndexing = indexingSettings?.categoriesIndexing ?? false;
  const tagsIndexing = indexingSettings?.tagsIndexing ?? false;
  const paginationPagesIndexing =
    indexingSettings?.paginationPagesIndexing ?? indexingSettings?.paginationIndexing ?? false;
  const searchResultsIndexing = indexingSettings?.searchResultsIndexing ?? false;

  // Level A: Global Search Indexing Master Switch
  if (!globalIndexing) {
    return 'noindex, follow';
  }

  // Level B: Content-Type Specific Indexing
  if (route.type === 'home') {
    // If it's a paginated homepage route (/page2/, /page3/, etc.)
    if (route.pageNum && route.pageNum > 1) {
      return paginationPagesIndexing ? 'index, follow' : 'noindex, follow';
    }
    // Main Homepage (/)
    return 'index, follow';
  }

  if (route.type === 'post') {
    if (route.post?.seo?.robotsIndex === false) {
      return 'noindex, follow';
    }
    return postsIndexing ? 'index, follow' : 'noindex, follow';
  }

  if (route.type === 'page') {
    if (route.page?.seo?.robotsIndex === false) {
      return 'noindex, follow';
    }
    return pagesIndexing ? 'index, follow' : 'noindex, follow';
  }

  if (route.type === 'archive') {
    if (route.archiveType === 'category') {
      return categoriesIndexing ? 'index, follow' : 'noindex, follow';
    }
    if (route.archiveType === 'tag') {
      return tagsIndexing ? 'index, follow' : 'noindex, follow';
    }
  }

  if (route.type === 'search') {
    return searchResultsIndexing ? 'index, follow' : 'noindex, follow';
  }

  return 'index, follow';
}

/**
 * Safely sanitizes excerpts and meta descriptions:
 * - Strips full or truncated markdown images (![...](/... or ![...))
 * - Strips markdown links, headings, blockquotes, code blocks, HTML tags
 * - Cleans dangling or unclosed quotes and YAML scalar characters
 * - Ensures safe plain-text string for YAML frontmatter and SEO meta tags
 */
export function cleanEditorialExcerpt(raw?: string, maxLength = 160): string {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw
    // Strip full and truncated markdown images (e.g. ![alt](url) or ![alt](/upload)
    .replace(/!\[.*?\](?:\(.*?\)|[^\s\n]*)?/g, '')
    // Strip markdown links but preserve text: [Text](url) -> Text
    .replace(/\[([^\]]+)\](?:\([^)]*\)|[^\s\n]*)?/g, '$1')
    // Strip blockquotes: >
    .replace(/(?:^|\n|\s)>\s*/g, ' ')
    // Strip markdown headings: #, ##, etc.
    .replace(/#{1,6}\s*/g, '')
    // Strip code blocks and backticks
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/`/g, '')
    // Strip raw HTML tags
    .replace(/<[^>]*>/g, '')
    // Strip bullet points
    .replace(/(?:^|\n)\s*[-*+]\s+/g, ' ')
    // Normalize newlines, tabs, and spaces
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned.replace(/["'“”‘’]+$/g, '').trim();
  }

  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeText = (lastSpace > maxLength * 0.7 ? truncated.slice(0, lastSpace) : truncated).trim();
  return safeText.replace(/["'“”‘’.,;:!?\-]+$/g, '').trim();
}
