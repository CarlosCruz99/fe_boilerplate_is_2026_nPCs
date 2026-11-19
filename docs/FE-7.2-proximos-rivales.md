# FE-7.2 · NPCS-94

Sección debajo de la tabla pública de `/posiciones`, visible solo con sesión autenticada, rol JUGADOR y `capitaneaEquipoId` no nulo de AuthContext. Sin capitanía no monta contenido ni solicita datos privados. Los cambios de cuenta/equipo desmontan la sección anterior y descartan respuestas atrasadas.

## Contrato y autorización

La acción `consultarProximosRivales` verifica sesión y capitanía en el servidor; deriva el equipo de la sesión, sin aceptar IDs del navegador. Consume `GET /equipos/{capitaneaEquipoId}/proximos-partidos` con Bearer y `cache: no-store`. BE-7.2 comprueba que el equipo esté inscrito en la temporada actual y que la cuenta sea su capitán.

Respuesta: `{ equipoId, proximos: [{ partidoId, fechaHora, rival: { equipoId, nombre, lugar, puntos } }] }`. Lugar y puntos pueden ser null y se muestran como “Sin posición” y “Sin registro”; el valor 0 se conserva. Se valida que el equipo de respuesta coincida con la sesión.

Se presenta fecha y hora en America/El_Salvador, rival, lugar y puntos, en fecha ascendente y partidoId para desempate. No se recalculan clasificaciones. La sección ofrece actualización y reintento independiente de la tabla. 403 oculta la sección; 401 ofrece iniciar sesión; vacío muestra “No tienes partidos pendientes.”. Red y 500 muestran “No pudimos cargar tus próximos partidos. Intenta de nuevo.” sin afectar la tabla.

## Validación conjunta de H7

- `npm test -- --reporter=dot`: 194 pruebas pasando en 29 archivos.
- `npm run lint`: sin errores.
- `npx next build --webpack`: compilación de producción y TypeScript correctos.
- FE-7.1: orden y valores oficiales, resaltado y resumen, acceso sin equipo, cambios de sesión, carga, vacío, error, reintento, consulta manual y cada 30 segundos, limpieza al desmontar.
- FE-7.2: capitán/no capitán, orden de fechas, ceros y valores nulos, vacío, 403, fallos independientes de la tabla y descarte al perder capitanía.
- Acciones: acceso público sin token para tabla, equipo derivado de sesión para rivales, ausencia de consultas privadas sin capitanía, token, no-store, 401/403/500 y rechazo de respuesta de otro equipo.
- Chrome headless con backend local de prueba ajustado a BE-7.1/BE-7.2: tabla anónima, resaltado y resumen de capitán, rivales con lugar/puntos, jugador sin rivales; 360 y 1440 px sin desbordamiento de página ni errores o advertencias de consola. La tabla usa desplazamiento horizontal interno en móvil.
- Capturas y resultados en `docs/evidence/h7/`. Son fixtures; queda pendiente QA con datos oficiales y revisión/aprobación del PR por un compañero.

Se preparó una rama nueva de H7 sobre el mismo commit de origin/develop (H6 ya integrado). Cada tarea tiene su commit independiente. El cambio local previo de `.env.example` no se incluye.
