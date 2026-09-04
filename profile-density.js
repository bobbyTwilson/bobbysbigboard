// Bobby's Big Board profile density polish.
// Keeps every research section, but prioritizes current context and reduces vertical weight.

(function(){
  function bbbProfileDensityInjectStyles(){
    if(document.querySelector('#bbb-profile-density-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-profile-density-styles';
    s.textContent=`
      #profileView .profile-hero{padding:44px 0 30px}
      #profileView .profile-content{padding:46px 0 58px}
      #profileView .profile-grid{gap:12px}
      #profileView .profile-card{padding:20px}
      #profileView .profile-card h2{margin-top:7px;margin-bottom:18px}
      #profileView .bbb-overview-card .profile-note{margin-top:0;padding:13px 14px}
      #profileView .bbb-v2-updates-card .bbb-v2-card-head,
      #profileView .bbb-v2-trend-card .bbb-v2-card-head,
      #profileView .bbb-v2-career-card .bbb-v2-card-head{margin-bottom:14px}
      #profileView .bbb-v2-timeline-body{padding-bottom:14px}
      #profileView .bbb-v2-career-empty{padding:14px 16px}
      #profileView .bbb-ranking-card .bbb-rank-summary{margin-bottom:14px}
      #profileView .bbb-ranking-card .bbb-rank-chart-wrap{margin-bottom:14px}
      #profileView .bbb-profile-deep-research{margin-top:2px}
      @media(max-width:560px){
        #profileView .profile-hero{padding:30px 0 24px}
        #profileView .profile-content{padding:32px 0 46px}
        #profileView .profile-grid{gap:9px}
        #profileView .profile-card{padding:16px}
        #profileView .profile-card h2{font-size:25px;margin-bottom:14px}
        #profileView .bbb-profile-atglance{margin-top:15px}
      }
    `;
    document.head.appendChild(s);
  }

  function bbbProfileDensityArrange(){
    const grid=document.querySelector('#profileMount .profile-grid');
    if(!grid)return;

    const overview=grid.querySelector('.bbb-overview-card');
    const timeline=grid.querySelector('.bbb-v2-updates-card');
    const trend=grid.querySelector('.bbb-v2-trend-card');
    const ranking=grid.querySelector('.bbb-ranking-card');
    const gameLog=grid.querySelector('.bbb-fantasy-gamelog-card');
    const career=grid.querySelector('.bbb-v2-career-card');
    const prioritized=[overview,timeline,trend,ranking,gameLog,career].filter(Boolean);
    const prioritizedSet=new Set(prioritized);
    const remaining=[...grid.children].filter(el=>el.classList?.contains('profile-card')&&!prioritizedSet.has(el));

    prioritized.forEach((el,index)=>{
      el.classList.toggle('bbb-profile-deep-research',index>=2);
      grid.appendChild(el);
    });
    remaining.forEach(el=>{
      el.classList.add('bbb-profile-deep-research');
      grid.appendChild(el);
    });
  }

  function bbbProfileDensityFix(){
    bbbProfileDensityArrange();
    requestAnimationFrame(bbbProfileDensityArrange);
  }

  function bbbProfileDensityInit(){
    bbbProfileDensityInjectStyles();
    bbbProfileDensityFix();
  }

  if(typeof profileRender==='function'){
    const baseProfileRender=profileRender;
    profileRender=async function(slug){
      const result=await baseProfileRender(slug);
      bbbProfileDensityFix();
      setTimeout(bbbProfileDensityArrange,120);
      setTimeout(bbbProfileDensityArrange,500);
      return result;
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbProfileDensityInit);else bbbProfileDensityInit();
})();
