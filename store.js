/* store.js — persistent cart + drawer for The Ordinary. Edit CONFIG to change prices/shipping. */
(() => {
  const CONFIG = {
    currency: 'Rs. ',   // prices are in Pakistani rupees (PKR)
    // PRODUCTS — everything the bag can sell. Prices are in Pakistani rupees (PKR). id must match <body data-product-id> on the product page.
    //   price      = the normal price (crossed out when the product is on sale)
    //   sale       = fixed sale price the customer pays (the 5 higher-priced serums). Delete it to end that sale.
    //   percentOff = true -> the customer pays offer.percent less (only Niacinamide). The 60 ml price is a placeholder.
    products: [
      { id: 'niacinamide-10-zinc-1', name: 'Niacinamide 10% + Zinc 1%',          image: 'assets/user-pdp/product-clean.webp',        price: 3400, variants: { '30 ml': 3400, '60 ml': 5600 }, defaultSize: '30 ml', percentOff: true },   // 50% off: Rs. 3,400 -> Rs. 1,700 (60 ml: Rs. 5,600 -> Rs. 2,800)
      { id: 'hyaluronic-acid-2-b5',  name: 'Hyaluronic Acid 2% + B5',            image: 'assets/products/hyaluronic-acid.jpg',      price: 2500 },
      { id: 'multi-peptide-copper',  name: 'Multi-Peptide + Copper Peptides 1%', image: 'assets/products/multi-peptide-copper.jpg', price: 8100, sale: 7200 },
      { id: 'multi-peptide-ha',      name: 'Multi-Peptide + HA Serum',           image: 'assets/products/multi-peptide-ha.jpg',     price: 5600, sale: 5000 },
      { id: 'salicylic-acid-2',      name: 'Salicylic Acid 2% Solution',         image: 'assets/products/salicylic-acid.jpg',       price: 2200 },
      { id: 'caffeine-egcg-5',       name: 'Caffeine Solution 5% + EGCG',        image: 'assets/products/caffeine-egcg.jpg',        price: 2200 },
      { id: 'matrixyl-10-ha',        name: 'Matrixyl 10% + HA',                  image: 'assets/products/matrixyl-ha.jpg',          price: 3900, sale: 3600 },
      { id: 'azelaic-acid-10',       name: 'Azelaic Acid Suspension 10%',        image: 'assets/products/azelaic-acid.jpg',         price: 3100, sale: 2800 },
      { id: 'ascorbyl-glucoside-12', name: 'Ascorbyl Glucoside Solution 12%',    image: 'assets/products/ascorbyl-glucoside.jpg',   price: 3400, sale: 3100 }
    ],
    shippingFlat: 250, freeShippingOver: 5000,   // delivery charge Rs. 250; free delivery on orders of Rs. 5,000 or more
    contact: { email: 'tali3851377@gmail.com', phone: '0337 9369828' },
    // THE OFFER — one place for the popup banner, the bag and the checkout.
    // freeUnits = serums given free with every order (the lowest-priced serum in the bag). enabled:false switches the free serum off.
    // percent = the % off for every product that has  percentOff: true  (only Niacinamide right now). Other sale prices are the `sale` fields above.
    offer: { enabled: true, percent: 50, freeUnits: 1 },
    orderWebhook: '' // optional: URL (Google Apps Script / Formspree / your API) that receives each order as JSON
  };
  const KEY = 'ordinary_cart_v1';
  // A page refresh always starts with an empty bag (moving between pages keeps it).
  try {
    const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
    const isReload = nav ? nav.type === 'reload' : (performance.navigation && performance.navigation.type === 1);
    if (isReload) localStorage.removeItem(KEY);
  } catch (_) {}
  const prod = id => CONFIG.products.find(p => p.id === id);
  // Older saved bags have no product id: they were all Niacinamide.
  const load = () => { try { return (JSON.parse(localStorage.getItem(KEY)) || []).map(i => ({ id: i.id || CONFIG.products[0].id, size: i.size || '', qty: i.qty })).filter(i => prod(i.id)); } catch (_) { return []; } };
  const keyOf = i => i.id + '|' + (i.size || '');
  const unit = i => { const p = prod(i.id); return (p.variants && p.variants[i.size] != null) ? p.variants[i.size] : p.price; };
  let items = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {} render(); };
  const fmt = n => { const v = Number(n); return CONFIG.currency + (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
  const count = () => items.reduce((s, i) => s + i.qty, 0);
  // ---- offer maths (all money is rounded to cents) ----
  const O = () => (CONFIG.offer && CONFIG.offer.enabled) ? CONFIG.offer : null;
  const r2 = n => Math.round(n * 100) / 100;
  const sale = p => O() ? r2(p * (100 - O().percent) / 100) : p;          // list price -> price the customer pays
  const paid = i => { const p = prod(i.id); if (p.sale != null) return p.sale; return (p.percentOff && O()) ? sale(unit(i)) : unit(i); };   // fixed sale price; otherwise the normal price
  const gross = () => r2(items.reduce((s, i) => s + unit(i) * i.qty, 0));   // before the offer
  const subtotal = () => r2(items.reduce((s, i) => s + paid(i) * i.qty, 0)); // what the customer pays for items
  const discount = () => r2(gross() - subtotal());
  const freeItems = () => { const o = O(); if (!o || !o.freeUnits || !items.length) return []; const c = items.reduce((a, b) => paid(b) < paid(a) ? b : a); return [{ id: c.id, size: c.size, qty: o.freeUnits }]; };
  const freeValue = () => r2(freeItems().reduce((s, f) => s + paid(f) * f.qty, 0));   // what the free serum would have cost the customer
  const savings = () => r2(discount() + freeValue());
  // price block for a product: crossed-out original + the price you pay + a small badge (nothing extra if no discount)
  const priceHTMLFor = (id, size, suffix = '') => {
    const p = prod(id), i = { id, size: size != null ? size : (p.defaultSize || '') };
    const list = unit(i), pay = paid(i);
    if (pay >= list) return fmt(list) + suffix;
    const badge = p.sale != null ? 'Save ' + fmt(list - pay) : O().percent + '% off';
    return `<s class="price-was">${fmt(list)}</s> <span class="price-now">${fmt(pay)}${suffix}</span> <em class="price-off">${badge}</em>`;
  };
  // biggest discount (in %) among the products on sale — used by the popup banner so it never overstates
  const maxOff = () => Math.round(Math.max(0, ...CONFIG.products.map(p => { const i = { id: p.id, size: p.defaultSize || '' }; const l = unit(i); return (l - paid(i)) / l * 100; })));
  const shipping = () => (!items.length || subtotal() >= CONFIG.freeShippingOver) ? 0 : CONFIG.shippingFlat;
  const total = () => subtotal() + shipping();

  // add('hyaluronic-acid-2-b5', 2)  -> puts 2 of that product in the bag (size is only used by products that have sizes).
  const add = (id, qty = 1, size) => {
    const p = prod(id); if (!p) return;
    size = size || p.defaultSize || '';
    qty = Math.max(1, parseInt(qty, 10) || 1);
    const line = items.find(i => i.id === id && i.size === size);
    if (line) line.qty = Math.min(99, line.qty + qty); else items.push({ id, size, qty: Math.min(99, qty) });
    save();
  };
  const setQty = (key, qty) => { const next = Math.min(99, Math.max(0, Number.parseInt(qty,10) || 0)); items = items.map(i => keyOf(i) === key ? { ...i, qty: next } : i).filter(i => i.qty > 0); save(); };
  const clear = () => { items = []; save(); };

  const css = document.createElement('style');
  css.textContent = `
  .price-was{opacity:.5;text-decoration:line-through;font-weight:400}
  .price-off{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:2px;background:#272a1b;color:#f3ede3;font-style:normal;font-size:.62em;font-weight:600;letter-spacing:.14em;text-transform:uppercase;line-height:1;vertical-align:middle;white-space:nowrap}
  .hero-buy .price-off,.nu-pc-price .price-off{display:none}

  /* ===== BAG DRAWER ===== */
  html.bag-open{overflow:hidden}
  .bag-overlay{position:fixed;inset:0;z-index:90;background:rgba(20,22,12,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;visibility:hidden;transition:opacity .4s ease,visibility 0s linear .4s}
  .bag-overlay.open{opacity:1;visibility:visible;transition:opacity .4s ease}
  .bag{position:fixed;top:0;right:0;z-index:95;display:flex;flex-direction:column;width:min(440px,100%);height:100%;height:100dvh;background:#faf8f4;color:#1d1f14;font-family:'DM Sans',system-ui,sans-serif;box-shadow:-30px 0 80px rgba(0,0,0,.22);transform:translateX(104%);visibility:hidden;transition:transform .55s cubic-bezier(.2,.8,.2,1),visibility 0s linear .55s}
  .bag.open{transform:none;visibility:visible;transition:transform .55s cubic-bezier(.2,.8,.2,1)}
  .bag *{box-sizing:border-box}
  .bag button{margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer}
  .bag a{color:inherit;text-decoration:none}
  .bag h2,.bag h3,.bag p{margin:0}
  .bag svg{display:block;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}

  .bag .bag-head{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 18px}
  .bag .bag-title{display:flex;align-items:baseline;gap:12px}
  .bag .bag-title h2{font:500 22px/1 'DM Sans',system-ui,sans-serif;letter-spacing:-.01em;color:#1d1f14}
  .bag .bag-count{font-size:13px;color:#7a766b}
  .bag .bag-x{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(39,42,27,.2);border-radius:50%;transition:background .3s,color .3s,border-color .3s,transform .3s}
  .bag .bag-x:hover{background:#272a1b;color:#f3ede3;border-color:#272a1b;transform:rotate(90deg)}
  .bag .bag-x svg{width:13px;height:13px;stroke-width:1.7}

  .bag .bag-ship{margin:0 26px 6px;padding:14px 16px;border-radius:8px;background:#f0ebe1;font-size:13px;line-height:1.45;color:#3f3d34}
  .bag .bag-ship b{font-weight:600;color:#1d1f14}
  .bag .bs-bar{height:4px;margin-top:10px;border-radius:4px;background:rgba(39,42,27,.14);overflow:hidden}
  .bag .bs-bar i{display:block;height:100%;border-radius:4px;background:#272a1b;transition:width .7s cubic-bezier(.2,.8,.2,1)}
  .bag .bag-ship.is-done .bs-bar i{background:#5a6b2c}

  .bag .bag-body{flex:1;min-height:0;overflow-y:auto;padding:4px 26px 18px;overscroll-behavior:contain}
  .bag .bag-line{display:grid;grid-template-columns:84px 1fr;gap:16px;padding:18px 0;border-bottom:1px solid rgba(39,42,27,.1)}
  .bag .bl-img{display:block;width:84px;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#ece6da}
  .bag .bl-img img{display:block;width:100%;height:100%;object-fit:cover}
  .bag .bl-info{display:flex;flex-direction:column;min-width:0}
  .bag .bl-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .bag .bl-name{font:500 15px/1.3 'DM Sans',system-ui,sans-serif;color:#1d1f14}
  .bag .bl-name a:hover{text-decoration:underline;text-underline-offset:3px}
  .bag .bl-meta{margin-top:3px;font-size:12.5px;color:#7a766b}
  .bag .bl-rm{flex:none;display:grid;place-items:center;width:28px;height:28px;margin:-4px -6px 0 0;border-radius:50%;color:#8a8576;transition:background .25s,color .25s}
  .bag .bl-rm:hover{background:rgba(39,42,27,.08);color:#1d1f14}
  .bag .bl-rm svg{width:16px;height:16px;stroke-width:1.5}
  .bag .bl-bot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:auto;padding-top:12px}
  .bag .bl-qty{display:inline-flex;align-items:center;border:1px solid rgba(39,42,27,.2);border-radius:999px}
  .bag .bl-qty button{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;font-size:16px;line-height:1;transition:background .2s}
  .bag .bl-qty button:hover{background:rgba(39,42,27,.08)}
  .bag .bl-qty button:disabled{opacity:.35;cursor:not-allowed}
  .bag [hidden]{display:none!important}
  .bag .bl-qty span{min-width:22px;text-align:center;font-size:14px;font-weight:500}
  .bag .bl-price{font-size:15px;font-weight:600;line-height:1.25;text-align:right}
  .bag .bl-price s{display:block;font-size:12px;font-weight:400;opacity:.5}
  .bag .bag-free .bl-tag{display:inline-block;padding:5px 10px;border:1px solid #b9a98a;border-radius:999px;color:#5a4f37;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;line-height:1}
  .bag .bag-free .bl-price b{color:#4f5b27}

  .bag .bag-empty{display:flex;flex-direction:column;align-items:center;padding:34px 0 8px;text-align:center}
  .bag .be-ico{display:grid;place-items:center;width:78px;height:78px;border-radius:50%;background:#efe9de;color:#272a1b}
  .bag .be-ico svg{width:30px;height:30px;stroke-width:1.4}
  .bag .bag-empty h3{margin:18px 0 6px;font:500 22px/1.2 'DM Sans',system-ui,sans-serif;color:#1d1f14}
  .bag .bag-empty > p{max-width:30ch;margin-bottom:22px;font-size:14px;line-height:1.6;color:#6d6a5f}
  .bag .be-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 30px;border-radius:999px;background:#272a1b;color:#f3ede3;font:600 11px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;transition:background .3s}
  .bag .be-btn:hover{background:#3a3f27}
  .bag .be-btn svg{width:15px;height:15px;stroke-width:1.6}
  .bag .be-picks{width:100%;margin-top:36px;text-align:left}
  .bag .be-kicker{margin-bottom:6px;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#7a766b}
  .bag .be-pick{display:grid;grid-template-columns:56px 1fr auto;align-items:center;gap:14px;padding:12px 0;border-top:1px solid rgba(39,42,27,.1)}
  .bag .be-pick img{display:block;width:56px;height:56px;border-radius:6px;object-fit:cover;background:#ece6da}
  .bag .be-pick a{display:block;font-size:14px;font-weight:500;line-height:1.3;color:#1d1f14}
  .bag .be-pick small{display:block;margin-top:3px;font-size:12.5px;color:#7a766b}
  .bag .be-add{padding:10px 16px;border:1px solid #272a1b;border-radius:999px;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;transition:background .25s,color .25s}
  .bag .be-add:hover{background:#272a1b;color:#f3ede3}

  .bag .bag-foot{padding:20px 26px 24px;border-top:1px solid rgba(39,42,27,.12);background:#f4f0e7}
  .bag .bf-saved{margin-bottom:14px;padding:9px 12px;border-radius:6px;background:rgba(90,107,44,.12);color:#46531f;font-size:13px;font-weight:500;text-align:center}
  .bag .bf-row{display:flex;justify-content:space-between;gap:12px;margin-bottom:9px;font-size:14px;color:#4d4b42}
  .bag .bf-row.is-save{color:#46531f}
  .bag .bf-total{display:flex;align-items:baseline;justify-content:space-between;margin:14px 0 18px;padding-top:14px;border-top:1px solid rgba(39,42,27,.14);font-size:15px;color:#1d1f14}
  .bag .bf-total b{font-size:26px;font-weight:600;letter-spacing:-.015em}
  .bag .bag-checkout{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:18px 20px;border-radius:999px;background:#272a1b;color:#f3ede3;font:600 12px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;transition:background .3s,transform .3s}
  .bag .bag-checkout:hover{background:#3a3f27;transform:translateY(-1px)}
  .bag .bag-checkout svg{width:16px;height:16px;stroke-width:1.6}
  .bag .bag-continue{display:block;margin:14px auto 0;font-size:13px;color:#5b584d;text-decoration:underline;text-underline-offset:4px}
  .bag .bag-continue:hover{color:#1d1f14}
  .bag .bag-trust{margin-top:14px;font-size:11.5px;line-height:1.5;color:#7a766b;text-align:center}
  .bag .bag-x:focus-visible,.bag .bag-checkout:focus-visible,.bag button:focus-visible,.bag a:focus-visible{outline:2px solid #272a1b;outline-offset:2px}

  @media(max-width:520px){.bag .bag-head{padding:18px 20px 14px}.bag .bag-ship{margin:0 20px 6px}.bag .bag-body{padding:4px 20px 14px}.bag .bag-foot{padding:18px 20px 22px}.bag .bag-line{grid-template-columns:76px 1fr;gap:14px}.bag .bl-img{width:76px}}
  @media(max-width:520px),(max-height:780px){.bag .bag-foot{padding:14px 20px 16px}.bag .bf-saved,.bag .bag-trust{display:none}.bag .bf-row{margin-bottom:6px;font-size:13.5px}.bag .bf-total{margin:10px 0 14px;padding-top:10px}.bag .bf-total b{font-size:22px}.bag .bag-checkout{padding:16px 18px}.bag .bag-continue{margin-top:10px}}
  @media(prefers-reduced-motion:reduce){.bag,.bag-overlay,.bag .bs-bar i{transition-duration:.01s!important}}`;
  document.head.appendChild(css);

  // ---- the bag drawer: built here, so every page gets the same one ----
  const ICON = {
    bag:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8.5h12l1 11H5l1-11Z"/><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5"/></svg>',
    x:     '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    lock:  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };
  // product id -> page filename (must match the real files)
  const PAGES = {
    'niacinamide-10-zinc-1': 'niacinamide-10-zinc-1.html',
    'hyaluronic-acid-2-b5': 'hyaluronic-acid-2-b5.html',
    'multi-peptide-copper': 'multi-peptide-copper-peptides-1.html',
    'multi-peptide-ha': 'multi-peptide-ha-serum.html',
    'salicylic-acid-2': 'salicylic-acid-2-solution.html',
    'caffeine-egcg-5': 'caffeine-solution-5-egcg.html',
    'matrixyl-10-ha': 'matrixyl-10-ha.html',
    'azelaic-acid-10': 'azelaic-acid-suspension-10.html',
    'ascorbyl-glucoside-12': 'ascorbyl-glucoside-solution-12.html'
  };
  const pageOf = id => PAGES[id] || 'shop.html';
  const bag = () => document.getElementById('bag'), overlay = () => document.querySelector('.bag-overlay');
  let lastFocus = null;
  const ensureBag = () => {
    if (!document.body) return null;
    let b = bag();
    if (!b) { b = document.createElement('aside'); b.id = 'bag'; document.body.appendChild(b); }
    if (!b.querySelector('[data-bag-foot]')) {
      b.className = 'bag';
      b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('aria-label', 'Shopping bag'); b.setAttribute('aria-hidden', 'true');
      b.innerHTML = `<div class="bag-head"><div class="bag-title"><h2>Your Bag</h2><span class="bag-count" data-bag-count></span></div><button class="bag-x" type="button" data-close-bag aria-label="Close bag">${ICON.x}</button></div>
        <div class="bag-ship" data-bag-ship hidden></div><div class="bag-body" data-bag-body></div><div class="bag-foot" data-bag-foot hidden></div>`;
    }
    if (!overlay()) { const o = document.createElement('div'); o.className = 'bag-overlay'; o.setAttribute('data-close-bag', ''); document.body.appendChild(o); }
    return b;
  };
  const open = () => {
    const b = ensureBag(); if (!b) return;
    lastFocus = document.activeElement;
    b.classList.add('open'); overlay()?.classList.add('open'); b.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('bag-open');
    setTimeout(() => b.querySelector('.bag-x')?.focus({ preventScroll: true }), 350);
  };
  const close = () => {
    bag()?.classList.remove('open'); overlay()?.classList.remove('open'); bag()?.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('bag-open');
    lastFocus?.focus?.({ preventScroll: true });
  };

  const lineHTML = i => {
    const p = prod(i.id), sale = paid(i) < unit(i), key = keyOf(i), href = pageOf(i.id);
    return `<article class="bag-line">
      <a class="bl-img" href="${href}" aria-label="${p.name}"><img src="${p.image}" alt="${p.name}"></a>
      <div class="bl-info">
        <div class="bl-top"><div><h3 class="bl-name"><a href="${href}">${p.name}</a></h3>${i.size ? `<p class="bl-meta">${i.size}</p>` : ''}</div>
          <button class="bl-rm" type="button" data-rm="${key}" aria-label="Remove ${p.name}">${ICON.trash}</button></div>
        <div class="bl-bot"><div class="bl-qty"><button type="button" data-dec="${key}" aria-label="Decrease quantity of ${p.name}" ${i.qty <= 1 ? 'title="Remove last item"' : ''}>−</button><span aria-label="Quantity ${i.qty}">${i.qty}</span><button type="button" data-inc="${key}" aria-label="Increase quantity of ${p.name}" ${i.qty >= 99 ? 'disabled title="Maximum quantity 99"' : ''}>+</button></div>
          <p class="bl-price">${sale ? `<s>${fmt(unit(i) * i.qty)}</s>` : ''}${fmt(paid(i) * i.qty)}</p></div>
      </div></article>`;
  };
  const freeHTML = () => freeItems().map(f => { const p = prod(f.id), href = pageOf(f.id); return `<article class="bag-line bag-free">
      <a class="bl-img" href="${href}" aria-label="${p.name}"><img src="${p.image}" alt="${p.name}"></a>
      <div class="bl-info"><div class="bl-top"><div><h3 class="bl-name"><a href="${href}">${p.name}</a></h3>${f.size ? `<p class="bl-meta">${f.size}</p>` : ''}</div></div>
        <div class="bl-bot"><span class="bl-tag">Free gift · ${f.qty} free</span><p class="bl-price"><s>${fmt(paid(f) * f.qty)}</s><b>Free</b></p></div></div></article>`; }).join('');
  const emptyHTML = () => `<div class="bag-empty"><div class="be-ico">${ICON.bag}</div><h3>Your bag is empty</h3>
      <p>Discover our best-selling serums${O() && O().freeUnits ? ` — and get ${O().freeUnits} free serum with every order` : ''}.</p>
      <a class="be-btn" href="shop.html" data-close-bag>Shop the collection ${ICON.arrow}</a>
      <div class="be-picks"><p class="be-kicker">Popular picks</p>${CONFIG.products.slice(0, 3).map(p => `
        <div class="be-pick"><a href="${pageOf(p.id)}"><img src="${p.image}" alt="${p.name}"></a>
          <div><a href="${pageOf(p.id)}">${p.name}</a><small>${priceHTMLFor(p.id)}</small></div>
          <button type="button" class="be-add" data-add="${p.id}">Add</button></div>`).join('')}</div></div>`;

  function render() {
    ensureBag();
    const n = items.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('[data-cart-count]').forEach(e => e.textContent = n);
    document.querySelectorAll('[data-bag-count]').forEach(e => e.textContent = n ? n + (n === 1 ? ' item' : ' items') : '');
    const body = document.querySelector('[data-bag-body]'), previousScroll = body?.scrollTop || 0, ship = document.querySelector('[data-bag-ship]'), foot = document.querySelector('[data-bag-foot]');
    if (body) { body.innerHTML = items.length ? items.map(lineHTML).join('') + freeHTML() : emptyHTML(); body.scrollTop = previousScroll; }
    if (ship) {
      const left = Math.max(0, CONFIG.freeShippingOver - subtotal());
      ship.hidden = !items.length; ship.className = 'bag-ship' + (left === 0 ? ' is-done' : '');
      ship.innerHTML = (left === 0 ? `<b>You have unlocked free shipping</b>` : `Add <b>${fmt(left)}</b> more for free shipping`)
        + `<div class="bs-bar" role="progressbar" aria-label="Free delivery progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.round(subtotal() / CONFIG.freeShippingOver * 100))}"><i style="width:${Math.min(100, subtotal() / CONFIG.freeShippingOver * 100)}%"></i></div>`;
    }
    if (foot) {
      foot.hidden = !items.length;
      foot.innerHTML = !items.length ? '' : `
        ${savings() > 0 ? `<p class="bf-saved">You save ${fmt(savings())} on this order</p>` : ''}
        <div class="bf-row"><span>Subtotal</span><span>${fmt(gross())}</span></div>
        ${discount() > 0 ? `<div class="bf-row is-save"><span>Sale discount</span><span>−${fmt(discount())}</span></div>` : ''}
        ${freeItems().length ? `<div class="bf-row is-save"><span>Free serum</span><span>Included</span></div>` : ''}
        <div class="bf-row"><span>Shipping</span><span>${shipping() ? fmt(shipping()) : 'Free'}</span></div>
        <div class="bf-total"><span>Total</span><b>${fmt(total())}</b></div>
        <a class="bag-checkout" data-checkout href="checkout.html">${ICON.lock}Checkout${ICON.arrow}</a>
        <button class="bag-continue" type="button" data-close-bag>Continue shopping</button>
        <p class="bag-trust">Cash on delivery available · Free shipping over ${fmt(CONFIG.freeShippingOver)}</p>`;
    }
    document.querySelectorAll('[data-product]').forEach(e => e.innerHTML = priceHTMLFor(e.dataset.product, e.dataset.size));
    document.querySelectorAll('[data-free-ship]').forEach(e => e.textContent = fmt(CONFIG.freeShippingOver));
    document.dispatchEvent(new CustomEvent('store:change'));
  }

  document.addEventListener('click', e => {
    if (e.target.classList?.contains('bag-overlay')) return close();
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.matches('[data-open-bag]')) open();
    else if (t.matches('[data-close-bag]')) close();
    else if (t.dataset.inc) { const item = items.find(i => keyOf(i) === t.dataset.inc); if (item && item.qty < 99) setQty(t.dataset.inc, item.qty + 1); }
    else if (t.dataset.dec) { const item = items.find(i => keyOf(i) === t.dataset.dec); if (item) setQty(t.dataset.dec, item.qty - 1); }
    else if (t.dataset.rm && items.some(i => keyOf(i) === t.dataset.rm)) setQty(t.dataset.rm, 0);
    else if (t.dataset.add) add(t.dataset.add, 1);
  });
    document.addEventListener('keydown', e => {
    const b = bag(); if (!b || !b.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {            // keep keyboard focus inside the open bag
      const f = [...b.querySelectorAll('button:not([disabled]),a[href]')].filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !b.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !b.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('storage', e => { if (e.key === KEY) { items = load(); render(); } });
  document.addEventListener('DOMContentLoaded', render);

  document.addEventListener('DOMContentLoaded', () => {
    const c = CONFIG.contact;
    document.querySelectorAll('[data-contact-email]').forEach(a => { a.textContent = c.email; a.href = 'mailto:' + c.email; });
    document.querySelectorAll('[data-contact-phone]').forEach(e => { e.textContent = c.phone; if (e.tagName === 'A') e.href = 'tel:' + c.phone.replace(/[^+\d]/g, ''); });
    document.querySelectorAll('[data-contact-only]').forEach(e => { e.hidden = !c[e.dataset.contactOnly]; });
  });
  window.Store = { CONFIG, prod, unit, paid, gross, discount, freeItems, priceHTMLFor, maxOff, add, clear, open, fmt, subtotal, shipping, total, get items() { return items; } };
})();
