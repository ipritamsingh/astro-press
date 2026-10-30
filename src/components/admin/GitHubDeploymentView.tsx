import React, { useState, useEffect, useMemo } from 'react';
import {
  Post,
  Page,
  GitCommitRecord,
  DeploymentSettings,
  HeroSectionConfig,
  ThemeSettings,
  SiteSettings,
  Category,
  Tag,
  Author,
  MediaItem,
  Menu,
} from '../../types/cms';
import {
  checkGitHubConnection,
  executeFullRepositoryPush,
  verifyEdgeEnvironment,
  detectPendingChanges,
  validateContentBeforePush,
  ConnectionStatus,
  EdgeEnvironmentStatus,
  PendingChangesSummary,
  PendingChangeItem,
  ContentValidationIssue,
} from '../../data/githubPublishService';
import {
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  Server,
  Cloud,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Clock,
  Layers,
  FileText,
  Save,
  Check,
  Lock,
  Eye,
  EyeOff,
  Key,
  HelpCircle,
  ArrowRight,
  UploadCloud,
  X,
  Search,
  FilePlus,
  FileDiff,
  Trash2,
  Filter,
  CheckCircle,
} from 'lucide-react';

interface Props {
  posts: Post[];
  pages: Page[];
  deploymentSettings: DeploymentSettings;
  commitHistory: GitCommitRecord[];
  heroConfig?: HeroSectionConfig;
  themeSettings?: ThemeSettings;
  siteSettings?: SiteSettings;
  categories?: Category[];
  tags?: Tag[];
  authors?: Author[];
  media?: MediaItem[];
  menus?: Menu[];
  onUpdateDeploymentSettings: (settings: Partial<DeploymentSettings>) => void;
  onRecordCommit: (message: string) => void;
  onUpdateGithubSyncStatus?: (status: 'Connected' | 'Syncing' | 'Error' | 'Disconnected') => void;
  onSyncRemoteCMS?: () => Promise<boolean>;
}

