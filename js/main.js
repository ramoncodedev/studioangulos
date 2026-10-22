document.documentElement.classList.add("js");
// Número do WhatsApp do estúdio (somente dígitos, com DDI e DDD)
const WHATSAPP = "5573981901571";

// navegação: fundo sólido após rolar + menu mobile
const nav = document.querySelector(".nav");
const menu = document.getElementById("menu");
const menuBtn = document.querySelector(".menu-btn");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40 || menu.classList.contains("open"));
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

function setMenu(open) {
  menu.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  onScroll();
}
menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// botões "Quero começar" / "Assinar" pré-selecionam o interesse no formulário
const select = document.querySelector('select[name="interesse"]');
document.querySelectorAll("[data-interesse]").forEach((a) =>
  a.addEventListener("click", () => {
    const v = a.dataset.interesse;
    const opt = [...select.options].find((o) => o.text === v);
    if (opt) select.value = opt.value || opt.text;
  })
);

// formulário: valida e abre conversa no WhatsApp
const form = document.getElementById("form");
const err = document.getElementById("form-error");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  if (!d.nome.trim() || !/^\S+@\S+\.\S+$/.test(d.email.trim())) {
    err.textContent = "Preencha seu nome e um e-mail válido para continuar.";
    err.hidden = false;
    (d.nome.trim() ? form.email : form.nome).focus();
    return;
  }
  err.hidden = true;
  const texto = [
    `Olá! Meu nome é ${d.nome.trim()}.`,
    d.interesse ? `Tenho interesse em: ${d.interesse}.` : "",
    d.mensagem.trim(),
    `E-mail: ${d.email.trim()}`,
  ].filter(Boolean).join("\n");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
});

// sobre: revela palavra por palavra conforme a rolagem
(function () {
  const wrap = document.querySelector("[data-reveal]");
  if (!wrap) return;
  const words = [];
  wrap.querySelectorAll("[data-split]").forEach((el) => {
    const frag = document.createDocumentFragment();
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
          const s = document.createElement("span");
          s.className = "rw"; s.textContent = p; words.push(s); frag.appendChild(s);
        });
      } else frag.appendChild(n.cloneNode(true));
    });
    el.textContent = ""; el.appendChild(frag);
  });
  const cta = wrap.querySelector(".reveal-cta");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let ticking = false;
  function update() {
    ticking = false;
    if (reduce.matches) return;
    const r = wrap.getBoundingClientRect();
    const p = clamp(-r.top / (window.innerHeight * 1.5 * 0.85));
    const n = words.length;
    words.forEach((w, i) => { w.style.opacity = (0.14 + 0.86 * clamp((p * (n + 4) - i) / 4)).toFixed(3); });
    if (cta) {
      const k = clamp((p - 0.88) / 0.12);
      cta.style.opacity = k.toFixed(3);
      cta.style.transform = `translateY(${((1 - k) * 12).toFixed(1)}px)`;
      cta.style.pointerEvents = k > 0.6 ? "auto" : "none";
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

// cards empilhados: os anteriores encolhem levemente quando o próximo sobe por cima
(function () {
  const cards = [...document.querySelectorAll(".stack-card")];
  if (cards.length < 2) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let ticking = false;
  function update() {
    ticking = false;
    if (reduce.matches) return;
    const vh = window.innerHeight;
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const stickTop = parseFloat(getComputedStyle(next).top) || 0;
      const t = clamp((vh - next.getBoundingClientRect().top) / (vh - stickTop));
      card.style.transform = `scale(${(1 - 0.05 * t).toFixed(4)})`;
      card.style.filter = `brightness(${(1 - 0.18 * t).toFixed(3)})`;
    });
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

// galeria 3D do estúdio (porte do componente React "feature-carousel")
(function () {
  const root = document.querySelector(".carousel");
  if (!root) return;
  const slides = [...root.querySelectorAll(".slide")];
  const total = slides.length;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let timer = null;
  let hovering = false;
  let visible = false;

  function render() {
    slides.forEach((el, i) => {
      let pos = (i - current + total) % total;
      if (pos > Math.floor(total / 2)) pos -= total;
      const center = pos === 0;
      const adjacent = Math.abs(pos) === 1;
      el.style.transform = `translateX(${pos * 45}%) scale(${center ? 1 : adjacent ? 0.85 : 0.7}) rotateY(${pos * -10}deg)`;
      el.style.zIndex = center ? 10 : adjacent ? 5 : 1;
      el.style.opacity = center ? 1 : adjacent ? 0.4 : 0;
      el.style.filter = center ? "blur(0px)" : "blur(4px)";
      el.style.visibility = Math.abs(pos) > 1 ? "hidden" : "visible";
      el.setAttribute("aria-hidden", String(!center));
    });
  }
  const go = (n) => { current = (n + total) % total; render(); };
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (reduce.matches || hovering || !visible || document.hidden) return;
    timer = setInterval(next, 4000);
  }

  root.querySelector(".carousel-next").addEventListener("click", () => { next(); start(); });
  root.querySelector(".carousel-prev").addEventListener("click", () => { prev(); start(); });
  slides.forEach((el, i) => el.addEventListener("click", () => { if (i !== current) { go(i); start(); } }));

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); start(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); start(); }
  });
  root.addEventListener("mouseenter", () => { hovering = true; stop(); });
  root.addEventListener("mouseleave", () => { hovering = false; start(); });
  root.addEventListener("focusin", () => { hovering = true; stop(); });
  root.addEventListener("focusout", () => { hovering = false; start(); });

  // arrastar para o lado (toque ou mouse)
  let startX = null;
  root.addEventListener("pointerdown", (e) => { if (!e.target.closest(".carousel-btn")) startX = e.clientX; });
  root.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX; startX = null;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); start(); }
  });
  root.addEventListener("pointercancel", () => { startX = null; });

  // só gira enquanto está na tela e a aba está ativa
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; start(); }, { threshold: 0.3 }).observe(root);
  document.addEventListener("visibilitychange", start);

  render();
})();

