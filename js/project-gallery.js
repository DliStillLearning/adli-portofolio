document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector("#featured-projects");
  if (!gallery) return;
  const cards = [...gallery.querySelectorAll(".showcase-card")];
  const filters = [...document.querySelectorAll("[data-project-filter]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reveal = card => requestAnimationFrame(() => card.classList.add("is-visible"));
  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(card => card.classList.add("is-visible"));
  }

  filters.forEach(filter => filter.addEventListener("click", () => {
    const category = filter.dataset.projectFilter;
    filters.forEach(item => {
      const active = item === filter;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    cards.forEach((card, index) => {
      const show = category === "all" || card.dataset.projectCategory === category;
      card.hidden = !show;
      if (show) {
        card.style.setProperty("--card-index", String(index % 3));
        card.classList.remove("is-visible");
        if (reducedMotion) card.classList.add("is-visible");
        else window.setTimeout(() => reveal(card), index * 35);
      }
    });
  }));
});
