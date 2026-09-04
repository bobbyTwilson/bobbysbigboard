// Preview-only data router for the full NFLverse weekly-history backfill.
// This file exists only on the preview/full-weekly-history-v1 branch.
// It redirects weekly profile reads to the isolated staging view so production
// continues using site_player_weekly_stats until the historical backfill is approved.

(function(){
  if(typeof bbbDb!=='function'||bbbDb.__bbbWeeklyHistoryPreview)return;
  const original=bbbDb;
  const wrapped=function(table,query,...rest){
    const target=table==='site_player_weekly_stats'
      ?'site_player_weekly_stats_preview'
      :table;
    return original(target,query,...rest);
  };
  wrapped.__bbbWeeklyHistoryPreview=true;
  wrapped.__bbbWeeklyHistoryOriginal=original;
  bbbDb=wrapped;
})();
