import React, { useEffect, useState } from 'react';
import { SiteSettings, CustomScriptEntry } from '../../types/cms';

interface Props {
  siteSettings?: SiteSettings;
}

export const FrontendScriptsManager: React.FC<Props> = ({ siteSettings }) => {
  const integrations = siteSettings?.integrationsSettings;
  const ads = siteSettings?.adsSettings;

  // Consent State
  const consentBannerEnabled = integrations?.consentBannerEnabled ?? false;
  const [consentStatus, setConsentStatus] = useState<'accepted' | 'declined' | 'pending'>(() => {
    if (typeof window === 'undefined') return 'pending';
    const saved = localStorage.getItem('astropress_cookie_consent');
    if (saved === 'accepted') return 'accepted';
    if (saved === 'declined') return 'declined';
    return 'pending';
  });

  const handleAcceptConsent = () => {
    localStorage.setItem('astropress_cookie_consent', 'accepted');
    setConsentStatus('accepted');
  };

  const handleDeclineConsent = () => {
    localStorage.setItem('astropress_cookie_consent', 'declined');
    setConsentStatus('declined');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // -------------------------------------------------------------------------
    // 1. Google Analytics 4 (GA4)
    // -------------------------------------------------------------------------
    const ga4Id = (integrations?.ga4MeasurementId || '').trim();
    const ga4Allowed =
      integrations?.ga4Enabled &&
      /^G-[A-Z0-9]+$/i.test(ga4Id) &&
      (!consentBannerEnabled || consentStatus === 'accepted');

    const existingGa4Script = document.getElementById('astropress-ga4-script');

    if (ga4Allowed) {
      if (!existingGa4Script) {
        // Tag script
        const s = document.createElement('script');
        s.id = 'astropress-ga4-script';
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
        document.head.appendChild(s);

        // Init inline script
        const initScript = document.createElement('script');
        initScript.id = 'astropress-ga4-init';
        initScript.text = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ga4Id.replace(/'/g, "\\'")}', {
            'anonymize_ip': ${integrations?.ga4AnonymizeIp !== false}
          });
        `;
        document.head.appendChild(initScript);
      }
    } else if (existingGa4Script) {
      existingGa4Script.remove();
      document.getElementById('astropress-ga4-init')?.remove();
    }

    // -------------------------------------------------------------------------
    // 2. Google Search Console (GSC Meta Verification)
    // -------------------------------------------------------------------------
    const gscCodeRaw = (integrations?.gscVerificationCode || '').trim();
    // Allow either token or full meta tag
    const gscToken = gscCodeRaw.replace(/^.*content=["']([^"']+)["'].*$/, '$1');
    const existingGscMeta = document.querySelector('meta[name="google-site-verification"]');

    if (integrations?.gscEnabled && gscToken) {
      if (!existingGscMeta) {
        const meta = document.createElement('meta');
        meta.name = 'google-site-verification';
        meta.content = gscToken;
        meta.setAttribute('data-astropress-gsc', 'true');
        document.head.appendChild(meta);
      } else if (existingGscMeta.getAttribute('content') !== gscToken) {
        existingGscMeta.setAttribute('content', gscToken);
      }
    } else if (existingGscMeta && existingGscMeta.hasAttribute('data-astropress-gsc')) {
      existingGscMeta.remove();
    }

    // -------------------------------------------------------------------------
    // 3. Meta Pixel
    // -------------------------------------------------------------------------
    const pixelId = (integrations?.metaPixelId || '').trim();
    const pixelAllowed =
      integrations?.metaPixelEnabled &&
      /^\d{10,25}$/.test(pixelId) &&
      (!consentBannerEnabled || consentStatus === 'accepted');

    const existingPixelScript = document.getElementById('astropress-meta-pixel');

    if (pixelAllowed) {
      if (!existingPixelScript) {
        const pScript = document.createElement('script');
        pScript.id = 'astropress-meta-pixel';
        pScript.text = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId.replace(/'/g, "\\'")}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(pScript);
      }
    } else if (existingPixelScript) {
      existingPixelScript.remove();
    }

    // -------------------------------------------------------------------------
    // 4. Google AdSense Global Loader
    // -------------------------------------------------------------------------
    const pubId = (integrations?.adsensePublisherId || ads?.publisherId || '').trim();
    const adsGlobalEnabled = (integrations?.adsenseEnabled || ads?.adsEnabled) && /^ca-pub-\d{10,25}$/i.test(pubId);

    const existingAdsenseScript = document.getElementById('adsbygoogle-script');
    if (adsGlobalEnabled) {
      if (!existingAdsenseScript) {
        const adScript = document.createElement('script');
        adScript.id = 'adsbygoogle-script';
        adScript.async = true;
        adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pubId)}`;
        adScript.crossOrigin = 'anonymous';
        document.head.appendChild(adScript);
      }
    } else if (!ads?.adsEnabled && existingAdsenseScript) {
      existingAdsenseScript.remove();
    }

    // -------------------------------------------------------------------------
    // 5. Custom Managed Scripts (head, body_start, body_end)
    // -------------------------------------------------------------------------
    const activeScripts = (integrations?.scripts || []).filter((s) => {
      if (!s.enabled || !s.content.trim()) return false;
      if (consentBannerEnabled && s.consentRequired && consentStatus !== 'accepted') {
        return false;
      }
      return true;
    });

    const activeScriptIds = new Set(activeScripts.map((s) => s.id));

    // Remove any previously inserted script tags that are now disabled or deleted
    const previouslyInserted = document.querySelectorAll('[data-astropress-script]');
    previouslyInserted.forEach((node) => {
      const scriptId = node.getAttribute('data-astropress-script');
      if (scriptId && !activeScriptIds.has(scriptId)) {
        node.remove();
      }
    });

    // Insert active scripts idempotently
    activeScripts.forEach((script) => {
      const selector = `[data-astropress-script="${script.id}"]`;
      if (document.querySelector(selector)) {
        return; // Already safely in DOM
      }

      try {
        const rawContent = script.content.trim();
        const container = document.createElement('div');
        container.setAttribute('data-astropress-script', script.id);
        container.setAttribute('data-astropress-placement', script.placement);
        container.style.display = 'none';

        // Check if rawContent is an HTML fragment with <script> tags or pure JS
        const isHtmlFragment = /<[a-z][\s\S]*>/i.test(rawContent);

        if (isHtmlFragment) {
          const temp = document.createElement('div');
          temp.innerHTML = rawContent;
          
          // Re-create scripts so the browser executes them safely
          Array.from(temp.querySelectorAll('script')).forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            newScript.text = oldScript.text;
            oldScript.parentNode?.replaceChild(newScript, oldScript);
          });

          while (temp.firstChild) {
            container.appendChild(temp.firstChild);
          }
        } else {
          // Plain JS content
          const jsElement = document.createElement('script');
          jsElement.text = rawContent;
          container.appendChild(jsElement);
        }

        // Place into document according to placement setting
        if (script.placement === 'head') {
          document.head.appendChild(container);
        } else if (script.placement === 'body_start') {
          if (document.body.firstChild) {
            document.body.insertBefore(container, document.body.firstChild);
          } else {
            document.body.appendChild(container);
          }
        } else {
          // body_end
          document.body.appendChild(container);
        }
      } catch (err) {
        console.error(`[AstroPress Scripts Manager] Failed to load script "${script.name}":`, err);
      }
    });
  }, [integrations, ads, consentStatus, consentBannerEnabled]);

  // If consent banner is disabled or visitor has already decided, render nothing
  if (!consentBannerEnabled || consentStatus !== 'pending') {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Privacy and cookie consent options"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 p-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans text-xs space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-white text-sm">Privacy & Analytics Preferences</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            This website uses privacy-respecting analytics and performance monitoring scripts to provide you with the best editorial reading experience.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
        <button
          type="button"
          onClick={handleDeclineConsent}
          className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={handleAcceptConsent}
          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs transition-colors cursor-pointer"
        >
          Accept All
        </button>
      </div>
    </div>
  );
};
