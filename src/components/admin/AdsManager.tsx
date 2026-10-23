import React, { useState, useEffect } from 'react';
import {
  SiteSettings,
  AdSenseSettings,
  DynamicAdSlot,
  HomepageAdPlacement,
  ArticleAdPlacement,
  SharedBottomAdSlotConfig,
} from '../../types/cms';
import { AdUnitWidget } from '../common/AdUnitWidget';
import {
  DollarSign,
  Shield,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Sliders,
  Plus,
  Trash2,
  Layers,
  FileText,
  X,
} from 'lucide-react';

interface Props {
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
}

const DEFAULT_HOMEPAGE_SLOTS: DynamicAdSlot[] = [
  {
    id: 'home-slot-1',
    name: 'Homepage Slot 1',
    enabled: false,
    adUnitId: '',
    placement: 'below_hero',
    deviceVisibility: 'all',
    format: 'auto',
    order: 1,
  },
  {
    id: 'home-slot-2',
    name: 'Homepage Slot 2',
    enabled: false,
    adUnitId: '',
    placement: 'below_pagination',
    deviceVisibility: 'all',
    format: 'auto',
    order: 2,
  },
];

const DEFAULT_ARTICLE_SLOTS: DynamicAdSlot[] = [
  {
    id: 'post-slot-1',
    name: 'Post Slot 1',
    enabled: false,
    adUnitId: '',
    placement: 'after_title',
    deviceVisibility: 'all',
    format: 'auto',
    order: 1,
  },
  {
    id: 'post-slot-2',
    name: 'Post Slot 2',
    enabled: false,
    adUnitId: '',
    placement: 'in_content',
    contentParagraphIndex: 2,
    deviceVisibility: 'all',
    format: 'auto',
    order: 2,
  },
  {
    id: 'post-slot-3',
    name: 'Post Slot 3',
    enabled: false,
    adUnitId: '',
    placement: 'before_related',
    deviceVisibility: 'all',
    format: 'auto',
    order: 3,
  },
];

