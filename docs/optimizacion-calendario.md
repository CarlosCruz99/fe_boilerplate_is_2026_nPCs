# Rendimiento, calendario y material real

16 de noviembre de 2026.

## Cambios

El calendario sigue `Ejemplo calendario.png`: tarjetas claras, fecha y hora en la cabecera, identificación de ambos equipos, acciones laterales y franja de cancha/estado. Los monogramas se obtienen de los nombres registrados; no se inventan escudos de equipos reales.

El organizador selecciona una jornada y solo se montan sus partidos. Los datos de las demás jornadas permanecen disponibles para cambiar de pestaña sin nuevas peticiones. Se mantienen publicación, asignación de árbitro, reprogramación, cancelación, galería, generación y agenda. En el calendario del jugador hay tarjetas de todos sus encuentros, filtros por jornada y consulta de detalle.

## Causas de trabajo innecesario y correcciones

- La sesión se invalidaba visualmente en cada cambio de URL y desmontaba el contenido. Ahora se conserva durante la navegación privada, se comprueba al entrar, al volver a la pestaña/ventana y cada 60 segundos mientras sea visible. Login/logout cambian el ámbito y fuerzan una lectura nueva. Las peticiones concurrentes se agrupan y una respuesta antigua no reemplaza la de otra cuenta.
- Las comprobaciones de rol, pertenencia y capitanía siguen en cada acción del servidor y en la API; no hay una caché global de permisos ni de datos privados. Una revocación confirmada elimina la sesión de la UI. Un fallo temporal de revalidación conserva los formularios en uso; las solicitudes de negocio siguen mostrando sus propios errores reales.
- Se retiró el `key` por URL del contenedor general, que forzaba remontajes adicionales.
- Se eliminó el paralaje por movimiento del puntero, las partículas y la iluminación animada. Las herramientas tienen fondo estático, sin filtros animados ni `backdrop-filter`. Inicio/login conservan una panorámica leve con `transform`; en móvil y movimiento reducido se desactiva.
- El catálogo de canchas, árbitros y equipos comparte una comprobación de sesión dentro de su acción, en lugar de consultar `/auth/me` por cada catálogo. No se comparte ese resultado entre peticiones o usuarios.
- Ya no se generan simultáneamente una tabla y tarjetas móviles para todos los encuentros del jugador.

## Fotografías y video

Los fondos activos son fotografías reales de Messi, Cristiano Ronaldo y Messi/Neymar/Mbappé, y un fotograma real de entrenamiento. Se sirven localmente en WebP. Los autores, fuentes, licencias y adaptaciones están en [public/media/README.md](../public/media/README.md) y en **Créditos visuales** al pie de la aplicación.

**Ver entrenamiento** activa un video real de Tima Miroshnichenko / Pexels. Es un extracto de 8 segundos a 1280×720, H.264 y sin audio, aproximadamente 457 KiB. No se monta ni descarga automáticamente. Se retira al entrar a las herramientas, se pausa al ocultar la pestaña y responde al control de pausa. El movimiento reducido impide activarlo. El servidor admite solicitudes parciales HTTP Range sin exigir login para este recurso público.

Los archivos generados de la propuesta anterior se conservan como referencia histórica, pero no están en los estilos activos ni se solicitan durante la navegación.

## Medición antes/después

Chromium local, versión de producción, escritorio de 1440 px, misma API y base de datos. Tres entradas al calendario desde el menú del inicio. El tiempo se cuenta desde el clic hasta que están disponibles los partidos de la primera jornada y el formulario de agenda, mediante sondeo cada 40 ms. No es una prueba de carga ni una predicción para todos los dispositivos/redes.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Tiempo mediano al calendario (3 muestras) | 245,1 ms | 179,2 ms |
| Peticiones POST de acciones al entrar | 4 | 3 |
| Elementos DOM del calendario estabilizado | 1.171 | 387 |
| Apariciones de “Comprobando sesión” durante navegación | 1 | 0 |
| Elementos con backdrop-filter en el calendario | 1 | 0 |
| Trabajo del hilo principal durante 4 s en reposo | 70,97 ms | 30,35 ms |
| Recálculo de estilos durante esos 4 s | 11,76 ms | 0 ms |

La mediana de navegación mejora aproximadamente un 27% y se reducen los elementos DOM aproximadamente un 67%. Los tiempos incluyen variabilidad y el coste del sondeo; las muestras brutas están en [antes](evidence/optimized/performance-before.json) y [después](evidence/optimized/performance-after.json). No se midieron FPS en la GPU física del usuario.

## Validación

- 139 pruebas del frontend en 20 archivos: navegación de sesión, renovación, separación de cuentas, fallo temporal, video bajo demanda y movimiento reducido; también los flujos existentes de calendario, publicaciones, cancelación, reprogramación, catálogos y formularios.
- Lint y compilación de producción con TypeScript correctos.
- 38 vistas en Chromium, a 360 y 1440 px, para organizador, capitán, árbitro, login y registro. Sin excepciones de JavaScript, imágenes rotas, alertas inesperadas ni desbordamiento del documento.
- 19 comprobaciones de interacción aprobadas: video y sus controles, créditos, selección de jornadas sin peticiones nuevas, catálogo real del árbitro, reprogramación con campos conservados, filtro del calendario del jugador y detalle del encuentro.

No se modifica el código del backend en esta revisión. Las pruebas del navegador conservan las operaciones de negocio en modo lectura/validación; no se publican jornadas ni se cancelan o reprograman partidos reales como parte de esta revisión visual.

## Evidencia

- [Resultados de vistas](evidence/optimized/verificacion-vistas.json)
- [Resultados de interacciones](evidence/optimized/interacciones.json)
- [Calendario del organizador en escritorio](evidence/optimized/organizador--organizador-calendario-1440.png)
- [Calendario del organizador en móvil](evidence/optimized/calendario-organizador-mobile.png)
- [Calendario del equipo](evidence/optimized/calendario-capitan-desktop.png)
- [Detalle del equipo en móvil](evidence/optimized/calendario-capitan-mobile.png)
- [Login con fotografía real](evidence/optimized/login-real-final.png)
- [Video real activado](evidence/optimized/login-video-real.png)

Frontend: http://localhost:3001. API: http://localhost:3000/api/v1/.
