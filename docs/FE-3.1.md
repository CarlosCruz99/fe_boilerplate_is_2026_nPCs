# FE-3.1 · Calendario del organizador

Jira: [NPCS-119](https://uca-team-zec8wzmz.atlassian.net/browse/NPCS-119).

Implementación funcional completa de la pantalla `/organizador/calendario`, sobre la rama `feature/H3-calendario-organizador-y-programacion-partidos`. Solo ORGANIZADOR accede a la pantalla y a todas sus acciones de servidor. La publicación usa BE-16.1 de `develop` del backend (`0fc1b8a`) y el servicio central H20 para los avisos.

## Comportamiento

- Consulta temporadas, equipos INSCRITO, canchas activas y árbitros reales. Las respuestas protegidas usan `no-store` y los Bearer se obtienen desde cookies HttpOnly, sin devolver tokens al navegador.
- Genera con 12 inscritos, selección múltiple de canchas y árbitros, fecha futura en El Salvador, hora y confirmación. Presenta la respuesta real de 66 partidos en 11 jornadas y vuelve a leer el calendario guardado.
- Muestra las jornadas en acordeón con su ID real, número, estado BORRADOR/PUBLICADA, fecha de publicación y partidos con equipos, cancha, árbitro, inicio, fin y estado. También conserva los cancelados para el organizador.
- Agenda con equipos distintos y árbitro obligatorio. El visitante excluye al local y se usan únicamente equipos inscritos. Fin se muestra a +90 minutos, pero nunca se envía a la API.
- Reprograma cancha, árbitro e inicio; conserva equipos y jornada. Cancela con confirmación enviando exclusivamente `{estado:"CANCELADO"}`. Los partidos En curso, Finalizados o Cancelados no ofrecen acciones; si su estado cambia en otra sesión, se conserva el mensaje de error del backend.
- Publicar solo se ofrece en BORRADOR y se deshabilita si no hay partidos activos. Confirma «Los capitanes recibirán un aviso. ¿Publicar la jornada {n}?». El POST usa el ID de la jornada y no recibe cuerpo.
- Con 200 de publicación muestra «Jornada publicada.» y recarga el estado. Con 409 muestra «La jornada ya está publicada.» y vuelve a consultar sin repetir avisos. Los errores conservan el diálogo para reintentar.
- Después de toda mutación se consultan nuevamente los datos. Una recarga del navegador recupera jornadas y partidos desde la base; ya no depende de una lista de la visita ni de fixtures.
- Las solicitudes bloquean acciones y selector de temporada. Los mensajes específicos de 409/422 se conservan, incluidos los errores estructurados de inscritos o árbitros insuficientes.
- Los campos de fecha/hora representan El Salvador y los envíos manuales incluyen `-06:00`. Los ISO del servidor se muestran con `America/El_Salvador`.

## Lectura añadida al backend

BE-16.1 publica y BE-4.1 consulta partidos, pero sus respuestas no incluían los ID y estados de todas las jornadas. Para completar la pantalla se añadió `GET /api/v1/temporadas/{id}/calendario`, exclusivo para ORGANIZADOR, con DTO y Swagger. Devuelve las jornadas existentes, incluso vacías, con ID, número, estado, publicadaEn y partidos completos. No altera la publicación, los permisos de H4 ni el esquema de base de datos.

Archivos del backend: controlador, servicio y DTO `calendario-organizador`, registro en `CalendarioModule`, dos pruebas unitarias y tres pruebas e2e. Contrato documentado en `docs/calendario-organizador.md` del backend. Esta consulta necesita entregarse también al repositorio backend antes de desplegar el frontend.

## Compatibilidad con H4

Los archivos de H3 se llaman `app/actions/calendario-organizador.ts` y `types/calendario-organizador.ts`. H4 conserva `app/actions/calendario.ts` y `types/calendario.ts`. Ambos roles mantienen sus implementaciones y autorizaciones.

Se verificó una copia integrada con H4 en el commit `6adcefc`: pruebas, TypeScript, lint y build. En H4 se encontró un error de lint previo por `Date.now()` durante el render. La corrección preparada captura el tiempo en un inicializador de estado y lo actualiza al pulsar Actualizar, sin cambiar los endpoints ni permisos. La corrección ya está aplicada en la rama de H3 después de incorporar H4.

## Verificación

Frontend: **85 pruebas pasando**, TypeScript y lint sin errores. Backend: **170 pruebas unitarias pasando**, build correcto y **3 pruebas e2e nuevas** contra una base temporal. Lint de backend finaliza con una advertencia previa de comparación en `test/seed/h1-dataset.spec.ts`. El `tsc --noEmit` global de backend también detecta un error previo de tipado JSON en `prisma/seed-avisos.ts`; el build de la aplicación, que excluye seeds, pasa. No se modificaron esos archivos ajenos al alcance.

Build de frontend: `npm run build -- --webpack`. En la copia de integración fue necesario permitir la descarga de las fuentes que ya utiliza el proyecto. No se cambió el script predeterminado.

Se probó en Chrome con **Next + Nest + PostgreSQL reales**, en una base independiente con todas las migraciones:

1. Catálogos y generación: 66 partidos en 11 jornadas comprobados en PostgreSQL.
2. Lectura completa y persistencia tras recargar el navegador.
3. Publicación: estado PUBLICADA persistido, 12 avisos reales con 12 destinatarios, sin duplicados ante un 409 desde otra sesión.
4. Compatibilidad H4: antes de publicar el capitán no ve el partido; después de publicar lo ve en Mi calendario y puede abrir su detalle.
5. Lectura de organizador protegida con 401 sin sesión y 403 para capitán; la suite e2e cubre también árbitro, IDs inválidos, inexistentes, borradores, jornadas vacías y cancelados.
6. Alta manual, 409 conservando campos, reprogramación y cancelación persistidas, así como rechazo de generación duplicada.
7. Hora correcta con Chrome en Los Ángeles: 08:00 de El Salvador se guardó como 14:00 UTC.
8. Móvil de 360 px, escritorio y ausencia de errores de consola. Los datos y archivos temporales se eliminaron al terminar.

Evidencia:

- [Calendario y generación](evidence/h3-generacion-real-360.png).
- [Jornada publicada, 360 px](evidence/h3-publicacion-real-360.png).
- [Partido reprogramado, escritorio](evidence/h3-partido-real-escritorio.png).
- [Calendario del capitán de H4 tras publicar](evidence/h3-calendario-capitan-real-360.png).

## Entrega

El asistente no hizo commits, pull, merge ni push en las ramas de trabajo. Hay cambios locales de frontend y una consulta nueva de backend para entregar por separado. Diego incorporó H4 manualmente mediante fetch/merge y recuperó H3 con stash pop sin conflictos; la corrección de lint de H4 ya está aplicada. La revisión por un compañero, los PR y QA siguen siendo parte de la definición de terminado de Jira; no se cambió el estado de la tarjeta.

El cambio local previo de `.env.example` se conserva como estaba y no pertenece a FE-3.1; el hotfix se abandonó a solicitud de Diego.
