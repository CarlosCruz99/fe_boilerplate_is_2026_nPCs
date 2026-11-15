"use server";

import { calendarioApi } from "@/lib/calendario-api";
import type { Resultado, EquipoResumen, PaginaEquipos, Temporada } from "@/types/equipos";
import type { CalendarioTemporada } from "@/types/calendario-organizador";
import type { CuotaCreada, NuevaCuota } from "@/types/cuotas";

const idValido = (id: number) => Number.isSafeInteger(id) && id > 0 && id <= 2147483647;
const errorValidacion = (error: string): Resultado<never> => ({ ok: false, status: 400, error });

export async function temporadasParaCuotas(): Promise<Resultado<Temporada[]>> {
  return calendarioApi<Temporada[]>("temporadas", {}, "No se pudieron consultar las temporadas.");
}

export async function equiposParaCuotas(temporadaId: number): Promise<Resultado<EquipoResumen[]>> {
  if (!idValido(temporadaId)) return errorValidacion("Selecciona una temporada válida.");
  const ruta = (pagina: number) => `equipos?temporadaId=${temporadaId}&estado=INSCRITO&page=${pagina}&pageSize=50`;
  const primera = await calendarioApi<PaginaEquipos>(ruta(1), {}, "No se pudieron cargar los equipos inscritos.");
  if (!primera.ok) return primera;
  const equipos = [...primera.data.items];
  const totalPaginas = Math.ceil(primera.data.total / 50);
  for (let pagina = 2; pagina <= totalPaginas; pagina++) {
    const siguiente = await calendarioApi<PaginaEquipos>(ruta(pagina), {}, "No se pudieron cargar todos los equipos.");
    if (!siguiente.ok) return siguiente;
    equipos.push(...siguiente.data.items);
  }
  return { ok: true, data: equipos.filter((equipo) => equipo.estado === "INSCRITO") };
}

export async function partidosParaCuotas(temporadaId: number): Promise<Resultado<CalendarioTemporada>> {
  if (!idValido(temporadaId)) return errorValidacion("Selecciona una temporada válida.");
  return calendarioApi<CalendarioTemporada>(
    `temporadas/${temporadaId}/calendario`, {}, "No se pudieron consultar los partidos de esta temporada.",
  );
}

function fechaCivilSalvador(): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/El_Salvador", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const obtener = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

export async function crearCuota(datos: NuevaCuota): Promise<Resultado<CuotaCreada>> {
  if (!idValido(datos.temporadaId) || !idValido(datos.equipoId))
    return errorValidacion("Selecciona una temporada y un equipo inscrito.");
  if (datos.concepto !== "INSCRIPCION" && datos.concepto !== "ARBITRAJE")
    return errorValidacion("Selecciona un concepto de cuota válido.");
  if (!/^(?:0*[0-9]{1,6})(?:\.[0-9]{1,2})?$/.test(datos.monto) ||
      Number(datos.monto) <= 0 || Number(datos.monto) > 100000)
    return errorValidacion("El monto debe ser mayor que $0 y no superar $100,000.00, con máximo dos decimales.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaVencimiento) || datos.fechaVencimiento < fechaCivilSalvador())
    return errorValidacion("La fecha de vencimiento debe ser hoy o posterior, según El Salvador.");
  if (datos.concepto === "ARBITRAJE" && !idValido(datos.partidoId ?? 0))
    return errorValidacion("Para arbitraje debes seleccionar un partido válido.");
  if (datos.concepto === "INSCRIPCION" && datos.partidoId !== undefined)
    return errorValidacion("Las cuotas de inscripción no admiten partido.");

  return calendarioApi<CuotaCreada>(
    "cuotas",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) },
    "No se pudo registrar la cuota. Verifica la conexión con el servidor antes de reintentar.",
  );
}
