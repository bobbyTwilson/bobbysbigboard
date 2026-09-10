// Bobby's Big Board — Mobile Top 500 V2 preview.
// Mobile-only readability pass for the dynasty rankings board. Desktop is untouched.
(function(){
  if(document.getElementById('bbb-rankings-mobile-v2-styles'))return;
  const style=document.createElement('style');
  style.id='bbb-rankings-mobile-v2-styles';
  style.textContent=`
    @media(max-width:640px){
      /* Make the controls feel like one deliberate mobile toolbar. */
      #rankings .rankings-panel{
        border:0!important;
        background:transparent!important;
        overflow:visible!important;
      }
      #rankings .controls{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:9px!important;
        margin-bottom:12px;
        padding:11px!important;
        border:1px solid #193329!important;
        border-radius:14px!important;
        background:#07100c!important;
      }
      #rankings .tabs{
        display:grid!important;
        grid-template-columns:repeat(5,minmax(0,1fr));
        gap:5px!important;
        width:100%;
      }
      #rankings .tab{
        min-width:0!important;
        min-height:39px;
        padding:8px 3px!important;
        border-radius:8px!important;
        font-size:9px!important;
        letter-spacing:.01em;
        white-space:nowrap;
      }
      #rankings .search,
      #rankings .market-filter{
        min-height:44px;
        border-radius:10px!important;
        font-size:12px!important;
      }

      /* Replace the squeezed table with compact, thumb-friendly player cards. */
      #rankings .table-wrap{overflow:visible!important}
      #rankings table{display:block!important;min-width:0!important;width:100%!important}
      #rankings thead{display:none!important}
      #rankings tbody{
        display:grid!important;
        gap:9px!important;
        padding:0!important;
      }
      #rankings tbody tr{
        position:relative;
        display:grid!important;
        grid-template-columns:48px minmax(0,1fr) auto!important;
        grid-template-rows:auto auto auto!important;
        gap:3px 10px!important;
        align-items:center!important;
        min-height:84px;
        padding:13px 12px!important;
        border:1px solid #183329!important;
        border-radius:12px!important;
        background:linear-gradient(145deg,#09120e,#07100c)!important;
        box-shadow:0 8px 22px rgba(0,0,0,.13);
        cursor:pointer;
      }
      #rankings tbody tr:active{
        transform:scale(.995);
        background:#0b1711!important;
      }
      #rankings td{
        min-width:0;
        padding:0!important;
        border:0!important;
        white-space:normal!important;
      }
      #rankings .rank-cell{
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
      #rankings .player-cell{
        grid-column:2!important;
        grid-row:1!important;
        color:#f6f8f6!important;
        font-size:15px!important;
        font-weight:950!important;
        line-height:1.15!important;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      #rankings .col-pos{display:none!important}
      #rankings .col-team{
        display:block!important;
        grid-column:2!important;
        grid-row:2!important;
        color:#82958b!important;
        font-size:10px!important;
        font-weight:800;
        letter-spacing:.02em;
      }
      #rankings .col-age{display:none!important}
      #rankings .col-posrank{
        display:inline-flex!important;
        grid-column:3!important;
        grid-row:1!important;
        justify-self:end;
        align-items:center;
        min-height:25px;
        padding:4px 8px!important;
        border:1px solid #27533f!important;
        border-radius:999px;
        background:#0c2118;
        color:#9fe0bb!important;
        font-size:10px!important;
        font-weight:950!important;
      }
      #rankings .col-view{
        display:flex!important;
        grid-column:3!important;
        grid-row:2!important;
        justify-self:end;
        align-items:center;
      }
      #rankings .col-view .market-badge{
        padding:3px 6px!important;
        font-size:7px!important;
        letter-spacing:.02em;
      }
      #rankings .col-market-rank{
        display:flex!important;
        grid-column:2!important;
        grid-row:3!important;
        align-items:center!important;
        gap:3px!important;
        color:#a1b0a8!important;
        font-size:9px!important;
        line-height:1.2!important;
      }
      #rankings .col-market-rank::before{
        content:'MARKET';
        color:#60766a!important;
        font-size:7px!important;
        font-weight:950!important;
        letter-spacing:.08em!important;
      }
      #rankings .col-market-rank:not(:empty)::after{content:''}
      #rankings .col-diff{
        display:flex!important;
        grid-column:3!important;
        grid-row:3!important;
        justify-self:end!important;
        align-items:center!important;
        gap:4px!important;
        font-size:9px!important;
        line-height:1.2!important;
      }
      #rankings .col-diff::before{
        content:'BBB';
        color:#60766a!important;
        font-size:7px!important;
        font-weight:950!important;
        letter-spacing:.08em!important;
      }
      #rankings .col-diff .diff{font-size:10px!important;font-weight:950!important}

      #rankings .load-row{
        display:flex!important;
        flex-direction:column;
        align-items:stretch!important;
        gap:10px;
        padding:14px 0 0!important;
      }
      #rankings .result-count{text-align:center;font-size:10px!important}
      #rankings .load-more{
        width:100%;
        min-height:44px;
        border-radius:10px!important;
        font-size:11px!important;
      }
    }

    @media(max-width:370px){
      #rankings tbody tr{
        grid-template-columns:43px minmax(0,1fr) auto!important;
        gap:3px 8px!important;
        padding:12px 10px!important;
      }
      #rankings .rank-cell{font-size:21px!important;padding-right:8px!important}
      #rankings .player-cell{font-size:14px!important}
      #rankings .col-posrank{font-size:9px!important;padding:4px 6px!important}
    }
  `;
  document.head.appendChild(style);
})();
