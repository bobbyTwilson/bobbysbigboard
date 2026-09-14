// Final-pass readability overrides for Bobby's Big Board preview.
// Loaded after the feature scripts so dynamic UI modules use the same palette.
(function(){
  const existing=document.querySelector('#bbb-readability-runtime-styles');
  if(existing)existing.remove();
  const s=document.createElement('style');
  s.id='bbb-readability-runtime-styles';
  s.textContent=`
    :root{
      --bbb-page:#090c0b;
      --bbb-panel:#101512;
      --bbb-tile:#1a211e;
      --bbb-tile-strong:#1d2621;
      --bbb-table:#171d1a;
      --bbb-table-hover:#1e2722;
      --bbb-line:#35483e;
      --bbb-line-soft:#2a3a32;
      --bbb-copy:#f4f7f5;
      --bbb-copy-2:#d7ded9;
      --bbb-label:#aeb9b3;
      --bbb-accent:#59e09a;
    }

    html,body,#profileView{background:var(--bbb-page)!important}

    /* Player Snapshot: make the information tiles visibly lighter than the panel. */
    #profileView .bbb-profile-atglance{
      background:var(--bbb-panel)!important;
      border-color:var(--bbb-line)!important;
    }
    #profileView .bbb-snapshot-grid>div,
    #profileView .bbb-snapshot-grid>div.primary,
    #profileView .bbb-snapshot-grid>div.movement{
      background:var(--bbb-tile)!important;
      border-color:var(--bbb-line)!important;
    }
    #profileView .bbb-snapshot-grid>div.primary{
      background:var(--bbb-tile-strong)!important;
      border-color:#3d6651!important;
    }
    #profileView .bbb-snapshot-grid span,
    #profileView .bbb-snapshot-grid .movement small,
    #profileView .bbb-snapshot-top p{
      color:var(--bbb-label)!important;
    }
    #profileView .bbb-snapshot-grid strong{color:var(--bbb-copy)!important}
    #profileView .bbb-snapshot-grid .primary strong,
    #profileView .bbb-snapshot-grid strong.up,
    #profileView .bbb-snapshot-health.healthy{color:var(--bbb-accent)!important}
    #profileView .bbb-snapshot-take{
      background:#171f1b!important;
      border-top:1px solid var(--bbb-line-soft)!important;
      border-right:1px solid var(--bbb-line-soft)!important;
      border-bottom:1px solid var(--bbb-line-soft)!important;
    }
    #profileView .bbb-snapshot-take p{color:#edf2ef!important}

    /* Current fantasy season: each number lives on the same lighter neutral tile system. */
    #profileView .bbb-fantasy-season-strip{
      background:var(--bbb-panel)!important;
      border-color:var(--bbb-line)!important;
    }
    #profileView .bbb-fantasy-season-main{
      gap:9px!important;
    }
    #profileView .bbb-fantasy-season-main>div{
      background:var(--bbb-tile)!important;
      border:1px solid var(--bbb-line)!important;
      border-radius:10px!important;
      padding:12px 13px!important;
    }
    #profileView .bbb-fantasy-season-main>div:first-child{
      padding-left:13px!important;
      border-left:1px solid var(--bbb-line)!important;
      background:var(--bbb-tile-strong)!important;
    }
    #profileView .bbb-fantasy-season-main span,
    #profileView .bbb-fantasy-statline small,
    #profileView .bbb-preview-production-grid small,
    #profileView .bbb-fantasy-season-head small{
      color:var(--bbb-label)!important;
    }
    #profileView .bbb-fantasy-season-main strong,
    #profileView .bbb-fantasy-statline strong,
    #profileView .bbb-preview-production-grid strong{
      color:var(--bbb-copy)!important;
    }
    #profileView .bbb-fantasy-season-main .rank strong{color:var(--bbb-accent)!important}
    #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span,
    #profileView .bbb-fantasy-statline>span,
    #profileView .bbb-preview-season-fantasy-grid>div,
    #profileView .bbb-preview-season-production-grid>div{
      background:var(--bbb-tile)!important;
      border-color:var(--bbb-line)!important;
    }
    #profileView .bbb-preview-season-summary{
      background:var(--bbb-panel)!important;
      border-color:var(--bbb-line)!important;
    }

    /* Generic cards/tiles across every section use the same neutral hierarchy. */
    .profile-card,.rankings-panel,.market-card,.hero-card,.feature,
    .trade-team-card,.trade-verdict-card,.trade-explainer,
    .bbb-about-card,.watchlist-card,.compare-card,.updates-card,.mover-card,
    .stats-card,.stats-panel,.leader-card{
      background:var(--bbb-panel)!important;
      border-color:var(--bbb-line)!important;
    }
    .detail,.trade-asset,.trade-result,.preview-row,.stat-tile,.stat-card,
    .player-card,.update-card,.watchlist-player-card,.compare-player-card,
    .bbb-preview-season-fantasy-grid>div,.bbb-preview-season-production-grid>div{
      background:var(--bbb-tile)!important;
      border-color:var(--bbb-line)!important;
    }

    /* Tables: one row/cell surface and one readable text tone across the board. */
    table tbody tr{background:transparent!important}
    table tbody td{
      background:var(--bbb-table)!important;
      color:#e8edea!important;
      border-bottom-color:var(--bbb-line-soft)!important;
    }
    table tbody tr:hover td{background:var(--bbb-table-hover)!important}
    table tbody td.muted,
    table tbody td.col-team,
    table tbody td.prospect-class,
    table tbody td.bbb-preview-team-cell,
    table tbody td.bbb-preview-opponent-cell,
    #profileView .bbb-v2-career-table .bbb-preview-team-cell,
    #profileView .bbb-game-table td:nth-child(2){
      color:#e8edea!important;
      background:var(--bbb-table)!important;
    }
    #profileView .bbb-v2-career-table .bbb-preview-season-cell,
    #profileView .bbb-v2-career-table tbody tr:nth-child(even) .bbb-preview-season-cell,
    #profileView .bbb-v2-career-table tbody tr:nth-child(even) .bbb-preview-team-cell,
    #profileView .bbb-v2-career-table td.ppr,
    #profileView .bbb-preview-readable-career-table td,
    #profileView .bbb-preview-readable-game-table td{
      background:var(--bbb-table)!important;
    }
    #profileView .bbb-v2-career-table .bbb-preview-team-cell{
      box-shadow:1px 0 0 var(--bbb-line-soft)!important;
      font-weight:850!important;
    }
    #profileView .bbb-v2-career-table td.ppr,
    #profileView .bbb-game-ppr.boom{color:#79e6ad!important}
    table thead th{
      background:#121714!important;
      color:#b3bdb8!important;
      border-bottom-color:var(--bbb-line)!important;
    }

    /* Reusable labels should not disappear into the background. */
    .profile-card-kicker,.bbb-fantasy-kicker,.bbb-snapshot-kicker,.kicker,.eyebrow{color:var(--bbb-accent)!important}
    .profile-row span,.trade-side-label,.trade-asset-meta,.result-count,
    .bbb-game-footnote,.bbb-game-head p{color:var(--bbb-label)!important}

    @media(max-width:640px){
      table tbody tr{background:var(--bbb-table)!important;border-color:var(--bbb-line)!important}
      table tbody td{background:transparent!important}
      #profileView .bbb-fantasy-season-main{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
  `;
  document.head.appendChild(s);
})();
