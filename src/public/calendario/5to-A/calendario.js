/**
 * ==============================================
 * CALENDARIO 5TO A
 * FASE 2 - Calendario dinámico conectado a Supabase
 * FASE 3 - Generador de texto "Copiar tareas"
 * ==============================================
 *
 * Reutiliza la MISMA configuración de Supabase que
 * /calendario/formulario/formulario.js. Ambos archivos
 * apuntan a la misma tabla `tasks` — Supabase es la
 * única fuente de verdad para todo el sistema.
 */

// ==============================================
// CONFIGURACIÓN SUPABASE (misma fuente que formulario.js)
// ==============================================

const SUPABASE_URL = 'https://ytgdeutmrujjdjqfivpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Z2RldXRtcnVqamRqcWZpdnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjExNTAsImV4cCI6MjEwNDIzNzE1MH0.1evMikwN9iwJP7Z6ycZka18g9-ZKsEwIGHllaxffxYs';

const TABLE_NAME = 'tasks';
const CLASS_ID = '5A';

// ==============================================
// CONSTANTES DE PRESENTACIÓN
// ==============================================

const TYPE_LABELS = {
  tarea: 'Tarea',
  examen: 'Examen',
  presentacion: 'Presentación',
  actividad: 'Actividad'
};

// Abreviaturas usadas específicamente en el texto de "Copiar tareas"
const COURSE_SHORT_NAMES = {
  'Comunicación': 'Comu'
};

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 horas

const COPY_LINK = 'https://promo-2026.netlify.app/calendario/5to-A/';

// ==============================================
// CLASE PRINCIPAL DE LA PÁGINA
// ==============================================

export class CalendarPage {
  constructor() {
    this.supabase = null;
    this.tasks = [];          // Todas las tareas de 5A (crudas desde Supabase)
    this.filteredTasks = [];  // Resultado tras aplicar buscador/filtros
    this.countdownIntervals = []; // Referencias para poder limpiarlas

    this.filters = {
      search: '',
      course: '',
      type: ''
    };

    this.cacheElements();
  }

  // ==============================================
  // REFERENCIAS DOM
  // ==============================================

  cacheElements() {
    this.el = {
      // Stats
      statPendingTasks: document.getElementById('statPendingTasks'),
      statUpcomingExams: document.getElementById('statUpcomingExams'),
      statActivities: document.getElementById('statActivities'),
      statTotal: document.getElementById('statTotal'),

      // Toolbar
      searchInput: document.getElementById('searchInput'),
      searchClear: document.getElementById('searchClear'),
      searchBar: document.querySelector('.search-bar'),
      filterCourse: document.getElementById('filterCourse'),
      filterType: document.getElementById('filterType'),
      resultsCount: document.getElementById('resultsCount'),
      copyBtn: document.getElementById('copyTasksBtn'),
      copyBtnText: document.getElementById('copyBtnText'),
      activeFilters: document.getElementById('activeFilters'),
      filterChips: document.getElementById('filterChips'),
      clearFiltersBtn: document.getElementById('clearFiltersBtn'),
      noResultsClearBtn: document.getElementById('noResultsClearBtn'),
      retryBtn: document.getElementById('retryBtn'),
      statsContainer: document.querySelector('.stats-container'),

      // Estados
      loadingState: document.getElementById('loadingState'),
      errorState: document.getElementById('errorState'),
      errorMessage: document.getElementById('errorMessage'),
      emptyState: document.getElementById('emptyState'),
      noResultsState: document.getElementById('noResultsState'),

      // Grupos
      pendingGroup: document.getElementById('pendingGroup'),
      pendingGrid: document.getElementById('pendingGrid'),
      pastGroup: document.getElementById('pastGroup'),
      pastGrid: document.getElementById('pastGrid'),

      // Toast
      toast: document.getElementById('toast')
    };
  }

  // ==============================================
  // INICIALIZACIÓN
  // ==============================================

  async init() {
    this.setupSupabase();
    this.setupEventListeners();
    await this.loadTasks();
  }

  setupSupabase() {
    this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  setupEventListeners() {
    // Buscador en tiempo real
    let debounceTimer;
    this.el.searchInput.addEventListener('input', () => {
      this.el.searchBar.classList.toggle('has-value', Boolean(this.el.searchInput.value));
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.filters.search = this.el.searchInput.value.trim();
        this.applyFilters();
      }, 250);
    });

