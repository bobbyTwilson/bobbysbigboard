// Bobby's Big Board — Prospect Grades V2 preview.
// UI-only pass. Existing prospect grades, filters, sorting, and profile routing are unchanged.
(function(){
  const STYLE_ID='bbb-prospect-grades-v2-styles';
  if(document.getElementById(STYLE_ID))return;

  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    /* Desktop: keep the database feel, but surface the scouting context already in the data. */
    #prospectView .rankings-panel{border-color:#1c3b2f!important;background:#070e0b!important}
    #prospectView .prospect-controls{padding:14px!important;background:#08110d!important}
    #prospectView .prospect-table{min-width:1040px!important}
    #prospectView .prospect-table thead th{padding:12px 14px!important;color:#758a7f!important}
    #prospectView .prospect-table tbody tr{transition:background .14s ease,transform .14s ease,border-color .14s ease}
    #prospectView .prospect-table tbody tr:hover{background:#0b1712!important;transform:translateX(1px)}
    #prospectView .prospect-table td{padding:15px 14px!important;vertical-align:middle}
    #prospectView .prospect-player{color:#f5f8f6!important;font-size:13px!important;font-weight:950!important}
    #prospectView .prospect-pos{font-size:9px!important;padding:4px 8px!important}
    #prospectView .prospect-class{color:#83958b!important;font-size:11px!important}
    #prospectView .grade-cell{width:95px;color:#67dda1!important;font-size:20px!important;letter-spacing:-.03em}
    #prospectView .prospect-comp{color:#d0d9d4!important;font-size:11px!important}
    #prospectView .bbb-prospect-traits-head{width:320px}
    #prospectView .bbb-prospect-traits{width:320px}
    #prospectView .bbb-prospect-trait-list{display:flex;flex-wrap:wrap;gap:6px}
    #prospectView .bbb-prospect-trait{
      display:inline-flex;
      align-items:center;
      gap:5px;
      min-height:25px;
      padding:4px 7px;
      border:1px solid #284a3b;
      border-radius:999px;
      background:#0a1711;
      color:#9db1a6;
      font-size:8px;
      font-weight:850;
      white-space:nowrap;
    }
    #prospectView .bbb-prospect-trait b{color:#75dda7;font-size:8px}

    @media(max-width:640px){
      #prospectView .section{padding:44px 0!important}
      #prospectView .section-head{gap:12px!important;margin-bottom:18px!important}
      #prospectView .section-head h2{font-size:34px!important}
      #prospectView .section-sub{font-size:11px!important;line-height:1.55}

      #prospectView .rankings-panel{border:0!important;background:transparent!important;overflow:visible!important}
      #prospectView .prospect-controls{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:9px!important;
        margin-bottom:12px;
        padding:11px!important;
        border:1px solid #193329!important;
        border-radius:14px!important;
        background:#07100c!important;
      }
      #prospectView .tabs{
        display:grid!important;
        grid-template-columns:repeat(5,minmax(0,1fr));
        gap:5px!important;
        width:100%;
      }
      #prospectView .prospect-tab{
        min-width:0!important;
        min-height:39px;
        padding:8px 3px!important;
        border-radius:8px!important;
        font-size:9px!important;
        white-space:nowrap;
      }
      #prospectView .search,#prospectView .market-filter{min-height:44px;border-radius:10px!important;font-size:12px!important}

      /* Mobile scouting cards. */
      #prospectView .table-wrap{overflow:visible!important}
      #prospectView .prospect-table{display:block!important;min-width:0!important;width:100%!important}
      #prospectView .prospect-table thead{display:none!important}
      #prospectView .prospect-table tbody{display:grid!important;gap:9px!important;padding:0!important}
      #prospectView .prospect-table tbody tr{
        display:grid!important;
        grid-template-columns:68px minmax(0,1fr) auto!important;
        grid-template-areas:
          'grade player pos'
          'grade class class'
          'grade comp comp'
          'traits traits traits'!important;
        gap:5px 11px!important;
        min-height:118px;
        padding:12px!important;
        border:1px solid #183329!important;
        border-radius:13px!important;
        background:linear-gradient(145deg,#09120e,#07100c)!important;
        box-shadow:0 8px 22px rgba(0,0,0,.12);
        cursor:pointer;
      }
      #prospectView .prospect-table tbody tr:active{transform:scale(.995)!important;background:#0b1711!important}
      #prospectView .prospect-table td{min-width:0;padding:0!important;border:0!important;white-space:normal!important}
      #prospectView .grade-cell{
        grid-area:grade!important;
        align-self:stretch;
        display:flex!important;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        min-height:76px;
        padding:8px 6px!important;
        border:1px solid #285640!important;
        border-radius:10px!important;
        background:#0b2117!important;
        color:#72dfa8!important;
        font-size:23px!important;
        font-weight:950!important;
        line-height:1!important;
      }
      #prospectView .grade-cell::before{
        content:'GRADE';
        margin-bottom:6px;
        color:#6d8b7b;
        font-size:7px;
        font-weight:950;
        letter-spacing:.11em;
      }
      #prospectView .prospect-player{
        grid-area:player!important;
        align-self:end;
        overflow:hidden;
        color:#f6f8f6!important;
        font-size:15px!important;
        font-weight:950!important;
        line-height:1.15!important;
        text-overflow:ellipsis;
      }
      #prospectView .prospect-pos-cell{grid-area:pos!important;justify-self:end;align-self:end}
      #prospectView .prospect-pos{font-size:9px!important;padding:4px 7px!important}
      #prospectView .prospect-class{
        grid-area:class!important;
        color:#81948a!important;
        font-size:9px!important;
        font-weight:850;
      }
      #prospectView .prospect-class::before{
        content:'DRAFT CLASS · ';
        color:#5f7469;
        font-size:7px;
        font-weight:950;
        letter-spacing:.06em;
      }
      #prospectView .prospect-comp{
        grid-area:comp!important;
        padding-top:5px!important;
        color:#c8d3cd!important;
        font-size:10px!important;
        line-height:1.25;
      }
      #prospectView .prospect-comp::before{
        content:'PRO COMP · ';
        color:#60766a;
        font-size:7px;
        font-weight:950;
        letter-spacing:.07em;
      }
      #prospectView .bbb-prospect-traits{
        grid-area:traits!important;
        width:auto!important;
        margin-top:5px;
        padding-top:10px!important;
        border-top:1px solid #173027!important;
      }
      #prospectView .bbb-prospect-trait-list{display:flex;flex-wrap:wrap;gap:5px}
      #prospectView .bbb-prospect-trait{
        min-height:24px;
        max-width:100%;
        padding:4px 7px;
        border-color:#234535;
        background:#091710;
        font-size:8px;
      }
      #prospectView .bbb-prospect-trait b{font-size:8px}
      #prospectView .load-row{display:flex!important;flex-direction:column;align-items:stretch!important;gap:10px;padding:14px 0 0!important}
      #prospectView .result-count{text-align:center;font-size:10px!important}
      #prospectView .load-more{width:100%;min-height:44px;border-radius:10px!important;font-size:11px!important}
    }

    @media(max-width:370px){
      #prospectView .prospect-table tbody tr{grid-template-columns:62px minmax(0,1fr) auto!important;gap:5px 9px!important;padding:11px!important}
      #prospectView .grade-cell{font-size:21px!important}
      #prospectView .prospect-player{font-size:14px!important}
    }
  `;
  document.head.appendChild(style);

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function cleanTrait(head){
    if(typeof profileCleanTrait==='function')return profileCleanTrait(head);
    return String(head||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
  }
  function traitMax(pos,name,head){
    if(typeof profileTraitMax==='function')return profileTraitMax(pos,name,head);
    const m=String(head||'').match(/\((\d+(?:\.\d+)?)\)/);if(m)return Number(m[1]);
    return /Speed|Acceleration|Analytics/i.test(name)?10:5;
  }
  function topTraits(p){
    return Object.entries(p?.traits||{}).map(([head,raw])=>{
      const value=Number(raw);if(!Number.isFinite(value))return null;
      const name=cleanTrait(head);
      if(typeof profileIsTrait==='function'&&!profileIsTrait(name))return null;
      if(/projected draft capital/i.test(name))return null;
      const max=traitMax(p.pos,name,head);
      return{name,value,max,pct:max?value/max:0};
    }).filter(Boolean).sort((a,b)=>b.pct-a.pct||b.value-a.value).slice(0,3);
  }
  function score(v){return Number.isInteger(v)?String(v):Number(v).toFixed(1).replace(/\.0$/,'');}

  function addHeader(){
    const row=document.querySelector('#prospectView .prospect-table thead tr');
    if(row&&!row.querySelector('.bbb-prospect-traits-head')){
      const th=document.createElement('th');th.className='bbb-prospect-traits-head';th.textContent='Top Qualities';row.appendChild(th);
    }
  }
  function enhanceRows(){
    addHeader();
    const body=document.getElementById('prospectBody');
    const pool=(typeof prospects!=='undefined'&&Array.isArray(prospects))?prospects:null;
    if(!body||!pool)return false;
    const rows=[...body.querySelectorAll('tr')].filter(r=>r.querySelector('.prospect-player'));
    rows.forEach(row=>{
      const name=row.querySelector('.prospect-player')?.textContent.trim();
      const p=pool.find(x=>String(x.name||'').trim()===name);
      if(!p)return;
      let cell=row.querySelector('.bbb-prospect-traits');
      if(!cell){cell=document.createElement('td');cell.className='bbb-prospect-traits';row.appendChild(cell);}
      const traits=topTraits(p);
      cell.innerHTML=traits.length?`<div class="bbb-prospect-trait-list">${traits.map(t=>`<span class="bbb-prospect-trait">${esc(t.name)} <b>${score(t.value)}/${score(t.max)}</b></span>`).join('')}</div>`:'<span class="muted">—</span>';
    });
    return true;
  }

  function init(){
    enhanceRows();
    const body=document.getElementById('prospectBody');
    if(body)new MutationObserver(()=>enhanceRows()).observe(body,{childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  else setTimeout(init,0);
})();
