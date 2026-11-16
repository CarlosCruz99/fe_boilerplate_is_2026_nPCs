export type ResultadoArchivoGaleria =
  | { nombre: string; estado: "PUBLICADO"; contenidoId: string }
  | { nombre: string; estado: "ERROR"; motivo: string };
export type RespuestaGaleria = { partidoId: number; totalActivos: number; limite: number; resultados: ResultadoArchivoGaleria[] };
