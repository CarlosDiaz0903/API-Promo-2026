# Guía de Supabase — Viaje de Promoción 2026

Guía completa para configurar, desde cero, la base de datos que usa el módulo `/viaje-promo/`. Está pensada para alguien que **nunca** haya configurado este proyecto.

⚠️ **Esta base de datos es independiente de la que usa `/calendario/`** (tabla `tasks`). Puede vivir en el mismo proyecto de Supabase o en uno separado — el código de `/viaje-promo/` no asume ninguna relación con `tasks`.

---

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) e inicia sesión.
2. **New Project** → elige nombre (ej. `promo-2026-viaje`), contraseña de base de datos (guárdala) y región.
3. Espera 1-2 minutos a que aprovisione.

## 2. Obtener las credenciales

**Project Settings → API**:

- **Project URL** → tu `SUPABASE_URL`
- **Project API keys → `anon` `public`** → tu `SUPABASE_ANON_KEY`

⚠️ **Nunca** copies ni uses la **`service_role` key** en el frontend. Esa clave se salta cualquier política de seguridad (RLS) y solo debe usarse en un servidor, nunca en código que llega al navegador. La `anon key` es segura para el frontend siempre que RLS esté configurado correctamente (paso 6).

## 3. Crear las tablas

Ve a **SQL Editor** en Supabase y ejecuta todo el bloque siguiente de una sola vez.

```sql
-- ==============================================
-- FUNCIÓN AUXILIAR: actualizar updated_at automáticamente
-- ==============================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==============================================
-- TABLA: travelers
-- ==============================================

create table travelers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class text not null check (class in ('5A', '5B')),
  created_at timestamptz not null default now()
);

create index idx_travelers_class on travelers(class);
create index idx_travelers_full_name on travelers(full_name);

-- ==============================================
-- TABLA: flights
-- ==============================================

create table flights (
  id uuid primary key default gen_random_uuid(),
  name text,
  airline text,
  flight_number text,
  origin text not null,
  destination text not null,
  departure_at timestamp,
  arrival_at timestamp,
  aircraft text,
  total_rows integer,
  seat_layout text,
  created_at timestamptz not null default now()
);

-- ==============================================
-- TABLA: flight_seats
-- ==============================================

create table flight_seats (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references flights(id) on delete cascade,
  traveler_id uuid references travelers(id) on delete set null,
  seat text not null,               -- ej. "12A"
  row_number integer not null,
  seat_letter text not null,
  status text not null default 'available' check (status in ('available', 'assigned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flight_id, seat)
);

create index idx_flight_seats_flight on flight_seats(flight_id);
create index idx_flight_seats_traveler on flight_seats(traveler_id);

create trigger trg_flight_seats_updated_at
before update on flight_seats
for each row execute function set_updated_at();

-- ==============================================
-- TABLA: itinerary
-- ==============================================

create table itinerary (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time time,
  title text not null,
  description text,
  location text,
  type text not null default 'other'
    check (type in ('flight', 'transport', 'hotel', 'activity', 'meal', 'free_time', 'other')),
  sort_order integer default 0,
  flight_id uuid references flights(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_itinerary_date on itinerary(date);
```

### Relaciones (resumen)

```
flights
  │
  ├── flight_seats.flight_id  (FK, on delete cascade)
  │        │
  │        └── flight_seats.traveler_id → travelers.id  (FK, on delete set null)
  │
  └── itinerary.flight_id  (FK opcional, on delete set null)
```

Si se elimina un vuelo, sus asientos se eliminan en cascada (tiene sentido: sin vuelo no hay asientos). Si se elimina un viajero, sus asientos **no se eliminan** — simplemente quedan sin dueño (`traveler_id = NULL`, y conviene volver a poner `status = 'available'` manualmente o vía trigger si se desea automatizar).

## 4. Configurar Row Level Security (RLS)

```sql
alter table travelers enable row level security;
alter table flights enable row level security;
alter table flight_seats enable row level security;
alter table itinerary enable row level security;

create policy "Acceso público de desarrollo" on travelers
  for all using (true) with check (true);

create policy "Acceso público de desarrollo" on flights
  for all using (true) with check (true);

create policy "Acceso público de desarrollo" on flight_seats
  for all using (true) with check (true);

create policy "Acceso público de desarrollo" on itinerary
  for all using (true) with check (true);
```

