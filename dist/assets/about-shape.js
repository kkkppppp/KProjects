/* Keep the biography as accessible, translatable text; shape only its line box. */
(() => {
  const media = matchMedia('(max-width:759px)');
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d');
  let paragraph, resize, observer, frame;
  function schedule() { if (!frame) frame = requestAnimationFrame(layout); }
  function layout() {
    frame = 0;
    if (!paragraph?.isConnected || !media.matches || !measure) return;
    const style = getComputedStyle(paragraph);
    const width = paragraph.clientWidth;
    if (!width) return;
    measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const words = paragraph.textContent.trim().split(/\s+/);
    const space = measure.measureText(' ').width;
    const sizes = words.map(word => measure.measureText(word).width);
    // Match the two triangular exclusions, including the full line-box band.
    for (let lines = 3; lines <= 40; lines++) {
      let word = 0;
      for (let line = 0; line < lines && word < sizes.length; line++) {
        const edge = Math.max(Math.abs(2 * line / lines - 1), Math.abs(2 * (line + 1) / lines - 1));
        const available = width * (1 - .36 * edge) - 2;
        let used = sizes[word++];
        while (word < sizes.length && used + space + sizes[word] <= available) used += space + sizes[word++];
      }
      if (word === sizes.length) {
        paragraph.style.setProperty('--bio-shape-height', `${lines * parseFloat(style.lineHeight)}px`);
        return;
      }
    }
  }
  function connect() {
    const next = document.querySelector('.about-copy>p');
    if (next === paragraph) return;
    resize?.disconnect(); observer?.disconnect(); paragraph = next;
    if (!paragraph) return;
    if (!paragraph.querySelector(".bio-shape-left")) {
      const left = document.createElement("span"), right = document.createElement("span");
      left.className = "bio-shape-left"; right.className = "bio-shape-right";
      left.setAttribute("aria-hidden", "true"); right.setAttribute("aria-hidden", "true");
      paragraph.prepend(left, right);
    }
    resize = new ResizeObserver(schedule); resize.observe(paragraph);
    observer = new MutationObserver(schedule); observer.observe(paragraph, {childList:true,characterData:true,subtree:true});
    schedule();
  }
  new MutationObserver(connect).observe(document.body, {childList:true,subtree:true});
  media.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  connect();
})();
