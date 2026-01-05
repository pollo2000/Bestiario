document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a.btn-nav').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();

      const href = a.getAttribute('href');

      a.classList.add('is-leaving');

      setTimeout(() => {
        window.location.href = href;
      }, 200);
    });
  });
});
