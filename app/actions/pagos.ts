"use server";
import { obtenerSesion } from "@/app/actions/session";
import { equiposApi } from "@/lib/equipos-api";
import { validarPago } from "@/lib/pagos-validation";
import type { Equipo, Temporada, Resultado } from "@/types/equipos";
import type { CuotaPago, PagoRegistrado } from "@/types/pagos";
async function capitan() {
  const sesion = await obtenerSesion();
  return sesion.estado === "autenticado" && sesion.usuario.rol === "JUGADOR" ? sesion.usuario.capitaneaEquipoId : null;
}
export async function consultarCuotasPago(): Promise<Resultado<{ cuotas: CuotaPago[] }>> {
  const equipoId = await capitan();
  if (!equipoId) return { ok: false, status: 403, error: "No tienes permiso para ver esta página." };
  // AuthContext representa un equipo concreto; resolver su temporada sin asumir
  // que corresponde a la temporada marcada como actual.
  const temporadas = await equiposApi<Temporada[]>("JUGADOR", "temporadas");
  if (!temporadas.ok) return temporadas;
  for (const temporada of temporadas.data) {
    const equipo = await equiposApi<Equipo>("JUGADOR", `equipos/mi-equipo?temporadaId=${temporada.id}`);
    if (!equipo.ok) {
      if (equipo.status === 404) continue;
      return equipo;
    }
    if (equipo.data.id === equipoId)
      return equiposApi("JUGADOR", `equipos/${equipoId}/cuotas?temporadaId=${equipo.data.temporadaId}`);
  }
  return { ok: false, status: 404, error: "No se encontró la temporada del equipo que capitaneas." };
}
export async function registrarPago(cuotaId: number, datos: FormData, clave: string): Promise<Resultado<PagoRegistrado>> {
  if (!await capitan()) return { ok: false, status: 403, error: "No tienes permiso para ver esta página." };
  const archivo = datos.get("comprobante");
  const error = validarPago(String(datos.get("monto") ?? ""), String(datos.get("fechaPago") ?? ""), archivo instanceof File ? archivo : null);
  if (error || !Number.isSafeInteger(cuotaId) || cuotaId <= 0 || !/^[\w-]{16,100}$/.test(clave)) return { ok: false, status: 400, error: error ?? "Datos de pago inválidos." };
  const cuerpo = new FormData();
  for (const campo of ["monto", "fechaPago", "comprobante"]) cuerpo.set(campo, datos.get(campo)!);
  const resultado = await equiposApi<PagoRegistrado>("JUGADOR", `cuotas/${cuotaId}/pagos`, { method: "POST", headers: { "Idempotency-Key": clave }, body: cuerpo });
  if (resultado.ok && (resultado.data.estado !== "PENDIENTE" || !Number.isSafeInteger(resultado.data.id) || resultado.data.cuotaId !== cuotaId)) return { ok: false, status: 502, error: "No se pudo confirmar el registro. Reintenta con los mismos datos." };
  return resultado;
}
