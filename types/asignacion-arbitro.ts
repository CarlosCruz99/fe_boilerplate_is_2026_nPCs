import type { Arbitro } from "./calendario-organizador";
export type ArbitrosDisponibles = { partidoId: number; arbitros: Arbitro[] };
export type ArbitroAsignado = { partidoId: number; arbitroId: string; arbitroNombre: string };