⚠️ **Igual que en `/calendario/`**, esta política permisiva (`using (true)`) es adecuada para un **proyecto escolar/de pruebas** con datos no sensibles (solo nombres y salones — nunca DNI, teléfonos, ni contraseñas). **No es apropiada** si en el futuro se maneja información sensible o el sitio se vuelve público sin control. Para restringirla más adelante, se necesitaría Supabase Auth y políticas como:

```sql
-- Ejemplo de restricción a futuro (NO aplicado por defecto):
create policy "Escritura solo autenticados" on flight_seats
  for update using (auth.role() = 'authenticated');
```

## 5. Conectar el proyecto

Un único archivo centraliza la configuración para las 4 páginas del módulo:

**`/viaje-promo/shared/config.js`**:
```javascript
export const SUPABASE_URL = 'TU_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
```

Reemplaza ambos placeholders. A diferencia de `/calendario/` (que duplica la config en cada página porque se construyó en fases separadas), aquí un solo archivo basta — todas las páginas (`index.html`, `vuelos/`, `itinerario/`, `viajeros/`) lo importan.

## 6. Insertar datos — Viajeros (61 reales, ya verificados)

Estos son los **61 viajeros reales** de la promoción (31 de 5A + 30 de 5B), tal como fueron proporcionados. **No son datos de ejemplo** — insértalos directamente.

```sql
insert into travelers (full_name, class) values
  ('Christopher Adriano Alvan Tinedo', '5A'),
  ('Antonio Felipe Alvarado Correa', '5A'),
  ('Julio Cesar Benitez Olortegui', '5A'),
  ('Pierina Nicolle Bollet Larrea', '5A'),
  ('Matias Alonso Bravo Aguilar', '5A'),
  ('Matias Narciso Carbajal Ramos', '5A'),
  ('Carlos Stephano Cerna Agudelo', '5A'),
  ('Dannae Cumpa Olaya', '5A'),
  ('Carlos Antonio Diaz Benavides', '5A'),
  ('Valeria Nicole Elias Mayuri', '5A'),
  ('Mathew Andre Espino Romero', '5A'),
  ('Barbara Alexia Fernandez Mansilla', '5A'),
  ('Meylin Sun Gomez In', '5A'),
  ('Jeany Cristhina Gomez Mejia', '5A'),
  ('Katiuska Valeska Guevara Diaz', '5A'),
  ('Adrian Malpartida Sueldo', '5A'),
  ('Luciana Camila Moreno Yepez', '5A'),
  ('Amelia Yolanda Ortiz Ochoa', '5A'),
  ('Maria Alessandra Pacherres Cornejo', '5A'),
  ('Alejandro Porro Alvarado', '5A'),
  ('Ariana Mercedes Rios Ochoa', '5A'),
  ('Adriano Raul Fabrizzio Rivera Munives', '5A'),
  ('Ainara Anyeli Rocha Machado', '5A'),
  ('Alana Adonay Rojas Garcia', '5A'),
  ('Luana Alessandra Roman Bermeo', '5A'),
  ('Ayelen Daynara Romero Arroyo', '5A'),
  ('Lucia Camila Talledo Mejia', '5A'),
  ('Jhocelyn Ariana Veliz Vilchez', '5A'),
  ('Jennevith Yalico Ramirez', '5A'),
  ('Jordany Javier Yauli Barrera', '5A'),
  ('Leonardo Faustino Zuñiga Llerena', '5A'),
  ('Jimmy Gabriel Alarcon Guarda', '5B'),
  ('Aaron Jairo Ballardo Chiroque', '5B'),
  ('Gianella Roxana Beretta Curi', '5B'),
  ('Lennon Ayron Carbonell Gutierrez', '5B'),
  ('Ricardo Cuadros Rojas', '5B'),
  ('Kevin Ricardo Elias Ramirez', '5B'),
  ('Kathryn Adalis Flores Benites', '5B'),
  ('Valentina Guadalupe Inche Cabaña', '5B'),
  ('Andrea Sophia Landauro Ortiz', '5B'),
  ('Alejandro Jaime Bladimir Lopez Caycho', '5B'),
  ('Juan Diego Mar Arias', '5B'),
  ('Leonardo Adrian Marchand Lopez', '5B'),
  ('Valentino Nicolas Marino Garcia', '5B'),
  ('Stefano Andre Martinez Ayala', '5B'),
  ('Rodrigo Ismael Martinez Masias', '5B'),
  ('Luciana Jareth Mottocanchi Claros', '5B'),
  ('Camila Solange Pala Labrin', '5B'),
  ('Ariana Daniela Qqueshuayllo Lopez', '5B'),
  ('Mia Valescka Quiroz Montenegro', '5B'),
  ('Liana Hemy Rebaza Cornejo', '5B'),
  ('Estrella Angelina Reyes Sevilla', '5B'),
  ('Pedro Enrique Rivera Barrionuevo', '5B'),
  ('Fabiana Carol Robles Rojas', '5B'),
  ('Thiago Stefano Imanol Rojas Loayza', '5B'),
  ('Gabriel Enrique Saldaña Jara', '5B'),
  ('Kiara Yamile Saldaña Sanchez', '5B'),
  ('Luana Mayte Sanchez Garcia', '5B'),
  ('Mihai Simion Lozada', '5B'),
  ('Piero Francessco Vega Dolly', '5B'),
  ('Maria Estefany Zuluaga Izuiza', '5B');
```

