const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src/pages/reports');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const replacements = [
  { match: /bg-blue-50\b/g, replace: 'bg-primary/10 dark:bg-primary/20' },
  { match: /text-blue-600\b/g, replace: 'text-primary' },
  { match: /border-blue-200\b/g, replace: 'border-primary/20' },

  { match: /bg-emerald-50\b/g, replace: 'bg-success/10 dark:bg-success/20' },
  { match: /text-emerald-600\b/g, replace: 'text-success' },
  { match: /border-emerald-200\b/g, replace: 'border-success/20' },

  { match: /bg-amber-50\b/g, replace: 'bg-warning/10 dark:bg-warning/20' },
  { match: /text-amber-600\b/g, replace: 'text-warning' },
  { match: /border-amber-200\b/g, replace: 'border-warning/20' },

  { match: /bg-red-50\b/g, replace: 'bg-danger/10 dark:bg-danger/20' },
  { match: /text-red-600\b/g, replace: 'text-danger' },
  { match: /border-red-200\b/g, replace: 'border-danger/20' },

  { match: /bg-violet-50\b/g, replace: 'bg-info/10 dark:bg-info/20' },
  { match: /text-violet-600\b/g, replace: 'text-info' },
  { match: /border-violet-200\b/g, replace: 'border-info/20' },
  
  { match: /bg-cyan-50\b/g, replace: 'bg-primary/10 dark:bg-primary/20' },
  { match: /text-cyan-600\b/g, replace: 'text-primary' },
  { match: /border-cyan-200\b/g, replace: 'border-primary/20' },
  
  { match: /bg-indigo-50\b/g, replace: 'bg-info/10 dark:bg-info/20' },
  { match: /text-indigo-600\b/g, replace: 'text-info' },
  { match: /border-indigo-200\b/g, replace: 'border-info/20' }
];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let changed = false;
  for (const { match, replace } of replacements) {
    if (match.test(content)) {
      content = content.replace(match, replace);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
