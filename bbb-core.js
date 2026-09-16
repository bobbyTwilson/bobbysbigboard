const BBB_SUPABASE_URL='__BBB_SUPABASE_URL__';
const BBB_SUPABASE_KEY='__BBB_SUPABASE_KEY__';
const BBB_DB_CACHE=new Map();
const BBB_DB_PERSIST_PREFIX='bbb-db-swr-v1:';
const BBB_DB_MAX_STALE_MS=24*60*60*1000;
const BBB_DB_PERSIST_TABLES=new Set(['site_dynasty','site_rookies','site_prospects','site_draft_picks']);

function bbbBuildDbUrl(table,query=''){
  return BBB_SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:'');
}

function bbbPersistKey(table,query=''){
  return BBB_DB_PERSIST_PREFIX+table+'?'+query;
}

function bbbReadPersisted(table,query=''){
  if(!BBB_DB_PERSIST_TABLES.has(table))return null;
  try{
    const raw=localStorage.getItem(bbbPersistKey(table,query));
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    if(!parsed||!Array.isArray(parsed.data)||!Number.isFinite(parsed.savedAt))return null;
    if(Date.now()-parsed.savedAt>BBB_DB_MAX_STALE_MS){
      localStorage.removeItem(bbbPersistKey(table,query));
      return null;
    }
    return parsed.data;
  }catch(error){
    return null;
  }
}

function bbbWritePersisted(table,query='',data=[]){
  if(!BBB_DB_PERSIST_TABLES.has(table)||!Array.isArray(data))return;
  try{
    localStorage.setItem(bbbPersistKey(table,query),JSON.stringify({savedAt:Date.now(),data}));
  }catch(error){
    console.warn('BBB persistent cache unavailable',table,error);
  }
}

function bbbNotifyFresh(table,query=''){
  window.dispatchEvent(new CustomEvent('bbb:db-fresh',{detail:{table,query}}));
}

async function bbbDbFresh(table,query=''){
  const r=await fetch(bbbBuildDbUrl(table,query),{
    cache:'no-store',
    headers:{apikey:BBB_SUPABASE_KEY}
  });
  if(!r.ok){
    const detail=await r.text().catch(()=>'');
    throw new Error(`Supabase ${table} ${r.status}${detail?`: ${detail.slice(0,180)}`:''}`);
  }
  return r.json();
}

function bbbRevalidate(table,query,key){
  bbbDbFresh(table,query).then(data=>{
    const ready=Promise.resolve(data);
    BBB_DB_CACHE.set(key,ready);
    bbbWritePersisted(table,query,data);
    bbbNotifyFresh(table,query);
  }).catch(error=>{
    console.warn('BBB background refresh failed',table,error);
  });
}

function bbbDb(table,query='',options={}){
  const key=table+'?'+query;
  if(options.refresh)BBB_DB_CACHE.delete(key);
  if(BBB_DB_CACHE.has(key))return BBB_DB_CACHE.get(key);

  if(!options.refresh){
    const persisted=bbbReadPersisted(table,query);
    if(persisted){
      const ready=Promise.resolve(persisted);
      BBB_DB_CACHE.set(key,ready);
      queueMicrotask(()=>bbbRevalidate(table,query,key));
      return ready;
    }
  }

  const pending=bbbDbFresh(table,query).then(data=>{
    bbbWritePersisted(table,query,data);
    return data;
  }).catch(error=>{
    BBB_DB_CACHE.delete(key);
    throw error;
  });
  BBB_DB_CACHE.set(key,pending);
  return pending;
}

const bbbDbCached=bbbDb;

function bbbClearDbCache(table=''){
  if(!table){
    BBB_DB_CACHE.clear();
    try{
      for(let i=localStorage.length-1;i>=0;i--){
        const key=localStorage.key(i);
        if(key&&key.startsWith(BBB_DB_PERSIST_PREFIX))localStorage.removeItem(key);
      }
    }catch(error){}
    return;
  }
  for(const key of BBB_DB_CACHE.keys())if(key.startsWith(table+'?'))BBB_DB_CACHE.delete(key);
  try{
    for(let i=localStorage.length-1;i>=0;i--){
      const key=localStorage.key(i);
      if(key&&key.startsWith(BBB_DB_PERSIST_PREFIX+table+'?'))localStorage.removeItem(key);
    }
  }catch(error){}
}

function bbbWait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function bbbDbSafe(table,query='',fallback=[],options={}){
  const attempts=Math.max(1,Number(options.attempts)||2);
  const delay=Math.max(0,Number(options.delay)||250);
  const fresh=!!options.fresh;
  let lastError=null;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{return fresh?await bbbDbFresh(table,query):await bbbDb(table,query,{refresh:attempt>1});}
    catch(error){
      lastError=error;
      if(attempt<attempts){
        console.warn('BBB Supabase retry',table,error);
        await bbbWait(delay);
      }
    }
  }
  console.error('BBB Supabase data unavailable',table,lastError);
  return fallback;
}

function bbbEsc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function bbbNum(v){
  if(v==null||String(v).trim()==='')return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}

window.addEventListener('bbb:db-fresh',event=>{
  const table=event.detail?.table;
  const refreshers={
    site_dynasty:'load',
    site_rookies:'loadRookies',
    site_prospects:'loadProspects',
    site_draft_picks:'loadDraftPicks'
  };
  const fn=refreshers[table];
  if(fn&&typeof window[fn]==='function'){
    Promise.resolve(window[fn]()).catch(error=>console.warn('BBB live refresh render failed',table,error));
  }
});

window.BBB_CORE={
  supabaseUrl:BBB_SUPABASE_URL,
  db:bbbDb,
  dbFresh:bbbDbFresh,
  dbSafe:bbbDbSafe,
  clearDbCache:bbbClearDbCache,
  esc:bbbEsc,
  num:bbbNum
};
