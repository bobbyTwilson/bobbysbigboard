// Bobby's Big Board — My Players V3 UI polish.
// Keeps the existing watchlist data/behavior, but gives watched players a cleaner,
// lighter card hierarchy with less layout work and fewer decorative effects.
(function(){
  if(document.getElementById('bbb-watchlist-v2-styles'))document.getElementById('bbb-watchlist-v2-styles').remove();
  const old=document.getElementById('bbb-watchlist-v3-styles');if(old)old.remove();

  const s=document.createElement('style');
  s.id='bbb-watchlist-v3-styles';
  s.textContent=`
    #watchlistView .bbb-watch-hero{padding:46px 0 30px!important}
    #watchlistView .bbb-watch-hero-grid{align-items:center!important}
    #watchlistView .bbb-watch-copy{max-width:760px!important}
    #watchlistView .bbb-watch-count-card{
      min-width:178px!important;padding:16px 17px!important;
      border-color:#244738!important;background:#09140f!important;
      box-shadow:none!important;
    }
    #watchlistView .bbb-watch-content{padding-top:27px!important}
    #watchlistView .bbb-watch-summary{gap:8px!important;margin-bottom:16px!important}
    #watchlistView .bbb-watch-summary-card{
      min-height:88px;padding:13px!important;border-color:#1c392d!important;
      background:#08110d!important;box-shadow:none!important;
    }
    #watchlistView .bbb-watch-summary-card strong{font-size:25px!important}

    #watchlistView .bbb-watch-toolbar{
      gap:9px!important;margin-bottom:8px!important;padding:9px;
      border:1px solid #193329;border-radius:11px;background:#07100c;
    }
    #watchlistView .bbb-watch-search,
    #watchlistView .bbb-watch-select{min-height:40px!important;border-radius:8px!important}
    #watchlistView .bbb-watch-meta{margin:0 0 11px 1px!important}

    /* Card grid */
    #watchlistView .bbb-watch-table-wrap{overflow:visible!important;border:0!important;background:transparent!important}
    #watchlistView .bbb-watch-table{display:block!important;width:100%!important;min-width:0!important}
    #watchlistView .bbb-watch-table thead{display:none!important}
    #watchlistView .bbb-watch-table tbody{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px!important;
    }
    #watchlistView .bbb-watch-table tbody tr{
      display:grid!important;
      grid-template-columns:28px minmax(0,1fr) auto auto;
      grid-template-areas:
        'star player rank health'
        'metrics metrics metrics metrics'
        'update update update update'
        'actions actions actions actions';
      gap:10px 10px!important;
      align-items:center;min-width:0;padding:15px!important;
      border:1px solid #1a3a2d!important;border-radius:14px!important;
      background:#07110d!important;box-shadow:none!important;
      transition:border-color .12s ease,background-color .12s ease!important;
      cursor:default!important;transform:none!important;
      contain:layout paint;
    }
    #watchlistView .bbb-watch-table tbody tr:hover{
      border-color:#2d6048!important;background:#08150f!important;transform:none!important;
    }
    #watchlistView .bbb-watch-table td,
    #watchlistView .bbb-watch-table td>div{
      min-width:0;background:transparent!important;box-shadow:none!important;
    }
    #watchlistView .bbb-watch-table td{padding:0!important;border:0!important}

    #watchlistView .bbb-watch-star-cell{grid-area:star!important;width:auto!important;align-self:start}
    #watchlistView .bbb-watch-table td:nth-child(2){grid-area:player!important}
    #watchlistView .bbb-watch-table td:nth-child(3){grid-area:rank!important;justify-self:end}
    #watchlistView .bbb-watch-table td:nth-child(4){
      grid-area:metrics!important;display:flex!important;align-items:center!important;
      gap:7px!important;min-height:47px;padding:9px 10px!important;
      border:1px solid #173027!important;border-radius:9px!important;background:#050c08!important;
    }
    #watchlistView .bbb-watch-table td:nth-child(5){
      grid-area:metrics!important;justify-self:end!important;z-index:1;
      display:flex!important;align-items:center!important;
      padding-right:10px!important;pointer-events:none;
    }
    #watchlistView .bbb-watch-table td:nth-child(6){grid-area:health!important;justify-self:end;align-self:start}
    #watchlistView .bbb-watch-table td:nth-child(7){
      grid-area:update!important;margin-top:0;padding:10px 11px!important;
      border:1px solid #152d23!important;border-radius:9px!important;background:#06100b!important;
    }
    #watchlistView .bbb-watch-table td:nth-child(8){grid-area:actions!important}

    #watchlistView .bbb-watch-toggle{
      font-size:20px!important;line-height:1!important;padding:1px!important;color:#63d997!important;
    }
    #watchlistView .bbb-watch-player strong{
      display:block!important;color:#f2f6f3!important;font-size:15px!important;line-height:1.12!important;
      letter-spacing:-.015em!important;
    }
    #watchlistView .bbb-watch-player span{font-size:8.5px!important;margin-top:4px!important;color:#71847a!important}
    #watchlistView .bbb-watch-rank{text-align:right!important}
    #watchlistView .bbb-watch-rank strong{font-size:23px!important;line-height:1!important;color:#69dfa2!important}
    #watchlistView .bbb-watch-rank span{font-size:7px!important;margin-top:4px!important;color:#63776c!important}

    #watchlistView .bbb-watch-trends{display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important}
    #watchlistView .bbb-watch-trend{min-width:56px}
    #watchlistView .bbb-watch-trend small{
      display:block!important;color:#5f7469!important;font-size:6px!important;font-weight:950!important;
      letter-spacing:.07em!important;text-transform:uppercase!important;margin-bottom:3px!important;
    }
    #watchlistView .bbb-watch-move{padding:4px 7px!important;font-size:7.5px!important}

    #watchlistView .bbb-watch-market{
      display:flex!important;align-items:center!important;gap:7px!important;text-align:right!important;
    }
    #watchlistView .bbb-watch-market>div>strong{font-size:10px!important;color:#d8e3dd!important}
    #watchlistView .bbb-watch-market>div>span{font-size:7px!important;margin-top:2px!important}
    #watchlistView .bbb-watch-market-badge{font-size:6px!important;padding:3px 6px!important}

    #watchlistView .bbb-watch-health{
      max-width:120px!important;padding:4px 7px!important;font-size:7px!important;
      text-align:center!important;justify-content:center!important;line-height:1.15!important;
    }

    #watchlistView .bbb-watch-update{max-width:none!important}
    #watchlistView .bbb-watch-update span{
      display:block!important;color:#63d99b!important;font-size:7px!important;
      font-weight:950!important;letter-spacing:.06em!important;text-transform:uppercase!important;margin-bottom:4px!important;
    }
    #watchlistView .bbb-watch-update p{
      margin:0!important;color:#aab9b1!important;font-size:9px!important;line-height:1.5!important;
      display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;
    }

    #watchlistView .bbb-watch-actions{display:flex!important;gap:7px!important}
    #watchlistView .bbb-watch-action{
      flex:0 0 auto!important;min-height:31px!important;padding:0 12px!important;
      border-color:#274638!important;border-radius:8px!important;background:#08120e!important;
      color:#a8b8af!important;font-size:7px!important;
    }
    #watchlistView .bbb-watch-action:hover{border-color:#47ca83!important;color:#fff!important;background:#0b1912!important}

    @media(max-width:1060px){
      #watchlistView .bbb-watch-table tbody{grid-template-columns:1fr!important}
    }
    @media(max-width:760px){
      #watchlistView .bbb-watch-hero{padding:38px 0 27px!important}
      #watchlistView .bbb-watch-hero h1{font-size:48px!important}
      #watchlistView .bbb-watch-copy{font-size:12px!important;line-height:1.6}
      #watchlistView .bbb-watch-count-card{
        width:100%!important;min-width:0!important;display:grid!important;
        grid-template-columns:1fr auto;align-items:center;column-gap:12px;
      }
      #watchlistView .bbb-watch-count-card strong{grid-column:2;grid-row:1/3;font-size:34px!important}
      #watchlistView .bbb-watch-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
      #watchlistView .bbb-watch-summary-card{min-height:80px;padding:11px!important}
      #watchlistView .bbb-watch-toolbar{grid-template-columns:1fr!important;padding:9px!important}
      #watchlistView .bbb-watch-search{grid-column:auto!important}

      #watchlistView .bbb-watch-table tbody tr{
        grid-template-columns:26px minmax(0,1fr) auto!important;
        grid-template-areas:
          'star player rank'
          'health health health'
          'metrics metrics metrics'
          'update update update'
          'actions actions actions'!important;
        gap:8px!important;padding:13px!important;border-radius:12px!important;
      }
      #watchlistView .bbb-watch-table td:nth-child(6){justify-self:start!important}
      #watchlistView .bbb-watch-table td:nth-child(4){
        min-height:44px!important;padding:8px 9px!important;
      }
      #watchlistView .bbb-watch-table td:nth-child(5){padding-right:8px!important}
      #watchlistView .bbb-watch-market{justify-content:flex-end!important}
      #watchlistView .bbb-watch-actions{display:grid!important;grid-template-columns:1fr 1fr!important}
      #watchlistView .bbb-watch-action{width:100%!important;min-height:36px!important}
    }
    @media(max-width:430px){
      #watchlistView .bbb-watch-summary-card:nth-child(1){grid-column:1/-1}
      #watchlistView .bbb-watch-trends{gap:5px!important}
      #watchlistView .bbb-watch-trend{min-width:50px}
      #watchlistView .bbb-watch-market-badge{display:none!important}
      #watchlistView .bbb-watch-update p{-webkit-line-clamp:3!important}
    }
  `;
  document.head.appendChild(s);
})();