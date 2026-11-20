import type { ConceptoCuota } from "@/types/cuotas";

export type ConceptoReporte = ConceptoCuota | "TODOS";
export type EstadoReporte = "MOROSO" | "CON_SALDO" | "PAGADO" | "SIN_CUOTAS";

export type FiltrosReportePagos = {
  temporadaId: number;
  concepto: ConceptoReporte;
  estado: EstadoReporte | "";
};

type MontosReporte = {
  totalCuotas: string;
  pagado: string;
  saldoPendiente: string;
};

export type EquipoReportePagos = MontosReporte & {
  equipoId: number;
  nombre: string;
  estado: EstadoReporte;
  vencidoDesde: string | null;
};

export type ReportePagos = {
  temporadaId: number;
  concepto: ConceptoReporte;
  generadoEn: string;
  equipos: EquipoReportePagos[];
  totales: MontosReporte & { equiposMorosos: number };
};
