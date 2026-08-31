(function(){
  const state={
    team:'ALL',draft:'ALL',age:'ALL',injury:'ALL',college:'ALL',gap:'ALL',marketRank:'ALL',movement:'ALL',sort:'bbb',
    quick:{under25:false,rookies:false,healthy:false,riser7:false,faller7:false,market100:false}
  };
  const quickKeys=['under25','rookies','healthy','riser7','faller7','market100'];
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const n=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const x=Number(v);return Number.isFinite(x)?x:null;};
  const isHealthy=p=>/^healthy$/i.test(String(p.injuryStatus||'').trim());
  const moveVal=(p,k)=>n(p[k])??0;
  const tradeVal=p=>typeof val==='function'?val(p):Math.round(10000*Math.exp(-.012*((p.rank||500)-1)));
  const collegeParts=v=>String(v||'').split(/\s*(?:,|;|\||\/)\s*/).map(x=>x.trim()).filter(Boolean);

  function advancedFilter(list){
    let out=list.filter(p=>{
      if(state.team!=='ALL'&&p.team!==state.team)return false;
      if(state.draft!=='ALL'&&String(n(p.draft))!==state.draft)return false;
      const age=n(p.age);
      if(state.age==='u23'&&!(age!==null&&age<23))return false;
      if(state.age==='u25'&&!(age!==null&&age<25))return false;
      if(state.age==='23-25'&&!(age!==null&&age>=23&&age<25))return false;
      if(state.age==='25-27'&&!(age!==null&&age>=25&&age<28))return false;
      if(state.age==='28plus'&&!(age!==null&&age>=28))return false;
      if(state.injury==='HEALTHY'&&!isHealthy(p))return false;
      if(state.injury==='WATCH'&&isHealthy(p))return false;
      if(state.college!=='ALL'&&!collegeParts(p.college).includes(state.college))return false;
      const gap=n(p.gap);
      if(state.gap==='buy20'&&!(gap!==null&&gap>=20))return false;
      if(state.gap==='buy50'&&!(gap!==null&&gap>=50))return false;
      if(state.gap==='buy100'&&!(gap!==null&&gap>=100))return false;
      if(state.gap==='fade20'&&!(gap!==null&&gap<=-20))return false;
      if(state.gap==='fade50'&&!(gap!==null&&gap<=-50))return false;
      if(state.gap==='fade100'&&!(gap!==null&&gap<=-100))return false;
      const market=n(p.market);
      if(state.marketRank==='top50'&&!(market!==null&&market<=50))return false;
      if(state.marketRank==='top100'&&!(market!==null&&market<=100))return false;
      if(state.marketRank==='100plus'&&!(market!==null&&market>=100))return false;
      if(state.marketRank==='150plus'&&!(market!==null&&market>=150))return false;
      if(state.marketRank==='200plus'&&!(market!==null&&market>=200))return false;
      if(state.marketRank==='unranked'&&market!==null)return false;
      const m7=moveVal(p,'move7'),m30=moveVal(p,'move30');
      if(state.movement==='rise7'&&!(m7>0))return false;
      if(state.movement==='fall7'&&!(m7<0))return false;
      if(state.movement==='rise30'&&!(m30>0))return false;
      if(state.movement==='fall30'&&!(m30<0))return false;
      if(state.movement==='move20_7'&&!(Math.abs(m7)>=20))return false;
      if(state.movement==='move20_30'&&!(Math.abs(m30)>=20))return false;
      if(state.quick.under25&&!(age!==null&&age<25))return false;
      if(state.quick.rookies&&String(n(p.draft))!=='2026')return false;
      if(state.quick.healthy&&!isHealthy(p))return false;
      if(state.quick.riser7&&!(m7>0))return false;
      if(state.quick.faller7&&!(m7<0))return false;
      if(state.quick.market100&&!(market!==null&&market>=100))return false;
      return true;
    });
    const cmp={
      bbb:(a,b)=>(a.rank||9999)-(b.rank||9999),
      market:(a,b)=>(n(a.market)??9999)-(n(b.market)??9999)||(a.rank-b.rank),
      ageYoung:(a,b)=>(n(a.age)??999)-(n(b.age)??999)||(a.rank-b.rank),
      ageOld:(a,b)=>(n(b.age)??-1)-(n(a.age)??-1)||(a.rank-b.rank),
      gapHigh:(a,b)=>(n(b.gap)??-9999)-(n(a.gap)??-9999)||(a.rank-b.rank),
      gapLow:(a,b)=>(n(a.gap)??9999)-(n(b.gap)??9999)||(a.rank-b.rank),
      rise7:(a,b)=>moveVal(b,'move7')-moveVal(a,'move7')||(a.rank-b.rank),
      fall7:(a,b)=>moveVal(a,'move7')-moveVal(b,'move7')||(a.rank-b.rank),
      rise30:(a,b)=>moveVal(b,'move30')-moveVal(a,'move30')||(a.rank-b.rank),
      fall30:(a,b)=>moveVal(a,'move30')-moveVal(b,'move30')||(a.rank-b.rank),
      value:(a,b)=>tradeVal(b)-tradeVal(a)||(a.rank-b.rank)
    }[state.sort]||((a,b)=>a.rank-b.rank);
    return out.sort(cmp);
  }

  const originalFilt=typeof filt==='function'?filt:null;
  if(originalFilt)filt=function(){return advancedFilter(originalFilt());};

  async function enrichPlayers(){
    if(!Array.isArray(players)||!players.length)return;
    const [meta,movers]=await Promise.all([
      bbbDb('site_dynasty','select=player_key,name,age,draft,college'),
      bbbDb('site_movers','select=player_key,name,bbb_move_7d,bbb_move_30d')
    ]);
    const metaMap=new Map(meta.map(x=>[norm(x.name),x]));
    const moverMap=new Map(movers.map(x=>[norm(x.name),x]));
    players.forEach(p=>{
      const m=metaMap.get(norm(p.name)),mo=moverMap.get(norm(p.name));
      if(m){
        p.playerKey=m.player_key||'';
        p.college=m.college||'';
        p.age=n(m.age);
        p.draft=n(m.draft);
      }
      p.move7=n(mo?.bbb_move_7d);
      p.move30=n(mo?.bbb_move_30d);
    });
  }

  const originalLoad=typeof load==='function'?load:null;
  if(originalLoad)load=async function(){
    await originalLoad();
    try{await enrichPlayers();}catch(e){console.error('Advanced rankings enrichment:',e);}
    populateOptions();
    visible=50;
    render();
    syncUi();
  };

  function activeCount(){
    let count=0;
    if(typeof pos!=='undefined'&&pos!=='ALL')count++;
    if(typeof q!=='undefined'&&q)count++;
    if(typeof mf!=='undefined'&&mf!=='ALL')count++;
    ['team','draft','age','injury','college','gap','marketRank','movement'].forEach(k=>{if(state[k]&&state[k]!=='ALL')count++;});
    quickKeys.forEach(k=>{if(state.quick[k])count++;});
    if(state.sort!=='bbb')count++;
    return count;
  }

  function populateOptions(){
    const team=document.querySelector('#bbbAdvTeam'),draft=document.querySelector('#bbbAdvDraft'),college=document.querySelector('#bbbAdvCollege'),age=document.querySelector('#bbbAdvAge');
    if(team){
      const teams=[...new Set(players.map(p=>p.team).filter(Boolean))].sort();
      team.innerHTML='<option value="ALL">All teams</option>'+teams.map(x=>`<option value="${bbbEsc(x)}">${bbbEsc(x)}</option>`).join('');
      team.value=state.team;
    }
    if(draft){
      const years=[...new Set(players.map(p=>n(p.draft)).filter(x=>x!==null))].sort((a,b)=>b-a);
      draft.innerHTML='<option value="ALL">All draft classes</option>'+years.map(x=>`<option value="${x}">${x}</option>`).join('');
      draft.value=state.draft;
    }
    if(college){
      const schools=[...new Set(players.flatMap(p=>collegeParts(p.college)))].sort((a,b)=>a.localeCompare(b));
      college.innerHTML='<option value="ALL">All colleges</option>'+schools.map(x=>`<option value="${bbbEsc(x)}">${bbbEsc(x)}</option>`).join('');
      college.value=state.college;
    }
    if(age){
      const ages=players.map(p=>n(p.age)).filter(x=>x!==null);
      const c={u23:ages.filter(x=>x<23).length,u25:ages.filter(x=>x<25).length,a2324:ages.filter(x=>x>=23&&x<25).length,a2527:ages.filter(x=>x>=25&&x<28).length,a28:ages.filter(x=>x>=28).length};
      age.innerHTML=`<option value="ALL">Any age (${ages.length})</option><option value="u23">Under 23 (${c.u23})</option><option value="u25">Under 25 (${c.u25})</option><option value="23-25">23–24 (${c.a2324})</option><option value="25-27">25–27 (${c.a2527})</option><option value="28plus">28+ (${c.a28})</option>`;
      age.value=state.age;
    }
  }

  function renderChipState(){
    document.querySelectorAll('.bbb-qf').forEach(b=>{
      let on=false;
      const k=b.dataset.qf;
      if(k==='buy')on=typeof mf!=='undefined'&&mf==='BUY';
      else if(k==='fade')on=typeof mf!=='undefined'&&mf==='FADE';
      else on=!!state.quick[k];
      b.classList.toggle('active',on);
    });
  }

  function syncUi(){
    renderChipState();
    const count=activeCount();
    const badge=document.querySelector('#bbbActiveFilterCount');
    if(badge){badge.textContent=count?`${count} ACTIVE`:'NO ACTIVE FILTERS';badge.classList.toggle('active',count>0);}
    const sortLabel=document.querySelector('#bbbSortLabel');
    const sort=document.querySelector('#bbbAdvSort');
    if(sortLabel&&sort)sortLabel.textContent=sort.options[sort.selectedIndex]?.textContent||'BBB Rank';
  }

  function rerender(){
    visible=50;
    render();
    syncUi();
  }

  function clearAll(){
    state.team='ALL';state.draft='ALL';state.age='ALL';state.injury='ALL';state.college='ALL';state.gap='ALL';state.marketRank='ALL';state.movement='ALL';state.sort='bbb';
    quickKeys.forEach(k=>state.quick[k]=false);
    if(typeof pos!=='undefined')pos='ALL';
    if(typeof q!=='undefined')q='';
    if(typeof mf!=='undefined')mf='ALL';
    document.querySelectorAll('#rankings .tab[data-pos]').forEach(b=>b.classList.toggle('active',b.dataset.pos==='ALL'));
    const search=document.querySelector('#playerSearch');if(search)search.value='';
    const market=document.querySelector('#marketFilter');if(market)market.value='ALL';
    ['Team','Draft','Age','Injury','College','Gap','MarketRank','Movement'].forEach(k=>{const el=document.querySelector('#bbbAdv'+k);if(el)el.value='ALL';});
    const sort=document.querySelector('#bbbAdvSort');if(sort)sort.value='bbb';
    rerender();
  }

  function toggleQuick(k){
    if(k==='buy'||k==='fade'){
      const target=k==='buy'?'BUY':'FADE';
      const next=(typeof mf!=='undefined'&&mf===target)?'ALL':target;
      mf=next;
      const market=document.querySelector('#marketFilter');if(market)market.value=next;
    }else{
      state.quick[k]=!state.quick[k];
      if(k==='riser7'&&state.quick[k])state.quick.faller7=false;
      if(k==='faller7'&&state.quick[k])state.quick.riser7=false;
    }
    rerender();
  }

  function inject(){
    const panel=document.querySelector('#rankings .rankings-panel');
    const controls=panel?.querySelector('.controls');
    if(!panel||!controls||document.querySelector('#bbbAdvancedFilters'))return;

    const style=document.createElement('style');
    style.id='bbbAdvancedFilterStyles';
    style.textContent=`
      .bbb-filter-zone{border-bottom:1px solid #183027;background:#07100d}
      .bbb-quick-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:11px 17px}
      .bbb-filter-label{color:#6f8479;font-size:8px;font-weight:950;letter-spacing:.12em;margin-right:2px}
      .bbb-qf{border:1px solid #254438;background:#0a120f;color:#8fa198;border-radius:999px;padding:7px 10px;font-size:8px;font-weight:950;cursor:pointer}
      .bbb-qf:hover{border-color:#3a6a53;color:#fff}.bbb-qf.active{background:#0b5d36;border-color:#168b52;color:#8ff0b9}
      .bbb-advanced-toggle{margin-left:auto;border:1px solid #2c513f;background:#0b1712;color:#a6bbb0;border-radius:9px;padding:8px 11px;font-size:8px;font-weight:950;cursor:pointer}
      .bbb-advanced-toggle:hover{color:#fff;border-color:#4a8066}
      .bbb-filter-count{border:1px solid #263c32;border-radius:999px;padding:5px 8px;color:#64786e;font-size:7px;font-weight:950}.bbb-filter-count.active{color:#64d99b;border-color:#225d42;background:#0a2117}
      .bbb-advanced-panel{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 17px 17px;border-top:1px solid #142920}
      .bbb-adv-field{display:grid;gap:5px}.bbb-adv-field label{color:#6f8278;font-size:7px;font-weight:950;letter-spacing:.11em;text-transform:uppercase}
      .bbb-adv-field select,.bbb-adv-field input{width:100%;background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:8px;padding:9px 10px;font-size:10px;outline:none}
      .bbb-adv-field select:focus,.bbb-adv-field input:focus{border-color:#2bb66f}
      .bbb-adv-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:3px}
      .bbb-adv-summary{color:#6d8076;font-size:8px}.bbb-adv-summary strong{color:#a9b9b1}
      .bbb-clear-filters{border:1px solid #493838;background:#160d0d;color:#d9a3a3;border-radius:8px;padding:8px 11px;font-size:8px;font-weight:950;cursor:pointer}
      .bbb-clear-filters:hover{border-color:#8b4d4d;color:#fff}
      @media(max-width:900px){.bbb-advanced-panel{grid-template-columns:repeat(2,minmax(0,1fr))}.bbb-advanced-toggle{margin-left:0}}
      @media(max-width:560px){.bbb-quick-row{padding:10px 11px}.bbb-filter-label{width:100%}.bbb-advanced-panel{grid-template-columns:1fr;padding:12px 11px 14px}.bbb-qf{font-size:7px;padding:6px 8px}.bbb-advanced-toggle{flex:1}.bbb-adv-actions{align-items:flex-start;flex-direction:column}.bbb-clear-filters{width:100%}}
    `;
    document.head.appendChild(style);

    const zone=document.createElement('div');
    zone.id='bbbAdvancedFilters';
    zone.className='bbb-filter-zone';
    zone.innerHTML=`
      <div class="bbb-quick-row">
        <span class="bbb-filter-label">QUICK FILTERS</span>
        <button class="bbb-qf" data-qf="under25">UNDER 25</button>
        <button class="bbb-qf" data-qf="rookies">2026 ROOKIES</button>
        <button class="bbb-qf" data-qf="healthy">HEALTHY</button>
        <button class="bbb-qf" data-qf="buy">BBB BUYS</button>
        <button class="bbb-qf" data-qf="fade">BBB FADES</button>
        <button class="bbb-qf" data-qf="riser7">7D RISERS</button>
        <button class="bbb-qf" data-qf="faller7">7D FALLERS</button>
        <button class="bbb-qf" data-qf="market100">MARKET 100+</button>
        <span id="bbbActiveFilterCount" class="bbb-filter-count">NO ACTIVE FILTERS</span>
        <button id="bbbAdvancedToggle" class="bbb-advanced-toggle">ADVANCED FILTERS +</button>
      </div>
      <div id="bbbAdvancedPanel" class="bbb-advanced-panel hide">
        <div class="bbb-adv-field"><label>Team</label><select id="bbbAdvTeam"><option value="ALL">All teams</option></select></div>
        <div class="bbb-adv-field"><label>Draft Class</label><select id="bbbAdvDraft"><option value="ALL">All draft classes</option></select></div>
        <div class="bbb-adv-field"><label>Age</label><select id="bbbAdvAge"><option value="ALL">Any age</option><option value="u23">Under 23</option><option value="u25">Under 25</option><option value="23-25">23–24</option><option value="25-27">25–27</option><option value="28plus">28+</option></select></div>
        <div class="bbb-adv-field"><label>Injury Status</label><select id="bbbAdvInjury"><option value="ALL">Any status</option><option value="HEALTHY">Healthy only</option><option value="WATCH">Injury / recovery watch</option></select></div>
        <div class="bbb-adv-field"><label>College</label><select id="bbbAdvCollege"><option value="ALL">All colleges</option></select></div>
        <div class="bbb-adv-field"><label>BBB vs Market Gap</label><select id="bbbAdvGap"><option value="ALL">Any gap</option><option value="buy20">BBB +20 or more</option><option value="buy50">BBB +50 or more</option><option value="buy100">BBB +100 or more</option><option value="fade20">Market +20 or more</option><option value="fade50">Market +50 or more</option><option value="fade100">Market +100 or more</option></select></div>
        <div class="bbb-adv-field"><label>Market Rank</label><select id="bbbAdvMarketRank"><option value="ALL">Any market rank</option><option value="top50">Market Top 50</option><option value="top100">Market Top 100</option><option value="100plus">Market 100+</option><option value="150plus">Market 150+</option><option value="200plus">Market 200+</option><option value="unranked">Market unranked</option></select></div>
        <div class="bbb-adv-field"><label>Board Movement</label><select id="bbbAdvMovement"><option value="ALL">Any movement</option><option value="rise7">7D risers</option><option value="fall7">7D fallers</option><option value="rise30">30D risers</option><option value="fall30">30D fallers</option><option value="move20_7">20+ spots in 7D</option><option value="move20_30">20+ spots in 30D</option></select></div>
        <div class="bbb-adv-field"><label>Sort Board By</label><select id="bbbAdvSort"><option value="bbb">BBB Rank</option><option value="market">Market Rank</option><option value="ageYoung">Age — Youngest</option><option value="ageOld">Age — Oldest</option><option value="gapHigh">BBB vs Market — Biggest Buy</option><option value="gapLow">BBB vs Market — Biggest Fade</option><option value="rise7">7D Movement — Risers</option><option value="fall7">7D Movement — Fallers</option><option value="rise30">30D Movement — Risers</option><option value="fall30">30D Movement — Fallers</option><option value="value">Trade Value</option></select></div>
        <div class="bbb-adv-actions"><div class="bbb-adv-summary">Filters stack with position tabs and search. Current sort: <strong id="bbbSortLabel">BBB Rank</strong>.</div><button id="bbbClearFilters" class="bbb-clear-filters">CLEAR ALL FILTERS</button></div>
      </div>`;
    controls.insertAdjacentElement('afterend',zone);

    zone.querySelectorAll('.bbb-qf').forEach(b=>b.onclick=()=>toggleQuick(b.dataset.qf));
    const toggle=document.querySelector('#bbbAdvancedToggle'),adv=document.querySelector('#bbbAdvancedPanel');
    toggle.onclick=()=>{const opening=adv.classList.contains('hide');adv.classList.toggle('hide');toggle.textContent=opening?'ADVANCED FILTERS −':'ADVANCED FILTERS +';};
    const bindings={Team:'team',Draft:'draft',Age:'age',Injury:'injury',College:'college',Gap:'gap',MarketRank:'marketRank',Movement:'movement',Sort:'sort'};
    Object.entries(bindings).forEach(([id,key])=>document.querySelector('#bbbAdv'+id).onchange=e=>{state[key]=e.target.value;rerender();});
    document.querySelector('#bbbClearFilters').onclick=clearAll;

    document.querySelectorAll('#rankings .tab[data-pos]').forEach(b=>b.addEventListener('click',()=>setTimeout(syncUi,0)));
    document.querySelector('#playerSearch')?.addEventListener('input',()=>setTimeout(syncUi,0));
    document.querySelector('#marketFilter')?.addEventListener('change',()=>setTimeout(syncUi,0));

    populateOptions();syncUi();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();
