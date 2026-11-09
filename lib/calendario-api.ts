import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { Resultado } from "@/types/equipos";

export function mensajeCalendario(
  body: Record<string, unknown>,
  fallback: string,
) {
  if (typeof body.faltan === "number" && typeof body.inscritos === "number")
    return `Faltan ${body.faltan} equipos inscritos para generar el calendario.`;
  if (typeof body.arbitros === "number" && typeof body.requeridos === "number")
    return `Se necesitan al menos ${body.requeridos} árbitros para generar el calendario.`;
  if (typeof body.message === "string") return body.message;
  if (
    Array.isArray(body.message) &&
    body.message.every((m) => typeof m === "string")
  )
    return body.message.join(" ");
  return fallback;
}
// H3 conserva los conflictos del calendario; no utiliza la traducción de 409 de H2.
export async function calendarioApi<T>(
  path: string,
  init: RequestInit = {},
  fallback = "No pudimos consultar los datos del calendario. Intenta de nuevo.",
): Promise<Resultado<T>> {
  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error")
      return { ok: false, status: 503, error: sesion.mensaje };
    if (sesion.estado !== "autenticado")
      return {
        ok: false,
        status: 401,
        error: "Tu sesión expiró. Inicia sesión nuevamente.",
      };
    if (sesion.usuario.rol !== "ORGANIZADOR")
      return {
        ok: false,
        status: 403,
        error: "No tienes permiso para esta acción.",
      };
    const token = await getSession();
    if (!token)
      return { ok: false, status: 401, error: "Inicia sesión nuevamente." };
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta API_URL");
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(new URL(path, base.replace(/\/?$/, "/")), {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const raw: unknown = await res.json().catch(() => ({}));
      const body =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      return {
        ok: false,
        status: res.status,
        error: res.status >= 500 ? fallback : mensajeCalendario(body, fallback),
      };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 503, error: fallback };
  }
}