> Nota: el registro "Gómez In, Meylin Sun" del listado original se insertó como `Meylin Sun Gomez In`; y "Vega Dolly, Piero Francessco" como `Piero Francessco Vega Dolly`, respetando el orden Apellidos-Nombres tal como fue transcrito. Si alguno de estos dos nombres está mal segmentado (por ejemplo, si "Dolly" fuera un segundo apellido y no parte del nombre), corrígelo directamente con un `UPDATE` sobre `travelers.full_name`.

## 7. Insertar datos — Vuelos

**Vuelo de ida** (datos confirmados) y **vuelo de retorno** (solo la ruta y fecha están confirmadas — el resto se deja en `NULL` intencionalmente, para no inventar información):

```sql
insert into flights (name, airline, flight_number, origin, destination, departure_at, aircraft, total_rows, seat_layout)
values (
  'Vuelo Lima → Cusco',
  'Jet Smart',
  'JA7031',
  'Lima',
  'Cusco',
  '2026-09-12 05:10:00',
  'Airbus A320',
  32,
  '3-3'
);

-- Vuelo de retorno: solo se conoce la ruta y la fecha.
-- departure_at se guarda a las 00:00 como marcador de "hora aún no confirmada"
-- (el frontend interpreta 00:00 en punto como "por confirmar", nunca como
-- una hora real, para no mostrar información inventada).
insert into flights (name, airline, flight_number, origin, destination, departure_at, aircraft, total_rows, seat_layout)
values (
  'Vuelo Arequipa → Lima',
  null,
  null,
  'Arequipa',
  'Lima',
  '2026-09-19 00:00:00',
  null,
  null,
  null
);
```

### Generar los 192 asientos del vuelo de ida (32 filas × 6 asientos)

```sql
insert into flight_seats (flight_id, seat, row_number, seat_letter, status)
select
  (select id from flights where flight_number = 'JA7031'),
  row_num || letter,
  row_num,
  letter,
  'available'
from generate_series(1, 32) as row_num
cross join unnest(array['A','B','C','D','E','F']) as letter;
```

> El vuelo de retorno **no** tiene asientos generados todavía porque no se conoce la aeronave (`total_rows`/`seat_layout` son `NULL`). El frontend detecta esto automáticamente y muestra "El mapa de asientos se mostrará aquí en cuanto se confirme la aeronave" en vez de un mapa vacío o roto. En cuanto completes esos dos campos con un `UPDATE`, ejecuta un `INSERT` como el de arriba (cambiando el `flight_number`) para generar sus asientos.

## 8. Insertar datos — Asignación de asientos (vuelo de ida)

Estas son las **31 asignaciones confirmadas** hasta el momento (de 61 viajeros). El resto de asientos queda `available` hasta que se reciba más información — **no se inventó ningún asiento adicional**.

