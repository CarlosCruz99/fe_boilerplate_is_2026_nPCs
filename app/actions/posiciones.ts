"use server";

import type { Resultado } from "@/types/equipos";
import type { TablaPosiciones } from "@/types/posiciones";

export async function consultarPosiciones(): Promise<Resultado<TablaPosiciones>> {
  try {
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta API_URL");
    const respuesta = await fetch(new URL("posiciones", base.replace(/\/?$/, "/")), {
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!respuesta.ok) return { ok: false, status: respuesta.status, error: "No pudimos cargar la tabla. Intenta de nuevo." };
    return { ok: true, data: await respuesta.json() as TablaPosiciones };
  } catch {
    return { ok: false, status: 503, error: "No pudimos cargar la tabla. Intenta de nuevo." };
  }
}
