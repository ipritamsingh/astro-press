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
  if (!fs.existsSync(fullPath)) {
    console.log('File not found:', fullPath);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace toLocaleDateString('en-US') with toLocaleDateString('en-US', { timeZone: 'UTC' })
  content = content.replace(
    /\.toLocaleDateString\('en-US'\)/g,
    ".toLocaleDateString('en-US', { timeZone: 'UTC' })"
  );

  // Replace toLocaleDateString() with toLocaleDateString('en-US', { timeZone: 'UTC' })
  content = content.replace(
    /\.toLocaleDateString\(\)/g,
    ".toLocaleDateString('en-US', { timeZone: 'UTC' })"
  );

  // Replace toLocaleDateString('en-US', { with toLocaleDateString('en-US', { timeZone: 'UTC',
  content = content.replace(
    /\.toLocaleDateString\('en-US',\s*\{\s*/g,
    ".toLocaleDateString('en-US', { timeZone: 'UTC', "
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated date formatting in:', relPath);
}

// Special fix for SinglePostView.tsx articleUrl hydration
const singlePostPath = path.join(process.cwd(), 'src/components/frontend/SinglePostView.tsx');
if (fs.existsSync(singlePostPath)) {
  let sc = fs.readFileSync(singlePostPath, 'utf8');
  const targetUrlLogic = `  const articleUrl = typeof window !== 'undefined' && window.location.href
    ? window.location.href.split('?')[0].split('#')[0]
    : \`\${canonicalOrigin}/\${cleanPostSlug}/\`;`;

  const replacementUrlLogic = `  const [articleUrl, setArticleUrl] = React.useState<string>(() => \`\${canonicalOrigin}/\${cleanPostSlug}/\`);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.href) {
      setArticleUrl(window.location.href.split('?')[0].split('#')[0]);
    }
  }, []);`;

  if (sc.includes(targetUrlLogic)) {
    sc = sc.replace(targetUrlLogic, replacementUrlLogic);
    fs.writeFileSync(singlePostPath, sc, 'utf8');
    console.log('Updated articleUrl hydration logic in SinglePostView.tsx');
  }
}
