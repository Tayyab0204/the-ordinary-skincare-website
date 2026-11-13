/* product-bridge.js — joins the 9 product pages to the rest of the site.
   - adds the site menu (Home · About · Collection · Contact · bag); the bag drawer itself is built by store.js
   - "Add to cart" on a product page now puts the product in the SAME bag/checkout as the rest of the site (store.js)
   The product id comes from <body data-product-id="..."> and must match an id in store.js (CONFIG.products). */
(() => {
  const id = document.body.dataset.productId;
  if (!window.Store || !id) return;

  const css = document.createElement('style');
  css.textContent = `body{padding-top:78px}
  @media(max-width:700px){body{padding-top:70px}}
  .site-nav a,.site-bag{font-family:var(--font)}
  .bag{font-family:var(--font);color:#111}.bag button{background:none;border:0;cursor:pointer;font:inherit;color:inherit}
  .bag-checkout{display:block;text-align:center;text-decoration:none;box-sizing:border-box}
  .bag-foot b,.bag-head b{font-weight:500}`;
  css.textContent += `.current-price .price-was{font-size:.62em;margin-right:2px}.current-price .price-off{font-size:.4em;margin-left:8px}
  .tx-offer-note{margin:10px 0 16px;color:#5a4f37;font-size:13px;line-height:1.5}
  .tx-sticky{position:fixed;left:0;right:0;bottom:0;z-index:80;display:none;align-items:center;gap:14px;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:rgba(250,248,244,.96);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid rgba(39,42,27,.14);transform:translateY(110%);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
  .tx-sticky.is-on{transform:none}
  .tx-sticky-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .tx-sticky-info b{overflow:hidden;color:#171912;font:500 13px/1.25 'DM Sans',system-ui,sans-serif;white-space:nowrap;text-overflow:ellipsis}
  .tx-sticky-info span{color:#171912;font:600 14px/1.3 'DM Sans',system-ui,sans-serif}
  .tx-sticky-info .price-off{display:none}
  .tx-sticky button{flex:none;min-height:44px;padding:0 22px;border:0;border-radius:999px;background:#272a1b;color:#f3ede3;font:600 11px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
  @media(max-width:760px){.tx-sticky{display:flex}body.has-sticky-atc{padding-bottom:74px}}
  .pc-media{display:block}.pc-name a{color:inherit;text-decoration:none}
  .pc-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:6px}
  .pc-row .pc-price{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:baseline;gap:2px 8px;text-align:right;font-size:17px}
  .pc-row .pc-price .price-off{font-size:.62em}`;
  document.head.appendChild(css);

  // show the real offer price on the product page (list price struck through)
  const pe = document.getElementById('displayPrice');
  if (pe) {
    pe.innerHTML = Store.priceHTMLFor(id);
    const o = Store.CONFIG.offer;
    if (o && o.enabled) {
      const n = document.createElement('p'); n.className = 'tx-offer-note';
      const pr = Store.prod(id); n.textContent = (pr.sale != null ? 'Special price + ' : pr.percentOff ? o.percent + '% off + ' : '') + o.freeUnits + ' free serum with your order — applied automatically in your bag.';
      (pe.closest('.price-row') || pe.parentElement).after(n);
    }
  }

  const nav = document.createElement('header');
  nav.className = 'site-nav';
  nav.innerHTML = `<a class="site-logo" href="index.html" aria-label="The Ordinary — home"><span>The</span><strong>Ordinary.</strong></a>
  <nav class="site-links" aria-label="Primary navigation"><a href="index.html">Home</a><a href="about.html">About</a><a href="shop.html">Collection</a><a href="contact.html">Contact</a><button class="site-bag" type="button" data-open-bag aria-label="Open shopping bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8.5h12l1 11H5l1-11Z"/><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5"/></svg><b data-cart-count>0</b></button></nav>`;
  document.body.prepend(nav);
  const colLink = nav.querySelector('a[href="shop.html"]'); if (colLink) { colLink.classList.add('is-current'); colLink.setAttribute('aria-current', 'page'); }

  // scroll down: navbar slides away and stays away; scroll up (even a little): it comes back; top of page: always visible
  let lastY = scrollY, acc = 0;
  const onScroll = () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    nav.classList.toggle('is-scrolled', y > 20);
    if (dy !== 0 && Math.sign(dy) !== Math.sign(acc)) acc = 0;
    acc += dy;
    if (y <= 40) nav.classList.remove('is-away');
    else if (acc > 8) nav.classList.add('is-away');
    else if (acc < -6) nav.classList.remove('is-away');
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  nav.addEventListener('focusin', () => nav.classList.remove('is-away'));

  // "You Might Also Like": real products, with their own photo, name, category, price and link (Best seller badge only on the best seller)
  const grid = document.querySelector('.pc-grid');
  const list = window.PRODUCTS || [];
  if (grid && list.length) {
    const at = list.findIndex(p => p.id === id), pick = [];
    const best = list.find(p => p.badge);
    if (best && best.id !== id) pick.push(best);
    for (let k = 1; pick.length < 3 && k <= list.length; k++) { const p = list[(at + k) % list.length]; if (p.id !== id && !pick.includes(p)) pick.push(p); }
    grid.innerHTML = pick.map(p => `<article class="pc-card">
      <a class="pc-media" href="${p.href}" aria-label="${p.name}">${p.badge ? `<span class="pc-badge">${p.badge}</span>` : ''}<img src="${p.image}" alt="${p.name}" style="object-position:${p.pos || '50% 50%'}" loading="lazy"></a>
      <h3 class="pc-name"><a href="${p.href}">${p.name}</a></h3>
      <div class="pc-row"><span class="pc-cat">${p.type}</span><span class="pc-price">${Store.priceHTMLFor(p.id, p.sku)}</span></div>
    </article>`).join('');
    document.querySelectorAll('.pc-viewall').forEach(a => a.href = 'shop.html');
  }

  // footer newsletter (same behaviour as the other pages: accepted only when the server confirms)
  document.querySelectorAll('[data-news]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = form.querySelector('input'), msg = form.querySelector('.news-msg'), btn = form.querySelector('button');
    const email = input.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
    if (btn) btn.disabled = true;
    try {
      const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await r.json().catch(() => ({}));
      if (!r.ok || !result.ok) throw Error(result.error || 'Subscription is temporarily unavailable.');
      msg.textContent = 'Subscription request received.'; input.value = '';
    } catch (ex) { msg.textContent = ex.message || 'Unable to subscribe. Please try again.'; }
    finally { if (btn) btn.disabled = false; }
  }));

  // Add to bag
  const addBtn = document.getElementById('heroAddToCartBtn');
  if (addBtn) addBtn.addEventListener('click', () => {
    const qty = parseInt(document.getElementById('qtyInput')?.value, 10) || 1;
    Store.add(id, qty); Store.open();
    const label = addBtn.innerHTML; addBtn.innerHTML = '<span>ADDED ✓</span>';
    setTimeout(() => { addBtn.innerHTML = label; }, 1800);
  });

  // Phones: a sticky "Add to cart" bar appears once the main button has scrolled out of sight
  if (addBtn && 'IntersectionObserver' in window) {
    const bar = document.createElement('div'); bar.className = 'tx-sticky';
    bar.innerHTML = `<div class="tx-sticky-info"><b>${Store.prod(id).name}</b><span>${Store.priceHTMLFor(id)}</span></div><button type="button">Add to cart</button>`;
    document.body.appendChild(bar); document.body.classList.add('has-sticky-atc');
    new IntersectionObserver(([e]) => { const on = !e.isIntersecting && e.boundingClientRect.top < 0; bar.classList.toggle('is-on', on); document.body.classList.toggle('sticky-on', on); }, { threshold: 0 }).observe(addBtn);
    bar.querySelector('button').addEventListener('click', () => addBtn.click());
  }
})();
