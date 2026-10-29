document.addEventListener("DOMContentLoaded", () => {
  const certificates = Array.isArray(window.portfolioCertificates) ? window.portfolioCertificates : [];
  const list = document.querySelector("[data-certificate-list]");
  const count = document.querySelector("[data-certificate-count]");
  const viewer = document.querySelector("[data-pdf-viewer]");
  const viewerStatus = document.querySelector("[data-pdf-status]");
  const emptyState = document.querySelector("[data-pdf-empty]");
  const utils = window.PortfolioUtils || { escapeHTML: value => String(value) };
  if (count) count.textContent = `${certificates.length} dokumen${certificates.length === 1 ? "" : ""}`;
  if (!list) return;

  if (!certificates.length) {
    list.innerHTML = `<div class="empty-certificates">
      <span class="empty-document-icon" aria-hidden="true">PDF</span>
      <h2>Belum ada sertifikat.</h2>
      <p>Setelah file sertifikat tersedia, simpan PDF di <code>assets/documents/certificates/</code> dan tambahkan datanya di <code>data/certificates.js</code>.</p>
    </div>`;
    return;
  }

  list.innerHTML = certificates.map((cert, index) => `
    <article class="certificate-item">
      <span class="empty-document-icon" aria-hidden="true">PDF</span>
      <div class="certificate-item-copy">
        <h2>${utils.escapeHTML(cert.title)}</h2>
        <p>${utils.escapeHTML(cert.issuer || "Penyelenggara belum dicantumkan")}${cert.date ? ` · ${utils.escapeHTML(cert.date)}` : ""}</p>
        ${cert.description ? `<p class="certificate-description">${utils.escapeHTML(cert.description)}</p>` : ""}
      </div>
      <button class="button button-outline certificate-open" type="button" data-certificate-index="${index}">Lihat PDF ↗</button>
    </article>`).join("");

  list.querySelectorAll("[data-certificate-index]").forEach(button => {
    button.addEventListener("click", () => {
      const cert = certificates[Number(button.dataset.certificateIndex)];
      if (!cert || !cert.file || !viewer) return;
      viewer.src = cert.file;
      viewer.title = `Pratinjau ${cert.title}`;
      viewer.hidden = false;
      if (emptyState) emptyState.hidden = true;
      if (viewerStatus) viewerStatus.textContent = cert.title;
      const actions = document.querySelector("[data-pdf-actions]");
      if (actions) {
        actions.innerHTML = `<a class="text-link" href="${cert.file}" target="_blank" rel="noopener">Buka PDF terpisah ↗</a>
          <a class="text-link" href="${cert.file}" download>Unduh PDF ↓</a>`;
        actions.hidden = false;
      }
      viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});