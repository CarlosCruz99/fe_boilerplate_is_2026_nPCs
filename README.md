# nPCs — Frontend de la plataforma de gestión deportiva

**Proyecto 5 · Ingeniería de Software · UCA · Ciclo 02/2026.**

Interfaz web de la liga amateur nPCs, desarrollada con Next.js App Router y React. Permite consultar partidos y posiciones sin sesión, y ofrece módulos para jugadores, capitanes, árbitros y organizadores.

## Accesos públicos

| Recurso | URL |
|---|---|
| Frontend | [nPCs — Iniciar sesión](https://project-czgs9.vercel.app/login) |
| Documentación de la API | [Swagger de producción](https://be-boilerplate-is-2026-npcs.onrender.com/api/docs) |
| Backend | [Repositorio GitHub](https://github.com/CarlosCruz99/be_boilerplate_is_2026_nPCs) |

## Funcionalidades

- **Aficionado:** consulta de partidos, resultados y tabla de posiciones.
- **Jugador:** registro de cuenta, vinculación de ficha, estadísticas, calendario, galería y avisos propios.
- **Capitán:** registro de equipo y plantilla, consulta de próximos rivales, registro de comprobantes e historial de pagos. La capitanía depende del equipo, no es un rol separado en la base de datos.
- **Árbitro:** mesa operativa, inicio de partido, registro de marcador, faltas, participantes y estadísticas, y finalización.
- **Organizador:** validación de inscripciones, programación y publicación de jornadas, asignación de árbitros, cuotas, verificación de pagos, galería, corrección oficial y reportes.

## Stack y estructura

- Next.js 16, React 19, TypeScript y Tailwind CSS 4.
- Rutas y vistas en `app/`, acciones de servidor en `app/actions/`.
- Componentes reutilizables en `components/`; contexto de sesión en `contexts/`; utilidades y clientes API en `lib/`.
- Pruebas de frontend en `tests/` y materiales de diseño en `docs/` con capturas en `docs/evidence/`.

## Ejecución local

Requiere Node.js y npm. Crear `.env.local` a partir del ejemplo del repositorio. El backend debe encontrarse accesible en la dirección configurada como `API_URL`.

```bash
npm ci
cp .env.example .env.local
# Configurar API_URL=http://localhost:3000 para un backend local
npm run dev -- -p 3001
```

La interfaz local queda disponible en `http://localhost:3001` y la API NestJS puede utilizar `http://localhost:3000`. Para producción, el origen del backend es `https://be-boilerplate-is-2026-npcs.onrender.com`.

## Pruebas y compilación

```bash
npm test
npm run lint
npm run build
```

## Documentación central

La documentación del sistema se mantiene en el [README del backend](https://github.com/CarlosCruz99/be_boilerplate_is_2026_nPCs/blob/main/README.md) y sus [páginas generales](https://github.com/CarlosCruz99/be_boilerplate_is_2026_nPCs/tree/main/docs): guía de uso, arquitectura, modelo de datos, contratos de API, instalación, despliegue, forma de trabajo, historias y consideraciones operativas.

Los documentos de diseño del frontend y sus capturas de pantalla están organizados en `docs/`.

## Equipo

- Carlos Humberto Cruz Parada — Backend.
- Diego Benjamín Hurtado Ramos — Frontend.
- José Martín Luna Ramos — Frontend.
- Francisco Javier Martínez Donado — QA.
- Cristofer Enoc Melara Aldana — Documentación / Backend.
- Edson Enrique Palacios Quinteros — Base de datos.
