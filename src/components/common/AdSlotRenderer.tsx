import React from 'react';
import { SiteSettings, AdSlot } from '../../types/cms';

interface Props {
  placement: string;
  siteSettings?: SiteSettings;
  contentType?: 'homepage' | 'post' | 'page' | 'category' | 'author';
  paragraphIndex?: number;
}

export const AdSlotRenderer: React.FC<Props> = ({
  placement,
  siteSettings,
  contentType = 'post',
  paragraphIndex,
}) => {
  const adsSettings = siteSettings?.adsSettings;
  if (!adsSettings || !adsSettings.adsEnabled) return null;

  const matchingSlots = (adsSettings.slots || []).filter((slot) => {
    if (!slot.enabled) return false;
    if (slot.placement !== placement) return false;

    // Check paragraph index for in-article ad
    if (placement === 'between_paragraphs' && slot.contentParagraphIndex !== undefined) {
      if (slot.contentParagraphIndex !== paragraphIndex) return false;
    }

    // Targeting check
    const targeting = slot.targeting;
    if (contentType === 'homepage' && !targeting.showOnHomepage) return false;
    if (contentType === 'post' && !targeting.showOnPosts) return false;
    if (contentType === 'page' && !targeting.showOnPages) return false;
    if ((contentType === 'category' || contentType === 'author') && !targeting.showOnCategories) return false;

    return true;
  });

  if (matchingSlots.length === 0) return null;

  return (
    <div className="my-6 space-y-4">
      {matchingSlots.map((slot) => {
        if (slot.provider === 'custom_image' && slot.customImage) {
          return (
            <div
              key={slot.id}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-2xs overflow-hidden group"
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                {slot.name} • Advertisement
              </div>
              <a
                href={slot.customImage.destinationUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl overflow-hidden shadow-xs transition-transform duration-200 group-hover:scale-[1.005]"
              >
                <img
                  src={slot.customImage.imageUrl}
                  alt={slot.customImage.altText || slot.name}
                  className="w-full max-h-48 object-cover rounded-xl"
                />
              </a>
              {slot.customImage.title && (
                <span className="text-xs font-semibold text-slate-700 mt-2">{slot.customImage.title}</span>
              )}
            </div>
          );
        }

        if (slot.provider === 'third_party' && slot.thirdPartyHtml) {
          return (
            <div
              key={slot.id}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-2xs overflow-hidden"
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                {slot.name} • Sponsored
              </div>
              <div dangerouslySetInnerHTML={{ __html: slot.thirdPartyHtml }} />
            </div>
          );
        }

        // Default Google AdSense ad unit renderer
        return (
          <div
            key={slot.id}
            className="w-full bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-4 text-center shadow-2xs flex flex-col items-center justify-center min-h-[90px]"
          >
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider flex items-center gap-1.5">
              <span>{slot.name}</span>
              <span>•</span>
              <span className="font-mono text-blue-600">AdSense Unit: {slot.adUnitId || 'Auto'}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-xl py-4 px-2 text-slate-400 text-xs font-medium border border-slate-200/60">
              Advertisement ({slot.format}) — Publisher: {adsSettings.publisherId || 'Configured'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
