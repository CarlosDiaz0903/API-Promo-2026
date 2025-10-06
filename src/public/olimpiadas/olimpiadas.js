function showContent(dateId, button) {
  // Ocultar todos los contenedores
  document.querySelectorAll(".grid-event").forEach(div => div.style.display = "none");

  // Mostrar solo el correspondiente
  document.getElementById(dateId).style.display = "grid";

  // Quitar 'active' a todos los botones
  document.querySelectorAll(".dia").forEach(btn => btn.classList.remove("active"));

  // Añadir 'active' al botón actual
  button.classList.add("active");
}
    function formatHora(hora24) {
    const [h, m] = hora24.split(":");
    const date = new Date();
    date.setHours(h, m);

    let hora = date.toLocaleTimeString("en-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    return hora.replace(" ", ""); // elimina el espacio entre la hora y AM/PM
}

// Función para asignar clase según país
function getClaseEquipo(nombre) {
    if (/alemania/i.test(nombre)) return "alemania";
    if (/italia/i.test(nombre)) return "italia";
    if (/francia/i.test(nombre)) return "francia";
    return "";
}

fetch("olimpiadas.json")
    .then(r => r.json())
    .then(data => {
        // Agrupar eventos por día
        const eventosPorDia = {};

        data.forEach(evento => {
            if (!eventosPorDia[evento.dia]) {
                eventosPorDia[evento.dia] = [];
            }
            eventosPorDia[evento.dia].push(evento);
        });

        // Recorrer cada día
        Object.keys(eventosPorDia).forEach(dia => {
            // Ordenar cronológicamente por hora (HH:mm en 24h)
            eventosPorDia[dia].sort((a, b) => {
                return a.hora.localeCompare(b.hora);
            });

            eventosPorDia[dia].forEach(evento => {
                const hora12 = formatHora(evento.hora);

                // Determinar clases dinámicamente
                const clase1 = getClaseEquipo(evento.equipo1);
                const clase2 = getClaseEquipo(evento.equipo2);

                const html = `
                <div class="event">
                    <div class="Data1">
                        <div class="deporte">${evento.deporte}</div>
                        <div class="partidos">
                            <div class="equipo ${clase1}">${evento.equipo1}</div>
                            <p>VS</p>
                            <div class="equipo ${clase2}">${evento.equipo2}</div>
                        </div>
                    </div>
                    <div class="dataplace">
                        <div class="hora">${hora12}</div>
                        <div class="lugar">${evento.lugar}</div>
                    </div>
                </div>
                `;

                // Mapear fecha a contenedor
                let diaId = "";
                switch (dia) {
                    case "2025-10-03": diaId = "date1"; break;
                    case "2025-10-06": diaId = "date2"; break;
                    case "2025-10-07": diaId = "date3"; break;
                    case "2025-10-09": diaId = "date4"; break;
                    case "2025-10-10": diaId = "date5"; break;
                }

                if (diaId) {
                    document.getElementById(diaId).innerHTML += html;
                }
            });
        });
    });

    const lastModified = new Date(document.lastModified);
        const opciones = { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" };
        document.getElementById("lastupdate").textContent = lastModified.toLocaleString("es-PE", opciones);