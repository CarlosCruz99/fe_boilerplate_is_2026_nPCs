"use server";

import { calendarioApi } from "@/lib/calendario-api";
import type { Temporada } from "@/types/equipos";
import type { FiltrosReportePagos, ReportePagos } from "@/types/reporte-pagos";

export async function temporadasReportePagos() {
  return calendarioApi<Temporada[]>("temporadas", {}, "No se pudieron consultar las temporadas.");
}

export async function consultarReportePagos(filtros: FiltrosReportePagos) {
  const { temporadaId, concepto, estado } = filtros;
  if (!Number.isInteger(temporadaId) || temporadaId < 1 || temporadaId > 2147483647) {
    return { ok: false, status: 400, error: "Selecciona una temporada válida." } as const;
  }
  if (!["TODOS", "INSCRIPCION", "ARBITRAJE"].includes(concepto) ||
      !["", "MOROSO", "CON_SALDO", "PAGADO", "SIN_CUOTAS"].includes(estado)) {
    return { ok: false, status: 400, error: "Selecciona un concepto y un estado válidos." } as const;
  }

  const query = new URLSearchParams({ temporadaId: String(temporadaId), concepto });
  if (estado) query.set("estado", estado);
  return calendarioApi<ReportePagos>(`reportes/pagos?${query}`, {}, "No pudimos consultar el reporte de pagos. Intenta nuevamente.");
}
