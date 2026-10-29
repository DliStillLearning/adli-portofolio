
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* =====================================================
     NAVIGATION
     ===================================================== */

  const nav = $("#primary-nav");
  const menuToggle = $(".menu-toggle");
  const navLinks = $$(".nav-link");
  const sections = $$("[data-timeline-section]");

  const closeMenu = () => {
    if (!menuToggle || !nav) return;

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka navigasi");
    nav.classList.remove("is-open");
  };

  menuToggle?.addEventListener("click", () => {
    const willOpen =
      menuToggle.getAttribute("aria-expanded") !== "true";

    menuToggle.setAttribute("aria-expanded", String(willOpen));
    menuToggle.setAttribute(
      "aria-label",
      willOpen ? "Tutup navigasi" : "Buka navigasi"
    );

    nav?.classList.toggle("is-open", willOpen);
  });

  const setActiveSection = id => {
    navLinks.forEach(link => {
      const active = link.getAttribute("href") === `#${id}`;

      link.classList.toggle("is-active", active);

      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    sections.forEach(section => {
      section.classList.toggle("is-current", section.id === id);
    });
  };

  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      closeMenu();

      const target = $(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();

      setActiveSection(target.id);

      if (history.pushState) {
        history.pushState(null, "", `#${target.id}`);
      }

      const headerHeight =
        $(".site-header")?.getBoundingClientRect().height || 0;

      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        12;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth"
      });
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) closeMenu();
  });

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(() => {
      const headerHeight =
        $(".site-header")?.getBoundingClientRect().height || 0;

      const markerY =
        headerHeight + Math.min(90, window.innerHeight * 0.16);

      let current = sections.find(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= markerY && rect.bottom > markerY;
      });

      if (!current) {
        current = sections.reduce((nearest, section) => {
          if (!nearest) return section;

          const currentDistance = Math.abs(
            section.getBoundingClientRect().top - markerY
          );

          const nearestDistance = Math.abs(
            nearest.getBoundingClientRect().top - markerY
          );

          return currentDistance < nearestDistance ? section : nearest;
        }, null);
      }

      if (current) {
        setActiveSection(current.id);

        if (
          history.replaceState &&
          window.location.hash !== `#${current.id}`
        ) {
          history.replaceState(null, "", `#${current.id}`);
        }
      }
    }, {
      rootMargin: "-8% 0px -78% 0px",
      threshold: [0, 0.05, 0.2]
    });

    sections.forEach(section => sectionObserver.observe(section));
  }

  /* =====================================================
     FOOTER YEAR
     ===================================================== */

  $$("[data-current-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  /* =====================================================
     CERTIFICATE VIEWER
     Automatically supports PDF and image files.
     ===================================================== */

  const certGrid = $("#certificate-grid");
  const modal = $("#certificate-modal");
  const modalViewer = $("#modal-viewer");
  const modalTitle = $("#modal-title");
  const modalSubtitle = $("#modal-subtitle");
  const modalStatus = $("#modal-status");
  const openFile = $("#modal-open-file");
  const downloadFile = $("#modal-download");
  const closeButton = $("#modal-close");

  let lastTrigger = null;
  let imageZoom = 1;

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;

  const escapeHTML = value => {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  };

  /*
   * Resolve local asset paths from the website root.
   * Filenames containing spaces are encoded for URLs.
   */
  const resolveFilePath = path => {
    const value = String(path || "").trim();

    if (!value) return "";

    // External URLs are allowed if intentionally configured.
    if (/^(https?:)?\/\//i.test(value)) {
      return value;
    }

    if (/^(data:|blob:)/i.test(value)) {
      return value;
    }

    const cleanPath = value
      .replace(/^\.\/+/, "")
      .replace(/^\/+/, "");

    return "/" + cleanPath
      .split("/")
      .map(segment => encodeURIComponent(segment))
      .join("/");
  };

  const getFileExtension = path => {
    const cleanPath = String(path || "").split(/[?#]/)[0];
    const filename = cleanPath.split("/").pop() || "";
    const match = filename.match(/\.([a-z0-9]+)$/i);

    return match ? match[1].toLowerCase() : "";
  };

  const getFileType = path => {
    const extension = getFileExtension(path);

    if (extension === "pdf") return "pdf";

    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "avif"
    ];

    if (imageExtensions.includes(extension)) return "image";

    return "unknown";
  };

  const getFileName = path => {
    const cleanPath = String(path || "").split(/[?#]/)[0];
    const filename = cleanPath.split("/").pop() || "sertifikat";

    try {
      return decodeURIComponent(filename);
    } catch {
      return filename;
    }
  };

  const makeEmptyViewer = ({
    title = "File sertifikat belum ditambahkan",
    message = "Tambahkan file pada data/certificates.js untuk menampilkan pratinjau."
  } = {}) => {
    if (!modalViewer) return;

    modalViewer.innerHTML = `
      <div class="modal-empty">
        <span class="modal-empty-icon" aria-hidden="true">FILE</span>
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(message)}</p>
      </div>
    `;
  };

  const updateImageZoom = () => {
    const image = $(".certificate-preview-image", modalViewer);
    const zoomValue = $("#certificate-zoom-value", modalViewer);

    if (image) {
      image.style.transform = `scale(${imageZoom})`;
    }

    if (zoomValue) {
      zoomValue.textContent = `${Math.round(imageZoom * 100)}%`;
    }

    const zoomOut = $('[data-image-zoom="out"]', modalViewer);
    const zoomIn = $('[data-image-zoom="in"]', modalViewer);

    if (zoomOut) {
      zoomOut.disabled = imageZoom <= MIN_ZOOM;
    }

    if (zoomIn) {
      zoomIn.disabled = imageZoom >= MAX_ZOOM;
    }
  };

  const renderImageViewer = (fileUrl, title) => {
    if (!modalViewer) return;

    imageZoom = 1;

    modalViewer.innerHTML = `
      <div class="certificate-image-viewer">
        <div
          class="certificate-image-toolbar"
          role="group"
          aria-label="Kontrol zoom gambar">

          <span class="certificate-image-toolbar-label">
            IMAGE PREVIEW
          </span>

          <div class="certificate-zoom-controls">
            <button
              type="button"
              data-image-zoom="out"
              aria-label="Perkecil gambar"
              title="Perkecil">
              −
            </button>

            <output id="certificate-zoom-value" aria-live="polite">
              100%
            </output>

            <button
              type="button"
              data-image-zoom="in"
              aria-label="Perbesar gambar"
              title="Perbesar">
              +
            </button>

            <button
              type="button"
              data-image-zoom="reset"
              aria-label="Kembalikan ukuran gambar"
              title="Reset zoom">
              Reset
            </button>
          </div>
        </div>

        <div class="certificate-image-stage">
          <img
            class="certificate-preview-image"
            src="${escapeHTML(fileUrl)}"
            alt="${escapeHTML(`Sertifikat ${title}`)}"
            draggable="false"
          >
        </div>
      </div>
    `;

    const image = $(".certificate-preview-image", modalViewer);

    image?.addEventListener("error", () => {
      makeEmptyViewer({
        title: "Gambar tidak dapat ditampilkan",
        message:
          "Periksa nama dan lokasi file gambar. Pastikan file sudah diunggah ke folder assets/documents/certificates/."
      });

      if (modalStatus) {
        modalStatus.textContent = "Gagal memuat gambar";
      }

      if (openFile) openFile.hidden = true;
      if (downloadFile) downloadFile.hidden = true;
    });

    updateImageZoom();
  };

  const renderPdfViewer = (fileUrl, title) => {
    if (!modalViewer) return;

    modalViewer.innerHTML = `
      <div class="certificate-pdf-viewer">
        <iframe
          title="${escapeHTML(`Pratinjau PDF ${title}`)}"
          src="${escapeHTML(fileUrl)}#toolbar=1&navpanes=0"
          loading="eager">
        </iframe>
      </div>
    `;
  };

  const openCertificate = cert => {
    if (!cert || !modal) return;

    const rawPath = String(cert.file || "").trim();
    const fileUrl = resolveFilePath(rawPath);
    const fileType = getFileType(rawPath);

    modalTitle.textContent = cert.title || "Pratinjau sertifikat";

    modalSubtitle.textContent =
      [cert.issuer, cert.date].filter(Boolean).join(" · ") ||
      "Dokumen sertifikat";

    if (openFile) {
      openFile.hidden = !fileUrl;
      openFile.href = fileUrl;
    }

    if (downloadFile) {
      downloadFile.hidden = !fileUrl;
      downloadFile.href = fileUrl;
      downloadFile.download = getFileName(rawPath);
    }

    if (!fileUrl) {
      if (modalStatus) {
        modalStatus.textContent = "File belum ditambahkan";
      }

      makeEmptyViewer({
        title: "File sertifikat belum ditambahkan",
        message:
          "Letakkan PDF atau gambar asli di assets/documents/certificates/, lalu isi properti file pada data/certificates.js."
      });
    } else if (fileType === "image") {
      if (modalStatus) {
        modalStatus.textContent =
          "Pratinjau gambar · gunakan tombol zoom";
      }

      renderImageViewer(fileUrl, cert.title || "Sertifikat");
    } else if (fileType === "pdf") {
      if (modalStatus) {
        modalStatus.textContent = "Pratinjau PDF";
      }

      renderPdfViewer(fileUrl, cert.title || "Sertifikat");
    } else {
      if (modalStatus) {
        modalStatus.textContent = "Format file belum didukung viewer";
      }

      makeEmptyViewer({
        title: "Format pratinjau belum didukung",
        message:
          "Gunakan PDF, JPG, JPEG, PNG, WEBP, GIF, atau AVIF. File tetap dapat dibuka atau diunduh melalui tombol di atas."
      });
    }

    if (typeof modal.showModal === "function") {
      if (!modal.open) modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }

    document.body.classList.add("modal-open");
  };

  /*
   * Card labels and preview modal.
   */
  
/* =====================================================
   CERTIFICATE CARDS WITH REAL THUMBNAILS
   ===================================================== */

const certificates = Array.isArray(window.portfolioCertificates)
  ? window.portfolioCertificates
  : [];

const renderPdfThumbnail = async (canvas, fileUrl) => {
  const preview = canvas.closest(".certificate-card-preview");

  try {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js tidak tersedia");
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await window.pdfjsLib
      .getDocument({ url: fileUrl })
      .promise;

    const page = await pdf.getPage(1);
    const originalViewport = page.getViewport({ scale: 1 });

    // Muat seluruh halaman pertama ke dalam thumbnail.
    const scale = Math.min(
      300 / originalViewport.width,
      220 / originalViewport.height
    );

    const viewport = page.getViewport({ scale });
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas tidak tersedia");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    preview?.classList.add("is-ready");
    preview?.classList.remove("has-thumbnail-error");

    // Lepaskan resource PDF setelah halaman preview selesai dirender.
    await pdf.destroy();
  } catch (error) {
    console.warn("Thumbnail sertifikat PDF gagal dimuat:", error);

    preview?.classList.add("has-thumbnail-error");
  }
};

if (certGrid) {
  certGrid.innerHTML = certificates.map((cert, index) => {
    const inProgress = cert.status === "progress";
    const rawFile = String(cert.file || "").trim();
    const fileUrl = resolveFilePath(rawFile);
    const fileType = getFileType(rawFile);

    const subtitle = inProgress
      ? "Sedang diproses"
      : (cert.issuer || "Sertifikat dimiliki · detail menyusul");

    let previewContent = "";

    if (inProgress) {
      previewContent = `
        <span class="certificate-preview-fallback">
          WAIT
        </span>
      `;
    } else if (fileUrl && fileType === "image") {
      previewContent = `
        <img
          class="certificate-card-thumbnail"
          src="${escapeHTML(fileUrl)}"
          alt=""
          loading="lazy"
          data-certificate-thumbnail
        >

        <span class="certificate-preview-fallback">
          IMG
        </span>
      `;
    } else if (fileUrl && fileType === "pdf") {
      previewContent = `
        <canvas
          class="certificate-card-thumbnail certificate-card-preview-canvas"
          data-thumbnail-src="${escapeHTML(fileUrl)}"
          aria-hidden="true">
        </canvas>

        <span class="certificate-preview-fallback">
          PDF
        </span>
      `;
    } else {
      previewContent = `
        <span class="certificate-preview-fallback">
          FILE
        </span>
      `;
    }

    return `
      <button
        type="button"
        class="certificate-card ${inProgress ? "is-progress" : ""}"
        data-certificate-index="${index}"
        ${inProgress ? 'disabled aria-disabled="true"' : ""}>

        <span
          class="certificate-card-preview ${inProgress ? "is-progress-preview" : ""}"
          aria-hidden="true">

          ${previewContent}
        </span>

        <span class="certificate-card-copy">
          <strong>
            ${escapeHTML(cert.title || `Sertifikat ${index + 1}`)}
          </strong>

          <small>${escapeHTML(subtitle)}</small>
        </span>

        <span class="certificate-card-arrow">
          ${inProgress ? "Dalam proses" : "Lihat detail ↗"}
        </span>
      </button>
    `;
  }).join("");

  // Gambar sertifikat: gunakan file gambar secara langsung.
  $$(".certificate-card-thumbnail[data-certificate-thumbnail]", certGrid)
    .forEach(image => {
      const preview = image.closest(".certificate-card-preview");

      const markReady = () => {
        preview?.classList.add("is-ready");
        preview?.classList.remove("has-thumbnail-error");
      };

      const markError = () => {
        preview?.classList.add("has-thumbnail-error");
      };

      image.addEventListener("load", markReady, { once: true });
      image.addEventListener("error", markError, { once: true });

      // Menangani gambar yang sudah masuk cache browser.
      if (image.complete) {
        if (image.naturalWidth > 0) {
          markReady();
        } else {
          markError();
        }
      }
    });

  // PDF: render halaman pertama menggunakan PDF.js.
  $$(".certificate-card-preview-canvas[data-thumbnail-src]", certGrid)
    .forEach(canvas => {
      renderPdfThumbnail(
        canvas,
        canvas.dataset.thumbnailSrc
      );
    });

  // Klik card membuka modal viewer yang sudah ada.
  certGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-certificate-index]");

    if (!button || button.disabled) return;

    const index = Number(button.dataset.certificateIndex);
    const cert = certificates[index];

    if (!cert || !modal) return;

    lastTrigger = button;
    openCertificate(cert);
  });
}

  /*
   * Zoom buttons use one delegated listener so repeated modal openings
   * never attach duplicate event handlers.
   */
  modalViewer?.addEventListener("click", event => {
    const button = event.target.closest("[data-image-zoom]");

    if (!button || !modalViewer.contains(button)) return;

    const action = button.dataset.imageZoom;

    if (action === "in") {
      imageZoom = Math.min(MAX_ZOOM, imageZoom + ZOOM_STEP);
    } else if (action === "out") {
      imageZoom = Math.max(MIN_ZOOM, imageZoom - ZOOM_STEP);
    } else if (action === "reset") {
      imageZoom = 1;
    }

    updateImageZoom();
  });

  const cleanupModal = () => {
    document.body.classList.remove("modal-open");
  };

  const closeModal = () => {
    if (!modal) return;

    if (typeof modal.close === "function" && modal.open) {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }

    cleanupModal();

    if (lastTrigger && document.contains(lastTrigger)) {
      lastTrigger.focus();
    }
  };

  closeButton?.addEventListener("click", closeModal);

  modal?.addEventListener("click", event => {
    // Clicking the dialog backdrop closes the preview.
    if (event.target === modal) closeModal();
  });

  modal?.addEventListener("close", cleanupModal);
  modal?.addEventListener("cancel", cleanupModal);

  document.addEventListener("keydown", event => {
    if (!modal?.open) return;

    // Keyboard zoom when viewing an image.
    if (
      event.target === modal ||
      modal.contains(event.target)
    ) {
      const imageVisible = Boolean(
        $(".certificate-preview-image", modalViewer)
      );

      if (imageVisible && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        imageZoom = Math.min(MAX_ZOOM, imageZoom + ZOOM_STEP);
        updateImageZoom();
      }

      if (imageVisible && event.key === "-") {
        event.preventDefault();
        imageZoom = Math.max(MIN_ZOOM, imageZoom - ZOOM_STEP);
        updateImageZoom();
      }

      if (imageVisible && event.key === "0") {
        imageZoom = 1;
        updateImageZoom();
      }
    }
  });

  
  /* =====================================================
    CONTACT LINKS
    ===================================================== */

  const contacts = window.portfolioContacts || {};

  const contactConfig = [
    {
      key: "github",
      selector: '.contact-link[data-contact="github"]',
      normalize: value => value,
      description: "Repository & project code"
    },
    {
      key: "email",
      selector: '.contact-link[data-contact="email"]',
      normalize: value =>
        value.includes(":") ? value : `mailto:${value}`,
      description: "Diskusi dan kolaborasi"
    },
    {
      key: "linkedin",
      selector: '.contact-link[data-contact="linkedin"]',
      normalize: value => value,
      description: "Profil profesional"
    },
    {
      key: "instagram",
      selector: '.contact-link[data-contact="instagram"]',
      normalize: value => value,
      description: "Terhubung dan berkenalan"
    },
    {
      key: "whatsapp",
      selector: '.contact-link[data-contact="whatsapp"]',
      normalize: value => value,
      description: "Chat dan diskusi langsung"
    }
  ];

  contactConfig.forEach(({ key, selector, normalize, description }) => {
    const link = $(selector, $("#contact-links"));
    if (!link) return;

    const value = String(contacts[key] || "").trim();

    if (!value) {
      link.href = "#contact";
      link.classList.add("is-unconfigured");
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("target");
      return;
    }

    link.href = normalize(value);
    link.classList.remove("is-unconfigured");
    link.removeAttribute("aria-disabled");

    if (key === "email") {
      link.removeAttribute("target");
    } else {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    const small = $("small", link);

    if (small) {
      small.textContent =
        key === "email"
          ? value.replace(/^mailto:/, "")
          : description;
    }
  });
});