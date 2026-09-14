// Final-pass readability overrides for Bobby's Big Board preview.
// Loaded after feature scripts so dynamic UI modules use the same richer emerald + teal palette.
(function(){
  document.querySelector('#bbb-readability-runtime-styles')?.remove();
  const s=document.createElement('style');
  s.id='bbb-readability-runtime-styles';
  s.textContent=`
    :root{
      --bbb-page:#07100e;
      --bbb-panel:#0e1a17;
      --bbb-panel-2:#10201b;
      --bbb-tile:#14231f;
      --bbb-tile-rich:#173128;
      --bbb-table:#11201c;
      --bbb-table-hover:#183129;
      --bbb-line:#285545;
      --bbb-line-soft:#1f4136;
      --bbb-copy:#f7f8f3;
      --bbb-copy-2:#d9e8e1;
      --bbb-label:#9db5ac;
      --bbb-accent:#53e49a;
      --bbb-teal:#4ccfc6;
      --bbb-amber:#e4bd63;
    }

    html,body,#profileView{background:var(--bbb-page)!important}

    /* Outer cards: richer emerald depth without sacrificing contrast. */
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
      background:linear-gradient(180deg,var(--bbb-panel-2),var(--bbb-panel))!important;
      border-color:var(--bbb-line)!important;
      box-shadow:0 16px 44px rgba(0,0,0,.18),inset 0 1px 0 rgba(120,239,179,.04)!important;
    }

    /* Inner tiles: cool emerald/slate so data blocks feel alive, not dusty. */
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
      background:linear-gradient(180deg,#172a24,var(--bbb-tile))!important;
      border-color:var(--bbb-line)!important;
    }

    /* Important rank tiles get a richer green treatment. */
    #profileView .bbb-snapshot-grid>div.primary,
    #profileView .bbb-fantasy-season-main>div:first-child{
      background:linear-gradient(145deg,#19392d,#142820)!important;
      border-color:#3d7b60!important;
      box-shadow:inset 0 0 26px rgba(83,228,154,.035)!important;
    }

    /* Latest take / notes use teal + emerald together. */
    #profileView .bbb-snapshot-take,
    #profileView .profile-note{
      background:linear-gradient(90deg,rgba(76,207,198,.055),#13221e 18%,#11201c)!important;
      border-color:var(--bbb-line-soft)!important;
    }
    #profileView .bbb-snapshot-take{border-left-color:var(--bbb-accent)!important}
    #profileView .profile-note{border-left-color:var(--bbb-teal)!important}

    /* Tabs carry a little color instead of sitting flat gray. */
    #profileView .bbb-tabs-bar,
    #profileView .profile-tabs,
    #profileView .profile-tabbar{
      background:#0b1815!important;
      border-color:var(--bbb-line)!important;
    }
    #profileView .bbb-tabs-btn,
    #profileView .profile-tab,
    #profileView .profile-tabs button,
    #profileView .profile-tabbar button{
      color:#a7bbb3!important;
    }
    #profileView .bbb-tabs-btn:hover,
    #profileView .profile-tab:hover,
    #profileView .profile-tabs button:hover,
    #profileView .profile-tabbar button:hover{
      background:#132720!important;
      color:#f5faf7!important;
    }
    #profileView .bbb-tabs-btn[aria-selected="true"],
    #profileView .profile-tab.active,
    #profileView .profile-tabs button.active,
    #profileView .profile-tabbar button.active{
      background:linear-gradient(135deg,#173b2c,#123a37)!important;
      color:#7cf0b3!important;
      border-color:#4edc96!important;
      box-shadow:inset 0 -2px 0 rgba(76,207,198,.85)!important;
    }

    /* Give secondary labels a cool-teal lean while keeping body copy bright. */
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
    #profileView .bbb-snapshot-grid .movement span,
    #profileView .bbb-career-high span,
    #profileView .bbb-news-date{color:#65d7ce!important}
    .profile-card-kicker,.bbb-fantasy-kicker,.bbb-snapshot-kicker,.kicker,.eyebrow,
    #profileView .bbb-career-block>span{color:var(--bbb-accent)!important}

    /* Tables stay uniform by row while getting richer color and clearer accents. */
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
      color:#e8f0ec!important;
      border-bottom-color:var(--bbb-line-soft)!important;
    }
    table tbody tr:hover td{background:var(--bbb-table-hover)!important}
    #profileView .bbb-v2-career-table .bbb-preview-team-cell{box-shadow:1px 0 0 var(--bbb-line-soft)!important;font-weight:850!important}
    #profileView .bbb-v2-career-table td.ppr,
    #profileView .bbb-game-ppr.boom{color:#79e6ad!important}
    #profileView .bbb-game-rank.top{border-color:#2f8d65!important;background:#15382a!important;color:#78efb3!important}
    table thead th{background:#0e1a17!important;color:#a9beb6!important;border-bottom-color:var(--bbb-line)!important}

    /* Selective info/status color keeps the page energetic without becoming rainbow UI. */
    #profileView .bbb-career-source,
    #profileView .bbb-snapshot-market.market{
      background:#102a29!important;
      border-color:#2e6865!important;
      color:#78ded7!important;
    }
    #profileView .bbb-snapshot-health.watch{color:var(--bbb-amber)!important}

    @media(max-width:640px){
      table tbody tr{background:var(--bbb-table)!important;border-color:var(--bbb-line)!important}
      table tbody td{background:transparent!important}
      #profileView .bbb-fantasy-season-main{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
  `;
  document.head.appendChild(s);
})();
