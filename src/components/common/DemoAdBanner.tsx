import React, { useState } from 'react';
import { DemoAdConfig, AdSlot } from '../../types/cms';
import { AlertCircle, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  config?: DemoAdConfig;
  slot?: AdSlot;
  format?: string;
  placement?: string;
  showSlotInfoBadge?: boolean;
  previewInteractive?: boolean;
  className?: string;
}

export const DEFAULT_DEMO_AD_CONFIG: DemoAdConfig = {
  enabled: true,
  publicTestingEnabled: false,
  template: 'saas',
  heading: 'Build & Deploy Edge Applications in Minutes',
  description: 'Experience sub-second TTFB, Git-native headless CMS, and zero server maintenance on Cloudflare Pages.',
  buttonText: 'Start Free Trial →',
  destinationUrl: 'https://astro-press.pages.dev',
  imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
  bgColor: '#0F172A',
  textColor: '#F8FAFC',
  accentColor: '#3B82F6',
  badgeText: 'DEMO AD — NOT A REAL AD',
  minHeight: 120,
};

export const DemoAdBanner: React.FC<Props> = ({
  config,
  slot,
  format: propFormat,
  placement,
  showSlotInfoBadge = false,
  previewInteractive = true,
  className = '',
}) => {
  const [clickedFeedback, setClickedFeedback] = useState(false);
  const activeConfig: DemoAdConfig = {
    ...DEFAULT_DEMO_AD_CONFIG,
    ...(config || {}),
  };

  const adFormat = propFormat || slot?.format || 'responsive';
  const badgeLabel = activeConfig.badgeText || 'DEMO AD — NOT A REAL AD';

  const handleClick = (e: React.MouseEvent) => {
    if (previewInteractive) {
      e.preventDefault();
      setClickedFeedback(true);
      setTimeout(() => setClickedFeedback(false), 2500);
    }
  };

  // Safe sanitized destination URL
  const rawUrl = (activeConfig.destinationUrl || '').trim();
  const isSafeUrl = rawUrl.startsWith('https://') || rawUrl.startsWith('http://') || rawUrl.startsWith('/');
  const safeDestination = isSafeUrl ? rawUrl : '#demo-ad';

  // Responsive layout classes by format
  const getFormatClasses = () => {
    switch (adFormat) {
      case 'leaderboard':
        return 'max-w-4xl mx-auto w-full min-h-[90px] py-3 px-5 sm:flex-row sm:items-center sm:justify-between';
      case 'rectangle':
        return 'max-w-md mx-auto w-full min-h-[250px] p-5 flex-col justify-between';
      case 'skyscraper':
        return 'max-w-[180px] mx-auto w-full min-h-[480px] p-4 flex-col justify-between text-center';
      case 'in-article':
        return 'max-w-3xl mx-auto w-full min-h-[110px] p-4 sm:flex-row sm:items-center sm:justify-between';
      default:
        return 'w-full min-h-[110px] p-4 sm:flex-row sm:items-center sm:justify-between';
    }
  };

  return (
    <div
      style={{
        backgroundColor: activeConfig.bgColor || '#0F172A',
        color: activeConfig.textColor || '#F8FAFC',
        minHeight: activeConfig.minHeight ? `${activeConfig.minHeight}px` : undefined,
      }}
      className={`relative rounded-2xl border border-slate-700/60 shadow-md overflow-hidden flex flex-col gap-4 transition-all duration-200 group ${getFormatClasses()} ${className}`}
    >
      {/* Top Banner Bar: Mandatory DEMO badge */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 flex-wrap">
        <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-2xs select-none">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{badgeLabel}</span>
        </span>

        {showSlotInfoBadge && (slot || placement) && (
          <span className="bg-slate-800/90 text-blue-300 border border-slate-600/70 font-mono text-[9px] px-2 py-0.5 rounded tracking-wide shadow-2xs select-none">
            {slot?.name || 'Slot'} • {placement || slot?.placement || 'Placement'}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex items-center gap-3.5 pt-6 sm:pt-0 flex-1">
        {activeConfig.imageUrl && adFormat !== 'skyscraper' && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-800">
            <img
              src={activeConfig.imageUrl}
              alt="Demo Sponsor"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
              Sponsored Showcase
            </span>
          </div>
          <h4 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-2">
            {activeConfig.heading}
          </h4>
          <p className="text-xs opacity-80 leading-relaxed line-clamp-2">
            {activeConfig.description}
          </p>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
        <a
          href={safeDestination}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer nofollow"
          style={{ backgroundColor: activeConfig.accentColor || '#3B82F6' }}
          className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{activeConfig.buttonText || 'Learn More'}</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {clickedFeedback && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center text-center p-4 z-20 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Demo Ad Simulated Click (Target: {safeDestination})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
