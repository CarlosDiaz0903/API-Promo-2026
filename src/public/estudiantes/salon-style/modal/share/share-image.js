// ==============================
// SHARE IMAGE GENERATOR
// ==============================

import { applyModalBackground } from "../modal-utils.js";


export async function generateShareImage(student) {
  // ROOT OCULTO
  const root = document.createElement("div");
  root.className = "share-render-root";

  // CANVAS 9:16
  const canvas = document.createElement("div");
  canvas.className = "share-canvas";

  applyModalBackground(canvas, student);

  // ==============================
  // BORDES
  // ==============================
  const borders = [
    { cls: "lt", src: "../salon-style/modal/margin/left-top.png" },
    { cls: "rt", src: "../salon-style/modal/margin/right-top.png" },
    { cls: "lb", src: "../salon-style/modal/margin/left-bottom.png" },
    { cls: "rb", src: "../salon-style/modal/margin/right-bottom.png" }
  ];

  borders.forEach(b => {
    const img = document.createElement("img");
    img.src = b.src;
    img.className = `share-border ${b.cls}`;
    canvas.appendChild(img);
  });

  // ==============================
  // CONTENIDO (placeholder por ahora)
  // ==============================
  const content = document.createElement("div");
  content.className = "share-content";

  content.innerHTML = `
    <div class="share-title">${student.name}</div>
    <div class="share-sub">Rendimiento Académico</div>
  `;

  canvas.appendChild(content);
  root.appendChild(canvas);
  document.body.appendChild(root);

  // ==============================
  // CONVERTIR A IMAGEN
  // ==============================
  const image = await htmlToImage(canvas);

  root.remove();
  return image;
}

// ==============================
// HTML → IMAGE
// ==============================

async function htmlToImage(node) {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: null
  });

  return canvas.toDataURL("image/png");
}
