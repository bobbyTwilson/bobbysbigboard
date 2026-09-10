// Bobby's Big Board — Player Updates V2 preview.
// UI-only pass. Existing update data, filters, routing, and loading logic remain unchanged.
(function(){
  const STYLE_ID='bbb-updates-v2-preview-styles';
  if(document.getElementById(STYLE_ID))return;

  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
    /* Updates page only. Homepage update cards stay unchanged. */
    #updatesView .bbb-updates-hero{
      padding:48px 0 32px!important;
      background:radial-gradient(circle at 78% 8%,rgba(10,143,77,.16),transparent 34%),linear-gradient(180deg,#07100c,#050807)!important;
    }
    #updatesView .bbb-updates-page-head{margin-bottom:0!important}
    #updatesView .bbb-updates-page-head h1{
      font-size:clamp(42px,5.4vw,64px)!important;
      letter-spacing:-.055em!important;
    }
    #updatesView .bbb-updates-page-copy{font-size:12px!important;line-height:1.65}
    #updatesView .bbb-updates-content{padding:38px 0 70px!important}

    /* Make filtering feel like one deliberate toolbar. */
    #updatesView .bbb-update-controls{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(260px,.72fr) 150px!important;
      gap:12px!important;
      align-items:center;
      padding:13px!important;
      margin-bottom:8px!important;
      border:1px solid #1b392d;
      border-radius:14px;
      background:#07100c;
    }
    #updatesView .bbb-update-tabs{
      display:grid!important;
      grid-template-columns:repeat(5,minmax(0,1fr));
      gap:6px!important;
      flex-wrap:nowrap!important;
    }
    #updatesView .bbb-update-tab{
      min-height:40px;
      padding:8px 7px!important;
      border-radius:9px!important;
      font-size:9px!important;
      letter-spacing:.02em;
    }
    #updatesView .bbb-update-search,
    #updatesView .bbb-update-pos{
      min-height:42px;
      border-radius:9px!important;
      font-size:11px!important;
    }
    #updatesView .bbb-update-count{
      margin:13px 2px 12px!important;
      color:#63786d!important;
      font-size:9px!important;
      font-weight:850;
      letter-spacing:.03em;
      text-transform:uppercase;
    }

    /* Editorial feed: player/context | update | date/status. */
    #updatesView .bbb-update-grid{
      display:grid!important;
      grid-template-columns:1fr!important;
      grid-auto-rows:auto!important;
      gap:9px!important;
    }
    #updatesView .bbb-update-card{
      position:relative;
      display:grid!important;
      grid-template-columns:minmax(180px,220px) minmax(0,1fr) minmax(105px,140px)!important;
      grid-template-areas:'player body aside'!important;
      column-gap:22px!important;
      align-items:center!important;
      min-height:112px;
      height:auto!important;
      padding:17px 20px!important;
      overflow:hidden;
      border:1px solid #18342a!important;
      border-left-width:3px!important;
      border-radius:13px!important;
      background:linear-gradient(145deg,#09130f,#070d0a)!important;
      box-shadow:none!important;
      transform:none!important;
    }
    #updatesView .bbb-update-card:hover{
      border-color:#28523f!important;
      background:linear-gradient(145deg,#0b1711,#08100c)!important;
      transform:translateX(2px)!important;
    }
    #updatesView .bbb-update-card:after{
      content:'›';
      position:absolute;
      right:9px;
      top:50%;
      transform:translateY(-50%);
      color:#355647;
      font-size:23px;
      font-weight:500;
      opacity:.65;
    }
    #updatesView .bbb-update-card.bbb-update-v2-injury{border-left-color:#b9912f!important}
    #updatesView .bbb-update-card.bbb-update-v2-performance{border-left-color:#2ab978!important}
    #updatesView .bbb-update-card.bbb-update-v2-role{border-left-color:#4d92c2!important}
    #updatesView .bbb-update-card.bbb-update-v2-roster{border-left-color:#8a67b8!important}
    #updatesView .bbb-update-card.bbb-update-v2-other{border-left-color:#52645a!important}

    #updatesView .bbb-update-player{
      grid-area:player!important;
      display:block!important;
      min-width:0;
      margin:0!important;
      padding-right:5px;
    }
    #updatesView .bbb-update-player h3{
      margin:0!important;
      color:#f7faf8!important;
      font-size:17px!important;
      line-height:1.12!important;
      letter-spacing:-.015em;
    }
    #updatesView .bbb-update-meta{
      margin-top:7px!important;
      color:#74897d!important;
      font-size:9px!important;
      font-weight:850!important;
      line-height:1.35;
    }
    #updatesView .bbb-update-card>p{
      grid-area:body!important;
      align-self:center;
      margin:0!important;
      padding:0 20px!important;
      border-left:1px solid #19352a;
      border-right:1px solid #19352a;
      color:#c4d0ca!important;
      font-size:12px!important;
      line-height:1.65!important;
    }
    #updatesView .bbb-update-top{
      grid-area:aside!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:flex-start!important;
      justify-content:center!important;
      gap:9px!important;
      min-width:0;
      padding-right:11px;
    }
    #updatesView .bbb-update-tags{
      display:flex!important;
      flex-direction:column!important;
      align-items:flex-start!important;
      gap:6px!important;
    }
    #updatesView .bbb-update-type,
    #updatesView .bbb-update-status{
      max-width:100%;
      padding:4px 7px!important;
      border-radius:999px!important;
      font-size:7px!important;
      line-height:1.2;
      white-space:normal;
    }
    #updatesView .bbb-update-date{
      order:-1;
      color:#73867c!important;
      font-size:8px!important;
      font-weight:850;
      letter-spacing:.02em;
    }
    #updatesView .bbb-update-more{
      width:min(360px,100%);
      min-height:43px;
      margin-top:18px!important;
      border-radius:10px!important;
    }

    @media(max-width:900px){
      #updatesView .bbb-update-controls{
        grid-template-columns:1fr 1fr!important;
      }
      #updatesView .bbb-update-tabs{grid-column:1/-1}
      #updatesView .bbb-update-card{
        grid-template-columns:minmax(155px,190px) minmax(0,1fr) 105px!important;
        column-gap:15px!important;
        padding:15px 17px!important;
      }
      #updatesView .bbb-update-card>p{padding:0 14px!important}
    }

    @media(max-width:640px){
      #updatesView .bbb-updates-hero{padding:35px 0 27px!important}
      #updatesView .bbb-updates-page-head{gap:12px!important}
      #updatesView .bbb-updates-page-head h1{font-size:42px!important}
      #updatesView .bbb-updates-page-copy{font-size:11px!important}
      #updatesView .bbb-updates-content{padding:28px 0 50px!important}

      #updatesView .bbb-update-controls{
        grid-template-columns:1fr!important;
        gap:9px!important;
        padding:10px!important;
        border-radius:12px;
      }
      #updatesView .bbb-update-tabs{
        grid-column:auto;
        grid-template-columns:repeat(5,minmax(0,1fr));
        gap:4px!important;
      }
      #updatesView .bbb-update-tab{
        min-height:37px;
        padding:6px 2px!important;
        font-size:8px!important;
      }
      #updatesView .bbb-update-search,
      #updatesView .bbb-update-pos{min-height:44px;font-size:11px!important}

      #updatesView .bbb-update-grid{gap:8px!important}
      #updatesView .bbb-update-card{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) auto!important;
        grid-template-areas:'player aside' 'body body'!important;
        gap:10px 12px!important;
        min-height:0;
        padding:14px!important;
        border-left-width:3px!important;
        border-radius:12px!important;
      }
      #updatesView .bbb-update-card:hover{transform:none!important}
      #updatesView .bbb-update-card:after{display:none}
      #updatesView .bbb-update-player{padding:0!important}
      #updatesView .bbb-update-player h3{font-size:16px!important}
      #updatesView .bbb-update-meta{margin-top:5px!important;font-size:8px!important}
      #updatesView .bbb-update-top{
        align-items:flex-end!important;
        padding:0!important;
        gap:6px!important;
      }
      #updatesView .bbb-update-tags{align-items:flex-end!important}
      #updatesView .bbb-update-date{text-align:right;font-size:7px!important}
      #updatesView .bbb-update-card>p{
        margin-top:2px!important;
        padding:11px 0 0!important;
        border:0!important;
        border-top:1px solid #183229!important;
        font-size:11px!important;
        line-height:1.62!important;
      }
      #updatesView .bbb-update-status{max-width:125px;text-align:right}
      #updatesView .bbb-update-count{margin:10px 2px!important;font-size:8px!important}
    }

    @media(max-width:380px){
      #updatesView .bbb-update-tab{font-size:7px!important}
      #updatesView .bbb-update-card{grid-template-columns:minmax(0,1fr) 104px!important}
    }
  `;
  document.head.appendChild(s);

  function classify(card){
    if(!card)return;
    card.classList.remove('bbb-update-v2-injury','bbb-update-v2-performance','bbb-update-v2-role','bbb-update-v2-roster','bbb-update-v2-other');
    const type=card.querySelector('.bbb-update-type');
    const cls=type?.classList.contains('injury')?'injury':
      type?.classList.contains('performance')?'performance':
      type?.classList.contains('role')?'role':
      type?.classList.contains('roster')?'roster':'other';
    card.classList.add('bbb-update-v2-'+cls);
  }

  function enhance(){
    const view=document.getElementById('updatesView');
    if(!view)return false;
    view.querySelectorAll('.bbb-update-card').forEach(classify);
    return true;
  }

  function init(){
    if(!enhance())return;
    const grid=document.getElementById('bbbUpdateGrid');
    if(grid)new MutationObserver(enhance).observe(grid,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  else setTimeout(init,0);
})();