```sql
update flight_seats set traveler_id = (select id from travelers where full_name = 'Liana Hemy Rebaza Cornejo' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 22 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Katiuska Valeska Guevara Diaz' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 20 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Stefano Andre Martinez Ayala' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 15 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Kevin Ricardo Elias Ramirez' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 26 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Valeria Nicole Elias Mayuri' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 19 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Estrella Angelina Reyes Sevilla' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 9 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Kathryn Adalis Flores Benites' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 16 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Leonardo Faustino Zuñiga Llerena' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 16 and seat_letter = 'C';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Rodrigo Ismael Martinez Masias' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 29 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Luciana Jareth Mottocanchi Claros' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 21 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Valentina Guadalupe Inche Cabaña' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 27 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Fabiana Carol Robles Rojas' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 17 and seat_letter = 'F';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Luana Mayte Sanchez Garcia' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 22 and seat_letter = 'D';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Jennevith Yalico Ramirez' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 18 and seat_letter = 'F';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Julio Cesar Benitez Olortegui' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 32 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Adriano Raul Fabrizzio Rivera Munives' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 32 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Juan Diego Mar Arias' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 28 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Kiara Yamile Saldaña Sanchez' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 6 and seat_letter = 'C';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Andrea Sophia Landauro Ortiz' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 15 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Gianella Roxana Beretta Curi' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 6 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Jhocelyn Ariana Veliz Vilchez' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 26 and seat_letter = 'F';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Jordany Javier Yauli Barrera' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 27 and seat_letter = 'A';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Pedro Enrique Rivera Barrionuevo' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 8 and seat_letter = 'A';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Ricardo Cuadros Rojas' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 8 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Aaron Jairo Ballardo Chiroque' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 10 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Barbara Alexia Fernandez Mansilla' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 7 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Ainara Anyeli Rocha Machado' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 15 and seat_letter = 'F';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Maria Alessandra Pacherres Cornejo' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 19 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Dannae Cumpa Olaya' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 30 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Adrian Malpartida Sueldo' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 16 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Mathew Andre Espino Romero' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 26 and seat_letter = 'B';
pdate flight_seats set traveler_id = (select id from travelers where full_name = 'Christopher Adriano Alvan Tinedo' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 24 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Matias Narciso Carbajal Ramos' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 31 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Alejandro Jaime Bladimir Lopez Caycho' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 29 and seat_letter = 'B';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Piero Francessco Vega Dolly' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 21 and seat_letter = 'A';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Carlos Antonio Diaz Benavides' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 16 and seat_letter = 'A';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Matias Alonso Bravo Aguilar' limit 1), status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 18 and seat_letter = 'E';
update flight_seats set traveler_id = (select id from travelers where full_name = 'Ariana Mercedes Rios Ochoa' limit 1),status = 'assigned' where flight_id = (select id from flights where flight_number = 'JA7031') and row_number = 10 and seat_letter = 'B';
```

Después de correr esto: **31 de 61 viajeros** tendrán asiento asignado en el vuelo de ida, y el sistema calculará automáticamente `31 asignados / 161 pendientes` (192 asientos totales − 31 = 161) y el `%` de la barra de progreso — nada de esto está hardcodeado en el frontend.

## 9. Insertar datos — Itinerario

Estas entradas se derivan directamente del programa de viaje "Perú Sur Inka 3\* VIP Optimus" (8 días: Cusco → Valle Sagrado → Machu Picchu → Valle Sur → exploración → Puno → Arequipa → retorno), condensadas a sus momentos clave por día. Puedes agregar más detalle con `INSERT` adicionales en cualquier momento.

