import React, { useState } from 'react';
import { Author, Post } from '../../types/cms';
import { PostCardImage } from '../common/PostCardImage';
import {
  ArrowLeft,
  Clock,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface Props {
  author: Author;
  posts: Post[];
  onBack: () => void;
  onSelectPost: (post: Post) => void;
  siteUrl?: string;
}

export const AuthorProfileView: React.FC<Props> = ({
  author,
  posts,
  onBack,
  onSelectPost,
  siteUrl = 'https://astro-press.pages.dev',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Filter only published articles authored by this author
  const authorPosts = posts
    .filter((p) => {
      if (p.status !== 'published') return false;
      const postAuthor = (p.author || '').trim().toLowerCase();
      const aName = (author.name || '').trim().toLowerCase();
      const aSlug = (author.slug || '').trim().toLowerCase();
      return postAuthor === aName || postAuthor === aSlug;
    })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const totalPages = Math.ceil(authorPosts.length / postsPerPage) || 1;
  const paginatedPosts = authorPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Social Links helper with URL sanitization
  const getSafeUrl = (url?: string) => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) return undefined;
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const websiteUrl = getSafeUrl(author.website);
  const twitterUrl = author.twitter
    ? getSafeUrl(
        author.twitter.startsWith('http')
          ? author.twitter
          : `https://x.com/${author.twitter.replace(/^@/, '')}`
      )
    : undefined;
  const githubUrl = author.github
    ? getSafeUrl(
        author.github.startsWith('http')
          ? author.github
          : `https://github.com/${author.github.replace(/^@/, '')}`
      )
    : undefined;
  const linkedinUrl = getSafeUrl(author.linkedin);
  const facebookUrl = getSafeUrl(author.facebook);
  const instagramUrl = getSafeUrl(author.instagram);
  const youtubeUrl = getSafeUrl(author.youtube);

  // Person JSON-LD Schema for Google SEO
  const canonicalOrigin = (siteUrl || '').replace(/\/+$/, '');
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: `${canonicalOrigin}/author/${author.slug}/`,
    image: author.avatar,
    jobTitle: author.designation || author.role,
    description: author.bio,
    sameAs: [
      websiteUrl,
      twitterUrl,
      githubUrl,
      linkedinUrl,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
    ].filter(Boolean),
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 font-sans">
      {/* Schema.org Person Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {/* Navigation Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      {/* Author Header Card */}
      <header className="mb-12 p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={
              author.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
            }
            alt={author.name}
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-blue-50 shadow-md shrink-0"
          />

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-custom">
                  {author.name}
                </h1>
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60">
                  {author.designation || author.role || 'Staff Author'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">@{author.slug}</p>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {author.bio ||
                'Publishing architect, technical writer, and contributor to the AstroPress publication.'}
            </p>

            {/* Author Social Media and Website Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 text-slate-700 hover:text-blue-600 text-xs font-semibold shadow-2xs transition-all"
                  aria-label={`${author.name}'s Website`}
                >
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  <span>Website</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}

              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 text-slate-700 hover:text-sky-600 text-xs font-semibold shadow-2xs transition-all"
                  aria-label={`${author.name} on X (Twitter)`}
                >
                  <Twitter className="h-3.5 w-3.5 text-sky-500" />
                  <span>Twitter / X</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}

              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all"
                  aria-label={`${author.name} on GitHub`}
                >
                  <Github className="h-3.5 w-3.5 text-slate-800" />
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}

              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 text-slate-700 hover:text-blue-700 text-xs font-semibold shadow-2xs transition-all"
                  aria-label={`${author.name} on LinkedIn`}
                >
                  <Linkedin className="h-3.5 w-3.5 text-blue-600" />
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}

              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-500 text-slate-700 hover:text-blue-800 text-xs font-semibold shadow-2xs transition-all"
                  aria-label={`${author.name} on Facebook`}
                >
                  <Facebook className="h-3.5 w-3.5 text-blue-600" />
                  <span>Facebook</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-pink-300 text-slate-700 hover:text-pink-600 text-xs font-semibold shadow-2xs transition-all"
                  aria-label={`${author.name} on Instagram`}
                >
                  <Instagram className="h-3.5 w-3.5 text-pink-500" />
                  <span>Instagram</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}

              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-red-300 text-slate-700 hover:text-red-600 text-xs font-semibold shadow-2xs transition-all"
                  aria-label={`${author.name} on YouTube`}
                >
                  <Youtube className="h-3.5 w-3.5 text-red-500" />
                  <span>YouTube</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}
            </div>

            {/* Total Articles Counter */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-500">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span>
                {authorPosts.length} published {authorPosts.length === 1 ? 'article' : 'articles'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Articles Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Articles by {author.name}</span>
        </h2>
        <span className="text-xs text-slate-400">
          Showing {paginatedPosts.length} of {authorPosts.length}
        </span>
      </div>

      {/* Articles Grid or Empty State */}
      {authorPosts.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No published articles yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Articles written by {author.name} will be published here soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="aspect-16/10 w-full rounded-xl overflow-hidden bg-slate-100 relative shrink-0">
                  <PostCardImage
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    fallbackCategory={post.category}
                  />
                  <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                    {post.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{(function(d) {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d).split('T')[0];
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return m[dt.getUTCMonth()] + ' ' + dt.getUTCDate() + ', ' + dt.getUTCFullYear();
    })(post.pubDate)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min read
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-light">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>Read Story</span>
                <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
