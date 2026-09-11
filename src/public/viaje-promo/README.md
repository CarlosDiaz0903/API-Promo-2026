# Viaje de Promoción 2026

## Objetivo

Portal digital del viaje de la Promoción 2026: **Lima → Cusco → Puno → Arequipa → Lima**. Centraliza vuelos (con mapa de asientos interactivo y boarding pass), itinerario día por día y el directorio de los 61 viajeros, todo alimentado en tiempo real desde Supabase.

Este módulo es **independiente** de `/calendario/` (que sigue funcionando exactamente igual, sin ninguna modificación) pero comparte su mismo lenguaje visual: header, tipografía, espaciado, botones, cards y animaciones provienen de los mismos archivos globales del sitio (`design-system.css`, `fonts.css`, `header.css`, `animations.css`, y los módulos `scripts/modules/header.js` y `scripts/modules/utils.js`).

```
                 ✈️ VIAJE PROMO
                       │
          ┌────────────┼────────────┐
          │            │            │
       VUELOS      ITINERARIO    VIAJEROS
          │                         │
     SEAT MAP ─────────────────────┘
          │
       SUPABASE
```

---

## Arquitectura

```
/viaje-promo/
├── README.md                  ← este archivo
├── SUPABASE_GUIDE.md           ← guía técnica completa de base de datos
│
├── index.html                  ← hub / dashboard principal
├── viaje.css
├── viaje.js
│
├── shared/                     ← capa compartida por las 4 páginas (ver nota abajo)
│   ├── config.js                  Supabase client + constantes (URL, ANON_KEY, nombres de tabla)
│   ├── utils.js                   escapeHTML, formateo de fechas, toast, contador animado, helpers de asientos
│   └── viaje-shared.css           sub-navegación, mini-hero, estados (loading/error/empty), skeletons
│
├── vuelos/
│   ├── index.html                 selector de vuelo + boarding pass + seat map
│   ├── vuelos.css
│   └── vuelos.js
│
├── itinerario/
│   ├── index.html                 timeline agrupada por día
│   ├── itinerario.css
│   └── itinerario.js
│
└── viajeros/
    ├── index.html                 directorio con búsqueda y filtro por salón
    ├── viajeros.css
    └── viajeros.js
```

### Nota sobre `shared/`

A diferencia de `/calendario/` — que se construyó en fases separadas y por eso cada página duplica su propia configuración de Supabase — este módulo se construyó completo de una sola vez. Por eso centralizamos en `shared/` lo que las 4 páginas tienen en común (conexión a Supabase, formateo de fechas, escape de HTML, toast, lógica de generación de letras de asiento). Esto evita 4 copias del mismo código y hace que actualizar una credencial o corregir un bug de formato se haga en un solo lugar. No se creó ningún build step ni bundler — cada página sigue siendo un HTML independiente que importa estos módulos con `<script type="module">` e `import`, igual que el resto del sitio.

---

## Tecnologías

- **HTML** semántico, sin frameworks.
- **CSS** puro, reutilizando 100% las variables de `design-system.css` (colores, spacing, radios, sombras, tipografía) — no se inventó una paleta nueva.
- **JavaScript** en módulos ES (`type="module"`), sin build step ni dependencias además del SDK de Supabase (cargado por CDN).
- **Supabase** (Postgres + API REST/JS) como única fuente de verdad — nunca se hardcodean datos en el HTML.
- **Netlify** para el despliegue (sitio estático, sin servidor propio).

---

## Páginas

### `/viaje-promo/` — Inicio
Hero con las fechas del viaje, la ruta visual (Lima → Cusco → Puno → Arequipa → Lima) y 5 tarjetas de resumen (días, viajeros, vuelos, salida, retorno) calculadas dinámicamente desde `flights` y `travelers`. Incluye accesos directos a Vuelos, Itinerario y Viajeros, y una fila de secciones "Próximamente" (Información, Hoteles, Galería, Recomendaciones, Información importante) que comunica que la arquitectura ya está preparada para crecer, sin construir esas páginas todavía.

