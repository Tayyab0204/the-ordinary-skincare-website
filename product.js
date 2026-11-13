/**
 * The Ordinary — product page behaviour (gallery, zoom, quantity, tabs, reviews, scroll animations).
 * Shared by all 9 product pages. Add-to-bag, the menu and the bag drawer live in product-bridge.js + store.js.
 */

(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // --- TOAST NOTIFICATION ---
  const toastEl = document.getElementById('toastNotification');
  const toastMsgEl = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl || !toastMsgEl) return;
    toastMsgEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }

  // --- 1. GALLERY IMAGE SWITCHING ---
  const mainHeroImg = document.getElementById('mainHeroImage');
    const thumbBtns = document.querySelectorAll('.thumb-btn');

  thumbBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const clickedImgSrc = this.getAttribute('data-img');
      const currentMainSrc = mainHeroImg.getAttribute('src');

      if (!clickedImgSrc || clickedImgSrc === currentMainSrc) return;

      // Swap images
      mainHeroImg.setAttribute('src', clickedImgSrc);

      const thumbImg = this.querySelector('img');
      if (thumbImg) {
        thumbImg.setAttribute('src', currentMainSrc);
      }
      this.setAttribute('data-img', currentMainSrc);
    });
  });

  const mainImageWrap = document.querySelector('.main-image-wrap');

  // Deep Magnifier Hover Zoom with cursor position tracking
  if (mainImageWrap && mainHeroImg) {
    mainImageWrap.addEventListener('mouseenter', () => {
      mainHeroImg.style.transition = 'transform 0.15s ease-out';
      mainHeroImg.style.transform = 'scale(1.75)';
    });

    mainImageWrap.addEventListener('mousemove', (e) => {
      const rect = mainImageWrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      mainHeroImg.style.transformOrigin = `${x}% ${y}%`;
      mainHeroImg.style.transform = 'scale(1.75)';
    });

    mainImageWrap.addEventListener('mouseleave', () => {
      mainHeroImg.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      mainHeroImg.style.transformOrigin = 'center center';
      mainHeroImg.style.transform = 'scale(1)';
    });
  }

  // --- 2. QUANTITY CONTROLS ---
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyInput = document.getElementById('qtyInput');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) qtyInput.value = val - 1;
      qtyMinus.disabled = Number(qtyInput.value) <= 1;
      qtyPlus.disabled = Number(qtyInput.value) >= 99;
    });

    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = Math.min(99, val + 1);
      qtyMinus.disabled = Number(qtyInput.value) <= 1;
      qtyPlus.disabled = Number(qtyInput.value) >= 99;
    });

    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10);
      qtyInput.value = String(Math.max(1, Math.min(99, Number.isFinite(val) ? val : 1)));
      qtyMinus.disabled = Number(qtyInput.value) <= 1;
      qtyPlus.disabled = Number(qtyInput.value) >= 99;
    });
  }

  if (qtyMinus && qtyInput) qtyMinus.disabled = Number(qtyInput.value) <= 1;

  // --- 3. PRODUCT TABS ---
  const tabBtns = document.querySelectorAll('.tab-nav-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetTabId = this.getAttribute('data-tab');

      tabBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach((p) => p.classList.remove('active'));

      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      const targetPanel = document.getElementById(targetTabId);
      if (targetPanel) targetPanel.classList.add('active');
      tabPanels.forEach(p => { p.hidden = !p.classList.contains('active'); });
    });
  });

  if (tabBtns.length && tabPanels.length) {
    tabPanels.forEach(p => { p.hidden = !p.classList.contains('active'); });
    tabBtns.forEach((btn, i) => {
      btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');
      btn.addEventListener('keydown', e => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
        e.preventDefault();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabBtns.length-1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabBtns.length) % tabBtns.length;
        tabBtns[next].focus();tabBtns[next].click();
      });
      btn.addEventListener('click', () => tabBtns.forEach(b => b.setAttribute('tabindex', b === btn ? '0' : '-1')));
    });
  }

  // --- 6. REVIEWS: WRITE REVIEW MODAL (safe DOM building, no innerHTML) ---
  const reviewsContainer = document.getElementById('reviewsContainer');
  const writeReviewModal = document.getElementById('writeReviewBackdrop');
  const openWriteReviewBtn = document.getElementById('openWriteReviewBtn');
  const closeWriteReviewBtn = document.getElementById('closeWriteReviewBtn');
  const cancelReviewBtn = document.getElementById('cancelReviewBtn');
  const writeReviewForm = document.getElementById('writeReviewForm');
  const starSelect = document.getElementById('starSelect');
  const reviewRatingInput = document.getElementById('reviewRatingInput');

  function openWriteReview() {
    if (writeReviewModal) writeReviewModal.classList.add('open');
  }
  function closeWriteReview() {
    if (writeReviewModal) writeReviewModal.classList.remove('open');
  }

  if (openWriteReviewBtn) openWriteReviewBtn.addEventListener('click', openWriteReview);
  if (closeWriteReviewBtn) closeWriteReviewBtn.addEventListener('click', closeWriteReview);
  if (cancelReviewBtn) cancelReviewBtn.addEventListener('click', closeWriteReview);
  if (writeReviewModal) {
    writeReviewModal.addEventListener('click', (e) => {
      if (e.target === writeReviewModal) closeWriteReview();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeWriteReview();
    }
  });

  // Star selector: starts empty, hover previews, click fills; readout shows N/5
  const ratingWords = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  const ratingGroup = document.getElementById('ratingGroup');
  const ratingReadout = document.getElementById('ratingReadout');
  const starBtns = starSelect ? Array.from(starSelect.querySelectorAll('.rm-star')) : [];
  const formError = document.getElementById('reviewFormError');
  const reviewTextEl = document.getElementById('reviewText');
  const reviewCountEl = document.getElementById('reviewCount');
  let selectedRating = 0;

  function paintStars(n) {
    starBtns.forEach((s) => {
      s.classList.toggle('filled', parseInt(s.getAttribute('data-rating'), 10) <= n);
    });
  }

  function updateReadout() {
    if (!ratingReadout) return;
    if (selectedRating) {
      ratingReadout.innerHTML = '<strong>' + selectedRating + '/5</strong>' + ratingWords[selectedRating];
    } else {
      ratingReadout.textContent = 'Select a rating';
    }
  }

  function resetRating() {
    selectedRating = 0;
    if (reviewRatingInput) reviewRatingInput.value = '';
    paintStars(0);
    updateReadout();
    if (ratingGroup) ratingGroup.classList.remove('needs-rating');
  }

  starBtns.forEach((star) => {
    const n = parseInt(star.getAttribute('data-rating'), 10);
    star.addEventListener('mouseenter', () => paintStars(n));
    star.addEventListener('focus', () => paintStars(n));
    star.addEventListener('click', () => {
      selectedRating = n;
      if (reviewRatingInput) reviewRatingInput.value = n;
      paintStars(n);
      updateReadout();
      if (ratingGroup) ratingGroup.classList.remove('needs-rating');
      if (formError) formError.textContent = '';
    });
  });
  if (starSelect) {
    starSelect.addEventListener('mouseleave', () => paintStars(selectedRating));
    starSelect.addEventListener('focusout', () => paintStars(selectedRating));
  }
  resetRating();

  if (reviewTextEl && reviewCountEl) {
    reviewTextEl.addEventListener('input', () => {
      reviewCountEl.textContent = reviewTextEl.value.length + ' / 400';
    });
  }

  // --- Reviews live on the server (Cloudflare D1). The browser only keeps a secret token for the reviews THIS visitor wrote, so only they can remove them. ---
  const PRODUCT_ID = document.body.dataset.productId || '';
  const OWN_KEY = (document.body.dataset.reviewsKey || 'ordinary_reviews_v1') + '_own';
  function loadOwn() {
    try {
      const o = JSON.parse(localStorage.getItem(OWN_KEY) || '{}');
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    } catch (e) { return {}; }
  }
  function saveOwn(o) {
    try { localStorage.setItem(OWN_KEY, JSON.stringify(o)); } catch (e) { /* storage unavailable */ }
  }
  async function reviewApi(method, url, body) {
    const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    let data = null;
    try { data = await res.json(); } catch (e) { /* not JSON */ }
    if (!res.ok || !data || !data.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
    return data;
  }

  function updateRatingSummary() {
    if (!reviewsContainer) return;
    const ratings = Array.from(reviewsContainer.querySelectorAll('.review-item'))
      .map((i) => parseFloat(i.dataset.rating))
      .filter((n) => !isNaN(n));
    const n = ratings.length;
    const avg = n ? ratings.reduce((a, b) => a + b, 0) / n : 0;

    const avgEl = document.getElementById('ratingAvg');
    const starsEl = document.getElementById('ratingStars');
    const countEl = document.getElementById('ratingCount');
    if (avgEl) avgEl.textContent = avg.toFixed(1);
    if (starsEl) {
      const full = Math.round(avg);
      starsEl.textContent = '★'.repeat(full) + '☆'.repeat(5 - full);
      starsEl.setAttribute('aria-label', avg.toFixed(1) + ' out of 5 stars');
    }
    if (countEl) countEl.textContent = n + (n === 1 ? ' review' : ' reviews');

    for (let s = 5; s >= 1; s--) {
      const c = ratings.filter((r) => Math.round(r) === s).length;
      const pct = n ? Math.round((c / n) * 100) : 0;
      const bar = document.querySelector('[data-bar="' + s + '"]');
      const val = document.querySelector('[data-barval="' + s + '"]');
      if (bar) bar.style.width = pct + '%';
      if (val) val.textContent = pct + '%';
    }
  }

  async function removeUserReview(id, node) {
    const own = loadOwn();
    try {
      await reviewApi('DELETE', '/api/reviews', { id: id, token: own[id] });
    } catch (e) {
      showToast(e.message || 'Could not remove your review.');
      return;
    }
    delete own[id];
    saveOwn(own);
    if (node && node.parentNode) node.parentNode.removeChild(node);
    updateRatingSummary();
    showToast('Your review was removed.');
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildReviewItem(d) {
    const item = el('article', 'review-item');
    if (d.ratingNum) item.dataset.rating = String(d.ratingNum);
    if (d.id) item.dataset.id = d.id;
    const main = el('div', 'review-main');

    const person = el('div', 'review-person');
    const avatar = el('div', 'review-avatar', d.initials);
    avatar.setAttribute('aria-hidden', 'true');
    const who = el('div');
    who.appendChild(el('h3', 'review-name', d.name));
    const rating = el('div', 'review-rating');
    const star = el('span', 'review-star', '★');
    star.setAttribute('aria-hidden', 'true');
    rating.appendChild(star);
    rating.appendChild(el('span', '', String(d.rating)));
    who.appendChild(rating);
    person.appendChild(avatar);
    person.appendChild(who);

    const meta = el('dl', 'review-meta');
    [['Age', d.age], ['Texture', d.texture], ['Skin type', d.skin]].forEach(([k, v]) => {
      const row = el('div');
      row.appendChild(el('dt', '', k));
      row.appendChild(el('dd', '', v));
      meta.appendChild(row);
    });

    main.appendChild(person);
    main.appendChild(el('p', 'review-text', d.text));
    main.appendChild(meta);

    if (d.id && loadOwn()[d.id]) {
      const rm = el('button', 'review-remove', 'Remove my review');
      rm.type = 'button';
      rm.addEventListener('click', () => removeUserReview(d.id, item));
      main.appendChild(rm);
    }

    const wrap = el('div', 'review-photo-wrap');
    const img = document.createElement('img');
    img.src = d.photo;
    img.alt = 'Review photo by ' + d.name;
    img.loading = 'lazy';
    wrap.appendChild(img);

    item.appendChild(main);
    item.appendChild(wrap);
    return item;
  }

  // Load everyone's reviews from the server (appended after the sample reviews). If the server is unreachable the page still works.
  if (reviewsContainer && PRODUCT_ID) {
    reviewApi('GET', '/api/reviews?product=' + encodeURIComponent(PRODUCT_ID)).then((res) => {
      res.reviews.forEach((r) => {
        if (reviewsContainer.querySelector('[data-id="' + r.id + '"]')) return;
        const card = buildReviewItem(r);
        card.classList.add('is-visible');
        reviewsContainer.appendChild(card);
      });
      updateRatingSummary();
    }).catch(() => {});
  }
  updateRatingSummary();

  if (writeReviewForm) {
    writeReviewForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('reviewAuthor').value.trim();
      const age = document.getElementById('reviewAge').value.trim();
      const texture = document.getElementById('reviewTexture').value.trim();
      const text = reviewTextEl.value.trim();
      const skinEl = writeReviewForm.querySelector('input[name="reviewSkin"]:checked');
      const photoEl = writeReviewForm.querySelector('input[name="reviewPhoto"]:checked');

      if (!selectedRating) {
        if (ratingGroup) ratingGroup.classList.add('needs-rating');
        if (formError) formError.textContent = 'Please select a star rating.';
        return;
      }
      if (!name || !age || !texture || !text || !skinEl || !photoEl) {
        if (formError) formError.textContent = 'Please fill in all fields.';
        return;
      }
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 99) {
        if (formError) formError.textContent = 'Please enter a valid age.';
        return;
      }

      const submitBtn = writeReviewForm.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      let res;
      try {
        res = await reviewApi('POST', '/api/reviews', {
          product: PRODUCT_ID, name: name, ratingNum: selectedRating, text: text,
          age: ageNum, texture: texture, skin: skinEl.value, photo: photoEl.value,
        });
      } catch (err) {
        if (formError) formError.textContent = err.message || 'Could not post your review. Please try again.';
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      if (submitBtn) submitBtn.disabled = false;

      // remember the secret token so this visitor (only) can remove their review later
      const own = loadOwn();
      own[res.review.id] = res.token;
      saveOwn(own);

      // show it right away at the bottom of the list
      const card = buildReviewItem(res.review);
      card.classList.add('is-visible', 'is-new');
      if (reviewsContainer) reviewsContainer.appendChild(card);
      updateRatingSummary();

      closeWriteReview();
      writeReviewForm.reset();
      resetRating();
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
      setTimeout(() => card.classList.remove('is-new'), 2600);
      if (reviewCountEl) reviewCountEl.textContent = '0 / 400';
      if (formError) formError.textContent = '';
      showToast('Thank you! Your review is now live below.');
    });
  }

  // Staggered reveal for review items
  const reviewItems = document.querySelectorAll('.review-item');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const i = Array.from(reviewItems).indexOf(entry.target);
          entry.target.style.transitionDelay = `${(i % 2) * 120}ms`;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reviewItems.forEach((item) => io.observe(item));
  } else {
    reviewItems.forEach((item) => item.classList.add('is-visible'));
  }

  // --- 9. PAGE ANIMATIONS (scroll reveal + progress bar) ---
  const progressEl = document.getElementById('scrollProgress');
  if (progressEl) {
    const setProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressEl.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', setProgress, { passive: true });
    window.addEventListener('resize', setProgress);
    setProgress();
  }

  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (motionOK && 'IntersectionObserver' in window) {
    const tag = (selector, variant, step, base) => {
      document.querySelectorAll(selector).forEach((node, i) => {
        node.setAttribute('data-reveal', variant);
        node.style.setProperty('--d', (base || 0) + i * (step || 0) + 'ms');
      });
    };

    // Hero
    tag('.thumb-btn', 'up', 90, 100);
    tag('.main-image-wrap', 'clip', 0, 0);
    tag('.product-title', 'up', 0, 150);
    tag('.product-description', 'up', 0, 250);
    tag('.price-row', 'up', 0, 330);
    tag('.purchase-row', 'up', 0, 410);
    tag('.tabs-block', 'up', 0, 490);

    // Ritual
    tag('.section-header-center', 'up', 0, 0);
    tag('.ritual-card', 'left', 140, 100);
    tag('.ritual-image-col', 'clip-r', 0, 150);

    // Reviews
    tag('.reviews-header-block > div:first-child', 'up', 0, 0);
    tag('.rating-summary-card', 'up', 0, 150);
    tag('.benefit-card', 'up', 110, 0);

    // You might also like
    tag('.collection-header', 'up', 0, 0);
    tag('.pc-card', 'up', 140, 100);

    // Footer
    tag('.footer-grid > *', 'up', 90, 0);
    tag('.footer-bottom-bar', 'fade', 0, 300);

    // Clipped elements (image reveals) can't report their own visibility, so watch their parent instead
    const revealTargets = new Map();
    document.querySelectorAll('[data-reveal]').forEach((node) => {
      const v = node.getAttribute('data-reveal');
      const target = (v === 'clip' || v === 'clip-r') && node.parentElement ? node.parentElement : node;
      if (!revealTargets.has(target)) revealTargets.set(target, []);
      revealTargets.get(target).push(node);
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (revealTargets.get(entry.target) || []).forEach((n) => n.classList.add('in'));
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealTargets.forEach((_, target) => revealObserver.observe(target));
  }

})();
