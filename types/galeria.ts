export type ResultadoArchivoGaleria =
  | { nombre: string; estado: "PUBLICADO"; contenidoId: string }
  | { nombre: string; estado: "ERROR"; motivo: string };
export type RespuestaGaleria = { partidoId: number; totalActivos: number; limite: number; resultados: ResultadoArchivoGaleria[] };

export type ContenidoGaleria = {
  id: string;
  tipo: "FOTO" | "VIDEO";
  descripcion: string | null;
  creadoEn: string;
};

export type PaginaGaleria = {
  items: ContenidoGaleria[];
  page: number;
  pageSize: number;
  totalElementos: number;
  totalPaginas: number;
};
