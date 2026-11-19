import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Script } from 'node:vm';

// The movie vault and both ranking pages are unlisted, noindex and
// independent of BBB's navigation, football assets, and searchable sitemap.
const source = await readFile('movie-vault.html', 'utf8');
const match = source.match(/<script id="vault-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Missing Movie Vault source data');
const films = JSON.parse(match[1]);
if (films.length !== 17) throw new Error('Expected 17 recorded movies');
if (new Set(films.map(f => f.id)).size !== films.length) throw new Error('Duplicate film IDs');
if (films.some(f => typeof f.b !== 'number' || typeof f.l !== 'number' || f.b < 0 || f.l > 10)) throw new Error('Invalid personal movie ratings');

function verifyPage(html, label) {
  if (!html.includes('noindex,nofollow,noarchive')) throw new Error('Missing noindex: ' + label);
  for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (script[0].includes('application/json')) continue;
    new Script(script[1], { filename: label + '.browser.js' });
  }
}
verifyPage(source, 'movie-vault');

const output = '.vercel/output/static/midnight-archive';
await mkdir(output, { recursive: true });
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
console.log('Built unlisted /midnight-archive/ with ' + films.length + ' reviews and separate /bobby/ and /lisa/ rankings. All pages noindex; no changes to main sitemap or navigation.');
