"use server";

import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { Resultado } from "@/types/equipos";
import type {
  ActualizacionMarcador,
  FinPartido,
  InicioPartido,
  MarcadorPartido,
  MesaPartido,
  ParticipantesPartido,
} from "@/types/partido-arbitro";

const idCorrecto = (id: number) => Number.isInteger(id) && id > 0 && id <= 2147483647;
const entero99 = (numero: number) => Number.isInteger(numero) && numero >= 0 && numero <= 99;
const invalido = (error: string): Resultado<never> => ({ ok: false, status: 400, error });

async function apiArbitro<T>(
  id: number,
  accion: string,
  metodo: "GET" | "POST" | "PUT" | "PATCH",
  body?: object,
): Promise<Resultado<T>> {
  if (!idCorrecto(id)) return invalido("El ID del partido debe ser un entero positivo válido.");

  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error") return { ok: false, status: 503, error: sesion.mensaje };
    if (sesion.estado !== "autenticado") return { ok: false, status: 401, error: "Inicia sesión nuevamente." };
    if (sesion.usuario.rol !== "ARBITRO") return { ok: false, status: 403, error: "Solo un árbitro puede acceder a esta vista." };

    const token = await getSession();
    if (!token) return { ok: false, status: 401, error: "La sesión expiró. Inicia sesión nuevamente." };

    const base = process.env.API_URL;
    if (!base) return { ok: false, status: 503, error: "El servicio no está disponible en este momento. Intenta más tarde." };

    const respuesta = await fetch(new URL(`partidos/${id}/${accion}`, base.replace(/\/?$/, "/")), {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });

    if (!respuesta.ok) {
      const contenido: unknown = await respuesta.json().catch(() => null);
      let mensaje = `No se pudo completar la operación (${respuesta.status}).`;
      if (contenido && typeof contenido === "object" && "message" in contenido) {
        const valor = (contenido as { message?: unknown }).message;
        if (typeof valor === "string") mensaje = valor;
        else if (Array.isArray(valor) && valor.every((item) => typeof item === "string")) mensaje = valor.join(" ");
      }
      return {
        ok: false,
        status: respuesta.status,
        error: respuesta.status >= 500 ? "Error del servidor. Intenta nuevamente." : mensaje,
      };
    }

    return { ok: true, data: (await respuesta.json()) as T };
  } catch {
    return {
      ok: false,
      status: 503,
      error: "No pudimos conectar con el servicio. Intenta nuevamente.",
    };
  }
}

export async function iniciarPartidoArbitro(id: number): Promise<Resultado<InicioPartido>> {
  return apiArbitro(id, "iniciar", "POST");
}

export async function actualizarMarcadorArbitro(
  id: number,
  marcador: MarcadorPartido,
): Promise<Resultado<ActualizacionMarcador>> {
  if (![marcador.golesLocal, marcador.golesVisitante, marcador.faltasLocal, marcador.faltasVisitante].every(entero99)) {
    return invalido("Los goles y las faltas deben ser enteros entre 0 y 99.");
  }
  return apiArbitro(id, "marcador", "PATCH", marcador);
}

export async function guardarParticipantesArbitro(
  id: number,
  jugadorIds: number[],
): Promise<Resultado<ParticipantesPartido>> {
  if (!Array.isArray(jugadorIds) || jugadorIds.length > 30 || !jugadorIds.every(idCorrecto) || new Set(jugadorIds).size !== jugadorIds.length) {
    return invalido("Debes ingresar hasta 30 IDs válidos, sin repetir.");
  }
  return apiArbitro(id, "participantes", "PUT", { jugadorIds });
}

export async function finalizarPartidoArbitro(id: number): Promise<Resultado<FinPartido>> {
  return apiArbitro(id, "finalizar", "POST");
}

export async function consultarMesaArbitro(id: number): Promise<Resultado<MesaPartido>> {
  return apiArbitro(id, "mesa", "GET");
}
