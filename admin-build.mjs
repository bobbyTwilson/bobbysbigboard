import { access, readFile, writeFile } from 'node:fs/promises';

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
const scannerCss=await readFile('admin-scanner-v2.css','utf8');
const scannerJs=await readFile('admin-scanner-v2.js','utf8');
await writeFile(`${out}/static/admin-scanner-v2.css`,scannerCss);
await writeFile(`${out}/static/admin-scanner-v2.js`,scannerJs);
const scannerV3Css=await readFile('admin-scanner-v3.css','utf8');
const scannerV3Js=await readFile('admin-scanner-v3.js','utf8');
await writeFile(`${out}/static/admin-scanner-v3.css`,scannerV3Css);
await writeFile(`${out}/static/admin-scanner-v3.js`,scannerV3Js);
const injuryCss=await readFile('admin-injury-v1.css','utf8');
const injuryJs=await readFile('admin-injury-v1.js','utf8');
await writeFile(`${out}/static/admin-injury-v1.css`,injuryCss);
await writeFile(`${out}/static/admin-injury-v1.js`,injuryJs);
const injuryV2Css=await readFile('admin-injury-v2.css','utf8');
await writeFile(`${out}/static/admin-injury-v2.css`,injuryV2Css);
const contentCss=await readFile('admin-content-v1.css','utf8');
const contentJs=await readFile('admin-content-v1.js','utf8');
await writeFile(`${out}/static/admin-content-v1.css`,contentCss);
await writeFile(`${out}/static/admin-content-v1.js`,contentJs);
const dashboardV2Css=await readFile('admin-dashboard-v2.css','utf8');
const dashboardV2Js=await readFile('admin-dashboard-v2.js','utf8');
await writeFile(`${out}/static/admin-dashboard-v2.css`,dashboardV2Css);
await writeFile(`${out}/static/admin-dashboard-v2.js`,dashboardV2Js);
const automationCss=await readFile('admin-automation-v1.css','utf8');
const automationJs=await readFile('admin-automation-v1.js','utf8');
await writeFile(`${out}/static/admin-automation-v1.css`,automationCss);
await writeFile(`${out}/static/admin-automation-v1.js`,automationJs);
const exceptionCss=await readFile('admin-exceptions-v1.css','utf8');
const exceptionJs=await readFile('admin-exceptions-v1.js','utf8');
await writeFile(`${out}/static/admin-exceptions-v1.css`,exceptionCss);
await writeFile(`${out}/static/admin-exceptions-v1.js`,exceptionJs);
const uiPolishCss=await readFile('admin-ui-polish-v1.css','utf8');
const uiPolishJs=await readFile('admin-ui-polish-v1.js','utf8');
await writeFile(`${out}/static/admin-ui-polish-v1.css`,uiPolishCss);
await writeFile(`${out}/static/admin-ui-polish-v1.js`,uiPolishJs);
const adminDesignV2Css=await readFile('admin-design-system-v2.css','utf8');
await writeFile(`${out}/static/admin-design-system-v2.css`,adminDesignV2Css);

/* Ship and verify the Ranking Intelligence assets referenced by Admin HTML.
   Without these copies Vercel returns 404 while the admin page itself builds READY. */
const rankingIntelJs=await readFile('admin-ranking-intel-v2.js','utf8');
const rankingIntelCss=await readFile('admin-ranking-intel-v2.css','utf8');
new Function(rankingIntelJs);
if(!rankingIntelCss.includes('#pageMoves .rank-intel-panel')){
  throw new Error('Ranking Intelligence CSS did not contain its main panel styles.');
}
await writeFile(`${out}/static/admin-ranking-intel-v2.js`,rankingIntelJs);
await writeFile(`${out}/static/admin-ranking-intel-v2.css`,rankingIntelCss);

/* Fail the build if any admin-specific JS or CSS link has no shipped file.
   This keeps future Admin features from silently rendering as unstyled skeletons. */
const adminStaticAssets=[...adminHtml.matchAll(/(?:src|href)="\/(admin-[^"?#]+\.(?:js|css))(?:\?[^"]*)?"/g)]
  .map(match=>match[1]);
for(const name of new Set(adminStaticAssets)){
  await access(`${out}/static/${name}`);
}
if(!adminHtml.includes('id="rankIntelGrid"') || !adminHtml.includes('id="rankIntelPanel"')){
  throw new Error('Ranking Intelligence panel is missing from the deployed admin HTML.');
}
console.log('Verified '+new Set(adminStaticAssets).size+' Admin JS/CSS assets, including Ranking Intelligence V2.');


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
