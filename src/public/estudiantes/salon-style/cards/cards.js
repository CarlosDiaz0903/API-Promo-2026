fetch("../database/students.json")
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById("studentsGrid");
    const currentClass = document.body.dataset.class;

    data.students
      .filter(student => student.currentClass === currentClass)
      .forEach(student => {
        const card = document.createElement("div");
        card.className = "student-card";

        /* FONDO */
        if (student.profileTheme?.background && student.profileTheme.background !== "") {
          card.style.backgroundImage = `url(${student.profileTheme.background})`;
          card.style.backgroundSize = "cover";
          card.style.backgroundPosition = "center";
        } else {
          card.style.backgroundColor = student.profileTheme?.accentColor || "#333";
        }

        /* IMAGEN */
        const photoSrc = student.photo && student.photo !== ""
          ? student.photo
          : "../salon-style/cards/unknown.png";

        const isUnknown = !student.photo || student.photo === "";
        

        card.innerHTML = `
          <div class="card-info">
            <div class="student-name">${student.name}</div>

            <div class="student-meta">
              <div>
                <span class="label">ID: ${student.schoolId}</span>
              </div>
              <div>
                <span class="label">General: A+</span>
              </div>
            </div>
          </div>

          <div class="card-photo">
            <img 
              src="${photoSrc}" 
              class="${isUnknown ? "unknown-photo" : ""}"
              alt=""
            >
          </div>
        `;

        /* CLICK → MODAL */
        card.addEventListener("click", () => {
          openStudentModal(student);
        });

        grid.appendChild(card);
      });
  }
);
