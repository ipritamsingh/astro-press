/**
 * SVG Sanitizer Utility
 *
 * Production-grade SVG validation and sanitization for custom category icons.
 * Strips script tags, event handlers (onload, onerror, onclick, etc.), unsafe protocols
 * (javascript:, vbscript:, unsafe data:), foreignObject, embed, object, iframe, and other
 * potentially malicious constructs.
 *
 * Runs safely in both browser (DOMParser) and Node.js / SSR environments.
 */

// Elements strictly forbidden in safe SVGs
const FORBIDDEN_TAGS = [
  'script',
  'foreignobject',
  'iframe',
  'frame',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'style',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'audio',
  'video',
  'source',
  'track',
];

// Dangerous attributes forbidden in safe SVGs
const FORBIDDEN_ATTR_PREFIXES = ['on']; // onload, onerror, onclick, etc.
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html'];

export interface SanitizeResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Validates and sanitizes an SVG string.
 */
export function sanitizeSvg(rawSvg: string): SanitizeResult {
  if (!rawSvg || typeof rawSvg !== 'string') {
    return { valid: false, sanitized: '', error: 'SVG content cannot be empty' };
  }

  const trimmed = rawSvg.trim();

  // Basic structure check
  if (!trimmed.toLowerCase().includes('<svg') || !trimmed.toLowerCase().includes('</svg>')) {
    return { valid: false, sanitized: '', error: 'Input must contain a valid <svg>...</svg> element' };
  }

  // Check for obvious dangerous keywords before parsing
  const lower = trimmed.toLowerCase();
  for (const tag of FORBIDDEN_TAGS) {
    const openingTagRegex = new RegExp(`<\\s*${tag}[\\s>/]`, 'i');
    if (openingTagRegex.test(lower)) {
      return { valid: false, sanitized: '', error: `Dangerous element <${tag}> is not allowed in category icons` };
    }
  }

  // Browser-based sanitization using DOMParser when available
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'image/svg+xml');

      // Check for parsing error
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return { valid: false, sanitized: '', error: 'Invalid XML/SVG syntax' };
      }

      const root = doc.documentElement;
      if (!root || root.tagName.toLowerCase() !== 'svg') {
        return { valid: false, sanitized: '', error: 'Root element must be <svg>' };
      }

      // Recursively clean all elements
      const allElements = [root, ...Array.from(root.querySelectorAll('*'))];
      for (const el of allElements) {
        const tagName = el.tagName.toLowerCase();
        if (FORBIDDEN_TAGS.includes(tagName)) {
          el.remove();
          continue;
        }

        // Check attributes
        const attrsToRemove: string[] = [];
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          const attrName = attr.name.toLowerCase();
          const attrVal = attr.value.trim().toLowerCase();

          // Reject on* event handlers
          if (attrName.startsWith('on')) {
            attrsToRemove.push(attr.name);
            continue;
          }

          // Reject dangerous protocols in href or src
          for (const proto of DANGEROUS_PROTOCOLS) {
            if (attrVal.includes(proto)) {
              attrsToRemove.push(attr.name);
              break;
            }
          }
        }

        attrsToRemove.forEach((a) => el.removeAttribute(a));
      }

      // Ensure basic dimensions and accessibility attributes if missing
      if (!root.getAttribute('xmlns')) {
        root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      if (!root.getAttribute('viewBox') && !root.getAttribute('width')) {
        root.setAttribute('viewBox', '0 0 24 24');
      }

      const serializer = new XMLSerializer();
      const cleanString = serializer.serializeToString(root);

      return { valid: true, sanitized: cleanString };
    } catch (err: any) {
      return { valid: false, sanitized: '', error: `SVG parsing error: ${err.message || 'Unknown'}` };
    }
  }

  // Node.js / fallback sanitization using robust regex
  let cleaned = trimmed;

  // Remove any XML declaration / DOCTYPE if present
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, '');
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

  // Strip forbidden tags and their contents
  for (const tag of FORBIDDEN_TAGS) {
    const tagRegex = new RegExp(`<\\s*${tag}[^>]*>([\\s\\S]*?<\\/\\s*${tag}\\s*>)?`, 'gi');
    cleaned = cleaned.replace(tagRegex, '');
  }

  // Strip all on* event handler attributes
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Strip href / src attributes containing javascript: or dangerous protocols
  cleaned = cleaned.replace(
    /\s+(?:xlink:)?href\s*=\s*["']?\s*(?:javascript:|vbscript:|data:text\/html)[^"'>\s]*["']?/gi,
    ''
  );

  // Extract from the first <svg to the matching </svg>
  const svgStart = cleaned.search(/<svg[\s>]/i);
  const svgEnd = cleaned.toLowerCase().lastIndexOf('</svg>');
  if (svgStart === -1 || svgEnd === -1) {
    return { valid: false, sanitized: '', error: 'Valid SVG root tag not found' };
  }

  cleaned = cleaned.substring(svgStart, svgEnd + 6).trim();

  return { valid: true, sanitized: cleaned };
}

/**
 * Checks whether an SVG string is safe and valid.
 */
export function isSafeSvg(rawSvg: string): boolean {
  const result = sanitizeSvg(rawSvg);
  return result.valid && result.sanitized.length > 0;
}
