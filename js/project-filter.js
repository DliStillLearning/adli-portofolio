document.addEventListener("DOMContentLoaded", () => {
  if (!Array.isArray(window.portfolioProjects)) return;
  const featuredTarget = document.getElementById("featured-projects");
  const allTarget = document.getElementById("all-projects");
  const utils = window.PortfolioUtils || { escapeHTML: value => String(value) };
  const row = (project, index) => `
    <a class="project-row" href="${project.url}">
      <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="project-main">
        <span class="project-title">${utils.escapeHTML(project.title)}</span>
        <span class="project-status">${utils.escapeHTML(project.status)}</span>
        <span class="project-description">${utils.escapeHTML(project.description)}</span>
      </span>
      <span class="project-tags">${project.tags.map(tag => `<span class="project-tag">${utils.escapeHTML(tag)}</span>`).join("")}</span>
      <span class="project-arrow" aria-hidden="true">↗</span>
    </a>`;
  if (featuredTarget) featuredTarget.innerHTML = window.portfolioProjects.filter(p => p.featured).map((p, i) => row(p, window.portfolioProjects.indexOf(p))).join("");
  const renderAll = filter => {
    if (!allTarget) return;
    const visible = window.portfolioProjects.filter(p => filter === "all" || p.category === filter);
    allTarget.innerHTML = visible.length ? visible.map(p => row(p, window.portfolioProjects.indexOf(p))).join("") : '<p class="muted">Belum ada proyek dalam kategori ini.</p>';
  };
  if (allTarget) {
    renderAll("all");
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach(item => {
          const selected = item === button;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        renderAll(filter);
      });
    });
  }
});