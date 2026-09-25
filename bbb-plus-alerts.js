// BBB+ Alerts + Watchlists V1
// Premium tracking and "since your last visit" intelligence layered on top of free My Players.

(function(){
  const STYLE_ID='bbb-plus-alerts-styles';
  const MOUNT_ID='bbbPlusAlerts';
  let data=null;
  let loading=false;
  let accessState='unknown';
  let markTimer=null;
  let reloadTimer=null;

  const q=s=>document.querySelector(s);
  const esc=v=>typeof bbbEsc==='function'?bbbEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const sess=()=>typeof bbbAccountSession!=='undefined'?bbbAccountSession:null;
  const signed=()=>!!sess()?.access_token;
  const fmtDate=v=>{
    if(!v)return '—';
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return String(v);
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' · '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  };
  const move=v=>{
    const x=n(v);
    if(x==null||x===0)return '<span class="bbbpa-move flat">—</span>';
    return '<span class="bbbpa-move '+(x>0?'up':'down')+'">'+(x>0?'↑ ':'↓ ')+Math.abs(x)+'</span>';
  };

  function watchedRows(){
    const keys=typeof bbbWatchKeys!=='undefined'?bbbWatchKeys:new Set();
    const board=typeof bbbWatchBoard!=='undefined'?bbbWatchBoard:[];
    return (board||[])
      .filter(p=>keys?.has?.(String(p.player_key||'')))
      .sort((a,b)=>(Number(a.rank)||9999)-(Number(b.rank)||9999));
  }

  function settingMap(){
    return new Map((data?.settings||[]).map(s=>[String(s.player_key||''),s]));
  }

  function ensureStyles(){
    if(q('#'+STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #watchlistView .bbb-plus-alerts{margin:0 0 18px;border:1px solid #5c4b25;background:radial-gradient(circle at 92% 0,rgba(241,197,82,.11),transparent 30%),linear-gradient(155deg,#11140d,#07110d 48%,#060b08);border-radius:16px;padding:18px;overflow:hidden}
      #watchlistView .bbbpa-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:14px}
      #watchlistView .bbbpa-kicker{color:#f0cb66;font-size:8px;font-weight:1000;letter-spacing:.12em;text-transform:uppercase}
      #watchlistView .bbbpa-head h3{margin:5px 0 5px;font-size:22px;line-height:1;letter-spacing:-.035em}
      #watchlistView .bbbpa-head p{margin:0;max-width:720px;color:#81948a;font-size:9.5px;line-height:1.6}
      #watchlistView .bbbpa-badge{flex:none;display:inline-flex;align-items:center;border:1px solid #6e5a29;background:#211c0c;color:#f0cf70;border-radius:999px;padding:6px 9px;font-size:7px;font-weight:1000;letter-spacing:.07em}
      #watchlistView .bbbpa-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:9px}
      #watchlistView .bbbpa-metric{border:1px solid #223a30;background:#07110d;border-radius:10px;padding:11px}
      #watchlistView .bbbpa-metric span{display:block;color:#677a70;font-size:6.4px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
      #watchlistView .bbbpa-metric strong{display:block;color:#eef4ef;font-size:18px;line-height:1.05}
      #watchlistView .bbbpa-metric small{display:block;color:#71847a;font-size:7.5px;line-height:1.4;margin-top:5px}
      #watchlistView .bbbpa-metric.gold strong{color:#f0cb67}
      #watchlistView .bbbpa-metric.green strong{color:#73e1a7}
      #watchlistView .bbbpa-metric.red strong{color:#ef8f8f}
      #watchlistView .bbbpa-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:8px}
      #watchlistView .bbbpa-card{border:1px solid #223a30;background:#07110d;border-radius:11px;padding:13px;min-width:0}
      #watchlistView .bbbpa-card h4{margin:0 0 9px;color:#e9f0ec;font-size:11px}
      #watchlistView .bbbpa-card-copy{margin:-4px 0 10px;color:#6f8277;font-size:8px;line-height:1.5}
      #watchlistView .bbbpa-alerts{display:grid;gap:6px}
      #watchlistView .bbbpa-alert{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:9px;align-items:start;padding:9px;border:1px solid #173027;background:#050c08;border-radius:9px}
      #watchlistView .bbbpa-alert-type{display:inline-flex;width:max-content;border-radius:999px;padding:4px 6px;font-size:6.5px;font-weight:1000;letter-spacing:.05em;text-transform:uppercase;background:#17221d;border:1px solid #32443b;color:#aebdb5}
      #watchlistView .bbbpa-alert-type.rank{background:#0a2b1d;border-color:#176743;color:#73e4a8}
      #watchlistView .bbbpa-alert-type.market{background:#261f0d;border-color:#68572a;color:#eccb69}
      #watchlistView .bbbpa-alert-type.injury{background:#351717;border-color:#743535;color:#f09595}
      #watchlistView .bbbpa-alert-main strong{display:block;color:#edf4ef;font-size:9px}
      #watchlistView .bbbpa-alert-main span{display:block;color:#71847a;font-size:7px;margin-top:2px}
      #watchlistView .bbbpa-alert-main p{margin:5px 0 0;color:#a4b4ab;font-size:8.5px;line-height:1.5}
      #watchlistView .bbbpa-alert-rank{color:#66d89d;font-size:10px;font-weight:950;white-space:nowrap}
      #watchlistView .bbbpa-empty{padding:14px;border:1px dashed #294036;border-radius:9px;background:#050c08;color:#809288;font-size:8.5px;line-height:1.55}
      #watchlistView .bbbpa-movers{display:grid;gap:6px}
      #watchlistView .bbbpa-mover{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:9px;border:1px solid #173027;background:#050c08;border-radius:9px}
      #watchlistView .bbbpa-mover strong{display:block;color:#eaf1ed;font-size:9px}
      #watchlistView .bbbpa-mover small{display:block;color:#687b71;font-size:7px;margin-top:2px}
      #watchlistView .bbbpa-mover-col{text-align:right}
      #watchlistView .bbbpa-mover-col span{display:block;color:#61756a;font-size:5.8px;font-weight:950;text-transform:uppercase;margin-bottom:3px}
      #watchlistView .bbbpa-move{display:inline-flex;border-radius:999px;padding:3px 6px;font-size:7px;font-weight:950}
      #watchlistView .bbbpa-move.up{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}
      #watchlistView .bbbpa-move.down{background:#351717;border:1px solid #743535;color:#f08b8b}
      #watchlistView .bbbpa-move.flat{background:#18201c;border:1px solid #34443b;color:#aab8b0}
      #watchlistView .bbbpa-settings{margin-top:9px;border:1px solid #223a30;background:#07110d;border-radius:11px;padding:13px}
      #watchlistView .bbbpa-settings-head{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:9px}
      #watchlistView .bbbpa-settings-head h4{margin:0;color:#edf4ef;font-size:11px}
      #watchlistView .bbbpa-settings-head span{color:#6f8277;font-size:7.5px}
      #watchlistView .bbbpa-setting-list{display:grid;gap:6px}
      #watchlistView .bbbpa-setting{display:grid;grid-template-columns:minmax(150px,1.2fr) 82px repeat(4,78px);gap:6px;align-items:center;padding:8px 9px;border:1px solid #173027;background:#050c08;border-radius:9px}
      #watchlistView .bbbpa-player strong{display:block;color:#edf4ef;font-size:9px}
      #watchlistView .bbbpa-player span{display:block;color:#687b71;font-size:7px;margin-top:2px}
      #watchlistView .bbbpa-track-btn,#watchlistView .bbbpa-flag{min-height:30px;border:1px solid #2c4539;background:#09130f;color:#809289;border-radius:7px;font-size:7px;font-weight:950;cursor:pointer}
      #watchlistView .bbbpa-track-btn.on{border-color:#6e5a29;background:#211c0c;color:#f0cf70}
      #watchlistView .bbbpa-flag.on{border-color:#27674b;background:#0b251a;color:#78dfa8}
      #watchlistView .bbbpa-flag:disabled{opacity:.32;cursor:not-allowed}
      #watchlistView .bbbpa-lock{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center}
      #watchlistView .bbbpa-lock h3{margin:5px 0 6px;font-size:22px}
      #watchlistView .bbbpa-lock p{margin:0;color:#82948a;font-size:9.5px;line-height:1.6;max-width:720px}
      #watchlistView .bbbpa-lock-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}
      #watchlistView .bbbpa-lock-tags span{padding:5px 7px;border:1px solid #2a4036;background:#07110d;border-radius:999px;color:#9bacA3;font-size:6.5px;font-weight:900}
      #watchlistView .bbbpa-action{display:inline-flex;padding:9px 11px;border:1px solid #6b592a;background:#1c180b;color:#efd06f;border-radius:8px;font-size:7.5px;font-weight:950;text-decoration:none;white-space:nowrap}
      #watchlistView .bbbpa-loading{min-height:120px;display:grid;place-items:center;color:#82948a;font-size:8.5px;border:1px dashed #294036;border-radius:9px}
      @media(max-width:1050px){#watchlistView .bbbpa-grid{grid-template-columns:1fr}#watchlistView .bbbpa-setting{grid-template-columns:minmax(150px,1fr) 75px repeat(4,68px)}}
      @media(max-width:760px){#watchlistView .bbbpa-metrics{grid-template-columns:1fr 1fr}#watchlistView .bbbpa-setting{grid-template-columns:minmax(0,1fr) 74px;grid-template-areas:'player track' 'flags flags';padding:10px}#watchlistView .bbbpa-player{grid-area:player}#watchlistView .bbbpa-track-btn{grid-area:track}#watchlistView .bbbpa-flag{grid-area:auto}#watchlistView .bbbpa-setting:after{content:'';grid-area:flags;z-index:-1}#watchlistView .bbbpa-setting{display:flex;flex-wrap:wrap}#watchlistView .bbbpa-player{flex:1 1 180px}#watchlistView .bbbpa-track-btn{flex:0 0 76px}#watchlistView .bbbpa-flag{flex:1 1 70px}#watchlistView .bbbpa-alert{grid-template-columns:64px minmax(0,1fr)}#watchlistView .bbbpa-alert-rank{grid-column:2}#watchlistView .bbbpa-lock{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function ensureMount(){
    let mount=q('#'+MOUNT_ID);
    if(mount)return mount;
    const summary=q('#watchlistView #bbbWatchSummary');
    if(!summary)return null;
    mount=document.createElement('section');
    mount.id=MOUNT_ID;
    mount.className='bbb-plus-alerts';
    summary.insertAdjacentElement('afterend',mount);
    return mount;
  }

  function lockHtml(){
    const isSigned=signed();
    return '<div class="bbbpa-lock"><div><div class="bbbpa-kicker">BBB+ PLAYER ALERTS</div><h3>Know what changed without hunting for it.</h3><p>Premium tracking watches the BBB rank, consensus rank, health status and new BBB updates for the players you care about, then gives you a clean “since your last visit” feed.</p><div class="bbbpa-lock-tags"><span>RANK ALERTS</span><span>MARKET ALERTS</span><span>INJURY ALERTS</span><span>NEWS ALERTS</span><span>DAILY MOVERS</span></div></div>'+
      (isSigned?'<a class="bbbpa-action" href="#plus">BBB+ LAUNCHING SOON</a>':'<a class="bbbpa-action" href="#account">SIGN IN TO MY BBB</a>')+
      '</div>';
  }

  function loadingHtml(){
    return '<div class="bbbpa-head"><div><div class="bbbpa-kicker">BBB+ PLAYER ALERTS</div><h3>Loading your tracked players.</h3><p>Checking rank movement, market movement, player updates and health changes.</p></div><span class="bbbpa-badge">BBB+ PREMIUM</span></div><div class="bbbpa-loading">CHECKING YOUR BBB+ ALERTS…</div>';
  }

  function alertType(type){
    if(type==='rank')return 'BBB RANK';
    if(type==='market')return 'MARKET';
    if(type==='injury')return 'HEALTH';
    return 'UPDATE';
  }

  function alertsHtml(){
    const alerts=data?.alerts||[];
    if(data?.state?.first_visit)return '<div class="bbbpa-empty"><strong>Tracking baseline starts now.</strong><br>This is your first premium alert visit, so there is nothing to compare against yet. From here forward, BBB+ will surface meaningful changes since your last visit.</div>';
    if(!alerts.length)return '<div class="bbbpa-empty"><strong>You’re caught up.</strong><br>No meaningful tracked-player changes have landed since your last visit.</div>';
    return '<div class="bbbpa-alerts">'+alerts.slice(0,10).map(a=>'<div class="bbbpa-alert">'+
      '<span class="bbbpa-alert-type '+esc(a.type||'news')+'">'+alertType(a.type)+'</span>'+
      '<div class="bbbpa-alert-main"><strong>'+esc(a.name||'Player')+' · '+esc(a.title||'Update')+'</strong><span>'+fmtDate(a.at)+'</span><p>'+esc(a.detail||'')+'</p></div>'+
      '<div class="bbbpa-alert-rank">'+(n(a.current_rank)!=null?'#'+Math.round(n(a.current_rank)):'')+'</div>'+
    '</div>').join('')+'</div>';
  }

  function moversHtml(){
    const movers=data?.daily_movers||[];
    if(!movers.length)return '<div class="bbbpa-empty">Turn on premium tracking for watched players to build your personalized movers list.</div>';
    return '<div class="bbbpa-movers">'+movers.slice(0,6).map(m=>'<div class="bbbpa-mover">'+
      '<div><strong>'+esc(m.name||m.player_key)+'</strong><small>'+esc(m.pos||'')+(m.team?' · '+esc(m.team):'')+' · BBB #'+esc(m.current_rank||'—')+'</small></div>'+
      '<div class="bbbpa-mover-col"><span>BBB 7D</span>'+move(m.bbb_move_7d)+'</div>'+
      '<div class="bbbpa-mover-col"><span>Market 7D</span>'+move(m.market_move_7d)+'</div>'+
    '</div>').join('')+'</div>';
  }

  function settingRows(){
    const watched=watchedRows();
    const map=settingMap();
    if(!watched.length)return '<div class="bbbpa-empty">Add players to <strong>My Players</strong> first, then you can turn on BBB+ tracking for the ones you care about most.</div>';

    return '<div class="bbbpa-setting-list">'+watched.map(p=>{
      const key=String(p.player_key||''),s=map.get(key),enabled=!!s?.enabled;
      const flag=(field,label)=>'<button type="button" class="bbbpa-flag '+(enabled&&s?.[field]!==false?'on':'')+'" data-bbbpa-flag="'+field+'" data-bbbpa-key="'+esc(key)+'" '+(!enabled?'disabled':'')+'>'+label+'</button>';
      return '<div class="bbbpa-setting">'+
        '<div class="bbbpa-player"><strong>'+esc(p.name)+'</strong><span>'+esc(p.pos||'')+(p.team?' · '+esc(p.team):'')+' · BBB #'+esc(p.rank||'—')+'</span></div>'+
        '<button type="button" class="bbbpa-track-btn '+(enabled?'on':'')+'" data-bbbpa-track="'+esc(key)+'">'+(enabled?'TRACKING':'TRACK')+'</button>'+
        flag('rank_alert','RANK')+flag('market_alert','MARKET')+flag('injury_alert','INJURY')+flag('news_alert','NEWS')+
      '</div>';
    }).join('')+'</div>';
  }

  function dataHtml(){
    const tracked=data?.tracked_players||[];
    const watched=watchedRows();
    const alerts=data?.alerts||[];
    const health=tracked.filter(p=>!/healthy|active|cleared/i.test(String(p.injury_status||'Healthy'))).length;
    const biggest=(data?.daily_movers||[])[0];
    const badge=data?.access?.source==='admin'?'OWNER PREVIEW':'BBB+ ACTIVE';
    const last=data?.state?.last_seen_at?fmtDate(data.state.last_seen_at):'Baseline starts now';

    return '<div class="bbbpa-head"><div><div class="bbbpa-kicker">BBB+ PLAYER ALERTS</div><h3>Your watchlist, but smarter.</h3><p>Choose which watched players BBB+ should actively track. Your premium feed only surfaces meaningful changes instead of making you re-check every player profile.</p></div><span class="bbbpa-badge">'+badge+'</span></div>'+
      '<div class="bbbpa-metrics">'+
        '<div class="bbbpa-metric green"><span>Active Tracking</span><strong>'+tracked.length+' / '+watched.length+'</strong><small>watched players</small></div>'+
        '<div class="bbbpa-metric gold"><span>Since Last Visit</span><strong>'+alerts.length+'</strong><small>'+esc(last)+'</small></div>'+
        '<div class="bbbpa-metric"><span>Biggest Tracked Mover</span><strong style="font-size:12px">'+esc(biggest?.name||'—')+'</strong><small>'+(biggest?('BBB 7D '+(n(biggest.bbb_move_7d)>0?'+':'')+(n(biggest.bbb_move_7d)||0)):'No movement yet')+'</small></div>'+
        '<div class="bbbpa-metric '+(health?'red':'')+'"><span>Health Watch</span><strong>'+health+'</strong><small>tracked players needing attention</small></div>'+
      '</div>'+
      '<div class="bbbpa-grid">'+
        '<div class="bbbpa-card"><h4>Since your last visit</h4><p class="bbbpa-card-copy">Meaningful rank, market, health and BBB update changes for players you actively track.</p>'+alertsHtml()+'</div>'+
        '<div class="bbbpa-card"><h4>Tracked-player movers</h4><p class="bbbpa-card-copy">The biggest recent BBB and consensus movement inside your premium tracking list.</p>'+moversHtml()+'</div>'+
      '</div>'+
      '<div class="bbbpa-settings"><div class="bbbpa-settings-head"><div><h4>Alert controls</h4><span>Rank • market • injury • BBB news can be controlled per player.</span></div><span>'+tracked.length+' actively tracked</span></div>'+settingRows()+'</div>';
  }

  function render(kind){
    ensureStyles();
    const mount=ensureMount();if(!mount)return;
    if(kind==='locked'){mount.innerHTML=lockHtml();return}
    if(kind==='loading'){mount.innerHTML=loadingHtml();return}
    if(kind==='data'){mount.innerHTML=dataHtml();return}
    mount.innerHTML='<div class="bbbpa-empty">BBB+ player alerts are temporarily unavailable. Your free My Players dashboard is still working.</div>';
  }

  async function load(){
    if(location.hash!=='#watchlist')return;
    ensureStyles();ensureMount();

    const s=sess();
    if(!s?.access_token){accessState='locked';data=null;render('locked');return}
    if(loading)return;
    loading=true;
    render('loading');

    try{
      const r=await fetch(BBB_SUPABASE_URL+'/functions/v1/bbb-plus-alerts',{
        headers:{apikey:BBB_SUPABASE_KEY,Authorization:'Bearer '+s.access_token}
      });
      const body=await r.json().catch(()=>({}));
      if(r.status===401||r.status===403){
        accessState='locked';data=null;render('locked');return;
      }
      if(!r.ok)throw new Error(body.error||'Alerts unavailable');
      accessState='active';data=body;render('data');
      scheduleMarkSeen();
    }catch(err){
      console.warn('BBB+ alerts',err);
      accessState='error';data=null;render('error');
    }finally{
      loading=false;
    }
  }

  async function saveSetting(playerKey,patch){
    const s=sess();if(!s?.access_token||accessState!=='active')return;
    const current=settingMap().get(playerKey)||{};
    const payload={
      action:'set_tracking',
      player_key:playerKey,
      enabled:patch.enabled!==undefined?patch.enabled:(current.enabled!==false),
      rank_alert:patch.rank_alert!==undefined?patch.rank_alert:(current.rank_alert!==false),
      market_alert:patch.market_alert!==undefined?patch.market_alert:(current.market_alert!==false),
      injury_alert:patch.injury_alert!==undefined?patch.injury_alert:(current.injury_alert!==false),
      news_alert:patch.news_alert!==undefined?patch.news_alert:(current.news_alert!==false)
    };
    try{
      const r=await fetch(BBB_SUPABASE_URL+'/functions/v1/bbb-plus-alerts',{
        method:'POST',
        headers:{apikey:BBB_SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body.error||'Could not save tracking settings');
      clearTimeout(reloadTimer);
      reloadTimer=setTimeout(()=>{loading=false;load()},100);
    }catch(err){
      console.warn('BBB+ tracking save',err);
      alert(err.message||'Could not save BBB+ tracking settings.');
    }
  }

  async function markSeen(){
    if(accessState!=='active'||location.hash!=='#watchlist'||!(data?.tracked_players||[]).length)return;
    const s=sess();if(!s?.access_token)return;
    try{
      await fetch(BBB_SUPABASE_URL+'/functions/v1/bbb-plus-alerts',{
        method:'POST',
        headers:{apikey:BBB_SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},
        body:JSON.stringify({action:'mark_seen'})
      });
    }catch{}
  }

  function scheduleMarkSeen(){
    clearTimeout(markTimer);
    markTimer=setTimeout(markSeen,4500);
  }

  document.addEventListener('click',e=>{
    const track=e.target.closest('[data-bbbpa-track]');
    if(track){
      e.preventDefault();e.stopPropagation();
      const key=track.dataset.bbbpaTrack;
      const current=settingMap().get(key);
      saveSetting(key,{enabled:!current?.enabled});
      return;
    }
    const flag=e.target.closest('[data-bbbpa-flag]');
    if(flag){
      e.preventDefault();e.stopPropagation();
      const key=flag.dataset.bbbpaKey,field=flag.dataset.bbbpaFlag,current=settingMap().get(key);
      if(!current?.enabled)return;
      saveSetting(key,{[field]:current[field]===false});
    }
  });

  function hookWatchToggle(){
    if(typeof bbbWatchToggle!=='function'||bbbWatchToggle.__bbbPlusAlerts)return;
    const base=bbbWatchToggle;
    const wrapped=function(key){
      const wasWatching=typeof bbbWatchIs==='function'?bbbWatchIs(key):false;
      const result=base.apply(this,arguments);
      if(wasWatching&&accessState==='active'&&settingMap().get(String(key||''))?.enabled){
        saveSetting(String(key||''),{enabled:false});
      }else if(location.hash==='#watchlist'){
        setTimeout(()=>{if(data)render('data')},20);
      }
      return result;
    };
    wrapped.__bbbPlusAlerts=true;
    bbbWatchToggle=wrapped;
  }

  function init(){
    ensureStyles();
    hookWatchToggle();
    if(location.hash==='#watchlist'){
      ensureMount();
      // One premium fetch is enough. Repeated startup fetches were causing the
      // dashboard to repaint several times and made My Players feel sticky.
      setTimeout(load,40);
    }
  }

  window.addEventListener('hashchange',()=>{
    clearTimeout(markTimer);
    if(location.hash==='#watchlist')setTimeout(load,80);
  });
  window.addEventListener('popstate',()=>{if(location.hash==='#watchlist')setTimeout(load,80)});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();