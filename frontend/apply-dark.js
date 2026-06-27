import fs from 'fs';
import path from 'path';

const replaceRules = [
  { search: /bg-white(?![\w-\/])/g, replace: 'bg-white dark:bg-slate-900' },
  { search: /bg-slate-50(?![\w-\/])/g, replace: 'bg-slate-50 dark:bg-slate-950' },
  { search: /bg-slate-100(?![\w-\/])/g, replace: 'bg-slate-100 dark:bg-slate-800' },
  { search: /text-slate-900(?![\w-\/])/g, replace: 'text-slate-900 dark:text-white' },
  { search: /text-slate-800(?![\w-\/])/g, replace: 'text-slate-800 dark:text-slate-100' },
  { search: /text-slate-700(?![\w-\/])/g, replace: 'text-slate-700 dark:text-slate-200' },
  { search: /text-slate-600(?![\w-\/])/g, replace: 'text-slate-600 dark:text-slate-300' },
  { search: /text-slate-500(?![\w-\/])/g, replace: 'text-slate-500 dark:text-slate-400' },
  { search: /border-slate-200(?![\w-\/])/g, replace: 'border-slate-200 dark:border-slate-700' },
  { search: /border-slate-100(?![\w-\/])/g, replace: 'border-slate-100 dark:border-slate-800' },
  { search: /divide-slate-100(?![\w-\/])/g, replace: 'divide-slate-100 dark:divide-slate-800' },
  { search: /divide-slate-200(?![\w-\/])/g, replace: 'divide-slate-200 dark:divide-slate-700' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const rule of replaceRules) {
        // Only replace if the target class isn't already followed by the replacement class to avoid duplicates
        // Example: if "bg-white dark:bg-slate-900" is already there, don't replace "bg-white" again.
        // We'll just run the replace and then clean up duplicates.
        content = content.replace(rule.search, rule.replace);
      }
      
      // Cleanup accidental double replacements
      content = content.replace(/bg-white dark:bg-slate-900 dark:bg-slate-900/g, 'bg-white dark:bg-slate-900');
      content = content.replace(/bg-slate-50 dark:bg-slate-950 dark:bg-slate-950/g, 'bg-slate-50 dark:bg-slate-950');
      content = content.replace(/bg-slate-100 dark:bg-slate-800 dark:bg-slate-800/g, 'bg-slate-100 dark:bg-slate-800');
      content = content.replace(/text-slate-800 dark:text-slate-100 dark:text-slate-100/g, 'text-slate-800 dark:text-slate-100');
      content = content.replace(/text-slate-700 dark:text-slate-200 dark:text-slate-200/g, 'text-slate-700 dark:text-slate-200');
      content = content.replace(/text-slate-600 dark:text-slate-300 dark:text-slate-300/g, 'text-slate-600 dark:text-slate-300');
      content = content.replace(/text-slate-500 dark:text-slate-400 dark:text-slate-400/g, 'text-slate-500 dark:text-slate-400');
      content = content.replace(/border-slate-200 dark:border-slate-700 dark:border-slate-700/g, 'border-slate-200 dark:border-slate-700');
      content = content.replace(/border-slate-100 dark:border-slate-800 dark:border-slate-800/g, 'border-slate-100 dark:border-slate-800');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

const srcDir = path.join(process.cwd(), 'src');
processDirectory(srcDir);
console.log('Dark mode classes applied globally.');
