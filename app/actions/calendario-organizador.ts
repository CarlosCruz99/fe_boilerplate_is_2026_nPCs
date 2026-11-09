"use server";
import { calendarioApi } from "@/lib/calendario-api";
import { idValido } from "@/lib/equipos-validation";
import {
  validarGeneracion,
  validarPartido,
  validarReprogramacion,
} from "@/lib/calendario-validation";
import type { PaginaEquipos, Resultado, Temporada } from "@/types/equipos";
import type {
  Arbitro,
  Cancha,
  CatalogosCalendario,
  CalendarioGenerado,
  CrearPartido,
  GenerarCalendario,
  Partido,
  ReprogramarPartido,
} from "@/types/calendario-organizador";

function invalido(error = "Revisa los datos ingresados."): Resultado<never> {
  return { ok: false, status: 400, error };
}
export async function temporadasCalendario() {
  return calendarioApi<Temporada[]>("temporadas");
}
export async function catalogosCalendario(
  temporadaId: number,
): Promise<Resultado<CatalogosCalendario>> {
  if (!idValido(temporadaId)) return invalido();
  const [canchas, arbitros, primera] = await Promise.all([
    calendarioApi<Cancha[]>("canchas?activa=true"),
    calendarioApi<Arbitro[]>("arbitros"),
    calendarioApi<PaginaEquipos>(
      `equipos?temporadaId=${temporadaId}&estado=INSCRITO&page=1&pageSize=50`,
    ),
  ]);
  if (!canchas.ok) return canchas;
  if (!arbitros.ok) return arbitros;
  if (!primera.ok) return primera;
  const equipos = [...primera.data.items];
  for (let page = 2; (page - 1) * 50 < primera.data.total; page++) {
    const siguiente = await calendarioApi<PaginaEquipos>(
      `equipos?temporadaId=${temporadaId}&estado=INSCRITO&page=${page}&pageSize=50`,
    );
    if (!siguiente.ok) return siguiente;
    equipos.push(...siguiente.data.items);
  }
  return {
    ok: true,
    data: {
      canchas: canchas.data.filter((c) => c.activa),
      arbitros: arbitros.data,
      equipos: equipos.filter((e) => e.estado === "INSCRITO"),
      totalInscritos: primera.data.total,
    },
  };
}
export async function generarCalendario(
  temporadaId: number,
  datos: GenerarCalendario,
) {
  if (!idValido(temporadaId)) return invalido();
  const error = validarGeneracion(datos);
  if (error) return invalido(error);
  const body = {
    fechaPrimeraJornada: datos.fechaPrimeraJornada,
    horaPrimerTurno: datos.horaPrimerTurno,
    canchaIds: datos.canchaIds,
    arbitroIds: datos.arbitroIds,
  };
  return calendarioApi<CalendarioGenerado>(
    `temporadas/${temporadaId}/calendario/generar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "No pudimos generar el calendario. Intenta de nuevo.",
  );
}
export async function agendarPartido(datos: CrearPartido) {
  const error = validarPartido(datos);
  if (error) return invalido(error);
  const {
    temporadaId,
    jornada,
    equipoLocalId,
    equipoVisitanteId,
    canchaId,
    arbitroId,
    inicio,
  } = datos;
  return calendarioApi<Partido>(
    "partidos",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temporadaId,
        jornada,
        equipoLocalId,
        equipoVisitanteId,
        canchaId,
        arbitroId,
        inicio,
      }),
    },
    "No pudimos guardar el partido. Intenta de nuevo.",
  );
}
export async function reprogramarPartido(
  id: number,
  datos: ReprogramarPartido,
) {
  if (!idValido(id)) return invalido();
  const error = validarReprogramacion(datos);
  if (error) return invalido(error);
  const { canchaId, arbitroId, inicio } = datos;
  return calendarioApi<Partido>(
    `partidos/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canchaId, arbitroId, inicio }),
    },
    "No pudimos guardar el partido. Intenta de nuevo.",
  );
}
export async function cancelarPartido(id: number) {
  if (!idValido(id)) return invalido();
  return calendarioApi<Partido>(
    `partidos/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "CANCELADO" }),
    },
    "No pudimos cancelar el partido. Intenta de nuevo.",
  );
}

export async function consultarCalendario(temporadaId: number) {
  if (!idValido(temporadaId)) return invalido();
  return calendarioApi<
    import("@/types/calendario-organizador").CalendarioTemporada
  >(`temporadas/${temporadaId}/calendario`);
}
export async function publicarJornada(id: number) {
  if (!idValido(id)) return invalido();
  return calendarioApi<
    import("@/types/calendario-organizador").JornadaPublicada
  >(
    `jornadas/${id}/publicar`,
    { method: "POST" },
    "No pudimos publicar la jornada. Intenta de nuevo.",
  );
}
