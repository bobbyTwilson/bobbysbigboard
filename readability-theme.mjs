import {cp,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const ROOT='.vercel/output/static';
await cp('readability-theme.css',`${ROOT}/readability-theme.css`);
await cp('readability-theme-runtime.js',`${ROOT}/readability-theme-runtime.js`);
async function htmls(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...await htmls(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
let count=0;
for(const file of await htmls(ROOT)){
 let doc=await readFile(file,'utf8');
 if(!doc.includes('/readability-theme.css'))doc=doc.replace('</head>','<link rel="stylesheet" href="/readability-theme.css"></head>');
 if(!doc.includes('/readability-theme-runtime.js'))doc=doc.replace('</body>','<script src="/readability-theme-runtime.js"></script></body>');
 await writeFile(file,doc);count++;
}
console.log(`Readability theme and final runtime overrides injected into ${count} HTML files.`);