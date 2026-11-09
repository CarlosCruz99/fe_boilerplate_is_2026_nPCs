"use server";

import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type {
  CalendarioEquipo,
  DetallePartido,
  ResultadoCalendario,
} from "@/types/calendario";

async function consultarAPI<T>(ruta: string): Promise<ResultadoCalendario<T>> {
  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error") {
      return { ok: false, status: 503, error: sesion.mensaje };
    }
    if (sesion.estado !== "autenticado") {
      return { ok: false, status: 401, error: "Inicia sesión para consultar tu calendario." };
    }
    if (sesion.usuario.rol !== "JUGADOR") {
      return { ok: false, status: 403, error: "No tienes permiso para esta acción." };
    }
    const token = await getSession();
    if (!token) {
      return { ok: false, status: 401, error: "Tu sesión expiró. Inicia sesión nuevamente." };
    }
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta configurar API_URL");

    const respuesta = await fetch(new URL(ruta, base.replace(/\/?$/, "/")), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!respuesta.ok) {
      const cuerpo: { message?: string | string[]; codigo?: string } =
        await respuesta.json().catch(() => ({}));
      const mensaje = Array.isArray(cuerpo.message)
        ? cuerpo.message.join(" ")
        : cuerpo.message;
      return {
        ok: false,
        status: respuesta.status,
        codigo: cuerpo.codigo,
        error: cuerpo.codigo === "EQUIPO_NO_INSCRITO"
          ? "Tu equipo aún no está inscrito en la temporada."
          : typeof mensaje === "string"
            ? mensaje
            : `No pudimos completar la consulta (${respuesta.status}).`,
      };
    }
    return { ok: true, data: (await respuesta.json()) as T };
  } catch {
    return {
      ok: false,
      status: 503,
      error: "No pudimos conectar con el servidor. Intenta nuevamente.",
    };
  }
}

export async function obtenerMiCalendario(): Promise<ResultadoCalendario<CalendarioEquipo>> {
  const sesion = await obtenerSesion();
  if (sesion.estado === "error") {
    return { ok: false, status: 503, error: sesion.mensaje };
  }
  if (sesion.estado !== "autenticado") {
    return { ok: false, status: 401, error: "Inicia sesión para consultar tu calendario." };
  }
  if (sesion.usuario.rol !== "JUGADOR") {
    return { ok: false, status: 403, error: "No tienes permiso para esta acción." };
  }
  const id = sesion.usuario.equipoActualId;
  if (id === null) {
    return { ok: false, status: 404, codigo: "SIN_EQUIPO", error: "Aún no perteneces a un equipo en la temporada actual." };
  }
  return consultarAPI<CalendarioEquipo>(`equipos/${id}/partidos`);
}

export async function obtenerDetallePartido(id: number): Promise<ResultadoCalendario<DetallePartido>> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, status: 400, error: "Identificador de partido inválido." };
  }
  return consultarAPI<DetallePartido>(`partidos/${id}`);
}
