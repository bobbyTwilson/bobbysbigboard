// Prospect-only profile mode for Bobby's Big Board.
// Keeps NFL/dynasty modules off pure prospect pages and replaces them with
// scouting-first content built from Bobby's film grades.
(function(){
  if(typeof profileRender!=='function')return;

  const MANUAL_OVERVIEWS={
    'jadan-baugh':"Baugh is a patient, creative runner who wins by manipulating blocks with tempo and then accelerating through the crease. His stop-start ability, vision and feel for space stand out for a back with his size, while his receiving skill gives him a believable three-down ceiling. The main evaluation point is whether his athleticism translates into enough explosive plays against NFL speed, but the current profile looks like a versatile feature-back prospect.",
    'kj-duff':"Duff is a massive boundary target whose catch radius, ball skills and vertical presence immediately stress a defense. He is more fluid than a typical 6-foot-6 receiver and can win through body positioning and at the catch point, but his NFL ceiling will depend on how consistently he creates separation against press/man coverage and how much value he adds after the catch. Right now he profiles as a big X receiver with legitimate starting upside."
  };

  const TRAIT_ORDER={
    QB:['Arm Talent','Deep Accuracy','Play Extension','Rushing Upside','Short Accuracy','Pocket Presence','Pressure / Clutch','Throw Off-Platform','Pre-Snap Processing','Post-Snap Processing','Anticipation / Timing','Intermediate Accuracy','Decision Making / Ball Security'],
    RB:['Contact Balance','Physicality','Vision','Ball Security','Run IQ','Speed','Acceleration','Deceleration','Agility','Change of Direction','Catching','Route Running','Run After Catch','Pass Protection','DAWG Factor','College Analytics','Projected Draft Capital','Creativity'],
    WR:['Short Routes','Medium Routes','Deep Routes','Double Moves','Releases','Speed','Acceleration','Deceleration','Agility','Change of Direction','Catching','Catch in Traffic','Run After Catch','DAWG Factor','Analytics','Projected Draft Capital','X/Z/Slot Ability'],
    TE:['Short Routes','Medium Routes','Deep Routes','Speed','Acceleration','Deceleration','Agility','Change of Direction','Catching','Catch in Traffic','Run After Catch','Blocking','Football IQ','DAWG Factor','Analytics','Projected Draft Capital','Positional Versatility']
  };

  function pNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function pGrade(v){const n=pNum(v);return n==null?'—':(Number.isInteger(n)?String(n):n.toFixed(1))}
  function pTraitName(raw){return typeof profileCleanTrait==='function'?profileCleanTrait(raw):String(raw||'').replace(/\s*\([^)]*\)\s*$/,'').trim()}
  function pTraitMax(pos,name,raw){
    if(typeof profileTraitMax==='function')return profileTraitMax(pos,name,raw);
    return /speed|acceleration|analytics|arm talent|accuracy|processing|pocket presence|decision making|anticipation/i.test(name)?10:5;
  }
  function pTraitList(prospect){
    const order=TRAIT_ORDER[prospect?.pos]||[];
    const index=new Map(order.map((x,i)=>[x.toLowerCase(),i]));
    return Object.entries(prospect?.traits||{}).map(([raw,val])=>{
      const name=pTraitName(raw),value=pNum(val),max=pTraitMax(prospect?.pos,name,raw);
      return {raw,name,value,max,pct:value==null||!max?0:Math.max(0,Math.min(1,value/max))};
    }).filter(x=>x.value!=null).sort((a,b)=>{
      const ai=index.has(a.name.toLowerCase())?index.get(a.name.toLowerCase()):999;
      const bi=index.has(b.name.toLowerCase())?index.get(b.name.toLowerCase()):999;
      return ai-bi||a.name.localeCompare(b.name);
    });
  }
  function pFilmTraits(prospect){
    return pTraitList(prospect).filter(t=>!/analytics|projected draft capital/i.test(t.name));
  }
  function pTopTraits(prospect,count=3){return [...pFilmTraits(prospect)].sort((a,b)=>b.pct-a.pct||b.value-a.value).slice(0,count)}
  function pLowTraits(prospect,count=2){return [...pFilmTraits(prospect)].sort((a,b)=>a.pct-b.pct||a.value-b.value).slice(0,count)}
  function pJoinTraits(list){
    const names=list.map(x=>x.name);
    if(names.length<=1)return names[0]||'his strongest traits';
    if(names.length===2)return names.join(' and ');
    return `${names.slice(0,-1).join(', ')}, and ${names[names.length-1]}`;
  }
  function pFallbackOverview(prospect){
    const top=pTopTraits(prospect,3),low=pLowTraits(prospect,2);
    const name=prospect?.name||'This prospect';
    return `${name}'s current BBB film profile is built around ${pJoinTraits(top)}. Those traits give the ${prospect?.pos||'player'} a clear foundation entering the ${prospect?.year||'upcoming'} draft cycle. The biggest areas to keep testing are ${pJoinTraits(low)}, and those will have the most influence on how high the grade can climb as more film is added.`;
  }
  function pSnapshot(prospect){
    return `<section class="profile-card full bbb-prospect-snapshot"><div class="profile-card-kicker">PROSPECT SNAPSHOT</div><div class="bbb-prospect-head"><div><h2>${bbbEsc(prospect.year||'Upcoming')} evaluation at a glance.</h2><p>Film grade and projection only. Dynasty value begins once the player enters the NFL player pool.</p></div><span class="bbb-prospect-grade-badge">${bbbEsc(pGrade(prospect.grade))}</span></div><div class="bbb-prospect-snapshot-grid"><div><span>Overall Grade</span><strong>${bbbEsc(pGrade(prospect.grade))}</strong></div><div><span>Draft Class</span><strong>${bbbEsc(prospect.year||'—')}</strong></div><div><span>Position</span><strong>${bbbEsc(prospect.pos||'—')}</strong></div><div><span>Pro Comp</span><strong>${bbbEsc(prospect.comp||'—')}</strong></div></div></section>`;
  }
  function pOverview(prospect,profile){
    const key=String(prospect?.playerKey||prospect?.player_key||'').trim();
    const copy=(profile?.overview||MANUAL_OVERVIEWS[key]||pFallbackOverview(prospect)).trim();
    return `<section class="profile-card full bbb-prospect-overview-card"><div class="profile-card-kicker">SCOUTING OVERVIEW</div><h2>How the profile wins.</h2><div class="bbb-prospect-overview-copy">${bbbEsc(copy)}</div></section>`;
  }
  function pEvaluation(prospect){
    const strengths=pTopTraits(prospect,3),concerns=pLowTraits(prospect,2);
    const strengthHtml=strengths.map(t=>`<div class="bbb-prospect-point strength"><div><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(pGrade(t.value))} / ${bbbEsc(t.max)}</strong></div><p>One of the strongest marks on the current BBB film sheet and a core part of the projection.</p></div>`).join('');
    const concernHtml=concerns.map(t=>`<div class="bbb-prospect-point watch"><div><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(pGrade(t.value))} / ${bbbEsc(t.max)}</strong></div><p>A relative low point in the current profile and an area to keep testing as the evaluation develops.</p></div>`).join('');
    return `<section class="profile-card full bbb-prospect-eval-card"><div class="profile-card-kicker">SCOUTING NOTES</div><h2>Strengths & areas to monitor.</h2><div class="bbb-prospect-eval-grid"><div><h3>Core strengths</h3>${strengthHtml}</div><div><h3>Areas to monitor</h3>${concernHtml}</div></div></section>`;
  }
  function pFullTraits(prospect){
    const traits=pTraitList(prospect);
    const rows=traits.map(t=>`<div class="bbb-prospect-trait"><div class="bbb-prospect-trait-top"><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(pGrade(t.value))} / ${bbbEsc(t.max)}</strong></div><div class="bbb-prospect-trait-track"><i style="width:${(t.pct*100).toFixed(1)}%"></i></div></div>`).join('');
    return `<section class="profile-card full bbb-prospect-full-card"><div class="profile-card-kicker">FULL FILM GRADE</div><h2>Complete trait breakdown.</h2><details class="bbb-prospect-details"><summary>View all ${traits.length} graded traits <span>+</span></summary><div class="bbb-prospect-trait-grid">${rows}</div></details></section>`;
  }
  function pNode(html){const box=document.createElement('div');box.innerHTML=html.trim();return box.firstElementChild}

  async function bbbProspectModeEnhance(slug){
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return;
    const norm=profileNorm(found.name);
    const prospect=(typeof prospects!=='undefined'?prospects:[]).find(x=>profileNorm(x.name)===norm)||null;
    const dynasty=(typeof players!=='undefined'?players:[]).find(x=>profileNorm(x.name)===norm)||null;
    const rookie=(typeof rookies!=='undefined'?rookies:[]).find(x=>profileNorm(x.name)===norm)||null;
    if(!prospect||dynasty||rookie)return;

    const mount=document.querySelector('#profileMount'),grid=mount?.querySelector('.profile-grid');
    if(!grid)return;

    const profiles=typeof bbbLoadAllProfiles==='function'?await bbbLoadAllProfiles().catch(()=>null):null;
    const profile=profiles?.get(norm)||null;

    mount.classList.add('bbb-prospect-only');
    const kicker=mount.querySelector('.profile-kicker');if(kicker)kicker.textContent='BBB PROSPECT DATABASE';
    const back=mount.querySelector('.profile-back');if(back){back.textContent='← BACK TO PROSPECTS';back.setAttribute('href','#prospects')}

    const filmCard=[...grid.querySelectorAll('.profile-card')].find(c=>/film grade profile/i.test(c.querySelector('.profile-card-kicker')?.textContent||''))||null;
    [...grid.querySelectorAll('.profile-card')].forEach(card=>{if(card!==filmCard)card.remove()});

    const snapshot=pNode(pSnapshot(prospect));
    const overview=pNode(pOverview(prospect,profile));
    const evaluation=pNode(pEvaluation(prospect));
    const fullTraits=pNode(pFullTraits(prospect));
    [snapshot,overview,evaluation,filmCard,fullTraits].filter(Boolean).forEach(node=>grid.appendChild(node));
  }

  if(!document.querySelector('#bbb-prospect-profile-styles')){
    const style=document.createElement('style');
    style.id='bbb-prospect-profile-styles';
    style.textContent=`
      .bbb-prospect-only .profile-statbar{border-bottom-color:#163327}
      .bbb-prospect-snapshot,.bbb-prospect-overview-card,.bbb-prospect-eval-card,.bbb-prospect-full-card{overflow:hidden}
      .bbb-prospect-head{display:flex;align-items:flex-start;justify-content:space-between;gap:22px;margin-bottom:18px}
      .bbb-prospect-head h2{margin:2px 0 5px}.bbb-prospect-head p{margin:0;color:#7f9087;font-size:11px;line-height:1.55;max-width:680px}
      .bbb-prospect-grade-badge{display:grid;place-items:center;min-width:68px;height:54px;padding:0 14px;border:1px solid #26744d;background:#0a2b1d;border-radius:12px;color:#68dfa0;font-size:27px;font-weight:950}
      .bbb-prospect-snapshot-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
      .bbb-prospect-snapshot-grid>div{border:1px solid #193529;background:#08110d;border-radius:11px;padding:14px}
      .bbb-prospect-snapshot-grid span{display:block;color:#6d8075;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
      .bbb-prospect-snapshot-grid strong{display:block;color:#f0f5f2;font-size:18px;line-height:1.15}
      .bbb-prospect-overview-copy{border-left:3px solid #0a8f4d;background:#09140f;padding:16px 17px;color:#d5dfd9;font-size:12px;line-height:1.8}
      .bbb-prospect-eval-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bbb-prospect-eval-grid>div{border:1px solid #193529;background:#08110d;border-radius:12px;padding:15px}.bbb-prospect-eval-grid h3{margin:0 0 12px;color:#dce5e0;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
      .bbb-prospect-point{padding:11px 0;border-top:1px solid #142a21}.bbb-prospect-point:first-of-type{border-top:0;padding-top:0}.bbb-prospect-point:last-child{padding-bottom:0}.bbb-prospect-point>div{display:flex;justify-content:space-between;gap:12px;align-items:center}.bbb-prospect-point span{font-size:11px;font-weight:900}.bbb-prospect-point strong{font-size:9px}.bbb-prospect-point p{margin:4px 0 0;color:#71847a;font-size:9px;line-height:1.55}.bbb-prospect-point.strength span,.bbb-prospect-point.strength strong{color:#70dfa5}.bbb-prospect-point.watch span{color:#d8d2ae}.bbb-prospect-point.watch strong{color:#d5c26f}
      .bbb-prospect-details{margin-top:12px;border:1px solid #1b392c;border-radius:12px;background:#08110d;overflow:hidden}.bbb-prospect-details summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;cursor:pointer;list-style:none;color:#9eddbb;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.bbb-prospect-details summary::-webkit-details-marker{display:none}.bbb-prospect-details summary span{font-size:18px;line-height:1}.bbb-prospect-details[open] summary span{transform:rotate(45deg)}
      .bbb-prospect-trait-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 22px;padding:4px 16px 16px;border-top:1px solid #173127}.bbb-prospect-trait{padding:11px 0;border-bottom:1px solid #13271f}.bbb-prospect-trait-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:7px}.bbb-prospect-trait-top span{color:#dce5e0;font-size:10px;font-weight:850}.bbb-prospect-trait-top strong{color:#9eafa6;font-size:9px}.bbb-prospect-trait-track{height:5px;border-radius:999px;background:#14261e;overflow:hidden}.bbb-prospect-trait-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#279a60,#65dda0)}
      @media(max-width:760px){.bbb-prospect-snapshot-grid{grid-template-columns:1fr 1fr}.bbb-prospect-eval-grid,.bbb-prospect-trait-grid{grid-template-columns:1fr}}
      @media(max-width:520px){.bbb-prospect-head{display:block}.bbb-prospect-grade-badge{width:max-content;margin-top:12px}.bbb-prospect-snapshot-grid strong{font-size:15px}.bbb-prospect-overview-copy{font-size:11px}.bbb-prospect-point>div{align-items:flex-start}}
    `;
    document.head.appendChild(style);
  }

  const bbbProspectBaseRender=profileRender;
  profileRender=async function(slug){
    await bbbProspectBaseRender(slug);
    await bbbProspectModeEnhance(slug);
  };
})();
