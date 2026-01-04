// ==============================
// SHARE IMAGE GENERATOR
// ==============================

import { applyModalBackground } from "../modal-utils.js";
import { calculateGeneralGrade } from "../modal-performance.js";

// ==============================
// QUOTE
// ==============================
function createShareQuote(text) {
  const quote = document.createElement("div");
  quote.className = "share-quote";

  const up = document.createElement("img");
  up.src = "../salon-style/modal/comilla-up.png";
  up.className = "share-quote-mark up";

  const span = document.createElement("span");
  span.textContent = (text || "").toUpperCase();

  const down = document.createElement("img");
  down.src = "../salon-style/modal/comilla-down.png";
  down.className = "share-quote-mark down";

  quote.append(up, span, down);
  return quote;
}

// ==============================
// GENERAL DASHBOARD
// ==============================
async function createShareGeneralDashboard(student) {
  const res = await fetch("../database/grades/2025-B4.json");
  const data = await res.json();

  const grades = data.grades?.[student.internalId];
  if (!grades) return null;

  const general = calculateGeneralGrade(grades);

  const dashboard = document.createElement("div");
  dashboard.className = "share-general-dashboard";

  dashboard.innerHTML = `
    <div class="label">GENERAL</div>
    <div class="grade">${general.grade}</div>
    <div class="points">${general.points} pts</div>
  `;

  return dashboard;
}

// ==============================
// IMAGE PATH HELPER
// ==============================
function getCanvasPhoto(src) {
  if (!src || src.includes("unknown")) {
    return "../salon-style/tarjetas/unknown-cvs.png";
  }

  const dot = src.lastIndexOf(".");
  if (dot === -1) return src;

  return `${src.slice(0, dot)}-cvs${src.slice(dot)}`;
}

// ==============================
// MAIN GENERATOR
// ==============================
export async function generateShareImage(student) {

  const root = document.createElement("div");
  root.className = "share-render-root";

  const canvas = document.createElement("div");
  canvas.className = "share-canvas";

  // Fondo
  applyModalBackground(canvas, student);

  // Overlays
  [
    ["share-linear-bg", "../salon-style/modal/background-linear.png"],
    ["share-linear", "../salon-style/modal/linear.png"]
  ].forEach(([cls, src]) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = cls;
    canvas.appendChild(img);
  });

  // Bordes
  [
    ["lt", "left-top"], ["rt", "right-top"],
    ["lb", "left-bottom"], ["rb", "right-bottom"]
  ].forEach(([cls, name]) => {
    const img = document.createElement("img");
    img.src = `../salon-style/modal/margin/${name}.png`;
    img.className = `share-border ${cls}`;
    canvas.appendChild(img);
  });

  // Estrellas
  [
    ["share-star", "star-medium.png"],
    ["share-star-front big", "star.png"],
    ["share-star-front small", "star.png"]
  ].forEach(([cls, file]) => {
    const img = document.createElement("img");
    img.src = `../salon-style/modal/${file}`;
    img.className = cls;
    canvas.appendChild(img);
  });

  // Logo top
  const logo = document.createElement("img");
  logo.src = "../../icons/BLESSED-LOGO.png";
  logo.className = "share-logo";
  canvas.appendChild(logo);

  // ==============================
  // CONTENT
  // ==============================
  const content = document.createElement("div");
  content.className = "share-content";

  // META
  const [firstName, ...rest] = student.name.split(" ");
  const lastName = rest.join(" ");

  const birth = formatDate(student.birthday);
  const nameLen = firstName.length;

  let size = 178;
  if (nameLen <= 5) size = 213.66;
  if (nameLen >= 11) size = 143.74;

  const meta = document.createElement("div");
  meta.className = "share-meta";
  meta.style.setProperty("--first-name-size", `${size}px`);

  meta.innerHTML = `
    <div class="meta-date">${birth}</div>

    <div class="meta-name">
      <span class="first-name">${firstName.toUpperCase()}</span>
      <span class="last-name">${lastName.toUpperCase()}</span>
    </div>

    <div class="meta-data-prio">
      <span>ID: ${student.schoolId}</span>
      <span>${student.name.toUpperCase()}</span>
    </div>
  `;

  // PHOTO
  const photo = document.createElement("div");
  photo.className = "share-photo";

  const img = document.createElement("img");
  img.src = getCanvasPhoto(student.photo);
  img.style.opacity = img.src.includes("unknown") ? "0.31" : "1";

  photo.appendChild(img);

  // PERSONAL INFO
  const personal = document.createElement("div");
  personal.className = "share-personal-info";

  const dashboard = await createShareGeneralDashboard(student);
  if (dashboard) personal.appendChild(dashboard);

  personal.appendChild(createShareQuote(student.quote));

  content.append(meta, photo, personal);
  canvas.appendChild(content);

  // Render
  root.appendChild(canvas);
  document.body.appendChild(root);

  const image = await htmlToImage(canvas);
  root.remove();

  return image;
}

// ==============================
// UTILS
// ==============================
function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
}

async function htmlToImage(node) {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: null
  });
  return canvas.toDataURL("image/png");
}
