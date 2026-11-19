import type { ConceptoCuota } from "./cuotas";
export type PagoHistorial = {
  id: number; concepto: ConceptoCuota; monto: string; fechaPago: string;
  estado: "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
  tieneComprobante: boolean; motivoRechazo: string | null;
};
export type TotalesHistorial = {
  totalRegistrado: string; totalVerificado: string;
  pendienteVerificacion: string; totalRechazado: string;
};
export type HistorialPagos = {
  equipoId: number; temporadaId: number; concepto: ConceptoCuota | null;
  pagos: PagoHistorial[]; totales: TotalesHistorial;
};
