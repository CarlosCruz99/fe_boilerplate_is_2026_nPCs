# FE-1.1 · Inscripción de equipos

Jira: [NPCS-102](https://uca-team-zec8wzmz.atlassian.net/browse/NPCS-102).

`/equipos/nuevo`, solo para JUGADOR, lista temporadas abiertas para registrar y conserva temporadas cerradas para consultar estados anteriores. Consulta `mi-equipo` por temporada: un 200 muestra estado, contador y motivo de rechazo; solo un 404 permite el formulario cuando la inscripción está abierta.

Valida nombre de 3 a 50 caracteres tras trim, bloquea reenvíos y conserva el nombre ante errores. Con 201 actualiza la sesión y navega a `/equipos/{id}/jugadores?temporadaId={id}`; la pantalla de plantilla se incorpora en FE-1.2.

Introduce el transporte autenticado en servidor, tipos básicos, selector de temporada, estados de consulta, estilos compartidos y el enlace de inicio que necesita este flujo. Los tokens permanecen en cookies HttpOnly y las respuestas protegidas usan `no-store`.

Las pruebas cubren éxito, errores 400/403/409/422, temporada cerrada, errores de consulta y permisos. La integración con Nest y PostgreSQL se comprobó en una base temporal independiente, eliminada al terminar. FE-1.3 se reutiliza sin cambiar sus archivos.

[Evidencia visual a 360 px con fixtures](evidence/inscripcion-360.png).
