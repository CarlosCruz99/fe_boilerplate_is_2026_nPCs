"use server";

import { enteroPositivoGaleria, solicitarGaleria } from "@/lib/galeria-consulta-api";
import type { PaginaGaleria } from "@/types/galeria";
import type { Resultado } from "@/types/equipos";

export async function consultarGaleria(id: string, pagina: string): Promise<Resultado<PaginaGaleria>> {
  if (!enteroPositivoGaleria(id) || !enteroPositivoGaleria(pagina)) {
    return { ok: false, status: 400, error: "El partido o la página no son válidos." };
  }

  const respuesta = await solicitarGaleria(`partidos/${id}/galeria?page=${pagina}`);
  switch (respuesta.status) {
    case 401:
      return { ok: false, status: 401, error: "Tu sesión expiró. Inicia sesión nuevamente." };
    case 403:
      return { ok: false, status: 403, error: "No tienes acceso a la galería de este partido." };
    case 404:
      return { ok: false, status: 404, error: "El partido no está disponible." };
  }
  if (respuesta.ok) {
    const data: PaginaGaleria | null = await respuesta.json().catch(() => null);
    if (Array.isArray(data?.items)) return { ok: true, data };
  }
  return { ok: false, status: 503, error: "No pudimos cargar la galería. Intenta nuevamente." };
}
