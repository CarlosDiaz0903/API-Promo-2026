// ==============================
// SHARE PREVIEW UI - VERSIÓN MEJORADA CON LOADER
// ==============================

import { generateShareImage } from "./share-image.js";

export async function openSharePreview(student) {
  const overlay = document.createElement("div");
  overlay.className = "share-preview-overlay";

  const modal = document.createElement("div");
  modal.className = "share-preview-modal";

  // ===== LOADER BONITO =====
  const loader = document.createElement("div");
  loader.className = "share-loader";

  loader.innerHTML = `
    <div class="loader-canvas">
      <div class="loader-orbit-container">
        <div class="loader-orbit">
          <div class="star big"></div>
          <div class="star medium"></div>
          <div class="star small"></div>
        </div>
        <div class="center-glow"></div>
      </div>
      <p class="loader-text">Generando tu perfil académico...</p>
    </div>
  `;

  modal.prepend(loader); 

  // ===== IMAGEN =====
  const img = document.createElement("img");
  img.className = "share-preview-img";
  img.style.display = "none"; // Oculta hasta que cargue

  modal.innerHTML = `
    <button class="share-close">X</button>

    <div class="share-actions">
      <button class="share-btn download">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        DESCARGAR
      </button>
      <button class="share-btn share">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        COMPARTIR
      </button>
    </div>
  `;

  modal.prepend(img);
  modal.prepend(loader); // Loader visible al inicio
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";

  // Animación suave de entrada
  requestAnimationFrame(() => {
    overlay.classList.add("active");
    modal.classList.add("active");
  });

  // ==============================
  // GENERAR IMAGEN CON LOADER
  // ==============================
  try {
    const generatedImageUrl = await generateShareImage(student);

    // Cuando termine: ocultar loader, mostrar imagen
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.remove();
      img.src = generatedImageUrl;
      img.style.display = "block";
      img.style.opacity = "0";
      requestAnimationFrame(() => {
        img.style.opacity = "1";
      });
    }, 300);
  } catch (err) {
    loader.innerHTML = `<p>Error al generar la imagen 😔</p>`;
    console.error(err);
  }

  // ==============================
  // BOTONES (solo después de cargar la imagen)
  // ==============================
  const downloadBtn = modal.querySelector(".share-btn.download");
  const shareBtn = modal.querySelector(".share-btn.share");
  const closeBtn = modal.querySelector(".share-close");

  let finalImageUrl = null;

  // Esperamos a que la imagen esté lista para habilitar botones
  const enableButtons = (url) => {
    finalImageUrl = url;

    downloadBtn.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = finalImageUrl;
      link.download = `perfil-${student.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.click();
    });

    shareBtn.addEventListener("click", async () => {
      if (!navigator.share) {
        alert("Compartir no está disponible en este dispositivo");
        return;
      }

      const blob = await fetch(finalImageUrl).then(r => r.blob());
      const file = new File([blob], "perfil-academico.png", { type: "image/png" });

      try {
        await navigator.share({
          title: "Mi Perfil Académico ⭐",
          text: "¡Mira mis logros este período! 📊",
          files: [file]
        });
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    });
  };

  // Ripple effect al hacer click
  [downloadBtn, shareBtn].forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.className = 'custom-ripple';

      btn.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Cuando la imagen cargue completamente
  img.onload = () => {
    enableButtons(img.src);
  };

  // ==============================
  // CERRAR MODAL
  // ==============================
  const closeModal = () => {
    overlay.classList.remove("active");
    modal.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = "";
    }, 300);
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target === closeBtn) {
      closeModal();
    }
  });

  closeBtn.addEventListener("click", closeModal);
}