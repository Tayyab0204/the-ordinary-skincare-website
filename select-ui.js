/* select-ui.js — turns <select> fields inside .ct-f into a styled dropdown (icon + title + hint per option) on every device.
   The real <select> stays in the form (hidden), so submitting, validation and scripts keep working.
   Optional per-option attributes: data-icon="box|flask|return|chat", data-hint="short helper text". */
(function () {
  'use strict';

  var CHEV = '<svg class="ui-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var TICK = '<svg class="ui-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICONS = {
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg>',
    flask: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/></svg>',
    return: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>'
  };
  var uid = 0;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function enhance(sel) {
    if (sel.dataset.uiSelect) return;
    sel.dataset.uiSelect = '1';
    var id = 'ui-select-' + (++uid);
    var opts = [].slice.call(sel.options);
    var wrap = el('div', 'ui-select');
    var btn = el('button', 'ui-select-btn');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    var lab = sel.closest('label'), span = lab && lab.querySelector('span');
    if (span) { span.id = span.id || id + '-label'; btn.setAttribute('aria-labelledby', span.id + ' ' + id + '-value'); }
    var ico = el('i', 'ui-ico'), main = el('b', 'ui-main'), hint = el('small', 'ui-hint');
    main.id = id + '-value';
    var txt = el('span', 'ui-txt'); txt.appendChild(main); txt.appendChild(hint);
    btn.appendChild(ico); btn.appendChild(txt); btn.insertAdjacentHTML('beforeend', CHEV);

    var list = el('ul', 'ui-select-list');
    list.id = id; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
    var items = opts.map(function (o, i) {
      var li = el('li', '', '<i class="ui-ico">' + (ICONS[o.dataset.icon] || '') + '</i><span class="ui-txt"><b class="ui-main">' + esc(o.textContent) + '</b>' + (o.dataset.hint ? '<small class="ui-hint">' + esc(o.dataset.hint) + '</small>' : '') + '</span>' + TICK);
      li.setAttribute('role', 'option'); li.id = id + '-o' + i; li.dataset.i = i;
      list.appendChild(li); return li;
    });

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(btn); wrap.appendChild(list); wrap.appendChild(sel);
    sel.classList.add('ui-select-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');

    var active = sel.selectedIndex;
    function paint() {
      var o = opts[sel.selectedIndex];
      main.textContent = o ? o.textContent : '';
      hint.textContent = o && o.dataset.hint ? o.dataset.hint : '';
      hint.hidden = !hint.textContent;
      ico.innerHTML = o ? (ICONS[o.dataset.icon] || '') : '';
      ico.hidden = !ico.innerHTML;
      items.forEach(function (li, i) {
        li.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false');
        li.classList.toggle('is-active', i === active);
      });
      if (wrap.classList.contains('is-open')) btn.setAttribute('aria-activedescendant', items[active] ? items[active].id : '');
    }
    function open() { active = sel.selectedIndex; wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); paint(); }
    function close(focus) { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant'); if (focus) btn.focus(); }
    function choose(i) {
      if (i !== sel.selectedIndex) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      active = i; paint(); close(true);
    }
    function move(d) { active = Math.max(0, Math.min(items.length - 1, active + d)); paint(); items[active].scrollIntoView({ block: 'nearest' }); }

    btn.addEventListener('click', function (e) { e.preventDefault(); wrap.classList.contains('is-open') ? close() : open(); });
    list.addEventListener('click', function (e) { e.preventDefault(); var li = e.target.closest('li'); if (li) choose(+li.dataset.i); });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('li'); if (li && +li.dataset.i !== active) { active = +li.dataset.i; paint(); } });
    btn.addEventListener('keydown', function (e) {
      var isOpen = wrap.classList.contains('is-open'), k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); isOpen ? move(k === 'ArrowDown' ? 1 : -1) : open(); }
      else if (k === 'Home' && isOpen) { e.preventDefault(); active = 0; paint(); }
      else if (k === 'End' && isOpen) { e.preventDefault(); active = items.length - 1; paint(); }
      else if ((k === 'Enter' || k === ' ') && isOpen) { e.preventDefault(); choose(active); }
      else if (k === 'Escape' && isOpen) { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (k === 'Tab' && isOpen) { close(); }
      else if (k.length === 1 && /\S/.test(k)) {
        var n = opts.findIndex(function (o) { return o.textContent.trim().toLowerCase().indexOf(k.toLowerCase()) === 0; });
        if (n >= 0) { active = n; if (isOpen) { paint(); items[n].scrollIntoView({ block: 'nearest' }); } else choose(n); }
      }
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    sel.form && sel.form.addEventListener('reset', function () { setTimeout(function () { active = sel.selectedIndex; paint(); }, 0); });
    paint();
  }

  document.querySelectorAll('.ct-f select').forEach(enhance);
})();
