const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/components/frontend/ArchiveView.tsx',
  'src/components/frontend/AuthorProfileView.tsx',
  'src/components/frontend/HomepageView.tsx',
  'src/components/frontend/SinglePostView.tsx',
  'src/components/common/CommentsIsland.tsx',
  'src/components/admin/DashboardView.tsx',
  'src/components/admin/CommentsManager.tsx',
  'src/components/admin/PostsManager.tsx'
];

for (const relPath of targetFiles) {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('Skipping missing file:', fullPath);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace new Date(x).toLocaleDateString(...) with deterministic helper inline
  content = content.replace(
    /new\s+Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)/g,
    (match, arg) => `(function(d) {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d).split('T')[0];
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return m[dt.getUTCMonth()] + ' ' + dt.getUTCDate() + ', ' + dt.getUTCFullYear();
    })(${arg})`
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Fixed date formatting in:', relPath);
}

console.log('Robust hydration fix completed successfully.');
