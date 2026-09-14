(function(){
  const SITE='https://bobbysbigboard.com';
  const ROUTES={
    '#rankings':{title:"2026 Dynasty Fantasy Football Rankings (Superflex Top 500) | Bobby's Big Board",description:"Updated 2026 dynasty fantasy football Superflex Top 500 rankings with position ranks, market comparisons, player profiles, trade values, and Bobby's independent dynasty evaluations.",path:'/rankings'},
    '#rookies':{title:"2026 Dynasty Rookie Rankings (Superflex Top 100) | Bobby's Big Board",description:"Updated 2026 dynasty rookie rankings for Superflex leagues with a Top 100 rookie board, tiers, market comparisons, player profiles, and Bobby's independent evaluations.",path:'/rookies'},
    '#prospects':{title:"NFL Draft Prospect Rankings & Grades | Bobby's Big Board",description:"Browse film-based NFL Draft prospect rankings and grades with position-specific traits, draft classes, scouting context, and pro comparisons from Bobby's Big Board.",path:'/prospects'},
    '#stats':{title:"2026 Fantasy Football PPR Leaders & Player Stats | Bobby's Big Board",description:"Track 2026 fantasy football PPR leaders, positional fantasy ranks, passing, rushing, receiving, weekly production, and season stats alongside Bobby's dynasty rankings.",path:'/stats'},
    '#trade':{title:"Dynasty Trade Calculator & Superflex Values | Bobby's Big Board",description:"Build dynasty fantasy football trades using Bobby's live Superflex rankings, player values, draft picks, package adjustments, and BBB-vs-market valuations.",path:'/trade'},
    '#compare':{title:"Dynasty Fantasy Football Player Comparison | Bobby's Big Board",description:"Compare dynasty fantasy football players head-to-head using Bobby's rankings, market value, age, injuries, recent updates, movement, and prospect grades.",path:'/compare'},
    '#movers':{title:"Dynasty Fantasy Football Risers & Fallers | Bobby's Big Board",description:"Track dynasty fantasy football risers, fallers, ranking movement, and the biggest differences between Bobby's Big Board and current market value.",path:'/movers'},
    '#updates':{title:"Dynasty Fantasy Football Player News & Updates | Bobby's Big Board",description:"Follow dynasty fantasy football player news, injuries, role changes, roster moves, and performance updates tracked across Bobby's Big Board.",path:'/updates'}
  };
  const DEFAULT={title:"Dynasty Fantasy Football Rankings, Stats & Prospect Grades | Bobby's Big Board",description:"Independent 2026 dynasty Superflex Top 500 rankings, rookie rankings, PPR fantasy stats, NFL Draft prospect grades, player updates, market movers, comparisons, and trade tools.",path:'/'};
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');}
  function setMeta(selector,attr,value){
    let el=document.head.querySelector(selector);
    if(!el){el=document.createElement('meta');if(selector.includes('property='))el.setAttribute('property',selector.match(/property="([^"]+)/)?.[1]||'');else el.setAttribute('name',selector.match(/name="([^"]+)/)?.[1]||'');document.head.appendChild(el);}
    el.setAttribute(attr,value);
  }
  function canonical(path){let el=document.head.querySelector('link[rel="canonical"]');if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el);}el.href=SITE+path;}
  function playerMeta(){
    if(!location.pathname.startsWith('/player/'))return null;
    const slug=decodeURIComponent(location.pathname.split('/player/')[1]||'').split('/')[0];
    const found=typeof profileFind==='function'?profileFind(slug):null;
    const titleName=(document.querySelector('.profile-title')?.textContent||'').replace(/\s+/g,' ').trim();
    const name=found?.name||titleName||slug.split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');
    const dynasty=Array.isArray(players)?players.find(x=>norm(x.name)===norm(name)):null;
    const prospect=Array.isArray(prospects)?prospects.find(x=>norm(x.name)===norm(name)):null;
    if(!dynasty&&prospect){
      const year=prospect.year||'';
      return {title:`${name}${year?' '+year:''} NFL Draft Scouting Report & Grade | Bobby's Big Board`,description:`${name} NFL Draft scouting report with Bobby's prospect grade${prospect.comp?`, pro comp ${prospect.comp}`:''}, film traits, strengths, concerns, and dynasty prospect context.`,path:`/player/${slug}`};
    }
    const rank=dynasty?.rank?`BBB dynasty rank #${dynasty.rank}. `:'';
    const pos=dynasty?.pos||found?.pos||'';
    const team=dynasty?.team||found?.team||'';
    return {title:`${name} Dynasty Ranking, Stats & Outlook | Bobby's Big Board`,description:`${name} dynasty fantasy football ranking, stats and outlook. ${rank}${pos}${team?' • '+team:''}. Market value, player updates, ranking history, career production, and prospect context.`,path:`/player/${slug}`};
  }
  function current(){
    const p=playerMeta();if(p)return p;
    const h=(location.hash||'').split('?')[0];
    if(h&&ROUTES[h])return ROUTES[h];
    const byPath=Object.values(ROUTES).find(x=>x.path===location.pathname.replace(/\/$/,'')||(`${x.path}/`===location.pathname));
    return byPath||DEFAULT;
  }
  function sync(){
    const m=current();document.title=m.title;
    setMeta('meta[name="description"]','content',m.description);
    setMeta('meta[property="og:title"]','content',m.title);setMeta('meta[property="og:description"]','content',m.description);setMeta('meta[property="og:url"]','content',SITE+m.path);
    setMeta('meta[name="twitter:title"]','content',m.title);setMeta('meta[name="twitter:description"]','content',m.description);canonical(m.path);
  }
  function queue(){setTimeout(sync,25);setTimeout(sync,250);}
  window.addEventListener('hashchange',queue);window.addEventListener('popstate',queue);
  document.addEventListener('DOMContentLoaded',()=>{queue();const mount=document.querySelector('#profileMount');if(mount)new MutationObserver(queue).observe(mount,{childList:true,subtree:true});});
})();
