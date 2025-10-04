import { db } from "../../firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const eventosRef = collection(db, "eventos");

async function fetchEvents() {
  try {
    const snapshot = await getDocs(eventosRef);
    const eventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderEvents(eventos);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
  }
}

function renderEvents(eventos) {
  const eventosDiv = document.getElementById("eventos");
  eventosDiv.innerHTML = "";
  eventos.forEach(evento => {
    const div = document.createElement("div");
    div.className = "evento";
    div.innerHTML = `
      <h2>${evento.nombre}</h2>
      <p><strong>Tipo:</strong> ${evento.tipo}</p>
      <p><strong>Curso:</strong> ${evento.curso || "No especificado"}</p>
      <p><strong>Fecha:</strong> ${evento.fecha}</p>
      <p><strong>Hora:</strong> ${evento.hora}</p>
      <p><strong>Detalles:</strong> ${evento.detalles}</p>
      <p><strong>Lugar:</strong> ${evento.lugar || "No especificado"}</p>
      <button onclick="editEvent('${evento.id}')">Editar</button>
      <button onclick="deleteEvent('${evento.id}')">Eliminar</button>
    `;
    eventosDiv.appendChild(div);
  });
}

window.saveEvent = async function () {
  const id = document.getElementById("editIndex").value;
  const event = {
    tipo: document.getElementById("tipo").value,
    nombre: document.getElementById("nombre").value,
    curso: document.getElementById("curso").value || "",
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    detalles: document.getElementById("detalles").value,
    lugar: document.getElementById("lugar").value || "",
    resolucion: document.getElementById("resolucion").value || "",
    imagen: document.getElementById("imagen").value || "",
  };

  try {
    if (id) {
      const docRef = doc(db, "eventos", id);
      await updateDoc(docRef, event);
    } else {
      await addDoc(eventosRef, event);
    }
    resetForm();
    fetchEvents();
  } catch (error) {
    console.error("Error al guardar evento:", error);
  }
};

window.deleteEvent = async function (id) {
  if (confirm("¿Seguro de eliminar este evento?")) {
    try {
      await deleteDoc(doc(db, "eventos", id));
      fetchEvents();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  }
};

function resetForm() {
  document.getElementById("eventoForm").reset();
  document.getElementById("editIndex").value = "";
}

document.addEventListener("DOMContentLoaded", fetchEvents);
