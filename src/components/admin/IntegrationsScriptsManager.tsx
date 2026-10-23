import React, { useState } from 'react';
import {
  SiteSettings,
  IntegrationsSettings,
  CustomScriptEntry,
  ScriptPlacement,
  ScriptCategory,
  AdSenseSettings,
} from '../../types/cms';
import {
  Code,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Eye,
  Sliders,
  Globe,
  Tag,
  ArrowUp,
  ArrowDown,
  X,
  Lock,
  Layers,
  Sparkles,
  BarChart3,
  Search,
  Share2,
  DollarSign,
  Info,
} from 'lucide-react';

interface Props {
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  onNavigateToAds?: () => void;
  currentUsername?: string;
}

export const IntegrationsScriptsManager: React.FC<Props> = ({
  siteSettings,
  onUpdateSiteSettings,
  onNavigateToAds,
  currentUsername = 'Administrator',
}) => {
  const existingIntegrations = siteSettings.integrationsSettings;
  const existingAds = siteSettings.adsSettings;

  // Global Integration State
  const [ga4Enabled, setGa4Enabled] = useState(existingIntegrations?.ga4Enabled ?? false);
  const [ga4MeasurementId, setGa4MeasurementId] = useState(
    existingIntegrations?.ga4MeasurementId || ''
  );
  const [ga4AnonymizeIp, setGa4AnonymizeIp] = useState(
    existingIntegrations?.ga4AnonymizeIp ?? true
  );

  const [gscEnabled, setGscEnabled] = useState(existingIntegrations?.gscEnabled ?? false);
  const [gscVerificationCode, setGscVerificationCode] = useState(
    existingIntegrations?.gscVerificationCode || ''
  );

  const [metaPixelEnabled, setMetaPixelEnabled] = useState(
    existingIntegrations?.metaPixelEnabled ?? false
  );
  const [metaPixelId, setMetaPixelId] = useState(existingIntegrations?.metaPixelId || '');

  // AdSense global loader (synced with adsSettings)
  const [adsenseEnabled, setAdsenseEnabled] = useState(
    existingIntegrations?.adsenseEnabled ?? existingAds?.adsEnabled ?? false
  );
  const [adsensePublisherId, setAdsensePublisherId] = useState(
    existingIntegrations?.adsensePublisherId || existingAds?.publisherId || ''
  );
  const [adsenseAutoAds, setAdsenseAutoAds] = useState(
    existingIntegrations?.adsenseAutoAds ?? false
  );

  const [consentBannerEnabled, setConsentBannerEnabled] = useState(
    existingIntegrations?.consentBannerEnabled ?? false
  );

  // Custom Scripts State
  const [scripts, setScripts] = useState<CustomScriptEntry[]>(
    existingIntegrations?.scripts ? [...existingIntegrations.scripts] : []
  );

  // Active Tab / View Mode
  const [activeTab, setActiveTab] = useState<'integrations' | 'scripts' | 'consent'>('integrations');

  // Deletion modal state
  const [scriptToDelete, setScriptToDelete] = useState<CustomScriptEntry | null>(null);

  // Editing state for new or existing script
  const [editingScript, setEditingScript] = useState<CustomScriptEntry | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Feedback notifications
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation helpers
  const isValidGa4 = (id: string) => !id || /^G-[A-Z0-9]+$/i.test(id.trim());
  const isValidPixel = (id: string) => !id || /^\d{10,25}$/.test(id.trim());
  const isValidPublisher = (id: string) => !id || /^ca-pub-\d{10,25}$/i.test(id.trim());

  // Save changes persistently
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (ga4Enabled && ga4MeasurementId.trim() && !isValidGa4(ga4MeasurementId)) {
      setErrorMessage(
        'Google Analytics 4 Measurement ID must follow standard format (e.g., G-XXXXXXXXXX).'
      );
      return;
    }
    if (metaPixelEnabled && metaPixelId.trim() && !isValidPixel(metaPixelId)) {
      setErrorMessage('Meta Pixel ID must contain 10-25 numeric digits.');
      return;
    }
    if (adsenseEnabled && adsensePublisherId.trim() && !isValidPublisher(adsensePublisherId)) {
      setErrorMessage(
        'Google AdSense Publisher ID must follow standard format (e.g., ca-pub-1234567890123456).'
      );
      return;
    }

    const updatedIntegrations: IntegrationsSettings = {
      ga4Enabled,
      ga4MeasurementId: ga4MeasurementId.trim(),
      ga4AnonymizeIp,
      gscEnabled,
      gscVerificationCode: gscVerificationCode.trim(),
      metaPixelEnabled,
      metaPixelId: metaPixelId.trim(),
      adsenseEnabled,
      adsensePublisherId: adsensePublisherId.trim(),
      adsenseAutoAds,
      consentBannerEnabled,
      scripts: scripts.map((s, idx) => ({ ...s, order: idx + 1 })),
    };

    // Synchronize Publisher ID with existing Ads & Monetization settings
    const updatedAds: AdSenseSettings | undefined = existingAds
      ? {
          ...existingAds,
          publisherId: adsensePublisherId.trim() || existingAds.publisherId,
          adsEnabled: adsenseEnabled || existingAds.adsEnabled,
        }
      : undefined;

    const updatedSiteSettings: SiteSettings = {
      ...siteSettings,
      integrationsSettings: updatedIntegrations,
      ...(updatedAds ? { adsSettings: updatedAds } : {}),
    };

    onUpdateSiteSettings(updatedSiteSettings);
    setSavedMessage('Integrations and Custom Scripts configuration saved successfully.');
    setTimeout(() => setSavedMessage(null), 3500);
  };

  // Add new script entry
  const handleAddNewScript = () => {
    const newEntry: CustomScriptEntry = {
      id: `script-${Date.now()}`,
      name: `Custom Script ${scripts.length + 1}`,
      category: 'analytics',
      placement: 'head',
      enabled: false,
      content: '',
      providerId: '',
      templateType: 'custom',
      consentRequired: false,
      description: '',
      order: scripts.length + 1,
      createdAt: new Date().toISOString(),
    };
    setEditingScript(newEntry);
    setIsCreatingNew(true);
  };

  // Save edited script entry
  const handleSaveEditedScript = () => {
    if (!editingScript) return;
    if (!editingScript.name.trim()) {
      setErrorMessage('Script name cannot be empty.');
      return;
    }

    // If using predefined template, generate safe embed snippet if empty
    let finalContent = editingScript.content.trim();
    if (editingScript.templateType === 'gtm' && editingScript.providerId?.trim()) {
      finalContent = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${editingScript.providerId.trim()}');</script>
<!-- End Google Tag Manager -->`;
    } else if (editingScript.templateType === 'clarity' && editingScript.providerId?.trim()) {
      finalContent = `<script type="text/javascript">
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${editingScript.providerId.trim()}");
</script>`;
    } else if (editingScript.templateType === 'plausible' && editingScript.providerId?.trim()) {
      finalContent = `<script defer data-domain="${editingScript.providerId.trim()}" src="https://plausible.io/js/script.js"></script>`;
    }

    const updatedEntry: CustomScriptEntry = {
      ...editingScript,
      content: finalContent,
      updatedAt: new Date().toISOString(),
    };

    let updatedList: CustomScriptEntry[];
    if (isCreatingNew) {
      updatedList = [...scripts, updatedEntry];
    } else {
      updatedList = scripts.map((s) => (s.id === updatedEntry.id ? updatedEntry : s));
    }

    setScripts(updatedList);
    setEditingScript(null);
    setIsCreatingNew(false);
    setErrorMessage(null);
  };

  // Reorder scripts
  const moveScript = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === scripts.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...scripts];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setScripts(reordered.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  // Confirm delete script
  const handleConfirmDelete = () => {
    if (!scriptToDelete) return;
    const remaining = scripts.filter((s) => s.id !== scriptToDelete.id);
    const normalized = remaining.map((s, idx) => ({ ...s, order: idx + 1 }));
    setScripts(normalized);
    setScriptToDelete(null);
    setSavedMessage(`Script "${scriptToDelete.name}" removed from configuration.`);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  // Toggle single script enable/disable
  const toggleScriptEnabled = (id: string) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Integrations Hub
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>Authorized: {currentUsername}</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Code className="h-6 w-6 text-blue-600" />
            <span>Integrations & Scripts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage official provider integrations (GA4, GSC, Meta Pixel, AdSense) and controlled custom scripts across document head and body.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToAds && (
            <button
              type="button"
              onClick={onNavigateToAds}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span>AdSense Slots</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {savedMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'integrations'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span>Standard Integrations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scripts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'scripts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <span>Custom Scripts Manager</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full font-mono">
            {scripts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('consent')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'consent'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span>Privacy & Consent</span>
        </button>
      </div>

      {/* TAB 1: STANDARD INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Google Analytics 4 */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Google Analytics 4</h3>
                  <p className="text-[11px] text-slate-500">Global site tag (gtag.js) measurement</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ga4Enabled}
                  onChange={(e) => setGa4Enabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Measurement ID <span className="text-slate-400 font-normal">(e.g. G-XXXXXXXXXX)</span>
                </label>
                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={ga4MeasurementId}
                  onChange={(e) => setGa4MeasurementId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                />
                {ga4MeasurementId && !isValidGa4(ga4MeasurementId) && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    Invalid format. Must begin with "G-" followed by alphanumeric characters.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={ga4AnonymizeIp}
                  onChange={(e) => setGa4AnonymizeIp(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable IP Anonymization (anonymize_ip: true)</span>
              </label>
            </div>
          </div>

          {/* Card 2: Google Search Console */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Google Search Console</h3>
                  <p className="text-[11px] text-slate-500">Site verification token or meta tag</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gscEnabled}
                  onChange={(e) => setGscEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Verification Code or Meta Tag
                </label>
                <input
                  type="text"
                  placeholder='e.g. google-site-verification=xxxx or <meta name="google-site-verification" content="..." />'
                  value={gscVerificationCode}
                  onChange={(e) => setGscVerificationCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  You can paste either the full meta tag or the token value. AstroPress extracts and mounts it into the document head automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Google AdSense Global Loader */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Google AdSense</h3>
                  <p className="text-[11px] text-slate-500">Publisher ID & Global adsbygoogle loader</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adsenseEnabled}
                  onChange={(e) => setAdsenseEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Publisher ID <span className="text-slate-400 font-normal">(e.g. ca-pub-XXXXXXXXXXXXXXXX)</span>
                </label>
                <input
                  type="text"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={adsensePublisherId}
                  onChange={(e) => setAdsensePublisherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                />
                {adsensePublisherId && !isValidPublisher(adsensePublisherId) && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    Must start with "ca-pub-" followed by numeric digits.
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Synchronized with Ads & Monetization. Slots are configured in the dedicated AdSense Manager.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adsenseAutoAds}
                    onChange={(e) => setAdsenseAutoAds(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>AdSense Auto Ads Enabled</span>
                </label>

                {onNavigateToAds && (
                  <button
                    type="button"
                    onClick={onNavigateToAds}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Configure Slots &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Meta Pixel */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Meta Pixel</h3>
                  <p className="text-[11px] text-slate-500">Facebook / Instagram conversion tracking</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={metaPixelEnabled}
                  onChange={(e) => setMetaPixelEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pixel ID <span className="text-slate-400 font-normal">(10–20 numeric digits)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012345"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                />
                {metaPixelId && !isValidPixel(metaPixelId) && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    Pixel ID must consist of numeric digits only.
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatically initializes fbq and tracks standard PageView events safely without duplicating during client-side navigation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM SCRIPTS MANAGER */}
      {activeTab === 'scripts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Configured Custom Scripts</h2>
              <p className="text-xs text-slate-500">
                Controlled script injection into document head, body start, or body end with safe deduplication.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddNewScript}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Script</span>
            </button>
          </div>

          {scripts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
              <Code className="h-8 w-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Custom Scripts Configured</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add Google Tag Manager, privacy-first analytics, customer chat widgets, or custom JavaScript safely.
              </p>
              <button
                type="button"
                onClick={handleAddNewScript}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                + Add First Script
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scripts.map((script, idx) => (
                <div
                  key={script.id}
                  className={`p-4 rounded-2xl border transition-all bg-white shadow-2xs ${
                    script.enabled ? 'border-slate-300' : 'border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveScript(idx, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                          aria-label="Move script up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === scripts.length - 1}
                          onClick={() => moveScript(idx, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                          aria-label="Move script down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {script.name}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {script.category}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Placement: {script.placement}
                          </span>
                          {script.consentRequired && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Consent Aware
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate max-w-lg">
                          {script.content.slice(0, 80)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={script.enabled}
                          onChange={() => toggleScriptEnabled(script.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingScript(script);
                          setIsCreatingNew(false);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setScriptToDelete(script)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        aria-label={`Delete ${script.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRIVACY & CONSENT */}
      {activeTab === 'consent' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Cookie & Privacy Consent Banner</h2>
              <p className="text-xs text-slate-500">
                Display an accessible, non-intrusive consent banner. Consent-aware scripts will wait for explicit visitor opt-in before executing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentBannerEnabled}
                onChange={(e) => setConsentBannerEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Info className="h-4 w-4 text-blue-500" />
              <span>Consent-Aware Execution Policy</span>
            </div>
            <p className="leading-relaxed">
              When enabled, Google Analytics 4, Meta Pixel, and any custom scripts marked with <strong>"Requires Visitor Consent"</strong> will be held until the visitor clicks <em>"Accept All"</em>. Essential scripts and verification meta tags continue to function uninterrupted.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: Script Editor / Creator */}
      {editingScript && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setEditingScript(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isCreatingNew ? 'Add Custom Script' : 'Edit Script Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingScript(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Script Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingScript.name}
                    onChange={(e) =>
                      setEditingScript({ ...editingScript, name: e.target.value })
                    }
                    placeholder="e.g. Google Tag Manager"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingScript.category}
                    onChange={(e) =>
                      setEditingScript({
                        ...editingScript,
                        category: e.target.value as ScriptCategory,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden bg-white"
                  >
                    <option value="analytics">Analytics & Metrics</option>
                    <option value="marketing">Marketing & Attribution</option>
                    <option value="tag_manager">Tag Management</option>
                    <option value="support_chat">Support & Live Chat</option>
                    <option value="utility">Utility / Optimization</option>
                    <option value="custom">General Custom JavaScript</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Placement Location <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingScript.placement}
                    onChange={(e) =>
                      setEditingScript({
                        ...editingScript,
                        placement: e.target.value as ScriptPlacement,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden bg-white"
                  >
                    <option value="head">Document Head (&lt;head&gt;)</option>
                    <option value="body_start">Body Start (&lt;body&gt; opening)</option>
                    <option value="body_end">Body End (before &lt;/body&gt;)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Template Helper
                  </label>
                  <select
                    value={editingScript.templateType || 'custom'}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setEditingScript({
                        ...editingScript,
                        templateType: t,
                        placement: t === 'gtm' ? 'head' : editingScript.placement,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden bg-white"
                  >
                    <option value="custom">Custom Code Snippet</option>
                    <option value="gtm">Google Tag Manager (GTM-XXXXXXX)</option>
                    <option value="clarity">Microsoft Clarity (Project ID)</option>
                    <option value="plausible">Plausible Analytics (Domain)</option>
                  </select>
                </div>
              </div>

              {editingScript.templateType && editingScript.templateType !== 'custom' && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5">
                  <label className="text-xs font-bold text-blue-900 block">
                    Provider ID / Domain
                  </label>
                  <input
                    type="text"
                    value={editingScript.providerId || ''}
                    onChange={(e) =>
                      setEditingScript({ ...editingScript, providerId: e.target.value })
                    }
                    placeholder={
                      editingScript.templateType === 'gtm'
                        ? 'GTM-XXXXXXX'
                        : editingScript.templateType === 'clarity'
                        ? 'e.g. 1a2b3c4d5e'
                        : 'e.g. yourdomain.com'
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-blue-200 bg-white focus:border-blue-500 outline-hidden"
                  />
                  <p className="text-[11px] text-blue-700">
                    Entering your Provider ID automatically prepares a verified, safe loader template.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Script Code / HTML Embed
                  </label>
                  <span className="text-[11px] text-slate-400">
                    &lt;script&gt; tags or plain JavaScript
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={editingScript.content}
                  onChange={(e) =>
                    setEditingScript({ ...editingScript, content: e.target.value })
                  }
                  placeholder="<script>...</script> or pure JavaScript code"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-900 text-slate-100 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingScript.enabled}
                    onChange={(e) =>
                      setEditingScript({ ...editingScript, enabled: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold">Enable script immediately upon save</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingScript.consentRequired ?? false}
                    onChange={(e) =>
                      setEditingScript({
                        ...editingScript,
                        consentRequired: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Requires Visitor Consent</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingScript(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedScript}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isCreatingNew ? 'Create Script' : 'Update Script'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Script Confirmation */}
      {scriptToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setScriptToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">Delete Script Entry</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to remove <span className="font-semibold text-slate-800">"{scriptToDelete.name}"</span>? It will no longer load on frontend pages.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setScriptToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
