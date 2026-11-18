"use server";

import { getSession } from "@/lib/session";
import type { Resultado } from "@/types/equipos";
import type { EquipoPublico, FiltrosPartidos, ListadoPartidos, MarcadorPublico } from "@/types/marcador-publico";

const idValido = (id: number) => Number.isInteger(id) && id > 0 && id <= 2147483647;
const errorLista = "No pudimos cargar los partidos. Intenta de nuevo.";
const errorMarcador = "No pudimos cargar el marcador. Intenta de nuevo.";

// La sesión es opcional. El backend decide si puede mostrar jornadas BORRADOR.
async function consultaPublica<T>(ruta: string, mensaje: string): Promise<Resultado<T>> {
  try {
    const token = await getSession();
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta API_URL");
    const respuesta = await fetch(new URL(ruta, base.replace(/\/?$/, "/")), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store", signal: AbortSignal.timeout(30000),
    });
    if (!respuesta.ok) return { ok: false, status: respuesta.status, error: mensaje };
    return { ok: true, data: await respuesta.json() as T };
  } catch {
    return { ok: false, status: 503, error: mensaje };
  }
}

export async function listarPartidosPublicos(filtros: FiltrosPartidos = {}): Promise<Resultado<ListadoPartidos>> {
  const page = filtros.page ?? 1;
  if (!idValido(page) || (page - 1) * 20 > 2147483647 ||
    (filtros.equipoId !== undefined && !idValido(filtros.equipoId)) ||
    (filtros.estado !== undefined && !["EN_CURSO", "FINALIZADO", "PROGRAMADO"].includes(filtros.estado)))
    return { ok: false, status: 400, error: "Los filtros no son válidos." };
  const query = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (filtros.estado) query.set("estado", filtros.estado);
  if (filtros.equipoId) query.set("equipoId", String(filtros.equipoId));
  return consultaPublica(`partidos?${query}`, errorLista);
}

export async function equiposPartidosPublicos(): Promise<Resultado<EquipoPublico[]>> {
  // No existe catálogo público de equipos. Recorrer todas las páginas evita
  // limitar el selector a los equipos de la página o del filtro actual.
  const equipos = new Map<number, EquipoPublico>();
  let page = 1;
  let total = 0;
  do {
    const respuesta = await consultaPublica<ListadoPartidos>(`partidos?page=${page}&pageSize=50`, errorLista);
    if (!respuesta.ok) return respuesta;
    for (const partido of respuesta.data.partidos) {
      for (const equipo of [partido.local, partido.visitante])
        equipos.set(equipo.id, { id: equipo.id, nombre: equipo.nombre });
    }
    total = respuesta.data.total;
    if (!respuesta.data.partidos.length) break;
    page++;
  } while ((page - 1) * 50 < total);
  return { ok: true, data: [...equipos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")) };
}

export async function consultarMarcadorPublico(id: number): Promise<Resultado<MarcadorPublico>> {
  if (!idValido(id)) return { ok: false, status: 404, error: "El partido no existe." };
  const resultado = await consultaPublica<MarcadorPublico>(`partidos/${id}/marcador`, errorMarcador);
  if (!resultado.ok && resultado.status === 404) return { ...resultado, error: "El partido no existe." };
  if (!resultado.ok && resultado.status === 409) return { ...resultado, error: "Este partido aún no comienza." };
  return resultado;
}
