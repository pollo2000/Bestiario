class TextMask extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute("src") || "";
    const type = (this.getAttribute("type") || "video").toLowerCase();
    const fontFamily = this.getAttribute("font-family") || "Alfa Slab One";
    const fontSize = this.getAttribute("font-size") || "140";
    const viewBox = this.getAttribute("viewBox") || "0 0 650 306";
    const preserve = this.getAttribute("preserveAspectRatio") || "xMidYMid meet";
    const raw = this.innerHTML.trim();
    const hasTspans = /<\s*tspan[\s>]/i.test(raw);
    const labelText = (this.textContent || "").trim();
    const textInside = hasTspans
      ? raw
      : escapeHtml(labelText);
    const maskId = `textMask-${uniqueId()}`;
    this.innerHTML = `
      <div class="tm-root">
        <svg class="tm-svg" viewBox="${viewBox}" preserveAspectRatio="${preserve}">
          <defs>
            <mask id="${maskId}">
              <rect width="100%" height="100%" fill="black" />
              <text
                class="tm-text"
                x="0" y="0"
                text-anchor="start"
                dominant-baseline="hanging"
                font-size="${fontSize}"
                font-family="${escapeAttr(fontFamily)}"
                fill="white"
              >
                ${textInside}
              </text>
            </mask>
          </defs>

          <foreignObject width="100%" height="100%" mask="url(#${maskId})">
            <div class="tm-fill" xmlns="http://www.w3.org/1999/xhtml">
              ${renderFill(type, src)}
            </div>
          </foreignObject>
        </svg>
      </div>
    `;
    if (!document.getElementById("tm-styles")) {
      const style = document.createElement("style");
      style.id = "tm-styles";
      style.textContent = `
        text-mask { display:block; }
        .tm-root { width: 100%; }
        .tm-svg { width: 100%; height: auto; display:block; }
        .tm-fill { width:100%; height:100%; }
        .tm-fill video, .tm-fill img {
          width:100%; height:100%;
          object-fit: cover;
          display:block;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

customElements.define("text-mask", TextMask);

function renderFill(type, src) {
  const safeSrc = escapeAttr(src);

  if (type === "image" || type === "img" || type === "photo") {
    return `<img src="${safeSrc}" alt="" draggable="false" />`;
  }
  return `
    <video autoplay muted loop playsinline>
      <source src="${safeSrc}" type="video/mp4" />
    </video>
  `;
}

function uniqueId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return String(str).replaceAll('"', "&quot;");
}

class CollapseText extends HTMLElement {
  static get observedAttributes() {
    return ["open", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        :host{
          display:block;
          /* Ajustes fáciles desde fuera */
          --ct-gap: .6rem;
          --ct-radius: 10px;
          --ct-speed: 700ms;
          --ct-ease: cubic-bezier(.25,.1,.25,1);
          --ct-opacity: .75;
          --ct-btn-size: 44px;
        }

        .head{
          display:flex;
          align-items:center;
          gap: var(--ct-gap);
          margin-bottom: .6rem;
        }

        button{
          all: unset;
          cursor: pointer;

          width: var(--ct-btn-size);
          height: var(--ct-btn-size);

          display:inline-flex;
          align-items:center;
          justify-content:center;

          border-radius: 999px;
          opacity: var(--ct-opacity);

          -webkit-tap-highlight-color: transparent;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        button:hover{ opacity: 1; }
        button:active{ transform: scale(.96); }

        .arrow{
          display:inline-block;
          font-size: 1rem;
          transition: transform 260ms ease;
          transform-origin: center;
        }

        :host([open]) .arrow{
          transform: rotate(0deg);
        }
        :host(:not([open])) .arrow{
          transform: rotate(-90deg);
        }

        .title{
          /* título se comporta como texto normal */
          margin: 0;
          padding: 0;
          line-height: 1.1;
          display:flex;
          align-items:center;
        }

        /* ===== Animación de layout (quita el espacio) ===== */
        .wrap{
          display:grid;
          grid-template-rows: 1fr;
          transition: grid-template-rows var(--ct-speed) var(--ct-ease);
        }
        :host(:not([open])) .wrap{
          grid-template-rows: 0fr;
        }

        /* ===== Animación visual (desaparece de abajo a arriba) ===== */
        .body{
          overflow:hidden;

          -webkit-clip-path: inset(0 0 0 0);
          clip-path: inset(0 0 0 0);

          opacity: 1;
          transform: translateY(0);

          transition:
            -webkit-clip-path var(--ct-speed) var(--ct-ease),
            clip-path var(--ct-speed) var(--ct-ease),
            opacity 300ms ease,
            transform var(--ct-speed) var(--ct-ease);
        }

        :host(:not([open])) .body{
          -webkit-clip-path: inset(0 0 100% 0);
          clip-path: inset(0 0 100% 0);
          opacity: 0;
          transform: translateY(-6px);
        }
      </style>

      <div class="head">
        <button type="button" part="toggle" aria-expanded="false">
          <span class="arrow" aria-hidden="true">▾</span>
        </button>
        <div class="title" part="title"></div>
      </div>

      <div class="wrap">
        <div class="body" part="body">
          <slot></slot>
        </div>
      </div>
    `;

    this._btn = this.shadowRoot.querySelector("button");
    this._titleEl = this.shadowRoot.querySelector(".title");

    this._onToggle = () => this.toggle();
  }

  connectedCallback() {
    // título inicial
    this._syncTitle();

    // estado inicial: si no tiene [open], arranca cerrado
    this._syncAria();

    this._btn.addEventListener("click", this._onToggle);

    // Accesibilidad: permitir toggle con Enter/Espacio en el botón (ya lo hace button),
    // y también si alguien clickea el título (opcional: título clickeable)
    this.shadowRoot.querySelector(".title").addEventListener("click", this._onToggle);
  }

  disconnectedCallback() {
    this._btn.removeEventListener("click", this._onToggle);
  }

  attributeChangedCallback(name) {
    if (name === "title") this._syncTitle();
    if (name === "open") this._syncAria();
  }

  _syncTitle() {
    const t = this.getAttribute("title") || "";
    this._titleEl.textContent = t;
  }

  _syncAria() {
    const isOpen = this.hasAttribute("open");
    this._btn.setAttribute("aria-expanded", String(isOpen));
  }

  open() {
    this.setAttribute("open", "");
  }

  close() {
    this.removeAttribute("open");
  }

  toggle() {
    if (this.hasAttribute("open")) this.close();
    else this.open();
  }
}

customElements.define("collapse-text", CollapseText);
