// Make all draft-pick rounds easy to find in the trade calculator.
// The database already contains 1st- through 4th-round values; this layer
// improves search aliases/discoverability without changing the valuation model.
(function(){
  function esc(v){
    return typeof bbbEsc==='function'
      ? bbbEsc(v)
      : String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function normalizePickQuery(raw){
    return String(raw||'')
      .trim()
      .toLowerCase()
      .replace(/\bfirst\b/g,'1st')
      .replace(/\bsecond\b/g,'2nd')
      .replace(/\bthird\b/g,'3rd')
      .replace(/\bfourth\b/g,'4th')
      .replace(/\bround\s*1\b/g,'1st')
      .replace(/\bround\s*2\b/g,'2nd')
      .replace(/\bround\s*3\b/g,'3rd')
      .replace(/\bround\s*4\b/g,'4th')
      .replace(/\b(1st|2nd|3rd|4th)\s+round\b/g,'$1')
      .replace(/\s+/g,' ');
  }

  function pickAliases(p){
    const range=String(p?.range||'').toLowerCase();
    let alias='';
    if(/1st/.test(range))alias='1st first first-round first round round 1';
    else if(/2nd/.test(range))alias='2nd second second-round second round round 2';
    else if(/3rd/.test(range))alias='3rd third third-round third round round 3';
    else if(/4th/.test(range))alias='4th fourth fourth-round fourth round round 4';
    return `${p?.name||''} ${p?.year||''} ${p?.range||''} pick draft pick ${alias}`.toLowerCase();
  }

  searchTrade=function(s){
    const inp=document.querySelector('#tradeSearch'+s);
    const out=document.querySelector('#tradeResults'+s);
    if(!inp||!out)return;

    const raw=inp.value.trim().toLowerCase();
    const qq=normalizePickQuery(raw);
    if(!qq){out.classList.add('hide');return;}

    const usedPlayerRanks=new Set([...tradeA,...tradeB].filter(x=>typeof x==='number'));
    const usedPickIds=new Set([...tradeA,...tradeB].filter(x=>typeof x==='string'&&x.startsWith('pick:')));

    const pm=players
      .filter(p=>!usedPlayerRanks.has(p.rank)&&(`${p.name} ${p.team} ${p.pos}`).toLowerCase().includes(raw))
      .map(p=>({kind:'player',key:String(p.rank),obj:p,score:p.name.toLowerCase().startsWith(raw)?0:2}));

    const km=(typeof draftPicks!=='undefined'?draftPicks:[])
      .filter(p=>!usedPickIds.has(p.id)&&pickAliases(p).includes(qq))
      .map(p=>{
        const exactYear=String(p.year)===qq;
        const exactName=String(p.name||'').toLowerCase()===qq;
        const starts=String(p.name||'').toLowerCase().startsWith(qq);
        return {kind:'pick',key:p.id,obj:p,score:exactName?0:(exactYear||starts?1:2)};
      });

    const pickIntent=/\b(20\d{2}|pick|draft|1st|2nd|3rd|4th|early|mid|late|unknown)\b/.test(qq);
    const m=(pickIntent?[...km,...pm]:[...pm,...km])
      .sort((a,b)=>a.score-b.score||(a.kind==='pick'?-1:1))
      .slice(0,pickIntent?24:12);

    out.innerHTML=m.length?m.map(x=>x.kind==='pick'
      ? `<button class="trade-result pick-result" data-kind="pick" data-key="${esc(x.key)}"><div><strong>${esc(x.obj.name)}</strong><span><span class="pick-badge">PICK</span> • ${esc(x.obj.year)} • ${esc(x.obj.range)}</span></div><span class="trade-result-value">${fmt(Number(x.obj.value)||0)}</span></button>`
      : `<button class="trade-result" data-kind="player" data-key="${x.key}"><div><strong>${esc(x.obj.name)}</strong><span>BBB #${x.obj.rank} • Market ${x.obj.market?'#'+x.obj.market:'UR'} • ${x.obj.pos}${x.obj.pr||''} • ${esc(x.obj.team||'')}</span></div><span class="trade-result-value">${fmt(typeof val==='function'?val(x.obj):0)}</span></button>`
    ).join(''):'<div class="empty">No matches.</div>';

    out.classList.remove('hide');
    out.querySelectorAll('.trade-result').forEach(b=>b.onclick=()=>{
      const arr=s==='A'?tradeA:tradeB;
      if(arr.length<8)arr.push(b.dataset.kind==='player'?+b.dataset.key:b.dataset.key);
      inp.value='';
      out.classList.add('hide');
      tradeRender();
    });
  };

  function addPickHints(){
    ['A','B'].forEach(s=>{
      const inp=document.querySelector('#tradeSearch'+s);
      if(!inp)return;
      inp.placeholder='Search player or pick (ex. 2027 3rd)';
      const wrap=inp.closest('.trade-search-wrap');
      if(!wrap||wrap.querySelector('.bbb-pick-search-hint'))return;
      const hint=document.createElement('div');
      hint.className='bbb-pick-search-hint';
      hint.textContent='1st–4th round picks for 2027–2029 are included. Try “2027 3rd” or “2028 4th”.';
      wrap.appendChild(hint);
    });

    if(!document.querySelector('#bbbPickSearchHintStyles')){
      const style=document.createElement('style');
      style.id='bbbPickSearchHintStyles';
      style.textContent='.bbb-pick-search-hint{margin-top:6px;color:#61766b;font-size:8px;line-height:1.45}.trade-search-wrap:focus-within .bbb-pick-search-hint{color:#8eaa9a}';
      document.head.appendChild(style);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addPickHints);
  else addPickHints();
})();
