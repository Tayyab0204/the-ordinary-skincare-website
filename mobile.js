/* mobile.js — builds the phone menu (hamburger) from the existing nav links, and tells the CSS when the visitor has scrolled past the home hero.
   Works on every page, including product pages where the nav is created by product-bridge.js a moment after load. */
(function () {
  'use strict';

  function buildMenu() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return false;
    var links = nav.querySelector('.site-links');
    if (!links) return false;
    if (nav.querySelector('.site-menu-btn')) return true;
    var anchors = [].slice.call(links.querySelectorAll('a'));
    if (!anchors.length) return false;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-menu-btn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'site-menu-panel');
    btn.innerHTML = '<span></span><span></span>';
    links.appendChild(btn);   /* order on phones: search, bag, menu toggle */

    var panel = document.createElement('nav');
    panel.id = 'site-menu-panel';
    panel.className = 'site-menu-panel';
    panel.setAttribute('aria-label', 'Menu');
    anchors.forEach(function (a) {
      var c = document.createElement('a');
      c.href = a.getAttribute('href');
      c.textContent = a.textContent.trim();
      if (a.classList.contains('is-current')) c.setAttribute('aria-current', 'page');
      panel.appendChild(c);
    });
    nav.appendChild(panel);

    function set(open) {
      nav.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      set(!nav.classList.contains('menu-open'));
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    var bag = links.querySelector('.site-bag');
    if (bag) bag.addEventListener('click', function () { set(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 700) set(false); });
    return true;
  }

  var tries = 0;
  (function wait() {
    if (!buildMenu() && tries++ < 50) setTimeout(wait, 100);
  })();

  /* keep the chosen tab visible in the swipeable tab row */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.nu-tab');
    if (t && t.scrollIntoView) setTimeout(function () { t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, 30);
  });

  /* home page only: the floating offer tab waits until the hero has scrolled away */
  var root = document.documentElement;
  if (document.querySelector('.hero')) {
    root.classList.add('has-hero');
    var check = function () {
      var past = window.scrollY > window.innerHeight * 0.6;
      root.classList.toggle('past-hero', past);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }
})();
