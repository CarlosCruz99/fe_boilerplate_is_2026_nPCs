"use server";

import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { Aviso, ConteoAvisos, PaginaAvisos, ResultadoAvisos } from "@/types/avisos";

async function apiAvisos<T>(ruta: string, method: "GET" | "PATCH" = "GET"): Promise<ResultadoAvisos<T>> {
  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error") return { ok: false, status: 503, error: sesion.mensaje };
    if (sesion.estado !== "autenticado") return { ok: false, status: 401, error: "Inicia sesión para consultar tus avisos." };
    if (sesion.usuario.rol !== "JUGADOR") return { ok: false, status: 403, error: "No tienes permiso para consultar avisos." };
    const token = await getSession();
    if (!token) return { ok: false, status: 401, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
    const base = process.env.API_URL;
    if (!base) throw new Error("API_URL sin configurar");
    const respuesta = await fetch(new URL(ruta, base.replace(/\/?$/, "/")), {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!respuesta.ok) {
      const cuerpo: { message?: string | string[] } = await respuesta.json().catch(() => ({}));
      const texto = Array.isArray(cuerpo.message) ? cuerpo.message.join(" ") : cuerpo.message;
      return { ok: false, status: respuesta.status, error: texto || `No pudimos completar la operación (${respuesta.status}).` };
    }
    return { ok: true, data: (await respuesta.json()) as T };
  } catch {
    return { ok: false, status: 503, error: "No pudimos conectar con el servidor. Intenta nuevamente." };
  }
}

export async function listarMisAvisos(pagina = 1): Promise<ResultadoAvisos<PaginaAvisos>> {
  if (!Number.isSafeInteger(pagina) || pagina < 1) return { ok: false, status: 400, error: "Página inválida." };
  return apiAvisos<PaginaAvisos>(`avisos?pagina=${pagina}&limite=20`);
}
export async function contarMisAvisosNoLeidos(): Promise<ResultadoAvisos<ConteoAvisos>> {
  return apiAvisos<ConteoAvisos>("avisos/no-leidos/conteo");
}
export async function obtenerMiAviso(id: number): Promise<ResultadoAvisos<Aviso>> {
  if (!Number.isSafeInteger(id) || id < 1) return { ok: false, status: 400, error: "Aviso inválido." };
  return apiAvisos<Aviso>(`avisos/${id}`);
}
export async function marcarMiAvisoLeido(id: number): Promise<ResultadoAvisos<{ id: number; leidoEn: string }>> {
  if (!Number.isSafeInteger(id) || id < 1) return { ok: false, status: 400, error: "Aviso inválido." };
  return apiAvisos<{ id: number; leidoEn: string }>(`avisos/${id}/leido`, "PATCH");
}
