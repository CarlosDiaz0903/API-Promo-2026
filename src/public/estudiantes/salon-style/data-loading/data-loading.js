// ================================
// CONFIG
// ================================
const STUDENTS_URL = "../database/students.json";
const GRADES_URL = "../database/grades/2025-B4.json";

// ================================
// UTILS
// ================================
function gradeWeight(g) {
  return g === "AD" ? 4 : g === "A" ? 3 : g === "B" ? 2 : 1;
}

function calculateGeneralGrade(studentGrades) {
  const flat = [];

  Object.values(studentGrades).forEach(arr => {
    if (!Array.isArray(arr)) return;
    arr.forEach(g => flat.push(g));
  });

  const count = flat.length;
  if (!count) return "—";

  const ad = flat.filter(g => g === "AD").length;
  const b = flat.filter(g => g === "B").length;
  const c = flat.filter(g => g === "C").length;

  if (ad >= 5) return "AD";
  if (ad >= 3) return "A+";
  if (b >= 3) return "B";
  if (c >= 3) return "C";

  const freq = flat.reduce((a, g) => {
    a[g] = (a[g] || 0) + 1;
    return a;
  }, {});

  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

// ================================
// COUNTER ANIMATION
// ================================
function animateCounter(el, target, suffix = "", duration = 1500) {
  let start = 0;
  const startTime = performance.now();

  function update(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic mejorado
    const eased = 1 - Math.pow(1 - progress, 4);
    const value = Math.floor(eased * target);
    
    el.textContent = value + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target + suffix; // Asegura valor exacto
    }
  }

  requestAnimationFrame(update);
}

// ================================
// MAIN
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  const classId = document.body.dataset.class;
  if (!classId) return;

  const [studentsRes, gradesRes] = await Promise.all([
    fetch(STUDENTS_URL),
    fetch(GRADES_URL)
  ]);

  const studentsJSON = await studentsRes.json();
  const gradesData = await gradesRes.json();

  const students = Array.isArray(studentsJSON)
    ? studentsJSON
    : studentsJSON.students;

  const classStudents = students.filter(
    s => s.currentClass === classId
  );

  // ================================
  // 1️⃣ TOTAL ESTUDIANTES
  // ================================
  const totalEl = document.querySelector(
    '.stat-number[data-target]'
  );

  animateCounter(totalEl, classStudents.length);

  // ================================
  // 2️⃣ PROMEDIO GENERAL
  // ================================
  const grades = classStudents
    .map(s => gradesData.grades?.[s.internalId])
    .filter(Boolean);

  let general = "—";

  if (grades.length) {
    const allGrades = grades.flatMap(g =>
      Object.values(g).flat()
    );

    general = calculateGeneralGrade(
      Object.fromEntries(
        allGrades.map((g, i) => [i, [g]])
      )
    );
  }

  document.querySelector(".stat-letter").textContent = general;

  // ================================
  // 3️⃣ APROBADOS (%)
  // ================================
  const approved = classStudents.filter(s => s.approved).length;
  const percent = Math.round((approved / classStudents.length) * 100);

  const approvedEl = document.querySelector(
    '.stat-number[data-suffix="%"]'
  );

  animateCounter(approvedEl, percent, "%");
});
