"use server";
import { calendarioApi } from "@/lib/calendario-api";
import type { Resultado } from "@/types/equipos";
import type { ArbitrosDisponibles, ArbitroAsignado } from "@/types/asignacion-arbitro";
const idValido = (id: number) => Number.isSafeInteger(id) && id > 0 && id <= 2147483647;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function consultarArbitrosDisponibles(partidoId: number): Promise<Resultado<ArbitrosDisponibles>> {
  if (!idValido(partidoId)) return { ok: false, status: 400, error: "Partido inválido." };
  const resultado = await calendarioApi<ArbitrosDisponibles>(`partidos/${partidoId}/arbitros-disponibles`);
  if (resultado.ok && (resultado.data.partidoId !== partidoId || !Array.isArray(resultado.data.arbitros)))
    return { ok: false, status: 502, error: "No se pudieron confirmar los árbitros disponibles." };
  return resultado;
}
export async function asignarArbitro(partidoId: number, arbitroId: string): Promise<Resultado<ArbitroAsignado>> {
  if (!idValido(partidoId) || typeof arbitroId !== "string" || !uuid.test(arbitroId))
    return { ok: false, status: 400, error: "Selecciona un partido y un árbitro válidos." };
  const resultado = await calendarioApi<ArbitroAsignado>(`partidos/${partidoId}/arbitro`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ arbitroId }),
  }, "No pudimos confirmar la asignación. Actualiza el calendario antes de reintentar.");
  if (resultado.ok && (resultado.data.partidoId !== partidoId || resultado.data.arbitroId !== arbitroId || typeof resultado.data.arbitroNombre !== "string"))
    return { ok: false, status: 502, error: "El servidor no confirmó la asignación solicitada. Actualiza el calendario." };
  return resultado;
}
