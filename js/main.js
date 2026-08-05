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

  /* ---------- Work switcher (no animation dependency) ---------- */
  // Wired up first, and without GSAP, so tabs work in every scenario.
  const workTabs = Array.from(document.querySelectorAll(".work-tab"));
  const workPanels = Array.from(document.querySelectorAll(".work-panel"));
  const stageCurrent = document.querySelector(".work-stage__current");
  let activeIndex = 0;
  let switchTl = null;

  function setTabState(index) {
    workTabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      // Roving tabindex: the tablist is a single tab stop
      tab.setAttribute("tabindex", selected ? "0" : "-1");
    });
    if (stageCurrent) stageCurrent.textContent = String(index + 1).padStart(2, "0");

    // When the tab strip scrolls horizontally (mobile), keep the active pill in view
    const tabsWrap = document.querySelector(".work-tabs");
    if (tabsWrap && tabsWrap.scrollWidth > tabsWrap.clientWidth + 4) {
      const tab = workTabs[index];
      const target = tab.offsetLeft - (tabsWrap.clientWidth - tab.offsetWidth) / 2;
      tabsWrap.scrollTo({
        left: Math.max(0, target),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }

  function switchTo(index, { focusPanel = false } = {}) {
    if (!workPanels.length) return;
    index = (index + workPanels.length) % workPanels.length;
    if (index === activeIndex) return;

    const outgoing = workPanels[activeIndex];
    const incoming = workPanels[index];

    setTabState(index);

    const finish = () => {
      activeIndex = index;
      // Move the reading cursor so assistive tech announces the new panel
      if (focusPanel) incoming.focus({ preventScroll: true });
    };

    // No libraries, or motion is unwelcome — swap instantly.
    if (!hasLibs || reduceMotion) {
      outgoing.classList.remove("is-active");
      outgoing.style.display = "";
      incoming.classList.add("is-active");
      incoming.style.display = "";
      incoming.style.opacity = "";
      incoming.style.transform = "";
      finish();
      return;
    }

    // Interrupt any in-flight transition rather than dropping the input,
    // so rapid tab clicks always land on the project the visitor asked for.
    if (switchTl) {
      switchTl.kill();
      gsap.set(workPanels, { clearProps: "opacity,transform" });
      workPanels.forEach((p, i) => {
        p.classList.toggle("is-active", i === activeIndex);
        p.style.display = i === activeIndex ? "block" : "none";
      });
    }

    switchTl = gsap.timeline({ onComplete: finish });

    switchTl
      .to(outgoing, { opacity: 0, y: -16, duration: 0.3, ease: "power2.in" })
      .set(outgoing, { display: "none" })
      .call(() => {
        outgoing.classList.remove("is-active");
        incoming.classList.add("is-active");
      })
      .set(incoming, { display: "block", opacity: 0, y: 16 })
      .to(incoming, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
      .fromTo(
        incoming.querySelectorAll(".work-panel__media img"),
        { scale: 1.06 },
        { scale: 1, duration: 0.4, ease: "power2.out" },
        "<"
      );
  }

  workTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTo(parseInt(tab.dataset.index, 10)));
  });

  // Full tablist keyboard contract: Left/Right/Home/End
  const tablist = document.querySelector(".work-tabs");
  if (tablist) {
    tablist.addEventListener("keydown", (e) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();

      let next = activeIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = activeIndex + 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = activeIndex - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = workTabs.length - 1;

      next = (next + workTabs.length) % workTabs.length;
      switchTo(next);
      workTabs[next].focus();
    });
  }

  document.querySelectorAll(".work-stage__arrow").forEach((btn) => {
    btn.addEventListener("click", () =>
      switchTo(activeIndex + parseInt(btn.dataset.dir, 10), { focusPanel: true })
    );
  });

  setTabState(0);

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

  /* ---------- Stat counters ---------- */
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";

    if (reduceMotion) {
      el.textContent = target + suffix;
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
            el.textContent = Math.round(counter.val) + suffix;
          },
        });
      },
    });
  });
});
