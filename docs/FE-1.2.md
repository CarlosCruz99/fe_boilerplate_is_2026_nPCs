# FE-1.2 · Plantilla y fotografías

Jira: [NPCS-103](https://uca-team-zec8wzmz.atlassian.net/browse/NPCS-103).

`/equipos/{id}/jugadores?temporadaId={id}` comprueba capitanía con `mi-equipo` de esa temporada antes de consultar la plantilla. No depende de la capitanía de la temporada actual en `auth/me`. El backend vuelve a autorizar altas y bajas.

Agrega jugadores por multipart con nombre, identificación, fecha válida no futura y JPG/PNG de hasta 2 MiB; incluye vista previa. Usa `fetch` sin fijar Content-Type multipart. Se bloquean altas al llegar a 15; altas y bajas solo están disponibles en PENDIENTE. Se actualizan lista y contador después de cada operación y se conserva el mensaje de jugador duplicado del backend.

`/api/fotos/jugadores/{archivo}` reenvía solo nombres numéricos JPG/PNG al origen fijo del backend. Adjunta Bearer en servidor, mantiene caché privada, no sigue redirecciones y no acepta URLs externas. Las tarjetas muestran un reemplazo cuando falta la foto. `next.config.ts` admite cuerpos de 3 MB para transportar fotos de hasta 2 MiB; la foto se valida por separado.

Las pruebas cubren archivos inválidos, permisos, límite de 15, estados no editables, multipart, duplicados, baja y descarga autenticada. Chrome completó alta de equipo y jugador, lectura de PNG persistido, rechazo de foto mayor de 2 MiB, duplicado 409 y baja con contador contra Nest/PostgreSQL reales. Se eliminó la base temporal sin cambiar datos existentes.

[Evidencia con backend real, 360 px](evidence/h1-real-360.png). [Vista de plantilla con fixtures](evidence/plantilla-360.png).
