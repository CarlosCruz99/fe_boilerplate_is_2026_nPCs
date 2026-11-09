import type { EquipoResumen } from "@/types/equipos";

export type Cancha = {
  id: number;
  nombre: string;
  direccion: string;
  activa: boolean;
};
export type Arbitro = { id: string; nombre: string };
export type EstadoPartido =
  "PROGRAMADO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO";
export type Partido = {
  id: number;
  jornada: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  canchaId: number;
  arbitroId: string;
  inicio: string;
  fin: string;
  estado: EstadoPartido;
};
export type CrearPartido = {
  temporadaId: number;
  jornada: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  canchaId: number;
  arbitroId: string;
  inicio: string;
};
export type ReprogramarPartido = Pick<
  CrearPartido,
  "canchaId" | "arbitroId" | "inicio"
>;
export type GenerarCalendario = {
  fechaPrimeraJornada: string;
  horaPrimerTurno: string;
  canchaIds: number[];
  arbitroIds: string[];
};
export type CalendarioGenerado = {
  temporadaId: number;
  jornadas: number;
  partidos: number;
  estadoJornadas: "BORRADOR";
};
export type CatalogosCalendario = {
  equipos: EquipoResumen[];
  totalInscritos: number;
  canchas: Cancha[];
  arbitros: Arbitro[];
};

export type PartidoOrganizador = Partido & {
  local: { id: number; nombre: string };
  visitante: { id: number; nombre: string };
  cancha: Pick<Cancha, "id" | "nombre" | "direccion">;
  arbitro: Arbitro;
};
export type JornadaOrganizador = {
  id: number;
  numero: number;
  estado: "BORRADOR" | "PUBLICADA";
  publicadaEn: string | null;
  partidos: PartidoOrganizador[];
};
export type CalendarioTemporada = {
  temporadaId: number;
  jornadas: JornadaOrganizador[];
};
export type JornadaPublicada = {
  id: number;
  estado: "PUBLICADA";
  publicadaEn: string;
};
