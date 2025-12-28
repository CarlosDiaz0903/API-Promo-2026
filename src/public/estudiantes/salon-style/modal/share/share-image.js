// ==============================
// SHARE IMAGE GENERATOR
// ==============================

import { applyModalBackground } from "../modal-utils.js";

export async function generateShareImage(student) {
  // ROOT OCULTO
  const root = document.createElement("div");
  root.className = "share-render-root";

  // CANVAS (formato historia)
  const canvas = document.createElement("div");
  canvas.className = "share-canvas";

  // 1️⃣ FONDO DINÁMICO
  applyModalBackground(canvas, student);

  // ==============================
  // 2️⃣ OVERLAY LINEAL
  // ==============================
  const linearBg = document.createElement("img");
  linearBg.src = "../salon-style/modal/background-linear.png";
  linearBg.className = "share-linear-bg";
  canvas.appendChild(linearBg);

  // ==============================
  // 2️⃣ LINEAL STAR
  // ==============================
  const linear = document.createElement("img");
  linear.src = "../salon-style/modal/linear.png";
  linear.className = "share-linear";
  canvas.appendChild(linear);


  // ==============================
  // 3️⃣ BORDES
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
  // 4️⃣ ESTRELLA CENTRAL
  // ==============================
  const star = document.createElement("img");
  star.src = "../salon-style/modal/star-medium.png";
  star.className = "share-star";
  canvas.appendChild(star);

  // ==============================
  // STARS GRANDES (FRONT)
  // ==============================

  // Star 1
  const starBig = document.createElement("img");
  starBig.src = "../salon-style/modal/star.png";
  starBig.className = "share-star-front big";
  canvas.appendChild(starBig);

  // Star 2
  const starSmall = document.createElement("img");
  starSmall.src = "../salon-style/modal/star.png";
  starSmall.className = "share-star-front small";
  canvas.appendChild(starSmall);

  // ==============================
  // LOGO FINAL (TOP LAYER)
  // ==============================
  const logo = document.createElement("img");
  logo.src = "../../icons/BLESSED-LOGO.png";
  logo.className = "share-logo";
  canvas.appendChild(logo);



  // ==============================
  // 5️⃣ CONTENIDO
  // ==============================
  const content = document.createElement("div");
  content.className = "share-content";

  content.innerHTML = `
    <div class="share-title"></div>
    <div class="share-sub"></div>
  `;

  canvas.appendChild(content);

  // ENSAMBLAR
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
