import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { Rol } from "@/types/auth";
import type { Resultado } from "@/types/equipos";

export async function equiposApi<T>(
  rol: Rol,
  path: string,
  init: RequestInit = {},
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
    if (sesion.usuario.rol !== rol)
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
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message;
      return {
        ok: false,
        status: res.status,
        error:
          body.codigo === "TEMPORADA_COMPLETA"
            ? "La temporada está completa."
            : res.status === 409 && rol === "ORGANIZADOR"
              ? "El equipo ya fue validado. Actualizamos los pendientes."
              : body.codigo === "REQUISITOS_NO_CUMPLIDOS"
                ? "El equipo no cumple los requisitos de inscripción."
                : typeof message === "string"
                  ? message
                  : `No pudimos completar la solicitud (${res.status}).`,
        fallas: Array.isArray(body.fallas)
          ? body.fallas.filter((f: unknown) => typeof f === "string")
          : undefined,
      };
    }
    return {
      ok: true,
      data: res.status === 204 ? (undefined as T) : ((await res.json()) as T),
    };
  } catch {
    return {
      ok: false,
      status: 503,
      error: "No pudimos conectar con el servidor. Intenta nuevamente.",
    };
  }
}
