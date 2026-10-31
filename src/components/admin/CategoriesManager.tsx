import React, { useState, useId } from 'react';
import { Category, Tag } from '../../types/cms';
import {
  Plus,
  Trash2,
  Edit2,
  FolderTree,
  Tag as TagIcon,
  Check,
  Eye,
  EyeOff,
  Upload,
  Code,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { CategoryIcon, CATEGORY_LIBRARY_ICONS } from '../common/CategoryIcon';
import { sanitizeSvg } from '../../utils/svgSanitizer';

interface Props {
  categories: Category[];
  tags: Tag[];
  onSaveCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onSaveTag: (tag: Tag) => void;
  onDeleteTag: (id: string) => void;
  postCountsByCategory: Record<string, number>;
}

export const CategoriesManager: React.FC<Props> = ({
  categories,
  tags,
  onSaveCategory,
  onDeleteCategory,
  onSaveTag,
  onDeleteTag,
  postCountsByCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#2563eb');
  const [catIconType, setCatIconType] = useState<'library' | 'svg'>('library');
  const [catIcon, setCatIcon] = useState('Cpu');
  const [catShowOnHomepage, setCatShowOnHomepage] = useState(true);
  const [catOrder, setCatOrder] = useState<number>(categories.length + 1);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // SVG input error
  const [svgError, setSvgError] = useState<string | null>(null);

  // Tag Form State
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const fileInputId = useId();

  // Reset category form
  const resetCatForm = () => {
    setEditingCatId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatColor('#2563eb');
    setCatIconType('library');
    setCatIcon('Cpu');
    setCatShowOnHomepage(true);
    setCatOrder(categories.length + 1);
    setSvgError(null);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    let finalIcon = catIcon;
    if (catIconType === 'svg') {
      const sanitized = sanitizeSvg(catIcon);
      if (!sanitized.valid) {
        setSvgError(sanitized.error || 'Invalid SVG markup');
        return;
      }
      finalIcon = sanitized.sanitized;
    }

    const newCategory: Category = {
      id: editingCatId || 'cat-' + Date.now(),
      name: catName.trim(),
      slug: catSlug.trim() || catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: catDesc.trim(),
      color: catColor || '#2563eb',
      icon: finalIcon,
      iconType: catIconType,
      showOnHomepage: catShowOnHomepage,
      order: Number(catOrder) || 1,
    };

    onSaveCategory(newCategory);
    resetCatForm();
  };

  const handleEditCategory = (c: Category) => {
    setEditingCatId(c.id);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatDesc(c.description || '');
    setCatColor(c.color || '#2563eb');
    setCatIconType(c.iconType || 'library');
    setCatIcon(c.icon || 'Cpu');
    setCatShowOnHomepage(c.showOnHomepage !== false);
    setCatOrder(c.order !== undefined ? c.order : 1);
    setSvgError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setSvgError('Please upload an SVG file (.svg)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const sanitized = sanitizeSvg(content);
        if (sanitized.valid) {
          setCatIcon(sanitized.sanitized);
          setSvgError(null);
        } else {
          setSvgError(sanitized.error || 'Invalid or unsafe SVG file');
        }
      }
    };
    reader.onerror = () => {
      setSvgError('Failed to read uploaded SVG file');
    };
    reader.readAsText(file);
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    const newTag: Tag = {
      id: editingTagId || 'tag-' + Date.now(),
      name: tagName.trim(),
      slug: tagSlug.trim() || tagName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };

    onSaveTag(newTag);
    setTagName('');
    setTagSlug('');
    setEditingTagId(null);
  };

  // Sorted categories for table display by order then name
  const sortedCategories = [...categories].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Taxonomies & Category Showcase</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage article categories, icons, colors, display orders, and the homepage "Explore by Topic" showcase
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'categories' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'tags' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" />
            <span>Tags ({tags.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'categories' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add / Edit Category Form (5 cols on lg) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-blue-600" />
                <span>{editingCatId ? 'Edit Category' : 'Add New Category'}</span>
              </h3>
              {editingCatId && (
                <button
                  type="button"
                  onClick={resetCatForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  + Add New Instead
                </button>
              )}
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
              {/* Category Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!catSlug || !editingCatId) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Technology & Architecture"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Category Slug & Order */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Slug / URL</label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="e.g. technology"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1" title="Sort order in Explore by Topic">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={catOrder}
                    onChange={(e) => setCatOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-bold text-center"
                  />
                </div>
              </div>

              {/* Description / Subtitle */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description / Subtitle</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief description or category purpose..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Accent Color & Visibility */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-20 px-2 py-1 text-[11px] font-mono rounded border border-slate-200 bg-white uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">Homepage Showcase</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={catShowOnHomepage}
                      onChange={(e) => setCatShowOnHomepage(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      {catShowOnHomepage ? 'Visible on Homepage' : 'Hidden from Showcase'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Icon Configuration */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Card Icon</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setCatIconType('library');
                        setSvgError(null);
                      }}
                      className={`px-2 py-1 rounded transition-all ${
                        catIconType === 'library' ? 'bg-white shadow-2xs text-blue-600 font-bold' : 'text-slate-600'
                      }`}
                    >
                      Icon Library
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCatIconType('svg');
                        setSvgError(null);
                      }}
                      className={`px-2 py-1 rounded transition-all ${
                        catIconType === 'svg' ? 'bg-white shadow-2xs text-blue-600 font-bold' : 'text-slate-600'
                      }`}
                    >
                      Custom SVG
                    </button>
                  </div>
                </div>

                {catIconType === 'library' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                      {CATEGORY_LIBRARY_ICONS.map((item) => {
                        const Icon = item.icon;
                        const isSelected = catIcon === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setCatIcon(item.key)}
                            title={item.label}
                            className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs scale-105'
                                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-100'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                      <span>Selected: <strong className="text-slate-800">{catIcon}</strong></span>
                      <span className="text-[10px] text-slate-400">24 curated tech & publishing icons</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">Paste inline &lt;svg&gt; or upload .svg:</span>
                      <label
                        htmlFor={fileInputId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium text-[11px] transition-colors"
                      >
                        <Upload className="h-3 w-3" />
                        <span>Upload SVG</span>
                        <input
                          id={fileInputId}
                          type="file"
                          accept=".svg,image/svg+xml"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <textarea
                      rows={3}
                      value={catIcon}
                      onChange={(e) => {
                        setCatIcon(e.target.value);
                        if (e.target.value.trim()) {
                          const res = sanitizeSvg(e.target.value);
                          if (!res.valid) {
                            setSvgError(res.error || 'Invalid SVG');
                          } else {
                            setSvgError(null);
                          }
                        } else {
                          setSvgError(null);
                        }
                      }}
                      placeholder='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path ... /></svg>'
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[10px] outline-none focus:border-blue-500 resize-none"
                    />

                    {svgError ? (
                      <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium bg-rose-50 p-2 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{svgError}</span>
                      </div>
                    ) : catIcon && catIcon.includes('<svg') ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-medium bg-emerald-50 p-2 rounded-lg">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Valid and sanitized SVG ready</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Live Preview of Explore by Topic card */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-800 text-[11px] block">Live Card Preview (Explore by Topic)</span>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div
                      className="h-2 w-10 rounded-full"
                      style={{ backgroundColor: catColor || '#2563eb' }}
                    />
                    <div className="flex items-center gap-1">
                      {catShowOnHomepage ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Showcase #{catOrder}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <EyeOff className="h-3 w-3" /> Hidden from Showcase
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="p-2.5 rounded-xl shrink-0"
                      style={{ backgroundColor: `${catColor}15` }}
                    >
                      <CategoryIcon
                        category={{
                          name: catName,
                          color: catColor,
                          icon: catIcon,
                          iconType: catIconType,
                        }}
                        className="h-6 w-6"
                        size={24}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {catName || 'Category Title'}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {catDesc || 'Category description will appear here on topic cards.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>
                      {postCountsByCategory[catName] || 0} {postCountsByCategory[catName] === 1 ? 'article' : 'articles'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">/{catSlug || 'category-slug'}</span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs"
                >
                  {editingCatId ? 'Update Category' : 'Save Category'}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={resetCatForm}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories Table (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Configured Categories ({categories.length})</h3>
                <p className="text-[11px] text-slate-500">Sorted by homepage showcase order</p>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {categories.filter((c) => c.showOnHomepage !== false).length} visible on homepage
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Showcase</th>
                    <th className="p-3 text-center">Articles</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedCategories.map((c) => {
                    const isVisible = c.showOnHomepage !== false;
                    const isEditing = editingCatId === c.id;
                    const count = postCountsByCategory[c.name] || postCountsByCategory[c.slug] || 0;

                    return (
                      <tr
                        key={c.id}
                        className={`transition-colors ${
                          isEditing ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-500">
                          #{c.order ?? '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="p-1.5 rounded-lg shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: `${c.color || '#2563eb'}20` }}
                            >
                              <CategoryIcon category={c} className="h-4 w-4" size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{c.name}</span>
                              <span className="font-mono text-slate-400 text-[10px]">/{c.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {isVisible ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <Eye className="h-3 w-3" /> Visible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <EyeOff className="h-3 w-3" /> Hidden
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-600">
                          {count}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditCategory(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                              title="Edit Category"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete category "${c.name}"? This will not delete articles in it.`)) {
                                  onDeleteCategory(c.id);
                                  if (editingCatId === c.id) resetCatForm();
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                              title="Delete Category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add / Edit Tag Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingTagId ? 'Edit Tag' : 'Add New Tag'}
            </h3>
            <form onSubmit={handleTagSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tag Name</label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value);
                    if (!tagSlug || !editingTagId) {
                      setTagSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Astro"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Slug</label>
                <input
                  type="text"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  placeholder="e.g. astro"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                >
                  {editingTagId ? 'Update Tag' : 'Add Tag'}
                </button>
                {editingTagId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTagId(null);
                      setTagName('');
                      setTagSlug('');
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tags Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tags.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <TagIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{t.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{t.slug}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingTagId(t.id);
                            setTagName(t.name);
                            setTagSlug(t.slug);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete tag "${t.name}"?`)) onDeleteTag(t.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