export const AdsManager: React.FC<Props> = ({ siteSettings, onUpdateSiteSettings }) => {
  const existingAds = siteSettings.adsSettings;

  // Initialize homepage slots from adsSettings.homeSlots or existing homeSlot1 & homeSlot2
  const initialHomeSlots: DynamicAdSlot[] = (() => {
    if (Array.isArray(existingAds?.homeSlots)) {
      return [...existingAds.homeSlots].sort((a, b) => a.order - b.order);
    }
    const legacy1 = existingAds?.homeSlot1;
    const legacy2 = existingAds?.homeSlot2;
    return [
      {
        id: legacy1?.id || 'home-slot-1',
        name: legacy1?.name || 'Homepage Slot 1',
        enabled: legacy1?.enabled ?? false,
        adUnitId: legacy1?.adUnitId || '',
        placement: (legacy1?.placement as HomepageAdPlacement) || 'below_hero',
        deviceVisibility: legacy1?.deviceVisibility || 'all',
        format: legacy1?.format || 'auto',
        order: legacy1?.order || 1,
      },
      {
        id: legacy2?.id || 'home-slot-2',
        name: legacy2?.name || 'Homepage Slot 2',
        enabled: legacy2?.enabled ?? false,
        adUnitId: legacy2?.adUnitId || '',
        placement: (legacy2?.placement as HomepageAdPlacement) || 'below_pagination',
        deviceVisibility: legacy2?.deviceVisibility || 'all',
        format: legacy2?.format || 'auto',
        order: legacy2?.order || 2,
      },
    ];
  })();

  // Initialize article slots from adsSettings.articleSlots or existing postSlot1, postSlot2, postSlot3
  const initialArticleSlots: DynamicAdSlot[] = (() => {
    if (Array.isArray(existingAds?.articleSlots)) {
      return [...existingAds.articleSlots].sort((a, b) => a.order - b.order);
    }
    const legacyP1 = existingAds?.postSlot1;
    const legacyP2 = existingAds?.postSlot2;
    const legacyP3 = existingAds?.postSlot3;
    return [
      {
        id: legacyP1?.id || 'post-slot-1',
        name: legacyP1?.name || 'Post Slot 1',
        enabled: legacyP1?.enabled ?? false,
        adUnitId: legacyP1?.adUnitId || '',
        placement: (legacyP1?.placement as ArticleAdPlacement) || 'after_title',
        deviceVisibility: legacyP1?.deviceVisibility || 'all',
        format: legacyP1?.format || 'auto',
        order: legacyP1?.order || 1,
      },
      {
        id: legacyP2?.id || 'post-slot-2',
        name: legacyP2?.name || 'Post Slot 2',
        enabled: legacyP2?.enabled ?? false,
        adUnitId: legacyP2?.adUnitId || '',
        placement: (legacyP2?.placement as ArticleAdPlacement) || 'in_content',
        contentParagraphIndex: legacyP2?.contentParagraphIndex || 2,
        deviceVisibility: legacyP2?.deviceVisibility || 'all',
        format: legacyP2?.format || 'auto',
        order: legacyP2?.order || 2,
      },
      {
        id: legacyP3?.id || 'post-slot-3',
        name: legacyP3?.name || 'Post Slot 3',
        enabled: legacyP3?.enabled ?? false,
        adUnitId: legacyP3?.adUnitId || '',
        placement: (legacyP3?.placement as ArticleAdPlacement) || 'before_related',
        deviceVisibility: legacyP3?.deviceVisibility || 'all',
        format: legacyP3?.format || 'auto',
        order: legacyP3?.order || 3,
      },
    ];
  })();

  const [adsEnabled, setAdsEnabled] = useState(existingAds?.adsEnabled ?? false);
  const [publisherId, setPublisherId] = useState(existingAds?.publisherId || '');
  const [homeSlots, setHomeSlots] = useState<DynamicAdSlot[]>(initialHomeSlots);
  const [articleSlots, setArticleSlots] = useState<DynamicAdSlot[]>(initialArticleSlots);
  const [sharedBottomSlot, setSharedBottomSlot] = useState<SharedBottomAdSlotConfig>(
    existingAds?.sharedBottomSlot || {
      enabled: false,
      showOnHomepage: false,
      showOnArticles: false,
      adUnitId: '',
      deviceVisibility: 'all',
      format: 'auto',
    }
  );

  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorValidation, setErrorValidation] = useState<string | null>(null);

  // Add new homepage slot
  const handleAddHomepageSlot = () => {
    const newId = `home-slot-${Date.now()}`;
    const newSlot: DynamicAdSlot = {
      id: newId,
      name: `Homepage Slot ${homeSlots.length + 1}`,
      enabled: false,
      adUnitId: '',
      placement: 'before_articles',
      deviceVisibility: 'all',
      format: 'auto',
      order: homeSlots.length + 1,
    };
    setHomeSlots([...homeSlots, newSlot]);
  };

  // Add new article slot
  const handleAddArticleSlot = () => {
    const newId = `post-slot-${Date.now()}`;
    const newSlot: DynamicAdSlot = {
      id: newId,
      name: `Post Slot ${articleSlots.length + 1}`,
      enabled: false,
      adUnitId: '',
      placement: 'in_content',
      contentParagraphIndex: 3,
      deviceVisibility: 'all',
      format: 'auto',
      order: articleSlots.length + 1,
    };
    setArticleSlots([...articleSlots, newSlot]);
  };

  // Update homepage slot
  const updateHomeSlot = (id: string, field: keyof DynamicAdSlot, value: any) => {
    setHomeSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  // Update article slot
  const updateArticleSlot = (id: string, field: keyof DynamicAdSlot, value: any) => {
    setArticleSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  // Reorder homepage slot
  const moveHomeSlot = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === homeSlots.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...homeSlots];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Re-index orders
    const normalized = reordered.map((slot, idx) => ({ ...slot, order: idx + 1 }));
    setHomeSlots(normalized);
  };

  // Reorder article slot
  const moveArticleSlot = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === articleSlots.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...articleSlots];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Re-index orders
    const normalized = reordered.map((slot, idx) => ({ ...slot, order: idx + 1 }));
    setArticleSlots(normalized);
  };

  // Slot selected for deletion confirmation modal
  const [slotToDelete, setSlotToDelete] = useState<{
    id: string;
    name: string;
    type: 'homepage' | 'article';
  } | null>(null);

  // Close confirmation modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSlotToDelete(null);
      }
    };
    if (slotToDelete) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [slotToDelete]);

  // Persistent save helper used by form submission and modal confirmation
  const persistSettings = (
    currentHome: DynamicAdSlot[],
    currentArticle: DynamicAdSlot[],
    currentAdsEnabled: boolean = adsEnabled,
    currentPublisherId: string = publisherId,
    currentSharedBottom: SharedBottomAdSlotConfig = sharedBottomSlot
  ) => {
    // Maintain 100% backward compatibility for legacy properties
    const slot1 = currentHome[0] || {
      id: 'home-slot-1',
      name: 'Homepage Slot 1',
      enabled: false,
      adUnitId: '',
      placement: 'below_hero' as HomepageAdPlacement,
      deviceVisibility: 'all' as const,
      format: 'auto' as const,
      order: 1,
    };
    const slot2 = currentHome[1] || {
      id: 'home-slot-2',
      name: 'Homepage Slot 2',
      enabled: false,
      adUnitId: '',
      placement: 'below_pagination' as HomepageAdPlacement,
      deviceVisibility: 'all' as const,
      format: 'auto' as const,
      order: 2,
    };
    const p1 = currentArticle[0] || {
      id: 'post-slot-1',
      name: 'Post Slot 1',
      enabled: false,
      adUnitId: '',
      placement: 'after_title' as ArticleAdPlacement,
      deviceVisibility: 'all' as const,
      format: 'auto' as const,
      order: 1,
    };
    const p2 = currentArticle[1] || {
      id: 'post-slot-2',
      name: 'Post Slot 2',
      enabled: false,
      adUnitId: '',
      placement: 'in_content' as ArticleAdPlacement,
      contentParagraphIndex: 2,
      deviceVisibility: 'all' as const,
      format: 'auto' as const,
      order: 2,
    };
    const p3 = currentArticle[2] || {
      id: 'post-slot-3',
      name: 'Post Slot 3',
      enabled: false,
      adUnitId: '',
      placement: 'after_body' as ArticleAdPlacement,
      deviceVisibility: 'all' as const,
      format: 'auto' as const,
      order: 3,
    };

    const updatedAdsSettings: AdSenseSettings = {
      adsEnabled: currentAdsEnabled,
      publisherId: currentPublisherId.trim(),
      homeSlot1: {
        id: slot1.id,
        name: slot1.name,
        enabled: slot1.enabled,
        adUnitId: slot1.adUnitId,
        placement: slot1.placement,
        deviceVisibility: slot1.deviceVisibility,
        format: slot1.format,
        order: slot1.order,
      },
      homeSlot2: {
        id: slot2.id,
        name: slot2.name,
        enabled: slot2.enabled,
        adUnitId: slot2.adUnitId,
        placement: slot2.placement,
        deviceVisibility: slot2.deviceVisibility,
        format: slot2.format,
        order: slot2.order,
      },
      postSlot1: {
        id: p1.id,
        name: p1.name,
        enabled: p1.enabled,
        adUnitId: p1.adUnitId,
        placement: p1.placement,
        deviceVisibility: p1.deviceVisibility,
        format: p1.format,
        order: p1.order,
      },
      postSlot2: {
        id: p2.id,
        name: p2.name,
        enabled: p2.enabled,
        adUnitId: p2.adUnitId,
        placement: p2.placement,
        deviceVisibility: p2.deviceVisibility,
        format: p2.format,
        order: p2.order,
        contentParagraphIndex: p2.contentParagraphIndex || 2,
      },
      postSlot3: {
        id: p3.id,
        name: p3.name,
        enabled: p3.enabled,
        adUnitId: p3.adUnitId,
        placement: p3.placement,
        deviceVisibility: p3.deviceVisibility,
        format: p3.format,
        order: p3.order,
      },
      sharedBottomSlot: currentSharedBottom,
      homeSlots: currentHome,
      articleSlots: currentArticle,
    };

    const updatedSiteSettings: SiteSettings = {
      ...siteSettings,
      adsSettings: updatedAdsSettings,
    };

    onUpdateSiteSettings(updatedSiteSettings);
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (!slotToDelete) return;

    let updatedHome = homeSlots;
    let updatedArticle = articleSlots;

    if (slotToDelete.type === 'homepage') {
      const remaining = homeSlots.filter((slot) => slot.id !== slotToDelete.id);
      updatedHome = remaining.map((s, idx) => ({ ...s, order: idx + 1 }));
      setHomeSlots(updatedHome);
      persistSettings(updatedHome, articleSlots);
    } else {
      const remaining = articleSlots.filter((slot) => slot.id !== slotToDelete.id);
      updatedArticle = remaining.map((s, idx) => ({ ...s, order: idx + 1 }));
      setArticleSlots(updatedArticle);
      persistSettings(homeSlots, updatedArticle);
    }

    setSavedMessage(`Ad slot "${slotToDelete.name}" deleted and settings updated.`);
    setTimeout(() => setSavedMessage(null), 3500);
    setSlotToDelete(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (adsEnabled && !publisherId.trim()) {
      setErrorValidation(
        'Please enter a valid Google AdSense Publisher ID (e.g., ca-pub-XXXXXXXXXXXXXXXX) when Master Ads is ON.'
      );
      return;
    }

    // Validate duplicate slot IDs
    const allSlotIds = [...homeSlots.map((s) => s.id), ...articleSlots.map((s) => s.id)];
    const idSet = new Set(allSlotIds);
    if (idSet.size !== allSlotIds.length) {
      setErrorValidation('Duplicate slot IDs detected. Please ensure all ad slot IDs are unique.');
      return;
    }

    setErrorValidation(null);
    persistSettings(homeSlots, articleSlots, adsEnabled, publisherId, sharedBottomSlot);
    setSavedMessage('AdSense placement configuration saved successfully!');
    setTimeout(() => setSavedMessage(null), 3500);
  };

  const homepagePlacementOptions: { value: HomepageAdPlacement; label: string; desc: string }[] = [
    { value: 'below_navigation', label: 'Below Navigation / Above Hero', desc: 'Topmost banner right under the primary navbar' },
    { value: 'below_hero', label: 'Below Hero Section', desc: 'Directly beneath the hero showcase area' },
    { value: 'before_articles', label: 'Before Article List', desc: 'Immediately above the recent dispatches grid' },
    { value: 'after_articles', label: 'After Article List', desc: 'Directly below the post cards before pagination' },
    { value: 'below_pagination', label: 'Below Pagination', desc: 'Immediately beneath the page number controls' },
    { value: 'before_community', label: 'Before Community / Footer', desc: 'Near bottom before newsletter and social CTA' },
  ];

  const articlePlacementOptions: { value: ArticleAdPlacement; label: string; desc: string }[] = [
    { value: 'after_title', label: 'After Title & Metadata Bar', desc: 'Directly after the title, before featured cover image' },
    { value: 'after_featured_image', label: 'After Featured Cover Image', desc: 'Directly below the hero cover photo, before body text' },
    { value: 'in_content', label: 'Within Article Content (Between Blocks)', desc: 'Safely between complete paragraphs without breaking syntax' },
    { value: 'after_body', label: 'After Article Body (Before Bio)', desc: 'Directly after reading content and tags' },
    { value: 'before_related', label: 'Before Related Reading & Comments', desc: 'After author bio, preceding discussion section' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ads & Monetization Manager</h1>
              <p className="text-sm text-slate-500">
                Advanced placement controller for Google AdSense with dynamic slot allocation and live previews.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              isPreviewMode
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>{isPreviewMode ? 'Exit Preview Mode' : 'Preview Ad Placements'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all flex-1 md:flex-initial justify-center cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorValidation && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorValidation}</span>
        </div>
      )}

      {/* Master Configuration & Publisher ID */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span>Master AdSense Configuration</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-semibold text-slate-900 block text-sm">Master Ads Switch</span>
              <span className="text-xs text-slate-500">Globally activate or deactivate all AdSense units across the site.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adsEnabled}
                onChange={(e) => setAdsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Google AdSense Publisher ID
            </label>
            <input
              type="text"
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Verified publisher identifier (e.g. ca-pub-1234567890123456).</p>
          </div>
        </div>
      </div>

      {/* DYNAMIC HOMEPAGE SLOTS */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              <span>Homepage Ad Slots ({homeSlots.length} Active Slots)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add, configure, reorder, or delete custom ad slots across supported homepage anchor locations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddHomepageSlot}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Homepage Ad Slot</span>
          </button>
        </div>

        <div className="space-y-4">
          {homeSlots.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50 text-slate-500">
              <p className="text-sm font-medium text-slate-700">No homepage ad slots configured.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Homepage Ad Slot" above to create an ad placement.</p>
            </div>
          ) : (
            homeSlots.map((slot, index) => {
              const currentPlacement =
                homepagePlacementOptions.find((p) => p.value === slot.placement) || homepagePlacementOptions[0];

              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    slot.enabled ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                      <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => updateHomeSlot(slot.id, 'name', e.target.value)}
                        placeholder="Slot Name"
                        className="font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1.5 py-0.5 rounded outline-hidden transition-all"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">({slot.id})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Move Up / Down */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveHomeSlot(index, 'up')}
                          title="Move Slot Up"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === homeSlots.length - 1}
                          onClick={() => moveHomeSlot(index, 'down')}
                          title="Move Slot Down"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Enable Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slot.enabled}
                          onChange={(e) => updateHomeSlot(slot.id, 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>

                      {/* Delete button triggering confirmation modal */}
                      <button
                        type="button"
                        onClick={() =>
                          setSlotToDelete({
                            id: slot.id,
                            name: slot.name || `Homepage Slot ${index + 1}`,
                            type: 'homepage',
                          })
                        }
                        title="Delete this slot"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        aria-label={`Delete ${slot.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Anchor</label>
                    <select
                      value={slot.placement}
                      onChange={(e) => updateHomeSlot(slot.id, 'placement', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {homepagePlacementOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">{currentPlacement.desc}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Unit ID</label>
                    <input
                      type="text"
                      value={slot.adUnitId}
                      onChange={(e) => updateHomeSlot(slot.id, 'adUnitId', e.target.value)}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Specific Google AdSense unit slot ID</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Device Visibility</label>
                      <select
                        value={slot.deviceVisibility}
                        onChange={(e) => updateHomeSlot(slot.id, 'deviceVisibility', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Devices</option>
                        <option value="desktop">Desktop Only</option>
                        <option value="mobile">Mobile Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                      <select
                        value={slot.format}
                        onChange={(e) => updateHomeSlot(slot.id, 'format', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="auto">Auto</option>
                        <option value="rectangle">Rectangle</option>
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isPreviewMode && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80">
                    <AdUnitWidget
                      adsEnabled={adsEnabled && slot.enabled}
                      publisherId={publisherId}
                      adUnitId={slot.adUnitId}
                      slotName={`${slot.name} [${currentPlacement.label}]`}
                      format={slot.format}
                      deviceVisibility={slot.deviceVisibility}
                      isPreview={true}
                    />
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      {/* DYNAMIC ARTICLE / POST SLOTS */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Article & Post Ad Slots ({articleSlots.length} Active Slots)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure safe content boundaries and injection points within articles without disrupting reader ergonomics.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddArticleSlot}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Article Ad Slot</span>
          </button>
        </div>

        <div className="space-y-4">
          {articleSlots.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50 text-slate-500">
              <p className="text-sm font-medium text-slate-700">No article ad slots configured.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Article Ad Slot" above to create an in-post placement.</p>
            </div>
          ) : (
            articleSlots.map((slot, index) => {
              const currentPlacement =
                articlePlacementOptions.find((p) => p.value === slot.placement) || articlePlacementOptions[0];

              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    slot.enabled ? 'bg-purple-50/30 border-purple-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                      <span className="h-7 w-7 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => updateArticleSlot(slot.id, 'name', e.target.value)}
                        placeholder="Slot Name"
                        className="font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:bg-white px-1.5 py-0.5 rounded outline-hidden transition-all"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">({slot.id})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Move Up / Down */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveArticleSlot(index, 'up')}
                          title="Move Slot Up"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === articleSlots.length - 1}
                          onClick={() => moveArticleSlot(index, 'down')}
                          title="Move Slot Down"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Enable Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slot.enabled}
                          onChange={(e) => updateArticleSlot(slot.id, 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>

                      {/* Delete button triggering confirmation modal */}
                      <button
                        type="button"
                        onClick={() =>
                          setSlotToDelete({
                            id: slot.id,
                            name: slot.name || `Post Slot ${index + 1}`,
                            type: 'article',
                          })
                        }
                        title="Delete this slot"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        aria-label={`Delete ${slot.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Location</label>
                    <select
                      value={slot.placement}
                      onChange={(e) => updateArticleSlot(slot.id, 'placement', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      {articlePlacementOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">{currentPlacement.desc}</p>
                  </div>

                  {slot.placement === 'in_content' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Paragraph Index</label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={slot.contentParagraphIndex || 2}
                        onChange={(e) =>
                          updateArticleSlot(slot.id, 'contentParagraphIndex', parseInt(e.target.value, 10) || 2)
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Injects cleanly after paragraph #{slot.contentParagraphIndex || 2}</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Unit ID</label>
                      <input
                        type="text"
                        value={slot.adUnitId}
                        onChange={(e) => updateArticleSlot(slot.id, 'adUnitId', e.target.value)}
                        placeholder="e.g. 5566778899"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Google AdSense slot ID</p>
                    </div>
                  )}

                  {slot.placement === 'in_content' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Unit ID</label>
                      <input
                        type="text"
                        value={slot.adUnitId}
                        onChange={(e) => updateArticleSlot(slot.id, 'adUnitId', e.target.value)}
                        placeholder="e.g. 5566778899"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Google AdSense slot ID</p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Device</label>
                      <select
                        value={slot.deviceVisibility}
                        onChange={(e) => updateArticleSlot(slot.id, 'deviceVisibility', e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All</option>
                        <option value="desktop">Desktop</option>
                        <option value="mobile">Mobile</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                      <select
                        value={slot.format}
                        onChange={(e) => updateArticleSlot(slot.id, 'format', e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="auto">Auto</option>
                        <option value="rectangle">Box</option>
                        <option value="horizontal">Banner</option>
                        <option value="vertical">Skyscraper</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isPreviewMode && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80">
                    <AdUnitWidget
                      adsEnabled={adsEnabled && slot.enabled}
                      publisherId={publisherId}
                      adUnitId={slot.adUnitId}
                      slotName={`${slot.name} [${currentPlacement.label}]`}
                      format={slot.format}
                      deviceVisibility={slot.deviceVisibility}
                      isPreview={true}
                    />
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      {/* SHARED BOTTOM AD SLOT */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-600" />
              <span>Shared Bottom Ad Slot</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Universal bottom placement that synchronizes a single Ad Unit ID between Homepage and Article pages.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={sharedBottomSlot.enabled}
              onChange={(e) => setSharedBottomSlot({ ...sharedBottomSlot, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Shared Ad Unit ID
              </label>
              <input
                type="text"
                value={sharedBottomSlot.adUnitId}
                onChange={(e) => setSharedBottomSlot({ ...sharedBottomSlot, adUnitId: e.target.value })}
                placeholder="e.g. 9988776655"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Updating this Ad Unit ID updates both homepage and article appearances simultaneously.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Device Visibility</label>
                <select
                  value={sharedBottomSlot.deviceVisibility}
                  onChange={(e) =>
                    setSharedBottomSlot({ ...sharedBottomSlot, deviceVisibility: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Devices</option>
                  <option value="desktop">Desktop Only</option>
                  <option value="mobile">Mobile Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Format</label>
                <select
                  value={sharedBottomSlot.format}
                  onChange={(e) => setSharedBottomSlot({ ...sharedBottomSlot, format: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="auto">Auto (Responsive)</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <span className="font-bold text-slate-900 text-sm block">Display Target Controls</span>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sharedBottomSlot.showOnHomepage}
                onChange={(e) =>
                  setSharedBottomSlot({ ...sharedBottomSlot, showOnHomepage: e.target.checked })
                }
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
              />
              <span className="text-sm text-slate-700 font-medium">Show at bottom of Homepage (before footer)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sharedBottomSlot.showOnArticles}
                onChange={(e) =>
                  setSharedBottomSlot({ ...sharedBottomSlot, showOnArticles: e.target.checked })
                }
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
              />
              <span className="text-sm text-slate-700 font-medium">Show at bottom of Article pages (before footer)</span>
            </label>

            {isPreviewMode && (
              <div className="pt-2">
                <AdUnitWidget
                  adsEnabled={adsEnabled && sharedBottomSlot.enabled}
                  publisherId={publisherId}
                  adUnitId={sharedBottomSlot.adUnitId}
                  slotName="Shared Bottom Ad Slot"
                  format={sharedBottomSlot.format}
                  deviceVisibility={sharedBottomSlot.deviceVisibility}
                  isPreview={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Confirmation Modal for Deleting Ad Slots */}
      {slotToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSlotToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 id="delete-modal-title" className="text-base font-bold text-slate-900">
                    Delete Ad Slot
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSlotToDelete(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to remove <span className="font-semibold text-slate-800">"{slotToDelete.name}"</span>?
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Page:</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {slotToDelete.type === 'homepage' ? 'Homepage' : 'Articles & Posts'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Slot ID:</span>
                    <span className="font-mono text-slate-700">{slotToDelete.id}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    Remaining slots will be automatically reordered and settings will be saved.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSlotToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
