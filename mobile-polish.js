// Bobby's Big Board Mobile Polish V1.
// Preview-only responsive fixes for fantasy tables, long headings, and Top 500 cards.
(function(){
  if(document.querySelector('#bbb-mobile-polish-v1-styles'))return;
  const style=document.createElement('style');
  style.id='bbb-mobile-polish-v1-styles';
  style.textContent=`
    @media(max-width:640px){
      /* Fluid mobile display type so long names and hero headings do not crowd the viewport. */
      .hero h1,.trade-hero h1{
        font-size:clamp(40px,12.5vw,50px)!important;
        line-height:.94!important;
        max-width:100%;
      }
      #profileView .profile-title{
        font-size:clamp(35px,11.5vw,48px)!important;
        line-height:.96!important;
        max-width:100%;
        overflow-wrap:break-word;
      }

      /* Preserve the useful market disagreement on Top 500 mobile cards. */
      #rankings .rankings-panel tbody tr{
        grid-template-columns:44px minmax(0,1fr) auto;
      }
      #rankings .rank-cell{grid-row:1/4!important}
      #rankings .col-market-rank{
        display:flex!important;
        grid-column:2;
        grid-row:3;
        align-items:center;
        gap:4px;
        color:#879a90!important;
        font-size:9px!important;
        line-height:1.2;
      }
      #rankings .col-market-rank::before{
        content:'MARKET #';
        color:#5f7468;
        font-size:7px;
        font-weight:950;
        letter-spacing:.06em;
      }
      #rankings .col-diff{
        display:flex!important;
        grid-column:3;
        grid-row:3;
        justify-self:end;
        align-items:center;
        gap:4px;
        font-size:9px!important;
        line-height:1.2;
      }
      #rankings .col-diff::before{
        content:'BBB';
        color:#5f7468;
        font-size:7px;
        font-weight:950;
        letter-spacing:.06em;
      }
      #rankings .col-diff .diff{font-size:9px!important}
    }

    @media(max-width:380px){
      .hero h1,.trade-hero h1{font-size:clamp(37px,12vw,44px)!important}
      #profileView .profile-title{font-size:clamp(33px,10.8vw,41px)!important}
    }
  `;
  document.head.appendChild(style);
})();
