# FE-2.1 · Listado y detalle del organizador

Jira: [NPCS-109](https://uca-team-zec8wzmz.atlassian.net/browse/NPCS-109).

Contrato verificado con `develop` del backend en `12ed199`, que incorpora `ee397e3` (lecturas de H2). La ruta `/organizador/equipos` solo carga para ORGANIZADOR. Tiene filtro por temporada, páginas de 20, estados de carga, vacío y error, y detalle con foto y edad.

El listado real devuelve `{items,total,page,pageSize}`. Cada resumen tiene `id`, `nombre`, `estado`, `nombreCapitan`, `totalJugadores` y `creadoEn`; no contiene un objeto `capitan`, `createdAt`, `temporadaId` ni `capitanId`.

El detalle agrega `temporadaId`, `capitanId`, `motivoRechazo` y `jugadores`. Cada jugador del detalle contiene solo `id`, `nombreCompleto`, `edad` y `fotoUrl`. La edad es calculada por el backend a la fecha de El Salvador. Se destacan menores de 16 años y plantillas con menos de siete jugadores.

La descarga privada del backend ya permite ORGANIZADOR para jugadores inscritos en equipos; se aprovecha la ruta autenticada de Next creada por FE-1.2.

Las pruebas cubren resumen real, detalle, advertencias, filtro, paginación y denegación al capitán. Se verificaron los campos reales, fotografía autenticada, filtro, permisos en UI/API y detalle a 360 px sin desbordamiento con Next, Nest, PostgreSQL y Chrome reales, sobre una base temporal eliminada al terminar.

[Detalle con backend real, 360 px](evidence/h2-real-detalle-360.png). [Listado anterior con fixtures](evidence/organizador-360.png).
