import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
const root='.vercel/output/static';
const original=await readFile(root+'/index.html','utf8');
await mkdir(root+'/dynasty',{recursive:true});
await writeFile(root+'/dynasty/index.html',original);
const preview=await readFile('scouting-preview.html','utf8');
await writeFile(root+'/index.html',preview);
await copyFile('scouting-preview.js',root+'/scouting-preview.js');
await copyFile('scouting-samples.js',root+'/scouting-samples.js');
let config=JSON.parse(await readFile('.vercel/output/config.json','utf8'));
config.routes=[
 {src:'/players/?',dest:'/index.html'},
 {src:'/film/?',dest:'/index.html'},
 {src:'/draft/?',dest:'/index.html'},
 {src:'/scouting/([^/]+)/?',dest:'/index.html'},
 {src:'/dynasty/?',dest:'/dynasty/index.html'},
 ...config.routes
];
await writeFile('.vercel/output/config.json',JSON.stringify(config,null,2));
await writeFile(root+'/robots.txt','User-agent: *\nDisallow: /\n');
console.log('Scouting preview generated with directory, film room, draft center and dynasty legacy route. No production deployment.');
