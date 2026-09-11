/**
 * ==============================================
 * VIAJE PROMO 2026 - Vuelos
 * Selector de vuelo + Boarding Pass + Seat Map interactivo
 * Fuente de verdad: Supabase (flights, flight_seats, travelers)
 * ==============================================
 */

import { getSupabaseClient, TABLES } from '../shared/config.js';
import {
  escapeHTML, formatShortDate, formatTime12h, formatLongDate,
  showToast, getSeatGroupsForLayout
} from '../shared/utils.js';

// Códigos de aeropuerto conocidos (solo presentación del boarding pass;
// no se guarda en Supabase, es un mapeo puramente visual).
const AIRPORT_CODES = {
  'Lima': 'LIM',
  'Cusco': 'CUZ',
  'Arequipa': 'AQP',
  'Puno': 'PUJ',
  'Juliaca': 'JUL'
};

function getAirportCode(city) {
  if (!city) return '—';
  return AIRPORT_CODES[city] || city.slice(0, 3).toUpperCase();
}

const el = {
  flightTabs: document.getElementById('flightTabs'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  emptyState: document.getElementById('emptyState'),
  retryBtn: document.getElementById('retryBtn'),
  flightContent: document.getElementById('flightContent'),
  boardingPass: document.getElementById('boardingPass'),
  seatStats: document.getElementById('seatStats'),
  seatMap: document.getElementById('seatMap'),
  seatModalOverlay: document.getElementById('seatModalOverlay'),
  seatModal: document.getElementById('seatModal'),
  seatModalBody: document.getElementById('seatModalBody'),
  seatModalClose: document.getElementById('seatModalClose'),
  toast: document.getElementById('toast')
};

const state = {
  flights: [],
  activeFlightId: null,
  activeSeat: null, // último asiento asignado seleccionado, para reflejar en el boarding pass
  travelersCount: 0 // total de viajeros de la promoción (independiente del avión)
};

// ==============================================
// CARGA DE VUELOS
// ==============================================

async function loadFlights() {
  showState('loading');
  const supabase = getSupabaseClient();

  try {
    const [flightsRes, travelersRes] = await Promise.all([
      supabase
        .from(TABLES.flights)
        .select('*')
        .order('departure_at', { ascending: true, nullsFirst: false }),
      supabase
        .from(TABLES.travelers)
        .select('id', { count: 'exact', head: true })
    ]);

    if (flightsRes.error) throw flightsRes.error;
    if (travelersRes.error) throw travelersRes.error;

    state.flights = flightsRes.data || [];
    state.travelersCount = travelersRes.count || 0;

    if (state.flights.length === 0) {
      showState('empty');
      return;
    }

    renderFlightTabs();
    await selectFlight(state.flights[0].id);
    showState('content');

  } catch (error) {
    console.error('Error al cargar los vuelos:', error);
    showState('error');
  } finally {
    document.dispatchEvent(new CustomEvent('viaje:ready'));
  }
}

function showState(view) {
  el.loadingState.style.display = view === 'loading' ? 'flex' : 'none';
  el.errorState.style.display = view === 'error' ? 'flex' : 'none';
  el.emptyState.style.display = view === 'empty' ? 'flex' : 'none';
  el.flightContent.style.display = view === 'content' ? 'flex' : 'none';
}

// ==============================================
// TABS DE VUELO
// ==============================================

function renderFlightTabs() {
  el.flightTabs.innerHTML = state.flights.map(f => `
    <button class="flight-tab" data-flight-id="${f.id}" role="tab" aria-selected="false">
      <span class="flight-tab-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H3.5c-.4 0-.7.1-.9.4l-.6.6c-.6.6-.5 1.6.3 2l3 1.5.8 3c.4.7 1.4.9 2 .3l.6-.6c.3-.3.4-.6.4-.9V17l3-2 3.4 6.1c.3.6 1.2.8 1.7.3l.8-.7c.4-.3.5-.8.4-1.3z"></path></svg>
      </span>
      <span>
        <span class="flight-tab-route">${escapeHTML(f.origin || '?')} → ${escapeHTML(f.destination || '?')}</span><br>
        <span class="flight-tab-date">${f.departure_at ? formatShortDate(f.departure_at) : 'Fecha por confirmar'}</span>
      </span>
    </button>
  `).join('');

  el.flightTabs.querySelectorAll('.flight-tab').forEach(btn => {
    btn.addEventListener('click', () => selectFlight(btn.dataset.flightId));
  });
}

function updateActiveTab() {
  el.flightTabs.querySelectorAll('.flight-tab').forEach(btn => {
    const isActive = btn.dataset.flightId === String(state.activeFlightId);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
}

// ==============================================
// SELECCIÓN DE VUELO
// ==============================================

async function selectFlight(flightId) {
  state.activeFlightId = flightId;
  state.activeSeat = null;
  updateActiveTab();

  const flight = state.flights.find(f => String(f.id) === String(flightId));
  if (!flight) return;

  renderBoardingPass(flight, null);

  const hasSeatConfig = Boolean(flight.total_rows && flight.seat_layout);

  if (!hasSeatConfig) {
    renderNoSeatConfig(flight);
    return;
  }

  await loadSeats(flight);
}

// ==============================================
// CARGA DE ASIENTOS + PASAJEROS (join)
// ==============================================

async function loadSeats(flight) {
  el.seatStats.innerHTML = renderStatsSkeleton();
  el.seatMap.innerHTML = renderSeatMapSkeleton(flight);

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from(TABLES.flightSeats)
      .select('*, traveler:travelers(id, full_name, class)')
      .eq('flight_id', flight.id);

    if (error) throw error;

    const seats = data || [];
    renderSeatStats(flight, seats);
    renderSeatMap(flight, seats);

  } catch (error) {
    console.error('Error al cargar los asientos:', error);
    showToast(el.toast, '❌ No pudimos cargar el mapa de asientos', 'error');
    el.seatMap.innerHTML = `<p style="color:var(--color-text-muted);text-align:center;">No se pudo cargar el mapa de asientos.</p>`;
  }
}

// ==============================================
// BOARDING PASS
// ==============================================

function renderBoardingPass(flight, seatInfo) {
  const originCode = getAirportCode(flight.origin);
  const destCode = getAirportCode(flight.destination);

  const dateText = flight.departure_at ? formatShortDate(flight.departure_at) : 'Por confirmar';
  const timeText = isKnownTime(flight.departure_at) ? formatTime12h(flight.departure_at) : 'Por confirmar';

  el.boardingPass.innerHTML = `
    <div class="bp-main">
      <div class="bp-header">
        <div class="bp-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H3.5c-.4 0-.7.1-.9.4l-.6.6c-.6.6-.5 1.6.3 2l3 1.5.8 3c.4.7 1.4.9 2 .3l.6-.6c.3-.3.4-.6.4-.9V17l3-2 3.4 6.1c.3.6 1.2.8 1.7.3l.8-.7c.4-.3.5-.8.4-1.3z"></path></svg>
          Promo 2026
        </div>
        <span class="bp-airline">${escapeHTML(flight.airline || 'Aerolínea por confirmar')}</span>
      </div>

      <div class="bp-route">
        <div class="bp-city">
          <span class="bp-city-name">${escapeHTML(flight.origin || '—')}</span>
          <span class="bp-city-code">${originCode}</span>
        </div>
        <div class="bp-route-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H3.5c-.4 0-.7.1-.9.4l-.6.6c-.6.6-.5 1.6.3 2l3 1.5.8 3c.4.7 1.4.9 2 .3l.6-.6c.3-.3.4-.6.4-.9V17l3-2 3.4 6.1c.3.6 1.2.8 1.7.3l.8-.7c.4-.3.5-.8.4-1.3z"></path></svg>
        </div>
        <div class="bp-city" style="align-items:flex-end;">
          <span class="bp-city-name">${escapeHTML(flight.destination || '—')}</span>
          <span class="bp-city-code">${destCode}</span>
        </div>
      </div>

      <div class="bp-details">
        <div>
          <div class="bp-detail-label">Vuelo</div>
          <div class="bp-detail-value">${escapeHTML(flight.flight_number || 'Por confirmar')}</div>
        </div>
        <div>
          <div class="bp-detail-label">Fecha</div>
          <div class="bp-detail-value">${dateText}</div>
        </div>
        <div>
          <div class="bp-detail-label">Hora</div>
          <div class="bp-detail-value">${timeText}</div>
        </div>
      </div>
    </div>

    <div class="bp-stub">
      <span class="bp-seat-label">Asiento</span>
      <span class="bp-seat-value">${seatInfo ? escapeHTML(seatInfo.seatCode) : '—'}</span>
      ${seatInfo?.travelerName ? `<span class="bp-passenger">${escapeHTML(seatInfo.travelerName)}</span>` : ''}
    </div>
  `;
}

/**
 * Un departure_at "en punto de medianoche" (00:00) se interpreta como
 * "hora todavía no confirmada" — evita mostrar una hora inventada.
 */
function isKnownTime(isoDate) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  return !(d.getHours() === 0 && d.getMinutes() === 0);
}

// ==============================================
// ESTADÍSTICAS DE ASIENTOS
// ==============================================

function renderStatsSkeleton() {
  return `<div class="skeleton-block" style="grid-column:1/-1;height:80px;"></div>`;
}

function renderSeatStats(flight, seats) {
  const assigned = seats.filter(s => s.traveler_id).length;
  const total = state.travelersCount || assigned; // total de viajeros de la promoción, no del avión
  const pending = Math.max(total - assigned, 0);
  const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;

  el.seatStats.innerHTML = `
    <div class="seat-stat-block">
      <span class="seat-stat-value">${total}</span>
      <span class="seat-stat-label">Viajeros</span>
    </div>
    <div class="seat-stat-block">
      <span class="seat-stat-value">${assigned}</span>
      <span class="seat-stat-label">Asignados</span>
    </div>
    <div class="seat-stat-block">
      <span class="seat-stat-value">${pending}</span>
      <span class="seat-stat-label">Pendientes</span>
    </div>
    <div class="seat-progress-wrap">
      <div class="seat-progress-bar"><div class="seat-progress-fill" style="width:${pct}%"></div></div>
      <span class="seat-progress-pct">${pct}%</span>
    </div>
  `;
}

// ==============================================
// SEAT MAP
// ==============================================

function renderSeatMapSkeleton(flight) {
  return `<div class="skeleton-block" style="width:min(400px,80vw);height:${Math.min((flight.total_rows || 10) * 40, 500)}px;"></div>`;
}

function renderNoSeatConfig(flight) {
  el.seatStats.innerHTML = `
    <div class="seat-stat-block" style="grid-column:1/-1;">
      <span class="seat-stat-value" style="font-size:1rem;">Por confirmar</span>
      <span class="seat-stat-label">La aeronave y el mapa de asientos aún no están disponibles para este vuelo</span>
    </div>
  `;
  el.seatMap.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 20px;color:var(--color-text-muted);">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      <p style="text-align:center;max-width:320px;margin:0;">El mapa de asientos se mostrará aquí en cuanto se confirme la aeronave de este vuelo.</p>
    </div>
  `;
}

function renderSeatMap(flight, seats) {
  const groups = getSeatGroupsForLayout(flight.seat_layout);
  const totalRows = flight.total_rows;

  // Índice rápido: "12A" -> seat row de Supabase
  const seatIndex = new Map();
  seats.forEach(s => seatIndex.set(s.seat, s));

  const colHeaders = groups.map(group => `
    <div class="seat-col-group">
      ${group.map(letter => `<div class="seat-col-letter">${letter}</div>`).join('')}
    </div>
  `).join('<div class="seat-aisle-header"></div>');

  let rowsHTML = '';
  for (let row = 1; row <= totalRows; row++) {
    const groupsHTML = groups.map(group => `
      <div class="seat-group">
        ${group.map(letter => {
          const code = `${row}${letter}`;
          const seatData = seatIndex.get(code);
          const isAssigned = Boolean(seatData?.traveler_id);
          const classes = ['seat'];
          if (isAssigned) classes.push('assigned');
          return `<button type="button" class="${classes.join(' ')}" data-seat="${code}" aria-label="Asiento ${code}${isAssigned ? ', asignado' : ', disponible'}"></button>`;
        }).join('')}
      </div>
    `).join('<div class="seat-aisle"></div>');

    rowsHTML += `
      <div class="seat-row">
        <span class="row-number">${row}</span>
        ${groupsHTML}
      </div>
    `;
  }

  el.seatMap.innerHTML = `
    <div class="seat-map-fuselage">
      <div class="cockpit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H3.5c-.4 0-.7.1-.9.4l-.6.6c-.6.6-.5 1.6.3 2l3 1.5.8 3c.4.7 1.4.9 2 .3l.6-.6c.3-.3.4-.6.4-.9V17l3-2 3.4 6.1c.3.6 1.2.8 1.7.3l.8-.7c.4-.3.5-.8.4-1.3z"></path></svg>
        <span class="cockpit-label">Cabina</span>
      </div>
      <div class="seat-col-headers">${colHeaders}</div>
      ${rowsHTML}
    </div>
  `;

  el.seatMap.querySelectorAll('.seat').forEach(btn => {
    btn.addEventListener('click', () => openSeatModal(btn.dataset.seat, seatIndex.get(btn.dataset.seat), flight));
  });
}

// ==============================================
// MODAL DE ASIENTO
// ==============================================

function openSeatModal(seatCode, seatData, flight) {
  const traveler = seatData?.traveler;

  if (traveler) {
    el.seatModalBody.innerHTML = `
      <div class="seat-modal-seat">Asiento</div>
      <div class="seat-modal-number">${escapeHTML(seatCode)}</div>
      <div class="seat-modal-name">${escapeHTML(traveler.full_name)}</div>
      <span class="seat-modal-tag">Promo 2026 · ${escapeHTML(traveler.class || '')}</span>
    `;

    // Refleja este pasajero en el boarding pass
    renderBoardingPass(flight, { seatCode, travelerName: traveler.full_name });

  } else {
    el.seatModalBody.innerHTML = `
      <div class="seat-modal-seat">Asiento</div>
      <div class="seat-modal-number">${escapeHTML(seatCode)}</div>
      <div class="seat-modal-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle></svg>
        <p style="margin:0;">Todavía sin asignar</p>
      </div>
    `;
  }

  el.seatModalOverlay.classList.add('active');
}

function closeSeatModal() {
  el.seatModalOverlay.classList.remove('active');
}

el.seatModalClose.addEventListener('click', closeSeatModal);
el.seatModalOverlay.addEventListener('click', (e) => {
  if (e.target === el.seatModalOverlay) closeSeatModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && el.seatModalOverlay.classList.contains('active')) closeSeatModal();
});

// ==============================================
// RETRY
// ==============================================

el.retryBtn.addEventListener('click', loadFlights);

// ==============================================
// INIT
// ==============================================

loadFlights();