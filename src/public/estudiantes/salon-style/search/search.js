import { filteredByClass, renderStudents } from "../tarjetas/cards.js";


const input = document.getElementById("searchInput");

input.addEventListener("input", () => {
  const query = input.value.toLowerCase();

  const result = filteredByClass.filter(student =>
    student.name.toLowerCase().includes(query)
  );

  renderStudents(result);
});
