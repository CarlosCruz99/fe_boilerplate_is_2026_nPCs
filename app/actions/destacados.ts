"use server";

import { calendarioApi } from "@/lib/calendario-api";
import type { Resultado, Temporada } from "@/types/equipos";
import type { ClasificacionDestacados, MetricaDestacados } from "@/types/destacados";

export async function temporadasDestacados(): Promise<Resultado<Temporada[]>> {
  return calendarioApi("temporadas", {}, "No se pudieron consultar las temporadas.");
}

export async function consultarDestacados(temporadaId: number, metrica: MetricaDestacados): Promise<Resultado<ClasificacionDestacados>> {
  if (!Number.isInteger(temporadaId) || temporadaId < 1 || temporadaId > 2147483647)
    return { ok: false, status: 400, error: "Selecciona una temporada válida." };
  if (metrica !== "goles" && metrica !== "asistencias")
    return { ok: false, status: 400, error: "Selecciona Goles o Asistencias." };
  return calendarioApi(`temporadas/${temporadaId}/jugadores-destacados?metrica=${metrica}`, {}, "No se pudo consultar la clasificación. Intenta nuevamente.");
}
