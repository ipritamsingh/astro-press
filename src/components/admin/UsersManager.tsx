import React, { useState } from 'react';
import { Author, Post, MediaItem } from '../../types/cms';
import {
  Users,
  Shield,
  Plus,
  GitBranch,
  Key,
  CheckCircle,
  ExternalLink,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserPlus,
  X,
  Sparkles,
  Lock,
  ChevronDown,
  Edit3,
  Search,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  BookOpen,
  Eye,
  Check,
} from 'lucide-react';

interface Props {
  authors: Author[];
  posts?: Post[];
  mediaLibrary?: MediaItem[];
  onAddAuthor?: (author: Author) => void;
  onSaveAuthor?: (author: Author) => void;
  onUpdateAuthorRole?: (id: string, role: string) => void;
  onDeleteAuthor?: (id: string) => void;
  onNavigateToSecurity?: () => void;
  currentUserEmail?: string;
  siteUrl?: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
];

export const UsersManager: React.FC<Props> = ({
  authors,
  posts = [],
  mediaLibrary = [],
  onAddAuthor,
  onSaveAuthor,
  onUpdateAuthorRole,
  onDeleteAuthor,
  onNavigateToSecurity,
  currentUserEmail,
  siteUrl = 'https://astro-press.pages.dev',
}) => {
  const [activeTab, setActiveTab] = useState<'authors' | 'security'>('authors');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  // Form State for Add / Edit
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formRole, setFormRole] = useState<'Administrator' | 'Editor' | 'Contributor'>('Administrator');
  const [formBio, setFormBio] = useState('');
  const [formAvatar, setFormAvatar] = useState(AVATAR_PRESETS[0]);
  const [formWebsite, setFormWebsite] = useState('');
  const [formTwitter, setFormTwitter] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formFacebook, setFormFacebook] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formYoutube, setFormYoutube] = useState('');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate published article count for an author
  const getAuthorArticleCount = (author: Author): number => {
    return posts.filter((p) => {
      if (p.status !== 'published') return false;
      const postAuthor = (p.author || '').trim().toLowerCase();
      const aName = (author.name || '').trim().toLowerCase();
      const aSlug = (author.slug || '').trim().toLowerCase();
      return postAuthor === aName || postAuthor === aSlug;
    }).length;
  };

  // Helper to determine if an author is the Primary Administrator (protected)
  const isPrimaryAdministrator = (author: Author, index: number): boolean => {
    if (author.id === 'auth-1') return true;
    if (
      currentUserEmail &&
      author.email &&
      author.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase()
    ) {
      return true;
    }
    const roleLower = (author.role || '').toLowerCase();
    if (roleLower.includes('lead architect') || roleLower.includes('primary')) {
      return true;
    }
    if (
      index === 0 &&
      (roleLower.includes('admin') || roleLower.includes('lead') || roleLower.includes('editor-in-chief'))
    ) {
      return true;
    }
    return false;
  };

  const handleOpenAddModal = () => {
    setFormId('auth-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
    setFormName('');
    setFormSlug('');
    setFormEmail('');
    setFormDesignation('');
    setFormRole('Administrator');
    setFormBio('');
    setFormAvatar(AVATAR_PRESETS[0]);
    setFormWebsite('');
    setFormTwitter('');
    setFormGithub('');
    setFormLinkedin('');
    setFormFacebook('');
    setFormInstagram('');
    setFormYoutube('');
    setFormSeoTitle('');
    setFormSeoDescription('');
    setErrorMsg(null);
    setEditingAuthor(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (author: Author) => {
    setFormId(author.id);
    setFormName(author.name || '');
    setFormSlug(author.slug || '');
    setFormEmail(author.email || '');
    setFormDesignation(author.designation || author.role || '');
    setFormRole(
      (author.role === 'Editor' || author.role === 'Contributor' ? author.role : 'Administrator') as any
    );
    setFormBio(author.bio || '');
    setFormAvatar(author.avatar || AVATAR_PRESETS[0]);
    setFormWebsite(author.website || '');
    setFormTwitter(author.twitter || '');
    setFormGithub(author.github || '');
    setFormLinkedin(author.linkedin || '');
    setFormFacebook(author.facebook || '');
    setFormInstagram(author.instagram || '');
    setFormYoutube(author.youtube || '');
    setFormSeoTitle(author.seoTitle || '');
    setFormSeoDescription(author.seoDescription || '');
    setErrorMsg(null);
    setEditingAuthor(author);
    setShowAddModal(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingAuthor) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormSlug(autoSlug);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    const lower = url.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim().toLowerCase();
    const cleanSlug = formSlug.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!cleanName) {
      setErrorMsg('Please enter the author display name.');
      return;
    }

    if (!cleanSlug) {
      setErrorMsg('Please provide a unique slug for the author profile.');
      return;
    }

    if (cleanEmail && !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Validate URLs
    const urlsToValidate = [
      { name: 'Website', val: formWebsite },
      { name: 'Twitter', val: formTwitter },
      { name: 'GitHub', val: formGithub },
      { name: 'LinkedIn', val: formLinkedin },
      { name: 'Facebook', val: formFacebook },
      { name: 'Instagram', val: formInstagram },
      { name: 'YouTube', val: formYoutube },
    ];
    for (const item of urlsToValidate) {
      if (!validateUrl(item.val)) {
        setErrorMsg(`Invalid URL protocol provided for ${item.name}. JavaScript and data protocols are prohibited.`);
        return;
      }
    }

    // Check slug uniqueness
    const slugCollision = authors.find(
      (a) => a.id !== formId && a.slug.toLowerCase() === cleanSlug.toLowerCase()
    );
    if (slugCollision) {
      setErrorMsg(`An author with handle/slug "@${cleanSlug}" already exists. Please choose a different slug.`);
      return;
    }

    const updatedAuthor: Author = {
      id: formId,
      name: cleanName,
      slug: cleanSlug,
      email: cleanEmail || 'author@example.com',
      role: formRole,
      designation: formDesignation.trim() || formRole,
      avatar: formAvatar || AVATAR_PRESETS[0],
      bio: formBio.trim() || `Author and contributor to AstroPress.`,
      website: formWebsite.trim() || undefined,
      twitter: formTwitter.trim() ? formTwitter.trim() : undefined,
      github: formGithub.trim() ? formGithub.trim().replace(/^@/, '') : undefined,
      linkedin: formLinkedin.trim() || undefined,
      facebook: formFacebook.trim() || undefined,
      instagram: formInstagram.trim() || undefined,
      youtube: formYoutube.trim() || undefined,
      seoTitle: formSeoTitle.trim() || undefined,
      seoDescription: formSeoDescription.trim() || undefined,
      updatedAt: new Date().toISOString(),
      createdAt: editingAuthor?.createdAt || new Date().toISOString(),
    };

    if (editingAuthor) {
      if (onSaveAuthor) {
        onSaveAuthor(updatedAuthor);
      } else if (onAddAuthor) {
        onAddAuthor(updatedAuthor);
      }
      setSuccessMsg(`Author profile "${cleanName}" updated successfully!`);
    } else {
      if (onAddAuthor) {
        onAddAuthor(updatedAuthor);
      } else if (onSaveAuthor) {
        onSaveAuthor(updatedAuthor);
      }
      setSuccessMsg(`New author "${cleanName}" created successfully!`);
    }

    setTimeout(() => setSuccessMsg(null), 4000);
    setShowAddModal(false);
  };

  const handleRoleChange = (author: Author, index: number, newRole: string) => {
    if (isPrimaryAdministrator(author, index)) {
      alert('The Primary Administrator role is protected and cannot be modified.');
      return;
    }
    if (onUpdateAuthorRole) {
      onUpdateAuthorRole(author.id, newRole);
    }
  };

  const handleInitiateDelete = (author: Author, index: number) => {
    if (isPrimaryAdministrator(author, index)) {
      alert('The Primary Administrator cannot be removed.');
      return;
    }
    setAuthorToDelete(author);
  };

  const handleConfirmDelete = () => {
    if (!authorToDelete) return;
    const authorIdx = authors.findIndex((a) => a.id === authorToDelete.id);
    if (isPrimaryAdministrator(authorToDelete, authorIdx)) {
      alert('The Primary Administrator cannot be removed.');
      setAuthorToDelete(null);
      return;
    }

    // Safety check: published articles assigned to this author
    const articleCount = getAuthorArticleCount(authorToDelete);
    if (articleCount > 0) {
      alert(
        `Cannot remove author "${authorToDelete.name}": There are ${articleCount} published article(s) assigned to this author. Please reassign those articles in the Gutenberg Editor before deleting.`
      );
      setAuthorToDelete(null);
      return;
    }

    if (onDeleteAuthor) {
      onDeleteAuthor(authorToDelete.id);
    }
    setSuccessMsg(`Author "${authorToDelete.name}" has been safely removed.`);
    setTimeout(() => setSuccessMsg(null), 4000);
    setAuthorToDelete(null);
  };

  // Filtered authors based on search
  const filteredAuthors = authors.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.name || '').toLowerCase().includes(q) ||
      (a.slug || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.designation || '').toLowerCase().includes(q) ||
      (a.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-xs">
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Author & User Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage author public profiles, biographies, social links, editorial permissions, and security roles
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Author</span>
          </button>
          {onNavigateToSecurity && (
            <button
              onClick={onNavigateToSecurity}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Admin Security</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('authors')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'authors'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Authors & Public Profiles ({authors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          <span>Git Roles & Permissions</span>
        </button>
      </div>

      {activeTab === 'authors' ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search authors by name, slug, designation or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredAuthors.length} of {authors.length} authors
            </span>
          </div>

          {/* Authors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAuthors.map((author, index) => {
              const articleCount = getAuthorArticleCount(author);
              const isPrimary = isPrimaryAdministrator(author, index);
              const authorSlug = author.slug || author.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

              return (
                <div
                  key={author.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={author.avatar || AVATAR_PRESETS[0]}
                      alt={author.name}
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
                    />

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{author.name}</h3>
                        {isPrimary && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0">
                            Primary
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-blue-600 font-semibold truncate">
                        {author.designation || author.role || 'Staff Contributor'}
                      </p>

                      <p className="text-[11px] text-slate-400 font-mono">@{authorSlug}</p>

                      <p className="text-xs text-slate-600 line-clamp-2 pt-1 leading-relaxed">
                        {author.bio || 'Author on AstroPress.'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Row: Articles Count & Social Badges */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px]">
                        <BookOpen className="h-3 w-3" />
                        <span>{articleCount} published {articleCount === 1 ? 'article' : 'articles'}</span>
                      </span>

                      {/* Social indicator icons */}
                      <div className="flex items-center gap-1 text-slate-400 pl-1">
                        {author.website && <span title={author.website}><Globe className="h-3 w-3 text-blue-500" /></span>}
                        {author.twitter && <span title={author.twitter}><Twitter className="h-3 w-3 text-sky-500" /></span>}
                        {author.github && <span title={author.github}><Github className="h-3 w-3 text-slate-700" /></span>}
                        {author.linkedin && <span title={author.linkedin}><Linkedin className="h-3 w-3 text-blue-600" /></span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/author/${authorSlug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                        title="Preview Public Profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>

                      <button
                        onClick={() => handleOpenEditModal(author)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit Author Profile"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>

                      {!isPrimary && (
                        <button
                          onClick={() => handleInitiateDelete(author, index)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove Author"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Git Roles & Collaborator Security Model View */
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Shield className="h-4 w-4" />
            <span>Sveltia CMS & Git Provider Security Model</span>
          </div>
          <h3 className="text-base font-bold text-white">How Roles & Access Work in Git-Backed Publishing</h3>
          <p className="text-slate-300 leading-relaxed text-xs">
            Because AstroPress and Sveltia CMS are backed directly by your Git repository, access maps to Git
            collaborator permissions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="font-bold text-white block mb-0.5 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                <span>Administrator</span>
              </span>
              <span className="text-slate-400 text-[11px] block mt-1">
                Full administrative control over code, theme customizer, user management, and Cloudflare deployment.
              </span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="font-bold text-white block mb-0.5 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
                <span>Editor</span>
              </span>
              <span className="text-slate-400 text-[11px] block mt-1">
                Can write, publish, delete, and merge content branches into main via Sveltia CMS.
              </span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="font-bold text-white block mb-0.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                <span>Contributor</span>
              </span>
              <span className="text-slate-400 text-[11px] block mt-1">
                Submits draft posts as pull requests or drafts under editorial review workflow.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Author Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingAuthor ? `Edit Author: ${editingAuthor.name}` : 'Create New Author Profile'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Sarah Lin"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Profile Slug / URL *</label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 rounded-l-xl bg-slate-100 border border-r-0 border-slate-300 text-slate-500 font-mono text-[11px]">
                      /author/
                    </span>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) =>
                        setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                      }
                      placeholder="sarah-lin"
                      className="w-full px-3 py-2 rounded-r-xl border border-slate-300 font-mono text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Professional Designation / Role</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Staff Design Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Permission Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Administrator">Administrator (Full Access)</option>
                    <option value="Editor">Editor (Publishing & Editing)</option>
                    <option value="Contributor">Contributor (Draft Submissions)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="author@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Profile Photo / Avatar</label>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={formAvatar || AVATAR_PRESETS[0]}
                    alt="Preview"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500 shadow-2xs shrink-0"
                  />
                  <input
                    type="url"
                    value={formAvatar}
                    onChange={(e) => setFormAvatar(e.target.value)}
                    placeholder="Custom image URL..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] text-slate-400 shrink-0">Presets:</span>
                  {AVATAR_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormAvatar(p)}
                      className={`h-8 w-8 rounded-full overflow-hidden shrink-0 ring-2 transition-all ${
                        formAvatar === p ? 'ring-blue-600 scale-110' : 'ring-transparent hover:ring-slate-300'
                      }`}
                    >
                      <img src={p} alt={`Preset ${i}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Biography */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Author Biography</label>
                <textarea
                  rows={3}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Write a clear, compelling professional bio for the author's public profile..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Social URLs Accordion / Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="block font-bold text-slate-800 text-xs">Social Profiles & Website</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">Website URL</label>
                    <input
                      type="url"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">X / Twitter Handle or URL</label>
                    <input
                      type="text"
                      value={formTwitter}
                      onChange={(e) => setFormTwitter(e.target.value)}
                      placeholder="@handle or https://x.com/handle"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">GitHub Username or URL</label>
                    <input
                      type="text"
                      value={formGithub}
                      onChange={(e) => setFormGithub(e.target.value)}
                      placeholder="username or https://github.com/username"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={formLinkedin}
                      onChange={(e) => setFormLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">Facebook Profile URL</label>
                    <input
                      type="url"
                      value={formFacebook}
                      onChange={(e) => setFormFacebook(e.target.value)}
                      placeholder="https://facebook.com/username"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">Instagram Profile URL</label>
                    <input
                      type="url"
                      value={formInstagram}
                      onChange={(e) => setFormInstagram(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Overrides */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="block font-bold text-slate-800 text-xs">SEO & Search Optimization</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">SEO Meta Title (Optional)</label>
                    <input
                      type="text"
                      value={formSeoTitle}
                      onChange={(e) => setFormSeoTitle(e.target.value)}
                      placeholder="Custom page title for search engines..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">SEO Meta Description (Optional)</label>
                    <input
                      type="text"
                      value={formSeoDescription}
                      onChange={(e) => setFormSeoDescription(e.target.value)}
                      placeholder="Custom description snippet..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {editingAuthor ? 'Save Profile Changes' : 'Create Author Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {authorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900">Confirm Author Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove author <strong className="text-slate-900">{authorToDelete.name}</strong>?
            </p>

            {getAuthorArticleCount(authorToDelete) > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <strong>Warning:</strong> This author has {getAuthorArticleCount(authorToDelete)} published article(s).
                Deletion is prohibited until those articles are reassigned.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAuthorToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
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
