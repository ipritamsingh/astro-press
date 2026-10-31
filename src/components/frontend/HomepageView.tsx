import React from 'react';
import { Post, Category, HomepageSection, ThemeSettings, HeroSectionConfig, Author, SiteSettings } from '../../types/cms';
import { HeroSection } from './HeroSection';
import { PostCardImage } from '../common/PostCardImage';
import { AdSlotRenderer } from '../common/AdSlotRenderer';
import {
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  posts: Post[];
  categories: Category[];
  sections: HomepageSection[];
  heroConfig?: HeroSectionConfig;
  themeSettings: ThemeSettings;
  siteSettings?: SiteSettings;
  currentPage?: number;
  postsPerPage?: number;
  authors?: Author[];
  onSelectPost: (post: Post) => void;
  onSelectCategory: (cat: Category) => void;
  onNavigate?: (path: string) => void;
  onSelectAuthor?: (author: Author) => void;
}

export const HomepageView: React.FC<Props> = ({
  posts,
  categories,
  sections,
  heroConfig,
  themeSettings,
  siteSettings,
  currentPage = 1,
  postsPerPage = 6,
  authors = [],
  onSelectPost,
  onSelectCategory,
  onNavigate,
  onSelectAuthor,
}) => {
  const publishedPosts = [...posts]
    .filter((p) => p.status === 'published')
    .sort((a, b) => {
      const timeA = new Date(a.pubDate || 0).getTime();
      const timeB = new Date(b.pubDate || 0).getTime();
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return (a.slug || a.id || '').localeCompare(b.slug || b.id || '');
    });
  const heroPost = publishedPosts[0];
  const featuredPosts = publishedPosts.slice(1, 4);

  const resolveAuthor = (authorName?: string): { name: string; slug: string; avatar: string } => {
    const raw = (authorName || 'Staff Author').trim();
    const found = authors.find(
      (a) => a.name.toLowerCase() === raw.toLowerCase() || a.slug.toLowerCase() === raw.toLowerCase()
    );
    return {
      name: found?.name || raw,
      slug: found?.slug || raw.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      avatar: found?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    };
  };

  const handleAuthorClick = (e: React.MouseEvent, authorName?: string) => {
    e.stopPropagation();
    const res = resolveAuthor(authorName);
    const authorObj: Author = authors.find((a) => a.slug === res.slug) || {
      id: `auth-${res.slug}`,
      name: res.name,
      slug: res.slug,
      role: 'Author',
      email: `${res.slug}@astropress.local`,
      avatar: res.avatar,
      bio: '',
    };
    if (onSelectAuthor) {
      e.preventDefault();
      onSelectAuthor(authorObj);
    } else if (onNavigate) {
      e.preventDefault();
      onNavigate(`/author/${res.slug}/`);
    }
  };

  const currentPageNum = currentPage && currentPage > 0 ? currentPage : 1;
  const totalPosts = publishedPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  let displayPosts: Post[] = [];
  if (currentPageNum === 1) {
    displayPosts = publishedPosts.slice(0, postsPerPage);
  } else {
    const startIndex = postsPerPage + (currentPageNum - 2) * postsPerPage;
    const endIndex = postsPerPage + (currentPageNum - 1) * postsPerPage;
    displayPosts = publishedPosts.slice(startIndex, endIndex);
  }

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Paginated Pages Layout (/page2/, /page3/, etc.)
  if (currentPageNum > 1) {
    return (
      <div className="space-y-12 pb-16 pt-6">
        {/* Post Grid */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayPosts.map((post, postIdx) => {
              const cardInterval = siteSettings?.adsSettings?.homepageAdsConfig?.betweenPostCards?.cardInterval ?? 2;
              return (
                <React.Fragment key={post.id}>
                  {postIdx > 0 && postIdx % cardInterval === 0 && (
                    <AdSlotRenderer
                      placement="homepage_between_post_cards"
                      siteSettings={siteSettings}
                      contentType="homepage"
                      paragraphIndex={postIdx}
                      className="col-span-1 md:col-span-2 my-2"
                    />
                  )}
                  <article
                    onClick={() => onSelectPost(post)}
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full"
                  >
                    <div className="w-full sm:w-44 aspect-16/10 sm:aspect-square sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                      <PostCardImage
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        fallbackCategory={post.category}
                        fallbackIcon={<Sparkles className="h-6 w-6 mb-1 opacity-40 text-blue-500" />}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-2 w-full">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-bold text-blue-600">{post.category}</span>
                          <span>•</span>
                          <span>{post.readingTime} min read</span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                        <a
                          href={`/author/${resolveAuthor(post.author).slug}/`}
                          onClick={(e) => handleAuthorClick(e, post.author)}
                          className="hover:text-blue-600 hover:underline transition-colors focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded-xs font-medium text-slate-700"
                          aria-label={`View articles by ${post.author}`}
                        >
                          {post.author}
                        </a>
                        <span>{new Date(post.pubDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </article>
                </React.Fragment>
              );
            })}
          </div>

          {/* Homepage Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 sm:pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
              {currentPageNum > 1 ? (
                <a
                  href={currentPageNum === 2 ? '/' : `/page${currentPageNum - 1}/`}
                  onClick={(e) => {
                    e.preventDefault();
                    const prevPath = currentPageNum === 2 ? '/' : `/page${currentPageNum - 1}/`;
                    if (onNavigate) onNavigate(prevPath);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Page</span>
                </a>
              ) : (
                <div className="w-24" />
              )}

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === currentPageNum;
                  const pagePath = p === 1 ? '/' : `/page${p}/`;
                  return (
                    <a
                      key={p}
                      href={pagePath}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNavigate) onNavigate(pagePath);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs scale-105'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </a>
                  );
                })}
              </div>

              {currentPageNum < totalPages ? (
                <a
                  href={`/page${currentPageNum + 1}/`}
                  onClick={(e) => {
                    e.preventDefault();
                    const nextPath = `/page${currentPageNum + 1}/`;
                    if (onNavigate) onNavigate(nextPath);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Next Page</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : (
                <div className="w-24" />
              )}
            </div>
          )}

          {/* Ad Before Footer on Paginated View */}
          <AdSlotRenderer
            placement="before_footer"
            siteSettings={siteSettings}
            contentType="homepage"
            className="my-8"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Placement: Above Hero */}
      <AdSlotRenderer
        placement="homepage_above_hero"
        siteSettings={siteSettings}
        contentType="homepage"
        className="mb-4"
      />

      {/* Hero Section */}
      {heroConfig && heroConfig.enabled && (
        <HeroSection config={heroConfig} onNavigate={onNavigate} />
      )}

      {/* 2. Placement: Below Hero */}
      <AdSlotRenderer
        placement="homepage_below_hero"
        siteSettings={siteSettings}
        contentType="homepage"
        className="my-6"
      />

      {sortedSections.map((section, sectionIdx) => {
        if (!section.enabled) return null;

        let sectionContent: React.ReactNode = null;

        switch (section.type) {
          case 'hero':
            // If the customizable HeroSection is active above, skip the legacy hero section to avoid duplicate heroes
            if (heroConfig && heroConfig.enabled) {
              sectionContent = null;
            } else if (heroPost) {
              sectionContent = (
                <section key={section.id} className="relative pt-6">
                  <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
                    <div className="absolute inset-0 z-0">
                      <PostCardImage
                        src={
                          heroPost.featuredImage ||
                          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80'
                        }
                        alt={heroPost.title}
                        className="w-full h-full object-cover opacity-25 scale-105 transition-transform duration-700 hover:scale-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                    </div>

                    <div className="relative z-10 p-6 sm:p-10 md:p-16 max-w-4xl space-y-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          style={{ backgroundColor: 'var(--ap-primary)' }}
                          className="text-xs uppercase font-extrabold tracking-wider text-white px-3 py-1 rounded-full shadow-xs"
                        >
                          {heroPost.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{heroPost.readingTime} min read</span>
                        </div>
                        <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Featured Story</span>
                        </span>
                      </div>

                      <h1
                        onClick={() => onSelectPost(heroPost)}
                        className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight cursor-pointer hover:text-blue-300 transition-colors font-serif-custom"
                      >
                        {heroPost.title}
                      </h1>

                      <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed line-clamp-3">
                        {heroPost.excerpt}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                          <a
                            href={`/author/${resolveAuthor(heroPost.author).slug}/`}
                            onClick={(e) => handleAuthorClick(e, heroPost.author)}
                            className="shrink-0 group focus:outline-hidden focus:ring-2 focus:ring-blue-400 rounded-full"
                            aria-label={`View profile of ${heroPost.author}`}
                          >
                            <img
                              src={resolveAuthor(heroPost.author).avatar}
                              alt={heroPost.author}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-blue-400 transition-all"
                            />
                          </a>
                          <div>
                            <a
                              href={`/author/${resolveAuthor(heroPost.author).slug}/`}
                              onClick={(e) => handleAuthorClick(e, heroPost.author)}
                              className="block text-sm font-bold text-white hover:text-blue-300 hover:underline transition-colors focus:outline-hidden focus:ring-1 focus:ring-blue-400 rounded-xs"
                              aria-label={`View articles by ${heroPost.author}`}
                            >
                              {heroPost.author}
                            </a>
                            <span className="text-xs text-slate-400">
                              {new Date(heroPost.pubDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectPost(heroPost)}
                          style={{ backgroundColor: 'var(--ap-primary)' }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-95 transition-all shadow-md"
                        >
                          <span>Read Full Story</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            }
            break;

          case 'category-showcase':
            sectionContent = (
              <section key={section.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                      {section.title || 'Explore by Topic'}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5">{section.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {categories.map((cat) => {
                    const count = publishedPosts.filter((p) => {
                      const pCat = (p.category || '').trim().toLowerCase();
                      return pCat === (cat.name || '').trim().toLowerCase() || pCat === (cat.slug || '').trim().toLowerCase() || pCat === cat.id;
                    }).length;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => onSelectCategory(cat)}
                        className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-500 hover:shadow-md transition-all space-y-2"
                      >
                        <div
                          className="h-2 w-8 rounded-full transition-all group-hover:w-12"
                          style={{ backgroundColor: cat.color || 'var(--ap-primary)' }}
                        />
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-500">{count} {count === 1 ? 'article' : 'articles'}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Placement: Between Category & Featured Sections */}
                <AdSlotRenderer
                  placement="homepage_between_category_sections"
                  siteSettings={siteSettings}
                  contentType="homepage"
                  className="pt-4"
                />
              </section>
            );
            break;

          case 'featured-grid': {
            const sectionFeaturedSlugs = section.featuredPostSlugs || [];
            const configuredFeaturedPosts = sectionFeaturedSlugs.length > 0
              ? sectionFeaturedSlugs
                  .map((slug) => publishedPosts.find((p) => p.slug === slug || p.id === slug))
                  .filter((p): p is Post => Boolean(p))
              : [];
            const activeFeaturedPosts = configuredFeaturedPosts.length > 0 ? configuredFeaturedPosts : featuredPosts;

            sectionContent = (
              <section key={section.id} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Curated Selection</span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {section.title || 'Featured Stories & Architecture Guides'}
                  </h2>
                  {section.subtitle && (
                    <p className="text-xs md:text-sm text-slate-500 mt-1">{section.subtitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {activeFeaturedPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col h-full"
                    >
                      <div className="aspect-16/10 w-full overflow-hidden bg-slate-100 relative shrink-0">
                        <PostCardImage
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          fallbackCategory={post.category}
                          fallbackIcon={<Sparkles className="h-8 w-8 mb-1 opacity-40 text-blue-500" />}
                        />
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                          {post.category}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{new Date(post.pubDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>•</span>
                            <span>{post.readingTime} min read</span>
                          </div>
                          <h3 className="font-bold text-base md:text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <a
                            href={`/author/${resolveAuthor(post.author).slug}/`}
                            onClick={(e) => handleAuthorClick(e, post.author)}
                            className="font-semibold text-slate-800 hover:text-blue-600 hover:underline transition-colors focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded-xs"
                            aria-label={`View articles by ${post.author}`}
                          >
                            {post.author}
                          </a>
                          <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Read <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
            break;
          }

          case 'latest-posts':
            sectionContent = (
              <section key={section.id} className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {section.title || 'Latest Dispatches & Insights'} {currentPageNum > 1 ? `(Page ${currentPageNum})` : ''}
                  </h2>
                  {section.subtitle && (
                    <p className="text-xs md:text-sm text-slate-500 mt-1">{section.subtitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayPosts.map((post, postIdx) => {
                    const cardInterval = siteSettings?.adsSettings?.homepageAdsConfig?.betweenPostCards?.cardInterval ?? 2;
                    return (
                      <React.Fragment key={post.id}>
                        {postIdx > 0 && postIdx % cardInterval === 0 && (
                          <AdSlotRenderer
                            placement="homepage_between_post_cards"
                            siteSettings={siteSettings}
                            contentType="homepage"
                            paragraphIndex={postIdx}
                            className="col-span-1 md:col-span-2 my-2"
                          />
                        )}
                        <article
                          onClick={() => onSelectPost(post)}
                          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full"
                        >
                          <div className="w-full sm:w-44 aspect-16/10 sm:aspect-square sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                            <PostCardImage
                              src={post.featuredImage}
                              alt={post.title}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              fallbackCategory={post.category}
                              fallbackIcon={<Sparkles className="h-6 w-6 mb-1 opacity-40 text-blue-500" />}
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between space-y-2 w-full">
                            <div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <span className="font-bold text-blue-600">{post.category}</span>
                                <span>•</span>
                                <span>{post.readingTime} min read</span>
                              </div>
                              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                                {post.title}
                              </h3>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                              <a
                                href={`/author/${resolveAuthor(post.author).slug}/`}
                                onClick={(e) => handleAuthorClick(e, post.author)}
                                className="hover:text-blue-600 hover:underline transition-colors focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded-xs font-medium text-slate-700"
                                aria-label={`View articles by ${post.author}`}
                              >
                                {post.author}
                              </a>
                              <span>{new Date(post.pubDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </article>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Homepage Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-4 sm:pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
                    {currentPageNum > 1 ? (
                      <a
                        href={currentPageNum === 2 ? '/' : `/page${currentPageNum - 1}/`}
                        onClick={(e) => {
                          e.preventDefault();
                          const prevPath = currentPageNum === 2 ? '/' : `/page${currentPageNum - 1}/`;
                          if (onNavigate) onNavigate(prevPath);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous Page</span>
                      </a>
                    ) : (
                      <div className="w-24" />
                    )}

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        const isActive = p === currentPageNum;
                        const pagePath = p === 1 ? '/' : `/page${p}/`;
                        return (
                          <a
                            key={p}
                            href={pagePath}
                            onClick={(e) => {
                              e.preventDefault();
                              if (onNavigate) onNavigate(pagePath);
                            }}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-xs scale-105'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </a>
                        );
                      })}
                    </div>

                    {currentPageNum < totalPages ? (
                      <a
                        href={`/page${currentPageNum + 1}/`}
                        onClick={(e) => {
                          e.preventDefault();
                          const nextPath = `/page${currentPageNum + 1}/`;
                          if (onNavigate) onNavigate(nextPath);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Next Page</span>
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <div className="w-24" />
                    )}
                  </div>
                )}
              </section>
            );
            break;

          default:
            sectionContent = null;
        }

        if (!sectionContent) return null;

        return (
          <React.Fragment key={section.id}>
            {sectionContent}

            {/* 3. Placement: Between Homepage Sections */}
            {sectionIdx < sortedSections.length - 1 && (
              <AdSlotRenderer
                placement="between_homepage_sections"
                siteSettings={siteSettings}
                contentType="homepage"
                sectionId={section.id}
                className="my-10"
              />
            )}
          </React.Fragment>
        );
      })}

      {/* 6. Placement: Before Footer */}
      <AdSlotRenderer
        placement="before_footer"
        siteSettings={siteSettings}
        contentType="homepage"
        className="mt-12"
      />
    </div>
  );
};
