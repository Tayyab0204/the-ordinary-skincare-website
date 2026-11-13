/* home.js — product cards, carousel and small bits for the home page (below the hero).
   The product carousel and 'Timeless Essentials' read the product list in products.js; prices come from store.js. */
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Carousel card: image, name, price and type only. The first three products of the list get the Best seller label.
  const priceOf = p => (window.Store && p.id) ? Store.priceHTMLFor(p.id, p.sku) : (p.price != null ? `Rs. ${Number(p.price).toLocaleString('en-US')}` : price({ size: p.sku }));
  const slide = p => `<article class="nu-pc">
    <div class="nu-pc-img">${(window.PRODUCTS || []).indexOf(p) < 3 ? '<span class="nu-badge">Best seller</span>' : ''}
      <a href="${esc(p.href || 'shop.html#products')}" aria-label="${esc(p.name)}" style="display:block;height:100%"><img src="${esc(p.image)}" alt="${esc(p.name)}" style="object-position:${esc(p.pos || '50% 50%')}" loading="lazy"></a></div>
    <div class="nu-pc-meta"><span class="nu-pc-name">${esc(p.name)}</span><span class="nu-pc-price">${priceOf(p)}</span><span class="nu-pc-cat">${esc(p.type)}</span></div></article>`;

  // ---- Timeless Essentials: the first 3 products ----
  // Desktop: the panel on the left follows the product that is in view (info + Buy now). Phones: every card carries its own info and buttons.
  const best = document.querySelector('[data-nu-best]'), info = document.querySelector('[data-nu-info]');
  const feat = (window.PRODUCTS || []).slice(0, 3).map((p, i) => i === 0 ? { ...p, image: 'assets/home/prod-30-crystals.jpg', pos: '50% 50%' } : p);
  const kind = p => p.sku ? `${p.type} · ${p.sku}` : `${p.type} · ${p.concern}`;
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  const buyBtns = p => `<a class="nu-btn is-olive" href="checkout.html" data-nu-buy="${esc(p.id)}">Buy now ${ARROW}</a><button class="nu-btn is-line" type="button" data-nu-bag="${esc(p.id)}">Add to bag</button>`;
  const bestCard = (p, i) => `<article class="nu-pc" data-i="${i}">
    <div class="nu-pc-img"><a href="${esc(p.href)}" aria-label="${esc(p.name)}" style="display:block;height:100%"><img src="${esc(p.image)}" alt="${esc(p.name)}" style="object-position:${esc(p.pos || '50% 50%')}" loading="lazy"></a></div>
    <div class="nu-pc-meta"><span class="nu-pc-name">${esc(p.name)}</span><span class="nu-pc-price">${priceOf(p)}</span><span class="nu-pc-cat">${esc(kind(p))}</span></div>
    <div class="nu-pc-buy">${(p.points || []).length ? `<ul class="nu-pc-points">${p.points.slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(p.blurb || '')}</p>`}<div class="nu-info-btns">${buyBtns(p)}</div></div></article>`;
  const infoHTML = (p, i) => `<div class="nu-info-top"><b>0${i + 1}</b><span>/ 0${feat.length}</span></div>
    <p class="nu-info-cat">${esc(kind(p))}</p>
    <h3 class="nu-info-name">${esc(p.name)}</h3>
    <p class="nu-info-desc">${esc(p.blurb || '')}</p>
    <ul class="nu-info-tags">${(p.concerns || []).slice(0, 5).map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    <p class="nu-info-price">${priceOf(p)}</p>
    <div class="nu-info-btns">${buyBtns(p)}</div>
    <a class="nu-info-more" href="${esc(p.href)}">View full details ${ARROW}</a>`;
  if (best) best.innerHTML = feat.map(bestCard).join('');
  if (best && info && feat.length) {
    const cards = [...best.querySelectorAll('.nu-pc')], dots = document.querySelector('[data-nu-go]');
    if (dots) dots.innerHTML = feat.map((p, i) => `<button type="button" data-i="${i}" aria-label="Show ${esc(p.name)}"></button>`).join('');
    let cur = -1;
    const show = i => {
      if (i < 0 || i === cur) return;
      const first = cur < 0; cur = i;
      const paint = () => { info.innerHTML = infoHTML(feat[i], i); info.classList.remove('is-swap'); };
      if (dots) dots.querySelectorAll('button').forEach((b, k) => b.classList.toggle('is-on', k === i));
      if (first) paint(); else { info.classList.add('is-swap'); setTimeout(paint, 170); }
    };
    show(0);
    // the active product is the card nearest to the middle of the screen
    const pick = () => {
      const r0 = best.getBoundingClientRect(); if (r0.bottom < 0 || r0.top > innerHeight) return;
      let k = 0, d = Infinity;
      cards.forEach((c, i) => { const r = c.getBoundingClientRect(), dist = Math.abs((r.top + r.bottom) / 2 - innerHeight / 2); if (dist < d) { d = dist; k = i; } });
      show(k);
    };
    let ticking = false;
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; pick(); }); } }, { passive: true });
    addEventListener('resize', pick);
    if (dots) dots.addEventListener('click', e => { const b = e.target.closest('button'); if (b) cards[+b.dataset.i].scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }
  // Buy now = put 1 in the bag and go straight to checkout. Add to bag = put 1 in the bag and open it.
  document.addEventListener('click', e => {
    const buy = e.target.closest('[data-nu-buy]'), bag = e.target.closest('[data-nu-bag]');
    if (!(buy || bag) || !window.Store) return;
    e.preventDefault();
    if (buy) { Store.add(buy.dataset.nuBuy, 1); location.href = 'checkout.html'; }
    else { Store.add(bag.dataset.nuBag, 1); Store.open(); }
  });

  // tabs + carousel
  const tabsEl = document.querySelector('[data-nu-tabs]'), track = document.querySelector('[data-nu-track]');
  const dotsEl = document.querySelector('[data-nu-dots]'), ctrl = document.querySelector('.nu-ctrl');
  const prev = document.querySelector('[data-nu-prev]'), next = document.querySelector('[data-nu-next]');
  if (tabsEl && track) {
    const ALL = window.PRODUCTS || [];
    const cats = [...new Set(ALL.map(p => p.concern))];
    const tabs = ['New Arrivals', ...cats];
    let active = 'New Arrivals';
    const draw = () => {
      tabsEl.innerHTML = tabs.map(t => `<button type="button" role="tab" class="nu-tab${t === active ? ' is-active' : ''}" aria-selected="${t === active}" data-tab="${esc(t)}">${esc(t)}</button>`).join('');
      const list = active === 'New Arrivals' ? ALL : ALL.filter(p => p.concern === active);
      track.innerHTML = list.length ? list.map(slide).join('') : '<p class="nu-empty">New products are coming soon.</p>';
      track.scrollTo({ left: 0, behavior: 'auto' });
      requestAnimationFrame(sync);
    };
    const pages = () => Math.max(1, Math.round(track.scrollWidth / track.clientWidth));
    const sync = () => {
      const n = pages(), over = track.scrollWidth > track.clientWidth + 4;
      ctrl?.classList.toggle('is-hidden', !over);
      if (!dotsEl) return;
      const cur = Math.min(n - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
      dotsEl.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" class="${i === cur ? 'is-active' : ''}" data-dot="${i}" aria-label="Go to page ${i + 1}"></button>`).join('');
    };
    tabsEl.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { active = b.dataset.tab; draw(); } });
    dotsEl?.addEventListener('click', e => { const b = e.target.closest('[data-dot]'); if (b) track.scrollTo({ left: Number(b.dataset.dot) * track.clientWidth, behavior: 'smooth' }); });
    prev?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * .9, behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * .9, behavior: 'smooth' }));
    track.addEventListener('scroll', () => { clearTimeout(track._t); track._t = setTimeout(sync, 80); }, { passive: true });
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') next?.click(); else if (e.key === 'ArrowLeft') prev?.click(); });
    window.addEventListener('resize', sync, { passive: true });
    draw();
  }

  // Reviews: the rating summary is worked out from the stars of the reviews shown
  const rv = [...document.querySelectorAll('[data-stars]')], score = document.querySelector('[data-rv-score]');
  if (rv.length && score) score.textContent = `${(rv.reduce((a, e) => a + +e.dataset.stars, 0) / rv.length).toFixed(1)} (${rv.length} Review${rv.length > 1 ? 's' : ''})`;
})();
