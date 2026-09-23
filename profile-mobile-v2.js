// Bobby's Big Board — Mobile Player Profile V2
// Mobile-only profile polish. Removes page-wide overflow and converts wide
// career/game-log tables into readable stat cards without changing desktop.

(function(){
  const STYLE_ID='bbb-profile-mobile-v2-styles';
  let scheduled=false;

  function isPlayerRoute(){
    return /^\/player\/[^/?#]+\/?$/.test(location.pathname);
  }

  function annotateTable(table){
    if(!table)return;
    const headers=[...table.querySelectorAll('thead th')].map(th=>String(th.textContent||'').trim());
    table.querySelectorAll('tbody tr').forEach(row=>{
      if(row.classList.contains('bbb-career-drill-row'))return;
      [...row.cells].forEach((cell,index)=>{
        const label=headers[index]||'';
        if(label)cell.dataset.bbbMobileLabel=label;
      });
    });
    table.dataset.bbbMobileReady='1';
  }

  function annotateAll(){
    if(!isPlayerRoute())return;
    document.querySelectorAll(
      '#profileView .bbb-game-table,'+
      '#profileView .bbb-v2-career-table,'+
      '#profileView .bbb-career-drill-table'
    ).forEach(annotateTable);
  }

  function ensureViewport(){
    let meta=document.querySelector('meta[name="viewport"]');
    if(!meta){
      meta=document.createElement('meta');
      meta.name='viewport';
      document.head.appendChild(meta);
    }
    const current=String(meta.content||'');
    if(!/width=device-width/i.test(current)){
      meta.content='width=device-width, initial-scale=1, viewport-fit=cover';
    }
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      @media(max-width:700px){
        html,body{max-width:100%;overflow-x:clip}
        #profileView,#profileMount,
        #profileView .profile-hero,
        #profileView .profile-content,
        #profileView .profile-card,
        #profileView .bbb-profile-tabs-v2,
        #profileView .bbb-tabs-panel,
        #profileView .bbb-v2-career-card,
        #profileView .bbb-fantasy-gamelog-card{
          max-width:100%!important;
          min-width:0!important;
          overflow-x:hidden!important;
        }

        #profileView .profile-hero .shell,
        #profileView .profile-content>.shell,
        #profileView .shell{
          width:calc(100% - 20px)!important;
          max-width:100%!important;
          min-width:0!important;
          margin-left:auto!important;
          margin-right:auto!important;
          padding-left:0!important;
          padding-right:0!important;
        }

        #profileView .bbb-redesign-hero-row{
          grid-template-columns:62px minmax(0,1fr)!important;
          gap:10px!important;
          align-items:center!important;
        }
        #profileView .bbb-redesign-team-logo{
          width:62px!important;
          height:62px!important;
          border-radius:12px!important;
        }
        #profileView .bbb-redesign-team-logo img{
          width:46px!important;
          height:46px!important;
        }
        #profileView .profile-title{
          font-size:clamp(28px,9vw,38px)!important;
          line-height:.98!important;
          letter-spacing:-.04em!important;
          overflow-wrap:anywhere;
        }
        #profileView .profile-meta{
          font-size:9px!important;
          gap:4px!important;
          margin-top:6px!important;
        }
        #profileView .bbb-redesign-hero-actions{
          grid-column:1/-1!important;
          display:grid!important;
          grid-template-columns:1fr 1fr!important;
          gap:7px!important;
          width:100%!important;
        }
        #profileView .bbb-redesign-hero-actions>*{
          width:100%!important;
          min-width:0!important;
        }
        #profileView .bbb-redesign-hero-actions .bbb-profile-watch,
        #profileView .bbb-redesign-compare{
          width:100%!important;
          min-height:42px!important;
          padding:0 9px!important;
          font-size:9px!important;
          white-space:normal!important;
          text-align:center!important;
        }

        #profileView .bbb-profile-atglance,
        #profileView .bbb-fantasy-season-strip,
        #profileView .profile-card{
          width:100%!important;
          min-width:0!important;
          margin-left:0!important;
          margin-right:0!important;
        }
        #profileView .bbb-profile-atglance{padding:11px!important}
        #profileView .bbb-redesign-snapshot-grid{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:6px!important;
        }
        #profileView .bbb-redesign-metric{
          min-width:0!important;
          min-height:72px!important;
          padding:10px!important;
        }
        #profileView .bbb-redesign-metric>strong{font-size:19px!important}
        #profileView .bbb-redesign-metric.primary>strong{font-size:24px!important}

        #profileView .bbb-fantasy-season-strip{padding:11px!important}
        #profileView .bbb-fantasy-season-main{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:6px!important;
        }
        #profileView .bbb-fantasy-season-main>div{
          min-width:0!important;
          padding:9px!important;
        }
        #profileView .bbb-fantasy-statline,
        #profileView .bbb-fantasy-statline.bbb-preview-production-grid{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:6px!important;
        }
        #profileView .bbb-fantasy-statline span,
        #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span{
          min-width:0!important;
          min-height:54px!important;
          padding:8px!important;
        }

        #profileView .bbb-tabs-bar,
        #profileView .bbb-redesign-tabs{
          width:100%!important;
          max-width:100%!important;
          overflow-x:auto!important;
          overscroll-behavior-x:contain;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none;
        }
        #profileView .bbb-tabs-bar::-webkit-scrollbar,
        #profileView .bbb-redesign-tabs::-webkit-scrollbar{display:none}
        #profileView .bbb-tabs-btn,
        #profileView .bbb-redesign-tabs a{
          flex:0 0 auto!important;
          min-height:42px!important;
        }

        #profileView .bbb-redesign-data-pair{
          display:block!important;
          width:100%!important;
          min-width:0!important;
        }
        #profileView .bbb-redesign-data-pair>.profile-card{
          width:100%!important;
          min-width:0!important;
          margin-bottom:10px!important;
        }

        /* Mobile stat-table system: no sideways swipe, every row becomes a card. */
        #profileView .bbb-game-table-wrap,
        #profileView .bbb-v2-career-table-wrap,
        #profileView .bbb-career-drill-table-wrap{
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          overflow:visible!important;
          border:0!important;
          background:transparent!important;
        }
        #profileView .bbb-game-table-wrap:before,
        #profileView .bbb-v2-career-table-wrap:before,
        #profileView .bbb-career-drill-table-wrap:before{
          display:none!important;
          content:none!important;
        }

        #profileView .bbb-game-table,
        #profileView .bbb-v2-career-table,
        #profileView .bbb-career-drill-table,
        #profileView .bbb-preview-readable-game-table,
        #profileView .bbb-preview-readable-career-table{
          display:block!important;
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          border-collapse:separate!important;
        }
        #profileView .bbb-game-table thead,
        #profileView .bbb-v2-career-table thead,
        #profileView .bbb-career-drill-table thead{
          display:none!important;
        }
        #profileView .bbb-game-table tbody,
        #profileView .bbb-v2-career-table tbody,
        #profileView .bbb-career-drill-table tbody{
          display:grid!important;
          grid-template-columns:1fr!important;
          gap:9px!important;
          width:100%!important;
          padding:0!important;
        }
        #profileView .bbb-game-table tbody tr,
        #profileView .bbb-v2-career-table tbody tr:not(.bbb-career-drill-row),
        #profileView .bbb-career-drill-table tbody tr{
          display:grid!important;
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:6px!important;
          width:100%!important;
          min-width:0!important;
          padding:10px!important;
          border:1px solid #1c4333!important;
          border-radius:11px!important;
          background:#07120e!important;
          box-sizing:border-box!important;
        }

        #profileView .bbb-game-table td,
        #profileView .bbb-v2-career-table tr:not(.bbb-career-drill-row)>td,
        #profileView .bbb-career-drill-table td{
          position:static!important;
          display:flex!important;
          flex-direction:column!important;
          align-items:flex-start!important;
          justify-content:center!important;
          gap:3px!important;
          width:auto!important;
          min-width:0!important;
          max-width:100%!important;
          padding:8px 9px!important;
          border:1px solid #163328!important;
          border-radius:8px!important;
          background:#091811!important;
          box-shadow:none!important;
          color:#d5dfda!important;
          font-size:11px!important;
          line-height:1.2!important;
          text-align:left!important;
          white-space:normal!important;
          overflow-wrap:anywhere!important;
        }
        #profileView .bbb-game-table td:before,
        #profileView .bbb-v2-career-table tr:not(.bbb-career-drill-row)>td:before,
        #profileView .bbb-career-drill-table td:before{
          content:attr(data-bbb-mobile-label);
          display:block;
          color:#6f877a;
          font-size:7px;
          line-height:1;
          font-weight:950;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        #profileView .bbb-game-table td:first-child,
        #profileView .bbb-v2-career-table tr:not(.bbb-career-drill-row)>td:first-child,
        #profileView .bbb-career-drill-table td:first-child{
          background:#0b2118!important;
          border-color:#24533d!important;
        }
        #profileView .bbb-game-table td:nth-child(2),
        #profileView .bbb-v2-career-table tr:not(.bbb-career-drill-row)>td:nth-child(2){
          background:#0a1712!important;
        }
        #profileView .bbb-game-table .bbb-preview-ppr-cell,
        #profileView .bbb-v2-career-table td.ppr{
          background:#0b2a1d!important;
          border-color:#216a47!important;
        }
        #profileView .bbb-game-ppr,
        #profileView .bbb-v2-career-table td.ppr{
          font-size:15px!important;
          color:#78e5ab!important;
        }
        #profileView .bbb-game-rank,
        #profileView .bbb-drill-rank{
          margin-top:1px;
        }

        #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row:not(.bbb-career-season-unavailable) td:last-child:after{
          display:none!important;
        }
        #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row.is-expanded{
          border-color:#2d765b!important;
          background:#0a1b14!important;
        }

        #profileView .bbb-v2-career-table tbody tr.bbb-career-drill-row{
          display:block!important;
          width:100%!important;
          padding:0!important;
          border:0!important;
          background:transparent!important;
        }
        #profileView .bbb-v2-career-table tbody tr.bbb-career-drill-row>td{
          display:block!important;
          width:100%!important;
          padding:0!important;
          border:0!important;
          background:transparent!important;
        }
        #profileView .bbb-v2-career-table tbody tr.bbb-career-drill-row>td:before{
          display:none!important;
          content:none!important;
        }
        #profileView .bbb-career-drill-panel{
          width:100%!important;
          max-width:100%!important;
          margin:0!important;
          padding:12px!important;
          border-left:0!important;
          border:1px solid #285a48!important;
          border-radius:11px!important;
          overflow:hidden!important;
        }
        #profileView .bbb-career-drill-summary{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:6px!important;
        }
        #profileView .bbb-career-drill-summary>span:last-child{
          grid-column:1/-1!important;
        }

        #profileView .bbb-preview-season-summary{padding:11px!important}
        #profileView .bbb-preview-season-summary-head{grid-template-columns:1fr!important;gap:10px!important}
        #profileView .bbb-preview-season-fantasy-grid,
        #profileView .bbb-preview-season-production-grid{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:6px!important;
        }

        #profileView .profile-card{
          padding:12px!important;
          border-radius:12px!important;
        }
        #profileView .profile-card h2{font-size:20px!important}
        #profileView .bbb-game-head{
          gap:9px!important;
          margin-bottom:11px!important;
        }
        #profileView .bbb-game-head h2{font-size:23px!important}
        #profileView .bbb-game-head select{
          min-height:44px;
          font-size:16px!important;
        }
        #profileView .bbb-career-collapse-all,
        #profileView .bbb-career-drill-close{
          min-height:42px!important;
        }
      }

      @media(max-width:380px){
        #profileView .bbb-redesign-hero-row{
          grid-template-columns:54px minmax(0,1fr)!important;
        }
        #profileView .bbb-redesign-team-logo{
          width:54px!important;
          height:54px!important;
        }
        #profileView .bbb-redesign-team-logo img{
          width:40px!important;
          height:40px!important;
        }
        #profileView .profile-title{font-size:27px!important}
        #profileView .bbb-game-table tbody tr,
        #profileView .bbb-v2-career-table tbody tr:not(.bbb-career-drill-row),
        #profileView .bbb-career-drill-table tbody tr{
          padding:8px!important;
          gap:5px!important;
        }
        #profileView .bbb-game-table td,
        #profileView .bbb-v2-career-table tr:not(.bbb-career-drill-row)>td,
        #profileView .bbb-career-drill-table td{
          padding:7px!important;
          font-size:10px!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function apply(){
    if(!isPlayerRoute())return;
    ensureViewport();
    injectStyles();
    annotateAll();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      apply();
    });
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('popstate',schedule);
  window.addEventListener('resize',schedule);
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  apply();
})();
