export type EstadoPartidoEstadistica = "PROGRAMADO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO";

export type CantidadesEstadistica = {
  goles: number;
  asistencias: number;
  tarjetas: number;
};

export type RegistroEstadistica = CantidadesEstadistica & {
  jugadorId: number;
};

export type JugadorHabilitado = {
  jugadorId: number;
  nombre: string;
  equipoId: number;
};

export type EstadisticasPartido = {
  partidoId: number;
  temporadaId: number;
  estado: EstadoPartidoEstadistica;
  resultadoOficial: boolean;
  jugadoresHabilitados: JugadorHabilitado[];
  registros: RegistroEstadistica[];
};
