import { idValido } from "@/lib/equipos-validation";
import type {
  CrearPartido,
  GenerarCalendario,
  ReprogramarPartido,
} from "@/types/calendario-organizador";

export const ZONA_CALENDARIO = "America/El_Salvador";
export function fechaSalvador(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_CALENDARIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function fechaCivilValida(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const date = new Date(`${fecha}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === fecha
  );
}
export function horaValida(hora: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora);
}
export function inicioSalvador(fecha: string, hora: string) {
  if (!fechaCivilValida(fecha) || !horaValida(hora)) return null;
  return `${fecha}T${hora}:00-06:00`;
}
export function camposInicio(inicio: string) {
  const date = new Date(inicio);
  return {
    fecha: fechaSalvador(date),
    hora: new Intl.DateTimeFormat("en-GB", {
      timeZone: ZONA_CALENDARIO,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date),
  };
}
export function mostrarFecha(inicio: string) {
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: ZONA_CALENDARIO,
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(inicio));
}
export function finCalculado(fecha: string, hora: string) {
  const inicio = inicioSalvador(fecha, hora);
  return inicio
    ? mostrarFecha(
        new Date(new Date(inicio).getTime() + 90 * 60000).toISOString(),
      )
    : "Selecciona fecha y hora";
}
function uuidValido(id: string) {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  );
}
export function validarReprogramacion(datos: ReprogramarPartido) {
  if (!datos || typeof datos !== "object")
    return "Revisa los datos del partido.";
  if (!idValido(datos.canchaId)) return "Selecciona una cancha.";
  if (!uuidValido(datos.arbitroId)) return "Selecciona un árbitro.";
  if (
    typeof datos.inicio !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      datos.inicio,
    ) ||
    !Number.isFinite(Date.parse(datos.inicio)) ||
    Date.parse(datos.inicio) <= Date.now()
  )
    return "El inicio debe ser una fecha y hora futuras.";
  // Rechaza fechas civiles inexistentes que Date puede normalizar.
  if (!fechaCivilValida(datos.inicio.slice(0, 10)))
    return "Ingresa una fecha válida.";
  return null;
}
export function validarPartido(datos: CrearPartido) {
  if (!datos || typeof datos !== "object")
    return "Revisa los datos del partido.";
  if (!idValido(datos.temporadaId)) return "Selecciona una temporada.";
  if (!idValido(datos.jornada) || datos.jornada > 11)
    return "Selecciona una jornada del 1 al 11.";
  if (!idValido(datos.equipoLocalId) || !idValido(datos.equipoVisitanteId))
    return "Selecciona ambos equipos inscritos.";
  if (datos.equipoLocalId === datos.equipoVisitanteId)
    return "Elige dos equipos distintos.";
  return validarReprogramacion(datos);
}
export function validarGeneracion(datos: GenerarCalendario) {
  if (!datos || typeof datos !== "object")
    return "Revisa los datos de generación.";
  if (
    !fechaCivilValida(datos.fechaPrimeraJornada) ||
    datos.fechaPrimeraJornada <= fechaSalvador()
  )
    return "La primera jornada debe tener una fecha futura en El Salvador.";
  if (!horaValida(datos.horaPrimerTurno)) return "Selecciona una hora válida.";
  if (
    !Array.isArray(datos.canchaIds) ||
    !datos.canchaIds.length ||
    !datos.canchaIds.every(idValido) ||
    new Set(datos.canchaIds).size !== datos.canchaIds.length
  )
    return "Selecciona al menos una cancha activa, sin repetir.";
  if (
    !Array.isArray(datos.arbitroIds) ||
    !datos.arbitroIds.length ||
    !datos.arbitroIds.every(uuidValido) ||
    new Set(datos.arbitroIds.map((id) => id.toLowerCase())).size !==
      datos.arbitroIds.length
  )
    return "Selecciona al menos un árbitro, sin repetir.";
  const requeridos = Math.min(datos.canchaIds.length, 6);
  if (datos.arbitroIds.length < requeridos)
    return `Se necesitan al menos ${requeridos} árbitros para generar el calendario.`;
  return null;
}
