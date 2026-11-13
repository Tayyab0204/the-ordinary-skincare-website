/* collection.js — Collection page (products come from products.js).
   Each card shows image, name, price and category. TO EDIT A PRODUCT: change its object in products.js. `image` is the photo and `pos` its focus point (x% y%); add `price: 12` (USD) to show a price, and `href` for its page. */
(() => {
  const PRODUCTS = window.PRODUCTS;
  const TILES = [
    { label: 'Brightening', img: 'assets/home/promo-hold.jpg', pos: '60% 40%' },
    { label: 'Hydration', img: 'assets/articles/article-1.jpg', pos: '49% 50%' },
    { label: 'Anti-Aging', img: 'assets/articles/article-3.jpg', pos: '70% 40%' },
    { label: 'Acne & Pores', img: 'assets/articles/article-6.jpg', pos: '49% 40%' }
  ];
  const TABS = ['All Products', 'Brightening', 'Hydration', 'Anti-Aging', 'Acne & Pores', 'Eye Care'];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const price = p => window.Store && p.id ? Store.priceHTMLFor(p.id, p.sku) : (p.price != null ? `Rs. ${Number(p.price).toLocaleString('en-US')}` : '');

  const tilesEl = document.querySelector('[data-tiles]');
  const tabsEl = document.querySelector('[data-tabs]');
  const grid = document.querySelector('[data-grid]');
  const wanted = new URLSearchParams(location.search).get('tab');
  let active = TABS.includes(wanted) ? wanted : TABS[0];
  let query = (new URLSearchParams(location.search).get('q') || '').trim();
  const hay = p => [p.name, p.concern, p.type, ...(p.concerns || []), ...(p.points || [])].join(' ').toLowerCase();
  const shop = window.Store;
  const card = p => `<article class="col-card"><a class="col-img" href="${esc(p.href)}" aria-label="View ${esc(p.name)}">${p.badge ? `<span class="col-badge">${esc(p.badge)}</span>` : ''}<img src="${esc(p.image)}" alt="${esc(p.name)}" style="object-position:${esc(p.pos || '50% 50%')}" loading="lazy"></a>
   <div class="col-meta"><h3><a class="p3-name" href="${esc(p.href)}">${esc(p.name)}</a></h3></div>
   <div class="col-row"><span class="col-cat">${esc(p.concern)}</span><span class="col-price">${price(p)}</span></div>
   <div class="p3-actions"><button type="button" class="p3-quick" data-p3-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">+ Quick add</button><a href="${esc(p.href)}" class="p3-details">Details →</a></div></article>`;
  const draw = () => {
    tabsEl.innerHTML = TABS.map(t => `<button type="button" role="tab" class="col-tab${!query && t === active ? ' is-active' : ''}" aria-selected="${!query && t === active}" data-tab="${esc(t)}">${esc(t)}</button>`).join('');
    let items = query ? PRODUCTS.filter(p => hay(p).includes(query.toLowerCase())) : PRODUCTS.filter(p => (active === TABS[0] || p.concern === active));
    const bar = query ? `<div class="p3-qbar"><span>${items.length} result${items.length === 1 ? '' : 's'} for <b>“${esc(query)}”</b></span><button type="button" class="p3-qclear" data-tab="All Products">Clear search</button></div>` : '';
    grid.innerHTML = items.length ? bar + items.map(card).join('') : `<div class="p3-empty"><h3>No matching products</h3><p>Explore another collection above.</p></div>`;
  };
  tilesEl.innerHTML = TILES.map(t => `<button type="button" class="col-tile" data-tab="${esc(t.label)}" style="--pos:${t.pos}"><img src="${esc(t.img)}" alt="" loading="lazy"><span>${esc(t.label)}</span></button>`).join('');
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-p3-add]');
    if (add) { if(shop){shop.add(add.dataset.p3Add,1);shop.open();} return; }
    const b = e.target.closest('[data-tab]'); if (!b) return;
    active=b.dataset.tab;query='';if(history.replaceState&&location.search.indexOf('q=')>-1)history.replaceState(null,'','shop.html#products');draw();
    if(b.classList.contains('col-tile')) document.getElementById('products').scrollIntoView({behavior:'smooth'});
  });
  draw();
})();
