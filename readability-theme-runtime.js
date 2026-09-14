// Final-pass readability overrides for Bobby's Big Board preview.
// Loaded after feature scripts so dynamic UI modules use the same neutral-charcoal palette.
(function(){
  document.querySelector('#bbb-readability-runtime-styles')?.remove();
  const s=document.createElement('style');
  s.id='bbb-readability-runtime-styles';
  s.textContent=`
    :root{
      --bbb-page:#090b0a;
      --bbb-panel:#121413;
      --bbb-tile:#191b1a;
      --bbb-tile-strong:#1d201e;
      --bbb-table:#161817;
      --bbb-table-hover:#1e211f;
      --bbb-line:#304038;
      --bbb-line-soft:#27342e;
      --bbb-copy:#f5f7f6;
      --bbb-copy-2:#d8ddda;
      --bbb-label:#a5aca8;
      --bbb-accent:#59e09a;
    }

    html,body,#profileView{background:var(--bbb-page)!important}

    /* Outer cards: one charcoal panel tone everywhere. */
    #profileView .bbb-profile-atglance,
    #profileView .bbb-fantasy-season-strip,
    #profileView .bbb-preview-season-summary,
    #profileView .profile-card,
    #profileView .bbb-career-card,
    #profileView .bbb-tab-placeholder,
    .profile-card,.rankings-panel,.market-card,.hero-card,.feature,
    .trade-team-card,.trade-verdict-card,.trade-explainer,
    .bbb-about-card,.watchlist-card,.compare-card,.updates-card,.mover-card,
    .stats-card,.stats-panel,.leader-card{
      background:var(--bbb-panel)!important;
      border-color:var(--bbb-line)!important;
    }

    /* Inner tiles: one lighter neutral charcoal across every feature. */
    #profileView .bbb-snapshot-grid>div,
    #profileView .bbb-fantasy-season-main>div,
    #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span,
    #profileView .bbb-fantasy-statline>span,
    #profileView .bbb-preview-season-fantasy-grid>div,
    #profileView .bbb-preview-season-production-grid>div,
    #profileView .bbb-career-glance>div,
    #profileView .bbb-career-statgrid>div,
    #profileView .bbb-career-block,
    #profileView .bbb-career-stop,
    #profileView .bbb-news-item,
    #profileView .bbb-similar-player,
    #profileView .bbb-compact-consensus-grid>div,
    #profileView .bbb-compact-consensus-moves,
    .detail,.trade-asset,.trade-result,.preview-row,.stat-tile,.stat-card,
    .player-card,.update-card,.watchlist-player-card,.compare-player-card{
      background:var(--bbb-tile)!important;
      border-color:var(--bbb-line)!important;
    }

    /* Primary/highlight tiles are slightly brighter, not greener. */
    #profileView .bbb-snapshot-grid>div.primary,
    #profileView .bbb-fantasy-season-main>div:first-child{
      background:var(--bbb-tile-strong)!important;
      border-color:#3c594a!important;
    }

    /* Notes/callouts use the same charcoal family. */
    #profileView .bbb-snapshot-take,
    #profileView .profile-note{
      background:#171a18!important;
      border-color:var(--bbb-line-soft)!important;
    }
    #profileView .bbb-snapshot-take{border-left-color:var(--bbb-accent)!important}

    /* Tabs also stay neutral; green is only the active accent. */
    #profileView .bbb-tabs-bar,
    #profileView .profile-tabs,
    #profileView .profile-tabbar{
      background:#101211!important;
      border-color:var(--bbb-line)!important;
    }
    #profileView .bbb-tabs-btn,
    #profileView .profile-tab,
    #profileView .profile-tabs button,
    #profileView .profile-tabbar button{
      color:#aab1ad!important;
    }
    #profileView .bbb-tabs-btn:hover,
    #profileView .profile-tab:hover,
    #profileView .profile-tabs button:hover,
    #profileView .profile-tabbar button:hover{
      background:#181b19!important;
      color:#f4f7f5!important;
    }
    #profileView .bbb-tabs-btn[aria-selected="true"],
    #profileView .profile-tab.active,
    #profileView .profile-tabs button.active,
    #profileView .profile-tabbar button.active{
      background:#15251d!important;
      color:#74e5a9!important;
      border-color:#42cf86!important;
    }

    /* Labels/copy: neutral grays instead of green-gray. */
    #profileView .bbb-snapshot-grid span,
    #profileView .bbb-snapshot-grid .movement small,
    #profileView .bbb-snapshot-top p,
    #profileView .bbb-fantasy-season-main span,
    #profileView .bbb-fantasy-statline small,
    #profileView .bbb-preview-production-grid small,
    #profileView .bbb-fantasy-season-head small,
    #profileView .bbb-career-glance span,
    #profileView .bbb-career-statgrid span,
    #profileView .bbb-career-glance small,
    #profileView .bbb-career-statgrid small,
    #profileView .bbb-career-head p,
    #profileView .bbb-career-stop small,
    #profileView .bbb-career-high span,
    #profileView .bbb-career-high small,
    #profileView .bbb-news-date,
    #profileView .bbb-news-copy p,
    #profileView .bbb-similar-rank span,
    #profileView .bbb-similar-player p,
    .profile-row span,.trade-side-label,.trade-asset-meta,.result-count,
    .bbb-game-footnote,.bbb-game-head p{
      color:var(--bbb-label)!important;
    }
    #profileView .bbb-snapshot-grid strong,
    #profileView .bbb-fantasy-season-main strong,
    #profileView .bbb-fantasy-statline strong,
    #profileView .bbb-preview-production-grid strong,
    #profileView .bbb-career-glance strong,
    #profileView .bbb-career-statgrid strong,
    #profileView .bbb-career-stop strong,
    #profileView .bbb-career-high strong,
    #profileView .bbb-news-copy strong,
    #profileView .bbb-similar-player h3{
      color:var(--bbb-copy)!important;
    }
    #profileView .bbb-snapshot-grid .primary strong,
    #profileView .bbb-snapshot-grid strong.up,
    #profileView .bbb-snapshot-health.healthy,
    #profileView .bbb-fantasy-season-main .rank strong{color:var(--bbb-accent)!important}
    .profile-card-kicker,.bbb-fantasy-kicker,.bbb-snapshot-kicker,.kicker,.eyebrow,
    #profileView .bbb-career-block>span{color:var(--bbb-accent)!important}

    /* Tables: every cell in a row gets the same surface. */
    table tbody tr{background:transparent!important}
    table tbody td,
    table tbody td.muted,
    table tbody td.col-team,
    table tbody td.prospect-class,
    table tbody td.bbb-preview-team-cell,
    table tbody td.bbb-preview-opponent-cell,
    #profileView .bbb-v2-career-table .bbb-preview-team-cell,
    #profileView .bbb-v2-career-table .bbb-preview-season-cell,
    #profileView .bbb-v2-career-table tbody tr:nth-child(even) .bbb-preview-season-cell,
    #profileView .bbb-v2-career-table tbody tr:nth-child(even) .bbb-preview-team-cell,
    #profileView .bbb-v2-career-table td.ppr,
    #profileView .bbb-preview-readable-career-table td,
    #profileView .bbb-preview-readable-game-table td,
    #profileView .bbb-game-table td:nth-child(2){
      background:var(--bbb-table)!important;
      color:#e8ebe9!important;
      border-bottom-color:var(--bbb-line-soft)!important;
    }
    table tbody tr:hover td{background:var(--bbb-table-hover)!important}
    #profileView .bbb-v2-career-table .bbb-preview-team-cell{box-shadow:1px 0 0 var(--bbb-line-soft)!important;font-weight:850!important}
    #profileView .bbb-v2-career-table td.ppr,
    #profileView .bbb-game-ppr.boom{color:#79e6ad!important}
    table thead th{background:#111312!important;color:#b6bcb9!important;border-bottom-color:var(--bbb-line)!important}

    @media(max-width:640px){
      table tbody tr{background:var(--bbb-table)!important;border-color:var(--bbb-line)!important}
      table tbody td{background:transparent!important}
      #profileView .bbb-fantasy-season-main{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
  `;
  document.head.appendChild(s);
})();
