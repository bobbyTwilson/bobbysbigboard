let bbbAllProfilesPromise=null;

async function bbbLoadAllProfiles(){
  if(!bbbAllProfilesPromise){
    bbbAllProfilesPromise=bbbDb('site_profiles','select=player_key,name,overall_breakdown,injury_status,injury_note,injury_updated,latest_weekly_update,weekly_update_date').then(rows=>{
      const map=new Map();
      rows.forEach(r=>{
        const key=profileNorm(r.name);
        const item={
          playerKey:r.player_key||'',
          name:r.name||'',
          overview:r.overall_breakdown||'',
          injuryStatus:r.injury_status||'',
          injuryNote:r.injury_note||'',
          injuryUpdated:r.injury_updated||'',
          latestUpdate:r.latest_weekly_update||'',
          updateDate:r.weekly_update_date||''
        };
        const existing=map.get(key);
        if(!existing || (!existing.overview && item.overview)) map.set(key,item);
      });
      return map;
    });
  }
  return bbbAllProfilesPromise;
}

if(typeof profileRender==='function'){
  const bbbProfileRenderWithAllOverviews=profileRender;
  profileRender=async function(slug){
    await bbbProfileRenderWithAllOverviews(slug);
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return;

    const profiles=await bbbLoadAllProfiles().catch(()=>null);
    const profile=profiles?.get(profileNorm(found.name));
    if(!profile)return;

    const summary=bbbProfileSummaryHtml(profile);
    if(!summary)return;

    const mount=document.querySelector('#profileMount');
    if(!mount)return;

    const existing=mount.querySelector('.bbb-profile-summary');
    if(existing){
      existing.innerHTML=summary;
      return;
    }

    const grid=mount.querySelector('.profile-grid');
    if(!grid)return;

    const card=document.createElement('section');
    card.className='profile-card full bbb-overview-card';
    card.innerHTML=`<div class="profile-card-kicker">Player Profile</div><h2>Scouting overview.</h2><div class="profile-note bbb-profile-summary">${summary}</div>`;
    grid.insertBefore(card,grid.firstChild);
  };
}
