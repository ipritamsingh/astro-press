import React, { useState, useEffect } from 'react';
import { SiteSettings, AdConfiguration, AdDisplayLocation, AdProviderType } from '../../types/cms';
import { DEFAULT_DEMO_AD_CONFIG, DemoAdBanner } from '../common/DemoAdBanner';
import { initialSiteSettings } from '../../data/initialData';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit,
  Check,
  Save,
  Globe,
  Smartphone,
  Monitor,
  AlertCircle,
  Code,
  Image as ImageIcon,
  Sliders,
  X,
  ArrowUp,
  ArrowDown,
  Layout,
  Layers,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Cpu,
  FileText,
  Home,
  FolderTree,
  RotateCcw,
  Copy,
  Info,
  Clock,
} from 'lucide-react';

interface Props {
  siteSettings?: SiteSettings;
  onUpdateSiteSettings: (settings: Partial<SiteSettings>) => void;
}

export const HOMEPAGE_PLACEMENTS = [
  { id: 'homepage_above_hero', label: 'Before the Hero Section (Above Hero)' },
  { id: 'homepage_below_hero', label: 'After the Hero Section (Below Hero)' },
  { id: 'homepage_between_category_sections', label: 'Between Category & Featured Sections' },
  { id: 'between_homepage_sections', label: 'Between Homepage Sections' },
  { id: 'homepage_between_post_cards', label: 'Between Post Cards (Feed)', hasInterval: true },
  { id: 'before_footer', label: 'Before Footer' },
];

export const POST_PLACEMENTS = [
  { id: 'before_post_title', label: 'Before the Post Title' },
  { id: 'after_post_title', label: 'After Post Title & Metadata' },
  { id: 'before_intro', label: 'Before Introduction Paragraph' },
  { id: 'after_intro', label: 'After Introduction Paragraph' },
  { id: 'between_paragraphs', label: 'Between Article Paragraphs', hasInterval: true },
  { id: 'after_sections', label: 'After Selected Article Sections' },
  { id: 'before_conclusion', label: 'Before Conclusion / Discussion' },
  { id: 'after_content', label: 'After Article Content & Author Box' },
  { id: 'before_footer', label: 'Before Article Footer' },
];

export const PAGE_PLACEMENTS = [
  { id: 'before_page_title', label: 'Before the Page Title' },
  { id: 'after_page_title', label: 'After Page Title' },
  { id: 'before_page_content', label: 'Before Page Content' },
  { id: 'after_page_content', label: 'After Page Content' },
  { id: 'before_footer', label: 'Before Page Footer' },
];

export const ARCHIVE_PLACEMENTS = [
  { id: 'before_archive_title', label: 'Before Archive Title & Description' },
  { id: 'after_archive_title', label: 'After Archive Title' },
  { id: 'before_listing', label: 'Before Listing Items' },
  { id: 'between_listing_items', label: 'Between Listing Cards', hasInterval: true },
  { id: 'after_listing', label: 'After Listing Items' },
  { id: 'before_footer', label: 'Before Archive Footer' },
];

export const FOOTER_PLACEMENTS = [
  { id: 'after_main_content', label: 'After Main Content & Before Footer' },
  { id: 'before_site_footer', label: 'Before Site Footer (Site-Wide)' },
];

const PLACEMENT_ALIASES_MAP: Record<string, string[]> = {
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
};

const isPlacementCheckedInRule = (rulePlacements: string[] = [], placementId: string): boolean => {
  const aliases = PLACEMENT_ALIASES_MAP[placementId] || [placementId];
  return rulePlacements.some((p) => p === placementId || aliases.includes(p));
};

