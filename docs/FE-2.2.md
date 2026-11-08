# FE-2.2 · Aprobar o rechazar inscripciones

Jira: [NPCS-110](https://uca-team-zec8wzmz.atlassian.net/browse/NPCS-110).

Contrato verificado con `develop` del backend en `12ed199`, que incorpora `fa92951` (decisiones de H2).

`PATCH /equipos/{id}/validacion` envía `{decision:"APROBAR"}` o `{decision:"RECHAZAR",motivo}`. La respuesta tiene su propio tipo con `id`, `estado`, `validadoPor`, `fechaValidacion` y `motivoRechazo`.

La aprobación exige confirmación. El rechazo usa un diálogo con contador y motivo de 20 a 500 caracteres después de trim, validado también en servidor. Ambos botones se bloquean durante el envío. El motivo se conserva si la solicitud falla.

Con 200 se retira el equipo de pendientes; se ajusta la página si desaparece la última. Con 409 se comunica una decisión previa y se recarga. `REQUISITOS_NO_CUMPLIDOS` devuelve `codigo` y `fallas` sin `message`: se muestran un mensaje descriptivo y cada falla. `TEMPORADA_COMPLETA` devuelve `codigo` y `mensaje` y se presenta como «La temporada está completa.».

Se verificaron con Next, Nest, PostgreSQL y Chrome reales: aprobación de siete adultos, retiro de pendientes, rechazo corto bloqueado y rechazo válido, cantidad/edad inválidas (422), temporada con 12 equipos inscritos, 409 tras decisión desde otra sesión, estado y motivo visibles al capitán en temporada cerrada y bloqueo de plantilla tras la validación. La base y fotos temporales se eliminaron; no se modificaron datos existentes ni estados de Jira.

Verificación final conjunta: **44 pruebas**, lint y TypeScript sin errores; build de producción con `npm run build -- --webpack`. Se usa Webpack para evitar el fallo del puerto interno de Turbopack en este entorno, sin cambiar el script predeterminado.

[Temporada llena, backend real](evidence/h2-real-cupo-escritorio.png). [Motivo visible al capitán, backend real](evidence/h2-real-estado-capitan.png). Las capturas de rechazo y estado sin prefijo `h2-real` corresponden a fixtures de la verificación anterior.

Quedan la revisión de un compañero y la entrega por PR, no la integración real.
