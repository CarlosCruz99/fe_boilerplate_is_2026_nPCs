export type EquipoBasico = { id: number; nombre: string };
export type CanchaCalendario = { id: number; nombre: string; direccion: string };
export type ArbitroCalendario = { id: string; nombre: string };
export type EstadoPartido = "PROGRAMADO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO";
export type PartidoComun = {
  id: number;
  jornada: number;
  inicio: string;
  fin: string;
  estado: EstadoPartido;
  cancha: CanchaCalendario;
  arbitro: ArbitroCalendario;
};
export type PartidoCalendario = PartidoComun & {
  rival: EquipoBasico;
  condicion: "LOCAL" | "VISITANTE";
};
export type CalendarioEquipo = {
  equipoId: number;
  total: number;
  partidos: PartidoCalendario[];
};
export type DetallePartido = PartidoComun & {
  local: EquipoBasico;
  visitante: EquipoBasico;
};
export type ResultadoCalendario<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; codigo?: string };
