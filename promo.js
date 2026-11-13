/* promo.js — premium offer popup + side tab, on every page.
   - Opens by itself ~2.5 s after the site loads (once per visit/session), centered, with the offer image.
   - Closing it leaves a small tab on the screen edge; tapping the tab opens the offer again.
   - Not shown automatically on the checkout page.
   TO CHANGE: edit CFG below (text, image, link, delay, side: 'left' or 'right').
   The offer itself (percent, free units, on/off) lives in store.js -> CONFIG.offer and is applied in the bag and checkout. */
(() => {
  // numbers come from the real offer in store.js, so the banner can never promise something the bag does not give
  const OFR = (window.Store && Store.CONFIG.offer) || { enabled: true, percent: 50, freeUnits: 1 };
  if (!OFR.enabled) return;
  const CFG = Object.assign({
    delay: 2500,                       // ms after page load
    side: 'right',                     // side tab: 'left' or 'right'
    image: 'assets/promo/offer-banner.jpg',
    featured: 'niacinamide-10-zinc-1',   // the product whose price is shown inside the banner
    link: 'shop.html',
    kicker: 'Exclusive Offer',
    percent: String((window.Store && Store.maxOff) ? Store.maxOff() : OFR.percent),
    off: 'Off',
    free: '+ ' + OFR.freeUnits + ' Free',
    title: 'Your first ritual, on us.',
    copy: 'Enjoy special prices on selected serums, plus ' + OFR.freeUnits + ' serum free with your order. Applied automatically in your bag.',
    button: 'Shop the offer',
    skip: 'No, thanks',
    fine: 'Applied automatically · Cash on delivery available',
    tabShort: 'Up to ' + ((window.Store && Store.maxOff) ? Store.maxOff() : OFR.percent) + '% off',
    tab: 'Up to ' + ((window.Store && Store.maxOff) ? Store.maxOff() : OFR.percent) + '% Off + ' + OFR.freeUnits + ' Free'
  }, window.PromoConfig || {});

  const isCheckout = document.body.classList.contains('checkout-page');
  const SEEN = 'ordinary_promo_seen';
  const seen = () => { try { return sessionStorage.getItem(SEEN) === '1'; } catch (_) { return false; } };
  const markSeen = () => { try { sessionStorage.setItem(SEEN, '1'); } catch (_) {} };
  const right = CFG.side === 'right';

  // luxury serif for the big numbers (falls back to Georgia if offline)
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(font);

  const css = document.createElement('style');
  css.textContent = `
  .ox-promo{--ox-bg:#272a1b;--ox-cream:#f3ede3;--ox-tan:#c5b59a;position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:20px;visibility:hidden;opacity:0;transition:opacity .5s ease,visibility 0s linear .5s;font-family:'DM Sans',system-ui,sans-serif}
  .ox-promo.is-open{visibility:visible;opacity:1;transition:opacity .5s ease}
  .ox-promo *{box-sizing:border-box}
  .ox-back{position:absolute;inset:0;background:rgba(16,18,9,.64);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
  .ox-card{position:relative;display:grid;grid-template-columns:1.05fr 1fr;width:min(960px,100%);max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);overflow:hidden;background:var(--ox-bg);color:var(--ox-cream);border-radius:3px;box-shadow:0 50px 140px rgba(0,0,0,.5);opacity:0;transform:translateY(30px) scale(.965);transition:transform .8s cubic-bezier(.2,.8,.2,1),opacity .6s ease}
  .ox-promo.is-open .ox-card{opacity:1;transform:none}
  .ox-card{grid-template-rows:minmax(0,1fr)}
  .ox-img{min-height:0}
  .ox-body{min-height:0;overflow-y:auto;justify-content:safe center;overscroll-behavior:contain}
  @media(min-width:761px) and (max-height:900px){
    .ox-img{min-height:0}
    .ox-body{padding:clamp(24px,4.2vh,40px) clamp(30px,4vw,56px)}
    .ox-num{font-size:clamp(76px,14vh,120px)}
    .ox-pct{font-size:clamp(32px,5vh,46px)}
    .ox-upto{margin-top:6px}
    .ox-free{margin-top:10px;padding:9px 22px}
    .ox-deal{margin-top:12px}
    .ox-deal b{font-size:26px}
    .ox-title{margin:12px 0 6px;font-size:clamp(22px,3.4vh,28px)}
    .ox-copy{margin-bottom:16px;font-size:13.5px;line-height:1.55}
    .ox-btn{padding:15px 22px}
    .ox-skip{margin-top:8px}
    .ox-fine{margin-top:10px}
  }
  @media(min-width:761px) and (max-height:700px){
    .ox-num{font-size:clamp(64px,12vh,88px)}
    .ox-copy{display:none}
    .ox-deal{margin-top:8px}
    .ox-title{margin:8px 0 10px}
    .ox-fine{display:none}
  }
  .ox-card::after{content:'';position:absolute;inset:11px;border:1px solid rgba(197,181,154,.5);pointer-events:none;z-index:3}
  .ox-img{position:relative;min-height:540px;overflow:hidden;background:#cfc6b6}
  .ox-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 62%;transform:scale(1.12);transition:transform 10s cubic-bezier(.2,.7,.2,1)}
  .ox-promo.is-open .ox-img img{transform:scale(1)}
  .ox-img::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(39,42,27,0) 62%,rgba(39,42,27,.55)),linear-gradient(0deg,rgba(39,42,27,.28),rgba(39,42,27,0) 40%)}
  .ox-body{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(40px,4.4vw,62px) clamp(30px,4vw,56px)}
  .ox-r{opacity:0;transform:translateY(16px);transition:opacity .7s ease,transform .8s cubic-bezier(.2,.8,.2,1)}
  .ox-promo.is-open .ox-r{opacity:1;transform:none}
  .ox-promo.is-open .ox-r:nth-child(1){transition-delay:.25s}.ox-promo.is-open .ox-r:nth-child(2){transition-delay:.38s}
  .ox-promo.is-open .ox-r:nth-child(3){transition-delay:.5s}.ox-promo.is-open .ox-r:nth-child(4){transition-delay:.62s}
  .ox-promo.is-open .ox-r:nth-child(5){transition-delay:.74s}.ox-promo.is-open .ox-r:nth-child(6){transition-delay:.84s}
  .ox-promo.is-open .ox-r:nth-child(7){transition-delay:.94s}.ox-promo.is-open .ox-r:nth-child(8){transition-delay:1.04s}.ox-promo.is-open .ox-r:nth-child(9){transition-delay:1.14s}
  .ox-kicker{display:flex;align-items:center;gap:14px;margin:0 0 6px;color:var(--ox-tan);font-size:11px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;line-height:1}
  .ox-kicker::before,.ox-kicker::after{content:'';width:30px;height:1px;background:currentColor;opacity:.7}
  .ox-upto{margin:12px 0 0;color:rgba(243,237,227,.72);font-size:11px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;line-height:1}
  .ox-big{display:flex;align-items:flex-start;justify-content:center;gap:6px;margin:2px 0 0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-weight:500;line-height:.9;color:var(--ox-cream)}
  .ox-num{font-size:clamp(96px,11vw,150px);letter-spacing:-.04em}
  .ox-side{display:flex;flex-direction:column;align-items:flex-start;padding-top:.26em;text-align:left}
  .ox-pct{font-size:clamp(40px,4.4vw,58px);line-height:1}
  .ox-off{margin-top:2px;font-family:'DM Sans',system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:.42em;text-transform:uppercase;line-height:1}
  .ox-free{display:inline-block;margin:14px 0 0;padding:11px 24px;border:1px solid var(--ox-tan);color:var(--ox-cream);font-size:12px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;line-height:1;position:relative;overflow:hidden}
  .ox-free::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(243,237,227,.28),transparent);animation:ox-shine 3.6s ease-in-out 1.6s infinite}
  .ox-deal{display:flex;flex-direction:column;align-items:center;gap:6px;margin:18px 0 0}
  .ox-deal span{color:var(--ox-tan);font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;line-height:1.3}
  .ox-deal b{font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:30px;font-weight:500;line-height:1;color:var(--ox-cream)}
  .ox-deal s{margin-right:6px;font-size:.66em;opacity:.55}
  .ox-title{margin:20px 0 8px;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:clamp(25px,2.5vw,32px);font-weight:500;font-style:italic;line-height:1.15;color:var(--ox-cream)}
  .ox-copy{max-width:31ch;margin:0 0 26px;color:rgba(243,237,227,.78);font-size:14px;font-weight:400;line-height:1.65}
  .ox-btn{display:block;width:100%;max-width:300px;padding:17px 22px;border:1px solid var(--ox-cream);background:var(--ox-cream);color:var(--ox-bg);font:600 11px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.26em;text-transform:uppercase;text-decoration:none;text-align:center;cursor:pointer;transition:background .3s ease,color .3s ease}
  .ox-btn:hover{background:transparent;color:var(--ox-cream)}
  .ox-btn:focus-visible,.ox-skip:focus-visible,.ox-x:focus-visible,.ox-tab:focus-visible{outline:1px solid #c5b59a;outline-offset:4px}
  .ox-skip{margin:16px 0 0;padding:6px;border:0;background:none;color:rgba(243,237,227,.62);font:500 12px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.08em;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
  .ox-skip:hover{color:var(--ox-cream)}
  .ox-fine{margin:18px 0 0;color:rgba(243,237,227,.45);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;line-height:1.5}
  .ox-x{position:absolute;top:22px;right:22px;z-index:4;display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(243,237,227,.45);border-radius:50%;background:rgba(39,42,27,.35);color:var(--ox-cream);cursor:pointer;transition:background .3s ease,transform .3s ease}
  .ox-x:hover{background:rgba(39,42,27,.85);transform:rotate(90deg)}
  .ox-x svg{width:14px;height:14px;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;fill:none}
  @keyframes ox-shine{0%,55%{left:-60%}100%{left:130%}}

  /* side tab that re-opens the offer */
  .ox-tab{position:fixed;top:50%;${right ? 'right' : 'left'}:0;z-index:45;display:flex;align-items:center;gap:12px;padding:20px 12px;border:1px solid #c5b59a;${right ? 'border-right:0;border-radius:10px 0 0 10px' : 'border-left:0;border-radius:0 10px 10px 0'};background:#272a1b;color:#f3ede3;font:600 11px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.26em;text-transform:uppercase;writing-mode:vertical-rl;cursor:pointer;box-shadow:0 12px 36px rgba(0,0,0,.25);translate:${right ? '100%' : '-100%'} -50%;transition:translate .7s cubic-bezier(.2,.8,.2,1),background .3s ease;overflow:hidden}
  .ox-ts{display:none}
  .ox-tab.is-shown{translate:0 -50%}
  .ox-tab:hover{background:#353a25}
  .ox-tab i{width:7px;height:7px;border-radius:50%;background:#c5b59a;box-shadow:0 0 0 0 rgba(197,181,154,.6);animation:ox-pulse 2.2s ease-out infinite}
  @keyframes ox-pulse{0%{box-shadow:0 0 0 0 rgba(197,181,154,.55)}80%,100%{box-shadow:0 0 0 10px rgba(197,181,154,0)}}

  @media(max-width:760px){
    .ox-tab{top:auto;bottom:calc(14px + env(safe-area-inset-bottom,0px));left:12px;right:auto;writing-mode:horizontal-tb;padding:12px 18px;border:1px solid #c5b59a;border-radius:999px;font-size:10.5px;letter-spacing:.16em;translate:0 160%;min-height:44px}
    .ox-tab.is-shown{translate:0 0}
    body.sticky-on .ox-tab{bottom:calc(88px + env(safe-area-inset-bottom,0px))}
    .ox-tl{display:none}.ox-ts{display:inline}
    .ox-tab{padding:10px 16px;gap:10px}
    .ox-promo{padding:12px}
    .ox-card{grid-template-columns:1fr;overflow-y:auto;max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px)}
    .ox-img{min-height:0;height:min(34vh,250px)}
    .ox-img::after{background:linear-gradient(0deg,rgba(39,42,27,.7),rgba(39,42,27,0) 55%)}
    .ox-body{padding:26px 24px 30px}
    .ox-num{font-size:92px}.ox-pct{font-size:38px}
    .ox-title{margin-top:18px}.ox-copy{margin-bottom:20px}
    .ox-x{top:16px;right:16px}
  }
  @media(min-width:761px) and (max-height:800px){.ox-num{font-size:92px}.ox-pct{font-size:36px}.ox-body{padding-top:28px;padding-bottom:28px}.ox-copy{margin-bottom:16px}.ox-title{margin-top:14px}.ox-deal{margin-top:12px}.ox-fine{margin-top:12px}.ox-img{min-height:0}}
  @media(prefers-reduced-motion:reduce){.ox-promo *,.ox-tab{transition-duration:.01s!important;animation:none!important}.ox-img img{transform:none!important}}`;
  document.head.appendChild(css);

  // price line inside the banner, straight from the store (same numbers as the product page and the bag)
  let deal = '';
  if (window.Store && Store.prod && Store.prod(CFG.featured)) {
    const fp = Store.prod(CFG.featured), fi = { id: fp.id, size: fp.defaultSize || '' };
    const was = Store.unit(fi), now = Store.paid(fi);
    if (now < was) deal = `<p class="ox-deal ox-r"><span>${fp.name}</span><b><s>${Store.fmt(was)}</s> ${Store.fmt(now)}</b></p>`;
  }

  const root = document.createElement('div');
  root.className = 'ox-promo';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Up to ' + CFG.percent + '% off plus ' + OFR.freeUnits + ' free');
  root.innerHTML = `<div class="ox-back" data-ox-close></div>
  <div class="ox-card">
    <button class="ox-x" type="button" data-ox-close aria-label="Close offer"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13"/></svg></button>
    <div class="ox-img"><img src="${CFG.image}" alt="The Ordinary serum on a stone surface with dried flowers"></div>
    <div class="ox-body">
      <p class="ox-kicker ox-r">${CFG.kicker}</p>
      <p class="ox-upto ox-r">Up to</p>
      <div class="ox-big ox-r"><span class="ox-num">${CFG.percent}</span><span class="ox-side"><span class="ox-pct">%</span><span class="ox-off">${CFG.off}</span></span></div>
      <span class="ox-free ox-r">${CFG.free}</span>
      ${deal}
      <h2 class="ox-title ox-r">${CFG.title}</h2>
      <p class="ox-copy ox-r">${CFG.copy}</p>
      <a class="ox-btn ox-r" href="${CFG.link}">${CFG.button}</a>
      <button class="ox-skip ox-r" type="button" data-ox-close>${CFG.skip}</button>
      <p class="ox-fine ox-r">${CFG.fine}</p>
    </div>
  </div>`;
  document.body.appendChild(root);

  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'ox-tab';
  tab.setAttribute('aria-label', 'Open offer: ' + CFG.tab);
  tab.innerHTML = `<i aria-hidden="true"></i><span class="ox-tl">${CFG.tab}</span><span class="ox-ts">${CFG.tabShort}</span>`;
  document.body.appendChild(tab);

  let lastFocus = null, timer = null;
  const open = () => {
    clearTimeout(timer);
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    tab.classList.remove('is-shown');
    document.documentElement.style.overflow = 'hidden';
    markSeen();
    setTimeout(() => root.querySelector('.ox-btn')?.focus({ preventScroll: true }), 350);
  };
  const close = () => {
    root.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    if (!isCheckout) setTimeout(() => tab.classList.add('is-shown'), 450);
    lastFocus?.focus?.({ preventScroll: true });
  };

  root.addEventListener('click', e => { if (e.target.closest('[data-ox-close]')) close(); });
  tab.addEventListener('click', open);
  document.addEventListener('keydown', e => {
    if (!root.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {            // keep keyboard focus inside the popup
      const f = [...root.querySelectorAll('button,a[href]')].filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // first visit in this session: open by itself after the delay. Later pages: only the side tab.
  const start = () => {
    if (isCheckout) return;
    if (seen()) { setTimeout(() => tab.classList.add('is-shown'), 600); return; }
    timer = setTimeout(open, CFG.delay);
  };
  if (document.readyState === 'complete') start(); else addEventListener('load', start);

  window.Promo = { open, close };
})();