export const AdsManager: React.FC<Props> = ({ siteSettings, onUpdateSiteSettings }) => {
  const currentAds = siteSettings?.adsSettings || {
    adsEnabled: true,
    demoModeEnabled: false,
    publisherId: '',
    autoAdsEnabled: false,
    ads: [],
  };

  const initialAdsList: AdConfiguration[] =
    currentAds.ads && currentAds.ads.length > 0
      ? currentAds.ads
      : (initialSiteSettings.adsSettings?.ads || []);

  const [adsEnabled, setAdsEnabled] = useState<boolean>(currentAds.adsEnabled !== false);
  const [demoModeEnabled, setDemoModeEnabled] = useState<boolean>(Boolean(currentAds.demoModeEnabled));
  const [ads, setAds] = useState<AdConfiguration[]>(initialAdsList);
  
  const [editingAd, setEditingAd] = useState<AdConfiguration | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Sync state if siteSettings from parent updates or loads
  useEffect(() => {
    if (siteSettings?.adsSettings?.ads && siteSettings.adsSettings.ads.length > 0) {
      setAds(siteSettings.adsSettings.ads);
    }
    if (siteSettings?.adsSettings?.adsEnabled !== undefined) {
      setAdsEnabled(siteSettings.adsSettings.adsEnabled !== false);
    }
    if (siteSettings?.adsSettings?.demoModeEnabled !== undefined) {
      setDemoModeEnabled(Boolean(siteSettings.adsSettings.demoModeEnabled));
    }
  }, [siteSettings?.adsSettings]);

  // Slug input helpers for modal
  const [includedSlugsInput, setIncludedSlugsInput] = useState<string>('');
  const [excludedSlugsInput, setExcludedSlugsInput] = useState<string>('');

  const persistAdsSettings = (
    updatedAds: AdConfiguration[],
    newAdsEnabled: boolean = adsEnabled,
    newDemoMode: boolean = demoModeEnabled
  ) => {
    onUpdateSiteSettings({
      adsSettings: {
        ...currentAds,
        adsEnabled: newAdsEnabled,
        demoModeEnabled: newDemoMode,
        publisherId: currentAds.publisherId || '',
        autoAdsEnabled: currentAds.autoAdsEnabled || false,
        ads: updatedAds,
      },
    });
  };

  const handleSaveAll = () => {
    persistAdsSettings(ads, adsEnabled, demoModeEnabled);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddNewAd = () => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newAd: AdConfiguration = {
      id: `ad-${uniqueSuffix}`,
      name: 'New Ad Unit',
      provider: 'adsense',
      adCode: '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0000000000000000" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>',
      enabled: true,
      displayLocations: ['posts'],
      placementRules: {
        posts: { placements: ['after_intro'], insertionInterval: 2 },
      },
      deviceVisibility: 'all',
      includedSlugs: [],
      excludedSlugs: [],
      notes: '',
      createdAt: new Date().toISOString(),
    };
    setEditingAd(newAd);
    setIncludedSlugsInput('');
    setExcludedSlugsInput('');
    setIsCreating(true);
  };

  const handleEditAd = (ad: AdConfiguration) => {
    setEditingAd({ ...ad });
    setIncludedSlugsInput((ad.includedSlugs || []).join(', '));
    setExcludedSlugsInput((ad.excludedSlugs || []).join(', '));
    setIsCreating(false);
  };

  const handleDuplicateAd = (ad: AdConfiguration) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const duplicated: AdConfiguration = {
      ...ad,
      id: `ad-${uniqueSuffix}`,
      name: `${ad.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    const updatedAds = [...ads, duplicated];
    setAds(updatedAds);
    persistAdsSettings(updatedAds, adsEnabled, demoModeEnabled);
  };

  const handleDeleteAd = (id: string) => {
    if (!id) return;
    const adToDelete = ads.find((a) => a.id === id);
    const adName = adToDelete ? `"${adToDelete.name}"` : 'this ad unit';
    if (confirm(`Are you sure you want to delete ${adName}? This action cannot be undone.`)) {
      const updatedAds = ads.filter((a) => a.id !== id);
      setAds(updatedAds);
      persistAdsSettings(updatedAds, adsEnabled, demoModeEnabled);
    }
  };

  const handleToggleAd = (id: string) => {
    if (!id) return;
    const updatedAds = ads.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setAds(updatedAds);
    persistAdsSettings(updatedAds, adsEnabled, demoModeEnabled);
  };

  const handleSaveAdModal = (ad: AdConfiguration) => {
    if (!ad.name.trim()) {
      alert('Please provide an ad name.');
      return;
    }

    const inc = includedSlugsInput
      .split(',')
      .map((s) => s.trim().replace(/^\/+|\/+$/g, ''))
      .filter(Boolean);
    const exc = excludedSlugsInput
      .split(',')
      .map((s) => s.trim().replace(/^\/+|\/+$/g, ''))
      .filter(Boolean);

    const safeId = ad.id && ad.id.trim()
      ? ad.id.trim()
      : `ad-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const finalAd: AdConfiguration = {
      ...ad,
      id: safeId,
      includedSlugs: inc,
      excludedSlugs: exc,
    };

    let updatedAds: AdConfiguration[];
    if (isCreating) {
      updatedAds = [...ads, finalAd];
    } else {
      updatedAds = ads.map((a) => (a.id === finalAd.id ? finalAd : a));
    }
    setAds(updatedAds);
    persistAdsSettings(updatedAds, adsEnabled, demoModeEnabled);
    setEditingAd(null);
    setIsCreating(false);
  };

  const toggleLocation = (location: AdDisplayLocation) => {
    if (!editingAd) return;
    const currentLocs = editingAd.displayLocations || [];
    const exists = currentLocs.includes(location);
    const newLocs = exists ? currentLocs.filter((l) => l !== location) : [...currentLocs, location];
    
    // Ensure placementRules entry exists
    const newRules = { ...editingAd.placementRules };
    if (!exists && !newRules[location]) {
      newRules[location] = { placements: [] };
    }

    setEditingAd({
      ...editingAd,
      displayLocations: newLocs,
      placementRules: newRules,
    });
  };

  const togglePlacementForLocation = (location: string, placementId: string) => {
    if (!editingAd) return;
    const currentLocRule = editingAd.placementRules[location] || { placements: [] };
    const currentPlacements = currentLocRule.placements || [];
    const exists = currentPlacements.includes(placementId);
    const newPlacements = exists
      ? currentPlacements.filter((p) => p !== placementId)
      : [...currentPlacements, placementId];

    setEditingAd({
      ...editingAd,
      placementRules: {
        ...editingAd.placementRules,
        [location]: {
          ...currentLocRule,
          placements: newPlacements,
        },
      },
    });
  };

  const updateIntervalForLocation = (location: string, interval: number) => {
    if (!editingAd) return;
    const currentLocRule = editingAd.placementRules[location] || { placements: [] };
    setEditingAd({
      ...editingAd,
      placementRules: {
        ...editingAd.placementRules,
        [location]: {
          ...currentLocRule,
          insertionInterval: interval,
        },
      },
    });
  };

  const activeAdsCount = ads.filter((a) => a.enabled).length;
  const disabledAdsCount = ads.length - activeAdsCount;

  return (
    <div className="space-y-6 text-xs font-sans text-slate-800 pb-20">
      {/* WordPress-Style Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
              <Megaphone className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Ads Manager / Ad Inserter
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                WordPress Ad Inserter Style • Multi-Location Insertion Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Global Ads Toggle */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
            <span className="font-bold text-slate-700">Global Ads:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adsEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAdsEnabled(val);
                  persistAdsSettings(ads, val, demoModeEnabled);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${adsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {adsEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
            <span className="font-bold text-slate-700">Demo Mode:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={demoModeEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setDemoModeEnabled(val);
                  persistAdsSettings(ads, adsEnabled, val);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${demoModeEnabled ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
              {demoModeEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Ads Manager settings saved successfully. Renderers updated across all site templates.</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Configured Ads</span>
          <div className="text-2xl font-extrabold text-slate-900">{ads.length}</div>
          <p className="text-[11px] text-slate-500">Managed ad insertion blocks</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Ads</span>
          <div className="text-2xl font-extrabold text-emerald-600">{activeAdsCount}</div>
          <p className="text-[11px] text-slate-500">Currently serving on frontend</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disabled Ads</span>
          <div className="text-2xl font-extrabold text-slate-400">{disabledAdsCount}</div>
          <p className="text-[11px] text-slate-500">Paused ad insertion blocks</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Global Master Switch</span>
          <div className={`text-sm font-extrabold mt-1 ${adsEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
            {adsEnabled ? 'ALL ADS ACTIVE' : 'ALL ADS DISABLED'}
          </div>
          <p className="text-[11px] text-slate-500">Controls all site advertisements</p>
        </div>
      </div>

      {/* Main Ads List & Add Button */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Saved Advertisement Blocks</h2>
            <p className="text-slate-500 mt-0.5">
              Paste code once, target multiple page types, and select exact placement positions.
            </p>
          </div>
          <button
            onClick={handleAddNewAd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Ad</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {ads.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <Megaphone className="h-10 w-10 mx-auto opacity-40 text-blue-500" />
              <p className="text-sm font-bold text-slate-700">No advertisement blocks configured.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "+ Add New Ad" above to paste your AdSense snippet or banner code and select where it should appear.
              </p>
              <button
                onClick={handleAddNewAd}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 cursor-pointer"
              >
                + Add Your First Ad
              </button>
            </div>
          ) : (
            ads.map((ad) => (
              <div
                key={ad.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm truncate max-w-full">{ad.name}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ad.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {ad.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                      Provider: {ad.provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Locations:</span>
                    {(ad.displayLocations || []).map((loc) => (
                      <span key={loc} className="bg-slate-100 px-2 py-0.5 rounded uppercase text-[10px] font-medium text-slate-700">
                        {loc}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 font-mono break-all truncate">
                    {ad.notes || (ad.adCode ? ad.adCode.substring(0, 90) + '...' : 'No ad snippet configured')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => handleToggleAd(ad.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs border cursor-pointer transition-colors ${
                      ad.enabled
                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                    title={ad.enabled ? 'Pause this ad' : 'Resume serving this ad'}
                  >
                    {ad.enabled ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditAd(ad)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs"
                    title="Edit Ad"
                  >
                    <Edit className="h-3.5 w-3.5 text-blue-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateAd(ad)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-semibold cursor-pointer transition-colors shadow-2xs"
                    title="Duplicate Ad"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAd(ad.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold cursor-pointer transition-colors shadow-2xs"
                    title="Delete Ad"
                    aria-label={`Delete ${ad.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT / CREATE AD MODAL (WordPress Ad Inserter Style)                       */}
      {/* ========================================================================= */}
      {editingAd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {isCreating ? 'Create New Advertisement (Ad Inserter)' : `Edit Ad: ${editingAd.name}`}
              </h3>
              <button
                onClick={() => setEditingAd(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Ad Block Name *</label>
                  <input
                    type="text"
                    value={editingAd.name}
                    onChange={(e) => setEditingAd({ ...editingAd, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                    placeholder="e.g. Header Leaderboard or In-Article Banner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Ad Provider / Type</label>
                  <select
                    value={editingAd.provider}
                    onChange={(e: any) => setEditingAd({ ...editingAd, provider: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="adsense">Google AdSense</option>
                    <option value="custom_image">Custom Image Banner</option>
                    <option value="third_party">Trusted Embed / HTML</option>
                    <option value="demo">Demo Ad (Test Mode)</option>
                  </select>
                </div>
              </div>

              {/* Ad Code / Content */}
              {editingAd.provider !== 'custom_image' ? (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">
                    {editingAd.provider === 'adsense' ? 'Google AdSense Ad Unit Snippet / Code *' : 'Ad Code / HTML Embed *'}
                  </label>
                  <textarea
                    rows={5}
                    value={editingAd.adCode}
                    onChange={(e) => setEditingAd({ ...editingAd, adCode: e.target.value })}
                    placeholder="Paste your ad unit code here..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800">Custom Banner Image Settings</h4>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700">Image URL</label>
                    <input
                      type="text"
                      value={editingAd.customImage?.imageUrl || ''}
                      onChange={(e) =>
                        setEditingAd({
                          ...editingAd,
                          customImage: {
                            ...(editingAd.customImage || { destinationUrl: '' }),
                            imageUrl: e.target.value,
                          },
                        })
                      }
                      placeholder="https://images.unsplash.com/... or /uploads/banner.webp"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-700">Destination URL</label>
                      <input
                        type="text"
                        value={editingAd.customImage?.destinationUrl || ''}
                        onChange={(e) =>
                          setEditingAd({
                            ...editingAd,
                            customImage: {
                              ...(editingAd.customImage || { imageUrl: '' }),
                              destinationUrl: e.target.value,
                            },
                          })
                        }
                        placeholder="https://example.com/promo"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-700">Alt Text / Description</label>
                      <input
                        type="text"
                        value={editingAd.customImage?.altText || ''}
                        onChange={(e) =>
                          setEditingAd({
                            ...editingAd,
                            customImage: {
                              ...(editingAd.customImage || { imageUrl: '', destinationUrl: '' }),
                              altText: e.target.value,
                            },
                          })
                        }
                        placeholder="Promotional banner"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Display Locations (Multiple Checkboxes) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="font-bold text-slate-800 block">
                  Display Locations (Select one or multiple page types):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'homepage', label: 'Homepage', icon: <Home className="h-4 w-4 text-blue-600" /> },
                    { id: 'posts', label: 'Single Posts / Articles', icon: <FileText className="h-4 w-4 text-violet-600" /> },
                    { id: 'pages', label: 'Static Pages', icon: <Layers className="h-4 w-4 text-emerald-600" /> },
                    { id: 'archives', label: 'Categories / Archives', icon: <FolderTree className="h-4 w-4 text-amber-600" /> },
                    { id: 'footer', label: 'Global Footer', icon: <Layout className="h-4 w-4 text-rose-600" /> },
                  ].map((loc) => {
                    const isSelected = (editingAd.displayLocations || []).includes(loc.id as any);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => toggleLocation(loc.id as any)}
                        className={`p-3 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/80 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {loc.icon}
                          <span>{loc.label}</span>
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                          {isSelected ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Placement Positions for each selected location */}
              {(editingAd.displayLocations || []).map((loc) => {
                let placementsList: any[] = [];
                let locTitle = '';
                if (loc === 'homepage') {
                  placementsList = HOMEPAGE_PLACEMENTS;
                  locTitle = 'Homepage Placement Positions';
                } else if (loc === 'posts') {
                  placementsList = POST_PLACEMENTS;
                  locTitle = 'Single Post / Article Placement Positions';
                } else if (loc === 'pages') {
                  placementsList = PAGE_PLACEMENTS;
                  locTitle = 'Static Page Placement Positions';
                } else if (loc === 'archives') {
                  placementsList = ARCHIVE_PLACEMENTS;
                  locTitle = 'Category / Archive Placement Positions';
                } else if (loc === 'footer') {
                  placementsList = FOOTER_PLACEMENTS;
                  locTitle = 'Global Footer Placement Positions';
                }

                const currentRule = editingAd.placementRules[loc] || { placements: [] };

                return (
                  <div key={loc} className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-700">
                      <span>📌</span>
                      <span>{locTitle}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {placementsList.map((p) => {
                        const isChecked = isPlacementCheckedInRule(currentRule.placements, p.id);
                        return (
                          <div key={p.id} className="space-y-2">
                            <label className="flex items-start gap-2.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePlacementForLocation(loc, p.id)}
                                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-slate-800 font-medium text-xs">{p.label}</span>
                            </label>

                            {isChecked && p.hasInterval && (
                              <div className="pl-6 flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-600">Insertion Interval:</span>
                                <select
                                  value={currentRule.insertionInterval || (loc === 'posts' ? 2 : 2)}
                                  onChange={(e) => updateIntervalForLocation(loc, parseInt(e.target.value, 10))}
                                  className="p-1.5 rounded border border-slate-200 bg-white font-medium text-xs"
                                >
                                  <option value={1}>Every 1 item / paragraph</option>
                                  <option value={2}>Every 2 items / paragraphs</option>
                                  <option value={3}>Every 3 items / paragraphs</option>
                                  <option value={4}>Every 4 items / paragraphs</option>
                                  <option value={5}>Every 5 items / paragraphs</option>
                                  <option value={6}>Every 6 items / paragraphs</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Device Visibility & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Device Visibility</label>
                  <select
                    value={editingAd.deviceVisibility}
                    onChange={(e: any) => setEditingAd({ ...editingAd, deviceVisibility: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="all">All Devices (Desktop, Tablet, Mobile)</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile & Tablet Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={editingAd.enabled ? 'true' : 'false'}
                    onChange={(e) => setEditingAd({ ...editingAd, enabled: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="true">Enabled (Serving)</option>
                    <option value="false">Disabled (Paused)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Internal Notes / Description</label>
                <input
                  type="text"
                  value={editingAd.notes || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, notes: e.target.value })}
                  placeholder="e.g. Q4 Sponsor campaign banner"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingAd(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAdModal(editingAd)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
              >
                Save Ad Inserter Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
