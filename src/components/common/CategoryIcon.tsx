import React, { useMemo } from 'react';
import { Category } from '../../types/cms';
import { sanitizeSvg } from '../../utils/svgSanitizer';
import {
  Cpu,
  Sparkles,
  FolderTree,
  Cloud,
  Palette,
  Code2,
  Terminal,
  Layers,
  Globe,
  BookOpen,
  Zap,
  ShieldCheck,
  Compass,
  Server,
  Database,
  Boxes,
  FileText,
  Layout,
  Flame,
  Feather,
  Hash,
  Workflow,
  Monitor,
  Rocket,
  LucideIcon,
} from 'lucide-react';

export interface LibraryIconOption {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_LIBRARY_ICONS: LibraryIconOption[] = [
  { key: 'Cpu', label: 'CPU / Tech', icon: Cpu },
  { key: 'Sparkles', label: 'Sparkles / Islands', icon: Sparkles },
  { key: 'FolderTree', label: 'Folder Tree / CMS', icon: FolderTree },
  { key: 'Cloud', label: 'Cloud / Edge', icon: Cloud },
  { key: 'Palette', label: 'Palette / Design', icon: Palette },
  { key: 'Code2', label: 'Code / Development', icon: Code2 },
  { key: 'Terminal', label: 'Terminal / CLI', icon: Terminal },
  { key: 'Layers', label: 'Layers / Architecture', icon: Layers },
  { key: 'Globe', label: 'Globe / Web', icon: Globe },
  { key: 'BookOpen', label: 'Book / Guides', icon: BookOpen },
  { key: 'Zap', label: 'Zap / Performance', icon: Zap },
  { key: 'ShieldCheck', label: 'Shield / Security', icon: ShieldCheck },
  { key: 'Compass', label: 'Compass / Explore', icon: Compass },
  { key: 'Server', label: 'Server / Backend', icon: Server },
  { key: 'Database', label: 'Database / Storage', icon: Database },
  { key: 'Boxes', label: 'Boxes / Modular', icon: Boxes },
  { key: 'FileText', label: 'Document / Articles', icon: FileText },
  { key: 'Layout', label: 'Layout / UI', icon: Layout },
  { key: 'Flame', label: 'Flame / Hot Topics', icon: Flame },
  { key: 'Feather', label: 'Feather / Editorial', icon: Feather },
  { key: 'Hash', label: 'Hash / Topics', icon: Hash },
  { key: 'Workflow', label: 'Workflow / Pipelines', icon: Workflow },
  { key: 'Monitor', label: 'Monitor / Frontend', icon: Monitor },
  { key: 'Rocket', label: 'Rocket / Deployment', icon: Rocket },
];

const ICON_MAP: Record<string, LucideIcon> = CATEGORY_LIBRARY_ICONS.reduce(
  (acc, item) => {
    acc[item.key] = item.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

interface Props {
  category: Pick<Category, 'icon' | 'iconType' | 'color' | 'name'>;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<Props> = ({ category, className = 'h-5 w-5', size = 20 }) => {
  const { icon, iconType, color } = category;

  // 1. Custom SVG rendering
  const sanitizedSvg = useMemo(() => {
    if (iconType === 'svg' && icon && icon.trim()) {
      const res = sanitizeSvg(icon);
      return res.valid ? res.sanitized : null;
    }
    return null;
  }, [iconType, icon]);

  if (iconType === 'svg' && sanitizedSvg) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full ${className}`}
        style={{ color: color || 'currentColor' }}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
    );
  }

  // 2. Standard Curated Library Icon rendering
  const iconKey = icon || 'FolderTree';
  const IconComponent = ICON_MAP[iconKey] || FolderTree;

  return (
    <IconComponent
      className={className}
      size={size}
      style={{ color: color || 'currentColor' }}
      aria-hidden="true"
    />
  );
};
