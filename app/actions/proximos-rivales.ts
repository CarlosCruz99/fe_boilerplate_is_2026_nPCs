"use server";

import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { Resultado } from "@/types/equipos";
import type { ProximosRivales } from "@/types/proximos-rivales";

export async function consultarProximosRivales(): Promise<Resultado<ProximosRivales>> {
  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error") return { ok: false, status: 503, error: "No pudimos cargar tus próximos partidos. Intenta de nuevo." };
    if (sesion.estado !== "autenticado") return { ok: false, status: 401, error: "Inicia sesión nuevamente." };
    const { rol, capitaneaEquipoId } = sesion.usuario;
    if (rol !== "JUGADOR" || capitaneaEquipoId === null) return { ok: false, status: 403, error: "No tienes permiso para ver esta página." };
    const token = await getSession();
    if (!token) return { ok: false, status: 401, error: "Inicia sesión nuevamente." };
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta API_URL");
    // El equipo proviene de la sesión verificada, nunca del navegador.
    const respuesta = await fetch(new URL(`equipos/${capitaneaEquipoId}/proximos-partidos`, base.replace(/\/?$/, "/")), {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!respuesta.ok) return { ok: false, status: respuesta.status, error: respuesta.status === 401 ? "Inicia sesión nuevamente." : "No pudimos cargar tus próximos partidos. Intenta de nuevo." };
    const data = await respuesta.json() as ProximosRivales;
    if (data.equipoId !== capitaneaEquipoId) throw new Error("El equipo no coincide con la sesión");
    return { ok: true, data };
  } catch {
    return { ok: false, status: 503, error: "No pudimos cargar tus próximos partidos. Intenta de nuevo." };
  }
}
