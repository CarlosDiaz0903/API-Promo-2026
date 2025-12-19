// ================================
// CONVERSIONES BASE
// ================================
const gradeToPoints = {
  AD: 4,
  A: 3,
  B: 2,
  C: 1
};

function pointsToJapanese(avg) {
  if (avg >= 3.7) return { grade: "S", points: 95 };
  if (avg >= 3.2) return { grade: "A", points: 88 };
  if (avg >= 2.6) return { grade: "B", points: 76 };
  if (avg >= 2.0) return { grade: "C", points: 64 };
  if (avg >= 1.5) return { grade: "D", points: 52 };
  return { grade: "F", points: 40 };
}


// ================================
// LOAD GRADES (SAFE)
// ================================
async function loadGrades() {
  const res = await fetch("../database/grades/2025-B4.json");
  return await res.json();
}

async function loadCourses() {
  const res = await fetch("../database/courses.json");
  return await res.json();
}

// ================================
// CALCULOS
// ================================
export function calculateGeneralGrade(studentGrades) {
  const counter = { AD: 0, A: 0, B: 0, C: 0 };
  let totalGrades = 0;

  Object.values(studentGrades).forEach(course => {
    if (!Array.isArray(course)) return;
    course.forEach(g => {
      if (counter[g] !== undefined) {
        counter[g]++;
        totalGrades++;
      }
    });
  });

  // 🛑 SIN NOTAS
  if (totalGrades === 0) {
    return { grade: "-", points: "-" };
  }

  const { AD, A, B, C } = counter;

  // 🔝 Reglas prioritarias
  if (AD >= 5) return { grade: "AD", points: 95 };
  if (AD >= 3) return { grade: "A+", points: 90 };

  // Nota más repetida
  const mostRepeated = Object.entries(counter)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Ajustes finos
  if (mostRepeated === "A" && B >= 1) {
    return { grade: "A-", points: 85 };
  }

  if (B >= 3) return { grade: "B", points: 75 };
  if (C >= 3) return { grade: "C", points: 60 };

  // Fallback
  const pointsMap = {
    AD: 95,
    A: 88,
    B: 72,
    C: 55
  };

  return {
    grade: mostRepeated,
    points: pointsMap[mostRepeated] ?? "-"
  };
}

function calculateByAreas(studentGrades, areas) {
  let total = 0;
  let count = 0;

  areas.forEach(code => {
    const grades = studentGrades[code];
    if (!Array.isArray(grades)) return;

    grades.forEach(g => {
      total += gradeToPoints[g] ?? 0;
      count++;
    });
  });

  return count ? total / count : 0;
}

function calculateJapaneseProfile(studentGrades) {
  const metrics = [
    { title: "Pensamiento Rápido", avg: calculateByAreas(studentGrades, ["MAT", "CYT"]) },
    { title: "Creatividad", avg: calculateByAreas(studentGrades, ["ART", "EPT"]) },
    { title: "Rendimiento", avg: calculateByAreas(studentGrades, Object.keys(studentGrades)), type: "academic" },
    { title: "Concentración", avg: calculateByAreas(studentGrades, ["TRANS", "EDUF"]) }
  ];

  return metrics.map(m => {
    const jp = pointsToJapanese(m.avg);
    return { title: m.title, grade: jp.grade, points: jp.points };
  });
}


// ================================
// UI
// ================================
function createJapaneseCard(title, grade, points) {
  const card = document.createElement("div");
  card.className = "jp-card";

  const cat = document.createElement("div");
  cat.className = "jp-category";
  cat.textContent = title;

  const data = document.createElement("div");
  data.className = "jp-data";

  const g = document.createElement("div");
  g.textContent = grade;

  const p = document.createElement("div");
  p.textContent = `${points} pts`;

  data.append(g, p);
  card.append(cat, data);

  return card;
}

