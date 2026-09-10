// Bobby's Big Board — My Players / Watchlist V2 preview.
// UI-only dashboard pass. Saved players, sorting, filtering, profile links and local storage behavior are unchanged.
(function(){
  if(document.getElementById('bbb-watchlist-v2-styles'))return;
  const s=document.createElement('style');
  s.id='bbb-watchlist-v2-styles';
  s.textContent=`
    /* Keep the existing feature/data model, but make My Players read like a dashboard instead of a wide spreadsheet. */
    #watchlistView .bbb-watch-hero{padding:48px 0 32px!important}
    #watchlistView .bbb-watch-hero-grid{align-items:center!important}
    #watchlistView .bbb-watch-copy{max-width:760px!important}
    #watchlistView .bbb-watch-count-card{
      min-width:185px!important;
      padding:17px 18px!important;
      border-color:#244738!important;
      background:linear-gradient(145deg,#0b1812,#08100c)!important;
    }
    #watchlistView .bbb-watch-content{padding-top:28px!important}

    #watchlistView .bbb-watch-summary{gap:9px!important;margin-bottom:18px!important}
    #watchlistView .bbb-watch-summary-card{
      min-height:92px;
      padding:14px!important;
      border-color:#1c392d!important;
      background:linear-gradient(150deg,#09140f,#07100c)!important;
    }
    #watchlistView .bbb-watch-summary-card strong{font-size:27px!important}

    #watchlistView .bbb-watch-toolbar{
      gap:10px!important;
      margin-bottom:9px!important;
      padding:10px;
      border:1px solid #193329;
      border-radius:12px;
      background:#07100c;
    }
    #watchlistView .bbb-watch-search,
    #watchlistView .bbb-watch-select{min-height:42px!important;border-radius:9px!important}
    #watchlistView .bbb-watch-meta{margin:0 0 11px 2px!important}

    /* Desktop / tablet watched-player cards. */
    #watchlistView .bbb-watch-table-wrap{overflow:visible!important;border:0!important;background:transparent!important}
    #watchlistView .bbb-watch-table{display:block!important;width:100%!important;min-width:0!important}
    #watchlistView .bbb-watch-table thead{display:none!important}
    #watchlistView .bbb-watch-table tbody{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:11px!important;
    }
    #watchlistView .bbb-watch-table tbody tr{
      display:grid!important;
      grid-template-columns:32px minmax(135px,1fr) 88px 145px;
      grid-template-areas:
        'star player rank health'
        'star trends market health'
        'update update update update'
        'actions actions actions actions';
      gap:7px 10px!important;
      align-items:center;
      min-width:0;
      padding:15px!important;
      border:1px solid #19362a!important;
      border-radius:14px!important;
      background:linear-gradient(145deg,#09130f,#07100c)!important;
      transition:border-color .14s ease,background .14s ease,transform .14s ease!important;
      cursor:default!important;
    }
    #watchlistView .bbb-watch-table tbody tr:hover{
      border-color:#28513e!important;
      background:linear-gradient(145deg,#0a1711,#08120e)!important;
      transform:translateY(-1px);
    }
    #watchlistView .bbb-watch-table td{min-width:0;padding:0!important;border:0!important}
    #watchlistView .bbb-watch-star-cell{grid-area:star!important;align-self:start;width:auto!important}
    #watchlistView .bbb-watch-table td:nth-child(2){grid-area:player!important}
    #watchlistView .bbb-watch-table td:nth-child(3){grid-area:rank!important;justify-self:end}
    #watchlistView .bbb-watch-table td:nth-child(4){grid-area:trends!important}
    #watchlistView .bbb-watch-table td:nth-child(5){grid-area:market!important;justify-self:end}
    #watchlistView .bbb-watch-table td:nth-child(6){grid-area:health!important;justify-self:end;align-self:start}
    #watchlistView .bbb-watch-table td:nth-child(7){grid-area:update!important;margin-top:5px;padding-top:11px!important;border-top:1px solid #173027!important}
    #watchlistView .bbb-watch-table td:nth-child(8){grid-area:actions!important;margin-top:2px}

    #watchlistView .bbb-watch-toggle{font-size:20px!important;padding:1px!important}
    #watchlistView .bbb-watch-player strong{font-size:15px!important;line-height:1.15}
    #watchlistView .bbb-watch-player span{font-size:9px!important;margin-top:5px!important}
    #watchlistView .bbb-watch-rank{text-align:right}
    #watchlistView .bbb-watch-rank strong{font-size:21px!important;line-height:1;color:#68dda0!important}
    #watchlistView .bbb-watch-rank span{font-size:8px!important}
    #watchlistView .bbb-watch-trends{gap:6px!important;flex-wrap:wrap}
    #watchlistView .bbb-watch-market{justify-content:flex-end!important;gap:7px!important;text-align:right}
    #watchlistView .bbb-watch-market>div>strong{font-size:11px}
    #watchlistView .bbb-watch-health{max-width:145px!important;text-align:center;justify-content:center}
    #watchlistView .bbb-watch-update{max-width:none!important}
    #watchlistView .bbb-watch-update span{font-size:8px!important;letter-spacing:.05em}
    #watchlistView .bbb-watch-update p{
      font-size:10px!important;
      line-height:1.55!important;
      -webkit-line-clamp:3!important;
    }
    #watchlistView .bbb-watch-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:7px!important}
    #watchlistView .bbb-watch-action{min-height:34px!important;border-radius:8px!important}

    @media(max-width:1060px){
      #watchlistView .bbb-watch-table tbody{grid-template-columns:1fr!important}
      #watchlistView .bbb-watch-table tbody tr{grid-template-columns:32px minmax(180px,1fr) 95px minmax(150px,.7fr)}
    }

    @media(max-width:760px){
      #watchlistView .bbb-watch-hero{padding:38px 0 28px!important}
      #watchlistView .bbb-watch-hero h1{font-size:48px!important}
      #watchlistView .bbb-watch-copy{font-size:12px!important;line-height:1.6}
      #watchlistView .bbb-watch-count-card{width:100%!important;min-width:0!important;display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:12px}
      #watchlistView .bbb-watch-count-card strong{grid-column:2;grid-row:1/3;font-size:34px!important}
      #watchlistView .bbb-watch-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
      #watchlistView .bbb-watch-summary-card{min-height:82px;padding:11px!important}
      #watchlistView .bbb-watch-summary-card strong{font-size:23px!important}
      #watchlistView .bbb-watch-toolbar{grid-template-columns:1fr!important;padding:10px!important}
      #watchlistView .bbb-watch-search{grid-column:auto!important}

      #watchlistView .bbb-watch-table tbody{gap:9px!important}
      #watchlistView .bbb-watch-table tbody tr{
        grid-template-columns:28px minmax(0,1fr) auto!important;
        grid-template-areas:
          'star player rank'
          'star trends trends'
          'market market market'
          'health health health'
          'update update update'
          'actions actions actions'!important;
        gap:8px 9px!important;
        padding:13px!important;
        border-radius:13px!important;
      }
      #watchlistView .bbb-watch-table td:nth-child(5){justify-self:stretch!important;margin-top:2px;padding-top:9px!important;border-top:1px solid #173027!important}
      #watchlistView .bbb-watch-table td:nth-child(6){justify-self:start!important;align-self:auto!important}
      #watchlistView .bbb-watch-market{justify-content:space-between!important;text-align:left!important}
      #watchlistView .bbb-watch-health{max-width:100%!important;text-align:left;justify-content:flex-start}
      #watchlistView .bbb-watch-table td:nth-child(7){margin-top:0!important;padding-top:10px!important}
      #watchlistView .bbb-watch-update p{-webkit-line-clamp:3!important;font-size:10px!important}
      #watchlistView .bbb-watch-actions{grid-template-columns:1fr 1fr!important}
      #watchlistView .bbb-watch-action{min-height:40px!important;font-size:9px!important}
    }

    @media(max-width:430px){
      #watchlistView .bbb-watch-summary-card:nth-child(1){grid-column:1/-1}
      #watchlistView .bbb-watch-summary-card:nth-child(1){display:grid;grid-template-columns:1fr auto;align-items:center}
      #watchlistView .bbb-watch-summary-card:nth-child(1) strong{grid-column:2;grid-row:1/3}
      #watchlistView .bbb-watch-trends{gap:5px!important}
      #watchlistView .bbb-watch-move{padding:4px 6px!important}
    }
  `;
  document.head.appendChild(s);
})();
