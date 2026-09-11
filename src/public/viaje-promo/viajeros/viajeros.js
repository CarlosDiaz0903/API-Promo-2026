/**
 * ==============================================
 * VIAJE PROMO 2026 - Viajeros (directorio)
 * 100% desde Supabase (travelers + flight_seats + flights)
 * ==============================================
 */

import { getSupabaseClient, TABLES } from '../shared/config.js';
import { escapeHTML } from '../shared/utils.js';

const el = {
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  emptyState: document.getElementById('emptyState'),
  noResultsState: document.getElementById('noResultsState'),
  retryBtn: document.getElementById('retryBtn'),
  travelersSection: document.getElementById('travelersSection'),
  travelersGrid: document.getElementById('travelersGrid'),
  travelersSubtitle: document.getElementById('travelersSubtitle'),
  searchBar: document.getElementById('searchBar'),
  searchInput: document.getElementById('searchInput'),
  searchClear: document.getElementById('searchClear'),
  classFilters: document.getElementById('classFilters')
};

const state = {
  travelers: [],       // [{id, full_name, class, seats: {ida, retorno}}]
  filtered: [],
  search: '',
  classFilter: ''
};

// ==============================================
// CARGA DE DATOS
// ==============================================

async function loadTravelers() {
  showState('loading');
  const supabase = getSupabaseClient();

  try {
    const [travelersRes, flightsRes] = await Promise.all([
      supabase.from(TABLES.travelers).select('*').order('full_name', { ascending: true }),
      supabase.from(TABLES.flights).select('id, departure_at').order('departure_at', { ascending: true })
    ]);

    if (travelersRes.error) throw travelersRes.error;
    if (flightsRes.error) throw flightsRes.error;

    const travelers = travelersRes.data || [];
    const flights = flightsRes.data || [];

    if (travelers.length === 0) {
      showState('empty');
      return;
    }

    // El primer vuelo (por fecha) = ida; el segundo = retorno.
    const idaFlightId = flights[0]?.id ?? null;
    const retornoFlightId = flights[1]?.id ?? null;

    const seatsRes = await supabase
      .from(TABLES.flightSeats)
      .select('traveler_id, seat, flight_id')
      .not('traveler_id', 'is', null);

    if (seatsRes.error) throw seatsRes.error;

    const seatsByTraveler = new Map();
    (seatsRes.data || []).forEach(row => {
      if (!seatsByTraveler.has(row.traveler_id)) {
        seatsByTraveler.set(row.traveler_id, { ida: null, retorno: null });
      }
      const entry = seatsByTraveler.get(row.traveler_id);
      if (row.flight_id === idaFlightId) entry.ida = row.seat;
      if (row.flight_id === retornoFlightId) entry.retorno = row.seat;
    });

    state.travelers = travelers.map(t => ({
      ...t,
      seats: seatsByTraveler.get(t.id) || { ida: null, retorno: null }
    }));

    el.travelersSubtitle.textContent = `${state.travelers.length} viajeros · Directorio de la promoción`;

    applyFilters();

  } catch (error) {
    console.error('Error al cargar a los viajeros:', error);
    showState('error');
  } finally {
    document.dispatchEvent(new CustomEvent('viaje:ready'));
  }
}

function showState(view) {
  el.loadingState.style.display = view === 'loading' ? 'flex' : 'none';
  el.errorState.style.display = view === 'error' ? 'flex' : 'none';
  el.emptyState.style.display = view === 'empty' ? 'flex' : 'none';
  el.noResultsState.style.display = view === 'no-results' ? 'flex' : 'none';
  el.travelersSection.style.display = view === 'content' ? 'block' : 'none';
}

// ==============================================
// FILTROS (buscador + salón)
// ==============================================

function applyFilters() {
  const searchLower = state.search.toLowerCase();

  state.filtered = state.travelers.filter(t => {
    const matchesSearch = !searchLower || t.full_name?.toLowerCase().includes(searchLower);
    const matchesClass = !state.classFilter || t.class === state.classFilter;
    return matchesSearch && matchesClass;
  });

  if (state.filtered.length === 0) {
    showState('no-results');
    return;
  }

  showState('content');
  renderTravelers(state.filtered);
}

// ==============================================
// RENDER
// ==============================================

function getInitials(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return (first + last).toUpperCase();
}

function renderTravelers(travelers) {
  el.travelersGrid.innerHTML = travelers.map(t => `
    <article class="traveler-card" role="listitem">
      <div class="traveler-header">
        <div class="traveler-avatar">${escapeHTML(getInitials(t.full_name))}</div>
        <div class="traveler-info">
          <span class="traveler-name" title="${escapeHTML(t.full_name)}">${escapeHTML(t.full_name)}</span>
          <span class="traveler-class">${escapeHTML(t.class || '')}</span>
        </div>
      </div>
      <div class="traveler-seats">
        ${renderSeatBlock('Ida', t.seats.ida)}
        ${renderSeatBlock('Retorno', t.seats.retorno)}
      </div>
    </article>
  `).join('');
}

function renderSeatBlock(label, seatCode) {
  return `
    <div class="traveler-seat-block">
      <span class="traveler-seat-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H3.5c-.4 0-.7.1-.9.4l-.6.6c-.6.6-.5 1.6.3 2l3 1.5.8 3c.4.7 1.4.9 2 .3l.6-.6c.3-.3.4-.6.4-.9V17l3-2 3.4 6.1c.3.6 1.2.8 1.7.3l.8-.7c.4-.3.5-.8.4-1.3z"></path></svg>
        ${label}
      </span>
      ${seatCode
        ? `<span class="traveler-seat-value">${escapeHTML(seatCode)}</span>`
        : `<span class="traveler-seat-value unassigned">Sin asignar</span>`
      }
    </div>
  `;
}

// ==============================================
// EVENTOS
// ==============================================

let debounceTimer;
el.searchInput.addEventListener('input', () => {
  el.searchBar.classList.toggle('has-value', Boolean(el.searchInput.value));
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.search = el.searchInput.value.trim();
    applyFilters();
  }, 250);
});

el.searchClear.addEventListener('click', () => {
  el.searchInput.value = '';
  el.searchBar.classList.remove('has-value');
  state.search = '';
  applyFilters();
});

el.classFilters.querySelectorAll('.class-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    el.classFilters.querySelectorAll('.class-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.classFilter = btn.dataset.class;
    applyFilters();
  });
});

el.retryBtn.addEventListener('click', loadTravelers);

loadTravelers();
