/**
 * ==============================================
 * OLIMPIADAS SANTACRUCINAS 2026 - Lógica de página
 * ==============================================
 * Módulo independiente de /calendario/ y /viaje-promo/: usa su propia
 * tabla de Supabase (`olympics_matches` + `olympics_events`) y NO comparte
 * datos con ellos.
 *
 * REESTRUCTURACIÓN (v2): la página ya no muestra solo "los partidos de
 * Alemania" filtrados en el servidor. Ahora:
 *   1. Se trae TODO el fixture una sola vez (dataset pequeño, ~60 filas).
 *   2. Se filtra en el cliente por delegación (Alemania/Francia/Japón/Todos),
 *      revisando SIEMPRE ambos lados de la fila (team_country U opponent_country)
 *      — antes solo se miraba un lado y por eso faltaban partidos.
 *   3. Se detectan automáticamente conflictos de horario por delegación
 *      (dos partidos que se superponen en el tiempo para el mismo equipo).
 *
 * IMPORTANTE SOBRE FECHAS (lección aprendida en /calendario/):
 * `match_date` es un `timestamp` SIN zona horaria, igual que `tasks.date`.
 * Se guarda y se lee como hora "de pared" literal (hora de Perú), SIN
 * convertir nunca a UTC con `.toISOString()`.
 */

// ==============================================
// CONFIGURACIÓN - SUPABASE (reemplazar con las credenciales reales)
// ==============================================

const SUPABASE_URL = 'https://wfryxlmerrkvdcbamgkb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnl4bG1lcnJrdmRjYmFtZ2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MzU0NDQsImV4cCI6MjEwNjIxMTQ0NH0.u_5ICnrFFYQPD4v_FGJ5OBatbW7oUoXKH2-eoVsd7z0';

const TABLE_MATCHES = 'olympics_matches';
const TABLE_EVENTS = 'olympics_events';

// Duración estimada de un encuentro, usada para decidir "en curso" y para
// detectar conflictos de horario (dos partidos que se superponen).
const ESTIMATED_DURATION_MS = 90 * 60 * 1000;
 
// ==============================================
// DELEGACIONES - equipo propio + resto del fixture
// ==============================================
// Cambiar PRIMARY_DELEGATION es lo único necesario para que la experiencia
// inicial siga centrada en otro equipo. El resto del fixture nunca se oculta
// de la base de datos, solo se filtra visualmente.
 
const PRIMARY_DELEGATION = 'Alemania';
 
const DELEGATIONS = ['Alemania', 'Francia', 'Japón'];
 
// Sedes fijas por deporte (referencia visual para la sección Deportes/Sedes;
// el dato real de cada partido siempre sale de `venue` en Supabase).
const VENUES_BY_SPORT = {
  'Fútbol': 'Campo de Fútbol N.º 1',
  'Balonmano': 'Patio Central',
  'Vóley': 'Patio Secundaria',
  'Básquet': 'Campo de Básquet',
};
 
const SPORT_ORDER = ['Fútbol', 'Balonmano', 'Vóley', 'Básquet'];
 
// ==============================================
// BANDERAS - SVG reales (vectores planos, sin depender de fuentes de emoji)
// ==============================================
 
function flagSVG(country, size = 32) {
  const key = normalize(country);
  const common = `width="${size}" height="${Math.round(size * 0.7)}" viewBox="0 0 30 21" role="img" aria-label="Bandera de ${escapeHTML(country || '')}"`;
 
  if (key === 'alemania') {
    return `<svg ${common}><rect width="30" height="7" y="0" fill="#1a1a1a"/><rect width="30" height="7" y="7" fill="#dd0000"/><rect width="30" height="7" y="14" fill="#ffce00"/></svg>`;
  }
  if (key === 'francia') {
    return `<svg ${common}><rect width="10" height="21" x="0" fill="#0055a4"/><rect width="10" height="21" x="10" fill="#ffffff"/><rect width="10" height="21" x="20" fill="#ef4135"/></svg>`;
  }
  if (key === 'japon' || key === 'japón') {
    return `<svg ${common}><rect width="30" height="21" fill="#ffffff"/><circle cx="15" cy="10.5" r="6.3" fill="#bc002d"/></svg>`;
  }
  // Genérico (fallback) — silueta neutra, nunca un emoji de bandera del sistema.
  return `<svg ${common}><rect width="30" height="21" rx="2" fill="var(--glass-border)"/></svg>`;
}
 
