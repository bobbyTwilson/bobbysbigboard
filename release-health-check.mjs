/**
 * Final production/preview guardrails for the latest BBB admin, scouting,
 * indexing, and membership flows. Run after admin-build and scouting-preview-build.
 * All assertions are read-only, local to .vercel/output, and fail closed.
 */
import {readFile,access} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

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

contains(admin,['id="prospectReauth"','id="prospectReauthSubmit"','id="prospectCopyDraft"'],
 'expired-session recovery panel and backup action');
contains(adminJs,[
 'if(!session?.access_token)throw adminAuthExpired()',
 'refreshSessionPromise',
 'saveSession({...previous,...sessionFromAuth(x)})',
 'restoreProspectDraft(key)',
 'saveProspectDraft(true)',
 'clearProspectDraft(x.player_key)',
 'retryProspectSignIn',
 'navigator.clipboard.writeText(notes)'
], 'expired Admin auth and draft protection');
assert(!adminJs.includes('Authorization:'+String.fromCharCode(96)+'Bearer '), 
 'Admin must not transmit an empty Bearer JWT');
const authSliceStart=adminJs.indexOf('function adminAuthExpired(){');
const authSliceEnd=adminJs.indexOf('async function jsonFetch(',authSliceStart);
assert(authSliceStart>0&&authSliceEnd>authSliceStart,'auth guard extraction anchors missing');
const authCheck=runInNewContext(
  adminJs.slice(authSliceStart,authSliceEnd)+
  '(()=>{try{authHeaders();return "invalid"}catch(e){return e.code}})()',
  {session:null,KEY:'test_public_key'},
  {timeout:1000}
);
assert(authCheck==='BBB_ADMIN_SESSION_EXPIRED',
 'missing Admin session must raise a recoverable error rather than send an empty JWT');

const prospectButtonSelector=String.fromCharCode(36,36)+"('[data-prospect-view]').forEach";
assert(adminJs.split(prospectButtonSelector).length-1===2,
  'Prospect Lab must use querySelectorAll for rendering and binding all three view buttons');
contains(adminJs,[
  prospectButtonSelector,
  "prospectSyncPublishChoice",
  "prospectPublishManuallyChosen=true",
  "Grade and scouting report published",
  "VIEW PUBLIC PROFILE",
  "editorial?.saved!==true",
], 'Prospect Lab controls and one-save publication');
assert(!adminJs.includes('setTimeout(closeProspectGrader,650)'),'prospect editor closes before owner can confirm publication');
// Exercise the actual Prospect Lab filtering/render functions with a tiny DOM
// fixture, catching broken Node-vs-NodeList selectors that syntax checks miss.
const filtersStart=adminJs.indexOf('function filteredProspects(){');
const filtersEnd=adminJs.indexOf('function prospectTotal(){',filtersStart);
assert(filtersStart>0&&filtersEnd>filtersStart,'prospect filter test boundaries missing');
const mockDom={};
for(const selector of [
 '#prospectLabGrid','#prospectUngraded','#prospect2027','#prospect2028',
 '#prospectResearched','#prospectNavCount','#prospectViewAllCount',
 '#prospectViewUngradedCount','#prospectViewGradedCount',
 '#prospectSearch','#prospectYear','#prospectPos','#prospectResearch',
 '#prospectViewSummary'
])mockDom[selector]={textContent:'',innerHTML:'',value:''};
for(const sel of ['#prospectYear','#prospectPos','#prospectResearch'])mockDom[sel].value='ALL';
const viewButtons=['all','ungraded','graded'].map(view=>({
 dataset:{prospectView:view},setAttribute(name,value){this[name]=value}
}));
const exampleProspects=[
 {name:'Graded Example',player_key:'graded-example',position:'QB',school:'Notre Dame',
  class_year:2027,graded:true,overall_grade:74,pro_comp:'Pocket passer'},
 {name:'Ungraded Example',player_key:'ungraded-example',position:'QB',school:'Oregon',
  class_year:2027,graded:false,recommended_overall_grade:78,summary:'Watchlist player'}
];
const sandbox={
 $:sel=>mockDom[sel]||null,
 ["$$"]:sel=>sel==='[data-prospect-view]'?viewButtons:[],
 prospectLab:exampleProspects,prospectView:'all',
 prospectReady:()=>false,prospectPhoto:()=>'',esc:v=>String(v??'')
};
runInNewContext(adminJs.slice(filtersStart,filtersEnd),sandbox,{timeout:1000});
sandbox.renderProspectLab();
assert(mockDom['#prospectLabGrid'].innerHTML.includes('Graded Example')&&
       mockDom['#prospectLabGrid'].innerHTML.includes('Ungraded Example'),
       'All prospects view fails to show both saved and pending grades');
sandbox.prospectView='graded';sandbox.renderProspectLab();
assert(mockDom['#prospectLabGrid'].innerHTML.includes('Graded Example')&&
       !mockDom['#prospectLabGrid'].innerHTML.includes('Ungraded Example')&&
       viewButtons[2]['aria-pressed']==='true',
       'My graded prospects button/filter is broken');
