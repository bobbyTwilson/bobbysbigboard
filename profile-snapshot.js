// Bobby's Big Board player profile at-a-glance layer.
// Keeps the existing deep profile research intact while making the hero useful immediately.

function bbbSnapshotNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function bbbSnapshotDate(v){
  if(!v)return '';
  const raw=String(v).slice(0,10),d=new Date(raw+'T12:00:00');
  return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function bbbSnapshotMove(v){
  const n=bbbSnapshotNum(v);
  if(n==null)return '<strong class="neutral">—</strong>';
  if(n>0)return `<strong class="up">↑ ${bbbEsc(n)}</strong>`;
  if(n<0)return `<strong class="down">↓ ${bbbEsc(Math.abs(n))}</strong>`;
  return '<strong class="neutral">—</strong>';
}
function bbbSnapshotMarket(player){
  const view=String(player?.view||'').toUpperCase();
  if(view.includes('BUY'))return '<span class="bbb-snapshot-market buy">BBB BUY</span>';
  if(view.includes('FADE'))return '<span class="bbb-snapshot-market fade">BBB FADE</span>';
  return '<span class="bbb-snapshot-market market">≈ MARKET</span>';
}
function bbbSnapshotLatest(player){
  const latest=String(player?.latestUpdate||player?.injuryNote||'').trim();
  return {text:latest,date:player?.updateDate||player?.injuryUpdated||''};
}
function bbbSnapshotTradeValue(rank){
  const n=bbbSnapshotNum(rank);
  return n==null?null:Math.round(10000*Math.exp(-.012*(n-1)));
}
async function bbbSnapshotMover(playerKey){
  if(!playerKey||typeof bbbDb!=='function')return null;
  const key=encodeURIComponent(playerKey);
  const rows=await bbbDb('site_movers',`select=player_key,bbb_move_7d,bbb_move_30d,current_rank,current_market_rank,current_gap,market_view&player_key=eq.${key}&limit=1`).catch(()=>[]);
  return rows?.[0]||null;
}
function bbbSnapshotCurrentPlayer(slug){
  const found=typeof profileFind==='function'?profileFind(slug):null;
  if(!found)return null;
  return (players||[]).find(p=>String(p.playerKey||'')===String(found.playerKey||found.player_key||''))
    ||(players||[]).find(p=>typeof profileNorm==='function'&&profileNorm(p.name)===profileNorm(found.name))
    ||null;
}
function bbbSnapshotCleanDuplicates(){
  const mount=document.querySelector('#profileMount');
  if(!mount)return;
  mount.querySelector('.profile-statbar')?.remove();
  mount.querySelector('.bbb-v2-snapshot')?.remove();
  [...mount.querySelectorAll('a,button')].forEach(el=>{
    const text=String(el.textContent||'').trim().toUpperCase();
    if(text.startsWith('COMPARE THIS PLAYER')&&!el.closest('.bbb-profile-atglance'))el.remove();
  });
}
function bbbSnapshotRender(slug,player,mover){
  const hero=document.querySelector('#profileMount .profile-hero .shell');
  const meta=hero?.querySelector('.profile-meta');
  if(!hero||!meta||!player)return;

  hero.querySelector('.bbb-profile-atglance')?.remove();
  const rank=bbbSnapshotNum(player.rank),pr=bbbSnapshotNum(player.pr),gap=bbbSnapshotNum(player.gap),market=bbbSnapshotNum(player.market);
  const tradeValue=bbbSnapshotTradeValue(rank);
  const status=String(player.injuryStatus||'Healthy').trim()||'Healthy';
  const healthy=/healthy|active|cleared/i.test(status);
  const latest=bbbSnapshotLatest(player);

  const section=document.createElement('section');
  section.className='bbb-profile-atglance';
  section.innerHTML=`
    <div class="bbb-snapshot-top">
      <div><span class="bbb-snapshot-kicker">PLAYER SNAPSHOT</span><p>Current BBB value, movement, market context and health.</p></div>
      <div class="bbb-snapshot-actions"></div>
    </div>
    <div class="bbb-snapshot-grid">
      <div class="primary"><span>BBB Rank</span><strong>${rank==null?'—':'#'+bbbEsc(rank)}</strong><small>${bbbEsc(player.pos||'')}${pr??'—'}</small></div>
      <div class="movement"><span>Movement</span><div><small>7D Movement</small>${bbbSnapshotMove(mover?.bbb_move_7d)}</div><div><small>30D Movement</small>${bbbSnapshotMove(mover?.bbb_move_30d)}</div></div>
      <div><span>Market Rank</span><strong>${market==null?'UR':'#'+bbbEsc(market)}</strong>${bbbSnapshotMarket(player)}</div>
      <div><span>BBB vs Market</span><strong class="${gap>0?'up':gap<0?'down':'neutral'}">${gap==null?'—':(gap>0?'+':'')+bbbEsc(gap)}</strong></div>
      <div><span>Trade Value</span><strong>${tradeValue==null?'—':bbbEsc(tradeValue.toLocaleString())}</strong></div>
      <div><span>Health</span><strong class="bbb-snapshot-health ${healthy?'healthy':'watch'}">${bbbEsc(status)}</strong></div>
    </div>
    ${latest.text?`<div class="bbb-snapshot-take"><div><span>LATEST BBB TAKE${latest.date?' · '+bbbEsc(bbbSnapshotDate(latest.date)):''}</span></div><p>${bbbEsc(latest.text)}</p></div>`:''}
  `;

  meta.insertAdjacentElement('afterend',section);
  const actionBox=section.querySelector('.bbb-snapshot-actions');
  const watch=hero.querySelector('.bbb-profile-watch-wrap');
  if(watch)actionBox.appendChild(watch);
  const compare=document.createElement('a');compare.className='bbb-snapshot-quick';compare.href=`/#compare?left=${encodeURIComponent(player.playerKey||slug)}`;compare.textContent='COMPARE →';actionBox.appendChild(compare);
  bbbSnapshotCleanDuplicates();
}

function bbbSnapshotInjectStyles(){
  if(document.querySelector('#bbb-profile-snapshot-styles'))return;
  const s=document.createElement('style');s.id='bbb-profile-snapshot-styles';s.textContent=`
  .bbb-profile-atglance{margin-top:24px;border:1px solid #24503b;background:linear-gradient(135deg,rgba(10,31,21,.96),rgba(6,15,11,.96));border-radius:17px;padding:17px;box-shadow:0 20px 60px rgba(0,0,0,.18)}
  .bbb-snapshot-top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:13px}.bbb-snapshot-kicker{display:block;color:#57d893;font-size:8px;font-weight:950;letter-spacing:.14em}.bbb-snapshot-top p{margin:3px 0 0;color:#71857a;font-size:9px}.bbb-snapshot-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.bbb-snapshot-actions .bbb-profile-watch-wrap{margin:0;gap:0}.bbb-snapshot-actions .bbb-profile-watch-wrap>span{display:none}.bbb-snapshot-actions .bbb-profile-watch{padding:8px 11px;background:#08150f}.bbb-snapshot-quick{display:inline-flex;align-items:center;border:1px solid #315342;background:#08150f;color:#a9bbb1;border-radius:999px;padding:8px 11px;font-size:8px;font-weight:950;letter-spacing:.05em}.bbb-snapshot-quick:hover{border-color:#47ca83;color:#fff}
  .bbb-snapshot-grid{display:grid;grid-template-columns:1.08fr 1.28fr repeat(4,minmax(0,1fr));gap:7px}.bbb-snapshot-grid>div{min-width:0;border:1px solid #193529;background:#07110c;border-radius:10px;padding:10px 11px}.bbb-snapshot-grid>div.primary{background:#092016;border-color:#256445}.bbb-snapshot-grid span{display:block;color:#687d71;font-size:7px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}.bbb-snapshot-grid strong{display:block;color:#f0f5f2;font-size:15px;line-height:1.18;white-space:normal}.bbb-snapshot-grid .primary strong{font-size:20px;color:#6ce0a3}.bbb-snapshot-grid .primary>small{display:block;color:#93aa9e;font-size:8px;font-weight:900;margin-top:4px}.bbb-snapshot-grid strong.up{color:#72dfa6}.bbb-snapshot-grid strong.down{color:#ee8a8a}.bbb-snapshot-grid strong.neutral{color:#a3b0a9}.bbb-snapshot-grid .movement{display:grid;grid-template-columns:1fr 1fr;column-gap:8px}.bbb-snapshot-grid .movement>span{grid-column:1/-1}.bbb-snapshot-grid .movement>div{min-width:0}.bbb-snapshot-grid .movement small{display:block;color:#5f7468;font-size:6px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}.bbb-snapshot-grid .movement strong{font-size:12px}.bbb-snapshot-market{display:inline-flex!important;width:max-content;margin-top:5px;border-radius:999px;padding:3px 6px;font-size:7px!important;font-weight:950!important;letter-spacing:.02em!important}.bbb-snapshot-market.buy{background:#0a2b1d;color:#74e5a9;border:1px solid #176743}.bbb-snapshot-market.fade{background:#351717;color:#f08b8b;border:1px solid #743535}.bbb-snapshot-market.market{background:#18201c;color:#aab8b0;border:1px solid #34443b}.bbb-snapshot-health{font-size:11px!important;line-height:1.3!important}.bbb-snapshot-health.healthy{color:#74e5a9!important}.bbb-snapshot-health.watch{color:#e8cd74!important}
  .bbb-snapshot-take{margin-top:9px;border-left:3px solid #0a8f4d;background:#07110c;border-radius:0 10px 10px 0;padding:11px 13px}.bbb-snapshot-take>div{display:flex;justify-content:space-between;gap:12px;align-items:center}.bbb-snapshot-take>div>span{color:#54d891;font-size:7px;font-weight:950;letter-spacing:.1em}.bbb-snapshot-take p{margin:6px 0 0;color:#cbd6d0;font-size:10px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  @media(max-width:1050px){.bbb-snapshot-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:720px){.bbb-snapshot-top{align-items:flex-start;flex-direction:column}.bbb-snapshot-actions{justify-content:flex-start}.bbb-snapshot-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:430px){.bbb-profile-atglance{padding:13px;margin-top:18px}.bbb-snapshot-grid{gap:6px}.bbb-snapshot-grid>div{padding:9px}.bbb-snapshot-grid strong{font-size:13px}.bbb-snapshot-grid .primary strong{font-size:17px}.bbb-snapshot-take p{font-size:9px}}
  `;document.head.appendChild(s);
}

bbbSnapshotInjectStyles();
if(typeof profileRender==='function'){
  const bbbSnapshotBaseProfileRender=profileRender;
  profileRender=async function(slug){
    const result=await bbbSnapshotBaseProfileRender(slug);
    const player=bbbSnapshotCurrentPlayer(slug);
    if(!player)return result;
    const mover=await bbbSnapshotMover(player.playerKey||slug);
    bbbSnapshotRender(slug,player,mover);
    return result;
  };
}
