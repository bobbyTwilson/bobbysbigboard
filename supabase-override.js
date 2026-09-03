// Canonical Supabase-backed loaders for Bobby's Big Board.
// The filename is retained for deployment compatibility, but these functions
// no longer override Google Sheets loaders; the legacy Sheet runtime is removed
// before every production build.

function bbbApplyLiveBoardLabel(){
  document.querySelectorAll('.hero-card .updated').forEach(el=>{
    if(/snapshot/i.test(el.textContent||''))el.textContent='LIVE • SUPABASE SYNCED';
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbApplyLiveBoardLabel);
else bbbApplyLiveBoardLabel();

function bbbProfileSummaryHtml(p){
  const overview=(p.overview||'').trim();
  const latest=(p.latestUpdate||p.injuryNote||'').trim();
  const date=p.updateDate||p.injuryUpdated||'';
  const status=(p.injuryStatus||'').trim();
  if(!overview&&!latest)return '';
  const healthy=/healthy/i.test(status);
  const statusHtml=status?`<span class="bbb-profile-status ${healthy?'healthy':'watch'}">${bbbEsc(status)}</span>`:'';
  return `${overview?`<div class="bbb-profile-label">PLAYER OVERVIEW</div><div class="bbb-profile-copy">${bbbEsc(overview)}</div>`:''}${latest?`${overview?'<div class="bbb-profile-divider"></div>':''}<div class="bbb-profile-update-head"><div class="bbb-profile-label">LATEST UPDATE${date?' · '+bbbEsc(date):''}</div>${statusHtml}</div><div class="bbb-profile-copy">${bbbEsc(latest)}</div>`:''}`;
}

(function bbbInjectProfileStyles(){
  if(document.querySelector('#bbb-sql-profile-summary-styles'))return;
  const style=document.createElement('style');
  style.id='bbb-sql-profile-summary-styles';
  style.textContent=`
    .bbb-profile-summary{padding:16px 16px 15px!important;color:#d5dfd9!important;background:#09140f!important}
    .bbb-profile-label{color:#50d990;font-size:9px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;margin-bottom:9px}
    .bbb-profile-copy{font-size:12px;line-height:1.75;color:#d5dfd9}
    .bbb-profile-divider{height:1px;background:#1b392c;margin:17px 0}
    .bbb-profile-update-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
    .bbb-profile-update-head .bbb-profile-label{margin-bottom:0}
    .bbb-profile-status{flex:none;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:900;border:1px solid #6c5c29;background:#231f10;color:#e8cd74}
    .bbb-profile-status.healthy{border-color:#176743;background:#0a2b1d;color:#74e5a9}
    @media(max-width:560px){.bbb-profile-update-head{align-items:flex-start}.bbb-profile-copy{font-size:11px}}
  `;
  document.head.appendChild(style);
})();

async function load(){
  const data=await bbbDbCached('site_dynasty','select=*&order=rank.asc');
  players=data.map(p=>({
    playerKey:p.player_key||'',rank:num(p.rank),name:p.name,pos:p.pos,pr:num(p.pr),team:p.team||'',age:num(p.age),draft:num(p.draft),
    market:num(p.market),gap:num(p.gap),view:p.view||'',college:p.college||'',
    overview:p.overview||'',injuryStatus:p.injury_status||'',injuryNote:p.injury_note||'',injuryUpdated:p.injury_updated||'',
    latestUpdate:p.latest_update||'',updateDate:p.weekly_update_date||'',
    notes:p.latest_update||p.injury_note||p.overview||''
  })).filter(p=>p.rank).sort((a,b)=>a.rank-b.rank);
  document.querySelector('#totalCount').textContent=players.length;
  const buys=players.filter(p=>mv(p)[0]==='buy').length;
  const fades=players.filter(p=>mv(p)[0]==='fade').length;
  buyCount.textContent=buys;fadeCount.textContent=fades;marketCount.textContent=players.length-buys-fades;
  previewRows.innerHTML=players.slice(0,5).map(p=>`<div class="preview-row"><div class="preview-rank">${p.rank}</div><div><div class="preview-name">${p.name}</div><div class="preview-meta">${p.team} • ${p.pos}${p.pr||''}</div></div><div class="preview-pos">${p.pos}</div></div>`).join('');
  render();tradeRender();
}

async function loadRookies(){
  const data=await bbbDbCached('site_rookies','select=*&order=rank.asc');
  rookies=data.map(p=>({playerKey:p.player_key||'',rank:num(p.rank),name:p.name,pos:p.pos,team:p.team||'',age:num(p.age),draft:num(p.draft),market:num(p.market),gap:num(p.gap),tier:(p.tier||'').trim(),notes:''})).filter(x=>x.rank).sort((a,b)=>a.rank-b.rank);
  document.querySelector('#rookieCount').textContent=rookies.length;
  document.querySelector('#rookiePreviewRows').innerHTML=rookies.slice(0,5).map(p=>`<div class="preview-row"><div class="preview-rank">${p.rank}</div><div><div class="preview-name">${p.name}</div><div class="preview-meta">${p.team} • ${p.pos} • ${p.age??'—'} yrs</div></div><div class="preview-pos">${p.pos}</div></div>`).join('');
  renderRookies();
}

async function loadProspects(){
  const data=await bbbDbCached('site_prospects','select=*&order=grade.desc');
  prospects=data.map((p,i)=>({playerKey:p.player_key||'',name:p.name,pos:p.pos,year:num(p.year),grade:num(p.grade),comp:p.comp||'',traits:p.traits||{},sourceOrder:i})).filter(p=>p.name&&p.grade!=null).sort((a,b)=>(b.grade-a.grade)||(posOrder[a.pos]-posOrder[b.pos])||(a.sourceOrder-b.sourceOrder));
  document.querySelector('#prospectCount').textContent=prospects.length;
  const classes=[...new Set(prospects.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);
  document.querySelector('#prospectClassCount').textContent=classes.length;
  const sel=document.querySelector('#prospectClassFilter');
  sel.innerHTML='<option value="ALL">All draft classes</option>'+classes.map(y=>`<option value="${y}">${y} Draft Class</option>`).join('');
  const counts={QB:0,RB:0,WR:0,TE:0};prospects.forEach(p=>counts[p.pos]++);
  document.querySelector('#prospectPreviewRows').innerHTML=['QB','RB','WR','TE'].map(p=>`<div class="prospect-stat-row"><div class="prospect-stat-code">${p}</div><div class="prospect-stat-label">Prospects graded</div><div class="prospect-stat-count">${counts[p]}</div></div>`).join('');
  renderProspects();
}

async function loadDraftPicks(){
  const data=await bbbDbCached('site_draft_picks','select=*&order=year.asc');
  draftPicks=data.map(p=>({id:p.id||('pick:'+p.name),type:'pick',name:p.name,year:num(p.year),range:p.range||'',value:num(p.value)})).filter(x=>x.name&&x.value!=null);
  tradeRender();
}

async function profileLoadGrades(){
  if(profileGradeDetails.size)return;
  if(!prospects.length)await loadProspects();
  prospects.forEach(p=>{
    const traits=[];
    Object.entries(p.traits||{}).forEach(([head,raw])=>{
      const value=num(raw);if(value==null)return;
      const clean=profileCleanTrait(head);
      const max=profileTraitMax(p.pos,clean,head);
      traits.push({name:clean,value,max,pct:Math.max(0,Math.min(100,(value/max)*100))});
    });
    traits.sort((a,b)=>b.pct-a.pct||b.value-a.value);
    profileGradeDetails.set(profileNorm(p.name),{name:p.name,pos:p.pos,grade:p.grade,year:p.year,comp:p.comp||'',traits});
  });
}

// Keep the profile summary enhancement for the classic profile renderer. The
// canonical runtime already resolves player_key routes directly, so no profile
// lookup override is needed anymore.
if(typeof profileRender==='function'){
  const bbbOriginalProfileRender=profileRender;
  profileRender=async function(slug){
    await bbbOriginalProfileRender(slug);
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return;
    const dynasty=(players||[]).find(x=>profileNorm(x.name)===profileNorm(found.name));
    if(!dynasty)return;
    const cards=[...document.querySelectorAll('#profileMount .profile-card')];
    const dynastyCard=cards.find(card=>card.querySelector('.profile-card-kicker')?.textContent.trim().toLowerCase()==='dynasty snapshot')||cards[0];
    if(!dynastyCard)return;
    let note=dynastyCard.querySelector('.profile-note');
    const summary=bbbProfileSummaryHtml(dynasty);
    if(!summary){note?.remove();return;}
    if(!note){note=document.createElement('div');note.className='profile-note';dynastyCard.appendChild(note);}
    note.classList.add('bbb-profile-summary');
    note.innerHTML=summary;
  };
}
