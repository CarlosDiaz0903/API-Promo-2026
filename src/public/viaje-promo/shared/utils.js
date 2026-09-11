/**
 * ==============================================
 * VIAJE PROMO 2026 - Utilidades compartidas
 * ==============================================
 * Funciones reutilizadas por index.js, vuelos.js, itinerario.js y viajeros.js.
 */

// ==============================================
// SEGURIDAD - Escape de HTML (prevención XSS)
// ==============================================

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ==============================================
// FORMATEO DE FECHAS / HORAS
// ==============================================

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTHS_ES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * "2026-09-12T05:10:00" -> "12 SEP"
 */
export function formatShortDate(isoDateOrDate) {
  if (!isoDateOrDate) return '';
  const d = new Date(isoDateOrDate);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_ES_SHORT[d.getMonth()].toUpperCase()}`;
}

/**
 * "2026-09-12T05:10:00" -> "05:10 AM"
 */
export function formatTime12h(isoDateOrDate) {
  if (!isoDateOrDate) return '';
  const d = new Date(isoDateOrDate);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * "2026-09-12" -> "12 de Septiembre del 2026"
 */
export function formatLongDate(isoDateOrDate) {
  if (!isoDateOrDate) return '';
  const d = new Date(isoDateOrDate);
  return `${String(d.getDate()).padStart(2, '0')} de ${MONTHS_ES[d.getMonth()]} del ${d.getFullYear()}`;
}

/**
 * Diferencia en días completos entre dos fechas (para el stat "X días").
 */
export function daysBetween(startISO, endISO) {
  if (!startISO || !endISO) return null;
  const start = new Date(startISO);
  const end = new Date(endISO);
  const diffMs = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ==============================================
// UI - Toast de notificación
// ==============================================

export function showToast(toastEl, message, type = 'info', duration = 3000) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;
  clearTimeout(toastEl._hideTimer);
  toastEl._hideTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ==============================================
// UI - Animación de contador (stats)
// ==============================================

export function animateCounter(element, target, duration = 900) {
  if (!element) return;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = Math.round(target * eased);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = target;
    }
  };

  requestAnimationFrame(step);
}

// ==============================================
// LÓGICA DE ASIENTOS (compartida entre vuelos.js y viajeros.js)
// ==============================================

/**
 * Genera las letras de asiento según el layout ("3-3" -> ['A','B','C','D','E','F']).
 * Soporta también layouts tipo "2-4-2" (ancho-bodied) por robustez futura.
 */
export function getSeatLettersForLayout(seatLayout) {
  const groups = String(seatLayout || '3-3').split('-').map(n => parseInt(n, 10) || 0);
  const totalSeats = groups.reduce((a, b) => a + b, 0);
  const allLetters = 'ABCDEFGHJK'.split(''); // sin "I" (se confunde con "1")
  return allLetters.slice(0, totalSeats);
}

/**
 * Agrupa las letras de asiento en bloques según el layout, para renderizar
 * el pasillo central. Ej: "3-3" -> [['A','B','C'], ['D','E','F']]
 */
export function getSeatGroupsForLayout(seatLayout) {
  const groups = String(seatLayout || '3-3').split('-').map(n => parseInt(n, 10) || 0);
  const letters = getSeatLettersForLayout(seatLayout);
  const result = [];
  let cursor = 0;
  groups.forEach(size => {
    result.push(letters.slice(cursor, cursor + size));
    cursor += size;
  });
  return result;
}
