import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { Resultado } from "@/types/equipos";

export function mensajeHistorial(status: number): string {
  if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permiso para ver esta página.";
  if (status === 400 || status === 422) return "Revisa la temporada y el concepto seleccionados.";
  if (status === 404) return "El recurso solicitado no está disponible.";
  return "No pudimos cargar el historial de pagos. Intenta de nuevo.";
}
export const idHistorialValido = (id: number) => Number.isInteger(id) && id > 0 && id <= 2147483647;

export async function sesionCapitanHistorial(): Promise<Resultado<{ token: string }>> {
  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error") return { ok: false, status: 503, error: mensajeHistorial(503) };
    if (sesion.estado !== "autenticado") return { ok: false, status: 401, error: mensajeHistorial(401) };
    if (sesion.usuario.rol !== "JUGADOR" || sesion.usuario.capitaneaEquipoId === null)
      return { ok: false, status: 403, error: mensajeHistorial(403) };
    const token = await getSession();
    return token ? { ok: true, data: { token } } : { ok: false, status: 401, error: mensajeHistorial(401) };
  } catch {
    return { ok: false, status: 503, error: mensajeHistorial(503) };
  }
}

export async function apiHistorial<T>(ruta: string, token: string): Promise<Resultado<T>> {
  try {
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta API_URL");
    const respuesta = await fetch(new URL(ruta, base.replace(/\/?$/, "/")), {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!respuesta.ok) return { ok: false, status: respuesta.status, error: mensajeHistorial(respuesta.status) };
    return { ok: true, data: await respuesta.json() as T };
  } catch {
    return { ok: false, status: 503, error: mensajeHistorial(503) };
  }
}
