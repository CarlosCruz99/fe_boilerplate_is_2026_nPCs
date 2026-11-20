"use server";

import { calendarioApi } from "@/lib/calendario-api";
import type { Temporada } from "@/types/equipos";
import type { ReporteDeportivo } from "@/types/reporte-deportivo";

export async function temporadasReporteDeportivo() {
  return calendarioApi<Temporada[]>("temporadas", {}, "No pudimos consultar las temporadas.");
}

export async function consultarReporteDeportivo(temporadaId: number) {
  if (!Number.isInteger(temporadaId) || temporadaId < 1 || temporadaId > 2147483647) {
    return { ok: false, status: 400, error: "Selecciona una temporada válida." } as const;
  }

  return calendarioApi<ReporteDeportivo>(
    `temporadas/${temporadaId}/reporte-deportivo`,
    {},
    "No pudimos consultar los indicadores de la temporada.",
  );
}
