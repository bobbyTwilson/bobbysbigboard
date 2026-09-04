// Small UI polish for Global Player Search.
// Keep the Ctrl/Cmd+K shortcut active, but remove the visible shortcut badge.

(function(){
  function bbbHideSearchShortcutBadge(){
    document.querySelectorAll('.bbb-global-search-key').forEach(el=>el.remove());
  }

  bbbHideSearchShortcutBadge();
  [0,150,600].forEach(ms=>setTimeout(bbbHideSearchShortcutBadge,ms));
})();
