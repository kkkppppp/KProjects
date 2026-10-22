/* A scroll-driven deck. Keep native scrolling and native project links. */
(() => {
  const mobile = matchMedia('(max-width:759px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let deck, cards = [], cardHeight = 0, step = 0, top = 108, enabled = false, frame = 0;
  let stableViewport = 0, viewportWidth = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function draw() {
    frame = 0;
    if (!enabled || !deck?.isConnected) return;
    const raw = clamp((top - deck.getBoundingClientRect().top) / step, 0, cards.length - 1);
    const fraction = raw - Math.floor(raw);
    const progress = Math.floor(raw) + fraction * fraction * (3 - 2 * fraction);
    cards.forEach((card, index) => {
      const distance = index - progress;
      // Move the opaque front card away to reveal the next physical card.
      const y = distance >= 0 ? distance * 20 : Math.max(distance, -1) * (cardHeight + 44);
      const scale = distance >= 0 ? 1 - distance * .018 : 1 + Math.max(distance, -1) * .018;
      card.style.transform = `translate3d(0,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
      card.style.setProperty('opacity', '1', 'important');
      card.style.zIndex = String(cards.length - index);
      card.style.pointerEvents = index === Math.min(Math.floor(progress + .5), cards.length - 1) ? 'auto' : 'none';
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  function layout() {
    deck = document.querySelector('#dc-root .project-deck');
    if (!deck) { enabled = false; return; }
    cards = Array.from(deck.querySelectorAll('.project-card'));
    const header = document.querySelector('#dc-root header');
    top = (header?.getBoundingClientRect().height || 68) + 40;
    // Reserve room for the sticky header and the exposed edges of the deck.
    const currentHeight = document.documentElement.clientHeight || innerHeight;
    const width = document.documentElement.clientWidth || window.innerWidth || 390;
    // Ignore mobile browser toolbar height changes to keep scroll progress stable.
    if (!stableViewport || width !== viewportWidth || Math.abs(currentHeight - stableViewport) > 140) {
      stableViewport = currentHeight; viewportWidth = width;
    }
    const viewport = stableViewport;
    cardHeight = clamp(viewport - top - 56, 300, 640);
    step = cardHeight + 30;
    enabled = mobile.matches && !reduced.matches && viewport >= 500 && cards.length > 1;
    deck.setAttribute('data-stack', String(enabled));
    deck.style.setProperty('--card-height', cardHeight + 'px');
    deck.style.setProperty('--stage-height', (cardHeight + 44) + 'px');
    deck.style.setProperty('--deck-travel', ((cards.length - 1) * step) + 'px');
    deck.style.setProperty('--deck-top', top + 'px');
    if (!enabled) cards.forEach(card => {card.style.transform = '';card.style.removeProperty('opacity');card.style.zIndex = '';card.style.pointerEvents = '';});
    schedule();
  }
  new MutationObserver(records => {
    // Only reconfigure when the route's deck or cards mount, not on translations.
    if (records.some(r => Array.from(r.addedNodes).some(n => n.nodeType === 1 &&
      (n.matches?.('.project-deck,.project-card') || n.querySelector?.('.project-deck,.project-card'))))) layout();
  }).observe(document.body, {childList:true,subtree:true});
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', layout, {passive:true});
  mobile.addEventListener('change', layout);
  reduced.addEventListener('change', layout);
  document.addEventListener('focusin', event => {
    if (!enabled) return;
    const index = cards.indexOf(event.target.closest?.('.project-card'));
    if (index < 0) return;
    window.scrollTo({top:scrollY + deck.getBoundingClientRect().top - top + index * step,behavior:'instant'});
    schedule();
  });
  layout();
})();
