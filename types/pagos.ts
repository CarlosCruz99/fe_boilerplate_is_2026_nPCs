import type { ConceptoCuota } from "./cuotas";
export type CuotaPago = { id: number; equipoId: number; concepto: ConceptoCuota; montoTotal: string; totalVerificado: string; saldo: string; pendienteVerificacion: string; disponible: string };
export type PagoRegistrado = { id: number; cuotaId: number; monto: string; fechaPago: string; estado: "PENDIENTE"; saldo: string; disponible: string };
