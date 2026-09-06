/**
 * ==============================================
 * FORMULARIO DE TAREAS - Sistema CRUD Completo
 * Conectado a Supabase
 * FASE 1 - Gestión de Calendario Académico
 * ==============================================
 */

// ==============================================
// CONFIGURACIÓN SUPABASE
// ==============================================

const SUPABASE_URL = 'https://ytgdeutmrujjdjqfivpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Z2RldXRtcnVqamRqcWZpdnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjExNTAsImV4cCI6MjEwNDIzNzE1MH0.1evMikwN9iwJP7Z6ycZka18g9-ZKsEwIGHllaxffxYs';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_NAME = 'tasks';

// ==============================================
// LÓGICA DE IMAGEN AUTOMÁTICA POR CURSO
// ==============================================

const COURSE_IMAGES = {
  'Francés': 'https://www.onemagazine.es/wp-content/uploads/2023/01/frances-basico-600x-1.jpg',
  'Inglés': 'https://kelington.es/wp-content/uploads/2024/03/imagen-Te-contamos-cual-es-el-ingles-mas-hablado-del-mundo.jpg',
  'Alemán': 'https://bartolo.org/media/image/perfil/course/Alem%C3%A1n-0-768x510.png'
};

/**
 * Obtiene la imagen automática según el curso
 * @param {string} course - Nombre del curso
 * @returns {string|null} URL de la imagen o null si no hay coincidencia
 */
function getAutoImageForCourse(course) {
  return COURSE_IMAGES[course] || null;
}

// ==============================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==============================================

const state = {
  tasks: [],
  filteredTasks: [],
  editingTaskId: null,
  taskToDelete: null,
  filters: {
    search: '',
    class: '',
    course: '',
    type: ''
  }
};

// ==============================================
// REFERENCIAS DOM
// ==============================================

const elements = {
  form: document.getElementById('task-form'),
  formModeTitle: document.getElementById('form-mode-title'),
  editTaskId: document.getElementById('edit-task-id'),

  // Campos del formulario
  title: document.getElementById('title'),
  description: document.getElementById('description'),
  course: document.getElementById('course'),
  type: document.getElementById('type'),
  class: document.getElementById('class'),
  date: document.getElementById('date'),
  displayDate: document.getElementById('display-date'),
  image: document.getElementById('image'),

  // Preview de imagen
  imagePreview: document.getElementById('image-preview'),

  // Botones
  cancelBtn: document.getElementById('cancel-btn'),
  submitBtn: document.querySelector('#task-form button[type="submit"]'),
  submitText: document.getElementById('submit-text'),

  // Panel admin
  tasksContainer: document.getElementById('tasks-container'),
  emptyState: document.getElementById('empty-state'),
  noResultsState: document.getElementById('no-results-state'),
  noResultsClearBtn: document.getElementById('no-results-clear-btn'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),

  // Filtros
  searchInput: document.getElementById('search-input'),
  filterClass: document.getElementById('filter-class'),
  filterCourse: document.getElementById('filter-course'),
  filterType: document.getElementById('filter-type'),
  activeFilters: document.getElementById('active-filters'),
  filterChips: document.getElementById('filter-chips'),
  clearFiltersBtn: document.getElementById('clear-filters-btn'),

  // Toast
  toast: document.getElementById('toast'),

  // Modal de eliminación
  deleteModal: document.getElementById('delete-modal'),
  modalCancel: document.getElementById('modal-cancel'),
  modalConfirm: document.getElementById('modal-confirm')
};

// ==============================================
// UTILIDADES - TOAST NOTIFICATIONS
// ==============================================

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {'success'|'error'|'info'} type - Tipo de notificación
 */
