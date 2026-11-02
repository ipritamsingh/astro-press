const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dirs = [
  path.join(__dirname, '../src/content/posts'),
  path.join(__dirname, '../src/content/pages')
];

let fixedCount = 0;

function cleanEditorialExcerpt(raw, maxLength = 160) {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw
    .replace(/!\[.*?\](?:\(.*?\)|[^\s\n]*)?/g, '')
    .replace(/\[([^\]]+)\](?:\([^)]*\)|[^\s\n]*)?/g, '$1')
    .replace(/(?:^|\n|\s)>\s*/g, ' ')
    .replace(/#{1,6}\s*/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/`/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/(?:^|\n)\s*[-*+]\s+/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned.replace(/["'“”‘’]+$/g, '').trim();
  }

  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeText = (lastSpace > maxLength * 0.7 ? truncated.slice(0, lastSpace) : truncated).trim();
  return safeText.replace(/["'“”‘’.,;:!?\-]+$/g, '').trim();
}

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Split frontmatter and body
    const match = content.match(/^---\s*([\s\S]*?)\s*---([\s\S]*)$/);
    if (!match) {
      console.log(`[WARN] No frontmatter found in ${filePath}`);
      continue;
    }

    const frontmatterRaw = match[1];
    const body = match[2];

    try {
      let data = yaml.load(frontmatterRaw);

      if (data) {
        if (data.excerpt && typeof data.excerpt === 'string') {
          data.excerpt = cleanEditorialExcerpt(data.excerpt);
        }
        if (data.seo) {
          if (data.seo.metaDescription && typeof data.seo.metaDescription === 'string') {
            data.seo.metaDescription = cleanEditorialExcerpt(data.seo.metaDescription);
          }
        }
      }

      // Re-dump safely with explicit double quote style or lineWidth -1
      const newFrontmatter = yaml.dump(data, {
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
        quotingType: '"',
      });

      const newContent = `---\n${newFrontmatter}---${body}`;
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`[FIXED] Sanitized and re-serialized frontmatter for ${filePath}`);
        fixedCount++;
      } else {
        console.log(`[OK] Valid YAML in ${filePath}`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to parse YAML in ${filePath}:`, err.message);
    }
  }
}

console.log(`Done! Fixed ${fixedCount} files.`);
