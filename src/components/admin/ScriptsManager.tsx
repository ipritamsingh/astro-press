import React, { useState } from 'react';
import { SiteSettings, ScriptIntegration } from '../../types/cms';
import {
  Code,
  Shield,
  Check,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Globe,
  Lock,
  Cpu,
} from 'lucide-react';

interface Props {
  siteSettings?: SiteSettings;
  onUpdateSiteSettings: (settings: Partial<SiteSettings>) => void;
}

export const ScriptsManager: React.FC<Props> = ({ siteSettings, onUpdateSiteSettings }) => {
  const currentScriptsSettings = siteSettings?.scriptsSettings || {
    integrations: [],
    consentBanner: {
      enabled: true,
      noticeText: '',
      privacyPolicyUrl: '/privacy-policy/',
    },
  };

  const [integrations, setIntegrations] = useState<ScriptIntegration[]>(
    currentScriptsSettings.integrations || []
  );
  const [consentBanner, setConsentBanner] = useState(
    currentScriptsSettings.consentBanner || {
      enabled: true,
      noticeText:
        'We use cookies and similar technologies to enhance your experience, analyze site traffic, and serve personalized advertisements.',
      privacyPolicyUrl: '/privacy-policy/',
    }
  );

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [newProviderKey, setNewProviderKey] = useState<ScriptIntegration['providerKey']>('ga4');
  const [newConfigValue, setNewConfigValue] = useState('');

  const handleSave = () => {
    onUpdateSiteSettings({
      scriptsSettings: {
        integrations,
        consentBanner,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((int) => (int.id === id ? { ...int, enabled: !int.enabled } : int))
    );
  };

  const handleUpdateConfigValue = (id: string, val: string) => {
    setIntegrations(
      integrations.map((int) => (int.id === id ? { ...int, configValue: val } : int))
    );
  };

  const handleAddIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntegrationName.trim()) return;

    const newInt: ScriptIntegration = {
      id: 'int-' + Date.now(),
      name: newIntegrationName.trim(),
      providerKey: newProviderKey,
      enabled: true,
      configValue: newConfigValue.trim(),
      placement: 'head',
      consentCategory: newProviderKey === 'ga4' ? 'analytics' : 'advertising',
      notes: 'Custom integration script',
    };

    setIntegrations([...integrations, newInt]);
    setNewIntegrationName('');
    setNewConfigValue('');
  };

  const handleDeleteIntegration = (id: string) => {
    if (confirm('Are you sure you want to remove this integration?')) {
      setIntegrations(integrations.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-xs pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Cpu className="h-7 w-7 text-indigo-600" />
            <span>Scripts & Integrations Manager</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Securely configure Google Analytics 4, Tag Manager, Meta Pixel, verification tags, and privacy consent banners
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Integrations List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Analytics & Tracking Integrations</h3>
            <p className="text-slate-500 mt-0.5">Scripts are rendered securely in the document head or body once enabled</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {integrations.map((int) => (
            <div key={int.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-bold text-slate-900 text-sm">{int.name}</h4>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
                    {int.providerKey}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                    Consent: {int.consentCategory}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={int.configValue}
                    onChange={(e) => handleUpdateConfigValue(int.id, e.target.value)}
                    placeholder={
                      int.providerKey === 'ga4'
                        ? 'G-XXXXXXXXXX'
                        : int.providerKey === 'adsense'
                        ? 'ca-pub-XXXXXXXXXXXXXXXX'
                        : int.providerKey === 'verification'
                        ? 'google-site-verification=...'
                        : 'Container ID / Script value'
                    }
                    className="w-full sm:max-w-md p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                  {int.notes && <span className="text-slate-400 text-[11px] hidden lg:inline">{int.notes}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={int.enabled}
                    onChange={() => handleToggleIntegration(int.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 font-medium text-slate-700">{int.enabled ? 'Enabled' : 'Disabled'}</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleDeleteIntegration(int.id)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 transition-colors ml-2"
                  title="Remove Integration"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Integration Form */}
        <form onSubmit={handleAddIntegration} className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <h4 className="font-bold text-slate-800">Add Custom Script Integration</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newIntegrationName}
              onChange={(e) => setNewIntegrationName(e.target.value)}
              placeholder="Integration Name (e.g. Hotjar)"
              className="p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 font-medium"
            />
            <select
              value={newProviderKey}
              onChange={(e: any) => setNewProviderKey(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 font-medium"
            >
              <option value="ga4">Google Analytics 4</option>
              <option value="gtm">Google Tag Manager</option>
              <option value="metaPixel">Meta Pixel</option>
              <option value="verification">Site Verification Tag</option>
              <option value="customHead">Custom Head Script</option>
            </select>
            <input
              type="text"
              value={newConfigValue}
              onChange={(e) => setNewConfigValue(e.target.value)}
              placeholder="Configuration ID or value"
              className="p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Integration</span>
          </button>
        </form>
      </div>

      {/* Consent & Privacy Banner Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Privacy & Cookie Consent Banner</h3>
            <p className="text-slate-500 mt-0.5">Complies with GDPR/CCPA by blocking non-essential analytics and advertising until consent is granted</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={consentBanner.enabled}
              onChange={(e) => setConsentBanner({ ...consentBanner, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 font-bold text-slate-700">{consentBanner.enabled ? 'Active' : 'Hidden'}</span>
          </label>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Consent Notice Text</label>
            <textarea
              rows={3}
              value={consentBanner.noticeText}
              onChange={(e) => setConsentBanner({ ...consentBanner, noticeText: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Privacy Policy Link URL</label>
            <input
              type="text"
              value={consentBanner.privacyPolicyUrl}
              onChange={(e) => setConsentBanner({ ...consentBanner, privacyPolicyUrl: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
