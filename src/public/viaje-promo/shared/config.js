/**
 * ==============================================
 * VIAJE PROMO 2026 - Configuración compartida de Supabase
 * ==============================================
 *
 * Este módulo es compartido por las 4 páginas de /viaje-promo/
 * (index, vuelos, itinerario, viajeros).
 *
 * A diferencia de /calendario/ (donde cada página duplica su propia
 * configuración porque se construyó en fases separadas), este módulo
 * se construye completo de una sola vez, así que centralizamos la
 * configuración en un único archivo para evitar 4 copias del mismo
 * SUPABASE_URL / SUPABASE_ANON_KEY.
 *
 * IMPORTANTE: esta base de datos NO es la misma que usa /calendario/
 * (tabla `tasks`). El viaje usa sus propias tablas: travelers, flights,
 * flight_seats, itinerary. Pueden vivir en el mismo proyecto de Supabase
 * o en uno distinto — el código no asume ninguna relación entre ambas.
 */

// ==============================================
// CREDENCIALES - reemplazar con las reales
// ==============================================

export const SUPABASE_URL = 'https://tcxznxwrltfembubakdx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjeHpueHdybHRmZW1idWJha2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTg5NDMsImV4cCI6MjEwNDczNDk0M30.sjvuEEVIkQExDXAMP9TyYNL6HvNyIsyVUqjRjlT9e4o';

// ==============================================
// NOMBRES DE TABLAS (viaje) - no confundir con `tasks`
// ==============================================

export const TABLES = {
  travelers: 'travelers',
  flights: 'flights',
  flightSeats: 'flight_seats',
  itinerary: 'itinerary'
};

// ==============================================
// CLIENTE SUPABASE (singleton)
// ==============================================

let clientInstance = null;

/**
 * Devuelve el cliente de Supabase, creándolo una sola vez.
 * Requiere que el script `@supabase/supabase-js` ya esté cargado
 * globalmente (window.supabase) antes de llamar a esta función.
 */
export function getSupabaseClient() {
  if (!clientInstance) {
    if (!window.supabase) {
      throw new Error('Supabase SDK no está cargado. Verifica el <script> de @supabase/supabase-js.');
    }
    clientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return clientInstance;
}
