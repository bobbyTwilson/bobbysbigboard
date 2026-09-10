// Bobby's Big Board — profile data fallback.
// Makes every public.site_profiles row a first-class profile identity even when
// the player is not currently in the Top 500, rookie board, or prospect list.
(function(){
  let directory=[];
  let directoryPromise=null;

  function clean(row){
    return {
      playerKey:row.player_key||'',
      player_key:row.player_key||'',
      name:row.name||'',
      pos:row.pos||'',
      team:row.team||'',
      age:row.age==null?null:Number(row.age),
      draft:row.draft_year==null?null:Number(row.draft_year),
      draft_year:row.draft_year==null?null:Number(row.draft_year),
      college:row.college||'',
      injuryStatus:row.injury_status||'',
      injuryNote:row.injury_note||'',
      injuryUpdated:row.injury_updated||'',
      latestUpdate:row.latest_weekly_update||'',
      updateDate:row.weekly_update_date||''
    };
  }

  function loadDirectory(){
    if(directory.length)return Promise.resolve(directory);
    if(directoryPromise)return directoryPromise;
    if(typeof bbbDb!=='function')return Promise.resolve([]);
    directoryPromise=bbbDb(
      'site_profiles',
      'select=player_key,name,pos,team,age,draft_year,college,injury_status,injury_note,injury_updated,latest_weekly_update,weekly_update_date&order=name.asc'
    ).then(rows=>{
      directory=(Array.isArray(rows)?rows:[]).filter(r=>r?.player_key&&r?.name).map(clean);
      return directory;
    }).catch(err=>{
      directoryPromise=null;
      console.error('BBB profile directory:',err);
      return [];
    });
    return directoryPromise;
  }

  function findInDirectory(value){
    const raw=String(value||'').trim();
    if(!raw)return null;
    const slug=typeof profileSlug==='function'?profileSlug(raw):raw.toLowerCase();
    const norm=typeof profileNorm==='function'?profileNorm(raw):slug.replace(/-/g,'');
    return directory.find(p=>String(p.playerKey)===raw)
      ||directory.find(p=>typeof profileSlug==='function'&&profileSlug(p.name)===slug)
      ||directory.find(p=>typeof profileNorm==='function'&&profileNorm(p.name)===norm)
      ||null;
  }

  if(typeof profileFind==='function'){
    const originalFind=profileFind;
    profileFind=function(value){
      return originalFind(value)||findInDirectory(value);
    };
  }

  if(typeof bbbSnapshotCurrentPlayer==='function'){
    const originalCurrent=bbbSnapshotCurrentPlayer;
    bbbSnapshotCurrentPlayer=function(value){
      return originalCurrent(value)||findInDirectory(value)||null;
    };
  }

  // Start the directory request immediately. On a direct /player/* route the
  // outer profileRender wrapper waits for it before the existing render chain
  // runs, eliminating the ranked-array timing dependency.
  loadDirectory();

  if(typeof profileRender==='function'){
    const baseRender=profileRender;
    profileRender=async function(value){
      await loadDirectory();
      return baseRender(value);
    };
  }

  // Keep the normal board loader intact, but make its completion also guarantee
  // the full profile identity directory is available for deep links/searches.
  if(typeof load==='function'){
    const baseLoad=load;
    load=async function(){
      const dir=loadDirectory();
      const result=await baseLoad.apply(this,arguments);
      await dir;
      return result;
    };
  }
})();
