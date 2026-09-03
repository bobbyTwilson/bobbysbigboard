const BBB_SUPABASE_URL='https://twbduhmibbotregdxlla.supabase.co';
const BBB_SUPABASE_KEY='sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS';

function bbbBuildDbUrl(table,query=''){
  return BBB_SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:'');
}

async function bbbDb(table,query=''){
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

function bbbWait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function bbbDbSafe(table,query='',fallback=[],options={}){
  const attempts=Math.max(1,Number(options.attempts)||2);
  const delay=Math.max(0,Number(options.delay)||250);
  let lastError=null;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{return await bbbDb(table,query);}
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

window.BBB_CORE={
  supabaseUrl:BBB_SUPABASE_URL,
  db:bbbDb,
  dbSafe:bbbDbSafe,
  esc:bbbEsc,
  num:bbbNum
};
