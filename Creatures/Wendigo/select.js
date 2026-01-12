(() => {
  const root = document.querySelector(".entry-body");
  if (!root) return;

  // Quita highlights previos
  function clearHighlights() {
    root.querySelectorAll("span.hl").forEach(span => {
      const parent = span.parentNode;
      parent.replaceChild(document.createTextNode(span.textContent), span);
      parent.normalize();
    });
  }

  function highlightSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    // Solo si la selección está dentro del texto del artículo
    if (!root.contains(range.commonAncestorContainer)) return;

    // Extrae contenido y envuélvelo
    const contents = range.extractContents();
    const wrapper = document.createElement("span");
    wrapper.className = "hl";
    wrapper.appendChild(contents);

    range.insertNode(wrapper);

    // Limpia selección para que se vea el highlight custom
    sel.removeAllRanges();
  }

  // Modo: Alt + selección => highlight redondeado
  let altDown = false;

  window.addEventListener("keydown", (e) => {
    if (e.key === "Alt") altDown = true;
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "Alt") altDown = false;
  });

  // Cuando sueltas el mouse, si estaba Alt presionado, convertir a highlight custom
  document.addEventListener("mouseup", () => {
    if (!altDown) return;
    // no mezclar con highlights previos
    clearHighlights();
    highlightSelection();
  });

  // Extra: click fuera para limpiar (opcional)
  document.addEventListener("mousedown", (e) => {
    if (!root.contains(e.target)) clearHighlights();
  });
})();
