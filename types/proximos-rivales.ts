export type ProximosRivales = {
  equipoId: number;
  proximos: { partidoId: number; fechaHora: string; rival: { equipoId: number; nombre: string; lugar: number | null; puntos: number | null } }[];
};