sandbox.prospectView='ungraded';sandbox.renderProspectLab();
assert(!mockDom['#prospectLabGrid'].innerHTML.includes('Graded Example')&&
       mockDom['#prospectLabGrid'].innerHTML.includes('Ungraded Example')&&
       viewButtons[1]['aria-pressed']==='true',
       'To grade button/filter is broken');
sandbox.prospectView='all';mockDom['#prospectSearch'].value='Notre Dame';
sandbox.renderProspectLab();
assert(mockDom['#prospectLabGrid'].innerHTML.includes('Graded Example')&&
       !mockDom['#prospectLabGrid'].innerHTML.includes('Ungraded Example'),
       'Prospect search by school fails');
const publishStart=adminJs.indexOf('let prospectPublishManuallyChosen=');
const publishEnd=adminJs.indexOf('function renderProspectRecommendationTraits(',publishStart);
assert(publishStart>0&&publishEnd>publishStart,'auto-publish test boundaries missing');
const publishElements={
 '#prospectScoutingOverview':{value:'Original film evaluation'},
 '#prospectPublishReport':{checked:false}
};
const autoPublishState=runInNewContext(adminJs.slice(publishStart,publishEnd)+`
prospectSyncPublishChoice();
const autoChecked=$('#prospectPublishReport').checked;
prospectPublishManuallyChosen=true;
$('#prospectPublishReport').checked=false;
prospectSyncPublishChoice();
({autoChecked,privateChoiceRespected:!$('#prospectPublishReport').checked});
`,{$:sel=>publishElements[sel]||null},{timeout:1000});
assert(autoPublishState.autoChecked&&autoPublishState.privateChoiceRespected,
       'New overview should auto-publish unless manually kept private');

assert(config.routes.some(x=>x.src==='/admin/?'&&x.dest==='/admin.html'),
 'admin deep-link route missing');

// Published scouting copy, photo overrides, and college draft notes.
contains(scoutingJs,['overview,notebook_available,photo_url',
 'const override=P.get(p.player_key)?.photo_url','function portrait('],
 'public scouting client');
// Regression: the Draft Board must use real grade/publication status, not
// a legacy player-notes field. Never advertise private notebook text.
assert(scoutingJs.includes('grade,comp,notebook_available,photo_url'),
 'draft directory must request the published notebook availability flag');
const cardStart=scoutingJs.indexOf('function playerCard(p){');
const cardEnd=scoutingJs.indexOf('\nfunction videoCard(',cardStart);
assert(cardStart>0&&cardEnd>cardStart,'directory player-card renderer not found');
const cardFixture={
 P:new Map([
  ['darian-mensah',{grade:80,notebook_available:true}],
  ['drew-mestemaker',{grade:77,notebook_available:true}],
  ['cam-coleman',{grade:79.5,notebook_available:false}],
  ['draft-with-overview',{grade:74,overview:'Published free scouting analysis'}]
 ]),
 R:new Map(),D:{media:{}},portrait:()=>'',filmList:()=>[],
 esc:v=>String(v??''),purl:p=>'/scouting/'+p.player_key
};
const cards=runInNewContext(
 scoutingJs.slice(cardStart,cardEnd)+
 '\n({mensah:playerCard({player_key:"darian-mensah",name:"Darian Mensah",pos:"QB",college:"Miami"}),'+
 'mestemaker:playerCard({player_key:"drew-mestemaker",name:"Drew Mestemaker",pos:"QB",college:"Oklahoma State"}),'+
 'gradedOnly:playerCard({player_key:"cam-coleman",name:"Cam Coleman",pos:"WR",college:"Texas"}),'+
 'publicOverview:playerCard({player_key:"draft-with-overview",name:"Published Prospect",pos:"QB"}),'+
 'ungraded:playerCard({player_key:"prospect-without-grade",name:"New Prospect",pos:"QB"})})',
 cardFixture,{timeout:1000}
);
for(const name of ['mensah','mestemaker']){
 assert(cards[name].includes('Scouting notes')&&cards[name].includes('BBB+ Notebook')&&
 !cards[name].includes('Evaluation in progress'),
 name+' published notebook incorrectly marked as evaluation in progress');
}
assert(cards.gradedOnly.includes('Grade recorded')&&!cards.gradedOnly.includes('Evaluation in progress'),
 'graded player without editorial notes incorrectly marked in progress');
assert(cards.publicOverview.includes('Scouting notes')&&!cards.publicOverview.includes('Evaluation in progress'),
 'published free overview incorrectly marked in progress');
assert(cards.ungraded.includes('Evaluation in progress')&&!cards.ungraded.includes('Grade recorded'),
 'ungraded player must retain evaluation-in-progress label');
assert(!scoutingJs.includes('overview,strengths,concerns,projection'),
 'Premium scouting sections must not be fetched from public site_prospects');
