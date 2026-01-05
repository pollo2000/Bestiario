(() => {
  const bar = document.getElementById('topbar');
  if (!bar) return;

  let lastY = window.scrollY;
  let ticking = false;

  const THRESHOLD = 10; // evita parpadeo por micro-scroll

  function onScroll() {
    const y = window.scrollY;
    const delta = y - lastY;

    // cerca de arriba: siempre visible
    if (y < 20) {
      bar.classList.remove('is-hidden');
      lastY = y;
      return;
    }

    if (Math.abs(delta) > THRESHOLD) {
      if (delta > 0) {
        // bajando
        bar.classList.add('is-hidden');
      } else {
        // subiendo
        bar.classList.remove('is-hidden');
      }
      lastY = y;
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
