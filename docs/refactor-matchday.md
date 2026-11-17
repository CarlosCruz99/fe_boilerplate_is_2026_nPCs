# Refactor Matchday · fútbol inmersivo

16 de noviembre de 2026.

## Resultado

Login, registro e inicio con composición cinematográfica de fútbol, tipografía de gran formato, verde eléctrico, fondos de estadio y protagonistas originales. Las pantallas de calendario, equipos, plantilla, cuotas, pagos, avisos, galería y arbitraje comparten la misma identidad, conservando formularios y tablas legibles.

Tres escenas locales en WebP, unos 357 KiB en total: jugador número 10, jugador conduciendo el balón y futbolista con balón. Se cambia de escena según la sección. El movimiento usa panorámica suave, paralaje con el puntero, iluminación y partículas en CSS; **son imágenes animadas por capas, no clips de jugadores en video**. Se pueden sustituir por clips con el mismo encuadre si se dispone de ese material.

La navegación tiene transición de entrada y tarjetas que responden al foco/puntero. En móvil, el menú se desplaza horizontalmente dentro de su propio contenedor. El movimiento se puede pausar; la preferencia persiste al navegar y al recargar. Se respeta `prefers-reduced-motion`. La escena decorativa queda fuera del árbol de accesibilidad y los controles mantienen foco visible.

Material generado con la herramienta integrada imagegen. Archivos y prompts completos: [public/media/README.md](../public/media/README.md).

## Corrección funcional encontrada durante las pruebas

La mesa del árbitro inicializaba siempre estado PROGRAMADO y marcador 0–0, sin leer el servidor. Esto impedía continuar correctamente un partido al recargar y presentaba controles de inicio para encuentros ya finalizados.

Se añadió `GET /api/v1/partidos/:partidoId/mesa`, protegido por autenticación y la regla de árbitro asignado. Devuelve equipos, estado, goles, faltas, inicio/fin reales y participantes guardados, con `Cache-Control: private, no-store`. La asignación se comprueba también en el servicio con la lectura que se devuelve. No necesita migraciones ni cambia contratos existentes.

El frontend espera esa consulta antes de mostrar controles, recupera el marcador y los participantes, muestra los nombres de ambos equipos y permite actualizar el partido. Un rechazo de acceso presenta un error con reintento sin mostrar una mesa operable. Partidos finalizados y cancelados quedan bloqueados para edición. Los horarios reales se muestran en la zona de El Salvador.

## Validación

- Frontend: lint correcto, 133 pruebas en 19 archivos, compilación de producción y TypeScript correctos con `npm run build -- --webpack`.
- Backend: compilación correcta, 335 pruebas unitarias. Lint sin errores; conserva una advertencia previa de `sort` sin comparador en `test/seed/h1-dataset.spec.ts`.
- Integración: 230 pruebas en 19 archivos; suite completa sobre una copia temporal de PostgreSQL, con casos de persistencia y permisos de la nueva mesa. Los estados de lectura de los avisos se restauran en esa copia a los fixtures del seed antes de ejecutar. Cada ejecución completa utiliza una copia nueva, porque algunas suites dejan avisos generados por sus fixtures; reutilizarla altera sus conteos. La base original no se resetea ni se modifican sus datos de negocio.
- Navegador Chromium real: 57 vistas y estados; revisión de rutas de organizador, capitán y árbitro a 1440 y 360 px; además login, registro, detalle de avisos, redirección de avisos, 404 y estados de jugador sin equipo. Se comprueba contenido, errores de JavaScript, imágenes y ancho de documento.
- Interacciones reales: 21 comprobaciones; credenciales incorrectas, login, cierre de sesión, menú de plantilla, catálogos de cuotas y árbitros, cancelación de cambio de árbitro, acceso a galería, restricción por rol, acceso a mesa y estadísticas, recuperación de los marcadores reales 1–7 (en curso) y 2–4 (finalizado), formulario de registro obligatorio, pausa persistente y movimiento reducido.

Las escrituras de negocio se verifican en la suite de integración aislada. La revisión de navegador comprueba navegación, formularios, catálogos, validaciones y controles; no constituye una certificación de todos los escenarios posibles ni una prueba de carga.

## Evidencia y ejecución

- [Resumen de validación](evidence/matchday/validacion.json)
- [Resultados de vistas](evidence/matchday/verificacion-vistas.json)
- [Interacciones](evidence/matchday/interacciones.json)
- [Login](evidence/matchday/login-final.png)
- [Inicio móvil](evidence/matchday/capitan-inicio-360.png)
- [Calendario](evidence/matchday/organizador--organizador-calendario-1440.png)
- [Detalle de aviso móvil](evidence/matchday/aviso-detalle-360.png)
- [Mesa en curso, móvil](evidence/matchday/mesa-8-360.png)
- [Mesa finalizada, escritorio](evidence/matchday/mesa-12-1440.png)

Frontend de producción: http://localhost:3001. Backend: http://localhost:3000/api/v1/.

Para iniciar manualmente:

```sh
# Backend, desde su repositorio, con PostgreSQL disponible
npm run build
npm run start:prod

# Frontend, desde su repositorio
npm run build -- --webpack
npm run start -- --port 3001
```

El frontend utiliza la configuración local existente `API_URL=http://localhost:3000/api/v1/`. No se añaden dependencias.
