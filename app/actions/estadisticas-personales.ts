"use server";

import { equiposApi } from "@/lib/equipos-api";
import type { Resultado, Temporada } from "@/types/equipos";
import type { EstadisticasPersonales } from "@/types/estadisticas-personales";

const idValido = (id: number) => Number.isInteger(id) && id > 0 && id <= 2147483647;
const objeto = (valor: unknown): valor is Record<string, unknown> => Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
function cantidadesValidas(valor: unknown): boolean {
  return objeto(valor) && [valor.goles, valor.asistencias, valor.tarjetas].every(n => typeof n === "number" && Number.isSafeInteger(n) && n >= 0);
}
function respuestaValida(valor: unknown, temporadaId: number): valor is EstadisticasPersonales {
  return objeto(valor) && valor.temporadaId === temporadaId && cantidadesValidas(valor.acumulados) &&
    Array.isArray(valor.partidos) && valor.partidos.every(p => objeto(p) && typeof p.partidoId === "number" && idValido(p.partidoId) &&
      typeof p.fecha === "string" && Number.isFinite(Date.parse(p.fecha)) && typeof p.rival === "string" && cantidadesValidas(p));
}

export async function temporadasEstadisticasPersonales(): Promise<Resultado<Temporada[]>> {
  return equiposApi<Temporada[]>("JUGADOR", "temporadas");
}

export async function consultarEstadisticasPersonales(temporadaId: number): Promise<Resultado<EstadisticasPersonales>> {
  if (!idValido(temporadaId)) return { ok: false, status: 400, error: "Selecciona una temporada válida." };
  // BE-10.1 resuelve la ficha vinculada desde el token. No se envían IDs de jugador.
  const resultado = await equiposApi<unknown>("JUGADOR", `temporadas/${temporadaId}/mis-estadisticas`);
  if (!resultado.ok) return resultado;
  if (!respuestaValida(resultado.data, temporadaId))
    return { ok: false, status: 502, error: "No pudimos cargar tus estadísticas. Intenta de nuevo." };
  return { ok: true, data: resultado.data };
}