### `/viaje-promo/vuelos/`
Pestañas generadas dinámicamente, una por cada fila de `flights` (hoy: Lima→Cusco y Arequipa→Lima). Al seleccionar un vuelo se muestra:
- Un **boarding pass** dinámico con ruta, aerolínea, número de vuelo, fecha y hora.
- Estadísticas de asientos (total / asignados / pendientes) con barra de progreso.
- Un **seat map** premium: cabina, encabezados de columna (A B C · D E F), pasillo central, numeración de filas y asientos clicables.
- Al tocar un asiento asignado se abre un modal con el nombre del viajero y su salón (`class`) — nunca información sensible. Al tocar uno libre, se indica "Todavía sin asignar".
- Si un vuelo todavía no tiene aeronave/configuración confirmada (como el de retorno hoy), se muestra un aviso en vez de un mapa vacío o roto — nunca se inventan filas ni configuración.

### `/viaje-promo/itinerario/`
Timeline agrupada automáticamente por fecha (`itinerary.date`), ordenada por fecha → hora → `sort_order`. Cada evento muestra ícono según su `type` (vuelo, transporte, hotel, actividad, comida, tiempo libre), hora (si existe), título, descripción y ubicación.

### `/viaje-promo/viajeros/`
Directorio de los 61 viajeros con buscador en tiempo real (nombre/apellido) y filtro por salón (Todos / 5A / 5B). Cada tarjeta muestra el asiento de ida y de retorno (o "Sin asignar" si aún no lo tiene) — deducido cruzando `travelers` con `flight_seats` y `flights`, nunca hardcodeado.

---

## Base de datos

Cuatro tablas, completamente separadas de `tasks` (calendario):

| Tabla | Qué guarda |
|---|---|
| `travelers` | Los 61 viajeros: nombre completo y salón (5A/5B). |
| `flights` | Cada vuelo: ruta, aerolínea, número, fecha/hora, aeronave, filas y layout de asientos. |
| `flight_seats` | Cada asiento físico de cada vuelo, con su estado (`available`/`assigned`) y a qué viajero pertenece (o `NULL` si nadie lo ocupa aún). |
| `itinerary` | Cada evento del itinerario (fecha, hora, tipo, descripción, ubicación), opcionalmente vinculado a un vuelo. |

Detalle completo de columnas, tipos, relaciones (foreign keys), índices, políticas RLS y el SQL exacto para crearlas (copiar y pegar en Supabase → SQL Editor) está en **[`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md)**.

### Flujo de datos

```
SUPABASE (travelers, flights, flight_seats, itinerary)
   ↓  (fetch vía @supabase/supabase-js)
JAVASCRIPT (viaje.js / vuelos.js / itinerario.js / viajeros.js)
   ↓  (cálculo de stats, agrupación, filtros — nunca en el HTML)
INTERFAZ (cards, seat map, timeline, boarding pass)
```

Nunca al revés: no hay ningún dato de viaje escrito directamente en HTML. Si algo todavía no existe en Supabase (ej. el número del vuelo de retorno), la interfaz lo comunica explícitamente ("Por confirmar") en vez de inventarlo.

---

## Configuración

1. Sigue **[`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md)** para crear el proyecto, las tablas, RLS e insertar los datos (incluye los 61 viajeros reales y las 31 asignaciones de asiento ya confirmadas).
2. Abre `/viaje-promo/shared/config.js` y reemplaza:
   ```javascript
   export const SUPABASE_URL = 'TU_SUPABASE_URL';
   export const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
   ```
   con tus credenciales reales (Project Settings → API en Supabase). Este único archivo alimenta las 4 páginas.

---

## Deploy en Netlify

El módulo es 100% estático — no necesita build command. Sigue las mismas instrucciones que `/calendario/README.md`:

