/* final-ux.js — anchored links open already positioned (no load-at-top-then-scroll). */
(function () {
  var de = document.documentElement, OFFSET = 84, userMoved = false;
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
  var restoring = nav.type === 'back_forward' || nav.type === 'reload';
  function target() {
    var h = location.hash; if (h.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(h.slice(1))); } catch (e) { return null; }
  }
  function jump(onlyIfFar) {
    var t = target(); if (!t) return;
    var y = Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - OFFSET);
    if (onlyIfFar && Math.abs(y - window.pageYOffset) < 24) return;   // tiny shifts: leave the page still
    window.scrollTo(0, y);
  }
  function show() { de.classList.remove('hash-pending'); }
  function start() { if (!restoring) jump(); show(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // images can shift the layout a little; re-align once, unless the visitor already moved
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true });
  });
  window.addEventListener('load', function () { if (!restoring && !userMoved) jump(true); });
  // links that stay on the same page keep their smooth scroll
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - OFFSET), behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
  });
})();
