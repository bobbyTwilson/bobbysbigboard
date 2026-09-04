// Bobby's Big Board primary navigation polish.
// Keeps core destinations visible and consolidates research tools under Explore.

function bbbNavHrefKey(a){
  const raw=(a?.getAttribute('href')||'').trim();
  if(!raw)return '';
  if(raw.startsWith('/#'))return raw.slice(1);
  return raw;
}

const BBB_EXPLORE_LINKS=[
  ['#opportunity','Opportunity Feed','Who just gained or lost meaningful dynasty opportunity.'],
  ['#updates','Updates','Latest injury, role, performance and roster news.'],
  ['#movers','Movers','BBB risers, fallers and market-value gaps.'],
  ['#compare','Compare Players','Put two dynasty assets side-by-side.']
];

function bbbNavInjectStyles(){
  if(document.querySelector('#bbb-nav-polish-styles'))return;
  const s=document.createElement('style');
  s.id='bbb-nav-polish-styles';
  s.textContent=`
    .nav-links{align-items:center;white-space:nowrap}
    .bbb-nav-explore{position:relative;display:flex;align-items:center}
    .bbb-nav-explore-btn{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#a8b6af;padding:0;cursor:pointer;font:inherit;font-size:13px;font-weight:800;white-space:nowrap}
    .bbb-nav-explore-btn:hover,.bbb-nav-explore.open .bbb-nav-explore-btn,.bbb-nav-explore:focus-within .bbb-nav-explore-btn{color:#fff}
    .bbb-nav-chevron{font-size:9px;color:#6d8176;transition:transform .16s ease}
    .bbb-nav-explore.open .bbb-nav-chevron,.bbb-nav-explore:focus-within .bbb-nav-chevron{transform:rotate(180deg)}
    .bbb-nav-explore-menu{position:absolute;top:calc(100% + 20px);left:50%;transform:translateX(-50%) translateY(-5px);width:310px;padding:8px;border:1px solid #214033;background:rgba(6,14,10,.98);border-radius:14px;box-shadow:0 22px 60px rgba(0,0,0,.48);opacity:0;visibility:hidden;pointer-events:none;transition:.15s ease;z-index:100}
    .bbb-nav-explore.open .bbb-nav-explore-menu,.bbb-nav-explore:focus-within .bbb-nav-explore-menu{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}
    .bbb-nav-explore-menu:before{content:'';position:absolute;left:0;right:0;top:-22px;height:22px}
    .bbb-nav-explore-menu>a{display:grid;gap:3px;padding:11px 12px;border-radius:9px;color:#d7e2dc!important}
    .bbb-nav-explore-menu>a:hover{background:#0c1c15;color:#fff!important}
    .bbb-nav-explore-menu strong{font-size:11px;font-weight:950}
    .bbb-nav-explore-menu span{color:#70857a;font-size:8px;font-weight:650;line-height:1.35}
    .bbb-mobile-explore-btn{display:none}
    .bbb-mobile-explore-sheet{display:none}
    @media(max-width:1120px){.nav-links{gap:16px!important}.bbb-nav-explore-btn{font-size:12px}}
    @media(max-width:950px){
      .bbb-nav-explore{display:none}.mobile-subnav{white-space:nowrap}
      .bbb-mobile-explore-btn{display:inline-flex;flex:none;align-items:center;gap:5px;padding:7px 10px;border:1px solid #203d30;background:#08110d;border-radius:999px;color:#9baca3;font-size:10px;font-weight:900;cursor:pointer}
      .bbb-mobile-explore-btn.open{color:#fff;border-color:#3c6a54;background:#0b1a13}
      .bbb-mobile-explore-sheet{position:fixed;left:10px;right:10px;top:112px;z-index:180;padding:8px;border:1px solid #214033;background:rgba(6,14,10,.985);border-radius:14px;box-shadow:0 24px 65px rgba(0,0,0,.55)}
      .bbb-mobile-explore-sheet.open{display:grid}
      .bbb-mobile-explore-sheet a{display:grid;gap:3px;padding:11px 12px;border-radius:9px;color:#d7e2dc}
      .bbb-mobile-explore-sheet a:hover{background:#0c1c15}
      .bbb-mobile-explore-sheet strong{font-size:11px;font-weight:950}
      .bbb-mobile-explore-sheet span{color:#70857a;font-size:8px;line-height:1.35}
    }
    @media(max-width:640px){.bbb-mobile-explore-sheet{top:104px}}
  `;
  document.head.appendChild(s);
}

function bbbNavExploreMarkup(){
  return BBB_EXPLORE_LINKS.map(([href,title,copy])=>`<a href="${href}"><strong>${title}</strong><span>${copy}</span></a>`).join('');
}