function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type}`;

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3500);
}

// ==============================================
// UTILIDADES - FORMATEO DE FECHAS
// ==============================================

/**
 * Formatea una fecha ISO a formato legible español
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatDateDisplay(isoDate) {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  const options = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleDateString('es-PE', options);
}

/**
 * Convierte fecha ISO a formato datetime-local para inputs
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} Fecha en formato YYYY-MM-DDTHH:mm
 */
function isoToDatetimeLocal(isoDate) {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
}

// ==============================================
// LÓGICA DE PREVIEW DE IMAGEN
// ==============================================

/**
 * Actualiza el preview de imagen basado en curso o URL manual
 */
function updateImagePreview() {
  const manualImage = elements.image.value.trim();
  const course = elements.course.value;
  const autoImage = getAutoImageForCourse(course);

  const finalImage = manualImage || autoImage;

  if (finalImage) {
    elements.imagePreview.innerHTML = `<img src="${finalImage}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\\'preview-placeholder\\'><p>No se pudo cargar la imagen</p></div>'">`;
  } else {
    elements.imagePreview.innerHTML = `
      <div class="preview-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <p>La imagen se asignará automáticamente</p>
      </div>
    `;
  }
}

/**
 * Maneja el cambio de curso - autocompleta imagen si aplica
 */
function handleCourseChange() {
  const course = elements.course.value;
  const autoImage = getAutoImageForCourse(course);

  // Solo actualizar el placeholder si el usuario no ha escrito nada manualmente
  if (autoImage && !elements.image.value.trim()) {
    elements.image.placeholder = `Automático: ${autoImage.slice(0, 40)}...`;
  } else if (!autoImage) {
    elements.image.placeholder = 'Ingresa una URL de imagen manualmente';
  }

  updateImagePreview();
}

// ==============================================
// VALIDACIÓN DE FORMULARIO
// ==============================================

/**
 * Valida los campos requeridos del formulario
 * @returns {{valid: boolean, message?: string, field?: HTMLElement}}
 */
function validateForm() {
  const title = elements.title.value.trim();
  const course = elements.course.value;
  const type = elements.type.value;
  const taskClass = elements.class.value;
  const date = elements.date.value;
  const displayDate = elements.displayDate.value.trim();

  if (!title) {
    return { valid: false, message: 'El título es obligatorio', field: elements.title };
  }

  if (!course) {
    return { valid: false, message: 'Debes seleccionar un curso', field: elements.course };
  }

  if (!type) {
    return { valid: false, message: 'Debes seleccionar un tipo', field: elements.type };
  }

  if (!taskClass) {
    return { valid: false, message: 'Debes seleccionar un salón', field: elements.class };
  }

  // Debe existir al menos una fecha (exacta o de display)
  if (!date && !displayDate) {
    return {
      valid: false,
      message: 'Debes indicar una fecha exacta o una fecha para mostrar (Ej: NET MAYO 2026)',
      field: elements.date
    };
  }

  return { valid: true };
}

/**
 * Marca visualmente un campo con error
 * @param {HTMLElement} field - Elemento del campo
 */
function highlightFieldError(field) {
  if (!field) return;

  field.style.borderColor = '#ef4444';
  field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
  field.focus();

  setTimeout(() => {
    field.style.borderColor = '';
    field.style.boxShadow = '';
  }, 2500);
}

// ==============================================
// CRUD - CREATE / UPDATE
// ==============================================

/**
 * Recolecta los datos del formulario en un objeto
 * @returns {Object} Datos de la tarea
 */
function collectFormData() {
  const course = elements.course.value;
  const manualImage = elements.image.value.trim();
  const autoImage = getAutoImageForCourse(course);
  const finalImage = manualImage || autoImage || '';

  const dateValue = elements.date.value
    ? new Date(elements.date.value).toISOString()
    : null;

  return {
    title: elements.title.value.trim(),
    description: elements.description.value.trim() || null,
    course: course,
    type: elements.type.value,
    class: elements.class.value,
    date: dateValue,
    display_date: elements.displayDate.value.trim() || null,
    image: finalImage
  };
}

/**
 * Maneja el envío del formulario (crear o actualizar)
 * @param {Event} e - Evento del formulario
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Validación
  const validation = validateForm();
  if (!validation.valid) {
    showToast(validation.message, 'error');
    highlightFieldError(validation.field);
    return;
  }

  const taskData = collectFormData();
  const isEditing = Boolean(state.editingTaskId);

  setSubmitLoading(true);

  try {
    let result;

    if (isEditing) {
      result = await supabase
        .from(TABLE_NAME)
        .update(taskData)
        .eq('id', state.editingTaskId)
        .select();
    } else {
      result = await supabase
        .from(TABLE_NAME)
        .insert([taskData])
        .select();
    }

    const { data, error } = result;

    if (error) throw error;

    showToast(
      isEditing ? '✅ Tarea actualizada correctamente' : '✅ Tarea creada correctamente',
      'success'
    );

    resetForm();
    await loadTasks();

  } catch (error) {
    console.error('Error al guardar tarea:', error);
    showToast(`❌ Error: ${error.message || 'No se pudo guardar la tarea'}`, 'error');
  } finally {
    setSubmitLoading(false);
  }
}

/**
 * Activa/desactiva el estado de carga del botón submit
 * @param {boolean} isLoading
 */
function setSubmitLoading(isLoading) {
  elements.submitBtn.disabled = isLoading;
  elements.submitBtn.classList.toggle('loading', isLoading);
  elements.submitText.textContent = isLoading
    ? 'Guardando...'
    : (state.editingTaskId ? 'Actualizar Tarea' : 'Crear Tarea');
}

// ==============================================
// CRUD - READ
// ==============================================

/**
 * Carga todas las tareas desde Supabase
 * @param {boolean} isFirstLoad - si es true, dispara 'formulario:ready' al terminar
 *   (usado por index.html para saber cuándo ocultar el page loader)
 */
async function loadTasks(isFirstLoad = false) {
  showLoadingState();
  elements.errorState.style.display = 'none';

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('date', { ascending: true, nullsFirst: false });

    if (error) throw error;

    state.tasks = data || [];
    applyFilters();

  } catch (error) {
    console.error('Error al cargar tareas:', error);
    elements.tasksContainer.innerHTML = '';
    elements.emptyState.style.display = 'none';
    elements.noResultsState.style.display = 'none';
    elements.errorMessage.textContent =
      'Ocurrió un problema al conectar con la base de datos. Verifica tu conexión e intenta nuevamente.';
    elements.errorState.style.display = 'flex';
  } finally {
    if (isFirstLoad) {
      document.dispatchEvent(new CustomEvent('formulario:ready'));
    }
  }
}

/**
 * Muestra un skeleton de carga elegante en la lista de tareas
 */
function showLoadingState() {
  elements.tasksContainer.innerHTML = `
    <div class="skeleton-list">
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
    </div>
  `;
  elements.emptyState.style.display = 'none';
  elements.noResultsState.style.display = 'none';
}

// ==============================================
// CRUD - UPDATE (Cargar tarea al formulario)
// ==============================================

/**
 * Carga los datos de una tarea en el formulario para editar
 * @param {string} taskId - ID de la tarea
 */
function startEditTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  state.editingTaskId = taskId;
  elements.editTaskId.value = taskId;

  elements.title.value = task.title || '';
  elements.description.value = task.description || '';
  elements.course.value = task.course || '';
  elements.type.value = task.type || '';
  elements.class.value = task.class || '';
  elements.date.value = isoToDatetimeLocal(task.date);
  elements.displayDate.value = task.display_date || '';
  elements.image.value = task.image || '';

  elements.formModeTitle.textContent = 'Editar Tarea';
  elements.submitText.textContent = 'Actualizar Tarea';

  updateImagePreview();

  // Scroll al formulario (útil en mobile)
  elements.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Resetea el formulario a su estado inicial (modo creación)
 */
function resetForm() {
  elements.form.reset();
  elements.editTaskId.value = '';
  state.editingTaskId = null;

  elements.formModeTitle.textContent = 'Nueva Tarea';
  elements.submitText.textContent = 'Crear Tarea';
  elements.image.placeholder = 'Solo si deseas sobreescribir la imagen automática';

  updateImagePreview();
}

// ==============================================
// CRUD - DELETE
// ==============================================

/**
 * Abre el modal de confirmación de eliminación
 * @param {string} taskId - ID de la tarea a eliminar
 */
function openDeleteModal(taskId) {
  state.taskToDelete = taskId;
  elements.deleteModal.classList.add('active');
}

/**
 * Cierra el modal de confirmación de eliminación
 */
function closeDeleteModal() {
  state.taskToDelete = null;
  elements.deleteModal.classList.remove('active');
}

/**
 * Elimina la tarea confirmada
 */
async function confirmDeleteTask() {
  if (!state.taskToDelete) return;

  const taskId = state.taskToDelete;
  elements.modalConfirm.disabled = true;
  elements.modalConfirm.textContent = 'Eliminando...';

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    showToast('🗑️ Tarea eliminada correctamente', 'success');

    // Si estábamos editando la tarea eliminada, resetear formulario
    if (state.editingTaskId === taskId) {
      resetForm();
    }

    closeDeleteModal();
    await loadTasks();

  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    showToast(`❌ Error: ${error.message || 'No se pudo eliminar la tarea'}`, 'error');
  } finally {
    elements.modalConfirm.disabled = false;
    elements.modalConfirm.textContent = 'Eliminar';
  }
}

// ==============================================
// FILTROS
// ==============================================

/**
 * Aplica todos los filtros activos sobre la lista de tareas
 */
function applyFilters() {
  const { search, class: classFilter, course, type } = state.filters;
  const searchLower = search.toLowerCase();

  state.filteredTasks = state.tasks.filter(task => {
    const matchesSearch = !search ||
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.course?.toLowerCase().includes(searchLower);

    const matchesClass = !classFilter || task.class === classFilter;
    const matchesCourse = !course || task.course === course;
    const matchesType = !type || task.type === type;

    return matchesSearch && matchesClass && matchesCourse && matchesType;
  });

  renderActiveFilterChips();
  renderTasks(state.filteredTasks);
}

/**
 * Elimina todos los filtros activos (buscador + selects) y vuelve a renderizar.
 */
function clearAllFilters() {
  state.filters = { search: '', class: '', course: '', type: '' };
  elements.searchInput.value = '';
  elements.filterClass.value = '';
  elements.filterCourse.value = '';
  elements.filterType.value = '';
  applyFilters();
}

/**
 * Renderiza los chips de filtros activos con opción de quitarlos individualmente.
 */
function renderActiveFilterChips() {
  const { search, class: classFilter, course, type } = state.filters;
  const chips = [];

  if (search) chips.push({ key: 'search', label: `"${search}"` });
  if (classFilter) chips.push({ key: 'class', label: CLASS_LABELS[classFilter] || classFilter });
  if (course) chips.push({ key: 'course', label: course });
  if (type) chips.push({ key: 'type', label: TYPE_LABELS[type]?.replace(/^\p{Emoji}\s*/u, '') || type });

  if (chips.length === 0) {
    elements.activeFilters.style.display = 'none';
    elements.filterChips.innerHTML = '';
    return;
  }

  elements.activeFilters.style.display = 'flex';
  elements.filterChips.innerHTML = chips.map(chip => `
    <button type="button" class="filter-chip" data-chip-key="${chip.key}">
      ${escapeHTML(chip.label)}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `).join('');

  elements.filterChips.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => removeFilterChip(chip.dataset.chipKey));
  });
}

/**
 * Quita un único filtro activo (por su key) manteniendo los demás.
 */
function removeFilterChip(key) {
  if (key === 'search') {
    state.filters.search = '';
    elements.searchInput.value = '';
  } else if (key === 'class') {
    state.filters.class = '';
    elements.filterClass.value = '';
  } else if (key === 'course') {
    state.filters.course = '';
    elements.filterCourse.value = '';
  } else if (key === 'type') {
    state.filters.type = '';
    elements.filterType.value = '';
  }
  applyFilters();
}

/**
 * Maneja el input del buscador (con debounce simple)
 */
let searchDebounceTimer;
function handleSearchInput() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.filters.search = elements.searchInput.value.trim();
    applyFilters();
  }, 300);
}

/**
 * Maneja el cambio de cualquier filtro select
 */
function handleFilterChange() {
  state.filters.class = elements.filterClass.value;
  state.filters.course = elements.filterCourse.value;
  state.filters.type = elements.filterType.value;
  applyFilters();
}

// ==============================================
// RENDERIZADO DE TAREAS
// ==============================================

/**
 * Mapea el tipo de tarea a su etiqueta visual
 */
const TYPE_LABELS = {
  tarea: '📝 Tarea',
  examen: '📚 Examen',
  presentacion: '📌 Presentación',
  actividad: '🎉 Actividad'
};

/**
 * Mapea la clase (salón) a su etiqueta visual
 */
const CLASS_LABELS = {
  '5A': '5TO A',
  '5B': '5TO B'
};

/**
 * Renderiza la lista de tareas en el panel admin
 * @param {Array} tasks - Lista de tareas a renderizar
 */
function renderTasks(tasks) {
  const hasActiveFilters = Boolean(
    state.filters.search || state.filters.class || state.filters.course || state.filters.type
  );

  if (!tasks || tasks.length === 0) {
    elements.tasksContainer.innerHTML = '';

    // Distingue "no hay ninguna tarea creada" de "los filtros no encontraron nada"
    if (hasActiveFilters && state.tasks.length > 0) {
      elements.emptyState.style.display = 'none';
      elements.noResultsState.style.display = 'flex';
    } else {
      elements.noResultsState.style.display = 'none';
      elements.emptyState.style.display = 'flex';
    }
    return;
  }

  elements.emptyState.style.display = 'none';
  elements.noResultsState.style.display = 'none';

  elements.tasksContainer.innerHTML = tasks.map(task => createTaskCardHTML(task)).join('');

  // Adjuntar event listeners a los botones de cada card
  attachTaskCardListeners();
}

/**
 * Genera el HTML de una card de tarea
 * @param {Object} task - Datos de la tarea
 * @returns {string} HTML de la card
 */
function createTaskCardHTML(task) {
  const dateText = task.date
    ? formatDateDisplay(task.date)
    : (task.display_date || 'Sin fecha');

  const imageUrl = task.image || getAutoImageForCourse(task.course) || '';
  const typeLabel = TYPE_LABELS[task.type] || task.type;
  const classLabel = CLASS_LABELS[task.class] || task.class;

  return `
    <div class="task-card" data-task-id="${task.id}">
      <div class="task-image">
        ${imageUrl
          ? `<img src="${imageUrl}" alt="${escapeHTML(task.title)}" loading="lazy" onerror="this.style.display='none'">`
          : ''
        }
      </div>
      <div class="task-info">
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
        <div class="task-meta">
          <span class="task-badge course">${escapeHTML(task.course)}</span>
          <span class="task-badge type">${typeLabel}</span>
          <span class="task-badge class">${classLabel}</span>
        </div>
        <span class="task-date">${dateText}</span>
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit" data-action="edit" data-task-id="${task.id}" aria-label="Editar tarea">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="task-action-btn delete" data-action="delete" data-task-id="${task.id}" aria-label="Eliminar tarea">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str - String a escapar
 * @returns {string} String escapado
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Adjunta los event listeners a los botones de cada task card
 */
