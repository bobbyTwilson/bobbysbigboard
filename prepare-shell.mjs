import {readFile,writeFile} from 'node:fs/promises';

const shellPath='site-shell.html';
let html=await readFile(shellPath,'utf8');
const runtime=await readFile('bbb-runtime.js','utf8');

// Keep the captured HTML/CSS shell as a visual baseline, but remove the four
// historical inline JavaScript blocks that fetched Google Sheets. The live
// build receives one canonical UI runtime plus the Supabase data layer.
const legacyBlocks=[
  ['dynasty Sheet runtime',/<script>const SHEET='https:\/\/docs\.google\.com\/spreadsheets\/[\s\S]*?<\/script>/],
  ['rookie/prospect Sheet runtime',/<script id=["']bbb-rookie-prospect-script["']>[\s\S]*?<\/script>/],
  ['draft-pick Sheet runtime',/<script id=["']bbb-draft-pick-script["']>[\s\S]*?<\/script>/],
  ['legacy player-profile runtime',/<script id=["']bbb-player-profile-script["']>[\s\S]*?<\/script>/]
];

for(const [label,pattern] of legacyBlocks){
  if(!pattern.test(html))throw new Error(`Expected ${label} was not found in ${shellPath}`);
  html=html.replace(pattern,'');
}

// Idempotent for local/repeated builds.
html=html.replace(/<script id=["']bbb-runtime-script["']>[\s\S]*?<\/script>/g,'');

if(/docs\.google\.com\/spreadsheets/i.test(html)){
  throw new Error('Google Sheets runtime reference remained after shell cleanup');
}
if(/docs\.google\.com\/spreadsheets/i.test(runtime)){
  throw new Error('bbb-runtime.js must not contain Google Sheets data access');
}

const runtimeTag=`<script id="bbb-runtime-script">\n${runtime}\n</script>`;
if(!html.includes('</body>'))throw new Error('site-shell.html is missing </body>');
html=html.replace('</body>',runtimeTag+'</body>');

await writeFile(shellPath,html);
console.log('Prepared runtime shell: removed legacy Google Sheets loaders and installed canonical BBB UI runtime.');
