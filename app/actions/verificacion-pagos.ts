"use server";

import { calendarioApi } from "@/lib/calendario-api";
import { idHistorialValido } from "@/lib/historial-pagos-api";
import type { Resultado } from "@/types/equipos";
import type { BandejaPagos, DecisionPago, PagoResuelto, RevisionPago } from "@/types/verificacion-pagos";

const errorRevision = "No pudimos consultar el pago. Intenta nuevamente.";

function invalido(error: string): Resultado<never> {
  return { ok: false, status: 400, error };
}

export async function listarPagosPendientes(page: number) {
  if (!idHistorialValido(page)) return invalido("La página solicitada no es válida.");
  return calendarioApi<BandejaPagos>(`pagos/pendientes?page=${page}`, {}, "No pudimos consultar los pagos pendientes.");
}

export async function consultarRevisionPago(id: number) {
  if (!idHistorialValido(id)) return invalido("El identificador del pago no es válido.");
  return calendarioApi<RevisionPago>(`pagos/${id}/revision`, {}, errorRevision);
}

export async function decidirPago(id: number, estado: DecisionPago, motivo?: string) {
  if (!idHistorialValido(id)) return invalido("El identificador del pago no es válido.");
  if (estado !== "VERIFICADO" && estado !== "RECHAZADO") return invalido("La decisión no es válida.");

  const texto = typeof motivo === "string" ? motivo.trim() : "";
  const longitud = Array.from(texto).length;
  if (estado === "RECHAZADO" && (longitud < 20 || longitud > 500 || texto.includes("\0"))) {
    return invalido("El motivo del rechazo debe tener entre 20 y 500 caracteres válidos.");
  }

  return calendarioApi<PagoResuelto>(`pagos/${id}/verificacion`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(estado === "RECHAZADO" ? { estado, motivo: texto } : { estado }),
  }, "No pudimos confirmar la decisión. Revisa el estado actualizado del pago.");
}
