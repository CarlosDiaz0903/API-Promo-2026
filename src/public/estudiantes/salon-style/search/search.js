import { filteredByClass, renderStudents } from "../tarjetas/cards.js";

const input = document.getElementById("searchInput");
const searchBar = document.querySelector(".search-bar");
const clearBtn = document.querySelector(".clear-btn");

input.addEventListener("input", () => {
  const query = input.value.trim().toLowerCase();
  
  // Agregar/quitar clase filled
  if (query) {
    searchBar.classList.add("filled");
  } else {
    searchBar.classList.remove("filled");
  }

  const result = filteredByClass.filter(student =>
    student.name.toLowerCase().includes(query)
  );

  renderStudents(result);
});

// Limpiar búsqueda
clearBtn.addEventListener("click", () => {
  input.value = "";
  input.focus();
  searchBar.classList.remove("filled");
  renderStudents(filteredByClass);
  input.dispatchEvent(new Event("input"));
});