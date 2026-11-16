# Refactor visual Nord

Revisión realizada el 16 de noviembre de 2026.

## Diseño y navegación

- Paleta Nord oscura consistente, tipografía de sistema y jerarquía común de páginas, tarjetas, formularios, botones, alertas y ventanas de confirmación.
- Cabecera compartida con navegación según el rol, sección activa, cierre de sesión y enlace para saltar al contenido con teclado.
- Inicio con accesos a las herramientas de cada perfil. Los jugadores pueden encontrar calendario y avisos; los capitanes también disponen de plantilla y pagos.
- El acceso directo a la plantilla resuelve la temporada actual; los enlaces desde inscripciones conservan su temporada explícita.
- Los avisos de cuotas y pagos enlazan a la pantalla correspondiente para capitanes.
- Bandeja de avisos con lista desplazable, accesible por teclado, y detalle legible en móvil y escritorio.
- Login, registro, galería, pagos, calendario y herramientas de árbitros usan la misma base visual. Página 404 en español y regreso al inicio desde accesos restringidos.
- Se retiraron los textos de wireframe, las referencias a historias de desarrollo y las explicaciones internas de backend. Los errores de conexión del árbitro usan lenguaje para el usuario.
- La antigua ruta de demostración de calendario publicado lleva a la bandeja de avisos reales.

## Validación

| Comprobación | Resultado |
| --- | --- |
| Frontend `npm run lint` | Sin errores ni advertencias |
| Frontend `npm test` | 128 pruebas, 17 archivos, todas pasan |
| Frontend `npm run build -- --webpack` | Compilación de producción y TypeScript correctos |
| Backend `npm test` | 335 pruebas, 35 archivos, todas pasan |
| Backend `npm run build` | Compilación correcta |
| Backend Vitest con `vitest.config.e2e.ts` | 224 pruebas, 18 archivos, todas pasan |
| Chromium: 16 rutas a 360 y 1440 px | 32 vistas sin desbordamiento horizontal, errores visibles ni excepciones de JavaScript |

Las pruebas de integración del backend se ejecutaron sobre una copia temporal de PostgreSQL, eliminada al finalizar. La primera ejecución encontró estados de lectura de avisos distintos de los esperados por los fixtures. Se creó una copia nueva y se restauraron únicamente en ella los estados definidos por el seed; la ejecución completa pasó. No se cambió código del backend.

Se sincronizaron las dependencias del backend con su lockfile mediante `npm ci` y se generó Prisma. No se modificaron los manifiestos de dependencias.

Turbopack falla en este entorno al abrir un puerto interno (`EPERM`). La compilación se verificó con Webpack, sin modificar el comando de build del proyecto. Las fuentes de sistema permiten compilar sin descargar tipografías.

El navegador utiliza el frontend de producción en `http://localhost:3001` y el backend en `http://localhost:3000/api/v1/`, con las cuentas de prueba documentadas en el backend. La revisión de interfaz cubre lectura y navegación; las escrituras se comprueban en las pruebas de integración de la API aislada.

También se comprobaron botones reales en Chromium: catálogos de cuotas y reinicio al cambiar temporada; apertura y cancelación del cambio de árbitro; enlace a galería; plantilla desde el menú; aviso de cuota hacia pagos; bloqueo de páginas de otro rol y regreso al inicio; cierre de sesión; mesa del árbitro hacia estadísticas; registro móvil y error de credenciales.

## Evidencia

- [Inicio en escritorio](evidence/nord/inicio-escritorio.png)
- [Inicio en móvil](evidence/nord/inicio-movil.png)
- [Bandeja de avisos](evidence/nord/avisos-escritorio.png)
- [Cuotas en móvil](evidence/nord/cuotas-movil.png)
- [Galería en móvil](evidence/nord/galeria-movil.png)
- [Plantilla en móvil](evidence/nord/plantilla-movil.png)
- [Estadísticas en móvil](evidence/nord/estadisticas-movil.png)
- [Inicio de sesión](evidence/nord/login.png)
- [Resultados de las 32 vistas](evidence/nord/verificacion-vistas.json)