```sql
-- Vincula el itinerario a los IDs de los vuelos ya creados
with vuelo_ida as (select id from flights where flight_number = 'JA7031'),
     vuelo_retorno as (select id from flights where origin = 'Arequipa' and destination = 'Lima')

insert into itinerary (date, time, title, description, location, type, sort_order, flight_id)
values
  ('2026-09-12', '05:10', 'Vuelo Lima → Cusco', 'Salida del vuelo JA7031 por Jet Smart.', 'Aeropuerto de Lima', 'flight', 1, (select id from vuelo_ida)),
  ('2026-09-12', '10:30', 'Distribución de habitaciones', 'Hotel 3 estrellas en el centro de la ciudad.', 'Cusco', 'hotel', 2, null),
  ('2026-09-12', '12:00', 'Almuerzo de bienvenida', 'Restaurante turístico VIP.', 'Cusco', 'meal', 3, null),
  ('2026-09-12', '13:20', 'Tour combinado', 'Sacsayhuamán, Qenqo, Puka Pucara y Tambomachay.', 'Cusco', 'activity', 4, null),
  ('2026-09-12', '18:30', 'Cena de bienvenida', 'Pizzería turística, incluye bebida gaseosa.', 'Cusco', 'meal', 5, null),

  ('2026-09-13', '08:00', 'Tour Valle Sagrado', 'Pisaq, Calca, Urubamba, Ollantaytambo y Chinchero.', 'Valle Sagrado', 'activity', 1, null),
  ('2026-09-13', '19:00', 'Retorno a Cusco', 'El bus deja a la delegación en el restaurante para la cena.', 'Cusco', 'transport', 2, null),

  ('2026-09-14', '02:30', 'Salida hacia Ollantaytambo', 'Traslado en bus hacia la estación de tren.', 'Ollantaytambo', 'transport', 1, null),
  ('2026-09-14', null, 'Tren a Machu Picchu Pueblo', 'Servicio turístico Perú Rail Expedition.', 'Machu Picchu Pueblo', 'transport', 2, null),
  ('2026-09-14', null, 'Visita guiada a la Ciudadela Inka', 'Machu Picchu.', 'Machu Picchu', 'activity', 3, null),

  ('2026-09-15', null, 'Retorno a Cusco', 'Bajada a Aguas Calientes, tren a Ollantaytambo y bus a Cusco.', 'Cusco', 'transport', 1, null),
  ('2026-09-15', null, 'Tour Valle Sur', 'Tipón, Piquillacta, San Sebastián, San Jerónimo y Saylla.', 'Valle Sur', 'activity', 2, null),

  ('2026-09-16', null, 'Exploración en Cusco', 'Barrio de San Blas, Piedra de los 12 ángulos, Plaza de Armas, Qoricancha y Convento Santo Domingo.', 'Cusco', 'activity', 1, null),
  ('2026-09-16', null, 'Tarde libre', 'Tiempo libre para compras y relax.', 'Cusco', 'free_time', 2, null),
  ('2026-09-16', null, 'Salida hacia Puno', 'Bus turístico servicio sofá cama 160°.', 'Cusco → Puno', 'transport', 3, null),

  ('2026-09-17', null, 'Llegada a Puno', 'Distribución de habitaciones para aseo (sin pernoctar).', 'Puno', 'hotel', 1, null),
  ('2026-09-17', null, 'Tour Islas de los Uros', 'Lago Titicaca.', 'Puno', 'activity', 2, null),
  ('2026-09-17', null, 'Tour Chullpas de Sillustani', 'Lago Umayo.', 'Puno', 'activity', 3, null),
  ('2026-09-17', null, 'Salida hacia Arequipa', 'Bus turístico servicio sofá cama 160°.', 'Puno → Arequipa', 'transport', 4, null),

  ('2026-09-18', null, 'Llegada a Arequipa', 'Distribución de habitaciones en hotel 3 estrellas.', 'Arequipa', 'hotel', 1, null),
  ('2026-09-18', null, 'Centro histórico de Arequipa', 'Convento de Santa Catalina, Plaza de Armas y Basílica Catedral.', 'Arequipa', 'activity', 2, null),
  ('2026-09-18', null, 'Cena en el centro', 'Restaurante ubicado en el centro histórico.', 'Arequipa', 'meal', 3, null),

  ('2026-09-19', null, 'Tour Campiña Arequipeña', 'Mirador de Carmen Alto, Yanawara y Sachaca.', 'Arequipa', 'activity', 1, null),
  ('2026-09-19', null, 'Almuerzo de despedida', 'Brindis de despedida de la promoción.', 'Arequipa', 'meal', 2, null),
  ('2026-09-19', null, 'Vuelo Arequipa → Lima', 'Fecha confirmada; número de vuelo y hora por confirmar.', 'Aeropuerto de Arequipa', 'flight', 3, (select id from vuelo_retorno));
```

