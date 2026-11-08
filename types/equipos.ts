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
export type Jugador = {
  id: number;
  nombreCompleto: string;
  fechaNacimiento: string;
  identificacion: string;
  fotoUrl: string;
};
// Contrato de consulta-equipos.dto.ts del backend.
export type EquipoResumen = {
  id: number;
  nombre: string;
  estado: EstadoEquipo;
  nombreCapitan: string;
  totalJugadores: number;
  creadoEn: string;
};
export type JugadorDetalle = Pick<
  Jugador,
  "id" | "nombreCompleto" | "fotoUrl"
> & {
  edad: number;
};
export type EquipoDetalle = EquipoResumen & {
  temporadaId: number;
  capitanId: string;
  motivoRechazo: string | null;
  jugadores: JugadorDetalle[];
};
export type ValidacionEquipo = {
  id: number;
  estado: EstadoEquipo;
  validadoPor: string;
  fechaValidacion: string;
  motivoRechazo: string | null;
};
export type PaginaEquipos = {
  items: EquipoResumen[];
  total: number;
  page: number;
  pageSize: number;
};
export type Resultado<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; fallas?: string[] };
