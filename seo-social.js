(function(){
  const SITE='https://bobbysbigboard.com';
  const DEFAULT={
    title:"Bobby's Big Board | Dynasty Fantasy Football Rankings",
    description:"Bobby's Big Board dynasty Superflex rankings, rookie rankings, prospect grades, player profiles, market movers, player comparison, and trade calculator.",
    path:'/'
  };
  const ROUTES={
    '#rankings':{title:"Dynasty Fantasy Football Rankings | Bobby's Big Board",description:"Bobby's live Top 500 dynasty Superflex rankings with market gaps, advanced filters, player profiles, and trade values.",path:'/rankings'},
    '#rookies':{title:"2026 Dynasty Rookie Rankings | Bobby's Big Board",description:"Bobby's live 2026 dynasty rookie rankings for Superflex leagues, with tiers, market context, and player profiles.",path:'/rookies'},
    '#prospects':{title:"Dynasty Prospect Grades | Bobby's Big Board",description:"Browse Bobby's film-based prospect grades, traits, draft classes, and pro comparisons for quarterbacks, running backs, wide receivers, and tight ends.",path:'/prospects'},
    '#trade':{title:"Dynasty Trade Calculator | Bobby's Big Board",description:"Build dynasty trades with Bobby's live Superflex values, cornerstone premiums, package discounts, draft picks, and BBB-vs-market valuation.",path:'/trade'},
    '#compare':{title:"Dynasty Player Compare | Bobby's Big Board",description:"Compare two dynasty players head-to-head using Bobby's rankings, market value, age, injury status, movement, prospect grades, and recent updates.",path:'/compare'},
    '#movers':{title:"Dynasty Market Movers | Bobby's Big Board",description:"Track the biggest dynasty ranking risers, fallers, and BBB-vs-market movement across Bobby's Big Board.",path:'/movers'},
    '#updates':{title:"Dynasty Player Updates | Bobby's Big Board",description:"Read the latest meaningful dynasty player updates, injuries, role changes, roster news, and performance notes tracked by Bobby's Big Board.",path:'/updates'}
  };

  function setMeta(selector,attr,value){
    let el=document.head.querySelector(selector);
    if(!el){
      el=document.createElement('meta');
      if(selector.includes('property=')){el.setAttribute('property',selector.match(/property="([^"]+)/)?.[1]||'');}
      else el.setAttribute('name',selector.match(/name="([^"]+)/)?.[1]||'');
      document.head.appendChild(el);
    }
    el.setAttribute(attr,value);
  }
  function canonical(path){
    let el=document.head.querySelector('link[rel="canonical"]');
    if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el);}
    el.href=SITE+path;
  }
  function playerMeta(){
    if(!location.pathname.startsWith('/player/'))return null;
    const slug=decodeURIComponent(location.pathname.split('/player/')[1]||'').split('/')[0];
    const found=typeof profileFind==='function'?profileFind(slug):null;
    const dynasty=found&&Array.isArray(players)?players.find(x=>typeof profileNorm==='function'&&profileNorm(x.name)===profileNorm(found.name)):null;
    const name=found?.name||document.querySelector('.profile-title')?.textContent?.trim()||slug.split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');
    const rank=dynasty?.rank?`BBB dynasty rank #${dynasty.rank}. `:'';
    const pos=found?.pos||dynasty?.pos||'';
    const team=dynasty?.team||found?.team||'';
    const description=`${name} dynasty fantasy football profile. ${rank}${pos}${team?' • '+team:''}. Rankings, market value, player updates, ranking history, career fantasy production, and prospect context from Bobby's Big Board.`;
    return {title:`${name} Dynasty Profile | Bobby's Big Board`,description,path:`/player/${slug}`};
  }
  function current(){
    const p=playerMeta();if(p)return p;
    const h=(location.hash||'#rankings').split('?')[0];
    return ROUTES[h]||DEFAULT;
  }
  function sync(){
    const m=current();
    document.title=m.title;
    setMeta('meta[name="description"]','content',m.description);
    setMeta('meta[property="og:title"]','content',m.title);
    setMeta('meta[property="og:description"]','content',m.description);
    setMeta('meta[property="og:url"]','content',SITE+m.path);
    setMeta('meta[name="twitter:title"]','content',m.title);
    setMeta('meta[name="twitter:description"]','content',m.description);
    canonical(m.path);
    return m;
  }
  function addShareButton(){
    if(!location.pathname.startsWith('/player/'))return;
    const actions=document.querySelector('.bbb-v2-actions');
    if(!actions||actions.querySelector('.bbb-share-profile'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='bbb-share-profile';btn.textContent='Share Profile';
    btn.onclick=async()=>{
      const m=sync(),url=SITE+m.path;
      try{
        if(navigator.share){await navigator.share({title:m.title,text:m.description,url});return;}
        await navigator.clipboard.writeText(url);
        const old=btn.textContent;btn.textContent='Link Copied ✓';setTimeout(()=>btn.textContent=old,1600);
      }catch(e){if(e?.name!=='AbortError')console.warn('Share profile',e);}
    };
    actions.appendChild(btn);
  }
  function installStyle(){
    if(document.querySelector('#bbb-share-style'))return;
    const s=document.createElement('style');s.id='bbb-share-style';s.textContent=`.bbb-v2-actions .bbb-share-profile{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border:1px solid #27513c;background:#0a1811;color:#9fe3bc;border-radius:9px;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;cursor:pointer}.bbb-v2-actions .bbb-share-profile:hover{border-color:#50ce8e;color:#fff}`;document.head.appendChild(s);
  }
  function refresh(){sync();addShareButton();}

  installStyle();
  window.addEventListener('hashchange',()=>setTimeout(refresh,0));
  window.addEventListener('popstate',()=>setTimeout(refresh,0));
  document.addEventListener('DOMContentLoaded',()=>{
    refresh();
    const mount=document.querySelector('#profileMount');
    if(mount)new MutationObserver(()=>refresh()).observe(mount,{childList:true,subtree:true});
  });
})();
