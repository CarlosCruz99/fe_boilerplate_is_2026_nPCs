export type AcumuladosPersonales = { goles: number; asistencias: number; tarjetas: number };
export type PartidoEstadisticaPersonal = AcumuladosPersonales & { partidoId: number; fecha: string; rival: string };
export type EstadisticasPersonales = {
  temporadaId: number;
  acumulados: AcumuladosPersonales;
  partidos: PartidoEstadisticaPersonal[];
};