// ================================
// EXPORT PRINCIPAL
// ================================
export async function buildPerformanceSection(student) {
  console.log("BUILD PERFORMANCE", student.internalId);

  // 1️⃣ PRIMERO cargar datos
  const gradesData = await loadGrades();

console.log("ID BUSCADO:", student.internalId);
console.log("IDS DISPONIBLES:", Object.keys(gradesData));

const studentGrades = gradesData.grades?.[student.internalId];

if (!studentGrades) {
  console.warn("No grades found for", student.internalId);
  const empty = document.createElement("section");
  empty.className = "performance empty";
  empty.textContent = "SIN REGISTRO ACADÉMICO";
  return empty;
}


  // 3️⃣ UI NORMAL
  const performance = document.createElement("section");
  performance.className = "performance";

  const general = calculateGeneralGrade(studentGrades);

  const dashboard = document.createElement("div");
    dashboard.className = "general-dashboard";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = "GENERAL";

    const grade = document.createElement("div");
    grade.className = "grade";
    grade.textContent = general.grade;

    const points = document.createElement("div");
    points.className = "points";
    points.textContent = `${general.points} pts`;

    dashboard.append(label, grade, points);

  performance.appendChild(dashboard);

  const jp = document.createElement("div");
  jp.className = "japanese-profile";

  calculateJapaneseProfile(studentGrades).forEach(m => {
    jp.appendChild(createJapaneseCard(m.title, m.grade, m.points));
  });

  performance.appendChild(jp);

  const disclaimer = document.createElement("div");
  disclaimer.className = "jp-disclaimer";
  disclaimer.textContent = "Calculados a partir de las notas. No influyen en la evaluación oficial.";

  performance.appendChild(disclaimer);

  return performance;
}

// ================================
// ACADEMIC
// ================================

// ================================
// HELPERS
// ================================
function hexToHue(hex) {
  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h *= 60;
    if (h < 0) h += 360;
  }

  return Math.round(h);
}
function parsePeriod(period) {
  // Ej: 2025-B4
  const [year, bim] = period.split("-");
  const num = bim.replace("B", "");

  const ordinal =
    num === "1" ? "1er" :
    num === "2" ? "2do" :
    num === "3" ? "3er" : `${num}to`;

  return `PERIODO ${ordinal} Bimestre - ${year}`;
}

// ================================
// UI BUILDERS
// ================================
function createCourseCard(courseName, categories, grades, accentColor) {
  const card = document.createElement("div");
  card.className = "course-card";

  const header = document.createElement("div");
  header.className = "course-header";

  const title = document.createElement("div");
  title.className = "course-title";
  title.textContent = courseName;

  header.appendChild(title);

  const body = document.createElement("div");
  body.className = "course-body";

  categories.forEach((cat, i) => {
    const row = document.createElement("div");
    row.className = "course-row";

    const left = document.createElement("div");
    left.className = "competence";
    left.textContent = cat;

    const right = document.createElement("div");
    right.className = "gradeA";
    right.textContent = grades?.[i] ?? "-";

    row.append(left, right);
    body.appendChild(row);
  });

  card.append(header, body);

  // 🔥 ACÁ SE APLICA EL COLOR DINÁMICO
  applyAccentHeader(card, accentColor);

  return card;
}

function applyAccentHeader(cardElement, accentColor) {
  const hue = hexToHue(accentColor);

  const headerColor = `hsla(${hue}, 61.96%, 50%, 0.25)`;
  // usamos lightness 50% para simular B=100%

  cardElement.querySelector(".course-header")
    .style.backgroundColor = headerColor;
}


// ================================
// MAIN EXPORT
// ================================
export async function buildAcademicSection(student) {
  const gradesJSON = await loadGrades();
  const coursesJSON = await loadCourses();

  const studentGrades = gradesJSON.grades?.[student.internalId];
  if (!studentGrades) {
    const empty = document.createElement("section");
    empty.className = "academic-section empty";
    empty.textContent = "SIN REGISTRO ACADÉMICO";
    return empty;
  }

  const academic = document.createElement("section");
  academic.className = "academic-section";

  // ================= HEADER =================
  const header = document.createElement("div");
  header.className = "academic-header";

  const titles = document.createElement("div");
  titles.className = "academic-titles";

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = "CALIFICACIONES";

  const precision = document.createElement("span");
  precision.className = "precision";
  precision.textContent = `79,9% de precisión`;

  titles.append(title, precision);

  const period = document.createElement("div");
  period.className = "academic-period";
  period.textContent = parsePeriod(gradesJSON.period);

  header.append(titles, period);

  // ================= COURSES =================
  const coursesWrap = document.createElement("div");
  coursesWrap.className = "academic-courses";

  Object.entries(coursesJSON.courses).forEach(([code, course]) => {
    const grades = studentGrades[code];
    if (!grades) return;

    coursesWrap.appendChild(
      createCourseCard(
        course.name,
        course.categories,
        grades,
        student.profileTheme?.accentColor
      )
    );
  });

  academic.append(header, coursesWrap);
  return academic;
}
