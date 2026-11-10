/**
 * Final production/preview guardrails for the latest BBB admin, scouting,
 * indexing, and membership flows. Run after admin-build and scouting-preview-build.
 * All assertions are read-only, local to .vercel/output, and fail closed.
 */
import {readFile,access} from 'node:fs/promises';

const root='.vercel/output/static';
const production=process.env.VERCEL_ENV==='production';
const get=path=>readFile(root+'/'+path,'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error('BBB release audit: '+message)};
const contains=(body,items,where)=>{
 for(const item of items)assert(body.includes(item),where+' missing '+item);
};
const [admin,adminJs,scoutingJs,memberJs,configText,home,robots]=await Promise.all([
 get('admin.html'),get('admin.js'),get('scouting-preview.js'),
 get('bbb-plus-v1.js'),readFile('.vercel/output/config.json','utf8'),
 get('index.html'),get('robots.txt')
]);
const config=JSON.parse(configText);
assert(Array.isArray(config.routes),'Vercel routing table missing');

// Private admin pages must never be search-indexable or expose public sign-up.
contains(admin,['noindex,nofollow','data-prospect-view="all"','data-prospect-view="graded"',
 'data-prospect-view="ungraded"','id="prospectGradeForm"',
 'id="prospectScoutingOverview"','id="prospectPublishReport"',
 'id="prospectPhotoUrl"'],'admin page');
contains(adminJs,["admin_get_prospect_lab","admin_grade_prospect",
 "admin_save_prospect_editorial","EDIT GRADE & REPORT",
 "MY SAVED BBB GRADE".replace('MY ','YOUR '),
 "prospectView='all'"],'admin grade workflow');
assert(!adminJs.includes('prospectIncludeGraded'),'old hidden-grade filter restored');
new Function(adminJs);
assert(config.routes.some(x=>x.src==='/admin/?'&&x.dest==='/admin.html'),
 'admin deep-link route missing');

// Published scouting copy, photo overrides, and college draft notes.
contains(scoutingJs,['overview,strengths,concerns,projection',
 'const override=P.get(p.player_key)?.photo_url','function portrait('],
 'public scouting client');
new Function(scoutingJs);

// No live subscription requests must be reachable from a preview checkout.
if(!production){
 contains(memberJs,['PREVIEW_PAYMENT_LOCK','TEST STRIPE CHECKOUT'],
  'safe preview membership');
 assert(!memberJs.includes("'/functions/v1/bbb-plus-checkout'"),
  'live Checkout path exists in preview membership JS');
 assert(/Disallow:\s*\//i.test(robots),'preview robots crawl prevention missing');
}else{
 // Production is allowed to open a live billing endpoint, but must never be
 // shipped with a TEST Stripe checkout button or preview-only billing stub.
 assert(!memberJs.includes('PREVIEW_PAYMENT_LOCK'),
  'preview payment stub leaked into production');
 const contentJs=await get('admin-content-v1.js');
 contains(contentJs,['contentYoutubeFreshness','PERFORMANCE DATA NEEDS REFRESH','daysOld>7'],'creator analytics freshness warning');
 const sitemap=await get('sitemap.xml');
 const links=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 assert(links.length>=400,'public sitemap lost most player coverage');
 assert(links.length===new Set(links).size,'duplicate URLs in sitemap');
 assert(links.includes('https://bobbysbigboard.com/scouting/drew-mestemaker'),
  'graded scouting profile missing from sitemap');
 assert(!/Disallow:\s*\/\s*(?:\n|$)/m.test(robots),
  'production robots disallows all crawlers');
 for(const slug of ['drew-mestemaker','arch-manning','drake-maye']){
  const doc=await get('seo/scouting/'+slug+'.html');
  contains(doc,['id="bbbSeoPlayerIntro"','<h2>Scouting report</h2>',
   'rel="canonical"','content="index,follow"'],
   'indexable scouting profile '+slug);
  assert(doc.includes('<h1>'+slug.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ')+'</h1>'),
   'incorrect player identity in '+slug);
 }
 for(const slug of ['wyatt-young']){
  const doc=await get('seo/scouting/'+slug+'.html');
  if(doc.includes('content="noindex,follow"')){
   assert(!sitemap.includes('/scouting/'+slug+'</loc>'),
    'unpublished scouting placeholder leaked into sitemap');
  }
 }
 const notFound=await get('404.html');
 contains(notFound,['noindex,nofollow','Player profile not found'],'missing player page');
 const scoutingRoute=config.routes.find(x=>x.status===404&&x.src.includes('/scouting/'));
 assert(scoutingRoute,'unknown scouting URLs do not receive HTTP 404');
 const firstMatching=path=>config.routes.find(x=>{
  if(typeof x.src!=='string')return false;
  try{return new RegExp(x.src).test(path)}catch{return false}
 });
 const known=firstMatching('/scouting/drew-mestemaker');
 const unknown=firstMatching('/scouting/a-player-who-definitely-does-not-exist-xxxyyybbb');
 assert(known&&known.dest==='/seo/scouting/$1.html',
  'real scouting pages are not routed to player HTML');
 assert(unknown&&unknown.status===404,
  'nonexistent scouting URLs would return an indexable 200');
}
await access(root+'/admin-film-v1.js');
console.log('BBB release audit passed: admin editing and publishing, private access markers, client scripts, '+(production?'canonical/indexing and HTTP 404 routes':'preview-only payment lock')+'.');
