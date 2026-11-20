import type { UsuarioSesion } from "@/types/auth";

export type Acceso = { href: string; titulo: string; descripcion: string };

export const nombresRol = { JUGADOR: "Jugador", ARBITRO: "Árbitro", ORGANIZADOR: "Organizador" };

export function accesosUsuario(usuario: UsuarioSesion): Acceso[] {
  if (usuario.rol === "ORGANIZADOR") return [
    { href: "/organizador/destacados", titulo: "Jugadores destacados", descripcion: "Consulta la clasificación por goles y asistencias de cada temporada." },
    { href: "/organizador/calendario", titulo: "Calendario", descripcion: "Organiza jornadas, programa encuentros y asigna árbitros." },
    { href: "/organizador/equipos", titulo: "Inscripciones", descripcion: "Revisa las solicitudes y valida los equipos de la liga." },
    { href: "/organizador/cuotas", titulo: "Cuotas", descripcion: "Administra las cuotas de inscripción y arbitraje." },
    { href: "/organizador/pagos", titulo: "Verificación de pagos", descripcion: "Revisa comprobantes y resuelve los pagos pendientes." },
    { href: "/reportes/pagos", titulo: "Reporte de pagos", descripcion: "Consulta saldos pendientes y vencimientos por equipo." },
    { href: "/reportes/deportivo", titulo: "Reporte deportivo", descripcion: "Consulta los indicadores oficiales de cada temporada." },
  ];
  if (usuario.rol === "ARBITRO") return [
    { href: "/arbitro/partidos", titulo: "Mesa del árbitro", descripcion: "Gestiona el marcador, los participantes y las estadísticas de tu partido." },
  ];
  return [
    { href: "/mis-estadisticas", titulo: "Mis estadísticas", descripcion: "Consulta tus acumulados y el detalle de cada partido por temporada." },
    { href: "/mi-calendario", titulo: "Mi calendario", descripcion: "Consulta los encuentros, las canchas y los horarios de tu equipo." },
    { href: "/avisos", titulo: "Avisos", descripcion: "Mantente al día con las novedades de la liga." },
    { href: "/equipos/nuevo", titulo: "Inscripción de equipo", descripcion: "Inscribe tu equipo o consulta el estado de tu solicitud." },
    ...(usuario.capitaneaEquipoId !== null ? [
      { href: `/equipos/${usuario.capitaneaEquipoId}/jugadores`, titulo: "Mi plantilla", descripcion: "Administra los jugadores y sus fichas para la temporada." },
      { href: "/equipo/pagos", titulo: "Historial de pagos", descripcion: "Revisa los pagos de tu equipo y sus comprobantes privados por temporada." },
      { href: "/equipo/cuotas", titulo: "Cuotas y pagos", descripcion: "Consulta tus cuotas y registra los pagos de tu equipo." },
    ] : []),
    { href: "/vincular-ficha", titulo: "Mi ficha", descripcion: "Vincula tu cuenta a la ficha de jugador de tu equipo." },
  ];
}
