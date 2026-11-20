import type { ConceptoCuota } from "@/types/cuotas";

type EquipoPago = { id: number; nombre: string };
export type DecisionPago = "VERIFICADO" | "RECHAZADO";
export type EstadoRevisionPago = "PENDIENTE" | DecisionPago;

export type BandejaPagos = {
  total: number;
  page: number;
  pageSize: number;
  pagos: {
    id: number;
    cuotaId: number;
    equipo: EquipoPago;
    concepto: ConceptoCuota;
    monto: string;
    fechaPago: string;
  }[];
};

export type RevisionPago = {
  id: number;
  estado: EstadoRevisionPago;
  monto: string;
  fechaPago: string;
  cuota: {
    id: number;
    temporadaId: number;
    equipo: EquipoPago;
    concepto: ConceptoCuota;
    montoTotal: string;
    saldo: string;
    disponible: string;
  };
  tieneComprobante: boolean;
  verificadoPor: string | null;
  verificadoEn: string | null;
  motivoRechazo: string | null;
};

export type PagoResuelto = Pick<RevisionPago, "id" | "verificadoPor" | "verificadoEn"> &
  Pick<RevisionPago["cuota"], "saldo" | "disponible"> & { estado: DecisionPago };
