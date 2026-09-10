// Bobby's Big Board — Site UX Cleanup V1 preview.
// Presentation/accessibility polish only. No ranking, data, routing, or feature logic changes.
(function(){
  const STYLE_ID='bbb-site-ux-cleanup-v1-styles';
  let stateScanQueued=false;

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      :root{--bbb-ux-focus:#61dfa0;--bbb-ux-line:#234636;--bbb-ux-line-2:#2e6149;--bbb-ux-soft:#07130e;--bbb-ux-muted:#7f9489}

      :where(a,button,input,select,textarea,[tabindex]):focus-visible{
        outline:2px solid var(--bbb-ux-focus)!important;
        outline-offset:2px!important;
        box-shadow:0 0 0 4px rgba(97,223,160,.08)!important;
      }
      :where(button,a,.tab,.load-more,.nav-cta,.preview-row,tr[data-player],.bbb-search-result,.bbb-similar-player,.bbb-similar-v2-card,.bbb-watch-v2-card){
        -webkit-tap-highlight-color:transparent;
      }
      :where(button,.tab,.load-more,.nav-cta,.preview-row,tr[data-player],.bbb-search-result,.bbb-similar-player,.bbb-similar-v2-card,.bbb-watch-v2-card){
        transition:border-color .14s ease,background-color .14s ease,color .14s ease,transform .14s ease,opacity .14s ease!important;
      }
      :where(button,.load-more,.nav-cta):disabled{opacity:.45!important;cursor:not-allowed!important;transform:none!important}

      tr[data-player]{cursor:pointer}
      @media(hover:hover){
        tr[data-player]:hover{background:rgba(53,204,128,.035)}
        .preview-row:hover{background:rgba(53,204,128,.045)}
      }

      .table-wrap,.bbb-tabs-bar,.tabs{
        scrollbar-width:thin;
        scrollbar-color:#28513f transparent;
      }
      .table-wrap::-webkit-scrollbar,.bbb-tabs-bar::-webkit-scrollbar,.tabs::-webkit-scrollbar{height:7px;width:7px}
      .table-wrap::-webkit-scrollbar-thumb,.bbb-tabs-bar::-webkit-scrollbar-thumb,.tabs::-webkit-scrollbar-thumb{background:#28513f;border-radius:999px}
      .table-wrap::-webkit-scrollbar-track,.bbb-tabs-bar::-webkit-scrollbar-track,.tabs::-webkit-scrollbar-track{background:transparent}
      .table-wrap{overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}

      .bbb-ux-state-label{
        display:inline-flex;align-items:center;gap:5px;margin-bottom:7px;color:#65dca0;
        font-size:7px;font-weight:950;letter-spacing:.11em;text-transform:uppercase
      }
      .bbb-ux-state-label:before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.85}
      .bbb-ux-error .bbb-ux-state-label{color:#e3a36f}
      .bbb-ux-loading .bbb-ux-state-label:before{animation:bbbUxPulse 1.15s ease-in-out infinite}
      @keyframes bbbUxPulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}

      td.empty.bbb-ux-empty,td.empty.bbb-ux-error,td.empty.bbb-ux-loading{
        padding:32px 18px!important;text-align:center!important;color:#7f9489!important;line-height:1.55
      }
      .trade-assets .empty.bbb-ux-empty,
      #previewRows .empty.bbb-ux-empty,
      #previewRows .empty.bbb-ux-error,
      #previewRows .empty.bbb-ux-loading{
        border:1px dashed #1d4231;border-radius:10px;background:#06100b;padding:19px!important;color:#81958a!important
      }
      #previewRows .empty.bbb-ux-loading{min-height:70px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
      .bbb-search-empty,.bbb-tab-placeholder,.bbb-compare-wait{
        border-color:#1f4332!important;background:linear-gradient(145deg,#07130e,#050b08)!important
      }

      #profileView .profile-card,
      .rankings-panel,
      .trade-team-card,
      .trade-verdict-card,
      .bbb-watch-v2-card,
      .bbb-similar-v2-card,
      .bbb-search-result{
        backface-visibility:hidden;
      }

      [id$='ResultCount'],.result-count{font-variant-numeric:tabular-nums}
      .rank-cell,.rank,.bbb-watch-v2-rank,.bbb-similar-v2-rank{font-variant-numeric:tabular-nums}

      section[id],article[id],[data-tab-panel]{scroll-margin-top:88px}

      @media(max-width:640px){
        :where(.controls input,.controls select,.search,.market-filter,.load-more){min-height:44px!important}
        .table-wrap{max-width:100%;overflow-x:auto!important}
        .tabs{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
        td.empty.bbb-ux-empty,td.empty.bbb-ux-error,td.empty.bbb-ux-loading{padding:25px 12px!important}
        section[id],article[id],[data-tab-panel]{scroll-margin-top:72px}
      }

      @media(prefers-reduced-motion:reduce){
        *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
      }
    `;
    document.head.appendChild(s);
  }

  function labelFor(text){
    const t=String(text||'').trim().toLowerCase();
    if(!t)return null;
    if(t.includes('loading'))return ['loading','Loading'];
    if(t.includes('database unavailable')||t.includes('failed')||t.includes('error'))return ['error','Unavailable'];
    if(t.includes('add up to eight assets'))return ['empty','Empty side'];
    if(t.includes('no players')||t.includes('no rookies')||t.includes('no prospects')||t.includes('no matches')||t.includes('no recent')||t.includes('no nearby comps')||t.includes('no players found'))return ['empty','No results'];
    return null;
  }

  function decorateState(el){
    if(!el||el.dataset.bbbUxState==='1')return;
    const found=labelFor(el.textContent);
    if(!found)return;
    const [kind,label]=found;
    el.dataset.bbbUxState='1';
    el.classList.add(`bbb-ux-${kind}`);
    if(el.tagName==='TD'){
      const table=el.closest('table');
      const count=table?.querySelectorAll('thead th').length||0;
      if(count>1)el.colSpan=count;
    }
    if(!el.querySelector(':scope > .bbb-ux-state-label')){
      const badge=document.createElement('span');
      badge.className='bbb-ux-state-label';
      badge.textContent=label;
      el.prepend(badge);
    }
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
  }

  function makeRowsKeyboardAccessible(){
    document.querySelectorAll('tr[data-player]').forEach(row=>{
      if(row.dataset.bbbUxKeyboard==='1')return;
      row.dataset.bbbUxKeyboard='1';
      if(!row.hasAttribute('tabindex'))row.tabIndex=0;
      if(!row.hasAttribute('role'))row.setAttribute('role','link');
      row.addEventListener('keydown',e=>{
        if((e.key==='Enter'||e.key===' ')&&!e.target.closest('a,button,input,select,textarea')){
          e.preventDefault();row.click();
        }
      });
    });
  }

  function scan(){
    stateScanQueued=false;
    document.querySelectorAll('.empty,.bbb-search-empty,.bbb-tab-placeholder,.bbb-compare-wait').forEach(decorateState);
    makeRowsKeyboardAccessible();
  }
  function queueScan(){
    if(stateScanQueued)return;
    stateScanQueued=true;
    requestAnimationFrame(scan);
  }
  function init(){
    ensureStyles();scan();
    new MutationObserver(queueScan).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
