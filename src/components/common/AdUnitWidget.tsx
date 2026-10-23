import React, { useEffect } from 'react';

export interface AdUnitWidgetProps {
  adsEnabled: boolean;
  publisherId: string;
  adUnitId: string;
  slotName: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  deviceVisibility?: 'all' | 'desktop' | 'mobile';
  isPreview?: boolean;
  className?: string;
}

export const AdUnitWidget: React.FC<AdUnitWidgetProps> = ({
  adsEnabled,
  publisherId,
  adUnitId,
  slotName,
  format = 'auto',
  deviceVisibility = 'all',
  isPreview = false,
  className = '',
}) => {
  useEffect(() => {
    if (!adsEnabled || !publisherId || isPreview) return;
    try {
      if (typeof window !== 'undefined') {
        if (!document.getElementById('adsbygoogle-script')) {
          const script = document.createElement('script');
          script.id = 'adsbygoogle-script';
          script.async = true;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }

        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [adsEnabled, publisherId, adUnitId, isPreview]);

  let visibilityClass = '';
  if (deviceVisibility === 'desktop') {
    visibilityClass = 'hidden md:block';
  } else if (deviceVisibility === 'mobile') {
    visibilityClass = 'block md:hidden';
  }

  if (!adsEnabled || !publisherId) {
    if (isPreview) {
      return (
        <div className={`my-4 p-4 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl text-center text-amber-800 text-xs ${visibilityClass} ${className}`}>
          <div className="font-bold flex items-center justify-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            AdSense Preview: {slotName}
          </div>
          <div className="text-amber-700/80">
            {publisherId ? `Ad Unit ID: ${adUnitId || 'Not set'}` : 'Configure Publisher ID in Ads & Monetization'} (Format: {format}, Device: {deviceVisibility})
          </div>
        </div>
      );
    }
    return null;
  }

  if (!adUnitId && !isPreview) {
    return null;
  }

  return (
    <div className={`my-6 text-center overflow-hidden ${visibilityClass} ${className}`} aria-label={`Advertisement: ${slotName}`}>
      {isPreview && (
        <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 bg-slate-100 py-0.5 rounded">
          Advertisement — {slotName} ({format})
        </div>
      )}
      {isPreview ? (
        <div className="p-6 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 text-xs flex flex-col items-center justify-center gap-1">
          <span className="font-semibold">Google AdSense Unit ({slotName})</span>
          <span>Publisher: {publisherId} | Unit ID: {adUnitId}</span>
          <span className="text-[10px] text-slate-400">Live AdSense ads will render here in production.</span>
        </div>
      ) : (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={publisherId}
          data-ad-slot={adUnitId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};