function bbbNavMakeExplore(){
  const wrap=document.createElement('div');
  wrap.className='bbb-nav-explore';
  wrap.innerHTML=`<button type="button" class="bbb-nav-explore-btn" aria-expanded="false" aria-haspopup="true">Explore <span class="bbb-nav-chevron">▾</span></button><div class="bbb-nav-explore-menu">${bbbNavExploreMarkup()}</div>`;
  const btn=wrap.querySelector('.bbb-nav-explore-btn');
  btn.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const open=!wrap.classList.contains('open');
    document.querySelectorAll('.bbb-nav-explore.open').forEach(x=>x.classList.remove('open'));
    wrap.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
  });
  wrap.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    wrap.classList.remove('open');btn.setAttribute('aria-expanded','false');
  }));
  return wrap;
}

function bbbNavPolishDesktop(nav){
  const links=[...nav.querySelectorAll(':scope > a')];
  const byKey=new Map(links.map(a=>[bbbNavHrefKey(a),a]));
  const rankings=byKey.get('#rankings');
  const rookies=byKey.get('#rookies');
  const prospects=byKey.get('#prospects');
  const watchlist=byKey.get('#watchlist');
  const youtube=links.find(a=>(a.getAttribute('href')||'').includes('youtube.com'));

  if(rankings)rankings.textContent='Rankings';
  if(rookies)rookies.textContent='Rookies';
  if(prospects)prospects.textContent='Prospects';
  if(watchlist)watchlist.textContent='My Players ☆';
  if(youtube)youtube.textContent='YouTube ↗';

  links.forEach(a=>{
    const key=bbbNavHrefKey(a);
    if(BBB_EXPLORE_LINKS.some(([href])=>href===key))a.remove();
  });

  let explore=nav.querySelector(':scope > .bbb-nav-explore');
  if(!explore){explore=bbbNavMakeExplore();nav.insertBefore(explore,youtube||null)}

  [rankings,rookies,prospects,watchlist,explore,youtube].filter(Boolean).forEach(el=>nav.appendChild(el));
}

function bbbNavEnsureMobileSheet(){
  let sheet=document.querySelector('#bbbMobileExploreSheet');
  if(sheet)return sheet;
  sheet=document.createElement('div');
  sheet.id='bbbMobileExploreSheet';
  sheet.className='bbb-mobile-explore-sheet';
  sheet.innerHTML=bbbNavExploreMarkup();
  sheet.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>bbbNavCloseMobileExplore()));
  document.body.appendChild(sheet);
  return sheet;
}

function bbbNavCloseMobileExplore(){
  document.querySelector('#bbbMobileExploreSheet')?.classList.remove('open');
  document.querySelectorAll('.bbb-mobile-explore-btn.open').forEach(btn=>{
    btn.classList.remove('open');btn.setAttribute('aria-expanded','false');
  });
}

function bbbNavPolishMobile(){
  bbbNavEnsureMobileSheet();
  document.querySelectorAll('.mobile-subnav').forEach(nav=>{
    const seen=new Set();
    [...nav.querySelectorAll('a')].forEach(a=>{
      const key=bbbNavHrefKey(a);
      if(BBB_EXPLORE_LINKS.some(([href])=>href===key)){a.remove();return}
      if(seen.has(key)){a.remove();return}
      seen.add(key);
      if(key==='#rankings')a.textContent='Rankings';
      else if(key==='#rookies')a.textContent='Rookies';
      else if(key==='#prospects')a.textContent='Prospects';
      else if(key==='#watchlist')a.textContent='My Players ☆';
    });
    let btn=nav.querySelector('.bbb-mobile-explore-btn');
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='bbb-mobile-explore-btn';btn.setAttribute('aria-expanded','false');btn.textContent='Explore ▾';nav.appendChild(btn);
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const sheet=bbbNavEnsureMobileSheet();
        const open=!sheet.classList.contains('open');
        bbbNavCloseMobileExplore();
        sheet.classList.toggle('open',open);btn.classList.toggle('open',open);btn.setAttribute('aria-expanded',open?'true':'false');
      });
    }
  });
}

function bbbNavPolish(){
  bbbNavInjectStyles();
  document.querySelectorAll('.nav-links').forEach(bbbNavPolishDesktop);
  bbbNavPolishMobile();
}

function bbbNavInit(){
  bbbNavPolish();
  [0,150,600,1400].forEach(ms=>setTimeout(bbbNavPolish,ms));
  document.addEventListener('click',e=>{
    if(e.target.closest('.bbb-nav-explore,.bbb-mobile-explore-btn,#bbbMobileExploreSheet'))return;
    document.querySelectorAll('.bbb-nav-explore.open').forEach(w=>{
      w.classList.remove('open');w.querySelector('.bbb-nav-explore-btn')?.setAttribute('aria-expanded','false');
    });
    bbbNavCloseMobileExplore();
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    document.querySelectorAll('.bbb-nav-explore.open').forEach(w=>{
      w.classList.remove('open');w.querySelector('.bbb-nav-explore-btn')?.setAttribute('aria-expanded','false');
    });
    bbbNavCloseMobileExplore();
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbNavInit);else bbbNavInit();