const premiumJs=await get('bbb-plus-film-notebook.js');
const premiumCss=await get('bbb-plus-film-notebook.css');
const profileJs=await get('scouting-profile-v5.js');
const intelJs=await get('scouting-intelligence-v6.js');
const commandJs=await get('bbb-plus-command-center.js');
new Function(premiumJs);
const testWindow={};
runInNewContext(premiumJs,{window:testWindow},{timeout:1000});
const notebookUi=testWindow.BBB_PLUS_FILM_NOTEBOOK;
assert(typeof notebookUi?.teaser==='function'&&typeof notebookUi?.bind==='function',
 'Premium notebook interface failed to initialize');
const testGrade={year:2027,grade:74,notebook_available:true,pos:'QB'};
const lockedPreview=notebookUi.teaser(testGrade,{player_key:'cj-carr',name:'CJ Carr'});
assert(lockedPreview.includes('data-profile-tab="notebook"')&&
       !lockedPreview.includes('Original private scouting note'),
       'Public Film Notebook teaser unexpectedly contains private scouting text');
const memberPane=notebookUi.initial({name:'CJ Carr',pos:'QB',draft_year:2027},testGrade);
assert(memberPane.includes('data-bfn-load')&&!memberPane.includes('bfn-unlocked'),
 'Protected Film Notebook was rendered before access verification');
contains(home,['src="/bbb-plus-film-notebook.js"'],'Film Notebook browser runtime');
contains(profileJs,['data-content="notebook"','BBB_PLUS_FILM_NOTEBOOK?.bind','"notebook"'],'premium profile tab');
contains(intelJs,['BBB_PLUS_FILM_NOTEBOOK?.teaser(g,p)'],'premium teaser, not unprotected notes');
contains(premiumJs,['getToken()','/functions/v1/bbb-plus-film-notebook','res.status===403','cache:"no-store"','data?.access?.has_access!==true'],
 'server-validated premium Film Notebook');
contains(premiumCss,['.bfn-teaser','.bfn-shell','.bfn-analysis-grid','@media(max-width:700px)'],'Film Notebook responsive design');
contains(commandJs,['#bbbccFilmIndex','notebook_available=eq.true','target="_top"'],'subscriber notebook library');
contains(memberJs,['2027 Film Notebook','LIVE · EXPANDING','Film Notebook · full strengths'],'BBB+ film notebook marketing');
contains(admin,['BBB+ FILM NOTEBOOK · MEMBERS ONLY','FREE ON PLAYER PROFILE'],'one-editor free/premium mapping');
const notebookEndpoint=await readFile('supabase/functions/bbb-plus-film-notebook/index.ts','utf8');
const notebookMigration=await readFile('supabase/migrations/20261111171600_bbb_plus_film_notebook_public_boundary.sql','utf8');
contains(notebookEndpoint,['authenticatedUser(req)','entitlementFor(user)','access.has_access','scouting_published','GET'],
 'Film Notebook server authorization');
contains(notebookMigration,['REVOKE SELECT ON TABLE public.prospect_grades','NULL::text AS strengths',
 'NULL::text AS projection','notebook_available','GRANT SELECT ('],
 'premium source-data access hardening');
new Function(scoutingJs);
assert(memberJs.includes('FREE IF APPROVED')&&memberJs.includes('not a BBB+ benefit')&&memberJs.includes('commercial API use'),
 'Sleeper must remain a free, permission-dependent feature, not a paid BBB+ entitlement');
const sleeperAccountJs=await get('account-v1-preview.js');
assert(sleeperAccountJs.includes('no BBB+ required')&&sleeperAccountJs.includes('bbbSleeperPreviewOnly()'),
 'Sleeper linking must remain free and gated to preview pending third-party authorization');
const navCss=await get('scouting-atmosphere.css');
contains(navCss,['body>header .bbb-mobile-menu-toggle{display:none!important}'],'desktop-only mobile menu hide');
contains(scoutingJs,['bbb-search-icon','viewBox="0 0 24 24"','place-items:center'],'centered SVG search control');
assert(!scoutingJs.includes('>⌕</span>'),'misaligned Unicode search icon was restored');

contains(home,['class="bbb-mobile-menu-toggle"','id="bbb-site-nav"','<details class="dropdown"'],'accessible mobile site header');
contains(navCss,['@media (max-width:1120px)','body>header .top.bbb-mobile-nav-open>nav','details.dropdown:not([open])','body>.bbb-mobile-nav-scrim:not([hidden])'],'mobile menu containment and Dynasty submenu');
contains(scoutingJs,['toggleMobileMenu','closeMobileMenu','bbb-mobile-nav-scrim','mobileScrim.addEventListener','closeMobileMenu(false);closeDynasty();open=true'],'mobile menu interaction and search handoff');
const scoutingOverviewCss=await get('scouting-intelligence-v6.css');
contains(scoutingOverviewCss,['.sp-overview-v7 .sp-v7-report .sp-report','white-space:pre-line'],'published overview paragraph spacing');
const filmRoomJs=await get('scouting-film-room-v1.js');
contains(filmRoomJs,["['all','All Breakdowns']","data-film-sort","category=\"all\"","data-film-search"],'complete Film Room library filters');
new Function(filmRoomJs);

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
