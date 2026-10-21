const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/common/CommentsIsland.tsx',
  'src/components/frontend/ArchiveView.tsx',
  'src/components/frontend/AuthorProfileView.tsx',
  'src/components/frontend/HomepageView.tsx',
  'src/components/frontend/SinglePostView.tsx'
];

for (const relPath of filesToFix) {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace any toLocaleDateString variants with a clean UTC en-US date string
  // e.g. new Date(x).toLocaleDateString(...) -> new Date(x).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
  // or simple date formatting
  
  // Let's replace new Date(...).toLocaleDateString(...) with:
  // new Date(...).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
  // For short dates: month/day/year.
  
  // Actually, let's use a regex that matches new Date(...).toLocaleDateString(...) and replaces it cleanly.
  content = content.replace(
    /new\s+Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)/g,
    "new Date($1).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })"
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Standardized date formatting in:', relPath);
}
