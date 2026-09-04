import {readFile,writeFile} from 'node:fs/promises';

const root='.vercel/output/static';
const source=await readFile(`${root}/index.html`,'utf8');
const runtime=await readFile('easter-egg-player.js','utf8');
new Function(runtime);

const url="https://bobbysbigboard.com/player/daejon-love";
let page=source
  .replace(/<title[^>]*>[\s\S]*?<\/title>/i,"<title>Daejon Love | Bobby's Big Board</title>")
  .replace(/<meta[^>]+name=["']description["'][^>]*>/i,'<meta name="description" content="Daejon Love WR prospect profile on Bobby\'s Big Board.">')
  .replace(/<link[^>]+rel=["']canonical["'][^>]*>/i,`<link rel="canonical" href="${url}">`)
  .replace(/<meta[^>]+property=["']og:title["'][^>]*>/i,'<meta property="og:title" content="Daejon Love | Bobby\'s Big Board">')
  .replace(/<meta[^>]+property=["']og:description["'][^>]*>/i,'<meta property="og:description" content="Daejon Love WR prospect profile on Bobby\'s Big Board.">')
  .replace(/<meta[^>]+property=["']og:url["'][^>]*>/i,`<meta property="og:url" content="${url}">`)
  .replace(/<meta[^>]+name=["']twitter:title["'][^>]*>/i,'<meta name="twitter:title" content="Daejon Love | Bobby\'s Big Board">')
  .replace(/<meta[^>]+name=["']twitter:description["'][^>]*>/i,'<meta name="twitter:description" content="Daejon Love WR prospect profile on Bobby\'s Big Board.">')
  .replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');

await writeFile(`${root}/seo/players/daejon-love.html`,page);
console.log('Added hidden Daejon Love easter-egg route (excluded from rankings and sitemap).');
