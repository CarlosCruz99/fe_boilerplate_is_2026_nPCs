export type ConceptoCuota = "INSCRIPCION" | "ARBITRAJE";

export type NuevaCuota = {
  temporadaId: number;
  equipoId: number;
  concepto: ConceptoCuota;
  monto: string;
  fechaVencimiento: string;
  partidoId?: number;
};

export type CuotaCreada = NuevaCuota & {
  id: number;
  partidoId: number | null;
  advertencia?: string;
};
