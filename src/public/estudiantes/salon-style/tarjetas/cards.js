export let filteredByClass = [];

const grid = document.getElementById("studentsGrid");
const currentClass = document.body.dataset.class;

/* =========================
   RENDER DE TARJETAS
========================= */
export function renderStudents(students) {
  grid.innerHTML = ""; // 🔴 LIMPIA EL GRID

  students.forEach(student => {
    const card = document.createElement("div");
    card.className = "student-card";

    /* FONDO */
    if (student.profileTheme?.background) {
      card.style.backgroundImage = `url(${student.profileTheme.background})`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    } else {
      card.style.backgroundColor =
        student.profileTheme?.accentColor || "#333";
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
          <div>General: A+</div>
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
  });
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
