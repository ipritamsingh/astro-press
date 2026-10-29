const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dirs = [
  path.join(__dirname, '../src/content/posts'),
  path.join(__dirname, '../src/content/pages')
];

let fixedCount = 0;

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
      const data = yaml.load(frontmatterRaw);

      // Clean excerpt and metaDescription if they contain markdown image syntax starting with !
      if (data.excerpt && typeof data.excerpt === 'string') {
        data.excerpt = data.excerpt.replace(/!\[.*?\]\(.*?\)/g, '').trim();
      }
      if (data.seo) {
        if (data.seo.metaDescription && typeof data.seo.metaDescription === 'string') {
          data.seo.metaDescription = data.seo.metaDescription.replace(/!\[.*?\]\(.*?\)/g, '').trim();
        }
      }

      // Re-dump safely with explicit double quote style or lineWidth -1
      const newFrontmatter = yaml.dump(data, {
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
        quotingType: '"',
        forceQuotes: true,
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
      // Attempt manual fix if needed
    }
  }
}

console.log(`Done! Fixed ${fixedCount} files.`);
