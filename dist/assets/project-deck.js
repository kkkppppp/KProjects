/* A scroll-driven deck. Keep native scrolling and native project links. */
(() => {
  const mobile = matchMedia('(max-width:759px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let deck, cards = [], cardHeight = 0, step = 0, top = 84, enabled = false, frame = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function draw() {
    frame = 0;
    if (!enabled || !deck?.isConnected) return;
    const progress = clamp((top - deck.getBoundingClientRect().top) / step, 0, cards.length - 1);
    cards.forEach((card, index) => {
      const distance = index - progress;
      // The front card lifts away; the cards behind retain visible, separated edges.
      const y = distance >= 0 ? distance * 28 : Math.max(distance, -1) * (cardHeight + 30);
      const scale = 1 - Math.max(distance, 0) * .025;
      card.style.transform = `translate3d(0,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
      card.style.zIndex = String(cards.length - index);
      card.style.pointerEvents = index === Math.min(Math.floor(progress + .9), cards.length - 1) ? 'auto' : 'none';
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  function layout() {
    deck = document.querySelector('#dc-root .project-deck');
    if (!deck) { enabled = false; return; }
    cards = Array.from(deck.querySelectorAll('.project-card'));
    const header = document.querySelector('#dc-root header');
    top = (header?.getBoundingClientRect().height || 68) + 16;
    // Reserve room for the sticky header and the exposed edges of the deck.
    const viewport = document.documentElement.clientHeight || innerHeight;
    cardHeight = clamp(viewport - top - 90, 310, 580);
    step = cardHeight + 30;
    enabled = mobile.matches && !reduced.matches && viewport >= 500 && cards.length > 1;
    deck.setAttribute('data-stack', String(enabled));
    deck.style.setProperty('--card-height', cardHeight + 'px');
    deck.style.setProperty('--stage-height', (cardHeight + 64) + 'px');
    deck.style.setProperty('--deck-travel', ((cards.length - 1) * step) + 'px');
    deck.style.setProperty('--deck-top', top + 'px');
    if (!enabled) cards.forEach(card => {card.style.transform = '';card.style.zIndex = '';card.style.pointerEvents = '';});
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
