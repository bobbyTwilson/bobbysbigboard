// Bobby's Big Board primary navigation polish.
// Keeps the core destinations visible while grouping secondary research tools.

function bbbNavHrefKey(a){
  const raw=(a?.getAttribute('href')||'').trim();
  if(!raw)return '';
  if(raw.startsWith('/#'))return raw.slice(1);
  return raw;
}

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
    @media(max-width:1120px){.nav-links{gap:16px!important}.bbb-nav-explore-btn{font-size:12px}}
    @media(max-width:950px){.bbb-nav-explore{display:none}.mobile-subnav{white-space:nowrap}}
  `;
  document.head.appendChild(s);
}

function bbbNavMakeExplore(){
  const wrap=document.createElement('div');
  wrap.className='bbb-nav-explore';
  wrap.innerHTML=`<button type="button" class="bbb-nav-explore-btn" aria-expanded="false" aria-haspopup="true">Explore <span class="bbb-nav-chevron">▾</span></button><div class="bbb-nav-explore-menu"><a href="#updates"><strong>Updates</strong><span>Latest injury, role, performance and roster news.</span></a><a href="#movers"><strong>Movers</strong><span>BBB risers, fallers and market-value gaps.</span></a><a href="#compare"><strong>Compare Players</strong><span>Put two dynasty assets side-by-side.</span></a></div>`;
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

  links.forEach(a=>{
    const key=bbbNavHrefKey(a);
    if(['#updates','#movers','#compare'].includes(key))a.remove();
  });

  let explore=nav.querySelector(':scope > .bbb-nav-explore');
  if(!explore){explore=bbbNavMakeExplore();nav.insertBefore(explore,youtube||null)}

  // Keep a predictable visual hierarchy even if another feature appended a link.
  [rankings,rookies,prospects,watchlist,explore,youtube].filter(Boolean).forEach(el=>nav.appendChild(el));
}

function bbbNavPolishMobile(){
  document.querySelectorAll('.mobile-subnav').forEach(nav=>{
    [...nav.querySelectorAll('a')].forEach(a=>{
      const key=bbbNavHrefKey(a);
      if(key==='#rankings')a.textContent='Rankings';
      else if(key==='#rookies')a.textContent='Rookies';
      else if(key==='#prospects')a.textContent='Prospects';
      else if(key==='#watchlist')a.textContent='My Players ☆';
    });
  });
}

function bbbNavPolish(){
  bbbNavInjectStyles();
  document.querySelectorAll('.nav-links').forEach(bbbNavPolishDesktop);
  bbbNavPolishMobile();
}

function bbbNavInit(){
  bbbNavPolish();
  // Some BBB feature scripts add their navigation entries during the same load.
  // Re-run briefly after initialization so those links are consolidated as well.
  [0,150,600].forEach(ms=>setTimeout(bbbNavPolish,ms));
  document.addEventListener('click',e=>{
    if(e.target.closest('.bbb-nav-explore'))return;
    document.querySelectorAll('.bbb-nav-explore.open').forEach(w=>{
      w.classList.remove('open');
      w.querySelector('.bbb-nav-explore-btn')?.setAttribute('aria-expanded','false');
    });
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    document.querySelectorAll('.bbb-nav-explore.open').forEach(w=>{
      w.classList.remove('open');
      w.querySelector('.bbb-nav-explore-btn')?.setAttribute('aria-expanded','false');
    });
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbNavInit);else bbbNavInit();
