import { cp, readFile, writeFile } from 'node:fs/promises';

const out='.vercel/output';
await cp('admin.html',`${out}/static/admin.html`);
await cp('admin.js',`${out}/static/admin.js`);

const config=JSON.parse(await readFile(`${out}/config.json`,'utf8'));
config.routes=[
  {src:'/admin/?',dest:'/admin.html'},
  ...(config.routes||[])
];
await writeFile(`${out}/config.json`,JSON.stringify(config,null,2));

const robotsPath=`${out}/static/robots.txt`;
let robots=await readFile(robotsPath,'utf8');
if(!/Disallow:\s*\/admin/i.test(robots)){
  robots=robots.replace(/User-agent:\s*\*\s*/i,'User-agent: *\nDisallow: /admin\n');
  await writeFile(robotsPath,robots);
}

console.log('Added private BBB Admin V1 route and assets.');
