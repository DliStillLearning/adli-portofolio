(() => {
  const key = "adli-portfolio-theme";
  const getSaved = () => {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  };
  const setSaved = value => {
    try { localStorage.setItem(key, value); } catch (_) { }
  };
  const apply = theme => {
    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    const icon = document.querySelector(".theme-icon");
    const button = document.querySelector(".theme-toggle");
    if (icon) icon.textContent = theme === "dark" ? "☼" : "◐";
    if (button) button.setAttribute("aria-label", theme === "dark" ? "Gunakan tema terang" : "Gunakan tema gelap");
  };
  const initial = getSaved() || "light";
  apply(initial);
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;
    button.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      setSaved(next);
    });
  });
})();