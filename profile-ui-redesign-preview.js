// Bobby's Big Board — Player Profile Redesign Preview
// Preview branch only. Re-composes the existing profile data into a more readable,
// responsive layout without changing ranking/profile data.

(function(){
  const STYLE_ID='bbb-profile-redesign-preview-styles';
  const LOGO_MAP={
    ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',
    DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAC:'jax',JAX:'jax',
    KC:'kc',LV:'lv',LAC:'lac',LAR:'lar',MIA:'mia',MIN:'min',NE:'ne',NO:'no',
    NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SF:'sf',SEA:'sea',TB:'tb',TEN:'ten',
    WAS:'wsh',WSH:'wsh'
  };

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function date(v){
    if(!v)return '';
    const d=new Date(String(v).slice(0,10)+'T12:00:00');
    return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
  function tradeValue(rank){const n=num(rank);return n==null?null:Math.round(10000*Math.exp(-.012*(n-1)))}
  function playerFor(slug){
    if(typeof bbbSnapshotCurrentPlayer==='function'){
      const p=bbbSnapshotCurrentPlayer(slug);
      if(p)return p;
    }
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return null;
    const key=String(found.playerKey||found.player_key||'');
    return (typeof players!=='undefined'?players:[]).find(p=>String(p.playerKey||p.player_key||'')===key)||found;
  }
  function logoUrl(team){
    const id=LOGO_MAP[String(team||'').toUpperCase()];
    return id?`https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`:'';
  }
  function moveMarkup(v,label){
    const n=num(v);
    const cls=n>0?'up':n<0?'down':'neutral';
    const text=n==null||n===0?'—':`${n>0?'↑':'↓'} ${Math.abs(n)}`;
    return `<div><small>${esc(label)}</small><strong class="${cls}">${esc(text)}</strong></div>`;
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #profileView{
        --bbb-pr-bg:#030806;
        --bbb-pr-panel:#06110c;
        --bbb-pr-panel-2:#071710;
        --bbb-pr-card:#07130e;
        --bbb-pr-line:#1c4c35;
        --bbb-pr-line-soft:#143426;
        --bbb-pr-green:#5ae39b;
        --bbb-pr-green-2:#35cc80;
        --bbb-pr-text:#f2f7f4;
        --bbb-pr-muted:#91a69a;
        --bbb-pr-muted-2:#667b70;
      }
      #profileView .profile-hero{
        padding:30px 0 20px!important;
        background:
          radial-gradient(circle at 83% 10%,rgba(38,185,110,.09),transparent 34%),
          linear-gradient(180deg,#04100b 0%,#030806 100%)!important;
      }
      #profileView .profile-hero .shell,
      #profileView .profile-content>.shell{max-width:1220px}
      #profileView .profile-back{
        display:inline-flex;align-items:center;margin-bottom:18px;color:#7f968a;
        font-size:10px;font-weight:850;letter-spacing:.06em;text-decoration:none
      }
      #profileView .profile-kicker{display:none!important}
      #profileView .bbb-redesign-hero-row{
        display:grid;grid-template-columns:116px minmax(0,1fr) auto;gap:24px;align-items:center
      }
      #profileView .bbb-redesign-team-logo{
        width:116px;height:116px;border:1px solid var(--bbb-pr-line);border-radius:18px;
        background:linear-gradient(145deg,#0a2016,#06110c);display:grid;place-items:center;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.015),0 16px 42px rgba(0,0,0,.24)
      }
      #profileView .bbb-redesign-team-logo img{width:84px;height:84px;object-fit:contain}
      #profileView .bbb-redesign-team-logo span{font-size:25px;font-weight:950;color:var(--bbb-pr-green)}
      #profileView .profile-title{
        margin:0!important;font-size:clamp(48px,5.2vw,72px)!important;line-height:.93!important;
        letter-spacing:-.055em;color:var(--bbb-pr-text)
      }
      #profileView .profile-title span{color:var(--bbb-pr-green)!important}
      #profileView .profile-meta{
        margin-top:12px!important;color:#cad6d0!important;font-size:13px!important;
        display:flex;align-items:center;gap:7px;flex-wrap:wrap
      }
      #profileView .profile-meta .pos-chip{
        background:#09251a!important;border:1px solid #246547!important;color:#78e9ad!important;
        padding:4px 8px!important
      }
      #profileView .bbb-redesign-hero-actions{display:flex;gap:10px;align-items:center;justify-content:flex-end}
      #profileView .bbb-redesign-hero-actions .bbb-profile-watch-wrap{margin:0!important}
      #profileView .bbb-redesign-hero-actions .bbb-profile-watch-wrap>span{display:none!important}
      #profileView .bbb-redesign-hero-actions .bbb-profile-watch,
      #profileView .bbb-redesign-compare{
        min-height:44px;padding:0 20px;border-radius:10px;border:1px solid #33b878;
        display:inline-flex;align-items:center;justify-content:center;gap:7px;text-decoration:none;
        font-size:11px;font-weight:950;letter-spacing:.02em;white-space:nowrap;box-sizing:border-box
      }
      #profileView .bbb-redesign-hero-actions .bbb-profile-watch{background:#06150f!important;color:#d9e9e0!important}
      #profileView .bbb-redesign-compare{background:var(--bbb-pr-green);color:#04100b;border-color:var(--bbb-pr-green)}
      #profileView .bbb-redesign-compare:hover{filter:brightness(1.04)}
      #profileView .bbb-profile-atglance{
        margin-top:24px!important;padding:18px!important;border-radius:16px!important;border:1px solid var(--bbb-pr-line)!important;
        background:linear-gradient(145deg,rgba(7,25,17,.98),rgba(4,13,9,.98))!important;
        box-shadow:0 20px 60px rgba(0,0,0,.18)!important
      }
      #profileView .bbb-redesign-section-head{
        display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:14px
      }
      #profileView .bbb-redesign-section-head h2,
      #profileView .bbb-fantasy-kicker{
        margin:0;color:var(--bbb-pr-green)!important;font-size:16px!important;line-height:1.1;
        font-weight:950!important;letter-spacing:.045em!important;text-transform:uppercase
      }
      #profileView .bbb-redesign-section-head p{
        margin:5px 0 0;color:var(--bbb-pr-muted)!important;font-size:11px!important;line-height:1.45
      }
      #profileView .bbb-redesign-snapshot-grid{
        display:grid;grid-template-columns:1.08fr 1fr 1fr 1fr 1.25fr;gap:9px
      }
      #profileView .bbb-redesign-metric{
        min-width:0;border:1px solid var(--bbb-pr-line-soft);background:var(--bbb-pr-card);
        border-radius:11px;padding:13px 14px;min-height:88px;box-sizing:border-box
      }
      #profileView .bbb-redesign-metric.primary{background:#092117;border-color:#2b6c4b}
      #profileView .bbb-redesign-metric>span{
        display:block;color:var(--bbb-pr-muted-2);font-size:8px;font-weight:950;letter-spacing:.09em;text-transform:uppercase
      }
      #profileView .bbb-redesign-metric>strong{
        display:block;margin-top:7px;color:var(--bbb-pr-text);font-size:24px;line-height:1;font-weight:950
      }
      #profileView .bbb-redesign-metric.primary>strong{color:var(--bbb-pr-green);font-size:30px}
      #profileView .bbb-redesign-metric>small{
        display:block;margin-top:6px;color:#9fb1a7;font-size:9px;font-weight:800;line-height:1.3
      }
      #profileView .bbb-redesign-metric .healthy{color:var(--bbb-pr-green)}
      #profileView .bbb-redesign-metric .watch{color:#f0ce76}
      #profileView .bbb-redesign-movement{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:11px}
      #profileView .bbb-redesign-movement small{
        display:block;color:var(--bbb-pr-muted-2);font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.06em
      }
      #profileView .bbb-redesign-movement strong{display:block;margin-top:4px;font-size:13px;color:#a9bbb1}
      #profileView .bbb-redesign-movement strong.up{color:#70e2a7}
      #profileView .bbb-redesign-movement strong.down{color:#ee8a8a}
      #profileView .bbb-redesign-latest{
        margin-top:10px;padding:13px 15px;border:1px solid #123827;border-left:4px solid #25d27e;
        border-radius:0 10px 10px 0;background:linear-gradient(90deg,#082218 0%,#06110c 72%)
      }
      #profileView .bbb-redesign-latest span{
        color:var(--bbb-pr-green);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase
      }
      #profileView .bbb-redesign-latest p{
        margin:7px 0 0;color:#d4dfd9;font-size:12px;line-height:1.58
      }

      #profileView .bbb-fantasy-season-strip{
        margin-top:14px!important;border:1px solid var(--bbb-pr-line)!important;
        background:linear-gradient(145deg,#071b12,#05100b)!important;border-radius:16px!important;
        padding:18px!important
      }
      #profileView .bbb-fantasy-season-head{margin-bottom:15px!important;align-items:flex-start!important}
      #profileView .bbb-fantasy-season-head small{
        margin-top:6px!important;color:var(--bbb-pr-muted)!important;font-size:11px!important
      }
      #profileView .bbb-fantasy-status{
        padding:5px 10px!important;font-size:8px!important;border-color:#2d855b!important
      }
      #profileView .bbb-fantasy-season-main{
        display:grid!important;grid-template-columns:1.15fr repeat(3,1fr)!important;gap:8px!important
      }
      #profileView .bbb-fantasy-season-main>div{
        border:1px solid var(--bbb-pr-line-soft)!important;background:#06110c;border-radius:10px;
        padding:12px 14px!important
      }
      #profileView .bbb-fantasy-season-main>div:first-child{border:1px solid #236546!important;padding-left:14px!important}
      #profileView .bbb-fantasy-season-main span{
        color:var(--bbb-pr-muted-2)!important;font-size:8px!important;letter-spacing:.08em!important
      }
      #profileView .bbb-fantasy-season-main strong{
        color:var(--bbb-pr-text)!important;font-size:23px!important;margin-top:6px!important;line-height:1
      }
      #profileView .bbb-fantasy-season-main .rank strong{color:var(--bbb-pr-green)!important;font-size:30px!important}
      #profileView .bbb-fantasy-statline{
        display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px!important;
        margin-top:10px!important;padding-top:0!important;border-top:0!important
      }
      #profileView .bbb-fantasy-statline span{
        white-space:normal!important;display:flex!important;flex-direction:column;justify-content:center;
        min-height:62px;padding:10px 12px;border:1px solid var(--bbb-pr-line-soft);border-radius:9px;background:#06110c;
        color:var(--bbb-pr-text)!important
      }
      #profileView .bbb-fantasy-statline span strong{font-size:17px;line-height:1;font-weight:950;color:var(--bbb-pr-text)}
      #profileView .bbb-fantasy-statline span small{
        margin-top:5px;color:var(--bbb-pr-muted-2);font-size:7px;font-weight:950;letter-spacing:.07em;text-transform:uppercase
      }
      #profileView .bbb-fantasy-jump{
        margin-top:10px!important;color:var(--bbb-pr-green)!important;font-size:8px!important
      }

      #profileView .profile-content{padding:14px 0 58px!important;background:var(--bbb-pr-bg)}
      #profileView .bbb-redesign-tabs{
        display:flex;gap:3px;align-items:center;overflow-x:auto;margin:0 0 12px;padding:4px;
        border:1px solid var(--bbb-pr-line-soft);border-radius:12px;background:#06110c;scrollbar-width:none
      }
      #profileView .bbb-redesign-tabs::-webkit-scrollbar{display:none}
      #profileView .bbb-redesign-tabs a{
        flex:0 0 auto;padding:9px 13px;border-radius:8px;color:#8fa198;text-decoration:none;
        font-size:8px;font-weight:950;letter-spacing:.07em;text-transform:uppercase
      }
      #profileView .bbb-redesign-tabs a:first-child,
      #profileView .bbb-redesign-tabs a:hover{background:#0a261a;color:var(--bbb-pr-green)}
      #profileView .profile-grid{gap:12px!important}
      #profileView .profile-card{
        border-color:var(--bbb-pr-line-soft)!important;background:linear-gradient(145deg,#07130e,#050d09)!important;
        border-radius:14px!important
      }
      #profileView .profile-card-kicker{color:var(--bbb-pr-green)!important;font-size:9px!important;letter-spacing:.1em!important}
      #profileView .profile-card h2{font-size:26px!important;line-height:1.08!important;color:var(--bbb-pr-text)!important}
      #profileView .profile-card p,#profileView .profile-note{font-size:11px!important;line-height:1.6!important}
      #profileView .bbb-redesign-data-pair{
        grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.18fr) minmax(0,.82fr);gap:12px
      }
      #profileView .bbb-redesign-data-pair>.profile-card{min-width:0;margin:0!important}
      #profileView .bbb-redesign-data-pair .bbb-v2-career-table{min-width:760px}
      #profileView .bbb-redesign-data-pair .bbb-game-table{min-width:700px}

      @media(max-width:980px){
        #profileView .bbb-redesign-hero-row{grid-template-columns:94px minmax(0,1fr);gap:18px}
        #profileView .bbb-redesign-team-logo{width:94px;height:94px}
        #profileView .bbb-redesign-team-logo img{width:68px;height:68px}
        #profileView .bbb-redesign-hero-actions{grid-column:1/-1;justify-content:stretch}
        #profileView .bbb-redesign-hero-actions>*{flex:1}
        #profileView .bbb-redesign-snapshot-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
        #profileView .bbb-redesign-metric.movement{grid-column:span 2}
        #profileView .bbb-fantasy-statline{grid-template-columns:repeat(3,minmax(0,1fr))}
        #profileView .bbb-redesign-data-pair{grid-template-columns:1fr}
      }
      @media(max-width:640px){
        #profileView .profile-hero{padding:18px 0 12px!important}
        #profileView .profile-hero .shell,#profileView .profile-content>.shell{padding-left:14px!important;padding-right:14px!important}
        #profileView .profile-back{margin-bottom:12px;font-size:9px}
        #profileView .bbb-redesign-hero-row{grid-template-columns:70px minmax(0,1fr);gap:12px}
        #profileView .bbb-redesign-team-logo{
          width:70px;height:70px;border-radius:13px
        }
        #profileView .bbb-redesign-team-logo img{width:52px;height:52px}
        #profileView .profile-title{
          font-size:clamp(31px,10vw,42px)!important;line-height:.96!important;letter-spacing:-.045em!important
        }
        #profileView .profile-meta{font-size:10px!important;margin-top:7px!important;gap:5px}
        #profileView .profile-meta .pos-chip{padding:3px 6px!important;font-size:8px!important}
        #profileView .bbb-redesign-hero-actions{gap:7px;margin-top:2px}
        #profileView .bbb-redesign-hero-actions .bbb-profile-watch,
        #profileView .bbb-redesign-compare{min-height:40px;padding:0 12px;font-size:10px}
        #profileView .bbb-profile-atglance{margin-top:14px!important;padding:12px!important;border-radius:13px!important}
        #profileView .bbb-redesign-section-head{margin-bottom:10px}
        #profileView .bbb-redesign-section-head h2,#profileView .bbb-fantasy-kicker{font-size:14px!important}
        #profileView .bbb-redesign-section-head p,#profileView .bbb-fantasy-season-head small{font-size:9px!important}
        #profileView .bbb-redesign-snapshot-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
        #profileView .bbb-redesign-metric{min-height:78px;padding:11px}
        #profileView .bbb-redesign-metric>strong{font-size:21px}
        #profileView .bbb-redesign-metric.primary>strong{font-size:27px}
        #profileView .bbb-redesign-metric.movement{grid-column:1/-1;min-height:auto}
        #profileView .bbb-redesign-latest{padding:11px 12px}
        #profileView .bbb-redesign-latest p{font-size:10px;line-height:1.55}
        #profileView .bbb-fantasy-season-strip{margin-top:9px!important;padding:12px!important;border-radius:13px!important}
        #profileView .bbb-fantasy-season-head{margin-bottom:10px!important}
        #profileView .bbb-fantasy-season-main{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
        #profileView .bbb-fantasy-season-main>div{padding:10px!important;text-align:center}
        #profileView .bbb-fantasy-season-main>div:first-child{padding-left:10px!important}
        #profileView .bbb-fantasy-season-main strong{font-size:21px!important}
        #profileView .bbb-fantasy-season-main .rank strong{font-size:27px!important}
        #profileView .bbb-fantasy-statline{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px!important}
        #profileView .bbb-fantasy-statline span{min-height:57px;padding:8px;text-align:center}
        #profileView .bbb-fantasy-statline span strong{font-size:15px}
        #profileView .bbb-fantasy-statline span small{font-size:6.5px}
        #profileView .bbb-fantasy-jump{
          display:flex!important;width:100%;min-height:38px;align-items:center;justify-content:center;
          box-sizing:border-box;border:1px solid #236546;border-radius:8px;background:#07180f;font-size:8px!important
        }
        #profileView .profile-content{padding-top:8px!important}
        #profileView .bbb-redesign-tabs{margin-bottom:9px}
        #profileView .bbb-redesign-tabs a{padding:8px 11px;font-size:7px}
        #profileView .profile-card{padding:14px!important}
        #profileView .profile-card h2{font-size:21px!important}
      }
      @media(max-width:400px){
        #profileView .bbb-fantasy-statline{grid-template-columns:repeat(2,minmax(0,1fr))}
        #profileView .bbb-redesign-team-logo{width:64px;height:64px}
        #profileView .bbb-redesign-team-logo img{width:46px;height:46px}
        #profileView .bbb-redesign-hero-row{grid-template-columns:64px minmax(0,1fr)}
      }
    `;
    document.head.appendChild(style);
  }

  function buildHero(slug,player){
    const shell=document.querySelector('#profileMount .profile-hero .shell');
    if(!shell||!player)return;
    let row=shell.querySelector('.bbb-redesign-hero-row');
    const title=shell.querySelector('.profile-title');
    const meta=shell.querySelector('.profile-meta');
    if(!title||!meta)return;

    const team=String(player.team||'').toUpperCase();
    const college=String(player.college||'').trim();
    const age=player.age??'';
    meta.innerHTML=[
      player.pos?`<span class="pos-chip">${esc(player.pos)}</span>`:'',
      team?`<span>${esc(team)}</span>`:'',
      college?`<span>• ${esc(college)}</span>`:'',
      age!==''?`<span>• Age ${esc(age)}</span>`:''
    ].filter(Boolean).join('');

    if(!row){
      row=document.createElement('div');
      row.className='bbb-redesign-hero-row';
      title.parentNode.insertBefore(row,title);
      const logo=document.createElement('div');
      logo.className='bbb-redesign-team-logo';
      const src=logoUrl(team);
      logo.innerHTML=src?`<img src="${esc(src)}" alt="${esc(team)} team logo" loading="eager">`:`<span>${esc(team||player.pos||'BBB')}</span>`;
      const identity=document.createElement('div');
      identity.className='bbb-redesign-identity';
      row.append(logo,identity);
      identity.append(title,meta);
      const actions=document.createElement('div');
      actions.className='bbb-redesign-hero-actions';
      row.appendChild(actions);
    }else{
      const logo=row.querySelector('.bbb-redesign-team-logo');
      if(logo){
        const src=logoUrl(team);
        logo.innerHTML=src?`<img src="${esc(src)}" alt="${esc(team)} team logo" loading="eager">`:`<span>${esc(team||player.pos||'BBB')}</span>`;
      }
    }

    const actions=row.querySelector('.bbb-redesign-hero-actions');
    if(actions){
      const watch=document.querySelector('#profileMount .bbb-profile-watch-wrap');
      if(watch&&!actions.contains(watch))actions.appendChild(watch);
      let compare=actions.querySelector('.bbb-redesign-compare');
      if(!compare){
        compare=document.createElement('a');
        compare.className='bbb-redesign-compare';
        compare.textContent='Compare →';
        actions.appendChild(compare);
      }
      compare.href=`/#compare?left=${encodeURIComponent(player.playerKey||player.player_key||slug)}`;
    }
  }

  async function buildSnapshot(slug,player){
    const card=document.querySelector('#profileMount .bbb-profile-atglance');
    if(!card||!player)return;
    let mover=null;
    if(typeof bbbSnapshotMover==='function'){
      try{mover=await bbbSnapshotMover(player.playerKey||player.player_key||slug)}catch{}
    }
    const rank=num(player.rank),pr=num(player.pr);
    const market=num(player.market);
    const validMarket=market!=null&&market>0;
    const gap=num(player.gap);
    const trade=tradeValue(rank);
    const status=String(player.injuryStatus||'Healthy').trim()||'Healthy';
    const healthy=/healthy|active|cleared/i.test(status);
    const latest=String(player.latestUpdate||player.injuryNote||'').trim();
    const latestDate=player.updateDate||player.injuryUpdated||'';
    const marketSub=!validMarket?'Not ranked':gap==null?'Market data available':gap>0?`BBB +${gap} spots`:gap<0?`BBB ${gap} spots`:'Same as BBB';

    card.innerHTML=`
      <div class="bbb-redesign-section-head">
        <div><h2>Player Snapshot</h2><p>Key info, rankings, and current status at a glance.</p></div>
      </div>
      <div class="bbb-redesign-snapshot-grid">
        <div class="bbb-redesign-metric primary">
          <span>BBB Rank</span><strong>${rank==null?'—':'#'+esc(rank)}</strong>
          <small>${esc(player.pos||'')}${pr??'—'}</small>
        </div>
        <div class="bbb-redesign-metric">
          <span>Market Rank</span><strong>${validMarket?'#'+esc(market):'UR'}</strong>
          <small>${esc(marketSub)}</small>
        </div>
        <div class="bbb-redesign-metric">
          <span>Trade Value</span><strong>${trade==null?'—':esc(trade.toLocaleString())}</strong>
          <small>BBB value</small>
        </div>
        <div class="bbb-redesign-metric">
          <span>Health</span><strong class="${healthy?'healthy':'watch'}">${esc(status)}</strong>
          <small>${healthy?'No active concern':'Monitor status'}</small>
        </div>
        <div class="bbb-redesign-metric movement">
          <span>Movement</span>
          <div class="bbb-redesign-movement">
            ${moveMarkup(mover?.bbb_move_7d,'7D')}
            ${moveMarkup(mover?.bbb_move_30d,'30D')}
          </div>
        </div>
      </div>
      ${latest?`<div class="bbb-redesign-latest"><span>Latest BBB Take${latestDate?' · '+esc(date(latestDate)):''}</span><p>${esc(latest)}</p></div>`:''}
    `;
  }

  function decorateFantasy(){
    const strip=document.querySelector('#profileMount .bbb-fantasy-season-strip');
    if(!strip)return;
    strip.id='bbbFantasySeason';
    const labels=['CMP/ATT','PASS YDS','PASS TD','INT','RUSH YDS','RUSH TD','CAR','TGT','REC','REC YDS','REC TD'];
    strip.querySelectorAll('.bbb-fantasy-statline span').forEach(el=>{
      if(el.dataset.bbbDecorated==='1')return;
      const text=String(el.textContent||'').trim();
      const label=labels.find(x=>text.endsWith(' '+x));
      if(!label)return;
      const value=text.slice(0,-label.length).trim();
      el.innerHTML=`<strong>${esc(value)}</strong><small>${esc(label)}</small>`;
      el.dataset.bbbDecorated='1';
    });
    const jump=strip.querySelector('.bbb-fantasy-jump');
    if(jump)jump.innerHTML='View Game Log →';
  }

  function buildContentNav(){
    const content=document.querySelector('#profileMount .profile-content>.shell');
    const grid=content?.querySelector('.profile-grid');
    if(!content||!grid)return;
    const overview=grid.querySelector('.bbb-overview-card');if(overview)overview.id='bbbOverview';
    const timeline=grid.querySelector('.bbb-v2-updates-card');if(timeline)timeline.id='bbbTimeline';
    const career=grid.querySelector('.bbb-v2-career-card');if(career)career.id='bbbCareerStats';
    const game=grid.querySelector('#bbbGameLog');

    let tabs=content.querySelector('.bbb-redesign-tabs');
    if(!tabs){
      tabs=document.createElement('nav');
      tabs.className='bbb-redesign-tabs';
      tabs.setAttribute('aria-label','Player profile sections');
      content.insertBefore(tabs,grid);
    }
    const links=[];
    if(overview)links.push(['Overview','#bbbOverview']);
    if(game)links.push(['Game Log','#bbbGameLog']);
    if(career)links.push(['Career','#bbbCareerStats']);
    if(timeline)links.push(['Updates','#bbbTimeline']);
    links.push(['Rankings','/#rankings']);
    tabs.innerHTML=links.map(([label,href])=>`<a href="${href}">${esc(label)}</a>`).join('');

    if(game&&career){
      let pair=grid.querySelector('.bbb-redesign-data-pair');
      if(!pair){
        pair=document.createElement('div');
        pair.className='bbb-redesign-data-pair';
        const first=[game,career].sort((a,b)=>{
          const pos=a.compareDocumentPosition(b);
          return pos&Node.DOCUMENT_POSITION_FOLLOWING?-1:1;
        })[0];
        grid.insertBefore(pair,first);
      }
      pair.append(game,career);
    }
  }

  async function apply(slug){
    const player=playerFor(slug);
    if(!player)return;
    ensureStyles();
    buildHero(slug,player);
    await buildSnapshot(slug,player);
    decorateFantasy();
    buildContentNav();
  }

  ensureStyles();

  if(typeof profileRender==='function'){
    const base=profileRender;
    profileRender=async function(slug){
      const result=await base(slug);
      apply(slug);
      requestAnimationFrame(()=>apply(slug));
      setTimeout(()=>apply(slug),160);
      setTimeout(()=>apply(slug),700);
      setTimeout(()=>apply(slug),1300);
      return result;
    };
  }

  const current=(typeof profileNameFromPath==='function'?profileNameFromPath():'');
  if(current)setTimeout(()=>apply(current),50);
})();
