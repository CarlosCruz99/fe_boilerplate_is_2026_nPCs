export type EstadoPublico = "PROGRAMADO" | "EN_CURSO" | "FINALIZADO";
export type EquipoPublico = { id: number; nombre: string };
export type PartidoPublico = {
  id: number; jornada: number; inicio: string; estado: EstadoPublico;
  local: EquipoPublico & { goles: number | null };
  visitante: EquipoPublico & { goles: number | null };
};
export type ListadoPartidos = { total: number; page: number; pageSize: number; partidos: PartidoPublico[] };
export type FiltrosPartidos = { estado?: EstadoPublico; equipoId?: number; page?: number };
export type EquipoMarcador = {
  equipoId: number; nombre: string; goles: number; faltas: number;
  jugadores: { id: number; nombre: string }[];
};
export type MarcadorPublico = {
  partidoId: number; estado: "EN_CURSO" | "FINALIZADO"; duracionMinutos: number;
  local: EquipoMarcador; visitante: EquipoMarcador;
  goleadores: { jugadorId: number; nombre: string; equipoId: number; goles: number }[];
};
