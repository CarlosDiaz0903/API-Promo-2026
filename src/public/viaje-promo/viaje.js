/**
 * ==============================================
 * VIAJE PROMO 2026 - Página principal (Inicio)
 * Stats calculados 100% desde Supabase (flights + travelers)
 * ==============================================
 */

import { getSupabaseClient, TABLES } from './shared/config.js';
import { animateCounter, formatShortDate, daysBetween, showToast } from './shared/utils.js';

const el = {
  statsContainer: document.getElementById('statsContainer'),
  statDays: document.getElementById('statDays'),
  statTravelers: document.getElementById('statTravelers'),
  statFlights: document.getElementById('statFlights'),
  statDeparture: document.getElementById('statDeparture'),
  statReturn: document.getElementById('statReturn'),
  toast: document.getElementById('toast')
};

async function loadSummary() {
  el.statsContainer?.classList.add('stats-loading');
  const supabase = getSupabaseClient();

  try {
    const [travelersRes, flightsRes] = await Promise.all([
      supabase.from(TABLES.travelers).select('id', { count: 'exact', head: true }),
      supabase.from(TABLES.flights).select('*').order('departure_at', { ascending: true })
    ]);

    if (travelersRes.error) throw travelersRes.error;
    if (flightsRes.error) throw flightsRes.error;

    const travelersCount = travelersRes.count || 0;
    const flights = flightsRes.data || [];

    renderStats(travelersCount, flights);

  } catch (error) {
    console.error('Error al cargar el resumen del viaje:', error);
    showToast(el.toast, '❌ No pudimos cargar el resumen del viaje', 'error');
  } finally {
    el.statsContainer?.classList.remove('stats-loading');
    document.dispatchEvent(new CustomEvent('viaje:ready'));
  }
}

function renderStats(travelersCount, flights) {
  const withDates = flights.filter(f => f.departure_at);
  const first = withDates[0];
  const last = withDates[withDates.length - 1];

  const days = first && last ? daysBetween(first.departure_at, last.departure_at) : null;

  animateCounter(el.statDays, days ?? 0);
  animateCounter(el.statTravelers, travelersCount);
  animateCounter(el.statFlights, flights.length);

  el.statDeparture.textContent = first ? formatShortDate(first.departure_at) : '—';
  el.statReturn.textContent = last ? formatShortDate(last.departure_at) : '—';
}

loadSummary();
