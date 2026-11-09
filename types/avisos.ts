/** Respuestas de BE-19.1: GET /avisos, GET /avisos/:id y PATCH /avisos/:id/leido. */
export type ModuloAviso = "CALENDARIO" | "PAGOS" | "RESULTADOS";
export type TipoAviso =
  | "PARTIDO_MODIFICADO"
  | "JORNADA_PUBLICADA"
  | "CUOTA_REGISTRADA"
  | "PAGO_REGISTRADO"
  | "RESULTADO_FINALIZADO"
  | "RESULTADO_CORREGIDO";
export type ReferenciaAviso = { tipo: "PARTIDO" | "JORNADA" | "CUOTA" | "PAGO"; id: number };
export type Aviso = {
  id: number;
  moduloOrigen: ModuloAviso;
  tipo: TipoAviso;
  titulo: string;
  mensaje: string;
  creadoEn: string;
  leidoEn: string | null;
  referencia: ReferenciaAviso | null;
  datos: Record<string, unknown> | null;
};
export type PaginaAvisos = { datos: Aviso[]; pagina: number; limite: number; total: number };
export type ConteoAvisos = { total: number };
export type ResultadoAvisos<T> = { ok: true; data: T } | { ok: false; status: number; error: string };
