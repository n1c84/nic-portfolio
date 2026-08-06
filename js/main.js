// Nic Whitby — Design Portfolio
// Smooth scroll (Lenis) + scroll-driven reveals (GSAP/ScrollTrigger)
//
// Progressive enhancement contract:
//   - CSS hides [data-reveal] and the hero lines ONLY under `html.js`.
//   - If GSAP/Lenis fail to load, the guard below strips `.js` so every
//     section renders in place, and the work switcher still works.

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const hasLibs = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ---------- Everything below is enhancement only ---------- */
  if (!hasLibs) {
    // Strip the flag so the CSS start-states stop applying and all
    // content renders in place.
    root.classList.remove("js");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  // Scroll hijacking is the most commonly reported vestibular trigger,
  // so Lenis is never initialised under reduced motion.
  if (!reduceMotion) {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Nav background on scroll ---------- */
  const nav = document.querySelector(".site-nav");
  if (nav) {
    ScrollTrigger.create({
      start: 40,
      end: 99999,
      onToggle: (self) => {
        nav.classList.toggle("is-scrolled", self.isActive);
      },
    });
  }

  /* ---------- Hero title line reveal ---------- */
  const heroLines = document.querySelectorAll(".hero__title .line span");
  const heroSecondary = gsap.utils.toArray(".hero__eyebrow, .hero__taglines, .hero__sub");

  if (reduceMotion) {
    // Place everything at its final state, no tweening.
    gsap.set(heroLines, { y: "0%" });
    gsap.set(heroSecondary, { opacity: 1, y: 0 });
  } else {
    if (heroLines.length) {
      gsap.to(heroLines, {
        y: "0%",
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.09,
        delay: 0.2,
      });
    }

    heroSecondary.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.5 + i * 0.12 }
      );
    });
  }

  /* ---------- Statement: word-by-word scroll reveal ---------- */
  gsap.utils.toArray("[data-words]").forEach((el) => {
    // Wrap each word in its own span so it can be lit individually
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "statement__word";
      span.textContent = i < words.length - 1 ? w + " " : w;
      el.appendChild(span);
    });
    el.setAttribute("data-split", "");

    // Under reduced motion the CSS already renders words at full strength.
    if (reduceMotion) return;

    gsap.to(el.querySelectorAll(".statement__word"), {
      color: getComputedStyle(root).getPropertyValue("--fg").trim(),
      ease: "none",
      stagger: 1,
      scrollTrigger: {
        trigger: el,
        start: "top 78%",
        // Ends earlier so the sentence completes well before it leaves view
        end: "bottom 75%",
        scrub: 0.6,
      },
    });
  });

  /* ---------- Generic scroll reveals ---------- */
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    if (reduceMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
      },
    });
  });

  /* ---------- Work posters: entrance + parallax ---------- */
  // Each poster reveals as it enters; motion direction alternates per
  // project so consecutive posters feel distinct. Skipped entirely under
  // reduced motion — content is visible by default.
  if (!reduceMotion) {
    gsap.utils.toArray(".poster").forEach((poster, i) => {
      const dir = i % 2 ? 1 : -1;
      const imgs = poster.querySelectorAll(".poster__work img");
      const footCols = poster.querySelectorAll(".poster__foot > div");

      gsap
        .timeline({
          scrollTrigger: { trigger: poster, start: "top 72%" },
          defaults: { ease: "power3.out" },
        })
        .from(poster.querySelector(".poster__kicker"), { opacity: 0, y: 22, duration: 0.55 })
        .from(
          poster.querySelector(".poster__name"),
          { opacity: 0, x: 70 * dir, duration: 0.9, ease: "power4.out" },
          "-=0.3"
        )
        .from(poster.querySelector(".poster__stat"), { opacity: 0, y: 24, duration: 0.65 }, "-=0.55")
        .from(imgs, { opacity: 0, y: 44, scale: 0.965, stagger: 0.14, duration: 0.8 }, "-=0.4")
        .from(footCols, { opacity: 0, y: 22, stagger: 0.09, duration: 0.55 }, "-=0.5");

      // Slow counter-drift on the plates while the poster crosses the viewport
      imgs.forEach((img, j) => {
        gsap.fromTo(
          img,
          { yPercent: 3.5 + j * 2 },
          {
            yPercent: -(3.5 + j * 2),
            ease: "none",
            scrollTrigger: { trigger: poster, start: "top bottom", end: "bottom top", scrub: 0.6 },
          }
        );
      });
    });
  }

  /* ---------- Stat counters ---------- */
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";

    if (reduceMotion) {
      el.textContent = prefix + target + suffix;
      return;
    }

    const counter = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = prefix + Math.round(counter.val) + suffix;
          },
        });
      },
    });
  });
});
