// Bobby's Big Board — Homepage Polish V1 (preview branch)
// Keeps the existing homepage identity and hierarchy, with restrained density/readability changes
// plus a simple Latest YouTube feature module.
(function(){
  const STYLE_ID='bbb-home-polish-v1-styles';
  const VIDEO_ID='2VnGpxjjSvk';
  const CHANNEL_URL='https://www.youtube.com/@bobbysbigboard';
  const VIDEO_URL=`https://www.youtube.com/watch?v=${VIDEO_ID}`;

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* Preserve BBB, just tighten the homepage. */
      #rankingsView>.hero{padding:48px 0 42px;background:radial-gradient(circle at 78% 18%,rgba(10,143,77,.19),transparent 36%),linear-gradient(180deg,#07100c,#050807)}
      #rankingsView>.hero .hero-inner{gap:38px;grid-template-columns:minmax(0,1.18fr) minmax(300px,.72fr)}
      #rankingsView>.hero h1{font-size:clamp(48px,6vw,72px);margin:13px 0 16px}
      #rankingsView>.hero .hero-copy{font-size:16px;max-width:650px;line-height:1.6}
      #rankingsView>.hero .hero-actions{margin-top:23px}
      #rankingsView>.hero .hero-card{padding:18px;border-radius:15px}
      #rankingsView>.hero .preview-row{padding:8px 10px}
      #rankingsView>.metrics{padding:10px 0;background:#060c09}
      #rankingsView>.metrics .metric{padding:12px 17px}
      #rankingsView>.metrics .metric strong{font-size:20px}
      #rankingsView>.section{padding-top:54px;padding-bottom:54px}
      #rankingsView .section-head{margin-bottom:20px}
      #rankingsView .section h2{font-size:clamp(29px,3.8vw,43px)}
      #rankingsView .section-sub{font-size:13px;line-height:1.65}
      #rankingsView .rankings-panel,#rankingsView .market-card,#rankingsView .feature{box-shadow:none}

      #bbbLatestVideo{padding:10px 0 54px}
      #bbbLatestVideo .bbb-video-shell{width:min(1180px,calc(100% - 32px));margin:auto}
      #bbbLatestVideo .bbb-video-card{display:grid;grid-template-columns:minmax(300px,.86fr) minmax(0,1.14fr);overflow:hidden;border:1px solid #1b3a2d;background:linear-gradient(145deg,#07130e,#050b08);border-radius:16px}
      #bbbLatestVideo .bbb-video-thumb{display:block;position:relative;min-height:230px;background:#08110d;overflow:hidden}
      #bbbLatestVideo .bbb-video-thumb img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;display:block;filter:saturate(.9) brightness(.82)}
      #bbbLatestVideo .bbb-video-thumb:after{content:'▶';position:absolute;left:20px;bottom:18px;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#0a8f4d;color:#fff;font-size:17px;font-weight:950;box-shadow:0 8px 28px rgba(0,0,0,.34)}
      #bbbLatestVideo .bbb-video-copy{padding:28px 31px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
      #bbbLatestVideo .bbb-video-kicker{color:#50ce8e;font-size:9px;font-weight:950;letter-spacing:.15em;text-transform:uppercase}
      #bbbLatestVideo h2{margin:8px 0 10px;font-size:30px;line-height:1.05;letter-spacing:-.035em}
      #bbbLatestVideo p{max-width:590px;margin:0 0 18px;color:#8fa198;font-size:12px;line-height:1.7}
      #bbbLatestVideo .bbb-video-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
      #bbbLatestVideo .bbb-video-channel{color:#80938a;font-size:10px;font-weight:850;padding:8px 2px}
      #bbbLatestVideo .bbb-video-channel:hover{color:#dce7e1}

      @media(max-width:950px){
        #rankingsView>.hero .hero-inner{grid-template-columns:1fr;gap:26px}
        #rankingsView>.hero .hero-card{max-width:none}
        #bbbLatestVideo .bbb-video-card{grid-template-columns:minmax(270px,.85fr) minmax(0,1.15fr)}
      }
      @media(max-width:720px){
        #rankingsView>.hero{padding:34px 0 31px}
        #rankingsView>.hero h1{font-size:44px}
        #rankingsView>.hero .hero-copy{font-size:14px}
        #rankingsView>.section{padding-top:44px;padding-bottom:44px}
        #bbbLatestVideo{padding:4px 0 44px}
        #bbbLatestVideo .bbb-video-shell{width:min(100% - 20px,1180px)}
        #bbbLatestVideo .bbb-video-card{grid-template-columns:1fr}
        #bbbLatestVideo .bbb-video-thumb{min-height:205px}
        #bbbLatestVideo .bbb-video-copy{padding:20px}
        #bbbLatestVideo h2{font-size:24px}
      }
    `;
    document.head.appendChild(s);
  }

  function makeVideoSection(){
    if(document.getElementById('bbbLatestVideo'))return document.getElementById('bbbLatestVideo');
    const section=document.createElement('section');
    section.id='bbbLatestVideo';
    section.innerHTML=`
      <div class="bbb-video-shell">
        <article class="bbb-video-card">
          <a class="bbb-video-thumb" href="${VIDEO_URL}" target="_blank" rel="noopener" aria-label="Watch the latest Bobby's Big Board video on YouTube">
            <img src="https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg" alt="Latest Bobby's Big Board YouTube video thumbnail" loading="lazy">
          </a>
          <div class="bbb-video-copy">
            <div class="bbb-video-kicker">Latest from Bobby's Big Board</div>
            <h2>Watch the newest breakdown.</h2>
            <p>Film, dynasty rankings and prospect takes from the same process behind the board — without turning the homepage into a content feed.</p>
            <div class="bbb-video-actions">
              <a class="btn btn-primary" href="${VIDEO_URL}" target="_blank" rel="noopener">Watch Latest Video ↗</a>
              <a class="bbb-video-channel" href="${CHANNEL_URL}" target="_blank" rel="noopener">View YouTube Channel →</a>
            </div>
          </div>
        </article>
      </div>`;
    return section;
  }

  function placeVideo(){
    const view=document.getElementById('rankingsView');
    if(!view)return;
    const section=makeVideoSection();
    const movers=view.querySelector(':scope > #bbbMoversHome');
    const market=view.querySelector(':scope > #market');
    if(movers)movers.insertAdjacentElement('afterend',section);
    else if(market)view.insertBefore(section,market);
    else view.appendChild(section);
  }

  function init(){
    injectStyles();
    placeVideo();
    [120,400,900,1700].forEach(ms=>setTimeout(placeVideo,ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