// atendimentos: o card se expande em uma janela com os detalhes
(function () {
  const cards = [...document.querySelectorAll(".svc-card")];
  const dlg = document.querySelector(".svc-dialog");
  const back = document.querySelector(".svc-backdrop");
  if (!cards.length || !dlg) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const img = dlg.querySelector(".svc-dialog-img");
  const body = dlg.querySelector(".svc-dialog-body");
  const cta = dlg.querySelector(".svc-cta");
  const interest = document.querySelector('select[name="interesse"]');
  let openCard = null, anim = null;

  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
  function finalRect() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(900, vw - 24), hgt = Math.min(Math.round(vh * 0.88), vw < 640 ? 640 : 600);
    return { left: Math.round((vw - w) / 2), top: Math.round((vh - hgt) / 2), width: w, height: hgt };
  }
  const css = (r, radius) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: radius });
  function place(r) { Object.assign(dlg.style, css(r, "24px")); }

  function fill(card) {
    const src = document.getElementById("svc-" + card.dataset.svc);
    dlg.querySelector("h3").textContent = src.querySelector("h3").textContent;
    dlg.querySelector(".svc-sub").textContent = src.querySelector(".svc-sub").textContent;
    dlg.querySelector(".svc-desc").innerHTML = src.querySelector(".svc-desc").innerHTML;
    dlg.querySelector(".svc-list").innerHTML = src.querySelector(".svc-list").innerHTML;
    dlg.querySelector(".chips").innerHTML = src.querySelector(".chips").innerHTML;
    img.className = "svc-dialog-img " + src.dataset.img;
    cta.dataset.interesse = src.dataset.interesse;
  }

  // animações de fechar usam fill:"forwards"; sem cancelar, o conteúdo ficaria invisível na próxima abertura
  function resetAnims() { [dlg, body, img].forEach((el) => el.getAnimations().forEach((x) => x.cancel())); }

  function open(card) {
    if (openCard) return;
    openCard = card;
    resetAnims();
    fill(card);
    const from = rectOf(card), to = finalRect();
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (sw > 0) document.documentElement.style.paddingRight = sw + "px";
    back.hidden = false; dlg.hidden = false;
    place(to); body.scrollTop = 0;
    card.classList.add("is-open");
    requestAnimationFrame(() => back.classList.add("show"));
    if (!reduce.matches) {
      anim = dlg.animate([css(from, "20px"), css(to, "24px")], { duration: 520, easing: "cubic-bezier(.2,.85,.25,1)" });
      body.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: 200, easing: "ease-out", fill: "backwards" });
      img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 120, fill: "backwards" });
    }
    dlg.querySelector(".svc-close").focus({ preventScroll: true });
  }

  function close(immediate) {
    if (!openCard) return;
    const card = openCard; openCard = null;
    back.classList.remove("show");
    const done = () => {
      resetAnims();
      dlg.hidden = true; back.hidden = true; card.classList.remove("is-open");
      document.documentElement.style.overflow = ""; document.documentElement.style.paddingRight = "";
      if (!immediate) card.focus({ preventScroll: true });
    };
    if (immediate || reduce.matches) { if (anim) anim.cancel(); done(); return; }
    const from = rectOf(dlg), to = rectOf(card);
    place(to);
    anim = dlg.animate([css(from, "24px"), css(to, "20px")], { duration: 380, easing: "cubic-bezier(.4,0,.2,1)" });
    body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" });
    anim.onfinish = done;
  }

  cards.forEach((c) => c.addEventListener("click", () => open(c)));
  back.addEventListener("click", () => close());
  dlg.querySelector(".svc-close").addEventListener("click", () => close());
  cta.addEventListener("click", () => {
    if (interest) { const o = [...interest.options].find((x) => x.text === cta.dataset.interesse); if (o) interest.value = o.value || o.text; }
    close(true);
  });
  document.addEventListener("keydown", (e) => {
    if (!openCard) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Tab") {
      const f = [...dlg.querySelectorAll("button, a[href]")].filter((x) => !x.hidden);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener("resize", () => { if (openCard) place(finalRect()); });
})();

