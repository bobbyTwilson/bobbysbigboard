/* Shared read-only Midnight Archive loader.
 * Public publishable key is safe with strict Supabase RLS: only Bobby/Lisa IDs can write.
 * Never expose a service-role/secret key in browser code.
 */
(function(){
  "use strict";
  const SUPABASE_URL="https://twbduhmibbotregdxlla.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS";
  const selector='midnight_archive_films?select=id,payload,watched_on,watch_order,updated_at&order=watch_order.asc';
  const fallbackNode=document.getElementById("vault-data");
  const initial=fallbackNode?JSON.parse(fallbackNode.textContent):[];
  let cache=null,inFlight=null;
  const byWatchOrder=(a,b)=>(a.watch_order||a.id||0)-(b.watch_order||b.id||0);
  function rowToFilm(row){
    const payload=row.payload||{};
    return {...payload,id:row.id,watch_order:row.watch_order,watched_on:row.watched_on||null,updated_at:row.updated_at||null};
  }
  function validate(films){return Array.isArray(films)&&films.every(f=>Number.isInteger(f.id)&&typeof f.title==="string"&&typeof f.b==="number"&&typeof f.l==="number");}
  async function load(force=false){
    if(cache&&!force)return cache;
    if(inFlight&&!force)return inFlight;
    inFlight=(async()=>{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),9500);
      try{
        const res=await fetch(SUPABASE_URL+'/rest/v1/'+selector,{headers:{"apikey":PUBLISHABLE_KEY,"Accept":"application/json"},signal:controller.signal,cache:"no-store"});
        if(!res.ok)throw new Error("Movie archive HTTP "+res.status);
        const data=await res.json();
        const films=data.map(rowToFilm).sort(byWatchOrder);
        if(!validate(films)||films.length<17)throw new Error("Movie archive returned invalid or incomplete collection");
        cache=films;return films;
      }finally{clearTimeout(timer);inFlight=null;}
    })();
    try{return await inFlight;}catch(error){console.warn("Movie archive live sync unavailable; using published movie data",error);return initial;}
  }
  function clearCache(){cache=null;}
  function combined(f){return (Number(f.b)+Number(f.l))/2;}
  function rank(films,key="combined"){return [...films].sort((a,b)=>{
    const av=key==="b"?Number(a.b):key==="l"?Number(a.l):combined(a);
    const bv=key==="b"?Number(b.b):key==="l"?Number(b.l):combined(b);
    return bv-av||combined(b)-combined(a)||a.title.localeCompare(b.title);
  });}
  function movieUrl(f){return "/midnight-archive/movie/?id="+encodeURIComponent(f.id);}
  function safeUrl(u){try{const url=new URL(u);return url.protocol==="https:"?url.href:"";}catch{return "";}}
  function imdbUrl(f){
    const ids={1:"tt0077651",2:"tt0106308",3:"tt0443453",4:"tt0120611",5:"tt0187738",6:"tt1179933",7:"tt1735485",8:"tt3289956",9:"tt5638642",10:"tt0075342",11:"tt0080761",12:"tt0082418",13:"tt0083972",14:"tt0087298",15:"tt0089173",16:"tt0091080",17:"tt0095179"};
    if(f.imdb_id&&/^tt\d{7,9}$/.test(f.imdb_id))return "https://www.imdb.com/title/"+f.imdb_id+"/";
    if(ids[f.id])return "https://www.imdb.com/title/"+ids[f.id]+"/";
    return "https://www.imdb.com/find/?q="+encodeURIComponent(f.title+" "+f.year);
  }
  function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  window.MidnightArchive={SUPABASE_URL,PUBLISHABLE_KEY,initial,load,clearCache,combined,rank,movieUrl,imdbUrl,safeUrl,escapeHTML};
})();
