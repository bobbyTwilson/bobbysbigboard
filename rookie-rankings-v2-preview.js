// Bobby's Big Board — Rookie Rankings V2 preview.
// Mobile-first readability pass with light desktop polish. Data and ranking logic are unchanged.
(function(){
  if(document.getElementById('bbb-rookie-rankings-v2-styles'))return;

  const style=document.createElement('style');
  style.id='bbb-rookie-rankings-v2-styles';
  style.textContent=`
    /* Light desktop polish */
    #rookieView .rankings-panel{border-color:#1d3a2f!important;background:#070e0b!important}
    #rookieView .controls{padding:15px!important;background:#08110d;border-bottom-color:#1d3a2f!important}
    #rookieView .rookie-table thead th{padding:13px 14px!important;color:#788d82!important}
    #rookieView .rookie-table tbody tr{transition:background .14s ease,border-color .14s ease}
    #rookieView .rookie-table tbody tr:hover{background:#0b1712!important}
    #rookieView .rookie-table td{padding:14px!important}
    #rookieView .rookie-table .rank-cell{font-size:18px!important}
    #rookieView .rookie-table .player-cell{font-size:13px!important}
    #rookieView .tier-chip{min-width:34px;font-size:9px!important;letter-spacing:.03em}
    #rookieView .tier-chip.bbb-tier-s{border-color:#347f5c!important;background:#0c2d1e!important;color:#8df0ba!important}
    #rookieView .tier-chip.bbb-tier-a{border-color:#2f694f!important;background:#0d2419!important;color:#74dfa5!important}
    #rookieView .tier-chip.bbb-tier-b{border-color:#345a70!important;background:#0e2029!important;color:#8cc9e9!important}
    #rookieView .tier-chip.bbb-tier-c{border-color:#655827!important;background:#251f0d!important;color:#e7cb6f!important}
    #rookieView .tier-chip.bbb-tier-d{border-color:#70492e!important;background:#26170f!important;color:#e9a272!important}
    #rookieView .tier-chip.bbb-tier-f{border-color:#713838!important;background:#291313!important;color:#ee8e8e!important}

    @media(max-width:640px){
      #rookieView .section{padding:44px 0!important}
      #rookieView .section-head{gap:12px!important;margin-bottom:18px!important}
      #rookieView .section-head h2{font-size:34px!important}
      #rookieView .section-sub{font-size:11px!important;line-height:1.55}

      #rookieView .rankings-panel{
        border:0!important;
        background:transparent!important;
        overflow:visible!important;
      }
      #rookieView .controls{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:9px!important;
        margin-bottom:12px;
        padding:11px!important;
        border:1px solid #193329!important;
        border-radius:14px!important;
        background:#07100c!important;
      }
      #rookieView .tabs{
        display:grid!important;
        grid-template-columns:repeat(5,minmax(0,1fr));
        gap:5px!important;
        width:100%;
      }
      #rookieView .rookie-tab{
        min-width:0!important;
        min-height:39px;
        padding:8px 3px!important;
        border-radius:8px!important;
        font-size:9px!important;
        white-space:nowrap;
      }
      #rookieView .search,
      #rookieView .market-filter{
        min-height:44px;
        border-radius:10px!important;
        font-size:12px!important;
      }

      /* Compact rookie cards */
      #rookieView .table-wrap{overflow:visible!important}
      #rookieView .rookie-table{display:block!important;min-width:0!important;width:100%!important}
      #rookieView .rookie-table thead{display:none!important}
      #rookieView .rookie-table tbody{
        display:grid!important;
        gap:9px!important;
        padding:0!important;
      }
      #rookieView .rookie-table tbody tr{
        position:relative;
        display:grid!important;
        grid-template-columns:50px minmax(0,1fr) auto!important;
        grid-template-rows:auto auto auto!important;
        gap:4px 10px!important;
        align-items:center!important;
        min-height:88px;
        padding:13px 12px!important;
        border:1px solid #183329!important;
        border-radius:12px!important;
        background:linear-gradient(145deg,#09120e,#07100c)!important;
        box-shadow:0 8px 22px rgba(0,0,0,.13);
        cursor:pointer;
      }
      #rookieView .rookie-table tbody tr:active{transform:scale(.995);background:#0b1711!important}
      #rookieView .rookie-table td{
        min-width:0;
        padding:0!important;
        border:0!important;
        white-space:normal!important;
      }
      #rookieView .rookie-table .rank-cell{
        grid-column:1!important;
        grid-row:1/4!important;
        align-self:stretch;
        display:flex!important;
        align-items:center!important;
        justify-content:center;
        padding-right:10px!important;
        border-right:1px solid #173027!important;
        color:#55d892!important;
        font-size:24px!important;
        font-weight:950!important;
        line-height:1!important;
      }
      #rookieView .rookie-table .player-cell{
        grid-column:2!important;
        grid-row:1!important;
        overflow:hidden;
        color:#f6f8f6!important;
        font-size:15px!important;
        font-weight:950!important;
        line-height:1.15!important;
        text-overflow:ellipsis;
      }
      #rookieView .rookie-table .col-pos{
        display:flex!important;
        grid-column:3!important;
        grid-row:1!important;
        justify-self:end;
      }
      #rookieView .rookie-table .col-pos .pos-chip{font-size:9px!important;padding:4px 7px!important}
      #rookieView .rookie-table .col-team{
        display:block!important;
        grid-column:2!important;
        grid-row:2!important;
        color:#82958b!important;
        font-size:10px!important;
        font-weight:800;
      }
      #rookieView .rookie-table .col-age{display:none!important}
      #rookieView .rookie-table .col-view{
        display:flex!important;
        grid-column:3!important;
        grid-row:2!important;
        justify-self:end;
        align-items:center;
      }
      #rookieView .rookie-table .tier-chip{
        min-width:36px;
        padding:4px 8px!important;
        font-size:9px!important;
      }
      #rookieView .rookie-table .col-market-rank{
        display:flex!important;
        grid-column:2!important;
        grid-row:3!important;
        align-items:center!important;
        gap:4px!important;
        color:#a1b0a8!important;
        font-size:9px!important;
      }
      #rookieView .rookie-table .col-market-rank::before{
        content:'MARKET';
        color:#60766a;
        font-size:7px;
        font-weight:950;
        letter-spacing:.08em;
      }
      #rookieView .rookie-table .col-diff{
        display:flex!important;
        grid-column:3!important;
        grid-row:3!important;
        justify-self:end!important;
        align-items:center!important;
        gap:4px!important;
        font-size:9px!important;
      }
      #rookieView .rookie-table .col-diff::before{
        content:'BBB';
        color:#60766a;
        font-size:7px;
        font-weight:950;
        letter-spacing:.08em;
      }
      #rookieView .rookie-table .col-diff .diff{font-size:10px!important;font-weight:950!important}

      #rookieView .load-row{
        display:flex!important;
        flex-direction:column;
        align-items:stretch!important;
        gap:10px;
        padding:14px 0 0!important;
      }
      #rookieView .result-count{text-align:center;font-size:10px!important}
      #rookieView .load-more{width:100%;min-height:44px;border-radius:10px!important;font-size:11px!important}
    }

    @media(max-width:370px){
      #rookieView .rookie-table tbody tr{grid-template-columns:44px minmax(0,1fr) auto!important;gap:4px 8px!important;padding:12px 10px!important}
      #rookieView .rookie-table .rank-cell{font-size:21px!important;padding-right:8px!important}
      #rookieView .rookie-table .player-cell{font-size:14px!important}
    }
  `;
  document.head.appendChild(style);

  function tierClass(label){
    const t=String(label||'').trim().replace(/^Tier\s*/i,'').toUpperCase();
    return ['S','A','B','C','D','F'].includes(t)?'bbb-tier-'+t.toLowerCase():'';
  }

  function enhanceTiers(){
    const body=document.getElementById('rookieBody');
    if(!body)return false;
    body.querySelectorAll('.tier-chip').forEach(chip=>{
      chip.classList.remove('bbb-tier-s','bbb-tier-a','bbb-tier-b','bbb-tier-c','bbb-tier-d','bbb-tier-f');
      const cls=tierClass(chip.textContent);
      if(cls)chip.classList.add(cls);
    });
    return true;
  }

  function init(){
    enhanceTiers();
    const body=document.getElementById('rookieBody');
    if(body)new MutationObserver(enhanceTiers).observe(body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  else setTimeout(init,0);
})();
