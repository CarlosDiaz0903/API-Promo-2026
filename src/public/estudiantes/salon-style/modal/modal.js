// ==============================
// IMPORTS
// ==============================
import { buildProfileSection } from "../modal/modal-profile.js";
import {
  buildPerformanceSection,
  buildAcademicSection
} from "../modal/modal-performance.js";
import { applyModalBackground } from "./modal-utils.js";

// ==============================
// MODAL PRINCIPAL
// ==============================

export async function openStudentModal(student) {
  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "student-modal-overlay";

  // Modal (MARCO)
  const modal = document.createElement("div");
  modal.className = "student-modal";

//BOTON DE
  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.innerHTML = "✕";

  modal.appendChild(closeBtn);


  applyModalBackground(modal, student);

  // ==============================
  // BORDES DECORATIVOS (FIJOS)
  // ==============================
  const borders = [
    { class: "modal-border lt", src: "../salon-style/modal/margin/left-top.png" },
    { class: "modal-border lb", src: "../salon-style/modal/margin/left-bottom.png" },
    { class: "modal-border rt", src: "../salon-style/modal/margin/right-top.png" },
    { class: "modal-border rb", src: "../salon-style/modal/margin/right-bottom.png" }
  ];

  borders.forEach(b => {
    const img = document.createElement("img");
    img.src = b.src;
    img.className = b.class;
    modal.appendChild(img);
  });

  // ==============================
  // CONTENEDOR SCROLLEABLE
  // ==============================
  const modalScroll = document.createElement("div");
  modalScroll.className = "modal-scroll";

  // PERFIL
  const profile = buildProfileSection(student);

  // RENDIMIENTO
  const performance = await buildPerformanceSection(student);
  const academic = await buildAcademicSection(student);
  performance.appendChild(academic);

  modalScroll.append(profile, performance);
  modal.appendChild(modalScroll);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";


  // ==============================
  // BLOQUEO POR APROBACIÓN
  // ==============================
  if (student.approved === false) {
    modal.classList.add("locked");

    const lockOverlay = document.createElement("div");
    lockOverlay.className = "modal-lock";

    lockOverlay.innerHTML = `
      <div class="lock-message">
        <span>PERFIL Y CALIFICACIONES</span>
        <span>AÚN NO HABILITADAS</span>
        <p>
          Para habilitar este perfil,<br>
          contacta a <strong>Carlos Díaz</strong>.
        </p>
      </div>
    `;

    modal.appendChild(lockOverlay);
  }

  // ==============================
  // CERRAR MODAL
  // ==============================

  function closeModal(overlay) {
    overlay.remove();
    document.body.style.overflow = "";
  }
 
  closeBtn.addEventListener("click", e => {
    e.stopPropagation();
    closeModal(overlay);
  });

  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      closeModal(overlay);
    }
  });

}
