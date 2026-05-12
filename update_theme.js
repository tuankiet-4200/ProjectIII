const fs = require('fs');

const targetFile = 'frontend/app/(public)/products/[id]/page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Container
content = content.replace('bg-[#0B0A10] text-white', 'bg-background text-foreground transition-colors duration-300');

// Cards
content = content.replace(/bg-\[#14121C\]/g, 'bg-card');
content = content.replace(/border-white\/5/g, 'border-card-border');

// Gradients (bg-gradient-to-br from-[#1a1a2e] to-[#16213e] to standard secondary background)
content = content.replace(/bg-gradient-to-br from-\[#1a1a2e\] to-\[#16213e\]/g, 'bg-secondary/50 dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e]');

// text-white where it's a main heading or text (heuristic: not next to bg-violet or bg-rose)
// Let's manually replace some common text-white instances.
content = content.replace(/text-white/g, (match, offset, string) => {
  // Simple check: if there is 'bg-' near it, it might be a button.
  // We'll replace text-white with text-foreground globally, EXCEPT if it's on a button with bg-violet or bg-rose or bg-emerald
  const contextBefore = string.slice(Math.max(0, offset - 40), offset);
  if (contextBefore.includes('bg-violet') || contextBefore.includes('bg-rose') || contextBefore.includes('bg-emerald') || contextBefore.includes('bg-black')) {
    return 'text-white';
  }
  // Otherwise use text-foreground
  return 'text-foreground';
});

// Gray text
content = content.replace(/text-gray-400/g, 'text-slate-500 dark:text-gray-400');
content = content.replace(/text-gray-500/g, 'text-slate-400 dark:text-gray-500');
content = content.replace(/text-gray-300/g, 'text-slate-600 dark:text-gray-300');
content = content.replace(/text-gray-600/g, 'text-slate-400 dark:text-gray-600');

// Some border-white/10 to border-border
content = content.replace(/border-white\/10/g, 'border-border dark:border-white/10');
content = content.replace(/bg-white\/5/g, 'bg-slate-100 dark:bg-white/5');
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-slate-50 dark:bg-white/[0.03]');

// bg-black/40 (usually for floating buttons on images) -> we can keep it since images are dark/light

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done replacing in detail page');

const listFile = 'frontend/app/(public)/products/page.tsx';
let contentList = fs.readFileSync(listFile, 'utf8');
contentList = contentList.replace('bg-[#0B0A10] text-white', 'bg-background text-foreground transition-colors duration-300');
contentList = contentList.replace(/bg-\[#14121C\]/g, 'bg-card');
contentList = contentList.replace(/border-white\/5/g, 'border-card-border');
contentList = contentList.replace(/text-white/g, (match, offset, string) => {
  const contextBefore = string.slice(Math.max(0, offset - 40), offset);
  if (contextBefore.includes('bg-violet') || contextBefore.includes('bg-rose') || contextBefore.includes('bg-green') || contextBefore.includes('bg-black')) {
    return 'text-white';
  }
  return 'text-foreground';
});
contentList = contentList.replace(/text-gray-400/g, 'text-slate-500 dark:text-gray-400');
contentList = contentList.replace(/text-gray-500/g, 'text-slate-400 dark:text-gray-500');
contentList = contentList.replace(/text-gray-300/g, 'text-slate-600 dark:text-gray-300');
contentList = contentList.replace(/text-gray-600/g, 'text-slate-400 dark:text-gray-600');
contentList = contentList.replace(/border-white\/10/g, 'border-border dark:border-white/10');
contentList = contentList.replace(/bg-white\/5/g, 'bg-slate-100 dark:bg-white/5');

fs.writeFileSync(listFile, contentList, 'utf8');
console.log('Done replacing in list page');
