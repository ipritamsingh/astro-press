import React from 'react';
import { SiteSettings, AdConfiguration, AdDisplayLocation } from '../../types/cms';
import { DemoAdBanner } from './DemoAdBanner';

interface Props {
  placement: string;
  siteSettings?: SiteSettings;
  contentType: AdDisplayLocation | string;
  paragraphIndex?: number;
  currentSlug?: string;
  sectionId?: string;
  className?: string;
}

const PLACEMENT_ALIASES: Record<string, string[]> = {
  homepage_above_hero: ['before_hero', 'homepage_above_hero'],
  before_hero: ['homepage_above_hero', 'before_hero'],
  homepage_below_hero: ['after_hero', 'homepage_below_hero'],
  after_hero: ['homepage_below_hero', 'after_hero'],
  homepage_between_post_cards: ['between_post_cards', 'homepage_between_post_cards'],
  between_post_cards: ['homepage_between_post_cards', 'between_post_cards'],
  before_intro: ['before_introduction', 'before_intro'],
  before_introduction: ['before_intro', 'before_introduction'],
  after_intro: ['after_introduction', 'after_intro'],
  after_introduction: ['after_intro', 'after_introduction'],
  between_listing_items: ['between_archive_items', 'between_listing_items'],
  between_archive_items: ['between_listing_items', 'between_archive_items'],
  before_page_title: ['before_post_title', 'before_page_title'],
  after_page_content: ['after_content', 'after_page_content'],
  between_paragraphs: ['between_paragraphs', 'between_paragraph', 'in_article', 'between_blocks'],
  between_paragraph: ['between_paragraphs', 'between_paragraph', 'in_article', 'between_blocks'],
};

const getDeviceVisibilityClass = (vis?: string): string => {
  if (vis === 'desktop_only' || vis === 'desktop') return 'hidden md:block';
  if (vis === 'mobile_only' || vis === 'mobile') return 'md:hidden';
  return '';
};

/**
 * Validates URLs for custom ad links and images to prevent dangerous pseudo-protocols like javascript:
 */
const sanitizeAdUrl = (url?: string): string => {
  if (!url) return '#';
  const trimmed = url.trim();
  // Allow safe web protocols and relative paths
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:')
  ) {
    return trimmed;
  }
  // Allow safe inline image data URLs for custom image ads
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  // Block any dangerous scheme (e.g. javascript:, vbscript:, data:text/html)
  return '#';
};

/**
 * Sanitizes ad HTML and script contents to prevent cross-site scripting (XSS),
 * session hijacking, token theft, and unauthorized DOM manipulation,
 * while safely preserving legitimate Google AdSense, prebid, and trusted vendor tags.
 */
