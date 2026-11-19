import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import sharp from 'sharp';

// The movie vault and both ranking pages are unlisted, noindex and
// independent of BBB's navigation, football assets, and searchable sitemap.
const source = await readFile('movie-vault.html', 'utf8');
const match = source.match(/<script id="vault-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Missing Movie Vault source data');
const films = JSON.parse(match[1]);
if (films.length !== 17) throw new Error('Expected 17 recorded movies');
if (films.some(f => !f.posterSource || !f.poster.startsWith('https://'))) throw new Error('A movie is missing a verified HTTPS poster source');
if (/pinimg\\.com|blogspot\\.com|etsystatic\\.com|squarespace-cdn\\.com/i.test(source)) throw new Error('Unverified image host found in movie vault');
if (!source.includes('<option value="top" selected>')) throw new Error('Movie vault must default to highest combined rating');
if (!source.includes('rankById.get(m.id)')) throw new Error('Movie cards must display ranking positions');
if (new Set(films.map(f => f.id)).size !== films.length) throw new Error('Duplicate film IDs');
if (films.some(f => typeof f.b !== 'number' || typeof f.l !== 'number' || f.b < 0 || f.l > 10)) throw new Error('Invalid personal movie ratings');

function verifyPage(html, label) {
  if (!html.includes('noindex,nofollow,noarchive')) throw new Error('Missing noindex: ' + label);
  if (!html.includes('href="/midnight-archive/favicon.svg"') || !html.includes('href="/midnight-archive/favicon-32.png"')) throw new Error('Missing Midnight Star favicon links: ' + label);
  for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (script[0].includes('application/json')) continue;
    new Script(script[1], { filename: label + '.browser.js' });
  }
}
verifyPage(source, 'movie-vault');

const output = '.vercel/output/static/midnight-archive';
await mkdir(output, { recursive: true });
const midnightStar = await readFile('midnight-star.svg');
if (!midnightStar.toString().includes('<svg') || !midnightStar.toString().includes('The Midnight Star')) throw new Error('Invalid Midnight Star favicon source');
await writeFile(output + '/favicon.svg', midnightStar);
await sharp(midnightStar).resize(16, 16).png().toFile(output + '/favicon-16.png');
await sharp(midnightStar).resize(32, 32).png().toFile(output + '/favicon-32.png');
await sharp(midnightStar).resize(180, 180).png().toFile(output + '/apple-touch-icon.png');
await writeFile(output + '/index.html', source);

const rankingsTemplate = await readFile('movie-vault-rankings.template.html', 'utf8');
for (const { name, key, otherName, otherKey } of [
  { name: 'Bobby', key: 'b', otherName: 'Lisa', otherKey: 'l' },
  { name: 'Lisa', key: 'l', otherName: 'Bobby', otherKey: 'b' }
]) {
  const page = rankingsTemplate
    .replaceAll('__CRITIC_NAME__', name)
    .replaceAll('__CRITIC_KEY__', key)
    .replaceAll('__OTHER_NAME__', otherName)
    .replaceAll('__OTHER_KEY__', otherKey)
    .replaceAll('__OTHER_SLUG__', otherName.toLowerCase())
    .replaceAll('__BOBBY_ACTIVE__', key === 'b' ? 'active' : '')
    .replaceAll('__LISA_ACTIVE__', key === 'l' ? 'active' : '')
    .replace('__FILMS_JSON__', match[1]);
  if (/__CRITIC_|__OTHER_|__FILMS_|__BOBBY_ACTIVE__|__LISA_ACTIVE__|__OTHER_SLUG__/.test(page)) throw new Error('Unresolved ranking template placeholder for ' + name);
  verifyPage(page, name.toLowerCase() + '-rankings');
  const dir = output + '/' + name.toLowerCase();
  await mkdir(dir, { recursive: true });
  await writeFile(dir + '/index.html', page);
}

// Movie database live loader and five extra archival views.
const sharedJS=await readFile('movie-vault-shared.js','utf8');
new Script(sharedJS,{filename:'movie-vault-shared.js'});
await writeFile(output+'/shared.js',sharedJS);
const extrasTemplate=await readFile('movie-vault-extras.template.html','utf8');
for(const [slug,title] of [
  ['movie','Individual Movie Review'],
  ['compare','Bobby vs Lisa'],
  ['stats','Movie Night Statistics'],
  ['timeline','Watch History'],
  ['add','Add or Edit Movie']
]){
  const rendered=extrasTemplate
    .replaceAll('__PAGE__',slug)
    .replaceAll('__PAGE_TITLE__',title)
    .replaceAll('__COMPARE_ACTIVE__',slug==='compare'?'active':'')
    .replaceAll('__STATS_ACTIVE__',slug==='stats'?'active':'')
    .replaceAll('__TIMELINE_ACTIVE__',slug==='timeline'?'active':'')
    .replaceAll('__ADD_ACTIVE__',slug==='add'?'active':'')
    .replace('__FILMS_JSON__',match[1]);
  if(/__(?:PAGE|PAGE_TITLE|COMPARE_ACTIVE|STATS_ACTIVE|TIMELINE_ACTIVE|ADD_ACTIVE|FILMS_JSON)__/.test(rendered))throw new Error('Unresolved Movie Archive template placeholder for '+slug);
  verifyPage(rendered,'movie-'+slug);
  const dir=output+'/'+slug;
  await mkdir(dir,{recursive:true});
  await writeFile(dir+'/index.html',rendered);
}
console.log('Built unlisted Midnight Archive: '+films.length+' recorded films, both ranking pages, comparison, stats, timeline, individual reviews, protected editor, Supabase read-only runtime, and isolated Midnight Star favicon. All noindex; BBB untouched.');