    this.el.searchClear.addEventListener('click', () => {
      this.el.searchInput.value = '';
      this.el.searchBar.classList.remove('has-value');
      this.filters.search = '';
      this.applyFilters();
    });

    // Filtros combinables
    this.el.filterCourse.addEventListener('change', () => {
      this.filters.course = this.el.filterCourse.value;
      this.applyFilters();
    });

    this.el.filterType.addEventListener('change', () => {
      this.filters.type = this.el.filterType.value;
      this.applyFilters();
    });

    // Botón copiar tareas (FASE 3)
    this.el.copyBtn.addEventListener('click', () => this.handleCopyTasks());

    // Limpiar filtros (desde chips o desde el estado "sin resultados")
    this.el.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
    this.el.noResultsClearBtn.addEventListener('click', () => this.clearAllFilters());

    // Reintentar tras un error de conexión
    this.el.retryBtn.addEventListener('click', () => this.loadTasks());
  }

  /**
   * Limpia buscador y selects, y vuelve a aplicar filtros (queda vacío).
   */
  clearAllFilters() {
    this.filters = { search: '', course: '', type: '' };
    this.el.searchInput.value = '';
    this.el.searchBar.classList.remove('has-value');
    this.el.filterCourse.value = '';
    this.el.filterType.value = '';
    this.applyFilters();
  }

  // ==============================================
  // CARGA DE DATOS (READ) - filtrado eficiente por salón
  // ==============================================

  async loadTasks() {
    this.showState('loading');

    try {
      // Filtrado en el servidor: solo se descargan registros de 5A
      const { data, error } = await this.supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('class', CLASS_ID)
        .order('date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      this.tasks = data || [];
      this.renderStats();
      this.applyFilters();

    } catch (error) {
      // Detalle técnico solo en consola; el usuario nunca ve el error crudo
      console.error('Error al cargar el calendario:', error);
      this.el.errorMessage.textContent =
        'Ocurrió un problema al conectar con la base de datos. Verifica tu conexión e intenta nuevamente.';
      this.showState('error');
    }
  }

  // ==============================================
  // CLASIFICACIÓN TEMPORAL DE TAREAS
  // ==============================================

  /**
   * Determina si una tarea es "pendiente" o "pasada".
   * - Con fecha exacta: pendiente si aún no ha ocurrido.
   * - Sin fecha exacta pero con display_date (NET): siempre pendiente,
   *   ya que no tiene forma de "vencer" cronológicamente.
   */
  isPending(task) {
    if (task.date) {
      return new Date(task.date).getTime() >= Date.now();
    }
    return Boolean(task.display_date);
  }

  isUrgent(task) {
    if (!task.date) return false;
    const diff = new Date(task.date).getTime() - Date.now();
    return diff > 0 && diff < URGENT_THRESHOLD_MS;
  }

  /**
   * Separa y ordena las tareas en pendientes/pasadas.
   * Pendientes: fecha más próxima primero; los registros NET
   * (sin fecha exacta) se ubican al final, ordenados por título.
   * Pasadas: fecha más reciente primero.
   */
  splitAndSort(tasks) {
    const pending = [];
    const past = [];

    tasks.forEach(task => {
      if (this.isPending(task)) {
        pending.push(task);
      } else {
        past.push(task);
      }
    });

    pending.sort((a, b) => {
      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      if (a.date && !b.date) return -1; // fechas exactas antes que NET
      if (!a.date && b.date) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });

    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { pending, past };
  }

  // ==============================================
  // FILTROS (buscador + curso + tipo, combinables)
  // ==============================================

  applyFilters() {
    const { search, course, type } = this.filters;
    const searchLower = search.toLowerCase();

    this.filteredTasks = this.tasks.filter(task => {
      const matchesSearch = !search ||
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.course?.toLowerCase().includes(searchLower);

      const matchesCourse = !course || task.course === course;
      const matchesType = !type || task.type === type;

      return matchesSearch && matchesCourse && matchesType;
    });

    this.renderResultsCount();
    this.renderActiveFilterChips();
    this.renderTasks();
  }

  renderResultsCount() {
    const hasActiveFilters = this.filters.search || this.filters.course || this.filters.type;

    if (!hasActiveFilters) {
      this.el.resultsCount.textContent = '';
      return;
    }

    const count = this.filteredTasks.length;
    this.el.resultsCount.textContent = `${count} resultado${count === 1 ? '' : 's'}`;
  }

  /**
   * Renderiza los chips de filtros activos (buscador, curso, tipo),
   * cada uno removible individualmente, más un botón para limpiar todo.
   */
  renderActiveFilterChips() {
    const { search, course, type } = this.filters;
    const chips = [];

    if (search) chips.push({ key: 'search', label: `"${search}"` });
    if (course) chips.push({ key: 'course', label: course });
    if (type) chips.push({ key: 'type', label: TYPE_LABELS[type] || type });

    if (chips.length === 0) {
      this.el.activeFilters.style.display = 'none';
      this.el.filterChips.innerHTML = '';
      return;
    }

    this.el.activeFilters.style.display = 'flex';
    this.el.filterChips.innerHTML = chips.map(chip => `
      <button type="button" class="filter-chip" data-chip-key="${chip.key}">
        ${this.escapeHTML(chip.label)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `).join('');

    this.el.filterChips.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => this.removeFilterChip(chip.dataset.chipKey));
    });
  }

  /**
   * Quita un único filtro (por su key) conservando los demás activos.
   */
  removeFilterChip(key) {
    if (key === 'search') {
      this.filters.search = '';
      this.el.searchInput.value = '';
      this.el.searchBar.classList.remove('has-value');
    } else if (key === 'course') {
      this.filters.course = '';
      this.el.filterCourse.value = '';
    } else if (key === 'type') {
      this.filters.type = '';
      this.el.filterType.value = '';
    }
    this.applyFilters();
  }

  // ==============================================
  // RENDERIZADO DE ESTADOS
  // ==============================================

  showState(state) {
    this.el.loadingState.style.display = state === 'loading' ? 'flex' : 'none';
    this.el.errorState.style.display = state === 'error' ? 'flex' : 'none';

    if (this.el.statsContainer) {
      this.el.statsContainer.classList.toggle('stats-loading', state === 'loading');
    }
  }

  // ==============================================
  // RENDERIZADO DE STATS (calculado desde datos reales)
  // ==============================================

  renderStats() {
    const pendingTasksCount = this.tasks.filter(t => t.type === 'tarea' && this.isPending(t)).length;
    const upcomingExamsCount = this.tasks.filter(t => t.type === 'examen' && this.isPending(t)).length;
    const activitiesCount = this.tasks.filter(t => t.type === 'actividad' || t.type === 'presentacion').length;
    const totalCount = this.tasks.length;

    this.el.statsContainer?.classList.remove('stats-loading');

    this.animateCounter(this.el.statPendingTasks, pendingTasksCount);
    this.animateCounter(this.el.statUpcomingExams, upcomingExamsCount);
    this.animateCounter(this.el.statActivities, activitiesCount);
    this.animateCounter(this.el.statTotal, totalCount);
  }

  animateCounter(element, target, duration = 900) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = Math.floor(start + (target - start) * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target;
      }
    };

    requestAnimationFrame(step);
  }

  // ==============================================
  // RENDERIZADO DE TAREAS (grid + estados vacíos)
  // ==============================================

  renderTasks() {
    // Limpiar countdowns activos antes de re-renderizar
    this.clearCountdowns();

    this.showState('none'); // oculta loading/error

    if (this.tasks.length === 0) {
      this.toggleGroups(false, false);
      this.el.emptyState.style.display = 'flex';
      this.el.noResultsState.style.display = 'none';
      return;
    }

    this.el.emptyState.style.display = 'none';

    if (this.filteredTasks.length === 0) {
      this.toggleGroups(false, false);
      this.el.noResultsState.style.display = 'flex';
      return;
    }

    this.el.noResultsState.style.display = 'none';

    const { pending, past } = this.splitAndSort(this.filteredTasks);

    this.toggleGroups(pending.length > 0, past.length > 0);

    this.el.pendingGrid.innerHTML = pending.map(t => this.createTaskCardHTML(t)).join('');
    this.el.pastGrid.innerHTML = past.map(t => this.createTaskCardHTML(t, true)).join('');

    this.attachCountdowns(pending);
  }

  toggleGroups(showPending, showPast) {
    this.el.pendingGroup.style.display = showPending ? 'block' : 'none';
    this.el.pastGroup.style.display = showPast ? 'block' : 'none';
  }

  // ==============================================
  // GENERACIÓN DE CARD HTML
  // ==============================================

  createTaskCardHTML(task, isPast = false) {
    const urgent = !isPast && this.isUrgent(task);
    const classes = ['task-card'];
    if (urgent) classes.push('urgent');
    if (isPast) classes.push('is-past');

    const bgImage = task.image
      ? `background-image: url('${this.escapeAttr(task.image)}');`
      : '';

    const typeLabel = TYPE_LABELS[task.type] || task.type || '';

    const footerHTML = task.date
      ? this.createDateFooterHTML(task, isPast)
      : `<div class="task-net-badge">${this.escapeHTML(task.display_date || 'Sin fecha')}</div>`;

    return `
      <article class="${classes.join(' ')}" style="${bgImage}" data-task-id="${task.id}">
        <div class="task-card-overlay"></div>
        ${urgent ? `
          <span class="urgent-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Urgente
          </span>
        ` : ''}
        <div class="task-card-content">
          <div class="task-tags">
            <span class="tag tag-course">${this.escapeHTML(task.course || '')}</span>
            <span class="tag tag-type">${this.escapeHTML(typeLabel)}</span>
          </div>
          <div class="task-body">
            <h3 class="task-title">${this.escapeHTML(task.title || '')}</h3>
            ${footerHTML}
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Genera el bloque de countdown + fecha exacta para tareas con `date`.
   * El countdown se completa dinámicamente vía attachCountdowns() y solo
   * aplica a tareas pendientes; las pasadas muestran un badge "Finalizada".
   */
  createDateFooterHTML(task, isPast = false) {
    const dateObj = new Date(task.date);
    const timeText = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const dateText = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const topBlock = isPast
      ? `
        <div class="task-finished-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Finalizada
        </div>
      `
      : `
        <div class="task-countdown" data-countdown-target="${task.date}" data-task-id="${task.id}">
          <div class="countdown-block"><span class="cd-value" data-unit="days">00</span><span class="cd-label">Días</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="hours">00</span><span class="cd-label">Hrs</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="minutes">00</span><span class="cd-label">Min</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="seconds">00</span><span class="cd-label">Seg</span></div>
        </div>
      `;

    return `
      ${topBlock}
      <div class="task-datetime">
        <span class="time">${timeText}</span>
        <span class="date">${dateText}</span>
      </div>
    `;
  }

  // ==============================================
  // COUNTDOWN EN VIVO (por card, no congelado)
  // ==============================================

  attachCountdowns(pendingTasks) {
    pendingTasks
      .filter(task => task.date)
      .forEach(task => {
        const container = document.querySelector(`.task-countdown[data-task-id="${task.id}"]`);
        if (!container) return;

        const targetTime = new Date(task.date).getTime();
        const units = {
          days: container.querySelector('[data-unit="days"]'),
          hours: container.querySelector('[data-unit="hours"]'),
          minutes: container.querySelector('[data-unit="minutes"]'),
          seconds: container.querySelector('[data-unit="seconds"]')
        };

        const update = () => {
          const distance = targetTime - Date.now();

          if (distance <= 0) {
            units.days.textContent = '00';
            units.hours.textContent = '00';
            units.minutes.textContent = '00';
            units.seconds.textContent = '00';
            clearInterval(intervalId);
            return;
          }

          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          units.days.textContent = String(days).padStart(2, '0');
          units.hours.textContent = String(hours).padStart(2, '0');
          units.minutes.textContent = String(minutes).padStart(2, '0');
          units.seconds.textContent = String(seconds).padStart(2, '0');
        };

        update();
        const intervalId = setInterval(update, 1000);
        this.countdownIntervals.push(intervalId);
      });
  }

  clearCountdowns() {
    this.countdownIntervals.forEach(id => clearInterval(id));
    this.countdownIntervals = [];
  }

  // ==============================================
  // FASE 3 — GENERADOR DE TEXTO "COPIAR TAREAS"
  // ==============================================

  async handleCopyTasks() {
    const text = this.buildCopyText();

    try {
      await this.copyToClipboard(text);
      this.showCopySuccess();
      this.showToast('✓ Tareas copiadas', 'success');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      this.showToast('❌ No se pudo copiar el texto', 'error');
    }
  }

  /**
   * Construye el texto exacto solicitado, agrupado por tipo y
   * dentro de cada tipo por curso. Solo incluye tareas PENDIENTES
   * con fecha exacta (los registros NET no tienen forma de expresar
   * "(DD de Mes)" y se excluyen de este resumen para no generar
   * fechas inválidas).
   */
  buildCopyText() {
    const pendingWithDate = this.tasks.filter(t => this.isPending(t) && t.date);

    const byType = {
      tarea: pendingWithDate.filter(t => t.type === 'tarea'),
      examen: pendingWithDate.filter(t => t.type === 'examen'),
      presentacion: pendingWithDate.filter(t => t.type === 'presentacion'),
      actividad: pendingWithDate.filter(t => t.type === 'actividad')
    };

    // Cada categoría se ordena por fecha ascendente
    Object.values(byType).forEach(list => list.sort((a, b) => new Date(a.date) - new Date(b.date)));

    const sections = [
      { emoji: '🚨', title: 'TAREAS PENDIENTES DE LA SEMANA!!', closingEmoji: '🚨', tasks: byType.tarea },
      { emoji: '📚', title: 'Exámenes', closingEmoji: '📚', tasks: byType.examen },
      { emoji: '📌', title: 'Presentaciones', closingEmoji: '📌', tasks: byType.presentacion },
      { emoji: '🎉', title: 'ACTIVIDADES', closingEmoji: '🎉', tasks: byType.actividad }
    ];

    const blocks = sections.map(section => this.buildSectionBlock(section));

    const now = new Date();
    const updatedAt = this.formatUpdatedAt(now);

    return [
      ...blocks,
      `ÚLTIMA ACTUALIZACIÓN:\n${updatedAt}`,
      COPY_LINK
    ].join('\n\n');
  }

  /**
   * Construye un bloque de sección (ej: tareas, exámenes...),
   * agrupando internamente por curso.
   */
  buildSectionBlock({ emoji, title, closingEmoji, tasks }) {
    const header = `${emoji} ${title}${closingEmoji}`;

    if (tasks.length === 0) {
      return `${header}\n- Ninguna -`;
    }

    // Agrupar por curso preservando el orden cronológico de aparición
    const courseOrder = [];
    const byCourse = {};

    tasks.forEach(task => {
      const course = task.course || 'Sin curso';
      if (!byCourse[course]) {
        byCourse[course] = [];
        courseOrder.push(course);
      }
      byCourse[course].push(task);
    });

    const courseBlocks = courseOrder.map(course => {
      const displayCourse = COURSE_SHORT_NAMES[course] || course;
      const lines = byCourse[course].map(task => {
        const dateText = this.formatCopyDate(new Date(task.date));
        return `- ${task.title} (${dateText})`;
      });
      return `${displayCourse}\n${lines.join('\n')}`;
    });

    return `${header}\n\n${courseBlocks.join('\n\n')}`;
  }

  /**
   * Formatea una fecha como "05 de Mayo" (día siempre 2 dígitos).
   */
  formatCopyDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = MONTHS_ES[date.getMonth()];
    return `${day} de ${month}`;
  }

  /**
   * Formatea el timestamp de última actualización:
   * "00:52 - 29 de Abril del 2026"
   */
  formatUpdatedAt(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = MONTHS_ES[date.getMonth()];
    const year = date.getFullYear();

    return `${hours}:${minutes} - ${day} de ${month} del ${year}`;
  }

  // ==============================================
  // CLIPBOARD API
  // ==============================================

  async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback para navegadores/entornos sin Clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  showCopySuccess() {
    const originalText = 'Copiar tareas';
    this.el.copyBtn.classList.add('copied');
    this.el.copyBtnText.textContent = '¡Copiado!';

    setTimeout(() => {
      this.el.copyBtn.classList.remove('copied');
      this.el.copyBtnText.textContent = originalText;
    }, 2200);
  }

  // ==============================================
  // TOAST
  // ==============================================

  showToast(message, type = 'info') {
    this.el.toast.textContent = message;
    this.el.toast.className = `toast show ${type}`;

    setTimeout(() => {
      this.el.toast.classList.remove('show');
    }, 3000);
  }

  // ==============================================
  // UTILIDADES DE ESCAPE (prevención XSS)
  // ==============================================

  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  escapeAttr(str) {
    if (!str) return '';
    return str.replace(/'/g, '%27').replace(/"/g, '%22');
  }
}