const sanitizeAdCode = (code?: string, provider: 'adsense' | 'third_party' = 'adsense'): string => {
  if (!code) return '';

  let sanitized = code;

  // 1. Strip dangerous pseudo-protocols like javascript: or vbscript: in attributes
  sanitized = sanitized.replace(/(href|src|action)\s*=\s*(['"]?)\s*(javascript|vbscript):/gi, '$1=$2#');

  // 2. Prevent credential & storage exfiltration (document.cookie, sessionStorage, localStorage, auth tokens)
  sanitized = sanitized
    .replace(/\bdocument\.cookie\b/gi, '""')
    .replace(/\b(window\.)?localStorage\b/gi, 'undefined')
    .replace(/\b(window\.)?sessionStorage\b/gi, 'undefined')
    .replace(/\b(window\.)?indexedDB\b/gi, 'undefined');

  // 3. For iframes in ad code, enforce sandbox boundaries if not already present
  sanitized = sanitized.replace(/<iframe\b([^>]*?)>/gi, (match, attrs) => {
    if (!/sandbox\s*=/i.test(attrs)) {
      return `<iframe sandbox="allow-scripts allow-same-origin allow-popups allow-forms" loading="lazy" ${attrs}>`;
    }
    return match;
  });

  // 4. For Google AdSense and third-party ad blocks, neutralize dangerous inline handlers on standard elements
  if (provider === 'adsense') {
    sanitized = sanitized.replace(/\bon(load|error|click|mouseover|focus|submit)\s*=/gi, 'data-blocked-handler=');
  } else {
    sanitized = sanitized.replace(/<(img|svg|body|input|form|a)\b([^>]*?)\bon\w+\s*=/gi, '<$1 $2 data-blocked-handler=');
  }

  return sanitized;
};

export const AdSlotRenderer: React.FC<Props> = ({
  placement,
  siteSettings,
  contentType,
  paragraphIndex,
  currentSlug,
  sectionId,
  className = '',
}) => {
  const adsSettings = siteSettings?.adsSettings;
  if (!adsSettings || adsSettings.adsEnabled === false) return null;

  const allAds: AdConfiguration[] = adsSettings.ads || [];
  const isDemoMode = Boolean(adsSettings.demoModeEnabled);

  // Normalize contentType
  const normalizeType = (t: string): AdDisplayLocation[] => {
    switch (t) {
      case 'post':
      case 'posts':
        return ['posts', 'post'];
      case 'page':
      case 'pages':
        return ['pages', 'page'];
      case 'category':
      case 'archives':
        return ['archives', 'category'];
      case 'homepage':
        return ['homepage'];
      case 'sidebar':
        return ['sidebar'];
      case 'footer':
        return ['footer'];
      default:
        return [t as AdDisplayLocation];
    }
  };

  const targetTypes = normalizeType(contentType);
  const aliasList = PLACEMENT_ALIASES[placement] || [placement];

  // Filter matching ads
  const matchingAds = allAds.filter((ad) => {
    if (!ad.enabled) return false;
    const matchesLoc = (ad.displayLocations || []).some((l) => targetTypes.includes(l));
    if (!matchesLoc) return false;

    // Check placement rules across matching location groups
    let matchedPlacement = false;
    let matchingInterval = 2;

    for (const loc of targetTypes) {
      const locRule = ad.placementRules?.[loc];
      const locPlacements = locRule?.placements || [];
      if (locPlacements.some((p) => p === placement || aliasList.includes(p))) {
        matchedPlacement = true;
        if (locRule?.insertionInterval !== undefined) {
          matchingInterval = locRule.insertionInterval;
        }
        break;
      }
    }

    // Also fallback to top-level ad.placements if defined
    if (!matchedPlacement && ad.placements && Array.isArray(ad.placements)) {
      if (ad.placements.some((p) => p === placement || aliasList.includes(p))) {
        matchedPlacement = true;
      }
    }

    if (!matchedPlacement) return false;

    if (
      (placement === 'between_paragraphs' ||
        placement === 'between_listing_items' ||
        placement === 'between_post_cards' ||
        placement === 'homepage_between_post_cards') &&
      paragraphIndex !== undefined
    ) {
      if (paragraphIndex % matchingInterval !== 0) {
        return false;
      }
    }

    if (currentSlug) {
      const cleanSlug = currentSlug.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (ad.excludedSlugs && ad.excludedSlugs.length > 0) {
        if (ad.excludedSlugs.some((ex) => ex.replace(/^\/+|\/+$/g, '').toLowerCase() === cleanSlug)) {
          return false;
        }
      }
      if (ad.includedSlugs && ad.includedSlugs.length > 0) {
        if (!ad.includedSlugs.some((inc) => inc.replace(/^\/+|\/+$/g, '').toLowerCase() === cleanSlug)) {
          return false;
        }
      }
    }

    return true;
  });

  if (matchingAds.length === 0) return null;

  // Deduplicate ads by ID
  const uniqueMatchingAds = Array.from(new Map(matchingAds.map((ad) => [ad.id, ad])).values());

  return (
    <div className={`my-6 space-y-4 ${className}`}>
      {uniqueMatchingAds.map((ad) => {
        const visClass = getDeviceVisibilityClass(ad.deviceVisibility);

        if (isDemoMode || ad.provider === 'demo') {
          return (
            <div key={ad.id} className={`w-full ${visClass}`}>
              <DemoAdBanner
                slot={{
                  id: ad.id,
                  name: ad.name,
                  provider: ad.provider,
                  adUnitId: ad.id,
                  format: 'responsive',
                  placement,
                  enabled: ad.enabled,
                  deviceVisibility: ad.deviceVisibility as any,
                  order: 1,
                  targeting: { showOnHomepage: true, showOnPosts: true, showOnPages: true, showOnCategories: true, showOnAuthors: true },
                }}
                showSlotInfoBadge={true}
                previewInteractive={true}
              />
            </div>
          );
        }

        if (ad.provider === 'custom_image' && ad.customImage) {
          const safeDestUrl = sanitizeAdUrl(ad.customImage.destinationUrl);
          const safeImgUrl = sanitizeAdUrl(ad.customImage.imageUrl);

          return (
            <div key={ad.id} className={`w-full ${visClass} bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-2xs`}>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                {ad.name} • Sponsored
              </div>
              <a href={safeDestUrl} target="_blank" rel="noopener noreferrer nofollow" className="block w-full rounded-xl overflow-hidden">
                <img src={safeImgUrl} alt={ad.customImage.altText || ad.name} className="w-full max-h-56 object-cover rounded-xl" loading="lazy" />
              </a>
            </div>
          );
        }

        if (ad.provider === 'third_party' && ad.adCode) {
          const safeThirdPartyHtml = sanitizeAdCode(ad.adCode, 'third_party');
          return (
            <div key={ad.id} className={`w-full ${visClass} bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-2xs overflow-hidden`}>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">{ad.name} • Advertisement</div>
              <div className="overflow-x-auto text-xs text-slate-600 flex justify-center" dangerouslySetInnerHTML={{ __html: safeThirdPartyHtml }} />
            </div>
          );
        }

        const safeAdSenseHtml = sanitizeAdCode(ad.adCode, 'adsense');
        return (
          <div key={ad.id} className={`w-full ${visClass} rounded-2xl overflow-hidden shadow-2xs`}>
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider px-1">
              {ad.name} • Google AdSense
            </div>
            <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[90px] overflow-x-auto" dangerouslySetInnerHTML={{ __html: safeAdSenseHtml }} />
          </div>
        );
      })}
    </div>
  );
};
