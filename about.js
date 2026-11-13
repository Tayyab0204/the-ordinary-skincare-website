/* about.js — About page carousels */
(() => {

  document.querySelectorAll('[data-car]').forEach(root => {
    const tr = root.querySelector('.ab-car'), dots = root.querySelector('.ab-dots'), [prev, next] = root.querySelectorAll('.ab-arr button');
    const cards = [...tr.children], step = () => cards[0].getBoundingClientRect().width + 16;
    const pages = () => Math.max(1, Math.round((tr.scrollWidth - tr.clientWidth) / step()) + 1);
    const draw = () => { const n = pages(), i = Math.round(tr.scrollLeft / step()); dots.innerHTML = Array.from({ length: n }, (_, k) => `<button type="button" aria-label="Slide ${k + 1}" class="${k === Math.min(i, n - 1) ? 'is-on' : ''}"></button>`).join(''); };
    dots.addEventListener('click', e => { const k = [...dots.children].indexOf(e.target); if (k > -1) tr.scrollTo({ left: k * step() }); });
    prev.onclick = () => tr.scrollBy({ left: -step() }); next.onclick = () => tr.scrollBy({ left: step() });
    tr.addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true }); addEventListener('resize', draw); draw();
  });
})();
