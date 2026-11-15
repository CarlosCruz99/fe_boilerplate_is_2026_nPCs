export type MarcadorPartido = {
  golesLocal: number;
  golesVisitante: number;
  faltasLocal: number;
  faltasVisitante: number;
};

export type InicioPartido = {
  partidoId: number;
  estado: "EN_CURSO";
  inicioReal: string;
};

export type ActualizacionMarcador = MarcadorPartido & {
  partidoId: number;
  estado: "EN_CURSO";
  actualizadoEn: string;
};

export type FinPartido = Pick<MarcadorPartido, "golesLocal" | "golesVisitante"> & {
  partidoId: number;
  estado: "FINALIZADO";
  finReal: string;
};

export type Participante = {
  id: number;
  nombre: string;
};

export type ParticipantesPartido = {
  partidoId: number;
  local: Participante[];
  visitante: Participante[];
};
