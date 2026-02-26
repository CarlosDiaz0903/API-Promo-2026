/**
 * Share Preview - Version A (Original Image Design)
 * Premium Preview Modal with Enhanced UX
 */

import { generateShareImage } from "./share-image.js";

/**
 * Open share preview modal with image generation
 * @param {Object} student - Student data object
 */
export async function openSharePreview(student) {
  // Create overlay
  const overlay = createOverlay();
  const modal = createModal();
  
  // Create loader
  const loader = createLoader();
  modal.appendChild(loader);
  
  // Create image container
  const imgContainer = createImageContainer();
  modal.appendChild(imgContainer);
  
  // Create action buttons
  const actions = createActionButtons(student);
  modal.appendChild(actions);
  
  // Create close button
  const closeBtn = createCloseButton();
  modal.appendChild(closeBtn);
  
  // Assemble and mount
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Lock body scroll
  document.body.style.overflow = "hidden";
  
  // Animate entrance
  requestAnimationFrame(() => {
    overlay.classList.add("active");
    modal.classList.add("active");
  });
  
  // Generate image
  try {
    const imageUrl = await generateShareImage(student);
    displayGeneratedImage(imgContainer, loader, imageUrl);
    enableButtons(actions, imageUrl, student);
  } catch (error) {
    showError(loader, error);
  }
  
  // Setup close handlers
  setupCloseHandlers(overlay, modal, closeBtn);
}

/**
 * Create overlay element
 */
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "share-preview-overlay";
  return overlay;
}

/**
 * Create modal container
 */
function createModal() {
  const modal = document.createElement("div");
  modal.className = "share-preview-modal";
  return modal;
}

/**
 * Create loader with premium animation
 */
function createLoader() {
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
  
  return loader;
}

/**
 * Create image container
 */
function createImageContainer() {
  const img = document.createElement("img");
  img.className = "share-preview-img";
  img.style.opacity = "0";
  img.alt = "Vista previa del perfil académico";
  return img;
}

/**
 * Create action buttons
 */
function createActionButtons(student) {
  const actions = document.createElement("div");
  actions.className = "share-actions";
  actions.style.opacity = "0";
  
  actions.innerHTML = `
    <button class="share-btn download" aria-label="Descargar imagen">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      DESCARGAR
    </button>
    <button class="share-btn share" aria-label="Compartir imagen">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
      COMPARTIR
    </button>
  `;
  
  return actions;
}

/**
 * Create close button
 */
function createCloseButton() {
  const closeBtn = document.createElement("button");
  closeBtn.className = "share-close";
  closeBtn.innerHTML = "✕";
  closeBtn.setAttribute("aria-label", "Cerrar vista previa");
  return closeBtn;
}

/**
 * Display generated image
 */
function displayGeneratedImage(imgContainer, loader, imageUrl) {
  // Fade out loader
  loader.style.opacity = "0";
  
  setTimeout(() => {
    loader.remove();
    
    // Show image
    imgContainer.src = imageUrl;
    imgContainer.onload = () => {
      imgContainer.style.opacity = "1";
      imgContainer.classList.add("loaded");
    };
  }, 400);
}

/**
 * Enable action buttons
 */
function enableButtons(actions, imageUrl, student) {
  const downloadBtn = actions.querySelector(".share-btn.download");
  const shareBtn = actions.querySelector(".share-btn.share");
  
  // Show buttons
  setTimeout(() => {
    actions.style.opacity = "1";
    actions.style.transition = "opacity 0.4s ease";
  }, 600);
  
  // Download handler
  downloadBtn.addEventListener("click", () => {
    handleDownload(imageUrl, student);
    addRippleEffect(downloadBtn, event);
  });
  
  // Share handler
  shareBtn.addEventListener("click", async () => {
    await handleShare(imageUrl, student);
    addRippleEffect(shareBtn, event);
  });
  
  // Ripple effects
  [downloadBtn, shareBtn].forEach(btn => {
    btn.addEventListener("click", function(e) {
      addRippleEffect(this, e);
    });
  });
}

/**
 * Handle download
 */
function handleDownload(imageUrl, student) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `perfil-academico-${student.name.replace(/\s+/g, "-").toLowerCase()}.png`;
  link.click();
  
  console.log("✅ Image downloaded:", link.download);
}

/**
 * Handle share
 */
async function handleShare(imageUrl, student) {
  // Check if Web Share API is available
  if (!navigator.share) {
    showShareFallback();
    return;
  }
  
  try {
    // Convert to blob
    const blob = await fetch(imageUrl).then(r => r.blob());
    const file = new File([blob], "perfil-academico.png", { type: "image/png" });
    
    // Share
    await navigator.share({
      title: `Perfil Académico - ${student.name}`,
      text: "¡Mira mi perfil académico! 📊⭐",
      files: [file]
    });
    
    console.log("✅ Image shared successfully");
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("❌ Share error:", error);
      showShareFallback();
    }
  }
}

/**
 * Show share fallback message
 */
function showShareFallback() {
  // Create temporary toast notification
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    border-radius: 12px;
    font-family: "D-DIN Exp", sans-serif;
    font-size: 14px;
    z-index: 100001;
    animation: fadeIn 0.3s ease;
  `;
  toast.textContent = "📱 Descarga la imagen y compártela desde tu galería";
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Add ripple effect to button
 */
function addRippleEffect(button, event) {
  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const ripple = document.createElement("span");
  ripple.className = "custom-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  button.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 700);
}

/**
 * Show error state
 */
function showError(loader, error) {
  console.error("❌ Share generation error:", error);
  
  loader.querySelector(".loader-canvas").innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 32px;
      text-align: center;
    ">
      <div style="font-size: 48px;">😔</div>
      <p style="
        font-family: 'D-DIN Exp', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin: 0;
      ">Error al generar la imagen</p>
      <p style="
        font-family: 'D-DIN Exp', sans-serif;
        font-size: 14px;
        color: rgba(255,255,255,0.7);
        margin: 0;
      ">Por favor, intenta nuevamente</p>
    </div>
  `;
}

/**
 * Setup close handlers
 */
function setupCloseHandlers(overlay, modal, closeBtn) {
  const closeModal = () => {
    overlay.classList.remove("active");
    modal.classList.remove("active");
    
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = "";
    }, 400);
  };
  
  // Close on button click
  closeBtn.addEventListener("click", closeModal);
  
  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  
  document.addEventListener("keydown", handleEscape);
}