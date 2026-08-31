let bbbComparePlayers=[];
let bbbCompareLeft='';
let bbbCompareRight='';

function bbbCompareNorm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'')}
function bbbCompareTradeValue(rank){return rank?Math.round(10000*Math.exp(-.012*(Number(rank)-1))):null}
function bbbCompareNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function bbbCompareFmt(v){return v==null||v===''?'—':v}
function bbbCompareMove(v){
  const n=bbbCompareNum(v);
  if(n==null)return '<span class="bbb-compare-move flat">—</span>';
  if(n>0)return `<span class="bbb-compare-move up">↑ ${bbbEsc(n)}</span>`;
  if(n<0)return `<span class="bbb-compare-move down">↓ ${bbbEsc(Math.abs(n))}</span>`;
  return '<span class="bbb-compare-move flat">No change</span>';
}
function bbbCompareHealthy(p){return /healthy/i.test(String(p?.injury_status||''))}
function bbbCompareMarketView(v){
  const s=String(v||'').toUpperCase();
  if(s.includes('BUY'))return '<span class="bbb-compare-market buy">BBB BUY</span>';
  if(s.includes('FADE'))return '<span class="bbb-compare-market fade">BBB FADE</span>';
  return '<span class="bbb-compare-market neutral">≈ MARKET</span>';
}
function bbbCompareDate(v){
  if(!v)return '';
  return new Date(v+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function bbbCompareTopTraits(p){
  const traits=Object.entries(p?.prospect?.traits||{}).map(([name,raw])=>({name,value:bbbCompareNum(raw)})).filter(x=>x.value!=null&&!/projected draft capital/i.test(x.name));
  return traits.sort((a,b)=>b.value-a.value).slice(0,3);
}
function bbbComparePlayer(key){return bbbComparePlayers.find(p=>p.player_key===key)||null}
function bbbCompareParseHash(){
  if(!location.hash.startsWith('#compare'))return;
  const qs=location.hash.includes('?')?location.hash.split('?').slice(1).join('?'):'';
  const sp=new URLSearchParams(qs);
  const left=sp.get('left')||'',right=sp.get('right')||'';
  if(left)bbbCompareLeft=left;
  if(right)bbbCompareRight=right;
}
function bbbCompareWriteHash(){
  const sp=new URLSearchParams();
  if(bbbCompareLeft)sp.set('left',bbbCompareLeft);
  if(bbbCompareRight)sp.set('right',bbbCompareRight);
  const next='#compare'+(sp.toString()?'?'+sp.toString():'');
  if(location.hash!==next)history.replaceState({},'', '/'+next);
}
function bbbCompareAdvantage(a,b,field,lower=true){
  const av=bbbCompareNum(a?.[field]),bv=bbbCompareNum(b?.[field]);
  if(av==null||bv==null||av===bv)return '';
  return (lower?av<bv:av>bv)?'left':'right';
}
function bbbCompareCell(value,side,winner=''){
  return `<div class="bbb-compare-value ${winner===side?'winner':''}">${value}</div>`;
}
function bbbCompareRow(label,leftHtml,rightHtml,winner='',note=''){
  return `<div class="bbb-compare-row">${bbbCompareCell(leftHtml,'left',winner)}<div class="bbb-compare-label"><strong>${bbbEsc(label)}</strong>${note?`<span>${bbbEsc(note)}</span>`:''}</div>${bbbCompareCell(rightHtml,'right',winner)}</div>`;
}
function bbbCompareSummary(a,b){
  if(!a||!b)return '';
  const preferred=Number(a.rank)<=Number(b.rank)?a:b;
  const other=preferred===a?b:a;
  const gap=Math.abs(Number(a.rank)-Number(b.rank));
  const facts=[];
  facts.push(`BBB ranks ${preferred.name} ${gap===0?'even with '+other.name:gap+' spot'+(gap===1?'':'s')+' higher'}.`);
  const ageGap=Math.abs(Number(a.age)-Number(b.age));
  if(Number.isFinite(ageGap)&&ageGap>=.5){const younger=Number(a.age)<Number(b.age)?a:b;facts.push(`${younger.name} is ${ageGap.toFixed(1)} years younger.`)}
  if(a.market!=null&&b.market!=null&&Number(a.market)!==Number(b.market)){const marketFav=Number(a.market)<Number(b.market)?a:b;facts.push(`The market currently prefers ${marketFav.name}.`)}
  const am=bbbCompareNum(a.mover?.bbb_move_tracking)||0,bm=bbbCompareNum(b.mover?.bbb_move_tracking)||0;
  if(am!==bm&&(am!==0||bm!==0)){const trend=am>bm?a:b;facts.push(`${trend.name} has the stronger BBB ranking trend since tracking began.`)}
  if(bbbCompareHealthy(a)!==bbbCompareHealthy(b)){const healthy=bbbCompareHealthy(a)?a:b;facts.push(`${healthy.name} currently carries the cleaner injury status.`)}
  return `<div class="bbb-compare-verdict"><div><span>BBB HEAD-TO-HEAD</span><h2>BBB prefers ${bbbEsc(preferred.name)}.</h2></div><p>${facts.map(bbbEsc).join(' ')}</p></div>`;
}
function bbbComparePlayerHead(p,side){
  if(!p)return `<div class="bbb-compare-empty-player"><span>${side==='left'?'PLAYER A':'PLAYER B'}</span><strong>Choose a player</strong><p>Search the current Top 500 to begin.</p></div>`;
  const movement=bbbCompareNum(p.mover?.bbb_move_tracking)||0;
  return `<div class="bbb-compare-player-head"><div><span class="bbb-compare-side">${side==='left'?'PLAYER A':'PLAYER B'}</span><h2>${bbbEsc(p.name)}</h2><div class="bbb-compare-meta"><span>${bbbEsc(p.pos)}</span> • ${bbbEsc(p.team||'FA')} • Age ${bbbEsc(p.age??'—')}</div></div><div class="bbb-compare-head-rank"><span>BBB RANK</span><strong>#${bbbEsc(p.rank)}</strong>${bbbCompareMove(movement)}</div></div>`;
}
function bbbComparePicker(side,p){
  return `<div class="bbb-compare-picker" data-side="${side}">${bbbComparePlayerHead(p,side)}<div class="bbb-compare-search-wrap"><input class="bbb-compare-search" data-side="${side}" placeholder="${p?'Replace '+bbbEsc(p.name):'Search player…'}" autocomplete="off"><div class="bbb-compare-results hide" data-side="${side}"></div></div></div>`;
}
function bbbCompareDetailRows(a,b){
  if(!a||!b)return '<div class="bbb-compare-wait">Select two players to unlock the head-to-head comparison.</div>';
  const rows=[];
  rows.push(bbbCompareRow('BBB Overall Rank','#'+a.rank,'#'+b.rank,bbbCompareAdvantage(a,b,'rank',true)));
  const samePos=a.pos===b.pos;
  rows.push(bbbCompareRow('Position Rank',a.pos+(a.pr||'—'),b.pos+(b.pr||'—'),samePos?bbbCompareAdvantage(a,b,'pr',true):'','Within position'));
  const atv=bbbCompareTradeValue(a.rank),btv=bbbCompareTradeValue(b.rank);
  rows.push(bbbCompareRow('BBB Trade Value',atv?.toLocaleString()||'—',btv?.toLocaleString()||'—',atv===btv?'':atv>btv?'left':'right'));
  rows.push(bbbCompareRow('Market Rank',a.market==null?'—':'#'+a.market,b.market==null?'—':'#'+b.market,bbbCompareAdvantage(a,b,'market',true)));
  rows.push(bbbCompareRow('BBB vs Market',a.gap==null?'—':(Number(a.gap)>0?'+':'')+a.gap,b.gap==null?'—':(Number(b.gap)>0?'+':'')+b.gap,'','Positive = BBB higher'));
  rows.push(bbbCompareRow('Market View',bbbCompareMarketView(a.view),bbbCompareMarketView(b.view)));
  rows.push(bbbCompareRow('Age',a.age??'—',b.age??'—',bbbCompareAdvantage(a,b,'age',true),'Younger highlighted'));
  rows.push(bbbCompareRow('Ranking Movement',bbbCompareMove(a.mover?.bbb_move_tracking),bbbCompareMove(b.mover?.bbb_move_tracking),(()=>{const av=bbbCompareNum(a.mover?.bbb_move_tracking),bv=bbbCompareNum(b.mover?.bbb_move_tracking);return av==null||bv==null||av===bv?'':av>bv?'left':'right'})(),'Since Aug. 31 tracking'));
  rows.push(bbbCompareRow('7D BBB Movement',bbbCompareMove(a.mover?.bbb_move_7d),bbbCompareMove(b.mover?.bbb_move_7d),(()=>{const av=bbbCompareNum(a.mover?.bbb_move_7d),bv=bbbCompareNum(b.mover?.bbb_move_7d);return av==null||bv==null||av===bv?'':av>bv?'left':'right'})()));
  const ah=bbbCompareHealthy(a),bh=bbbCompareHealthy(b);
  rows.push(bbbCompareRow('Injury Status',bbbEsc(a.injury_status||'—'),bbbEsc(b.injury_status||'—'),ah===bh?'':ah?'left':'right'));
  if(a.rookie||b.rookie)rows.push(bbbCompareRow('2026 Rookie Rank',a.rookie?'#'+a.rookie.rank:'—',b.rookie?'#'+b.rookie.rank:'—',a.rookie&&b.rookie?bbbCompareAdvantage(a.rookie,b.rookie,'rank',true):''));
  if(a.prospect||b.prospect){
    let winner='';
    if(a.prospect&&b.prospect&&a.prospect.pos===b.prospect.pos){winner=Number(a.prospect.grade)===Number(b.prospect.grade)?'':Number(a.prospect.grade)>Number(b.prospect.grade)?'left':'right'}
    rows.push(bbbCompareRow('Prospect Grade',a.prospect?bbbEsc(a.prospect.grade):'—',b.prospect?bbbEsc(b.prospect.grade):'—',winner,'Grades are position-specific'));
    rows.push(bbbCompareRow('Pro Comp',a.prospect?bbbEsc(a.prospect.comp||'—'):'—',b.prospect?bbbEsc(b.prospect.comp||'—'):'—'));
  }
  return rows.join('');
}
function bbbCompareUpdateCard(p){
  if(!p)return '';
  const latest=(p.latest_update||p.injury_note||'').trim();
  return `<article class="bbb-compare-update"><div class="bbb-compare-update-head"><div><span>LATEST UPDATE${p.weekly_update_date?' · '+bbbCompareDate(p.weekly_update_date):''}</span><h3>${bbbEsc(p.name)}</h3></div><span class="bbb-compare-health ${bbbCompareHealthy(p)?'healthy':'watch'}">${bbbEsc(p.injury_status||'—')}</span></div><p>${bbbEsc(latest||'No recent meaningful update is currently logged.')}</p></article>`;
}
function bbbCompareFilmCard(p){
  if(!p?.prospect)return '';
  const traits=bbbCompareTopTraits(p);
  return `<article class="bbb-compare-film"><div class="bbb-compare-film-head"><div><span>BBB PROSPECT PROFILE</span><h3>${bbbEsc(p.name)}</h3></div><strong>${bbbEsc(p.prospect.grade)}</strong></div><div class="bbb-compare-film-meta">${bbbEsc(p.prospect.year)} class${p.prospect.comp?' • Comp: '+bbbEsc(p.prospect.comp):''}</div>${traits.length?`<div class="bbb-compare-traits">${traits.map(t=>`<div><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(t.value)}</strong></div>`).join('')}</div>`:''}</article>`;
}
function bbbCompareRender(){
  const mount=document.querySelector('#bbbCompareMount');if(!mount)return;
  const a=bbbComparePlayer(bbbCompareLeft),b=bbbComparePlayer(bbbCompareRight);
  mount.innerHTML=`<div class="bbb-compare-selectors">${bbbComparePicker('left',a)}<div class="bbb-compare-vs">VS</div>${bbbComparePicker('right',b)}</div>${a&&b?bbbCompareSummary(a,b):''}<section class="bbb-compare-table">${bbbCompareDetailRows(a,b)}</section>${a||b?`<section class="bbb-compare-section"><div class="bbb-compare-section-head"><span>PLAYER NEWS</span><h2>Latest context.</h2></div><div class="bbb-compare-two">${a?bbbCompareUpdateCard(a):''}${b?bbbCompareUpdateCard(b):''}</div></section>`:''}${a?.prospect||b?.prospect?`<section class="bbb-compare-section"><div class="bbb-compare-section-head"><span>FILM DATABASE</span><h2>Prospect profile.</h2><p>Prospect grades are position-specific, so cross-position scores should not be treated as a universal scale.</p></div><div class="bbb-compare-two">${a?bbbCompareFilmCard(a):''}${b?bbbCompareFilmCard(b):''}</div></section>`:''}`;
  bbbCompareBindSearch();
  bbbCompareWriteHash();
}
function bbbCompareSearch(side,q){
  const selected=side==='left'?bbbCompareRight:bbbCompareLeft;
  const n=bbbCompareNorm(q);
  return bbbComparePlayers.filter(p=>p.player_key!==selected&&(!n||bbbCompareNorm(`${p.name} ${p.team} ${p.pos}`).includes(n))).sort((a,b)=>{const an=bbbCompareNorm(a.name).startsWith(n)?0:1,bn=bbbCompareNorm(b.name).startsWith(n)?0:1;return an-bn||a.rank-b.rank}).slice(0,10);
}
function bbbCompareBindSearch(){
  document.querySelectorAll('.bbb-compare-search').forEach(input=>{
    const side=input.dataset.side;
    const out=document.querySelector(`.bbb-compare-results[data-side="${side}"]`);
    const draw=()=>{
      const list=bbbCompareSearch(side,input.value.trim());
      out.innerHTML=list.map(p=>`<button type="button" data-key="${bbbEsc(p.player_key)}"><div><strong>${bbbEsc(p.name)}</strong><span>${bbbEsc(p.pos)} • ${bbbEsc(p.team||'FA')} • BBB #${bbbEsc(p.rank)}</span></div><em>${p.market==null?'Market —':'Market #'+bbbEsc(p.market)}</em></button>`).join('')||'<div class="bbb-compare-no-results">No matches.</div>';
      out.classList.remove('hide');
      out.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{if(side==='left')bbbCompareLeft=btn.dataset.key;else bbbCompareRight=btn.dataset.key;bbbCompareRender()});
    };
    input.addEventListener('focus',draw);
    input.addEventListener('input',draw);
  });
}
function bbbCompareInjectStyles(){
  if(document.querySelector('#bbb-compare-styles'))return;
  const s=document.createElement('style');s.id='bbb-compare-styles';s.textContent=`
  .bbb-compare-view{background:#050807;min-height:75vh}.bbb-compare-hero{padding:56px 0 34px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 12%,rgba(10,143,77,.19),transparent 38%),linear-gradient(180deg,#07100c,#050807)}.bbb-compare-hero h1{font-size:clamp(44px,6vw,72px);line-height:.95;letter-spacing:-.05em;margin:8px 0 12px}.bbb-compare-hero p{max-width:680px;color:#87978e;font-size:14px}.bbb-compare-content{padding:46px 0 76px}.bbb-compare-selectors{display:grid;grid-template-columns:1fr 58px 1fr;gap:13px;align-items:stretch}.bbb-compare-vs{display:grid;place-items:center;color:#50ce8e;font-size:12px;font-weight:950}.bbb-compare-picker{position:relative;border:1px solid #1b3a2d;background:linear-gradient(160deg,#0b1712,#07100c);border-radius:16px;padding:18px}.bbb-compare-player-head{display:flex;justify-content:space-between;gap:18px;min-height:96px}.bbb-compare-side,.bbb-compare-empty-player span{color:#50ce8e;font-size:8px;font-weight:950;letter-spacing:.13em}.bbb-compare-player-head h2{font-size:25px;line-height:1;margin:8px 0 7px}.bbb-compare-meta{color:#7c9085;font-size:10px}.bbb-compare-head-rank{text-align:right;flex:none}.bbb-compare-head-rank>span{display:block;color:#65796e;font-size:7px;font-weight:900}.bbb-compare-head-rank>strong{display:block;color:#67da9d;font-size:29px;line-height:1;margin:5px 0 7px}.bbb-compare-empty-player{min-height:96px}.bbb-compare-empty-player strong{display:block;font-size:22px;margin:8px 0 4px}.bbb-compare-empty-player p{margin:0;color:#71847a;font-size:10px}.bbb-compare-search-wrap{position:relative;margin-top:14px}.bbb-compare-search{width:100%;background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:9px;padding:10px 12px;outline:none}.bbb-compare-search:focus{border-color:#2bb66f}.bbb-compare-results{position:absolute;left:0;right:0;top:calc(100% + 5px);z-index:80;max-height:330px;overflow:auto;background:#07100c;border:1px solid #2a503e;border-radius:10px;box-shadow:0 18px 50px #000}.bbb-compare-results button{width:100%;display:grid;grid-template-columns:1fr auto;gap:10px;text-align:left;border:0;border-bottom:1px solid #162b22;background:#08100c;color:#edf4ef;padding:10px 11px;cursor:pointer}.bbb-compare-results button:hover{background:#0d1a14}.bbb-compare-results strong{display:block;font-size:11px}.bbb-compare-results span{display:block;color:#708279;font-size:8px;margin-top:2px}.bbb-compare-results em{font-style:normal;color:#64d79b;font-size:9px;font-weight:950}.bbb-compare-no-results{padding:18px;color:#71847a;font-size:10px}.bbb-compare-verdict{display:grid;grid-template-columns:minmax(230px,.8fr) 1.2fr;gap:24px;align-items:center;margin:17px 0;border:1px solid #24503b;background:linear-gradient(135deg,#0b1c14,#08100c);border-radius:16px;padding:20px}.bbb-compare-verdict span,.bbb-compare-section-head>span,.bbb-compare-update-head>div>span,.bbb-compare-film-head>div>span{color:#50ce8e;font-size:8px;font-weight:950;letter-spacing:.12em}.bbb-compare-verdict h2{font-size:26px;margin:5px 0 0}.bbb-compare-verdict p{margin:0;color:#adbbb3;font-size:12px;line-height:1.7}.bbb-compare-table{border:1px solid #193127;background:#070d0a;border-radius:16px;overflow:hidden}.bbb-compare-row{display:grid;grid-template-columns:minmax(0,1fr) 190px minmax(0,1fr);border-bottom:1px solid #173027;min-height:62px}.bbb-compare-row:last-child{border-bottom:0}.bbb-compare-value,.bbb-compare-label{display:flex;align-items:center;padding:13px 16px}.bbb-compare-value{font-size:12px;font-weight:900}.bbb-compare-value:first-child{justify-content:flex-end;text-align:right}.bbb-compare-value:last-child{justify-content:flex-start}.bbb-compare-value.winner{background:#0a2418;color:#72dfa6}.bbb-compare-label{justify-content:center;text-align:center;flex-direction:column;background:#09110d;border-left:1px solid #173027;border-right:1px solid #173027}.bbb-compare-label strong{font-size:9px;text-transform:uppercase;letter-spacing:.08em}.bbb-compare-label span{color:#63776c;font-size:7px;margin-top:3px}.bbb-compare-move,.bbb-compare-market,.bbb-compare-health{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:950}.bbb-compare-move.up,.bbb-compare-health.healthy,.bbb-compare-market.buy{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-compare-move.down,.bbb-compare-market.fade{background:#351717;border:1px solid #743535;color:#f08b8b}.bbb-compare-move.flat,.bbb-compare-market.neutral{background:#18201c;border:1px solid #34443b;color:#aab8b0}.bbb-compare-health.watch{background:#2c2210;border:1px solid #66511c;color:#f0d16f}.bbb-compare-wait{padding:54px 20px;text-align:center;color:#71847a;font-size:12px}.bbb-compare-section{margin-top:34px}.bbb-compare-section-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}.bbb-compare-section-head h2{font-size:28px;margin:4px 0 0}.bbb-compare-section-head p{max-width:460px;margin:0;color:#71847a;font-size:10px}.bbb-compare-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bbb-compare-update,.bbb-compare-film{border:1px solid #193127;background:linear-gradient(160deg,#0c1511,#070b09);border-radius:15px;padding:18px}.bbb-compare-update-head,.bbb-compare-film-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.bbb-compare-update h3,.bbb-compare-film h3{font-size:18px;margin:5px 0 0}.bbb-compare-update p{color:#b6c3bc;font-size:11px;line-height:1.7;margin:15px 0 0}.bbb-compare-film-head>strong{font-size:29px;color:#65dc9d}.bbb-compare-film-meta{margin:11px 0;color:#7d9086;font-size:9px}.bbb-compare-traits{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.bbb-compare-traits div{padding:9px;border:1px solid #173027;background:#08100c;border-radius:8px}.bbb-compare-traits span{display:block;color:#667a70;font-size:7px;text-transform:uppercase}.bbb-compare-traits strong{display:block;margin-top:3px;font-size:12px}.bbb-profile-compare-action{display:inline-flex;margin-top:18px;padding:9px 12px;border:1px solid #2e503f;background:#0b1712;border-radius:9px;color:#d8e5de;font-size:9px;font-weight:950;letter-spacing:.04em}.bbb-profile-compare-action:hover{border-color:#49bd80;color:#fff}
  @media(max-width:850px){.bbb-compare-selectors{grid-template-columns:1fr}.bbb-compare-vs{min-height:28px}.bbb-compare-verdict{grid-template-columns:1fr}.bbb-compare-row{grid-template-columns:1fr 120px 1fr}.bbb-compare-two{grid-template-columns:1fr}.bbb-compare-section-head{align-items:flex-start;flex-direction:column}}
  @media(max-width:560px){.bbb-compare-content{padding:32px 0 55px}.bbb-compare-picker{padding:14px}.bbb-compare-player-head h2{font-size:20px}.bbb-compare-head-rank>strong{font-size:24px}.bbb-compare-row{grid-template-columns:1fr 92px 1fr}.bbb-compare-value,.bbb-compare-label{padding:10px 7px}.bbb-compare-value{font-size:9px}.bbb-compare-label strong{font-size:7px}.bbb-compare-traits{grid-template-columns:1fr}.bbb-compare-verdict h2{font-size:22px}}
  `;document.head.appendChild(s);
}
function bbbCompareInjectUi(){
  if(document.querySelector('#compareView'))return;
  bbbCompareInjectStyles();
  const main=document.createElement('main');main.id='compareView';main.className='bbb-compare-view hide';main.innerHTML=`<section class="bbb-compare-hero"><div class="shell"><div class="profile-kicker">BBB DECISION TOOL</div><h1>Compare Players.</h1><p>Put two dynasty assets side-by-side using Bobby's live rankings, market context, ranking movement, latest news, and film grades.</p></div></section><section class="bbb-compare-content"><div class="shell" id="bbbCompareMount"><div class="profile-loading">Loading player comparison…</div></div></section>`;
  const profile=document.querySelector('#profileView');profile.parentNode.insertBefore(main,profile);
  document.querySelectorAll('.nav-links').forEach(nav=>{if(!nav.querySelector('a[href="/#compare"]')){const a=document.createElement('a');a.href='/#compare';a.textContent='Compare';const yt=[...nav.querySelectorAll('a')].find(x=>x.href.includes('youtube'));nav.insertBefore(a,yt||null)}});
  const mobile=document.querySelector('.mobile-subnav');if(mobile&&!mobile.querySelector('a[href="/#compare"]')){const a=document.createElement('a');a.href='/#compare';a.textContent='Compare';mobile.appendChild(a)}
}
function bbbCompareAddProfileButton(){
  if(!location.pathname.startsWith('/player/'))return;
  const slug=location.pathname.split('/player/')[1]?.split(/[?#]/)[0]||'';
  const p=bbbComparePlayers.find(x=>profileSlug(x.name)===slug)||bbbComparePlayers.find(x=>x.player_key===slug);
  const hero=document.querySelector('#profileMount .profile-hero .shell');
  if(!p||!hero||hero.querySelector('.bbb-profile-compare-action'))return;
  const a=document.createElement('a');a.className='bbb-profile-compare-action';a.href=`/#compare?left=${encodeURIComponent(p.player_key)}`;a.textContent='COMPARE THIS PLAYER →';hero.appendChild(a);
}
async function bbbCompareLoad(){
  const [dynasty,rookies,prospects,movers]=await Promise.all([
    bbbDb('site_dynasty','select=*&order=rank.asc'),
    bbbDb('site_rookies','select=*&order=rank.asc'),
    bbbDb('site_prospects','select=*'),
    bbbDb('site_movers','select=*')
  ]);
  const rm=new Map((rookies||[]).map(x=>[x.player_key,x])),pm=new Map((prospects||[]).map(x=>[x.player_key,x])),mm=new Map((movers||[]).map(x=>[x.player_key,x]));
  bbbComparePlayers=(dynasty||[]).map(x=>({...x,rookie:rm.get(x.player_key)||null,prospect:pm.get(x.player_key)||null,mover:mm.get(x.player_key)||null}));
  bbbCompareParseHash();
  bbbCompareRender();
  setTimeout(bbbCompareAddProfileButton,0);
}
function bbbCompareRoute(){
  const show=location.hash.startsWith('#compare')&&!location.pathname.startsWith('/player/');
  const cv=document.querySelector('#compareView');if(!cv)return;
  cv.classList.toggle('hide',!show);
  if(show){['rankingsView','rookieView','prospectView','tradeView','profileView','updatesView','moversView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));bbbCompareParseHash();bbbCompareRender();window.scrollTo(0,0)}
}
function bbbCompareInit(){
  bbbCompareInjectUi();
  bbbCompareLoad().catch(e=>{console.error('BBB compare:',e);const m=document.querySelector('#bbbCompareMount');if(m)m.innerHTML='<div class="bbb-compare-wait">Player comparison is temporarily unavailable.</div>'});
  bbbCompareRoute();
  window.addEventListener('hashchange',()=>setTimeout(bbbCompareRoute,0));
  window.addEventListener('popstate',()=>setTimeout(()=>{bbbCompareRoute();setTimeout(bbbCompareAddProfileButton,0)},0));
  const obs=new MutationObserver(()=>bbbCompareAddProfileButton());
  const pm=document.querySelector('#profileMount');if(pm)obs.observe(pm,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbCompareInit);else bbbCompareInit();
