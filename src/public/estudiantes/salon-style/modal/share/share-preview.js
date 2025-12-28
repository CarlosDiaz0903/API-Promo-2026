// ==============================
// SHARE PREVIEW UI
// ==============================

import { generateShareImage } from "./share-image.js";

export async function openSharePreview(student) {
  const overlay = document.createElement("div");
  overlay.className = "share-preview-overlay";

  const modal = document.createElement("div");
  modal.className = "share-preview-modal";

  const img = document.createElement("img");
  img.className = "share-preview-img";

  modal.innerHTML = `
    <button class="share-close">✕</button>

    <div class="share-actions">
      <button class="share-btn download">DESCARGAR</button>
      <button class="share-btn share">COMPARTIR</button>
    </div>
  `;

  modal.prepend(img);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";

  // ==============================
  // GENERAR IMAGEN
  // ==============================
  const generatedImageUrl = await generateShareImage(student);
  img.src = generatedImageUrl;

  // ==============================
  // BOTONES
  // ==============================
  const downloadBtn = modal.querySelector(".share-btn.download");
  const shareBtn = modal.querySelector(".share-btn.share");
  const closeBtn = modal.querySelector(".share-close");

  // ==============================
  // DESCARGAR PNG
  // ==============================
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = "perfil-estudiante.png";
    link.click();
  });

  // ==============================
  // WEB SHARE API
  // ==============================
  shareBtn.addEventListener("click", async () => {
    if (!navigator.share) {
      alert("Compartir no está disponible en este dispositivo");
      return;
    }

    const blob = await fetch(generatedImageUrl).then(r => r.blob());
    const file = new File([blob], "perfil.png", { type: "image/png" });

    try {
      await navigator.share({
        title: "Perfil Académico",
        text: "Mira este perfil académico",
        files: [file]
      });
    } catch {
      // cancelado
    }
  });

  // ==============================
  // CERRAR
  // ==============================
  overlay.addEventListener("click", e => {
    if (e.target === overlay || e.target === closeBtn) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}
