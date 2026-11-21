"use server";

import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { Resultado } from "@/types/equipos";
import type {
  EstadisticasPartido,
  RegistroEstadistica,
  CantidadesEstadistica,
} from "@/types/estadisticas-partido";

const idValido = (numero: number) => Number.isInteger(numero) && numero > 0 && numero <= 2147483647;
const cantidadValida = (numero: number) => Number.isInteger(numero) && numero >= 0 && numero <= 2147483647;

async function apiEstadisticas<T>(
  partidoId: number,
  jugadorId?: number,
  cantidades?: CantidadesEstadistica,
): Promise<Resultado<T>> {
  if (!idValido(partidoId) || (jugadorId !== undefined && !idValido(jugadorId))) {
    return { ok: false, status: 400, error: "El identificador del partido o jugador no es válido." };
  }
  if (cantidades && ![cantidades.goles, cantidades.asistencias, cantidades.tarjetas].every(cantidadValida)) {
    return { ok: false, status: 400, error: "Las estadísticas deben ser enteros no negativos." };
  }
  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error") return { ok: false, status: 503, error: sesion.mensaje };
    if (sesion.estado !== "autenticado") return { ok: false, status: 401, error: "Inicia sesión nuevamente." };
    if (sesion.usuario.rol !== "ARBITRO") return { ok: false, status: 403, error: "Esta pantalla es exclusiva para el árbitro asignado." };
    const token = await getSession();
    if (!token) return { ok: false, status: 401, error: "La sesión ha expirado." };
    const apiUrl = process.env.API_URL;
    if (!apiUrl) return { ok: false, status: 503, error: "El servicio no está disponible en este momento. Intenta más tarde." };

    const ruta = `partidos/${partidoId}/estadisticas${jugadorId === undefined ? "" : `/${jugadorId}`}`;
    const respuesta = await fetch(new URL(ruta, apiUrl.replace(/\/?$/, "/")), {
      method: cantidades ? "PUT" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(cantidades ? { "Content-Type": "application/json" } : {}),
      },
      ...(cantidades ? { body: JSON.stringify(cantidades) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!respuesta.ok) {
      const raw: unknown = await respuesta.json().catch(() => null);
      let mensaje = `No se pudo completar la operación (${respuesta.status}).`;
      if (raw && typeof raw === "object" && "message" in raw) {
        const valor = (raw as { message?: unknown }).message;
        if (typeof valor === "string") mensaje = valor;
        else if (Array.isArray(valor) && valor.every((v) => typeof v === "string")) mensaje = valor.join(" ");
      }
      if (respuesta.status >= 500) mensaje = "Ocurrió un error del servidor. Intenta nuevamente.";
      return { ok: false, status: respuesta.status, error: mensaje };
    }
    return { ok: true, data: (await respuesta.json()) as T };
  } catch {
    return { ok: false, status: 503, error: "No pudimos conectar con el servicio. Intenta nuevamente." };
  }
}

export async function consultarEstadisticasPartido(partidoId: number): Promise<Resultado<EstadisticasPartido>> {
  return apiEstadisticas(partidoId);
}

export async function guardarEstadisticaJugador(
  partidoId: number,
  jugadorId: number,
  cantidades: CantidadesEstadistica,
): Promise<Resultado<RegistroEstadistica>> {
  if (!cantidades || ![cantidades.goles, cantidades.asistencias, cantidades.tarjetas].every(cantidadValida)) {
    return { ok: false, status: 400, error: "Indica goles, asistencias y tarjetas válidos." };
  }
  return apiEstadisticas(partidoId, jugadorId, cantidades);
}