function normalize(str) {
  return String(str || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
 
function countryMatches(value, country) {
  return normalize(value) === normalize(country) || normalize(value).startsWith(normalize(country));
}
 
/** ¿Esta fila involucra a `country`, sin importar de qué lado esté guardada? */
function involvesCountry(match, country) {
  return countryMatches(match.team_country || match.team, country)
    || countryMatches(match.opponent_country || match.opponent, country);
}
 
// ==============================================
// ICONOS DE DEPORTE - SVG de línea, coherentes entre sí (sin emoji)
// ==============================================
 
function sportIconSVG(sport, size = 24) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const key = normalize(sport);
 
  if (key === 'futbol') {
    return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M12 7.2 15.8 10l-1.5 4.5H9.7L8.2 10 12 7.2Z"/><path d="M12 7.2V4M15.8 10l3-1.8M14.3 14.5l1.9 2.8M9.7 14.5l-1.9 2.8M8.2 10l-3-1.8"/></svg>`;
  }
  if (key === 'voley') {
    return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M12 3c2.5 2.5 2.5 15.5 0 18M4.5 8c3.2 1.6 12 1.6 15 0M4.5 16c3.2-1.6 12-1.6 15 0"/></svg>`;
  }
  if (key === 'basquet') {
    return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M6 5.2C9 8.5 9 15.5 6 18.8M18 5.2c-3 3.3-3 10.3 0 13.6"/></svg>`;
  }
  if (key === 'balonmano') {
    return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/><path d="M12 4.6v4.8M12 14.6v4.8M4.6 12h4.8M14.6 12h4.8"/></svg>`;
  }
  // Genérico para deportes fuera de las 4 principales (Ajedrez, Pasa Balón, etc.)
  return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>`;
}
 
function eventIconSVG(eventType, size = 28) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  if (eventType === 'baileton') {
    return `<svg ${attrs}><path d="M12 3v6M9 5.5 12 9l3-3.5"/><circle cx="12" cy="14" r="6"/><path d="M9.5 17.5c1.5 1 3.5 1 5 0"/></svg>`;
  }
  return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>`;
}
 
// ==============================================
// FORMATEO DE FECHAS (sin conversión de zona horaria)
// ==============================================
 
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
 
/**
 * `match_date` llega como "YYYY-MM-DDTHH:mm:ss" (naive). new Date(...) sobre
 * un string así lo interpreta como hora LOCAL del navegador (no UTC), que es
 * exactamente lo que queremos porque el navegador de los alumnos está en
 * hora de Perú. No se aplica ninguna corrección de offset aquí.
 */
function parseMatchDate(matchDate) {
  if (!matchDate) return null;
  return new Date(matchDate);
}
 
function formatDayMonth(date) {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_ES[date.getMonth()].slice(0, 3).toUpperCase()}`;
}
 
function formatLongDate(date) {
  const weekday = DAYS_ES[date.getDay()];
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${String(date.getDate()).padStart(2, '0')} de ${MONTHS_ES[date.getMonth()]}`;
}
 
function formatTime(date) {
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}
 
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
 
// ==============================================
// UTILIDADES
// ==============================================
 
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
 
function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
 
function animateCounter(el, target, duration = 800) {
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}
 
/**
 * Deriva el estado real de un partido a partir de su fecha y de lo guardado
 * en `status`. Se recalcula siempre en vivo contra la hora actual, nunca se
 * confía ciegamente en el campo `status` de la base de datos.
 */
function computeLiveStatus(match) {
  if (match.status === 'finalizado') return 'finalizado';
  if (!match.match_date) return match.status || 'programado';
 
  const start = parseMatchDate(match.match_date).getTime();
  const now = Date.now();
 
  if (now < start) return 'programado';
  if (now >= start && now < start + ESTIMATED_DURATION_MS) return 'en_curso';
  return match.status === 'finalizado' ? 'finalizado' : 'en_curso';
}
 
const STATUS_LABELS = {
  programado: 'Próximo',
  en_curso: 'En juego',
  finalizado: 'Finalizado',
};
 
// ==============================================
// CLASE PRINCIPAL
// ==============================================
 
export class OlympicsPage {
  constructor() {
    this.supabase = null;
    this.allMatches = [];   // TODO el fixture, sin filtrar
    this.conflicts = new Map(); // matchId -> [{ country, other }]
    this.state = {
      delegation: PRIMARY_DELEGATION, // 'Alemania' | 'Francia' | 'Japón' | 'Todos'
      search: '',
      sport: '',
    };
    this.countdownIntervals = [];
 
    this.els = this.cacheElements();
  }
 
  cacheElements() {
    return {
      loadingState: document.getElementById('loadingState'),
      errorState: document.getElementById('errorState'),
      errorMessage: document.getElementById('errorMessage'),
      emptyState: document.getElementById('emptyState'),
      noResultsState: document.getElementById('noResultsState'),
      retryBtn: document.getElementById('retryBtn'),
      noResultsClearBtn: document.getElementById('noResultsClearBtn'),
 
      delegationSelector: document.getElementById('delegationSelector'),
 
      nextMatchSection: document.getElementById('nextMatchSection'),
      nextMatchCard: document.getElementById('nextMatchCard'),
 
      statTotal: document.getElementById('statTotal'),
      statNext: document.getElementById('statNext'),
      statLast: document.getElementById('statLast'),
 
      sportsGrid: document.getElementById('sportsGrid'),
      venuesGrid: document.getElementById('venuesGrid'),
 
      activitiesSection: document.getElementById('activitiesSection'),
      activitiesGrid: document.getElementById('activitiesGrid'),
 
      searchInput: document.getElementById('searchInput'),
      searchClear: document.getElementById('searchClear'),
      sportFilters: document.getElementById('sportFilters'),
      resultsCount: document.getElementById('resultsCount'),
 
      upcomingSection: document.getElementById('upcomingSection'),
      upcomingTimeline: document.getElementById('upcomingTimeline'),
      finishedSection: document.getElementById('finishedSection'),
      finishedGrid: document.getElementById('finishedGrid'),
 
      modalOverlay: document.getElementById('matchModalOverlay'),
      modalBody: document.getElementById('matchModalBody'),
      modalClose: document.getElementById('matchModalClose'),
 
      toast: document.getElementById('toast'),
    };
  }
 
  async init() {
    this.buildDelegationSelector();
    this.bindStaticEvents();
 
    try {
      this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.error('[olimpiadas] Error creando cliente Supabase:', err);
      this.showError('No se pudo inicializar la conexión con la base de datos.');
      return;
    }
 
    await this.loadMatches();
    await this.loadActivities();
  }
 
  // ==============================================
  // SELECTOR DE DELEGACIÓN (segmented control)
  // ==============================================
 
  buildDelegationSelector() {
    const container = this.els.delegationSelector;
    if (!container) return;
 
    const options = [...DELEGATIONS, 'Todos'];
    container.innerHTML = options.map(name => `
      <button type="button" class="delegation-pill${name === this.state.delegation ? ' active' : ''}" data-delegation="${escapeHTML(name)}">
        ${name === 'Todos' ? '<span class="delegation-all-dot" aria-hidden="true"></span>' : flagSVG(name, 22)}
        <span>${escapeHTML(name === 'Todos' ? 'Todos' : name)}</span>
      </button>
    `).join('');
 
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.delegation-pill');
      if (!btn) return;
      container.querySelectorAll('.delegation-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      this.state.delegation = btn.dataset.delegation;
      this.render();
    });
  }
 
  bindStaticEvents() {
    this.els.retryBtn?.addEventListener('click', () => this.loadMatches());
    this.els.noResultsClearBtn?.addEventListener('click', () => this.clearFilters());
 
    this.els.searchInput?.addEventListener('input', debounce((e) => {
      this.state.search = e.target.value.trim().toLowerCase();
      this.toggleSearchClear();
      this.render();
    }, 200));
 
    this.els.searchClear?.addEventListener('click', () => {
      this.els.searchInput.value = '';
      this.state.search = '';
      this.toggleSearchClear();
      this.render();
    });
 
    this.els.modalClose?.addEventListener('click', () => this.closeModal());
    this.els.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.els.modalOverlay) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.els.modalOverlay?.classList.contains('active')) {
        this.closeModal();
      }
    });
  }
 
  toggleSearchClear() {
    if (!this.els.searchClear) return;
    this.els.searchClear.classList.toggle('visible', this.state.search.length > 0);
  }
 
  // ==============================================
  // CARGA DE DATOS
  // ==============================================
 
  async loadMatches() {
    this.showLoading();
 
    try {
      // Se trae TODO el fixture (no solo Alemania): el filtrado por
      // delegación ocurre en el cliente y revisa AMBOS lados de la fila.
      const { data, error } = await this.supabase
        .from(TABLE_MATCHES)
        .select('*')
        .order('match_date', { ascending: true, nullsFirst: false });
 
      if (error) throw error;
 
      this.allMatches = data || [];
      console.log('[olimpiadas] Total de partidos recibidos desde Supabase:', this.allMatches.length);
 
      if (this.allMatches.length === 0) {
        this.showEmpty();
        return;
      }
 
      this.buildSportFilters();
      this.render();
      this.hideStatePanels();
    } catch (err) {
      console.error('[olimpiadas] Error cargando partidos:', err);
      this.showError('Ocurrió un problema al conectar con la base de datos.');
    }
  }
 
  async loadActivities() {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_EVENTS)
        .select('*')
        .order('event_date', { ascending: true, nullsFirst: false });
 
      if (error) throw error;
      this.renderActivities(data || []);
    } catch (err) {
      console.warn('[olimpiadas] No se pudieron cargar actividades (olympics_events):', err.message || err);
      if (this.els.activitiesSection) this.els.activitiesSection.style.display = 'none';
    }
  }
 
  // ==============================================
  // DETECCIÓN DE CONFLICTOS DE HORARIO
  // ==============================================
  // Un conflicto es SIEMPRE relativo a UNA sola delegación: "mi equipo"
  // (Alemania A y/o Alemania B, por ejemplo) no puede jugar dos partidos a
  // la vez, sin importar contra quién juegue cada uno. Por eso esto se
  // recalcula en cada render() usando SOLO la delegación activa en pantalla
  // (this.state.delegation, o PRIMARY_DELEGATION si el modo es "Todos") —
  // antes se calculaba para las 3 delegaciones a la vez y un partido de
  // Alemania podía terminar mostrando, por error, un conflicto que en
  // realidad era entre Francia y Japón y no tenía nada que ver con Alemania.
 
  buildConflictsForCountry(matches, country) {
    const map = new Map();
    const withDate = matches.filter(m => m.match_date);
 
    const addConflict = (matchId, otherMatch) => {
      if (!map.has(matchId)) map.set(matchId, []);
      map.get(matchId).push({ country, other: otherMatch });
    };
 
    const involved = withDate.filter(m => involvesCountry(m, country));
    for (let i = 0; i < involved.length; i++) {
      for (let j = i + 1; j < involved.length; j++) {
        const a = involved[i];
        const b = involved[j];
        if (a.id === b.id) continue;
        const ta = parseMatchDate(a.match_date).getTime();
        const tb = parseMatchDate(b.match_date).getTime();
        if (Math.abs(ta - tb) < ESTIMATED_DURATION_MS) {
          addConflict(a.id, b);
          addConflict(b.id, a);
        }
      }
    }
 
    return map;
  }
 
  // ==============================================
  // ESTADOS
  // ==============================================
 
  showLoading() {
    this.setStateVisible('loadingState', true);
    ['errorState', 'emptyState', 'noResultsState'].forEach(id => this.setStateVisible(id, false));
    this.setSectionsVisible(false);
  }
 
  showError(message) {
    this.setStateVisible('loadingState', false);
    this.setStateVisible('errorState', true);
    if (this.els.errorMessage) this.els.errorMessage.textContent = message;
    ['emptyState', 'noResultsState'].forEach(id => this.setStateVisible(id, false));
    this.setSectionsVisible(false);
  }
 
  showEmpty() {
    this.setStateVisible('loadingState', false);
    this.setStateVisible('emptyState', true);
    ['errorState', 'noResultsState'].forEach(id => this.setStateVisible(id, false));
    this.setSectionsVisible(false);
  }
 
  showNoResults(show) {
    this.setStateVisible('noResultsState', show);
  }
 
  hideStatePanels() {
    ['loadingState', 'errorState', 'emptyState'].forEach(id => this.setStateVisible(id, false));
  }
 
  setStateVisible(id, visible) {
    const el = this.els[id];
    if (el) el.style.display = visible ? '' : 'none';
  }
 
  setSectionsVisible(visible) {
    const display = visible ? '' : 'none';
    if (this.els.nextMatchSection) this.els.nextMatchSection.style.display = display;
  }
 
  // ==============================================
  // FILTROS
  // ==============================================
 
  buildSportFilters() {
    const sports = [...new Set(this.allMatches.map(m => m.sport).filter(Boolean))]
      .sort((a, b) => {
        const ia = SPORT_ORDER.indexOf(a);
        const ib = SPORT_ORDER.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
 
    const container = this.els.sportFilters;
    if (!container) return;
 
    container.innerHTML = '';
    container.appendChild(this.createFilterPill('', 'Todos los deportes', true));
    sports.forEach(sport => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'filter-pill filter-pill-sport';
      pill.dataset.value = sport;
      pill.innerHTML = `${sportIconSVG(sport, 16)}<span>${escapeHTML(sport)}</span>`;
      container.appendChild(pill);
    });
 
    container.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;
      container.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      this.state.sport = pill.dataset.value;
      this.render();
    });
  }
 
  createFilterPill(value, label, active) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-pill${active ? ' active' : ''}`;
    btn.dataset.value = value;
    btn.textContent = label;
    return btn;
  }
 
  setSportFilter(sport) {
    this.state.sport = sport;
    this.els.sportFilters?.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.value === sport);
    });
    this.render();
    this.els.upcomingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
 
  clearFilters() {
    this.state.search = '';
    this.state.sport = '';
    if (this.els.searchInput) this.els.searchInput.value = '';
    this.toggleSearchClear();
    this.els.sportFilters?.querySelectorAll('.filter-pill').forEach((p, i) => p.classList.toggle('active', i === 0));
    this.render();
  }
 
  // ==============================================
  // FILTRADO PRINCIPAL
  // ==============================================
 
  getDelegationMatches() {
    if (this.state.delegation === 'Todos') return this.allMatches;
    return this.allMatches.filter(m => involvesCountry(m, this.state.delegation));
  }
 
  getFilteredMatches() {
    return this.getDelegationMatches().filter(m => {
      if (this.state.sport && m.sport !== this.state.sport) return false;
 
      if (this.state.search) {
        const haystack = [m.team, m.opponent, m.sport, m.venue, m.court].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(this.state.search)) return false;
      }
 
      return true;
    });
  }
 
  // ==============================================
  // RENDER PRINCIPAL
  // ==============================================
 
  render() {
    this.clearCountdowns();
 
    // El conflicto siempre es "mi equipo contra sí mismo en el tiempo": se
    // recalcula para la delegación que se está viendo ahora mismo (o para
    // PRIMARY_DELEGATION si el modo es "Todos", ya que ahí no hay una sola
    // "mi equipo" seleccionada). Nunca mezcla conflictos de delegaciones
    // que no son la que está en pantalla.
    const conflictCountry = this.state.delegation === 'Todos' ? PRIMARY_DELEGATION : this.state.delegation;
    this.conflicts = this.buildConflictsForCountry(this.allMatches, conflictCountry);
 
    const delegationMatches = this.getDelegationMatches();
    const filtered = this.getFilteredMatches();
    const hasFilterActive = this.state.search || this.state.sport;
 
    if (this.els.resultsCount) {
      this.els.resultsCount.textContent = hasFilterActive
        ? `${filtered.length} partido${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`
        : '';
    }
 
    this.renderStats(delegationMatches);
    this.renderSports(delegationMatches);
    this.renderVenues(delegationMatches);
 
    if (filtered.length === 0) {
      this.showNoResults(true);
      this.setSectionsVisible(false);
      if (this.els.upcomingSection) this.els.upcomingSection.style.display = 'none';
      if (this.els.finishedSection) this.els.finishedSection.style.display = 'none';
      return;
    }
 
    this.showNoResults(false);
 
    const now = Date.now();
    const withDate = filtered.filter(m => m.match_date);
    const withoutDate = filtered.filter(m => !m.match_date);
 
    const upcoming = withDate
      .filter(m => parseMatchDate(m.match_date).getTime() >= now)
      .sort((a, b) => parseMatchDate(a.match_date) - parseMatchDate(b.match_date))
      .concat(withoutDate);
 
    const finished = withDate
      .filter(m => parseMatchDate(m.match_date).getTime() < now)
      .sort((a, b) => parseMatchDate(b.match_date) - parseMatchDate(a.match_date));
 
    // El "próximo partido" destacado sigue siempre a la delegación activa
    // (o al fixture completo si el modo es "Todos"), nunca a un partido
    // fuera del filtro de deporte/búsqueda que el usuario esté usando.
    const delegationUpcoming = delegationMatches
      .filter(m => m.match_date && parseMatchDate(m.match_date).getTime() >= now)
      .sort((a, b) => parseMatchDate(a.match_date) - parseMatchDate(b.match_date));
 
    this.renderNextMatch(delegationUpcoming[0] || null);
    this.renderUpcomingTimeline(upcoming);
    this.renderFinished(finished);
  }
 
  // ==============================================
  // RESUMEN / STATS
  // ==============================================
 
  renderStats(matches) {
    animateCounter(this.els.statTotal, matches.length);
 
    const withDate = matches.filter(m => m.match_date);
    const now = Date.now();
    const upcoming = withDate.filter(m => parseMatchDate(m.match_date).getTime() >= now);
    const past = withDate.filter(m => parseMatchDate(m.match_date).getTime() < now);
 
    if (this.els.statNext) {
      this.els.statNext.textContent = upcoming.length ? formatDayMonth(parseMatchDate(upcoming[0].match_date)) : '—';
    }
    if (this.els.statLast) {
      const lastPast = past[past.length - 1];
      this.els.statLast.textContent = lastPast ? formatDayMonth(parseMatchDate(lastPast.match_date)) : '—';
    }
  }
 
  // ==============================================
  // SECCIÓN DEPORTES (funcional, conectada a datos reales)
  // ==============================================
 
  renderSports(matches) {
    if (!this.els.sportsGrid) return;
 
    const sports = [...new Set(matches.map(m => m.sport).filter(Boolean))]
      .sort((a, b) => {
        const ia = SPORT_ORDER.indexOf(a);
        const ib = SPORT_ORDER.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
 
    if (sports.length === 0) {
      this.els.sportsGrid.innerHTML = '';
      return;
    }
 
    const now = Date.now();
 
    this.els.sportsGrid.innerHTML = sports.map(sport => {
      const sportMatches = matches.filter(m => m.sport === sport);
      const withDate = sportMatches.filter(m => m.match_date);
      const upcoming = withDate
        .filter(m => parseMatchDate(m.match_date).getTime() >= now)
        .sort((a, b) => parseMatchDate(a.match_date) - parseMatchDate(b.match_date))[0];
      const finishedCount = withDate.filter(m => parseMatchDate(m.match_date).getTime() < now).length;
      const venue = sportMatches.find(m => m.venue)?.venue || VENUES_BY_SPORT[sport] || 'Sede por confirmar';
 
      return `
        <button type="button" class="sport-card" data-sport="${escapeHTML(sport)}">
          <div class="sport-card-icon">${sportIconSVG(sport, 30)}</div>
          <div class="sport-card-name">${escapeHTML(sport)}</div>
          <div class="sport-card-stats">
            <span><strong>${sportMatches.length}</strong> partido${sportMatches.length === 1 ? '' : 's'}</span>
            <span><strong>${finishedCount}</strong> con resultado</span>
          </div>
          <div class="sport-card-next">
            ${upcoming
              ? `Próximo: ${formatDayMonth(parseMatchDate(upcoming.match_date))} · ${formatTime(parseMatchDate(upcoming.match_date))}`
              : 'Sin próximos partidos'}
          </div>
          <div class="sport-card-venue">📍 ${escapeHTML(venue)}</div>
        </button>
      `;
    }).join('');
 
    this.els.sportsGrid.querySelectorAll('.sport-card').forEach(card => {
      card.addEventListener('click', () => this.setSportFilter(card.dataset.sport));
    });
  }
 
  // ==============================================
  // SECCIÓN SEDES (funcional, conectada a datos reales)
  // ==============================================
 
  renderVenues(matches) {
    if (!this.els.venuesGrid) return;
 
    const venueNames = [...new Set(matches.map(m => m.venue).filter(Boolean))];
 
    if (venueNames.length === 0) {
      this.els.venuesGrid.innerHTML = '';
      return;
    }
 
    const now = Date.now();
 
    this.els.venuesGrid.innerHTML = venueNames.map((venue, i) => {
      const venueMatches = matches.filter(m => m.venue === venue);
      const sport = venueMatches.find(m => m.sport)?.sport || '';
      const withDate = venueMatches.filter(m => m.match_date);
      const upcoming = withDate
        .filter(m => parseMatchDate(m.match_date).getTime() >= now)
        .sort((a, b) => parseMatchDate(a.match_date) - parseMatchDate(b.match_date))[0];
 
      return `
        <div class="venue-card">
          <div class="venue-card-cover venue-cover-${i % 4}" data-venue-cover="${escapeHTML(venue)}">
            <div class="venue-card-icon">${sportIconSVG(sport, 26)}</div>
          </div>
          <div class="venue-card-body">
            <div class="venue-card-name">${escapeHTML(venue)}</div>
            <div class="venue-card-sport">${escapeHTML(sport || 'Múltiples disciplinas')}</div>
            <div class="venue-card-meta">
              <span><strong>${venueMatches.length}</strong> partido${venueMatches.length === 1 ? '' : 's'}</span>
              ${upcoming ? `<span>Próximo: ${formatDayMonth(parseMatchDate(upcoming.match_date))} · ${formatTime(parseMatchDate(upcoming.match_date))}</span>` : '<span>Sin próximos partidos</span>'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
 
  // ==============================================
  // ACTIVIDADES DE SECUNDARIA (no son partidos)
  // ==============================================
 
  renderActivities(activities) {
    if (!this.els.activitiesSection || !this.els.activitiesGrid) return;
 
    if (!activities.length) {
      this.els.activitiesSection.style.display = 'none';
      return;
    }
 
    this.els.activitiesSection.style.display = '';
    this.els.activitiesGrid.innerHTML = activities.map(ev => {
      const hasDate = Boolean(ev.event_date);
      const date = hasDate ? parseMatchDate(ev.event_date) : null;
      return `
        <article class="activity-card">
          <div class="activity-icon">${eventIconSVG(ev.event_type)}</div>
          <div class="activity-title">${escapeHTML(ev.title)}</div>
          <div class="activity-meta">
            ${hasDate ? `<span>${formatDayMonth(date)} · ${formatTime(date)}</span>` : '<span>Fecha por confirmar</span>'}
            ${ev.venue ? `<span>📍 ${escapeHTML(ev.venue)}</span>` : ''}
          </div>
          ${ev.description ? `<p class="activity-description">${escapeHTML(ev.description)}</p>` : ''}
        </article>
      `;
    }).join('');
  }
 
  // ==============================================
  // PRÓXIMO PARTIDO (hero)
  // ==============================================
 
  renderNextMatch(match) {
    if (!this.els.nextMatchSection || !this.els.nextMatchCard) return;
 
    if (!match) {
      this.els.nextMatchSection.style.display = 'none';
      return;
    }
 
    this.els.nextMatchSection.style.display = '';
 
    const date = parseMatchDate(match.match_date);
    const conflict = this.conflicts.get(match.id);
 
    this.els.nextMatchCard.innerHTML = `
      <div class="next-match-flagbg">
        <div class="flagbg-side">${flagSVG(match.team_country, 300)}</div>
        <div class="flagbg-side">${flagSVG(match.opponent_country, 300)}</div>
      </div>
      <div class="next-match-inner">
        <div class="next-match-label">Próximo partido</div>
        ${conflict ? this.conflictBadgeHTML(conflict) : ''}
        <div class="next-match-sport">${sportIconSVG(match.sport, 18)}<span>${escapeHTML((match.sport || '').toUpperCase())}</span></div>
 
        <div class="next-match-teams">
          <div class="next-match-team">
            <span class="next-match-flag">${flagSVG(match.team_country, 56)}</span>
            <span class="next-match-team-name">${escapeHTML(match.team || 'Por confirmar')}</span>
          </div>
          <span class="next-match-vs">VS</span>
          <div class="next-match-team">
            <span class="next-match-flag">${flagSVG(match.opponent_country, 56)}</span>
            <span class="next-match-team-name">${escapeHTML(match.opponent || 'Por confirmar')}</span>
          </div>
        </div>
 
        <div class="next-match-meta">
          <span>${formatLongDate(date)} · ${formatTime(date)}</span>
          ${match.venue ? `<span>📍 ${escapeHTML(match.venue)}</span>` : ''}
        </div>
 
        <div class="next-match-countdown" id="nextMatchCountdown" data-target="${escapeHTML(match.match_date)}">
          <div class="countdown-block"><span class="cd-value" data-unit="days">00</span><span class="cd-label">Días</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="hours">00</span><span class="cd-label">Hrs</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="minutes">00</span><span class="cd-label">Min</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="seconds">00</span><span class="cd-label">Seg</span></div>
        </div>
      </div>
    `;
 
    this.attachNextMatchCountdown(match.match_date);
    this.els.nextMatchCard.onclick = (e) => {
      if (e.target.closest('.conflict-badge')) return;
      this.openModal(match);
    };
  }
 
  conflictBadgeHTML(conflict) {
    const first = conflict[0];
    const title = `${first.country}: 2 partidos simultáneos — también juega vs ${escapeHTML(first.other.opponent === first.other.team ? '' : (first.other.team && first.other.opponent))} a las ${formatTime(parseMatchDate(first.other.match_date))} en ${escapeHTML(first.other.venue || 'sede por confirmar')}`;
    return `
      <div class="conflict-badge" tabindex="0" title="${title}">
        <span class="conflict-dot" aria-hidden="true"></span>
        <span>Conflicto de horario</span>
      </div>
    `;
  }
 
  attachNextMatchCountdown(matchDate) {
    const container = document.getElementById('nextMatchCountdown');
    if (!container) return;
    const target = parseMatchDate(matchDate).getTime();
 
    const tick = () => {
      const distance = target - Date.now();
      if (distance <= 0) {
        container.innerHTML = '<div class="live-badge">EN JUEGO</div>';
        clearInterval(intervalId);
        return;
      }
      const days = Math.floor(distance / 86400000);
      const hours = Math.floor((distance % 86400000) / 3600000);
      const minutes = Math.floor((distance % 3600000) / 60000);
      const seconds = Math.floor((distance % 60000) / 1000);
 
      container.querySelector('[data-unit="days"]').textContent = String(days).padStart(2, '0');
      container.querySelector('[data-unit="hours"]').textContent = String(hours).padStart(2, '0');
      container.querySelector('[data-unit="minutes"]').textContent = String(minutes).padStart(2, '0');
      container.querySelector('[data-unit="seconds"]').textContent = String(seconds).padStart(2, '0');
    };
 
    tick();
    const intervalId = setInterval(tick, 1000);
    this.countdownIntervals.push(intervalId);
  }
 
  // ==============================================
  // TIMELINE / FIXTURE AGRUPADO POR FECHA
  // ==============================================
 
  renderUpcomingTimeline(upcoming) {
    if (!this.els.upcomingSection || !this.els.upcomingTimeline) return;
 
    if (upcoming.length === 0) {
      this.els.upcomingSection.style.display = 'none';
      return;
    }
    this.els.upcomingSection.style.display = '';
 
    const groups = new Map();
    upcoming.forEach(m => {
      const key = m.match_date ? dateKey(parseMatchDate(m.match_date)) : 'sin-fecha';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    });
 
    let html = '';
    groups.forEach((matches) => {
      const label = matches[0].match_date
        ? formatLongDate(parseMatchDate(matches[0].match_date)).toUpperCase()
        : 'FECHA POR CONFIRMAR';
 
      html += `
        <div class="timeline-day">
          <div class="timeline-day-label">${label}</div>
          <div class="timeline-matches">
            ${matches.map(m => this.matchCardHTML(m)).join('')}
          </div>
        </div>
      `;
    });
 
    this.els.upcomingTimeline.innerHTML = html;
    this.bindMatchCardEvents(this.els.upcomingTimeline);
    this.attachCardCountdowns(this.els.upcomingTimeline);
  }
 
  renderFinished(finished) {
    if (!this.els.finishedSection || !this.els.finishedGrid) return;
 
    if (finished.length === 0) {
      this.els.finishedSection.style.display = 'none';
      return;
    }
    this.els.finishedSection.style.display = '';
    this.els.finishedGrid.innerHTML = finished.map(m => this.matchCardHTML(m, true)).join('');
    this.bindMatchCardEvents(this.els.finishedGrid);
  }
 
  matchCardHTML(match, isPast = false) {
    const hasDate = Boolean(match.match_date);
    const date = hasDate ? parseMatchDate(match.match_date) : null;
    const liveStatus = computeLiveStatus(match);
    const hasScore = match.score_team !== null && match.score_team !== undefined
      && match.score_opponent !== null && match.score_opponent !== undefined;
    const conflict = this.conflicts.get(match.id);
 
    return `
      <article class="match-card status-${liveStatus}${conflict ? ' has-conflict' : ''}" data-id="${escapeHTML(match.id)}" tabindex="0" role="button" aria-label="Ver detalle del partido">
        <div class="match-card-flagbg">
          <div class="flagbg-side">${flagSVG(match.team_country, 200)}</div>
          <div class="flagbg-side">${flagSVG(match.opponent_country, 200)}</div>
        </div>
 
        <div class="match-card-inner">
          <div class="match-card-top">
            <span class="match-sport-tag">${sportIconSVG(match.sport, 15)}<span>${escapeHTML(match.sport || 'Deporte')}</span></span>
            <span class="match-status-badge status-${liveStatus}">${STATUS_LABELS[liveStatus] || 'Próximo'}</span>
          </div>
 
          ${conflict ? `<div class="conflict-badge inline" tabindex="0" title="${escapeHTML(conflict[0].country)}: partido simultáneo a las ${formatTime(parseMatchDate(conflict[0].other.match_date))} en ${escapeHTML(conflict[0].other.venue || 'sede por confirmar')}"><span class="conflict-dot" aria-hidden="true"></span><span>Conflicto de horario</span></div>` : ''}
 
          <div class="match-teams">
            <div class="match-team">
              <span class="match-flag">${flagSVG(match.team_country, 40)}</span>
              <span class="match-team-name">${escapeHTML(match.team || 'Por confirmar')}</span>
            </div>
            <span class="match-vs">${hasScore ? `${match.score_team} - ${match.score_opponent}` : 'VS'}</span>
            <div class="match-team">
              <span class="match-flag">${flagSVG(match.opponent_country, 40)}</span>
              <span class="match-team-name">${escapeHTML(match.opponent || 'Por confirmar')}</span>
            </div>
          </div>
 
          <div class="match-card-meta">
            ${hasDate ? `<span>${formatDayMonth(date)} · ${formatTime(date)}</span>` : '<span>Fecha por confirmar</span>'}
            ${match.venue ? `<span>📍 ${escapeHTML(match.venue)}</span>` : ''}
          </div>
 
          ${!isPast && hasDate ? `
            <div class="match-countdown-mini" data-countdown-target="${escapeHTML(match.match_date)}" data-match-id="${escapeHTML(match.id)}">
              <span data-mini-countdown>—</span>
            </div>
          ` : ''}
 
          ${isPast ? `<div class="match-result-line">${hasScore ? 'Resultado final' : 'Resultado pendiente'}</div>` : ''}
        </div>
      </article>
    `;
  }
 
  bindMatchCardEvents(container) {
    container.querySelectorAll('.match-card').forEach(card => {
      const openHandler = (e) => {
        if (e.target.closest('.conflict-badge')) return;
        const match = this.allMatches.find(m => String(m.id) === card.dataset.id);
        if (match) this.openModal(match);
      };
      card.addEventListener('click', openHandler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openHandler(e);
        }
      });
    });
  }
 
  attachCardCountdowns(container) {
    container.querySelectorAll('[data-countdown-target]').forEach(el => {
      const target = parseMatchDate(el.dataset.countdownTarget).getTime();
      const valueEl = el.querySelector('[data-mini-countdown]');
 
      const tick = () => {
        const distance = target - Date.now();
        if (distance <= 0) {
          valueEl.textContent = 'EN JUEGO';
          clearInterval(intervalId);
          return;
        }
        const days = Math.floor(distance / 86400000);
        const hours = Math.floor((distance % 86400000) / 3600000);
        const minutes = Math.floor((distance % 3600000) / 60000);
 
        if (days > 0) valueEl.textContent = `T− ${days}d ${hours}h`;
        else if (hours > 0) valueEl.textContent = `T− ${hours}h ${minutes}m`;
        else valueEl.textContent = `T− ${minutes}m`;
      };
 
      tick();
      const intervalId = setInterval(tick, 30000);
      this.countdownIntervals.push(intervalId);
    });
  }
 
  clearCountdowns() {
    this.countdownIntervals.forEach(id => clearInterval(id));
    this.countdownIntervals = [];
  }
 
  // ==============================================
  // MODAL DE DETALLE
  // ==============================================
 
  openModal(match) {
    const hasDate = Boolean(match.match_date);
    const date = hasDate ? parseMatchDate(match.match_date) : null;
    const liveStatus = computeLiveStatus(match);
    const hasScore = match.score_team !== null && match.score_team !== undefined
      && match.score_opponent !== null && match.score_opponent !== undefined;
    const conflict = this.conflicts.get(match.id);
 
    this.els.modalBody.innerHTML = `
      <div class="modal-sport">${sportIconSVG(match.sport, 18)}<span>${escapeHTML((match.sport || 'DEPORTE').toUpperCase())}</span></div>
 
      ${conflict ? `
        <div class="modal-conflict">
          <div class="modal-conflict-title"><span class="conflict-dot" aria-hidden="true"></span> Conflicto de horario — ${escapeHTML(conflict[0].country)}</div>
          ${conflict.map(c => `
            <div class="modal-conflict-row">
              <span>${formatTime(parseMatchDate(c.other.match_date))} · ${escapeHTML(c.other.team)} vs ${escapeHTML(c.other.opponent)}</span>
              <span>📍 ${escapeHTML(c.other.venue || 'Sede por confirmar')}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
 
      <div class="modal-teams">
        <div class="modal-team">
          <span class="modal-flag">${flagSVG(match.team_country, 64)}</span>
          <span class="modal-team-name">${escapeHTML(match.team || 'Por confirmar')}</span>
        </div>
        <span class="modal-vs">${hasScore ? `${match.score_team} - ${match.score_opponent}` : 'VS'}</span>
        <div class="modal-team">
          <span class="modal-flag">${flagSVG(match.opponent_country, 64)}</span>
          <span class="modal-team-name">${escapeHTML(match.opponent || 'Por confirmar')}</span>
        </div>
      </div>
 
      <div class="modal-details">
        <div class="modal-detail-row"><span>Fecha</span><strong>${hasDate ? formatLongDate(date) : 'Por confirmar'}</strong></div>
        <div class="modal-detail-row"><span>Hora</span><strong>${hasDate ? formatTime(date) : 'Por confirmar'}</strong></div>
        <div class="modal-detail-row"><span>Sede</span><strong>${escapeHTML(match.venue || 'Por confirmar')}</strong></div>
        ${match.court ? `<div class="modal-detail-row"><span>Cancha</span><strong>${escapeHTML(match.court)}</strong></div>` : ''}
        <div class="modal-detail-row"><span>Estado</span><strong class="modal-status status-${liveStatus}">${STATUS_LABELS[liveStatus]}</strong></div>
        ${hasScore ? `<div class="modal-detail-row"><span>Resultado</span><strong>${match.score_team} - ${match.score_opponent}</strong></div>` : ''}
        ${match.notes ? `<div class="modal-detail-row modal-notes"><span>Nota</span><strong>${escapeHTML(match.notes)}</strong></div>` : ''}
      </div>
 
      ${!hasScore && liveStatus !== 'finalizado' && hasDate ? `
        <div class="modal-countdown" id="modalCountdown" data-target="${escapeHTML(match.match_date)}">
          <div class="countdown-block"><span class="cd-value" data-unit="days">00</span><span class="cd-label">Días</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="hours">00</span><span class="cd-label">Hrs</span></div>
          <div class="countdown-block"><span class="cd-value" data-unit="minutes">00</span><span class="cd-label">Min</span></div>
        </div>
      ` : ''}
    `;
 
    if (!hasScore && liveStatus !== 'finalizado' && hasDate) {
      this.attachModalCountdown(match.match_date);
    }
 
    this.els.modalOverlay.classList.add('active');
    this.els.modalOverlay.setAttribute('aria-hidden', 'false');
    this.els.modalClose?.focus();
    document.body.style.overflow = 'hidden';
  }
 
  attachModalCountdown(matchDate) {
    const container = document.getElementById('modalCountdown');
    if (!container) return;
    const target = parseMatchDate(matchDate).getTime();
 
    const tick = () => {
      const distance = target - Date.now();
      if (distance <= 0) {
        clearInterval(intervalId);
        return;
      }
      const days = Math.floor(distance / 86400000);
      const hours = Math.floor((distance % 86400000) / 3600000);
      const minutes = Math.floor((distance % 3600000) / 60000);
 
      container.querySelector('[data-unit="days"]').textContent = String(days).padStart(2, '0');
      container.querySelector('[data-unit="hours"]').textContent = String(hours).padStart(2, '0');
      container.querySelector('[data-unit="minutes"]').textContent = String(minutes).padStart(2, '0');
    };
 
    tick();
    const intervalId = setInterval(tick, 1000);
    this.countdownIntervals.push(intervalId);
  }
 
  closeModal() {
    this.els.modalOverlay.classList.remove('active');
    this.els.modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}
 