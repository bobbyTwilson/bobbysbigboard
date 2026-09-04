// Prevent the hidden player-comparison module from rewriting unrelated URLs.
// The compare screen is initialized on every page so its data is ready quickly,
// but it should only write #compare state while the user is actually on compare.
(function(){
  if(typeof bbbCompareWriteHash!=='function')return;
  const originalBbbCompareWriteHash=bbbCompareWriteHash;
  bbbCompareWriteHash=function(){
    const onCompare=location.hash.startsWith('#compare')&&!location.pathname.startsWith('/player/');
    if(!onCompare)return;
    return originalBbbCompareWriteHash.apply(this,arguments);
  };
})();
