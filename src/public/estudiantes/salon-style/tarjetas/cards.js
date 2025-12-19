export let filteredByClass = [];
import { openStudentModal } from "../modal/modal.js";
import { calculateGeneralGrade } from "../modal/modal-performance.js";

const grid = document.getElementById("studentsGrid");
const currentClass = document.body.dataset.class;

let gradesCache = null;

async function loadGrades() {
  if (gradesCache) return gradesCache;
  const res = await fetch("../database/grades/2025-B4.json");
  gradesCache = await res.json();
  return gradesCache;
}


/* =========================
   RENDER DE TARJETAS
========================= */
export async function renderStudents(students) {
  grid.innerHTML = "";

  const gradesData = await loadGrades();

  for (const student of students) {
    const card = document.createElement("div");
    card.className = "student-card";

    /* FONDO */
    function darkenColor(hex, percent) {
      let num = parseInt(hex.replace("#", ""), 16);
      let r = (num >> 16) & 255;
      let g = (num >> 8) & 255;
      let b = num & 255;

      r = Math.max(0, Math.floor(r * (1 - percent)));
      g = Math.max(0, Math.floor(g * (1 - percent)));
      b = Math.max(0, Math.floor(b * (1 - percent)));

      return `rgb(${r}, ${g}, ${b})`;
    }

    if (student.profileTheme?.background) {
      card.style.backgroundImage = `url(${student.profileTheme.background})`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    } else {
      const accent = student.profileTheme?.accentColor || "#333";

      if (accent.toLowerCase() === "#333") {
        card.style.backgroundColor = "#333";
        card.style.backgroundImage = "none";
      } else {
        const darkerAccent = darkenColor(accent, 0.4);
        card.style.backgroundImage = `linear-gradient(to left, ${accent}, ${darkerAccent})`;
      }
    }

    /* GENERAL */
    const studentGrades = gradesData.grades?.[student.internalId];
    let generalLabel = "—";

    if (studentGrades) {
      generalLabel = calculateGeneralGrade(studentGrades).grade;
    }

    /* IMAGEN */
    const isUnknown = !student.photo;
    const photoSrc = isUnknown
      ? "../salon-style/tarjetas/unknown.png"
      : student.photo;

    card.innerHTML = `
      <div class="card-info">
        <div class="student-name">${student.name}</div>
        <div class="student-meta">
          <div>ID: ${student.schoolId}</div>
          <div>General: ${generalLabel}</div>
        </div>
      </div>

      <div class="card-photo">
        <img
          src="${photoSrc}"
          class="${isUnknown ? "unknown-photo" : ""}"
          loading="lazy"
          alt=""
        >
      </div>
    `;

    card.addEventListener("click", () => {
      openStudentModal(student);
    });

    grid.appendChild(card);
  }
}


/* =========================
   CARGA DE DATOS
========================= */
fetch("../database/students.json")
  .then(res => res.json())
  .then(data => {
    filteredByClass = data.students.filter(
      student => student.currentClass === currentClass
    );

    // 🔥 IMPORTANTE: mostrar TODOS al inicio
    renderStudents(filteredByClass);
  });
