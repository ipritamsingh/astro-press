import React, { useState } from 'react';
import { SiteSettings, AdSlot } from '../../types/cms';
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
  HelpCircle,
  Code,
  Image as ImageIcon,
  Sliders,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface Props {
  siteSettings?: SiteSettings;
  onUpdateSiteSettings: (settings: Partial<SiteSettings>) => void;
}

const PLACEMENT_OPTIONS = [
  { id: 'before_post_title', label: '1. Before the post title' },
  { id: 'after_post_title', label: '2. After the post title and metadata' },
  { id: 'after_introduction', label: '3. After the introduction' },
  { id: 'between_paragraphs', label: '4. Between article paragraphs' },
  { id: 'after_sections', label: '5. After selected article sections' },
  { id: 'before_conclusion', label: '6. Before the article conclusion' },
  { id: 'after_content', label: '7. After the article content' },
  { id: 'between_homepage_sections', label: '8. Between homepage sections' },
  { id: 'between_archive_items', label: '9. Between category/archive listing items' },
  { id: 'sidebar', label: '10. Sidebar' },
  { id: 'before_footer', label: '11. Before the footer' },
  { id: 'custom_placement', label: '12. Custom Registered Placement Point' },
];

export const AdsManager: React.FC<Props> = ({ siteSettings, onUpdateSiteSettings }) => {
  const currentAdsSettings = siteSettings?.adsSettings || {
    adsEnabled: true,
    publisherId: '',
    autoAdsEnabled: false,
    slots: [],
  };

  const [adsEnabled, setAdsEnabled] = useState<boolean>(currentAdsSettings.adsEnabled);
  const [publisherId, setPublisherId] = useState<string>(currentAdsSettings.publisherId || '');
  const [autoAdsEnabled, setAutoAdsEnabled] = useState<boolean>(currentAdsSettings.autoAdsEnabled || false);
  const [slots, setSlots] = useState<AdSlot[]>(currentAdsSettings.slots || []);

  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = () => {
    setValidationError(null);
    if (adsEnabled && !publisherId.trim()) {
      setValidationError('Google AdSense Publisher ID is recommended when ads are enabled.');
    }

    onUpdateSiteSettings({
      adsSettings: {
        adsEnabled,
        publisherId: publisherId.trim(),
        autoAdsEnabled,
        slots,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddNewSlot = () => {
    const newSlot: AdSlot = {
      id: 'slot-' + Date.now(),
      name: 'New Ad Placement',
      provider: 'adsense',
      adUnitId: '',
      format: 'responsive',
      placement: 'between_paragraphs',
      enabled: true,
      deviceVisibility: 'all',
      order: slots.length + 1,
      contentParagraphIndex: 2,
      targeting: {
        showOnHomepage: false,
        showOnPosts: true,
        showOnPages: false,
        showOnCategories: false,
        showOnAuthors: false,
      },
      notes: '',
    };
    setEditingSlot(newSlot);
    setIsCreating(true);
  };

  const handleSaveSlot = (slot: AdSlot) => {
    if (!slot.name.trim()) {
      alert('Please provide an ad slot name.');
      return;
    }
    if (isCreating) {
      setSlots([...slots, slot]);
    } else {
      setSlots(slots.map((s) => (s.id === slot.id ? slot : s)));
    }
    setEditingSlot(null);
    setIsCreating(false);
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm('Are you sure you want to delete this ad slot?')) {
      setSlots(slots.filter((s) => s.id !== id));
    }
  };

  const handleToggleSlot = (id: string) => {
    setSlots(slots.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const handleMoveSlot = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === slots.length - 1)) {
      return;
    }
    const newSlots = [...slots];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSlots[index];
    newSlots[index] = newSlots[targetIndex];
    newSlots[targetIndex] = temp;
    newSlots.forEach((s, idx) => (s.order = idx + 1));
    setSlots(newSlots);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-xs pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="h-7 w-7 text-blue-600" />
            <span>Ads Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure global ad networks, programmatic slots, custom house banners, and precise page targeting rules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNewSlot}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Ad Slot</span>
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Global Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Global Advertisement Status</h3>
            <p className="text-slate-500 mt-0.5">Master toggle to enable or disable all site advertisements instantly</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={adsEnabled}
              onChange={(e) => setAdsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 font-bold text-slate-700">{adsEnabled ? 'Ads Active' : 'Ads Disabled'}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Google AdSense Publisher ID</label>
            <input
              type="text"
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono text-slate-800"
            />
            <p className="text-[11px] text-slate-400">Required for Google AdSense programmatic monetization units.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Google Auto Ads</span>
              <span className="text-slate-500 text-[11px]">Let Google automatically place optimal ads across pages</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdsEnabled}
                onChange={(e) => setAutoAdsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Ad Slots List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Ad Slots ({slots.length})</h3>
            <p className="text-slate-500 mt-0.5">Manage manual slots, placement points, custom banners, and targeting rules</p>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Megaphone className="h-10 w-10 mx-auto text-slate-300" />
            <p>No ad slots configured yet. Click "Add New Ad Slot" to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {slots.map((slot, index) => {
              const placementLabel = PLACEMENT_OPTIONS.find((p) => p.id === slot.placement)?.label || slot.placement;
              return (
                <div key={slot.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold font-mono text-[10px]">
                        #{slot.order}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{slot.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          slot.provider === 'adsense'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : slot.provider === 'custom_image'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-violet-50 text-violet-700 border border-violet-200'
                        }`}
                      >
                        {slot.provider === 'adsense'
                          ? 'Google AdSense'
                          : slot.provider === 'custom_image'
                          ? 'Custom Image Ad'
                          : 'Third Party HTML'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                      <span className="font-medium text-slate-700">Placement: {placementLabel}</span>
                      <span>•</span>
                      <span>Format: {slot.format}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {slot.deviceVisibility === 'desktop' ? (
                          <Monitor className="h-3 w-3" />
                        ) : slot.deviceVisibility === 'mobile' ? (
                          <Smartphone className="h-3 w-3" />
                        ) : (
                          <Globe className="h-3 w-3" />
                        )}
                        <span className="capitalize">{slot.deviceVisibility}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleMoveSlot(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlot(index, 'down')}
                      disabled={index === slots.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={() => handleToggleSlot(slot.id)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlot(slot);
                        setIsCreating(false);
                      }}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors ml-2"
                      title="Edit Slot"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 transition-colors"
                      title="Delete Slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {isCreating ? 'Create New Ad Slot' : `Edit Ad Slot: ${editingSlot.name}`}
              </h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Slot Name</label>
                  <input
                    type="text"
                    value={editingSlot.name}
                    onChange={(e) => setEditingSlot({ ...editingSlot, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                    placeholder="e.g. Header Leaderboard"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Provider</label>
                  <select
                    value={editingSlot.provider}
                    onChange={(e: any) => setEditingSlot({ ...editingSlot, provider: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="adsense">Google AdSense</option>
                    <option value="custom_image">Custom Image & Link Ad</option>
                    <option value="third_party">Third-Party HTML / Banner</option>
                  </select>
                </div>
              </div>

              {editingSlot.provider === 'adsense' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Ad Unit ID / Slot ID</label>
                    <input
                      type="text"
                      value={editingSlot.adUnitId}
                      onChange={(e) => setEditingSlot({ ...editingSlot, adUnitId: e.target.value })}
                      placeholder="e.g. 1234567890"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Ad Format</label>
                    <select
                      value={editingSlot.format}
                      onChange={(e: any) => setEditingSlot({ ...editingSlot, format: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="responsive">Responsive Display</option>
                      <option value="auto">Auto Size</option>
                      <option value="rectangle">Medium Rectangle (300x250)</option>
                      <option value="leaderboard">Leaderboard (728x90)</option>
                      <option value="skyscraper">Skyscraper (160x600)</option>
                      <option value="in-article">In-Article Flow</option>
                    </select>
                  </div>
                </div>
              )}

              {editingSlot.provider === 'custom_image' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800">Custom Banner Settings</h4>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700">Image URL</label>
                    <input
                      type="text"
                      value={editingSlot.customImage?.imageUrl || ''}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          customImage: { ...(editingSlot.customImage || { destinationUrl: '', altText: '' }), imageUrl: e.target.value },
                        })
                      }
                      placeholder="/uploads/banner.webp or https://..."
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-700">Destination URL</label>
                      <input
                        type="text"
                        value={editingSlot.customImage?.destinationUrl || ''}
                        onChange={(e) =>
                          setEditingSlot({
                            ...editingSlot,
                            customImage: { ...(editingSlot.customImage || { imageUrl: '', altText: '' }), destinationUrl: e.target.value },
                          })
                        }
                        placeholder="https://example.com/promo"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-[11px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-700">Alt Text / Caption</label>
                      <input
                        type="text"
                        value={editingSlot.customImage?.altText || ''}
                        onChange={(e) =>
                          setEditingSlot({
                            ...editingSlot,
                            customImage: { ...(editingSlot.customImage || { imageUrl: '', destinationUrl: '' }), altText: e.target.value },
                          })
                        }
                        placeholder="Promotional banner description"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingSlot.provider === 'third_party' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Third-Party HTML / Script Code</label>
                  <textarea
                    rows={4}
                    value={editingSlot.thirdPartyHtml || ''}
                    onChange={(e) => setEditingSlot({ ...editingSlot, thirdPartyHtml: e.target.value })}
                    placeholder="<div>Secure banner or script snippet...</div>"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono text-[11px]"
                  ></textarea>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Placement Location</label>
                  <select
                    value={editingSlot.placement}
                    onChange={(e) => setEditingSlot({ ...editingSlot, placement: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                  >
                    {PLACEMENT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {editingSlot.placement === 'between_paragraphs' && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">After Paragraph Number</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editingSlot.contentParagraphIndex || 2}
                      onChange={(e) => setEditingSlot({ ...editingSlot, contentParagraphIndex: parseInt(e.target.value) || 2 })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Device Visibility</label>
                  <select
                    value={editingSlot.deviceVisibility}
                    onChange={(e: any) => setEditingSlot({ ...editingSlot, deviceVisibility: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="all">All Devices (Desktop, Tablet, Mobile)</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile & Tablet Only</option>
                  </select>
                </div>
              </div>

              {/* Page Targeting Rules */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-800">Page Targeting & Include Rules</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSlot.targeting.showOnHomepage}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          targeting: { ...editingSlot.targeting, showOnHomepage: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Homepage</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSlot.targeting.showOnPosts}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          targeting: { ...editingSlot.targeting, showOnPosts: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Single Posts</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSlot.targeting.showOnPages}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          targeting: { ...editingSlot.targeting, showOnPages: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Static Pages</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSlot.targeting.showOnCategories}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          targeting: { ...editingSlot.targeting, showOnCategories: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Categories & Archives</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 pt-3">
                <label className="font-bold text-slate-700">Administrative Notes</label>
                <input
                  type="text"
                  value={editingSlot.notes || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, notes: e.target.value })}
                  placeholder="Internal notes regarding sponsor or campaign..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveSlot(editingSlot)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Save Ad Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
