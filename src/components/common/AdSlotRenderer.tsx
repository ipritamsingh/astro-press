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
      if (locRule && locRule.placements && locRule.placements.includes(placement)) {
        matchedPlacement = true;
        if (locRule.insertionInterval !== undefined) {
          matchingInterval = locRule.insertionInterval;
        }
        break;
      }
    }

    if (!matchedPlacement) return false;

    if ((placement === 'between_paragraphs' || placement === 'between_listing_items' || placement === 'between_post_cards') && paragraphIndex !== undefined) {
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

  return (
    <div className={`my-6 space-y-4 ${className}`}>
      {matchingAds.map((ad) => {
        if (isDemoMode || ad.provider === 'demo') {
          return (
            <div key={ad.id} className="w-full">
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
          return (
            <div key={ad.id} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                {ad.name} • Sponsored
              </div>
              <a href={ad.customImage.destinationUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full rounded-xl overflow-hidden">
                <img src={ad.customImage.imageUrl} alt={ad.customImage.altText || ad.name} className="w-full max-h-56 object-cover rounded-xl" loading="lazy" />
              </a>
            </div>
          );
        }

        if (ad.provider === 'third_party' && ad.adCode) {
          return (
            <div key={ad.id} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-2xs overflow-hidden">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">{ad.name} • Advertisement</div>
              <div className="overflow-x-auto text-xs text-slate-600 flex justify-center" dangerouslySetInnerHTML={{ __html: ad.adCode }} />
            </div>
          );
        }

        return (
          <div key={ad.id} className="w-full rounded-2xl overflow-hidden shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider px-1">
              {ad.name} • Google AdSense
            </div>
            <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[90px] overflow-x-auto" dangerouslySetInnerHTML={{ __html: ad.adCode }} />
          </div>
        );
      })}
    </div>
  );
};
