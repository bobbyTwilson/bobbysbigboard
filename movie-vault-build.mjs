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
console.log('Built unlisted /midnight-archive/ with ' + films.length + ' reviews, Bobby/Lisa ranking pages, and isolated Midnight Star SVG/PNG favicons. All pages noindex; no changes to main BBB favicon, sitemap or navigation.');
