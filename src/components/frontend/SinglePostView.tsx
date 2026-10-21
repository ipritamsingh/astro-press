import React, { useState, useEffect, useRef } from 'react';
import { Post, Comment, Author, Category } from '../../types/cms';
import { GutenbergBlockRenderer, parseMarkdownToBlocks } from '../common/GutenbergBlockRenderer';
import { getPersistedMediaBlob } from '../../data/mediaStorage';
import {
  Clock,
  User,
  Calendar,
  Share2,
  Bookmark,
  MessageSquare,
  ArrowLeft,
  Edit3,
  Check,
  Send,
  Copy,
  ChevronRight,
  X,
  ExternalLink,
  Smartphone,
  Globe,
} from 'lucide-react';

interface Props {
  post: Post;
  allPosts: Post[];
  comments: Comment[];
  authors: Author[];
  onBack: () => void;
  onEditPost: (post: Post) => void;
  onSelectPost: (post: Post) => void;
  onAddComment: (comment: Comment) => void;
  onSelectAuthor?: (author: Author) => void;
  siteUrl?: string;
}

export const SinglePostView: React.FC<Props> = ({
  post,
  allPosts,
  comments,
  authors,
  onBack,
  onEditPost,
  onSelectPost,
  onAddComment,
  onSelectAuthor,
  siteUrl = 'https://astro-press.pages.dev',
}) => {
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  // Author resolution: match by exact name or slug, fallback to synthesised author or first author
  const postAuthor = authors.find(
    (a) =>
      a.name.toLowerCase() === (post.author || '').toLowerCase() ||
      a.slug.toLowerCase() === (post.author || '').toLowerCase()
  ) || (post.author ? {
    id: `auth-${post.author.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: post.author,
    slug: post.author.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    role: 'Author',
    designation: 'Staff Author',
    email: `${post.author.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@astropress.local`,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    bio: 'Software engineer and publishing architect specializing in Astro, headless CMS patterns, and edge deployment infrastructures.',
  } : authors[0]);

  const authorSlug = postAuthor?.slug || (post.author ? post.author.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');

  const postComments = comments.filter((c) => c.postId === post.id && c.status === 'approved');
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && (p.category === post.category || p.status === 'published'))
    .slice(0, 3);

  // Close share popover on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsShareOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target as Node)) {
        setIsShareOpen(false);
      }
    };

    if (isShareOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareOpen]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) return;

    const newComment: Comment = {
      id: 'comm-' + Date.now(),
      postId: post.id,
      postTitle: post.title,
      authorName: commentName,
      authorEmail: commentEmail || `${commentName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      authorAvatar: `https://images.unsplash.com/photo-${1535713875000 + (Date.now() % 500)}?auto=format&fit=crop&w=120&q=80`,
      content: commentText,
      date: new Date().toISOString(),
      status: 'approved',
    };

    onAddComment(newComment);
    setCommentSubmitted(true);
    setCommentText('');
    setCommentName('');
    setCommentEmail('');
    setTimeout(() => setCommentSubmitted(false), 4000);
  };

  // URL resolution for canonical sharing
  const canonicalOrigin = (siteUrl || '').replace(/\/+$/, '');
  const cleanPostSlug = (post.slug || '').replace(/^\/+|\/+$/g, '');
  const [articleUrl, setArticleUrl] = React.useState<string>(() => `${canonicalOrigin}/${cleanPostSlug}/`);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.href) {
      setArticleUrl(window.location.href.split('?')[0].split('#')[0]);
    }
  }, []);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(articleUrl);
      } else {
        // Fallback for environments where Clipboard API is restricted
        const textarea = document.createElement('textarea');
        textarea.value = articleUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setCopyError(false);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: articleUrl,
        });
        setIsShareOpen(false);
      } catch (err: any) {
        // Ignore user cancellation (AbortError)
        if (err.name !== 'AbortError') {
          console.warn('Native share error:', err);
        }
      }
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    if (postAuthor && onSelectAuthor) {
      e.preventDefault();
      onSelectAuthor(postAuthor);
    }
  };

  // Automatic FAQPage JSON-LD Schema Generator
  const activeBlocks = (post.blocks && post.blocks.length > 0) ? post.blocks : parseMarkdownToBlocks(post.body || '');
  const faqBlocks = activeBlocks.filter(
    (b) => b.type === 'accordion' && b.settings?.accordionItems && b.settings.accordionItems.length > 0
  );
  const faqEntities: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }> = [];

  for (const block of faqBlocks) {
    for (const item of block.settings.accordionItems || []) {
      const q = item.title?.trim();
      const a = item.content?.trim();
      if (q && a) {
        faqEntities.push({
          '@type': 'Question',
          name: q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: a,
          },
        });
      }
    }
  }

  const faqJsonLd =
    faqEntities.length > 0
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqEntities,
        })
      : null;

  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.pubDate,
    dateModified: post.updatedDate || post.pubDate,
    author: {
      '@type': 'Person',
      name: post.author,
      url: authorSlug ? `${canonicalOrigin}/author/${authorSlug}/` : undefined,
    },
    image: post.featuredImage || undefined,
  });

  const [featuredImgSrc, setFeaturedImgSrc] = useState<string>(post.featuredImage || '');

  useEffect(() => {
    setFeaturedImgSrc(post.featuredImage || '');
    if (post.featuredImage && (post.featuredImage.startsWith('/uploads/') || post.featuredImage.startsWith('uploads/'))) {
      getPersistedMediaBlob(post.featuredImage).then((blob) => {
        if (blob) setFeaturedImgSrc(blob);
      }).catch(() => {});
    }
  }, [post.featuredImage]);

  // Social sharing endpoints with safe URL encoding
  const shareTitleEncoded = encodeURIComponent(post.title);
  const shareUrlEncoded = encodeURIComponent(articleUrl);
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${post.title} — ${articleUrl}`)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${shareTitleEncoded}&url=${shareUrlEncoded}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`;
  const telegramShareUrl = `https://t.me/share/url?url=${shareUrlEncoded}&text=${shareTitleEncoded}`;
  const redditShareUrl = `https://www.reddit.com/submit?url=${shareUrlEncoded}&title=${shareTitleEncoded}`;
  const emailShareUrl = `mailto:?subject=${shareTitleEncoded}&body=${encodeURIComponent(`Check out this article on AstroPress: "${post.title}"\n\n${articleUrl}`)}`;

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 font-sans">
      {/* Schema.org Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd }}
      />

      {/* Schema.org FAQPage Structured Data (Automatically generated when FAQ items present) */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqJsonLd }}
        />
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
        <button onClick={onBack} className="hover:text-blue-600 transition-colors cursor-pointer">
          Home
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-blue-600">{post.category}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-400 truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Post Article Header */}
      <header className="space-y-4 pb-8 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60">
            {post.category}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight font-serif-custom">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-light">
          {post.excerpt}
        </p>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {/* Clickable Author Avatar */}
            {authorSlug ? (
              <a
                href={`/author/${authorSlug}/`}
                onClick={handleAuthorClick}
                className="shrink-0 group focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-full transition-transform hover:scale-105"
                aria-label={`View articles by ${postAuthor?.name || post.author}`}
              >
                <img
                  src={
                    postAuthor?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={postAuthor?.name || post.author}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-400 shadow-2xs transition-all"
                />
              </a>
            ) : (
              <img
                src={
                  postAuthor?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt={post.author}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs"
              />
            )}

            <div>
              {/* Clickable Author Name */}
              {authorSlug ? (
                <a
                  href={`/author/${authorSlug}/`}
                  onClick={handleAuthorClick}
                  className="block text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xs"
                  aria-label={`View profile of ${postAuthor?.name || post.author}`}
                >
                  {postAuthor?.name || post.author}
                </a>
              ) : (
                <span className="block text-sm font-bold text-slate-900">{post.author}</span>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  {(function(d) {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d).split('T')[0];
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return m[dt.getUTCMonth()] + ' ' + dt.getUTCDate() + ', ' + dt.getUTCFullYear();
    })(post.pubDate)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min read
                </span>
              </div>
            </div>
          </div>

          {/* Social Share Menu Button & Popover */}
          <div className="relative" ref={shareDropdownRef}>
            <button
              onClick={() => setIsShareOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isShareOpen}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              title="Share Article"
            >
              <Share2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Share</span>
            </button>

            {/* Share Popover Menu */}
            {isShareOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-3 z-40 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                  <span className="text-xs font-bold text-slate-900">Share this article</span>
                  <button
                    onClick={() => setIsShareOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    aria-label="Close share dialog"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* WhatsApp */}
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.18-.544-1.898-.787-3.125-2.732-3.218-2.859-.095-.126-.774-1.03-.774-1.964s.484-1.393.656-1.583c.172-.191.375-.238.5-.238.125 0 .25.002.359.007.116.006.27-.044.423.324.156.375.534 1.303.58 1.398.047.095.078.206.016.333-.063.127-.094.206-.188.317-.094.111-.197.247-.282.333-.094.095-.192.198-.083.385.109.188.486.802 1.042 1.297.717.639 1.321.836 1.509.93.188.095.297.079.406-.047.11-.127.469-.546.594-.735.125-.19.25-.158.422-.095.172.063 1.094.516 1.281.609.188.094.313.141.359.22.047.079.047.453-.097.858z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={facebookShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-blue-600 shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 fill-slate-800 shrink-0" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Twitter / X</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={linkedinShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    className="flex items-center gap-2 p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-sky-700 shrink-0" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m1.4 9.74v-8.37H5.06v8.37z" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  {/* Copy Link Button */}
                  <button
                    onClick={handleCopyLink}
                    role="menuitem"
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {copiedLink ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Article Link'}</span>
                    </div>
                    {copiedLink && (
                      <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                    )}
                  </button>

                  {/* Native Device Share (when supported) */}
                  {typeof navigator !== 'undefined' && !!navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      role="menuitem"
                      className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                      <span>More Share Options...</span>
                    </button>
                  )}
                </div>

                {copyError && (
                  <p className="text-[11px] text-rose-500 px-1 font-medium">
                    Could not copy link to clipboard automatically.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      {post.featuredImage && (
        <div className="my-8 rounded-2xl overflow-hidden bg-slate-100 shadow-md border border-slate-200">
          <img
            src={featuredImgSrc || post.featuredImage}
            alt={post.title}
            className="w-full h-auto object-cover max-h-[500px]"
            onError={async () => {
              if (post.featuredImage) {
                const fallback = await getPersistedMediaBlob(post.featuredImage);
                if (fallback) setFeaturedImgSrc(fallback);
              }
            }}
          />
        </div>
      )}

      {/* Body Content & Rendered Gutenberg Blocks */}
      <div className="py-6">
        <GutenbergBlockRenderer blocks={post.blocks} rawMarkdown={post.body} />
      </div>

      {/* Tags Section */}
      {post.tags && post.tags.length > 0 && (
        <div className="pt-6 pb-8 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filed Under:</span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Author Bio Box */}
      <div className="my-8 p-6 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {authorSlug ? (
          <a
            href={`/author/${authorSlug}/`}
            onClick={handleAuthorClick}
            className="group shrink-0 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-full transition-transform hover:scale-105"
            aria-label={`View profile of ${postAuthor?.name || post.author}`}
          >
            <img
              src={
                postAuthor?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
              alt={postAuthor?.name || post.author}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500/60 shadow-xs transition-all"
            />
          </a>
        ) : (
          <img
            src={
              postAuthor?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            }
            alt={post.author}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs shrink-0"
          />
        )}

        <div className="text-center sm:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {authorSlug ? (
              <a
                href={`/author/${authorSlug}/`}
                onClick={handleAuthorClick}
                className="font-bold text-slate-900 text-base hover:text-blue-600 hover:underline transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xs"
              >
                {postAuthor?.name || post.author}
              </a>
            ) : (
              <h4 className="font-bold text-slate-900 text-base">{post.author}</h4>
            )}

            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {postAuthor?.designation || postAuthor?.role || 'Staff Architect'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {postAuthor?.bio ||
              'Software engineer and publishing architect specializing in Astro, headless CMS patterns, and edge deployment infrastructures.'}
          </p>

          {/* Author Profile CTA Link */}
          {authorSlug && (
            <div className="pt-1.5">
              <a
                href={`/author/${authorSlug}/`}
                onClick={handleAuthorClick}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
              >
                <span>View all articles by {postAuthor?.name || post.author}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Comments Moderation / Interaction Section */}
      <section className="my-12 pt-8 border-t border-slate-200 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">
              Discussion ({postComments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Real-time CMS moderation</span>
        </div>

        {/* Existing Comments List */}
        <div className="space-y-4">
          {postComments.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
              No comments yet on this article. Be the first to start the conversation below!
            </p>
          ) : (
            postComments.map((comm) => (
              <div
                key={comm.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={comm.authorAvatar}
                      alt={comm.authorName}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{comm.authorName}</span>
                      <span className="text-[11px] text-slate-400">
                        {(function(d) {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d).split('T')[0];
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return m[dt.getUTCMonth()] + ' ' + dt.getUTCDate() + ', ' + dt.getUTCFullYear();
    })(comm.date)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/50">
                    Approved
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed pl-12">{comm.content}</p>

                {/* Nested Replies */}
                {comm.replies && comm.replies.length > 0 && (
                  <div className="ml-12 mt-3 space-y-2 pt-3 border-t border-slate-100">
                    {comm.replies.map((rep) => (
                      <div key={rep.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-blue-600 block mb-0.5">{rep.authorName}</span>
                        <p className="text-slate-600">{rep.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Leave a Comment Form */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">Leave a Thoughtful Reply</h4>
          {commentSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Thank you! Your comment has been posted and stored in the CMS.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Your Name *"
                  className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  placeholder="Email Address (optional)"
                  className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                />
              </div>
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your constructive thoughts..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post Comment</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="my-12 pt-8 border-t border-slate-200 space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Recommended Reading</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectPost(rel)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-xs transition-all space-y-2"
              >
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  {rel.category}
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {rel.title}
                </h4>
                <span className="text-[11px] text-slate-400 block">{rel.readingTime} min read</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