1. Sube la raíz completa del sitio (no solo `/viaje-promo/`) a Netlify (Git o arrastrar la carpeta).
2. Build command: vacío. Publish directory: la raíz (`.`).
3. No reorganices las carpetas — las rutas relativas (`../styles/...`, `../shared/config.js`, etc.) dependen de la jerarquía actual.

Rutas finales esperadas:
```
https://tu-sitio.netlify.app/viaje-promo/
https://tu-sitio.netlify.app/viaje-promo/vuelos/
https://tu-sitio.netlify.app/viaje-promo/itinerario/
https://tu-sitio.netlify.app/viaje-promo/viajeros/
```

---

## Mantenimiento (resumen — detalle completo en SUPABASE_GUIDE.md)

- **¿Cómo agrego un viajero?** Un `INSERT` en `travelers`.
- **¿Cómo asigno/cambio/libero un asiento?** Un `UPDATE` en `flight_seats` (poner o quitar `traveler_id` y `status`).
- **¿Cómo agrego un vuelo o cambio su horario?** `INSERT`/`UPDATE` en `flights`; si cambian filas/layout, regenerar sus asientos con el patrón de `generate_series` que trae la guía.
- **¿Cómo agrego una actividad al itinerario?** Un `INSERT` en `itinerary`.
- **¿Qué pasa si un viajero no tiene asiento?** La interfaz lo maneja automáticamente mostrando "Sin asignar" — no requiere ningún cambio de código.

Todo esto está explicado paso a paso, con ejemplos copiables, en **[`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md)**.

---

## Qué se verificó antes de la entrega

- **Inicio**: carga desde Supabase, cálculo dinámico de días/viajeros/vuelos/fechas, navegación a las 3 sub-secciones.
- **Vuelos**: ambos vuelos (ida y retorno) se listan como tabs; el seat map de 32 filas / configuración 3-3 se genera dinámicamente desde `total_rows`/`seat_layout`; los asientos asignados y disponibles se distinguen visualmente; el modal muestra únicamente nombre y salón (nunca datos sensibles); el boarding pass se genera dinámicamente; el vuelo de retorno (sin aeronave confirmada) muestra el aviso correspondiente en vez de un mapa vacío; responsive con scroll horizontal solo en el mapa, sin desbordar la página.
- **Viajeros**: lista completa, búsqueda en tiempo real, filtro combinable por salón, asientos de ida/retorno (o "Sin asignar"), responsive.
- **Itinerario**: agrupación automática por día, orden por fecha → hora → `sort_order`, iconografía por tipo de evento, responsive.
- **Estados**: loading (skeletons), error (con botón "Reintentar", nunca un error técnico visible), empty ("Todavía no hay información disponible"), no-results ("No encontramos viajeros que coincidan") — implementados en las 4 páginas.
- **Código**: sintaxis de los 6 archivos `.js` validada (`node --check`), balance de llaves de los 5 archivos `.css` verificado, 0 IDs duplicados, 0 IDs huérfanos (cruce JS↔HTML), 0 claves de Supabase reales en el código.
- **Integración**: `/calendario/` no fue tocado ni modificado — se verificó que sus archivos permanecen intactos.

## Qué datos todavía debes proporcionar

- **30 asientos de ida restantes** (31 de 61 viajeros ya están asignados, según los datos que compartiste).
- **Vuelo de retorno completo**: número de vuelo, hora de salida, aeronave y configuración de asientos — hoy solo están confirmadas la ruta (Arequipa → Lima) y la fecha (19/09/2026).
- **Asignación de asientos del vuelo de retorno**, una vez generados sus asientos.

No se inventó ningún nombre, asiento, número de vuelo ni horario que no haya sido proporcionado explícitamente — todo lo pendiente queda representado como "Por confirmar" / "Sin asignar" en la interfaz, lista para completarse desde Supabase sin tocar código.
