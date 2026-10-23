import React, { useMemo } from 'react';
import {
  Post,
  Category,
  HomepageSection,
  ThemeSettings,
  HeroSectionConfig,
  Author,
  SiteSettings,
  DynamicAdSlot,
  HomepageAdPlacement,
} from '../../types/cms';
import { HeroSection } from './HeroSection';
import { PostCardImage } from '../common/PostCardImage';
import { AdUnitWidget } from '../common/AdUnitWidget';
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
  currentPage?: number;
  postsPerPage?: number;
  authors?: Author[];
  onSelectPost: (post: Post) => void;
  onSelectCategory: (cat: Category) => void;
  onNavigate?: (path: string) => void;
  onSelectAuthor?: (author: Author) => void;
  siteSettings?: SiteSettings;
}

export const HomepageView: React.FC<Props> = ({
  posts,
  categories,
  sections,
  heroConfig,
  themeSettings,
  currentPage = 1,
  postsPerPage = 6,
  authors = [],
  onSelectPost,
  onSelectCategory,
  onNavigate,
  onSelectAuthor,
  siteSettings,
}) => {
  const publishedPosts = posts.filter((p) => p.status === 'published');
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

  const ads = siteSettings?.adsSettings;
  const adsEnabled = Boolean(ads?.adsEnabled && ads?.publisherId);
  const publisherId = ads?.publisherId || '';

  const homeSlots: DynamicAdSlot[] = useMemo(() => {
    if (!ads) return [];
    if (Array.isArray(ads.homeSlots)) {
      return ads.homeSlots.filter((s) => s.enabled && s.adUnitId).sort((a, b) => a.order - b.order);
    }
    const list: DynamicAdSlot[] = [];
    if (ads.homeSlot1?.enabled && ads.homeSlot1?.adUnitId) {
      list.push({
        id: ads.homeSlot1.id || 'home-slot-1',
        name: ads.homeSlot1.name || 'Homepage Slot 1',
        enabled: true,
        adUnitId: ads.homeSlot1.adUnitId,
        placement: ads.homeSlot1.placement || 'below_hero',
        deviceVisibility: ads.homeSlot1.deviceVisibility || 'all',
        format: ads.homeSlot1.format || 'auto',
        order: ads.homeSlot1.order ?? 1,
      });
    }
    if (ads.homeSlot2?.enabled && ads.homeSlot2?.adUnitId) {
      list.push({
        id: ads.homeSlot2.id || 'home-slot-2',
        name: ads.homeSlot2.name || 'Homepage Slot 2',
        enabled: true,
        adUnitId: ads.homeSlot2.adUnitId,
        placement: ads.homeSlot2.placement || 'below_pagination',
        deviceVisibility: ads.homeSlot2.deviceVisibility || 'all',
        format: ads.homeSlot2.format || 'auto',
        order: ads.homeSlot2.order ?? 2,
      });
    }
    return list.sort((a, b) => a.order - b.order);
  }, [ads]);

  const renderedSlotIds = new Set<string>();
  const renderedUnitIds = new Set<string>();

  const renderSlotsForPlacement = (placement: HomepageAdPlacement) => {
    if (!adsEnabled) return null;
    const matchingSlots = homeSlots.filter(
      (s) => s.placement === placement && !renderedSlotIds.has(s.id) && (!s.adUnitId || !renderedUnitIds.has(s.adUnitId))
    );
    if (matchingSlots.length === 0) return null;

    return (
      <div className="w-full my-6">
        {matchingSlots.map((slot) => {
          renderedSlotIds.add(slot.id);
          if (slot.adUnitId) renderedUnitIds.add(slot.adUnitId);
          return (
            <AdUnitWidget
              key={slot.id}
              adsEnabled={adsEnabled}
              publisherId={publisherId}
              adUnitId={slot.adUnitId}
              slotName={slot.name}
              format={slot.format}
              deviceVisibility={slot.deviceVisibility}
            />
          );
        })}
      </div>
    );
  };

  const renderSharedBottomSlot = () => {
    if (!adsEnabled || !ads?.sharedBottomSlot?.enabled || !ads.sharedBottomSlot.showOnHomepage || !ads.sharedBottomSlot.adUnitId) {
      return null;
    }
    const sharedId = ads.sharedBottomSlot.id || 'shared-bottom-slot';
    const sharedUnitId = ads.sharedBottomSlot.adUnitId;
    if (renderedSlotIds.has(sharedId) || (sharedUnitId && renderedUnitIds.has(sharedUnitId))) {
      return null;
    }
    renderedSlotIds.add(sharedId);
    if (sharedUnitId) renderedUnitIds.add(sharedUnitId);
    return (
      <div className="w-full my-8">
        <AdUnitWidget
          adsEnabled={adsEnabled}
          publisherId={publisherId}
          adUnitId={ads.sharedBottomSlot.adUnitId}
          slotName="Shared Bottom Ad"
          format={ads.sharedBottomSlot.format}
          deviceVisibility={ads.sharedBottomSlot.deviceVisibility}
        />
      </div>
    );
  };

  // Paginated Pages Layout (/page2/, /page3/, etc.)
  if (currentPageNum > 1) {
    return (
      <div className="space-y-12 pb-16 pt-6">
        {renderSlotsForPlacement('below_navigation')}
        {/* Post Grid */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center"
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
            ))}
          </div>

          {/* Homepage Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-8 border-t border-slate-200 flex items-center justify-between gap-4">
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
          {renderSlotsForPlacement('below_pagination')}
          {renderSlotsForPlacement('before_community')}
          {renderSharedBottomSlot()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">
      {renderSlotsForPlacement('below_navigation')}

      {/* 1. Fully Editable Hero Section (Placed Above Featured Post Section) */}
      {heroConfig && heroConfig.enabled && (
        <HeroSection config={heroConfig} onNavigate={onNavigate} />
      )}
      {renderSlotsForPlacement('below_hero')}

      {sortedSections.map((section) => {
        if (!section.enabled) return null;

        switch (section.type) {
          case 'hero':
            // If the customizable HeroSection is active above, skip the legacy hero section to avoid duplicate heroes
            if (heroConfig && heroConfig.enabled) return null;
            if (!heroPost) return null;
            return (
              <section key={section.id} className="relative pt-6">
                <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
                  {/* Background cover image with gradient overlay */}
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

          case 'category-showcase':
            return (
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
              </section>
            );

          case 'featured-grid':
            return (
              <React.Fragment key={section.id}>
                {renderSlotsForPlacement('before_articles')}
                <section className="space-y-6">
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
                  {featuredPosts.map((post) => (
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
            </React.Fragment>
          );

        case 'latest-posts':
          return (
            <React.Fragment key={section.id}>
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {section.title || 'Latest Dispatches & Insights'} {currentPageNum > 1 ? `(Page ${currentPageNum})` : ''}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs md:text-sm text-slate-500 mt-1">{section.subtitle}</p>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      Page {currentPageNum} of {totalPages}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center"
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
                  ))}
                </div>

                {/* Homepage Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-8 border-t border-slate-200 flex items-center justify-between gap-4">
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
                {renderSlotsForPlacement('below_pagination')}
              </section>
              {renderSlotsForPlacement('after_articles')}
            </React.Fragment>
          );

        case 'newsletter':
        case 'cta':
          return null;

        default:
          return null;
      }
    })}

    {renderSlotsForPlacement('before_community')}
    {renderSharedBottomSlot()}
  </div>
);
};
