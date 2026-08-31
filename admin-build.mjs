import { readFile, writeFile } from 'node:fs/promises';

const out='.vercel/output';

let adminHtml=await readFile('admin.html','utf8');
adminHtml=adminHtml
  .replace(/\s*<div class="auth-tabs">[\s\S]*?<\/div>\s*<form id="authForm">/, '\n      <form id="authForm">')
  .replace('Only an email already approved in the BBB database can open the dashboard or write data. New accounts that are not approved remain locked out.','This private control room is sign-in only. Only the approved BBB owner account can open the dashboard or write data.');
await writeFile(`${out}/static/admin.html`,adminHtml);

let adminJs=await readFile('admin.js','utf8');
adminJs=adminJs
  .replace("let authMode='login',session=null,board=[],profileMap=new Map(),rankPage=0,playerPage=0;","let session=null,board=[],profileMap=new Map(),rankPage=0,playerPage=0;")
  .replace(/async function signUp\([\s\S]*?return \{confirmed:false\}\}\n/,'')
  .replace(/\s*\$\$\('\.auth-tab'\)[\s\S]*?msg\(''\)\}\);\n/,'\n')
  .replace(/if\(authMode==='login'\)\{const admin=await signIn\(email,password\);showApp\(admin\);await loadAll\(\)\}else\{const r=await signUp\(email,password\);if\(r\.confirmed\)\{showApp\(r\.admin\);await loadAll\(\)\}else msg\('Account created\. Check your email to confirm it, then come back and Sign In\.',true\)\}/,"const admin=await signIn(email,password);showApp(admin);await loadAll()")
  .replace("$('#authSubmit').textContent=authMode==='login'?'SIGN IN':'CREATE ACCOUNT';",'')
  .replace("$('#authPassword').autocomplete=authMode==='login'?'current-password':'new-password';",'');
await writeFile(`${out}/static/admin.js`,adminJs);

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

console.log('Added private sign-in-only BBB Admin V1 route and assets.');
