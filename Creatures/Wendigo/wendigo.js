document.addEventListener("DOMContentLoaded", () => {
  const entry = document.querySelector(".entry");
  const btn = document.querySelector(".entry-toggle");
  if (!entry || !btn) return;

  btn.addEventListener("click", () => {
    entry.classList.toggle("is-collapsed");
    const isCollapsed = entry.classList.contains("is-collapsed");
    btn.setAttribute("aria-expanded", String(!isCollapsed));
  });
});