export const GitHubDeploymentView: React.FC<Props> = ({
  posts,
  pages,
  deploymentSettings,
  commitHistory,
  heroConfig,
  themeSettings,
  siteSettings,
  categories,
  tags,
  authors,
  media,
  menus,
  onUpdateDeploymentSettings,
  onRecordCommit,
  onUpdateGithubSyncStatus,
  onSyncRemoteCMS,
}) => {
  const initialRepoString = deploymentSettings.githubRepo || 'ipritamsingh/astro-press';
  const [initialOwner, initialRepoName] = initialRepoString.split('/');

  const [owner, setOwner] = useState(initialOwner || 'ipritamsingh');
  const [repoName, setRepoName] = useState(initialRepoName || 'astro-press');
  const [branch, setBranch] = useState(deploymentSettings.githubBranch || 'main');
  const initialWorker =
    deploymentSettings.cloudflareWorkerUrl?.includes('sveltia-authenticator') ||
    deploymentSettings.cloudflareWorkerUrl?.includes('authenticator.workers.dev')
      ? ''
      : deploymentSettings.cloudflareWorkerUrl || '';

  const [workerUrl, setWorkerUrl] = useState(initialWorker);
  const [cloudflarePagesProject, setCloudflarePagesProject] = useState(
    deploymentSettings.cloudflarePagesProject || 'astropress'
  );
  const [productionUrl, setProductionUrl] = useState(deploymentSettings.productionUrl || 'https://astro-press.pages.dev');
  const [autoDeploy, setAutoDeploy] = useState(Boolean(deploymentSettings.autoDeployOnPublish));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Server-Side Edge Environment Status
  const [edgeEnvStatus, setEdgeEnvStatus] = useState<EdgeEnvironmentStatus | null>(null);
  const [isVerifyingEnv, setIsVerifyingEnv] = useState(false);

  // Pending Changes State
  const [pendingChanges, setPendingChanges] = useState<PendingChangesSummary | null>(null);
  const [isScanningChanges, setIsScanningChanges] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'post' | 'page' | 'data' | 'media'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable Commit Message
  const [customCommitMessage, setCustomCommitMessage] = useState('');
  const [userEditedMessage, setUserEditedMessage] = useState(false);

  // Batch Push & Full Sync State
  const [isPublishingBatch, setIsPublishingBatch] = useState(false);
  const [isPullingRemote, setIsPullingRemote] = useState(false);
  const [pullMessage, setPullMessage] = useState<string | null>(null);
  const [pushProgress, setPushProgress] = useState<{
    current: number;
    total: number;
    filePath: string;
    status: 'pushing' | 'done' | 'error';
  } | null>(null);

  const [pushResultSummary, setPushResultSummary] = useState<{
    success: boolean;
    totalPushed: number;
    totalFiles: number;
    modifiedFiles?: string[];
    commitSha?: string;
    commitUrl?: string;
    targetBranch?: string;
    verifiedRootFiles?: string[];
    message: string;
    noChanges?: boolean;
    failedFiles?: { path: string; error: string }[];
    validationErrors?: ContentValidationIssue[];
    diagnostics?: any;
  } | null>(null);

  // Auto-scan environment and changes on mount or when repo settings change
  useEffect(() => {
    handleVerifyEdgeEnvironment();
    handleScanPendingChanges();
  }, [owner, repoName, branch]);

  // Generate smart default commit message whenever pending changes change, if user hasn't typed custom
  useEffect(() => {
    if (!userEditedMessage && pendingChanges) {
      if (pendingChanges.totalChangedCount === 0) {
        setCustomCommitMessage(`chore(sync): synchronize content with ${branch}`);
      } else {
        const topTypes: string[] = [];
        if (pendingChanges.additionsCount > 0) topTypes.push(`+${pendingChanges.additionsCount} added`);
        if (pendingChanges.modificationsCount > 0) topTypes.push(`~${pendingChanges.modificationsCount} updated`);
        if (pendingChanges.deletionsCount > 0) topTypes.push(`-${pendingChanges.deletionsCount} removed`);
        setCustomCommitMessage(
          `feat(content): synchronize ${pendingChanges.totalChangedCount} files (${topTypes.join(', ')}) [${branch}]`
        );
      }
    }
  }, [pendingChanges, userEditedMessage, branch]);

  const handleVerifyEdgeEnvironment = async () => {
    setIsVerifyingEnv(true);
    try {
      const status = await verifyEdgeEnvironment({
        owner: owner.trim(),
        repoName: repoName.trim(),
        branch: branch.trim() || 'main',
        workerProxyUrl: workerUrl.trim() || undefined,
      });
      setEdgeEnvStatus(status);
      if (onUpdateGithubSyncStatus) {
        if (status.status === 'verified') {
          onUpdateGithubSyncStatus('Connected');
        } else if (status.status === 'auth_failed' || status.status === 'missing_config') {
          onUpdateGithubSyncStatus('Disconnected');
        } else {
          onUpdateGithubSyncStatus('Error');
        }
      }
    } catch (err: any) {
      setEdgeEnvStatus({
        configured: false,
        authenticated: false,
        status: 'network_error',
        message: `Verification network error: ${err.message || 'Unknown network error'}`,
        latencyMs: 0,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsVerifyingEnv(false);
    }
  };

  const handleScanPendingChanges = async () => {
    setIsScanningChanges(true);
    try {
      const summary = await detectPendingChanges({
        posts,
        pages,
        deploymentSettings: {
          ...deploymentSettings,
          githubRepo: `${owner.trim()}/${repoName.trim()}`,
          githubBranch: branch.trim() || 'main',
          cloudflareWorkerUrl: workerUrl.trim() || '',
        },
        heroConfig,
        themeSettings,
        siteSettings,
        categories,
        tags,
        authors,
        media,
        menus,
      });
      setPendingChanges(summary);
    } catch (err: any) {
      console.warn('[handleScanPendingChanges] Error:', err);
    } finally {
      setIsScanningChanges(false);
    }
  };

  const handleBatchPushToGitHub = async () => {
    // 1. Guard against pre-push validation errors
    const validation = validateContentBeforePush(posts, pages);
    if (!validation.valid) {
      setPushResultSummary({
        success: false,
        totalPushed: 0,
        totalFiles: 0,
        failedFiles: validation.issues.map((i) => ({ path: i.filePath, error: i.message })),
        validationErrors: validation.issues,
        message: `Content validation failed before pushing. ${validation.issues.length} issue(s) detected in frontmatter or slug schemas.`,
      });
      return;
    }

    setIsPublishingBatch(true);
    setPushResultSummary(null);
    setPushProgress({ current: 0, total: 1, filePath: 'Preparing files for sync...', status: 'pushing' });

    if (onUpdateGithubSyncStatus) {
      onUpdateGithubSyncStatus('Syncing');
    }

    try {
      const settings: DeploymentSettings = {
        githubRepo: `${owner.trim()}/${repoName.trim()}`,
        githubBranch: branch.trim() || 'main',
        cloudflareWorkerUrl: workerUrl.trim(),
        cloudflarePagesProject: cloudflarePagesProject.trim() || 'astropress',
        productionUrl: productionUrl.trim(),
        autoDeployOnPublish: autoDeploy,
      };

      const result = await executeFullRepositoryPush({
        posts,
        pages,
        heroConfig,
        themeSettings,
        siteSettings,
        categories,
        tags,
        authors,
        media,
        menus,
        deploymentSettings: settings,
        customCommitMessage: customCommitMessage.trim() || undefined,
        onProgress: (info) => {
          setPushProgress(info);
        },
      });

      setPushResultSummary(result);

      if (result.success) {
        if (onUpdateGithubSyncStatus) onUpdateGithubSyncStatus('Connected');
        const commitMsg = customCommitMessage.trim() || `feat(deploy): pushed ${result.totalPushed} files to ${branch}`;
        onRecordCommit(commitMsg);
        // Refresh scan after successful push
        setTimeout(() => handleScanPendingChanges(), 1000);
      } else {
        if (onUpdateGithubSyncStatus) onUpdateGithubSyncStatus('Error');
      }
    } catch (err: any) {
      if (onUpdateGithubSyncStatus) onUpdateGithubSyncStatus('Error');
      setPushResultSummary({
        success: false,
        totalPushed: 0,
        totalFiles: 0,
        failedFiles: [{ path: 'push', error: err.message || 'Unknown network error' }],
        message: `Sync operation failed: ${err.message || 'Unknown network error'}`,
      });
    } finally {
      setIsPublishingBatch(false);
    }
  };

  const handlePullRemoteCMS = async () => {
    setIsPullingRemote(true);
    setPullMessage(null);
    try {
      if (onSyncRemoteCMS) {
        const success = await onSyncRemoteCMS();
        setPullMessage(success ? 'Successfully synchronized latest Live CMS content!' : 'CMS content is already up to date.');
        handleScanPendingChanges();
      } else {
        setPullMessage('Sync complete.');
      }
      setTimeout(() => setPullMessage(null), 4000);
    } catch (err: any) {
      setPullMessage(`Sync warning: ${err.message || 'Check network connection'}`);
      setTimeout(() => setPullMessage(null), 4000);
    } finally {
      setIsPullingRemote(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const fullRepo = `${owner.trim()}/${repoName.trim()}`;

    onUpdateDeploymentSettings({
      githubRepo: fullRepo,
      githubBranch: branch.trim() || 'main',
      productionUrl: productionUrl.trim(),
      cloudflarePagesProject: cloudflarePagesProject.trim(),
      cloudflareWorkerUrl: workerUrl.trim(),
      autoDeployOnPublish: autoDeploy,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Filtered pending changes
  const filteredChanges = useMemo(() => {
    if (!pendingChanges) return [];
    return pendingChanges.changes.filter((c) => {
      const matchesFilter = selectedFilter === 'all' || c.category === selectedFilter;
      const matchesSearch = !searchQuery || c.path.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [pendingChanges, selectedFilter, searchQuery]);

  const lastCommit = commitHistory[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-purple-600" />
            <span>GitHub & Deployment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic Git Data API commits, server-side secret isolation, and Cloudflare Pages edge build integration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePullRemoteCMS}
            disabled={isPullingRemote}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-colors disabled:opacity-50 border border-slate-300"
            title="Pull latest live CMS posts, pages, and media from GitHub repository"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isPullingRemote ? 'animate-spin' : ''}`} />
            <span>{isPullingRemote ? 'Pulling...' : 'Pull Live Content'}</span>
          </button>

          <button
            onClick={handleVerifyEdgeEnvironment}
            disabled={isVerifyingEnv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            title="Verify server-side GITHUB_PAT secret, repo access, and write permissions"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${isVerifyingEnv ? 'animate-spin' : ''}`} />
            <span>{isVerifyingEnv ? 'Verifying Edge...' : 'Verify Edge Environment'}</span>
          </button>

          <button
            onClick={handleBatchPushToGitHub}
            disabled={isPublishingBatch || (pendingChanges?.hasValidationErrors ?? false)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all disabled:opacity-50 cursor-pointer ${
              pendingChanges?.hasValidationErrors
                ? 'bg-rose-600 cursor-not-allowed'
                : pushResultSummary?.success
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-95'
            }`}
          >
            <UploadCloud className={`h-4 w-4 ${isPublishingBatch ? 'animate-spin' : ''}`} />
            <span>
              {isPublishingBatch
                ? 'Pushing...'
                : pendingChanges?.hasValidationErrors
                ? 'Resolve Validation Errors'
                : pushResultSummary?.success
                ? 'Push Complete!'
                : 'Commit & Push Changes'}
            </span>
          </button>
        </div>
      </div>

      {/* Pull Feedback Toast */}
      {pullMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{pullMessage}</span>
          <button onClick={() => setPullMessage(null)} className="text-blue-500 hover:text-blue-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Server-Side Edge Environment & Security Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              edgeEnvStatus?.status === 'verified'
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
                : edgeEnvStatus?.status === 'missing_config'
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                : 'bg-purple-500/20 border-purple-400/30 text-purple-300'
            }`}>
              {edgeEnvStatus?.status === 'verified' ? (
                <ShieldCheck className="h-6 w-6" />
              ) : edgeEnvStatus?.status === 'missing_config' ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <Server className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Server-Side GitHub Environment</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  edgeEnvStatus?.status === 'verified'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                    : edgeEnvStatus?.status === 'missing_config'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {edgeEnvStatus?.status === 'verified'
                    ? 'Verified & Ready'
                    : edgeEnvStatus?.status === 'missing_config'
                    ? 'Secret Missing'
                    : edgeEnvStatus?.status || 'Unverified'}
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Target: <code className="font-mono text-purple-300 font-bold">{owner}/{repoName}</code> on branch <code className="font-mono text-purple-300 font-bold">{branch}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleVerifyEdgeEnvironment}
              disabled={isVerifyingEnv}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isVerifyingEnv ? 'animate-spin' : ''}`} />
              <span>{isVerifyingEnv ? 'Testing...' : 'Re-verify'}</span>
            </button>
          </div>
        </div>

        {/* Verification Diagnostic Strip */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">GITHUB_PAT Secret</span>
            <div className="flex items-center gap-1.5 font-bold">
              {edgeEnvStatus?.configured ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Encrypted Server-Side</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-amber-700">Not Configured</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admin Session</span>
            <div className="flex items-center gap-1.5 font-bold">
              {edgeEnvStatus?.authenticated ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">D1 Session Valid</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span className="text-rose-700">Auth Required</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Upstream Repository</span>
            <div className="flex items-center gap-1.5 font-bold">
              {edgeEnvStatus?.repoExists ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{edgeEnvStatus.hasPushPermission ? 'Push Access Granted' : 'Read Only'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-500">{edgeEnvStatus ? 'Repo Unreachable' : 'Pending Test'}</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Branch & Latency</span>
            <div className="flex items-center justify-between font-mono text-slate-700">
              <span className="font-bold text-slate-900 truncate">{branch}</span>
              <span className="text-[10px] text-slate-500">{edgeEnvStatus?.latencyMs ? `${edgeEnvStatus.latencyMs}ms` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Informative message if not verified */}
        {edgeEnvStatus && edgeEnvStatus.status !== 'verified' && (
          <div className={`p-4 border-t text-xs font-medium flex items-start gap-3 ${
            edgeEnvStatus.status === 'missing_config'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1">
              <strong className="block font-bold">Edge Configuration Notice:</strong>
              <p className="leading-relaxed">{edgeEnvStatus.message}</p>
              {edgeEnvStatus.status === 'missing_config' && (
                <div className="mt-2 text-[11px] font-mono bg-white/70 p-2 rounded-lg border border-amber-200 text-amber-900">
                  <strong>Resolution:</strong> Set <code className="font-bold">GITHUB_PAT</code> as a Cloudflare Pages encrypted secret in Cloudflare Dashboard → Settings → Environment Variables.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Progress Bar Card during Push */}
      {isPublishingBatch && (
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-purple-800/50 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30">
                <RefreshCw className="h-6 w-6 text-purple-300 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Pushing Repository Files to GitHub...</span>
                  <span className="text-xs font-mono bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                    {pushProgress ? `${Math.round((pushProgress.current / pushProgress.total) * 100)}%` : '0%'}
                  </span>
                </h3>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Committing to <code className="font-mono text-purple-300 font-bold">{owner}/{repoName}</code> ({branch}) using Atomic Git Data API
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-purple-500/20 self-start sm:self-auto">
              {pushProgress ? `Step ${pushProgress.current} of ${pushProgress.total}` : 'Initializing...'}
            </span>
          </div>

          {/* Progress Bar Track */}
          {pushProgress && (
            <div className="space-y-2">
              <div className="w-full bg-slate-950/70 rounded-full h-3 overflow-hidden border border-purple-500/20 p-0.5">
                <div
                  className="bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, (pushProgress.current / pushProgress.total) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-purple-300/90 font-mono">
                <span className="truncate max-w-lg">Action: <code className="text-white">{pushProgress.filePath}</code></span>
                <span>{pushProgress.status === 'pushing' ? 'Syncing...' : 'Complete'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Push Result Summary Feedback Card */}
      {pushResultSummary && !isPublishingBatch && (
        <div
          className={`rounded-2xl p-5 border shadow-lg space-y-4 transition-all ${
            pushResultSummary.success
              ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-900 bg-white'
              : 'bg-rose-950/10 border-rose-500/30 text-rose-900 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  pushResultSummary.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {pushResultSummary.success ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {pushResultSummary.success
                    ? 'GitHub Commit & Push Completed Successfully!'
                    : 'Push Operation Failed'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{pushResultSummary.message}</p>
              </div>
            </div>

            <button
              onClick={() => setPushResultSummary(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* CRITICAL EXPLANATION: Webhook triggered Cloudflare build asynchronously */}
          {pushResultSummary.success && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1.5 font-sans">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Cloud className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Cloudflare Pages Build Triggered via GitHub Webhook</span>
              </div>
              <p className="text-blue-700 leading-relaxed text-[11px]">
                Your commit was successfully accepted by GitHub on branch <code className="font-mono font-bold bg-blue-100 px-1 py-0.2 rounded text-blue-900">{pushResultSummary.targetBranch || branch}</code>. This triggers a separate, asynchronous Cloudflare Pages build. Please note that the live website will update once Cloudflare finishes building (~45-90 seconds).
              </p>
            </div>
          )}

          {pushResultSummary.success && (
            <div className="pt-3 border-t border-slate-200 space-y-3 text-xs font-mono text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                    {pushResultSummary.noChanges
                      ? '✓ All Files Up-to-Date (0 Pushes, 0 Cloudflare Builds)'
                      : `✓ ${pushResultSummary.totalPushed} Files Pushed (1 Atomic Push • 1 Cloudflare Build)`}
                  </span>
                  <span>
                    Repo: <strong>{owner}/{repoName}</strong> ({pushResultSummary.targetBranch || branch})
                  </span>
                  {pushResultSummary.commitSha && !pushResultSummary.noChanges && (
                    <span>
                      Commit SHA:{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-700 font-bold">
                        {pushResultSummary.commitSha.substring(0, 7)}
                      </code>
                    </span>
                  )}
                </div>

                {pushResultSummary.commitUrl ? (
                  <a
                    href={pushResultSummary.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
                  >
                    <span>View Commit on GitHub</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <a
                    href={`https://github.com/${owner}/${repoName}/commits/${branch}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    <span>View Repository Commits</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {pushResultSummary.modifiedFiles && pushResultSummary.modifiedFiles.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-sans">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                    <span>Files Included in Atomic Commit ({pushResultSummary.modifiedFiles.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                    {pushResultSummary.modifiedFiles.map((file, idx) => (
                      <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Failed files breakdown */}
          {pushResultSummary.failedFiles && pushResultSummary.failedFiles.length > 0 && (
            <div className="pt-2 border-t border-rose-200 space-y-2 text-xs">
              <span className="font-bold text-rose-800">Errors encountered:</span>
              <ul className="list-disc pl-5 space-y-0.5 text-rose-700 font-mono text-[11px]">
                {pushResultSummary.failedFiles.map((f, idx) => (
                  <li key={idx}>
                    <strong>{f.path}</strong>: {f.error}
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <button
                  onClick={handleBatchPushToGitHub}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                >
                  Retry Push
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Changes & Atomic Commit Staging Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileDiff className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Pending Changes & Staging Area</h3>
              {pendingChanges && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold font-mono">
                  {pendingChanges.totalChangedCount} files changed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live comparison against remote Git tree on branch <code className="font-mono text-purple-600">{branch}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanPendingChanges}
              disabled={isScanningChanges}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanningChanges ? 'animate-spin' : ''}`} />
              <span>{isScanningChanges ? 'Scanning Tree...' : 'Refresh Changes'}</span>
            </button>
          </div>
        </div>

        {/* Changes Summary Pills */}
        {pendingChanges && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Changed</span>
              <strong className="text-base text-slate-900 font-mono">{pendingChanges.totalChangedCount}</strong>
            </div>
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">+ Additions</span>
              <strong className="text-base text-emerald-700 font-mono">+{pendingChanges.additionsCount}</strong>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">~ Modifications</span>
              <strong className="text-base text-blue-700 font-mono">~{pendingChanges.modificationsCount}</strong>
            </div>
            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">- Deletions</span>
              <strong className="text-base text-rose-700 font-mono">-{pendingChanges.deletionsCount}</strong>
            </div>
          </div>
        )}

        {/* Validation Warning Banner if errors exist */}
        {pendingChanges?.hasValidationErrors && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900 text-xs">
            <div className="font-bold flex items-center gap-2 text-rose-800">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Pre-Push Content Validation Failed ({pendingChanges.validationErrors.length} Issue(s))</span>
            </div>
            <p className="text-rose-700 leading-relaxed text-[11px]">
              To protect your production build on Cloudflare Pages, atomic push is paused until the following schema issues are resolved:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-rose-800">
              {pendingChanges.validationErrors.map((err, idx) => (
                <li key={idx}>
                  <strong>{err.filePath}</strong> ({err.field}): {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Files ({pendingChanges?.changes.length || 0})
            </button>
            <button
              onClick={() => setSelectedFilter('post')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'post'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Posts ({pendingChanges?.changes.filter((c) => c.category === 'post').length || 0})
            </button>
            <button
              onClick={() => setSelectedFilter('page')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'page'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Pages ({pendingChanges?.changes.filter((c) => c.category === 'page').length || 0})
            </button>
            <button
              onClick={() => setSelectedFilter('data')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'data'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Data Configs ({pendingChanges?.changes.filter((c) => c.category === 'data').length || 0})
            </button>
            <button
              onClick={() => setSelectedFilter('media')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'media'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Media ({pendingChanges?.changes.filter((c) => c.category === 'media').length || 0})
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by path..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {/* Pending Changes Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {filteredChanges.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-700 text-xs">All Content Synchronized</div>
              <p className="text-[11px] text-slate-400">
                No uncommitted additions or modifications detected against branch <code>{branch}</code>.
              </p>
            </div>
          ) : (
            filteredChanges.map((file, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 uppercase tracking-wider ${
                      file.type === 'added'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : file.type === 'modified'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {file.type === 'added' ? '[Added]' : file.type === 'modified' ? '[Modified]' : '[Deleted]'}
                  </span>

                  <span className="font-mono text-[11px] text-slate-800 truncate" title={file.path}>
                    {file.path}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[11px]">
                  {file.sizeBytes !== undefined && file.sizeBytes > 0 && (
                    <span className="text-slate-400 font-mono text-[10px]">
                      {(file.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  )}

                  {file.isValid ? (
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                      <Check className="h-3 w-3" />
                      <span>Schema Valid</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold" title={file.validationError}>
                      <AlertCircle className="h-3 w-3" />
                      <span>Invalid</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Editable Commit Message Input Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <GitCommit className="h-4 w-4 text-purple-600" />
              <span>Editable Commit Message</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setUserEditedMessage(false);
                  if (pendingChanges) {
                    setCustomCommitMessage(
                      `feat(content): synchronize ${pendingChanges.totalChangedCount} files [${branch}]`
                    );
                  }
                }}
                className="text-[10px] text-purple-600 hover:text-purple-800 font-bold hover:underline"
              >
                Reset Default
              </button>
            </div>
          </div>

          <input
            type="text"
            value={customCommitMessage}
            onChange={(e) => {
              setCustomCommitMessage(e.target.value);
              setUserEditedMessage(true);
            }}
            placeholder="e.g. feat(content): publish new guide on AstroPress"
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs outline-none focus:border-purple-500 text-slate-900 shadow-2xs"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>This message will be permanently recorded in your GitHub repository Git log.</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Quick presets:</span>
              <button
                type="button"
                onClick={() => {
                  setCustomCommitMessage(`feat(content): update articles and documentation [${branch}]`);
                  setUserEditedMessage(true);
                }}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px]"
              >
                Articles
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomCommitMessage(`chore(config): update navigation, categories and site settings`);
                  setUserEditedMessage(true);
                }}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px]"
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Atomic Commit Guarantee:</span> All modified files are bundled into 1 Git tree and 1 commit. Only 1 Cloudflare Pages webhook build is triggered.
          </div>

          <button
            onClick={handleBatchPushToGitHub}
            disabled={isPublishingBatch || (pendingChanges?.hasValidationErrors ?? false)}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
              pendingChanges?.hasValidationErrors
                ? 'bg-rose-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-95'
            }`}
          >
            <UploadCloud className={`h-4 w-4 ${isPublishingBatch ? 'animate-spin' : ''}`} />
            <span>
              {isPublishingBatch
                ? 'Pushing Changes to GitHub...'
                : pendingChanges?.hasValidationErrors
                ? 'Blocked: Fix Validation Errors'
                : 'Commit & Push Changes to GitHub'}
            </span>
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">GitHub Repository & Cloudflare Settings</h3>
            <span className="text-xs text-slate-500">
              Configure target repository, production branch, and edge deployment settings
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saveSuccess ? 'Settings Saved!' : 'Save Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Owner */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              GitHub Repository Owner / Org <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. ipritamsingh"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Repo Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Repository Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g. astro-press"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Target Branch <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Production branch connected to Cloudflare Pages webhook build.
            </span>
          </div>

          {/* Cloudflare Pages Project Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Cloudflare Pages Project Name
            </label>
            <input
              type="text"
              value={cloudflarePagesProject}
              onChange={(e) => setCloudflarePagesProject(e.target.value)}
              placeholder="e.g. astropress"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Project name from Cloudflare dashboard.
            </span>
          </div>

          {/* Production URL */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Production Website URL (Cloudflare Pages URL)
            </label>
            <input
              type="url"
              value={productionUrl}
              onChange={(e) => setProductionUrl(e.target.value)}
              placeholder="https://astro-press.pages.dev"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Live website deployed on Cloudflare Pages edge.
            </span>
          </div>
        </div>

        {/* Auto Deploy Checkbox */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <input
            type="checkbox"
            id="autoDeploy"
            checked={autoDeploy}
            onChange={(e) => setAutoDeploy(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-slate-300"
          />
          <label htmlFor="autoDeploy" className="font-medium text-slate-700 text-xs cursor-pointer">
            Trigger Cloudflare Pages build automatically upon publishing individual posts or pages
          </label>
        </div>
      </form>

      {/* Security & PAT Isolation Guide */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
          <Key className="h-4 w-4" />
          <span>Server-Side Secret Architecture & Minimum Scopes</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The GitHub Personal Access Token (<code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">GITHUB_PAT</code>) is managed strictly on the server-side edge function. It is never transmitted to the browser, never logged in client bundles, and never returned in API responses.
        </p>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li><strong>Repository Access</strong>: Only select repositories → Select your AstroPress repository.</li>
          <li><strong>Repository Permissions</strong>: <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">Contents: Read and write</code> (for Git trees, blobs, commits, and refs).</li>
          <li><strong>Metadata</strong>: <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">Read-only</code> (default).</li>
        </ul>
        <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
          <span>Set encrypted secret via: <code className="text-purple-300">wrangler secret put GITHUB_PAT</code></span>
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Create Fine-grained PAT</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Commit History / Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Production Commit Audit Log ({branch})</h3>
          </div>
          <span className="text-xs text-slate-400">{commitHistory.length} commits recorded</span>
        </div>

        <div className="divide-y divide-slate-100">
          {commitHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-400">No commits recorded yet.</div>
          ) : (
            commitHistory.map((c) => (
              <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <code className="text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded font-bold text-[11px] shrink-0">
                    {c.id}
                  </code>
                  <span className="font-semibold text-slate-800 truncate">{c.message}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                  <span>{c.author.split('<')[0]}</span>
                  <span>•</span>
                  <span>{c.timestamp}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {c.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
