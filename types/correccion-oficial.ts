import type { JugadorHabilitado, RegistroEstadistica } from "@/types/estadisticas-partido";
import type { MarcadorPublico } from "@/types/marcador-publico";

export type SolicitudCorreccion = {
  motivo: string;
  golesLocal?: number;
  golesVisitante?: number;
  estadisticas?: RegistroEstadistica[];
};

export type ValoresCorreccion = {
  golesLocal: number;
  golesVisitante: number;
  estadisticas: RegistroEstadistica[];
};

export type EntradaCorreccion = {
  id: number;
  responsable: string;
  fecha: string;
  motivo: string;
  antes: ValoresCorreccion;
  despues: ValoresCorreccion;
};

export type CorreccionConfirmada = {
  correccionId: number;
  estado: "FINALIZADO";
  antes: ValoresCorreccion;
  despues: ValoresCorreccion;
};

export type ContextoCorreccion = {
  marcador: MarcadorPublico;
  jugadores: JugadorHabilitado[];
  historial: EntradaCorreccion[];
};
