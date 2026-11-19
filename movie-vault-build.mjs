import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Script } from 'node:vm';

// Keep this mini-site separate from the football UI, navigation, and sitemap.
const source = await readFile('movie-vault.html', 'utf8');
const match = source.match(/<script id="vault-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Missing Movie Vault source data');
const films = JSON.parse(match[1]);
if (films.length !== 17) throw new Error('Expected 17 recorded movies');
if (!source.includes('noindex,nofollow,noarchive')) throw new Error('Unlisted page must remain noindex');
for (const script of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (script[0].includes('application/json')) continue;
  new Script(script[1], { filename: 'movie-vault.browser.js' });
}
const output = '.vercel/output/static/midnight-archive';
await mkdir(output, { recursive: true });
await writeFile(output + '/index.html', source);
console.log('Built /midnight-archive/ with ' + films.length + ' reviews, excluded from site navigation and sitemap.');
