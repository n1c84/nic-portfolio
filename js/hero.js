// Nic Whitby — project hero
// Cycles the header through the work in a random order on every load.
// The whole hero takes the dominant colour of the project on show, and the
// text, nav and rail flip light/dark to stay readable.
//
// Independent of GSAP/Lenis: if those fail to load, this still runs.
// Without JavaScript the first project simply shows, fully visible.

(function () {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const stage = hero.querySelector(".hero-stage");
  const rail = hero.querySelector(".hero-rail");
  const count = hero.querySelector(".hero__count");
  const capText = hero.querySelector(".hero__cap-text");
  const capName = hero.querySelector(".hero__cap-name");
  const capMeta = hero.querySelector(".hero__cap-meta");
  if (!stage || !rail) return;

  const DURATION = 5200; // ms each project stays on screen
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LIGHT = { ink: "#111113", dim: "#45454C", line: "rgba(17, 17, 19, 0.16)" };
  const DARK = { ink: "#F3F1EC", dim: "#B3AFA6", line: "rgba(243, 241, 236, 0.18)" };

  /* ---------- Shuffle once per page load ---------- */
  const pairs = [...stage.querySelectorAll(".hero-slide")].map((slide) => ({
    slide,
    button: rail.querySelector(`button[data-label="${CSS.escape(slide.dataset.label)}"]`),
  }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  pairs.forEach(({ slide, button }, i) => {
    stage.appendChild(slide);
    rail.appendChild(button);
    button.querySelector(".hero-rail__num").textContent = pad(i + 1);
  });

  const slides = pairs.map((p) => p.slide);
  const buttons = pairs.map((p) => p.button);
  const bars = buttons.map((b) => b.querySelector(".hero-rail__bar"));
  const total = slides.length;

  let current = -1;
  let elapsed = 0;
  let hovered = false;
  let onScreen = true;
  let last = performance.now();
  let captionTimer = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function applyTheme(slide) {
    const tone = slide.dataset.tone === "light" ? "light" : "dark";
    const t = tone === "light" ? LIGHT : DARK;
    hero.style.setProperty("--hero-bg", slide.dataset.bg);
    hero.style.setProperty("--hero-ink", t.ink);
    hero.style.setProperty("--hero-dim", t.dim);
    hero.style.setProperty("--hero-line", t.line);
    hero.style.setProperty("--hero-accent", slide.dataset.accent);
    hero.dataset.tone = tone;
    document.body.classList.toggle("hero-tone-light", tone === "light");
  }

  function writeCaption(slide) {
    capName.textContent = slide.dataset.name + " ";
    const em = document.createElement("em");
    em.textContent = slide.dataset.em;
    capName.appendChild(em);

    capMeta.textContent = "";
    const tags = document.createElement("span");
    tags.textContent = slide.dataset.tags;
    const result = document.createElement("strong");
    result.textContent = slide.dataset.result;
    capMeta.append(tags, result);
  }

  function show(index, instant) {
    if (index === current) return;
    current = index;
    elapsed = 0;
    const slide = slides[index];

    slides.forEach((s, k) => {
      const on = k === index;
      s.classList.toggle("is-active", on);
      s.tabIndex = on ? 0 : -1;
      s.setAttribute("aria-hidden", on ? "false" : "true");
    });
    buttons.forEach((b, k) => {
      b.setAttribute("aria-current", k === index ? "true" : "false");
      b.classList.toggle("is-done", k < index);
    });
    bars.forEach((bar, k) => {
      bar.style.transform = k === index ? `scaleX(${reduceMotion ? 1 : 0})` : "";
    });

    applyTheme(slide);
    hero.dataset.active = slide.dataset.label;
    if (count) count.textContent = `${pad(index + 1)} / ${pad(total)}`;

    clearTimeout(captionTimer);
    if (instant || reduceMotion) {
      capText.classList.remove("is-swapping");
      writeCaption(slide);
    } else {
      capText.classList.add("is-swapping");
      captionTimer = setTimeout(() => {
        writeCaption(slide);
        capText.classList.remove("is-swapping");
      }, 380);
    }
  }

  /* ---------- Controls ---------- */
  buttons.forEach((b, k) => b.addEventListener("click", () => show(k)));

  [stage, hero.querySelector(".hero__caption")].forEach((el) => {
    if (!el) return;
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hovered = true; });
    el.addEventListener("pointerleave", () => { hovered = false; });
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
    }, { threshold: 0.15 }).observe(hero);
  }

  /* ---------- Timer: one clock drives both the rail and the change ---------- */
  function tick(now) {
    const dt = Math.min(now - last, 250); // cap: a stalled frame never skips a project
    last = now;
    const running = !reduceMotion && !hovered && onScreen && !document.hidden;
    if (running) {
      elapsed += dt;
      bars[current].style.transform = `scaleX(${Math.min(1, elapsed / DURATION)})`;
      if (elapsed >= DURATION) show((current + 1) % total);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Boot: first project appears already settled ---------- */
  hero.classList.add("is-booting");
  show(0, true);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => hero.classList.remove("is-booting"));
  });
  if (!reduceMotion) requestAnimationFrame(tick);
})();
