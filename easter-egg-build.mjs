import {readFile,writeFile} from 'node:fs/promises';

const root='.vercel/output/static';
const source=await readFile(`${root}/index.html`,'utf8');
const runtime=await readFile('easter-egg-player.js','utf8');
new Function(runtime);

let page=source
  .replace(/<title[^>]*>[\s\S]*?<\/title>/i,'<title>Daejon Love | Bobby\'s Big Board</title>')
  .replace(/<meta[^>]+name=["']description["'][^>]*>/i,'<meta name="description" content="A very special Bobby\'s Big Board player profile.">')
  .replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');

await writeFile(`${root}/seo/players/daejon-love.html`,page);
console.log('Added hidden Daejon Love easter-egg route (excluded from rankings and sitemap).');