function attachTaskCardListeners() {
  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      startEditTask(taskId);
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      openDeleteModal(taskId);
    });
  });
}

// ==============================================
// EVENT LISTENERS - INICIALIZACIÓN
// ==============================================

function setupEventListeners() {
  // Formulario
  elements.form.addEventListener('submit', handleFormSubmit);
  elements.cancelBtn.addEventListener('click', resetForm);

  // Imagen automática / preview
  elements.course.addEventListener('change', handleCourseChange);
  elements.image.addEventListener('input', updateImagePreview);

  // Filtros
  elements.searchInput.addEventListener('input', handleSearchInput);
  elements.filterClass.addEventListener('change', handleFilterChange);
  elements.filterCourse.addEventListener('change', handleFilterChange);
  elements.filterType.addEventListener('change', handleFilterChange);
  elements.clearFiltersBtn.addEventListener('click', clearAllFilters);
  elements.noResultsClearBtn.addEventListener('click', clearAllFilters);

  // Reintentar carga tras un error de conexión
  elements.retryBtn.addEventListener('click', () => loadTasks());

  // Modal de eliminación
  elements.modalCancel.addEventListener('click', closeDeleteModal);
  elements.modalConfirm.addEventListener('click', confirmDeleteTask);
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
      closeDeleteModal();
    }
  });

  // Cerrar modal con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.deleteModal.classList.contains('active')) {
      closeDeleteModal();
    }
  });
}

// ==============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==============================================

async function init() {
  console.log('🚀 Inicializando Formulario de Tareas...');

  setupEventListeners();
  updateImagePreview();
  await loadTasks(true); // true = primera carga -> dispara 'formulario:ready'

  console.log('✅ Formulario inicializado correctamente');
}

// Ejecutar inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
