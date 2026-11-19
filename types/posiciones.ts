export type PosicionEquipo = {
  lugar: number; equipoId: number; equipo: string;
  pj: number; pg: number; pe: number; pp: number;
  gf: number; gc: number; dg: number; puntos: number;
};
export type TablaPosiciones = { temporadaId: number; posiciones: PosicionEquipo[] };
