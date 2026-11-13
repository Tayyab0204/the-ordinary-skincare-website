/* Phase 2: accessible global product search and category navigation. */
(function(){
'use strict';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let panel=null, opener=null, lastFocus=null;
function products(){return Array.isArray(window.PRODUCTS)?window.PRODUCTS:[]}
function init(){
 const nav=document.querySelector('.site-nav'),links=nav&&nav.querySelector('.site-links');
 if(!links||document.querySelector('.p2-search-trigger'))return false;
 const trigger=document.createElement('button');trigger.type='button';trigger.className='p2-search-trigger';trigger.setAttribute('aria-label','Search skincare products');trigger.setAttribute('aria-haspopup','dialog');trigger.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>';
 links.insertBefore(trigger,links.querySelector('.site-bag'));
 opener=trigger;
 const shop=document.createElement('div');shop.className='p2-shop';shop.innerHTML='<button class="p2-shop-button" type="button" aria-expanded="false" aria-controls="p2-categories">Shop <svg class="p2-chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5L5 7l3.5-3.5"/></svg></button><div class="p2-shop-menu" id="p2-categories" hidden><div class="p2-menu-head"><span>SHOP BY CONCERN</span><button type="button" class="p2-menu-close" aria-label="Close menu">×</button></div><a href="shop.html">All serums <span>↗</span></a><a href="shop.html?tab=Brightening#products">Brightening <span>↗</span></a><a href="shop.html?tab=Hydration#products">Hydration <span>↗</span></a><a href="shop.html?tab=Anti-Aging#products">Anti-Aging <span>↗</span></a><a href="shop.html?tab=Acne%20%26%20Pores#products">Acne & pores <span>↗</span></a><a href="shop.html?tab=Eye%20Care#products">Eye care <span>↗</span></a></div>';
 const collection=[...links.querySelectorAll('a')].find(a=>a.getAttribute('href')==='shop.html');
 if(collection){collection.before(shop);collection.classList.add('p2-collection-backup');if(collection.classList.contains('is-current'))shop.querySelector('button').classList.add('is-current')}
 const shopButton=shop.querySelector('button'),menu=shop.querySelector('.p2-shop-menu');
 const hideShop=()=>{shopButton.setAttribute('aria-expanded','false');menu.hidden=true};
 menu.querySelector('.p2-menu-close').addEventListener('click',()=>{hideShop();shopButton.focus()});
 shopButton.addEventListener('click',()=>{let open=menu.hidden;menu.hidden=!open;shopButton.setAttribute('aria-expanded',String(open))});
 document.addEventListener('click',e=>{if(!shop.contains(e.target))hideShop()});
 panel=document.createElement('div');panel.className='p2-overlay';panel.hidden=true;
 panel.innerHTML='<div class="p2-search-backdrop" data-close-search></div><section class="p2-dialog" role="dialog" aria-modal="true" aria-label="Search skincare products"><div class="p2-search-top"><span>FIND YOUR FORMULA</span><button class="p2-close" type="button" aria-label="Close search">×</button></div><form class="p2-search-form" action="#" role="search"><label class="p2-input-line"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input type="search" enterkeyhint="search" inputmode="search" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Search products, ingredients, concerns…" aria-label="Search products"></label></form><div class="p2-chips"><button type="button" data-term="Niacinamide">Niacinamide</button><button type="button" data-term="Hydration">Hydration</button><button type="button" data-term="Brightening">Brightening</button><button type="button" data-term="Pores">Pores</button></div><div class="p2-results-head"><span data-results-label>POPULAR PRODUCTS</span><span data-results-count></span></div><div class="p2-results" id="p2-search-results" aria-live="polite"></div><a class="p2-view-all" href="shop.html">Explore complete collection <span>→</span></a></section>';
 document.body.appendChild(panel);
 const input=panel.querySelector('input'),results=panel.querySelector('.p2-results');
 function find(q){q=(q||'').toLowerCase().trim();return products().filter(p=>[p.name,p.concern,p.type,...(p.concerns||[]),...(p.points||[])].join(' ').toLowerCase().includes(q))}
 panel.querySelector('.p2-search-form').addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q)return;const m=find(q);input.blur();if(m.length===1)location.href=m[0].href||'shop.html';else if(m.length>1)location.href='shop.html?q='+encodeURIComponent(q)+'#products';else{render();input.focus()}});
 function render(){
  const q=input.value.toLowerCase().trim(),matches=products().filter(p=>[p.name,p.concern,p.type,...(p.concerns||[]),...(p.points||[])].join(' ').toLowerCase().includes(q));
  panel.querySelector('[data-results-label]').textContent=q?'SEARCH RESULTS':'POPULAR PRODUCTS';panel.querySelector('[data-results-count]').textContent=matches.length+' products';
  results.innerHTML=matches.length?matches.map(p=>`<a class="p2-result" href="${esc(p.href||'shop.html')}"><img src="${esc(p.image)}" alt="" loading="lazy"><span class="p2-result-details"><strong>${esc(p.name)}</strong><small>${esc(p.concern)} · ${esc(p.type||'Serum')}</small></span><span class="p2-go" aria-hidden="true">↗</span></a>`).join(''):'<div class="p2-no-results"><strong>No matching products</strong><span>Try an ingredient or skin concern, or browse the full collection.</span></div>';
 }
 function close(){panel.hidden=true;document.body.classList.remove('p2-search-open');if(lastFocus&&lastFocus.focus)lastFocus.focus()}
 function open(){hideShop();lastFocus=document.activeElement;panel.hidden=false;document.body.classList.add('p2-search-open');input.value='';render();input.focus()}
 trigger.addEventListener('click',open);panel.querySelector('.p2-close').addEventListener('click',close);panel.querySelector('[data-close-search]').addEventListener('click',close);
 panel.querySelectorAll('[data-term]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.term;render();input.focus()}));input.addEventListener('input',render);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!panel.hidden)close();hideShop()}if(!panel.hidden&&e.key==='Tab'){const els=[...panel.querySelectorAll('button:not([disabled]), input, a[href]')].filter(el=>el.getClientRects().length);const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 const navScroll=()=>{nav.classList.toggle('p2-condensed',window.scrollY>85)};window.addEventListener('scroll',navScroll,{passive:true});navScroll();
 return true;
}
let i=0;function tryInit(){if(!init()&&i++<60)setTimeout(tryInit,80)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryInit);else tryInit();
})();
