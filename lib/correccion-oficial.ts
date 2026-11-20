import type { SolicitudCorreccion } from "@/types/correccion-oficial";

export const limiteEstadistica = 2147483647;
export const camposEstadistica = [
  ["goles", "Goles"],
  ["asistencias", "Asistencias"],
  ["tarjetas", "Tarjetas"],
] as const;

export function cantidadValida(valor: unknown, maximo: number): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= maximo;
}

export function idCorreccionValido(id: unknown): id is number {
  return cantidadValida(id, limiteEstadistica) && id > 0;
}

export function validarCorreccion(solicitud: SolicitudCorreccion): string | null {
  const { motivo, golesLocal, golesVisitante, estadisticas } = solicitud;
  const longitud = typeof motivo === "string" ? Array.from(motivo.trim()).length : 0;
  if (longitud < 20 || longitud > 500 || motivo.includes("\0")) {
    return "El motivo debe tener entre 20 y 500 caracteres válidos.";
  }

  const incluyeMarcador = golesLocal !== undefined || golesVisitante !== undefined;
  if (incluyeMarcador && (!cantidadValida(golesLocal, 99) || !cantidadValida(golesVisitante, 99))) {
    return "Ingresa ambos goles del marcador como enteros entre 0 y 99.";
  }

  if (estadisticas !== undefined && (!Array.isArray(estadisticas) || !estadisticas.length ||
    estadisticas.some(fila => !fila || !idCorreccionValido(fila.jugadorId) ||
      camposEstadistica.some(([campo]) => !cantidadValida(fila[campo], limiteEstadistica))))) {
    return "Selecciona un jugador e ingresa goles, asistencias y tarjetas como enteros no negativos.";
  }

  if (estadisticas && new Set(estadisticas.map(fila => fila.jugadorId)).size !== estadisticas.length) {
    return "Cada jugador puede aparecer una sola vez en la corrección.";
  }

  return incluyeMarcador || estadisticas?.length ? null : "Cambia el marcador o agrega una corrección de estadísticas.";
}
