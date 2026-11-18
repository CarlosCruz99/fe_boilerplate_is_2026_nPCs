export type MetricaDestacados = "goles" | "asistencias";
export type JugadorDestacado = { jugadorId: number; nombre: string; posicion: number; total: number };
export type ClasificacionDestacados = { temporadaId: number; metrica: MetricaDestacados; jugadores: JugadorDestacado[] };