## 10. Verificar que todo funciona

En **Table Editor**:
1. `travelers` debe tener 61 filas.
2. `flights` debe tener 2 filas (Lima→Cusco y Arequipa→Lima).
3. `flight_seats` debe tener 192 filas, 31 con `status = 'assigned'`.
4. `itinerary` debe tener 23 filas (una por cada evento listado arriba).

Luego abre `/viaje-promo/` en el navegador (con las credenciales ya puestas en `shared/config.js`) y confirma que:
- El **Inicio** muestra 61 viajeros, 2 vuelos, 7 días.
- **Vuelos** muestra el tab de ida con el seat map de 32 filas y ~16% asignado (31/192); el tab de retorno muestra el mensaje "aeronave por confirmar".
- **Viajeros** lista a los 61, filtrando por 5A/5B y buscando por nombre.
- **Itinerario** agrupa las 23 entradas en 8 días.

---

## 11. Mantenimiento — Preguntas frecuentes

**¿Cómo agrego un viajero?**
```sql
insert into travelers (full_name, class) values ('Nombre Apellido', '5A');
```

**¿Cómo asigno un asiento?**
```sql
update flight_seats
set traveler_id = (select id from travelers where full_name = 'Nombre Apellido' limit 1),
    status = 'assigned'
where flight_id = (select id from flights where flight_number = 'JA7031')
  and seat = '12A';
```

**¿Cómo cambio un asiento?** Primero libera el anterior, luego asigna el nuevo:
```sql
update flight_seats set traveler_id = null, status = 'available'
where flight_id = (select id from flights where flight_number = 'JA7031') and seat = '12A';

update flight_seats set traveler_id = (select id from travelers where full_name = 'Nombre Apellido'), status = 'assigned'
where flight_id = (select id from flights where flight_number = 'JA7031') and seat = '14C';
```

**¿Cómo hago que un asiento vuelva a estar disponible?**
```sql
update flight_seats set traveler_id = null, status = 'available'
where flight_id = '...' and seat = '12A';
```
El mapa lo reflejará automáticamente la próxima vez que alguien cargue la página — no requiere ningún cambio de código.

**¿Cómo agrego el vuelo de retorno completo (número, hora, aeronave)?**
```sql
update flights
set flight_number = 'XX1234', aircraft = 'Airbus A320', total_rows = 32, seat_layout = '3-3',
    departure_at = '2026-09-19 14:30:00'
where origin = 'Arequipa' and destination = 'Lima';

-- Luego genera sus 192 asientos (mismo patrón que el paso 7):
insert into flight_seats (flight_id, seat, row_number, seat_letter, status)
select (select id from flights where flight_number = 'XX1234'), row_num || letter, row_num, letter, 'available'
from generate_series(1, 32) as row_num
cross join unnest(array['A','B','C','D','E','F']) as letter;
```

**¿Cómo cambio el horario de un vuelo?**
```sql
update flights set departure_at = '2026-09-12 06:00:00' where flight_number = 'JA7031';
```

**¿Cómo agrego una actividad al itinerario?**
```sql
insert into itinerary (date, time, title, description, location, type, sort_order)
values ('2026-09-13', '20:00', 'Noche de karaoke', 'Actividad libre organizada por los tutores.', 'Cusco', 'activity', 10);
```

**¿Qué ocurre si un viajero todavía no tiene asiento?** Nada se rompe: la card de `/viajeros/` muestra "Sin asignar" en ese tramo, y las estadísticas de `/vuelos/` lo cuentan automáticamente dentro de "Pendientes". No hace falta ningún dato de relleno.

---

## 12. Datos de prueba vs. datos reales

Los 61 viajeros del paso 6 **no son de ejemplo — son la lista real** de 5TO A y 5TO B tal como fue proporcionada (con la corrección de apellido indicada: "Diaz Benavides", no "Benavidez"). Las 31 asignaciones de asiento del paso 8 también son reales, confirmadas hasta el momento de escribir esta guía. Todo lo demás que falte (30 asientos de ida restantes, todo el vuelo de retorno) debe completarse con `UPDATE`/`INSERT` a medida que se reciba la información — el sistema ya está preparado para reflejarlo automáticamente, sin tocar ni una línea de código.
