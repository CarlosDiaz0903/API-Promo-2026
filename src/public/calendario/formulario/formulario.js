const apiUrl = 'https://api-promo-2026.onrender.com/api/eventos'; // Cambia a la URL correcta si no es localhost

    async function fetchEvents() {///
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const eventos = await response.json();
          renderEvents(eventos);
        } else {
          throw new Error('Error al obtener los eventos: ' + response.status);
        }
      } catch (error) {
        console.error('Error al obtener los eventos:', error);
      }
    }

    function renderEvents(eventos) {
  const eventosDiv = document.getElementById('eventos');
  eventosDiv.innerHTML = '';

  eventos.forEach((evento) => {
    console.log('ID del evento:', evento._id);
    const eventoDiv = document.createElement('div');
    eventoDiv.className = 'evento';
    eventoDiv.innerHTML = `
      <h2>${evento.nombre}</h2>
      <p><strong>Tipo:</strong> ${evento.tipo}</p>
      <p><strong>Curso:</strong> ${evento.curso || 'No especificado'}</p>
      <p><strong>Fecha:</strong> ${evento.fecha}</p>
      <p><strong>Hora:</strong> ${evento.hora}</p>
      <p><strong>Detalles:</strong> ${evento.detalles}</p>
      <p><strong>Imagen:</strong> <a href="${evento.imagen}" target="_blank">Ver Imagen</a></p>
      <p><strong>Lugar:</strong> ${evento.lugar || 'No especificado'}</p>
      <p><strong>Resolución:</strong> ${evento.resolucion || 'No especificado'}</p>
      <button class="btn btn-secondary btn-sm mt-2" onclick="editEvent('${evento._id}')">Editar</button>
      <button class="btn btn-danger btn-sm mt-2" onclick="deleteEvent('${evento._id}')">Eliminar</button>
    `;
    eventosDiv.appendChild(eventoDiv);
  });
}

function showFields() {
  const tipo = document.getElementById('tipo').value;
  const cursoField = document.getElementById('curso-field');
  const resolucionToggleField = document.getElementById('resolucion-toggle-field');
  const resolucionField = document.getElementById('resolucion-field');
  const lugarField = document.getElementById('lugar-field');

  // Mostrar el campo de curso para todos los tipos de evento
  cursoField.classList.toggle('hidden-field', false); // Siempre mostrar el campo de curso

  // Mostrar el campo de resolución solo para Tarea y Examen
  resolucionToggleField.classList.toggle('hidden-field', tipo !== 'Tarea' && tipo !== 'Examen');
  resolucionField.classList.toggle('hidden-field', tipo !== 'Tarea' && tipo !== 'Examen' || !document.getElementById('toggleResolucion').checked);
  
  // Mostrar el campo de lugar solo para Presentación y Actividad
  lugarField.classList.toggle('hidden-field', tipo !== 'Presentación' && tipo !== 'Actividad');
}

    function toggleResolucionText() {
      const resolucionField = document.getElementById('resolucion-field');
      const resolucionInput = document.getElementById('resolucion');
      resolucionField.classList.toggle('hidden-field', !document.getElementById('toggleResolucion').checked);
      resolucionInput.disabled = !document.getElementById('toggleResolucion').checked;
    }

    async function saveEvent() {
      const id = document.getElementById('editIndex').value;
      const event = {
        tipo: document.getElementById('tipo').value,
        nombre: document.getElementById('nombre').value,
        curso: document.getElementById('curso').value || '',
        resolucion: document.getElementById('resolucion').value || '',
        lugar: document.getElementById('lugar').value || '',
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        detalles: document.getElementById('detalles').value,
        imagen: document.getElementById('imagen').value || '',
      };

      try {
        if (id) {
          // Update existing event
          const response = await fetch(`${apiUrl}/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          });

          if (!response.ok) throw new Error('Error al actualizar el evento: ' + response.status);
        } else {
          // Create new event
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          });

          if (!response.ok) throw new Error('Error al crear el evento: ' + response.status);
        }
        resetForm();
        fetchEvents();
      } catch (error) {
        console.error('Error al guardar el evento:', error);
      }
    }

    async function editEvent(eventId) {
  try {
    // Obtener todos los eventos del database
    const response = await fetch(apiUrl);
    if (response.ok) {
      const eventos = await response.json();

      // Filtrar el evento que se quiere editar
      const evento = eventos.find((evento) => evento._id === eventId);

      if (evento) {
        // Rellenar los campos del formulario con los datos del evento
        document.getElementById('tipo').value = evento.tipo;
        document.getElementById('nombre').value = evento.nombre;
        document.getElementById('curso').value = evento.curso || '';
        document.getElementById('resolucion').value = evento.resolucion || '';
        document.getElementById('lugar').value = evento.lugar || '';
        document.getElementById('fecha').value = evento.fecha;
        document.getElementById('hora').value = evento.hora;
        document.getElementById('detalles').value = evento.detalles;
        document.getElementById('imagen').value = evento.imagen || '';

        // Mostrar los campos ocultos según el tipo de evento
        showFields();

        // Mostrar el botón de guardar cambios
        document.getElementById('saveChanges').style.display = 'block';

        // Agregar evento al botón de guardar cambios
        document.getElementById('saveChanges').addEventListener('click', async () => {
          try {
            // Obtener los datos del formulario
            const evento = {
              tipo: document.getElementById('tipo').value,
              nombre: document.getElementById('nombre').value,
              curso: document.getElementById('curso').value || '',
              resolucion: document.getElementById('resolucion').value || '',
              lugar: document.getElementById('lugar').value || '',
              fecha: document.getElementById('fecha').value,
              hora: document.getElementById('hora').value,
              detalles: document.getElementById('detalles').value,
              imagen: document.getElementById('imagen').value || '',
            };

            // Enviar la solicitud de actualización al servidor
            const response = await fetch(`${apiUrl}/${eventId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(evento),
            });

            if (response.ok) {
              // Mostrar mensaje de éxito
              alert('Evento actualizado con éxito');

              // Ocultar el botón de guardar cambios
              document.getElementById('saveChanges').style.display = 'none';

              // Refrescar la lista de eventos
              fetchEvents();
            } else {
              // Mostrar mensaje de error
              alert('Error al actualizar el evento');
            }
          } catch (error) {
            console.error(error);
          }
        });
      } else {
        console.log('Evento no encontrado:', eventId);
        throw new Error('Evento no encontrado');
      }
    } else {
      throw new Error('Error al obtener los eventos');
    }
  } catch (error) {
    console.error(error);
  }
}
    async function deleteEvent(id) {
      if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
        try {
          const response = await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('Error al eliminar el evento: ' + response.status);
          fetchEvents();
        } catch (error) {
          console.error('Error al eliminar el evento:', error);
        }
      }
    }

    function resetForm() {
      document.getElementById('eventoForm').reset();
      document.getElementById('editIndex').value = '';
      showFields();
      toggleResolucionText();
    }

    document.addEventListener('DOMContentLoaded', fetchEvents);