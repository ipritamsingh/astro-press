import React, { useState } from 'react';
import { AccountSecurityManager } from '../auth/AccountSecurityManager';
import {
  Users,
  Shield,
  Key,
  GitBranch,
  Lock,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';

interface Props {
  onAuthStateChange?: () => void;
  onNavigateToAuthors?: () => void;
  defaultTab?: 'accounts' | 'roles';
}

export const UsersAccessManager: React.FC<Props> = ({
  onAuthStateChange = () => {},
  onNavigateToAuthors,
  defaultTab = 'accounts',
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'roles'>(defaultTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-xs pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Users & Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative user accounts, security credentials, emergency recovery keys, and Git-backed access permissions.
          </p>
        </div>

        {onNavigateToAuthors && (
          <button
            type="button"
            onClick={onNavigateToAuthors}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto border border-slate-200"
            title="Switch to author and public profile management"
          >
            <span>Authors & Profiles</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'accounts'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>User Accounts & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          <span>Roles & Access Control</span>
        </button>
      </div>

      {/* Tab 1: User Accounts & Admin Security */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <AccountSecurityManager onAuthStateChange={onAuthStateChange} />
        </div>
      )}

      {/* Tab 2: Access Control, Roles & Permissions */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">Git-Backed Security Architecture</strong>
              <p className="text-blue-800 leading-relaxed">
                AstroPress access control operates on Git-backed authorization. Publishing rights and CMS access map
                to repository collaborator roles, guaranteeing tamper-proof audit trails for every publication.
              </p>
            </div>
          </div>

          {/* Role Definitions Cards */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <Shield className="h-4 w-4" />
              <span>System Permission Roles</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      <span>Administrator</span>
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Full Access
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Unrestricted administrative authority across codebase, site settings, theme customizations, user accounts, and Cloudflare Pages deployments.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-700 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Direct Git Main Branch Push</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Security & Credential Management</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-emerald-400" />
                      <span>Editor</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Publishing
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Create, edit, review, and publish articles directly to the live site via Sveltia CMS and GitHub content commits.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-700 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Post & Media Management</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Lock className="h-3 w-3 text-slate-500" />
                    <span>Restricted System Settings</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      <span>Contributor</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Drafts
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Submit draft articles and media uploads into editorial review workflow. Cannot publish directly to the live site.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-700 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Draft Article Authoring</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Lock className="h-3 w-3 text-slate-500" />
                    <span>Requires Editorial Approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Access Permissions Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Permissions Matrix</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of capability grants across the three access tiers.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="py-3 px-4 font-bold">Capability / Resource</th>
                    <th className="py-3 px-4 font-bold text-center">Administrator</th>
                    <th className="py-3 px-4 font-bold text-center">Editor</th>
                    <th className="py-3 px-4 font-bold text-center">Contributor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Publish Articles to Live Site</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center text-slate-400">Draft Only</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Upload Media to Cloudflare CDN</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Manage Comments & Moderation</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Theme Customizer & Layouts</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">GitHub Bulk Commit & Deployment</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">User Accounts & Security Settings</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full</td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