// Depoimentos: colunas verticais com rolagem automática (rAF, sem CSS animation)
(function () {
  const src = document.getElementById("tm-source");
  const cols = document.getElementById("tm-cols");
  if (!src || !cols) return;
  const cards = [...src.children];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // mantém a lista estática
  const SPEED = [30, 24, 36]; // px por segundo
  let tracks = [], built = 0, visible = true, last = 0;

  function build() {
    const n = innerWidth <= 640 ? 1 : innerWidth <= 900 ? 2 : 3;
    built = n;
    cols.innerHTML = "";
    src.hidden = true;
    cols.hidden = false;
    tracks = [];
    const view = cols.clientHeight || 600;
    for (let c = 0; c < n; c++) {
      const col = document.createElement("div");
      col.className = "tm-col";
      const track = document.createElement("div");
      track.className = "tm-track";
      col.appendChild(track);
      cols.appendChild(col);
      // cada coluna começa em um depoimento diferente
      const order = cards.map((_, k) => cards[(k + [0, 3, 5][c]) % cards.length]);
      const add = (list, dup) => list.forEach((el) => {
        const k = el.cloneNode(true);
        if (dup) k.setAttribute("aria-hidden", "true");
        track.appendChild(k);
      });
      add(order, false);
      let guard = 0;
      while (track.offsetHeight < view * 1.5 && guard++ < 6) add(order, true);
      const count = track.children.length;
      [...track.children].slice(0, count).forEach((el) => {
        const k = el.cloneNode(true); k.setAttribute("aria-hidden", "true"); track.appendChild(k);
      });
      const half = track.offsetHeight / 2;
      tracks.push({ el: track, half, dir: c % 2 ? 1 : -1, speed: SPEED[c % 3], y: c % 2 ? -half : 0 });
    }
  }

  function tick(t) {
    const dt = Math.min((t - last) / 1000, 0.05) || 0;
    last = t;
    if (visible && !document.hidden) {
      tracks.forEach((k) => {
        k.y += k.dir * k.speed * dt;
        if (k.y <= -k.half) k.y += k.half;
        if (k.y >= 0 && k.dir > 0) k.y -= k.half;
        k.el.style.transform = "translate3d(0," + k.y.toFixed(2) + "px,0)";
      });
    }
    requestAnimationFrame(tick);
  }

  build();
  requestAnimationFrame((t) => { last = t; tick(t); });
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(cols);
  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (innerWidth <= 640 ? 1 : innerWidth <= 900 ? 2 : 3) build(); }, 200); });
})();
