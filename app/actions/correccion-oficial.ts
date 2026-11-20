"use server";

import { obtenerSesion } from "@/app/actions/session";
import { calendarioApi } from "@/lib/calendario-api";
import { idCorreccionValido, validarCorreccion } from "@/lib/correccion-oficial";
import type { ContextoCorreccion, CorreccionConfirmada, EntradaCorreccion, SolicitudCorreccion } from "@/types/correccion-oficial";
import type { EquipoDetalle, Resultado } from "@/types/equipos";
import type { MarcadorPublico } from "@/types/marcador-publico";

const errorLectura = "No pudimos cargar los datos de la corrección. Intenta nuevamente.";

function partidoInvalido(): Resultado<never> {
  return { ok: false, status: 400, error: "El identificador del partido no es válido." };
}

export async function consultarCorreccionOficial(id: number): Promise<Resultado<ContextoCorreccion>> {
  if (!idCorreccionValido(id)) return partidoInvalido();
  const sesion = await obtenerSesion();
  const marcador = await calendarioApi<MarcadorPublico>(`partidos/${id}/marcador`, {}, errorLectura, sesion);
  if (!marcador.ok) return marcador;
  if (marcador.data.estado !== "FINALIZADO") {
    return { ok: false, status: 409, error: "Solo puedes corregir un partido finalizado." };
  }

  const [local, visitante, historial] = await Promise.all([
    calendarioApi<EquipoDetalle>(`equipos/${marcador.data.local.equipoId}`, {}, errorLectura, sesion),
    calendarioApi<EquipoDetalle>(`equipos/${marcador.data.visitante.equipoId}`, {}, errorLectura, sesion),
    calendarioApi<EntradaCorreccion[]>(`partidos/${id}/correccion-oficial`, {}, errorLectura, sesion),
  ]);
  if (!local.ok) return local;
  if (!visitante.ok) return visitante;
  if (!historial.ok) return historial;

  const jugadores = [local.data, visitante.data].flatMap(equipo => equipo.jugadores.map(jugador => ({
    jugadorId: jugador.id,
    nombre: jugador.nombreCompleto,
    equipoId: equipo.id,
  })));
  return { ok: true, data: { marcador: marcador.data, jugadores, historial: historial.data } };
}

export async function aplicarCorreccionOficial(id: number, solicitud: SolicitudCorreccion): Promise<Resultado<CorreccionConfirmada>> {
  if (!idCorreccionValido(id)) return partidoInvalido();
  const error = solicitud && typeof solicitud === "object" ? validarCorreccion(solicitud) : "Envía los datos de la corrección.";
  if (error) return { ok: false, status: 400, error };

  const { motivo, golesLocal, golesVisitante, estadisticas } = solicitud;
  return calendarioApi<CorreccionConfirmada>(`partidos/${id}/correccion-oficial`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      motivo: motivo.trim(),
      golesLocal,
      golesVisitante,
      estadisticas: estadisticas?.map(({ jugadorId, goles, asistencias, tarjetas }) => ({ jugadorId, goles, asistencias, tarjetas })),
    }),
  }, "No pudimos confirmar el guardado. Consulta el marcador y la bitácora antes de volver a enviar.");
}
