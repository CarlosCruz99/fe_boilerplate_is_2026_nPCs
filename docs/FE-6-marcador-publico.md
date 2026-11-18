# H6 · FE-6.1 / FE-6.2

Tareas: NPCS-87 y NPCS-88. Ambas se implementan en la rama `feature/H6-marcador-publico-frontend`.

## Lista pública · /partidos

`ListaPartidos` consulta `GET /partidos?page=1&pageSize=20`, con `estado` y `equipoId` opcionales. Conserva el orden descendente del servicio; muestra fecha y hora en America/El_Salvador, equipos, estado y resultado. Los programados muestran fecha/hora y VS, sin goles ni enlace al detalle; su botón presenta “Este partido aún no comienza.”.

Los filtros se aplican al cambiar, pueden combinarse y vuelven a página 1. Limpiar filtros restaura Todos y todos los equipos. Incluye paginación, carga, vacío y error con reintento. `useConsulta` descarta respuestas de filtros anteriores.

El backend no ofrece catálogo público de equipos: `GET /equipos` es exclusivo del organizador. Por eso `equiposPartidosPublicos` recorre el listado público sin filtros, en páginas de 50, y deduplica equipos por ID. Las opciones incluyen equipos de todas las páginas, independientemente del filtro activo. Los equipos sin partidos visibles no aparecen. Un catálogo público dedicado sería más eficiente cuando crezca el historial y permitiría incluir equipos sin encuentros.

## Detalle público · /partidos/:id

`DetalleMarcador` consulta `GET /partidos/{id}/marcador` y presenta:

- `local` y `visitante`: equipoId, nombre, goles, faltas y jugadores `{id, nombre}`.
- `goleadores`: jugadorId, nombre, equipoId y goles.
- `estado` y `duracionMinutos`.

El marcador y la duración se muestran tal como los entrega BE-6.2: los goles no se derivan de la lista de goleadores. Un resultado EN_CURSO habilita consultas cada 10 segundos. Se evita solapar solicitudes y se elimina el intervalo al salir o recibir FINALIZADO. Actualizar consulta de nuevo, incluso en finalizados.

404 y 409 borran cualquier marcador anterior y muestran los mensajes definidos. Los fallos de red o servidor conservan el último marcador, indican el fallo y mantienen el polling si el último estado era EN_CURSO. Si falla la primera consulta se puede reintentar con Actualizar.

## Acceso y sesión

Ambas rutas son públicas y no usan RutaProtegida. El menú ofrece Marcadores con y sin sesión. Las acciones leen el token opcional de la cookie HttpOnly, sin exigir login, y consultan con `cache: no-store`. El backend decide la visibilidad de jornadas BORRADOR y trata los tokens inválidos como anónimos. Ninguna pantalla ofrece edición. Los filtros, páginas y resultados viven en estado local; AuthContext conserva el estado global de sesión.

Se ajustaron también las dimensiones intrínsecas del logo en AppShell para eliminar la advertencia de proporción detectada al revisar el acceso público; el tamaño visual sigue controlado por CSS.

## Verificación

- `npm test -- --reporter=dot`: 175 pruebas pasando en 25 archivos.
- `npm run lint`: sin errores.
- `npx next build --webpack`: build de producción y TypeScript correctos.
- Componentes: filtros combinados, reinicio de página, programados, carga, vacío, error, respuestas antiguas, datos oficiales, polling a 10 segundos, solicitudes sin solapamiento, finalización, desmontaje, Actualizar, 404/409 y conservación ante fallo de red.
- Acciones: acceso anónimo, token opcional, endpoints, filtros, páginas de equipos, errores y validación de IDs.
- Chrome headless con backend local de prueba ajustado a los DTO: acceso sin sesión, filtros, aviso programado y navegación al detalle a 360 y 1440 px; sin desbordamiento horizontal ni errores o advertencias de consola. Evidencia en `docs/evidence/h6/`.
- Esta verificación visual utiliza fixtures; queda pendiente QA de punta a punta con datos oficiales y revisión/aprobación por un compañero.

El cambio local previo de `.env.example` queda fuera del commit.
