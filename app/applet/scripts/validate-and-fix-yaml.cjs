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
      // Re-dump safely
      const newFrontmatter = yaml.dump(data, { lineWidth: -1, noRefs: true, sortKeys: false });
      const newContent = `---\n${newFrontmatter}---${body}`;
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`[FIXED] Re-serialized frontmatter for ${filePath}`);
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
