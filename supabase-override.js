const BBB_SUPABASE_URL='https://twbduhmibbotregdxlla.supabase.co';
const BBB_SUPABASE_KEY='sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS';

async function bbbDb(table, query=''){
  const url=BBB_SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:'');
  const r=await fetch(url,{cache:'no-store',headers:{apikey:BBB_SUPABASE_KEY}});
  if(!r.ok)throw new Error('Supabase '+table+' '+r.status);
  return r.json();
}

load=async function(){
  const data=await bbbDb('site_dynasty','select=*&order=rank.asc');
  players=data.map(p=>({
    rank:num(p.rank),name:p.name,pos:p.pos,pr:num(p.pr),team:p.team||'',age:num(p.age),draft:num(p.draft),
    market:num(p.market),gap:num(p.gap),view:p.view||'',
    notes:p.latest_update||p.injury_note||p.overview||''
  })).filter(p=>p.rank).sort((a,b)=>a.rank-b.rank);
  document.querySelector('#totalCount').textContent=players.length;
  const buys=players.filter(p=>mv(p)[0]==='buy').length;
  const fades=players.filter(p=>mv(p)[0]==='fade').length;
  buyCount.textContent=buys;fadeCount.textContent=fades;marketCount.textContent=players.length-buys-fades;
  previewRows.innerHTML=players.slice(0,5).map(p=>`<div class="preview-row"><div class="preview-rank">${p.rank}</div><div><div class="preview-name">${p.name}</div><div class="preview-meta">${p.team} • ${p.pos}${p.pr||''}</div></div><div class="preview-pos">${p.pos}</div></div>`).join('');
  render();tradeRender();
};

loadRookies=async function(){
  const data=await bbbDb('site_rookies','select=*&order=rank.asc');
  rookies=data.map(p=>({rank:num(p.rank),name:p.name,pos:p.pos,team:p.team||'',age:num(p.age),draft:num(p.draft),market:num(p.market),gap:num(p.gap),tier:(p.tier||'').trim(),notes:''})).filter(x=>x.rank).sort((a,b)=>a.rank-b.rank);
  document.querySelector('#rookieCount').textContent=rookies.length;
  document.querySelector('#rookiePreviewRows').innerHTML=rookies.slice(0,5).map(p=>`<div class="preview-row"><div class="preview-rank">${p.rank}</div><div><div class="preview-name">${p.name}</div><div class="preview-meta">${p.team} • ${p.pos} • ${p.age??'—'} yrs</div></div><div class="preview-pos">${p.pos}</div></div>`).join('');
  renderRookies();
};

loadProspects=async function(){
  const data=await bbbDb('site_prospects','select=*&order=grade.desc');
  prospects=data.map((p,i)=>({name:p.name,pos:p.pos,year:num(p.year),grade:num(p.grade),comp:p.comp||'',traits:p.traits||{},sourceOrder:i})).filter(p=>p.name&&p.grade!=null).sort((a,b)=>(b.grade-a.grade)||(posOrder[a.pos]-posOrder[b.pos])||(a.sourceOrder-b.sourceOrder));
  document.querySelector('#prospectCount').textContent=prospects.length;
  const classes=[...new Set(prospects.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);
  document.querySelector('#prospectClassCount').textContent=classes.length;
  const sel=document.querySelector('#prospectClassFilter');
  sel.innerHTML='<option value="ALL">All draft classes</option>'+classes.map(y=>`<option value="${y}">${y} Draft Class</option>`).join('');
  const counts={QB:0,RB:0,WR:0,TE:0};prospects.forEach(p=>counts[p.pos]++);
  document.querySelector('#prospectPreviewRows').innerHTML=['QB','RB','WR','TE'].map(p=>`<div class="prospect-stat-row"><div class="prospect-stat-code">${p}</div><div class="prospect-stat-label">Prospects graded</div><div class="prospect-stat-count">${counts[p]}</div></div>`).join('');
  renderProspects();
};

loadDraftPicks=async function(){
  const data=await bbbDb('site_draft_picks','select=*&order=year.asc');
  draftPicks=data.map(p=>({id:p.id||('pick:'+p.name),type:'pick',name:p.name,year:num(p.year),range:p.range||'',value:num(p.value)})).filter(x=>x.name&&x.value!=null);
  tradeRender();
};

profileLoadGrades=async function(){
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
};
