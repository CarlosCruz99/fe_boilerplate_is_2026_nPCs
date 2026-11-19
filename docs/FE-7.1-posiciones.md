# FE-7.1 · NPCS-93

Ruta pública `/posiciones`, con acceso desde la navegación con y sin sesión. Consume `GET /posiciones` sin autenticación y con `cache: no-store`. Contrato: `{ temporadaId, posiciones: [{ lugar, equipoId, equipo, pj, pg, pe, pp, gf, gc, dg, puntos }] }`.

La pantalla conserva valores y orden del servicio, sin calcular clasificación ni ofrecer edición. AuthContext aporta `equipoActualId` para el resaltado y resumen. Sin equipo o sin fila correspondiente no hay resaltado. La sesión no bloquea la consulta pública.

Actualización cada 30 segundos y mediante Actualizar; evita peticiones simultáneas, descarta respuestas tras desmontarse y limpia el intervalo al salir. Carga, vacío y error con reintento tienen estados diferentes. La tabla permite desplazamiento horizontal local en móvil y nombres completos de columnas mediante `abbr`.

Pruebas: valores oficiales, orden, resumen, cambio de sesión, acceso anónimo, vacío, error, reintento, actualización automática/manual y desmontaje. Validación conjunta y capturas de H7 se registran en `docs/FE-7.2-proximos-rivales.md`.
