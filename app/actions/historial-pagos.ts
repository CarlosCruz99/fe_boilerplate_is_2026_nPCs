"use server";

import { apiHistorial, idHistorialValido, mensajeHistorial, sesionCapitanHistorial } from "@/lib/historial-pagos-api";
import type { Resultado, Temporada } from "@/types/equipos";
import type { ConceptoCuota } from "@/types/cuotas";
import type { HistorialPagos } from "@/types/historial-pagos";

export async function temporadasHistorialPagos(): Promise<Resultado<Temporada[]>> {
  const sesion = await sesionCapitanHistorial();
  if (!sesion.ok) return sesion;
  return apiHistorial("temporadas", sesion.data.token);
}

export async function consultarHistorialPagos(temporadaId: number, concepto?: ConceptoCuota): Promise<Resultado<HistorialPagos>> {
  if (!idHistorialValido(temporadaId) || (concepto !== undefined && concepto !== "INSCRIPCION" && concepto !== "ARBITRAJE"))
    return { ok: false, status: 400, error: mensajeHistorial(400) };
  const sesion = await sesionCapitanHistorial();
  if (!sesion.ok) return sesion;
  // El equipo actual no identifica al equipo representado en temporadas anteriores.
  const equipo = await apiHistorial<{ id: number; temporadaId: number }>(`equipos/mi-equipo?temporadaId=${temporadaId}`, sesion.data.token);
  if (!equipo.ok) return equipo;
  if (!equipo.data || !idHistorialValido(equipo.data.id) || equipo.data.temporadaId !== temporadaId)
    return { ok: false, status: 502, error: mensajeHistorial(502) };
  const query = new URLSearchParams({ temporadaId: String(temporadaId) });
  if (concepto) query.set("concepto", concepto);
  const resultado = await apiHistorial<HistorialPagos>(`equipos/${equipo.data.id}/pagos?${query}`, sesion.data.token);
  if (!resultado.ok) return resultado;
  const data = resultado.data;
  const dineroValido = (n: unknown) => typeof n === "string" && /^\d+\.\d{2}$/.test(n);
  if (!data || data.equipoId !== equipo.data.id || data.temporadaId !== temporadaId || data.concepto !== (concepto ?? null) ||
    !data.totales || ![data.totales.totalRegistrado, data.totales.totalVerificado, data.totales.pendienteVerificacion, data.totales.totalRechazado].every(dineroValido) ||
    !Array.isArray(data.pagos) || !data.pagos.every(p => p && idHistorialValido(p.id) && dineroValido(p.monto) &&
      ["INSCRIPCION", "ARBITRAJE"].includes(p.concepto) && (!concepto || p.concepto === concepto) && ["PENDIENTE", "VERIFICADO", "RECHAZADO"].includes(p.estado) &&
      typeof p.fechaPago === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.fechaPago) && Number.isFinite(Date.parse(p.fechaPago)) && typeof p.tieneComprobante === "boolean" && (p.motivoRechazo === null || typeof p.motivoRechazo === "string")))
    return { ok: false, status: 502, error: mensajeHistorial(502) };
  return resultado;
}
