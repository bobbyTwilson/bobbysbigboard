import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = '.vercel/output/static';
const source = path.join(root, 'bbb-share.webp');
const favicon = path.join(root, 'favicon.png');

// Google Search requires a crawlable favicon file in a supported image format.
// Reuse the actual BBB shield that build.mjs already exports for social sharing.
await sharp(source)
  .resize(192, 192, {
    fit: 'contain',
    background: { r: 5, g: 8, b: 7, alpha: 0 }
  })
  .png({ compressionLevel: 9 })
  .toFile(favicon);

const faviconTags = '<link rel="icon" type="image/png" sizes="192x192" href="/favicon.png"><link rel="shortcut icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" sizes="192x192" href="/favicon.png">';

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const pages = await htmlFiles(root);
for (const file of pages) {
  let html = await readFile(file, 'utf8');
  html = html
    .replace(/<link\s+rel=["'](?:icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed)["'][^>]*>/gi, '')
    .replace('</head>', `${faviconTags}</head>`);
  await writeFile(file, html);
}

console.log(`Generated Google-compatible BBB favicon at /favicon.png and wired it into ${pages.length} HTML pages.`);
