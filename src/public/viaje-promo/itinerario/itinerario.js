/**
 * ==============================================
 * VIAJE PROMO 2026 - Itinerario
 * Timeline agrupada por día, 100% desde Supabase (tabla itinerary)
 * ==============================================
 */

import { getSupabaseClient, TABLES } from '../shared/config.js';
import { escapeHTML, MONTHS_ES, DAYS_ES } from '../shared/utils.js';

const el = {
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  emptyState: document.getElementById('emptyState'),
  retryBtn: document.getElementById('retryBtn'),
  timelineSection: document.getElementById('timelineSection'),
  timeline: document.getElementById('timeline'),
  rangeTitle: document.getElementById('itineraryRangeTitle')
};

const TYPE_ICONS = {
  flight: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.8c-.5.5-.4 1.4.3 1.7L9 12l-2 3H3.5c-.4 0-.7.1-.9.4l-.6.6c-.6.6-.5 1.6.3 2l3 1.5.8 3c.4.7 1.4.9 2 .3l.6-.6c.3-.3.4-.6.4-.9V17l3-2 3.4 6.1c.3.6 1.2.8 1.7.3l.8-.7c.4-.3.5-.8.4-1.3z"></path>',
  transport: '<rect x="1" y="6" width="18" height="10" rx="2"></rect><circle cx="6" cy="18" r="2"></circle><circle cx="14" cy="18" r="2"></circle><path d="M19 9h3l1 4h-4z"></path>',
  hotel: '<path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path>',
  activity: '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
  meal: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"></path>',
  free_time: '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
  other: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
};

function getTypeIcon(type) {
  return TYPE_ICONS[type] || TYPE_ICONS.other;
}

async function loadItinerary() {
  showState('loading');
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from(TABLES.itinerary)
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: true })
      .order('sort_order', { ascending: true, nullsFirst: true });

    if (error) throw error;

    const items = data || [];

    // Ayuda de diagnóstico (no visible para el usuario, solo en consola):
    // si esto imprime 0, el problema está en Supabase (tabla vacía o RLS),
    // no en este archivo — ver SUPABASE_GUIDE.md sección 10.
    console.log(`[itinerario] Filas recibidas desde Supabase: ${items.length}`);

    if (items.length === 0) {
      showState('empty');
      return;
    }

    renderRangeTitle(items);
    renderTimeline(items);
    showState('content');

  } catch (error) {
    console.error('Error al cargar el itinerario:', error);
    showState('error');
  } finally {
    document.dispatchEvent(new CustomEvent('viaje:ready'));
  }
}

function showState(view) {
  el.loadingState.style.display = view === 'loading' ? 'flex' : 'none';
  el.errorState.style.display = view === 'error' ? 'flex' : 'none';
  el.emptyState.style.display = view === 'empty' ? 'flex' : 'none';
  el.timelineSection.style.display = view === 'content' ? 'block' : 'none';
}

function renderRangeTitle(items) {
  const dates = items.map(i => i.date).filter(Boolean).sort();
  if (dates.length === 0) return;

  // OJO: "2026-09-12" interpretado con `new Date(...)` a secas se toma como
  // medianoche UTC, y en husos horarios negativos (ej. Perú, UTC-5) retrocede
  // al día anterior al convertirse a hora local. Forzamos T00:00:00 local
  // (mismo truco que ya usa renderTimeline) para evitar ese corrimiento.
  const first = new Date(`${dates[0]}T00:00:00`);
  const last = new Date(`${dates[dates.length - 1]}T00:00:00`);

  if (first.getTime() === last.getTime()) {
    el.rangeTitle.textContent = `${first.getDate()} DE ${MONTHS_ES[first.getMonth()].toUpperCase()}`;
  } else {
    el.rangeTitle.textContent = `${first.getDate()} — ${last.getDate()} DE ${MONTHS_ES[last.getMonth()].toUpperCase()}`;
  }
}

function renderTimeline(items) {
  const byDate = new Map();
  items.forEach(item => {
    const key = item.date || 'sin-fecha';
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(item);
  });

  const sortedDates = Array.from(byDate.keys()).sort();

  el.timeline.innerHTML = sortedDates.map((dateKey, index) => {
    const dayItems = byDate.get(dateKey);
    const dateObj = dateKey !== 'sin-fecha' ? new Date(`${dateKey}T00:00:00`) : null;

    const dayTitle = dateObj
      ? `${String(dateObj.getDate()).padStart(2, '0')} de ${MONTHS_ES[dateObj.getMonth()]}`
      : 'Fecha por confirmar';

    const daySubtitle = dateObj ? DAYS_ES[dateObj.getDay()] : '';

    const eventsHTML = dayItems.map(item => createEventHTML(item)).join('');

    return `
      <div class="day-group">
        <div class="day-header">
          <div class="day-number-badge">${index + 1}</div>
          <div class="day-title-group">
            <span class="day-title">${escapeHTML(dayTitle)}</span>
            <span class="day-subtitle">${escapeHTML(daySubtitle)}</span>
          </div>
        </div>
        <div class="day-events">
          ${eventsHTML}
        </div>
      </div>
    `;
  }).join('');
}

function createEventHTML(item) {
  const type = item.type || 'other';
  const timeText = item.time ? item.time.slice(0, 5) : '';

  return `
    <div class="timeline-event type-${escapeHTML(type)}">
      <div class="event-marker">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getTypeIcon(type)}</svg>
      </div>
      <div class="event-body">
        ${timeText ? `<span class="event-time">${escapeHTML(timeText)}</span>` : ''}
        <span class="event-title">${escapeHTML(item.title || '')}</span>
        ${item.description ? `<span class="event-description">${escapeHTML(item.description)}</span>` : ''}
        ${item.location ? `
          <span class="event-location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${escapeHTML(item.location)}
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

el.retryBtn.addEventListener('click', loadItinerary);

loadItinerary();