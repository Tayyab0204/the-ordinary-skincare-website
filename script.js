(() => {
  const slides = [...document.querySelectorAll('.hero-slide')];
  const thumbs = [...document.querySelectorAll('.hero-thumb')];
  let index = 0;

  const show = (next) => {
    if (!slides.length) return;
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    const ctr = document.querySelector('[data-hero-index]'); if (ctr) ctr.textContent = String(index + 1).padStart(2, '0');
    thumbs.forEach((thumb, i) => {
      const active = i === index;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };


  // Navbar: hides when scrolling down, shows again as soon as you scroll up
  const nav = document.querySelector('.site-nav');
  const brand = document.querySelector('.hero-brand');   // home only: big heading that becomes the logo
  const logo = nav && nav.querySelector('.site-logo');
  let timer, geo, range = 1, ticking = false, lastY = window.scrollY, acc = 0;
  const hero = document.querySelector('.hero');
  const setAway = (v) => { nav.classList.toggle('is-away', v); if (brand) brand.classList.toggle('is-away', v); };

  // Where the heading has to end up (the logo slot) and how much it shrinks
  const measure = () => {
    if (!brand || !logo) return;
    brand.style.transform = 'none'; brand.style.translate = 'none';
    const r = brand.getBoundingClientRect(), bw = brand.offsetWidth, bh = brand.offsetHeight;
    brand.style.translate = '';
    const lw = logo.offsetWidth, lh = logo.offsetHeight, pad = parseFloat(getComputedStyle(logo).paddingLeft) || 22;
    const s = Math.min((lw - 2 * pad) / bw, (lh - 14) / bh);
    const gx = (lw - bw * s) / 2, gy = (lh - bh * s) / 2;
    geo = { dx: logo.offsetLeft + gx - r.left, dy: logo.offsetTop + gy - r.top, s };
    brand.style.setProperty('--px', gx / s + 'px'); brand.style.setProperty('--py', gy / s + 'px');
    range = Math.max(1, (hero ? hero.offsetHeight : window.innerHeight) * 0.5);   // heading finishes flying after 50% of the hero has scrolled by
  };
  // The heading moves exactly with the scroll: p = 0 (in the hero) ... 1 (inside the logo slot)
  const place = () => {
    ticking = false;
    if (!brand || !geo) return;
    const p = Math.min(1, Math.max(0, window.scrollY / range));
    brand.style.setProperty('--p', p);
    brand.style.transform = p === 0 ? 'none' : `translate(${geo.dx * p}px, ${geo.dy * p}px) scale(${1 + (geo.s - 1) * p})`;
    brand.classList.toggle('is-landed', p >= 1);
  };

  if (nav) {
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      if (brand && !ticking) { ticking = true; requestAnimationFrame(place); }
      // Scroll down: the navbar slides away and stays away. Scroll up (even a little): it comes straight back. Top of the page: always visible.
      const dy = y - lastY; lastY = y;
      if (dy !== 0 && Math.sign(dy) !== Math.sign(acc)) acc = 0;
      acc += dy;
      if (y <= 40) setAway(false);
      else if (acc > 8) setAway(true);
      else if (acc < -6) setAway(false);
    };
    const setup = () => { measure(); place(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setup);
    nav.addEventListener('focusin', () => { clearTimeout(timer); setAway(false); });
    if (brand) brand.addEventListener('click', () => { if (brand.classList.contains('is-landed')) window.scrollTo({ top: 0, behavior: 'smooth' }); });
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
    setup();
    if (document.fonts) document.fonts.ready.then(setup);
  }

  // Hero is intentionally manual: no autoplay.
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => show(Number(thumb.dataset.slide)));
  });



  // Keyboard arrows + swipe for the hero selector
  document.addEventListener('keydown', (e) => {
    if (window.scrollY > window.innerHeight * 0.6) return;
    if (e.key === 'ArrowRight') show(index + 1); else if (e.key === 'ArrowLeft') show(index - 1);
  });
  let sx = null; const stage = document.querySelector('.hero');
  stage?.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  stage?.addEventListener('touchend', (e) => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 45) show(index + (d < 0 ? 1 : -1)); sx = null; }, { passive: true });
  document.querySelectorAll('[data-hero-step]').forEach(b => b.addEventListener('click', () => show(index + Number(b.dataset.heroStep))));

  // Forms are accepted ONLY when the server confirms receipt. Never store customer PII in localStorage.
  document.querySelectorAll('[data-news]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = form.querySelector('input'), msg = form.querySelector('.news-msg');
    const email = input.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
    const btn = form.querySelector('button'); if(btn) btn.disabled = true;
    try {
      const r = await fetch('/api/subscribe', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email})});
      const result = await r.json().catch(()=>({}));
      if (!r.ok || !result.ok) throw Error(result.error || 'Subscription is temporarily unavailable.');
      msg.textContent = 'Subscription request received.'; input.value = '';
    } catch (ex) { msg.textContent = ex.message || 'Unable to subscribe. Please try again.'; }
    finally { if(btn) btn.disabled = false; }
  }));

  document.querySelectorAll('[data-contact-form]').forEach(form => {
    const done = form.parentElement.querySelector('.ct-done'), btn = form.querySelector('.ct-send');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = Object.fromEntries(new FormData(form));
      btn.disabled = true;
      try {
        const r = await fetch('/api/contact', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)});
        const result = await r.json().catch(()=>({}));
        if (!r.ok || !result.ok) throw Error(result.error || 'Message could not be delivered.');
        done.querySelector('p').textContent = 'We received your message and will reply as soon as we can.';
        form.hidden = true; done.hidden = false;
      } catch (ex) {
        let msg = form.querySelector('.ct-error');
        if (!msg) { msg = document.createElement('p'); msg.className = 'ct-error'; msg.setAttribute('role','alert'); form.append(msg); }
        msg.textContent = ex.message || 'Unable to send message. Please try again.';
      } finally { btn.disabled = false; }
    });
    done.querySelector('[data-again]').addEventListener('click', () => { form.reset(); form.hidden = false; done.hidden = true; });
  });

  // Scroll reveal: elements with .rv fade/slide in when they enter the screen
  const reveal = document.querySelectorAll('.rv');
  if (reveal.length) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    reveal.forEach((el) => io.observe(el));
  }
})();
