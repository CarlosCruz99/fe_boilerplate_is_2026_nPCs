# nPCs - Frontend de la plataforma de gestión deportiva (Liga amateur)

Proyecto 5 · Ingeniería de Software · UCA · Ciclo 02/2026.

Este repositorio contiene la interfaz web creada con Next.js App Router y React. Permite a aficionados consultar marcadores y posiciones; a jugadores y capitanes registrarse, inscribir equipos y consultar datos propios; a árbitros registrar encuentros; y a organizadores gestionar calendario, inscripciones, cuotas, contenido y reportes.

## Documentación consolidada

La documentación completa del sistema se encuentra en el [README del backend](https://github.com/CarlosCruz99/be_boilerplate_is_2026_nPCs/blob/develop/README.md) y en su [carpeta `docs`](https://github.com/CarlosCruz99/be_boilerplate_is_2026_nPCs/tree/develop/docs): guía de uso, arquitectura, datos, API, instalación, despliegue, forma de trabajo, historias y problemas conocidos. **Publicar estos enlaces contra `main` después de la release.**

La documentación de diseños frontend y capturas existente en este repositorio debe conservarse en [`docs/`](docs/). Ejemplos: `FE-1.1.md`, `FE-2.1.md`, `FE-13.1.md`, `FE-14.1-historial-pagos.md`, `FE-25.1.md`, `refactor-matchday.md` y [`docs/evidence/`](docs/evidence/).

## Stack

- Next.js `16.3.6`, React `19.2.8`, TypeScript 5, Tailwind CSS 4.
- Server Actions en `app/actions/`, rutas en `app/`, componentes compartidos en `components/`, sesión en `contexts/auth-context.tsx`, clientes y validación en `lib/`.
- Vitest 5 y Testing Library para pruebas automatizadas.

## Instalación local

```bash
cp .env.example .env.local
# Completar API_URL con la URL alcanzable de la API (por ejemplo http://localhost:3000)
npm ci
npm run dev
```

Abrir `http://localhost:3000` si Next.js usa el puerto predeterminado. **Importante:** el backend Docker también publica el puerto `3000`; si ambos se ejecutan en la misma máquina, asignar otro puerto al frontend, por ejemplo `npm run dev -- -p 3001`, y revisar las URLs de integración.

## Variables de entorno

`API_URL`: dirección base del backend utilizada por las acciones de servidor. La plantilla original contiene `http://localhost:8000`, mientras que el Compose del backend publica por defecto `3000`; ajustar al entorno real. No guardar tokens, contraseñas ni secretos de producción en el repositorio.

## Pruebas

```bash
npm test
npm run lint
npm run build
```

El repositorio contiene pruebas en `tests/` y evidencias visuales de vistas en `docs/evidence/`.

## Ambientes y release

- **Frontend público:** pendiente de URL definitiva.
- **Documentación API pública:** pendiente de URL definitiva.
- **Rama de integración consultada:** `develop`.
- **Entrega:** fusionar la release aprobada a `main`, etiquetar `v1.0.0` y confirmar HTTPS y las URLs publicadas.

## Integrantes y responsabilidades

- Carlos Humberto Cruz Parada — Backend.
- Diego Benjamin Hurtado Ramos — Frontend.
- José Martín Luna Ramos — Frontend.
- Francisco Javier Martínez Donado — QA.
- Cristofer Enoc Melara Aldana — Documentación / Backend.
- Edson Enrique Palacios Quinteros — Base de datos.

**Nota:** estas funciones proceden del README actual del backend; la responsabilidad efectiva de historias y tareas se detalla en el documento de historias/Jira.
