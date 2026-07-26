// Nic Whitby — Design Portfolio
// Smooth scroll (Lenis) + scroll-driven reveals (GSAP/ScrollTrigger)

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
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

  /* ---------- Nav background on scroll ---------- */
  const nav = document.querySelector(".site-nav");
  if (nav) {
    ScrollTrigger.create({
      start: 60,
      end: 99999,
      onUpdate: (self) => {
        nav.classList.toggle("is-scrolled", self.scroll() > 40);
      },
    });
  }

  /* ---------- Hero title line reveal ---------- */
  const heroLines = document.querySelectorAll(".hero__title .line span");
  if (heroLines.length) {
    gsap.to(heroLines, {
      y: "0%",
      duration: 1.1,
      ease: "power4.out",
      stagger: 0.09,
      delay: 0.2,
    });
  }

  gsap.utils.toArray(".hero__eyebrow, .hero__taglines, .hero__sub").forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.5 + i * 0.12 }
    );
  });

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

    gsap.to(el.querySelectorAll(".statement__word"), {
      color: "rgba(243, 241, 236, 1)",
      ease: "none",
      stagger: 1,
      scrollTrigger: {
        trigger: el,
        start: "top 78%",
        end: "bottom 55%",
        scrub: 0.6,
      },
    });
  });

  /* ---------- Generic scroll reveals ---------- */
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
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

  /* ---------- Staggered reveal groups ---------- */
  gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
    const items = group.querySelectorAll("[data-reveal-item]");
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: {
        trigger: group,
        start: "top 85%",
      },
    });
  });

  /* ---------- Work switcher: tab + stage crossfade ---------- */
  const workTabs = gsap.utils.toArray(".work-tab");
  const workPanels = gsap.utils.toArray(".work-panel");
  const stageCurrent = document.querySelector(".work-stage__current");
  let activeIndex = 0;
  let isSwitching = false;

  function switchTo(index) {
    if (index === activeIndex || isSwitching) return;
    index = (index + workPanels.length) % workPanels.length;

    const outgoing = workPanels[activeIndex];
    const incoming = workPanels[index];
    isSwitching = true;

    workTabs[activeIndex].classList.remove("is-active");
    workTabs[activeIndex].setAttribute("aria-selected", "false");
    workTabs[index].classList.add("is-active");
    workTabs[index].setAttribute("aria-selected", "true");
    if (stageCurrent) stageCurrent.textContent = String(index + 1).padStart(2, "0");

    // When the tab strip scrolls horizontally (mobile), keep the active pill in view
    const tabsWrap = document.querySelector(".work-tabs");
    if (tabsWrap && tabsWrap.scrollWidth > tabsWrap.clientWidth + 4) {
      const tab = workTabs[index];
      const target = tab.offsetLeft - (tabsWrap.clientWidth - tab.offsetWidth) / 2;
      tabsWrap.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        activeIndex = index;
        isSwitching = false;
      },
    });

    tl.to(outgoing, { opacity: 0, y: -16, duration: 0.3, ease: "power2.in" })
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
        { scale: 1, duration: 0.8, ease: "power2.out" },
        "<"
      );
  }

  workTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTo(parseInt(tab.dataset.index, 10)));
  });

  document.querySelectorAll(".work-stage__arrow").forEach((btn) => {
    btn.addEventListener("click", () => switchTo(activeIndex + parseInt(btn.dataset.dir, 10)));
  });

  /* ---------- Stat counters ---------- */
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
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
