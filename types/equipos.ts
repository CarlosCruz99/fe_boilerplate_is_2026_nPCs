export type EstadoEquipo = "PENDIENTE" | "INSCRITO" | "RECHAZADO";
export type Temporada = {
  id: number;
  nombre: string;
  actual: boolean;
  inscripcionAbierta: boolean;
};
export type Equipo = {
  id: number;
  nombre: string;
  temporadaId: number;
  capitanId: string;
  estado: EstadoEquipo;
  motivoRechazo?: string | null;
  totalJugadores?: number;
};
export type Resultado<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; fallas?: string[] };
