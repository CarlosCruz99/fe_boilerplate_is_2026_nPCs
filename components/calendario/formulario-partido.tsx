"use client";
import { useState, type FormEvent } from "react";
import {
  agendarPartido,
  reprogramarPartido,
} from "@/app/actions/calendario-organizador";
import { ErrorConsulta } from "@/components/equipos/ui";
import {
  camposInicio,
  fechaSalvador,
  finCalculado,
  inicioSalvador,
  validarPartido,
  validarReprogramacion,
} from "@/lib/calendario-validation";
import type {
  CatalogosCalendario,
  Partido,
} from "@/types/calendario-organizador";

export function FormularioPartido({
  temporadaId,
  catalogos,
  partido,
  ocupado,
  bloquear,
  alGuardar,
  alCancelar,
}: {
  temporadaId: number;
  catalogos: CatalogosCalendario;
  partido?: Partido;
  ocupado: boolean;
  bloquear: (valor: boolean) => boolean;
  alGuardar: (partido: Partido) => void;
  alCancelar: () => void;
}) {
  const inicial = partido
    ? camposInicio(partido.inicio)
    : { fecha: "", hora: "" };
  const [fecha, setFecha] = useState(inicial.fecha);
  const [hora, setHora] = useState(inicial.hora);
  const [local, setLocal] = useState(partido?.equipoLocalId ?? 0);
  const [visitante, setVisitante] = useState(partido?.equipoVisitanteId ?? 0);
  const [jornada, setJornada] = useState(partido?.jornada ?? 1);
  const [cancha, setCancha] = useState(partido?.canchaId ?? 0);
  const [arbitro, setArbitro] = useState(partido?.arbitroId ?? "");
  const [error, setError] = useState("");
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ocupado) return;
    const datos = {
      temporadaId,
      jornada,
      equipoLocalId: local,
      equipoVisitanteId: visitante,
      canchaId: cancha,
      arbitroId: arbitro,
      inicio: inicioSalvador(fecha, hora) ?? "",
    };
    const invalido = partido
      ? validarReprogramacion(datos)
      : validarPartido(datos);
    if (invalido) {
      setError(invalido);
      return;
    }
    if (!bloquear(true)) return;
    setError("");
    try {
      const res = partido
        ? await reprogramarPartido(partido.id, datos)
        : await agendarPartido(datos);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      alGuardar(res.data);
      if (!partido) {
        setFecha("");
        setHora("");
        setLocal(0);
        setVisitante(0);
        setCancha(0);
        setArbitro("");
      }
    } catch {
      setError("No pudimos guardar el partido. Intenta de nuevo.");
    } finally {
      bloquear(false);
    }
  }
  const nombre = (id: number) =>
    catalogos.equipos.find((e) => e.id === id)?.nombre ?? `Equipo ${id}`;
  return (
    <form
      className="league-card"
      onSubmit={guardar}
      aria-label={partido ? "Reprogramar partido" : "Agendar partido"}
    >
      <h2>{partido ? "Reprogramar partido" : "Agendar partido"}</h2>
      {error && <ErrorConsulta mensaje={error} />}
      <fieldset disabled={ocupado} className="league-stack">
        {partido ? (
          <p>
            Jornada {jornada} · {nombre(local)} vs. {nombre(visitante)}. Los
            equipos y la jornada se conservan.
          </p>
        ) : (
          <>
            <label className="league-field">
              Jornada
              <select
                value={jornada}
                onChange={(e) => setJornada(Number(e.target.value))}
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="league-field">
              Equipo local
              <select
                required
                value={local || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setLocal(id);
                  if (visitante === id) setVisitante(0);
                }}
              >
                <option value="">Selecciona un equipo</option>
                {catalogos.equipos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="league-field">
              Equipo visitante
              <select
                required
                value={visitante || ""}
                onChange={(e) => setVisitante(Number(e.target.value))}
              >
                <option value="">Selecciona un equipo</option>
                {catalogos.equipos
                  .filter((e) => e.id !== local)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
              </select>
            </label>
          </>
        )}
        <label className="league-field">
          Cancha
          <select
            required
            value={cancha || ""}
            onChange={(e) => setCancha(Number(e.target.value))}
          >
            <option value="">Selecciona una cancha</option>
            {partido &&
              !catalogos.canchas.some((c) => c.id === partido.canchaId) && (
                <option value={partido.canchaId} disabled>
                  Cancha anterior no disponible
                </option>
              )}
            {catalogos.canchas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="league-field">
          Árbitro
          <select
            required
            value={arbitro}
            onChange={(e) => setArbitro(e.target.value)}
          >
            <option value="">Selecciona un árbitro</option>
            {partido &&
              !catalogos.arbitros.some((a) => a.id === partido.arbitroId) && (
                <option value={partido.arbitroId} disabled>
                  Árbitro anterior no disponible
                </option>
              )}
            {catalogos.arbitros.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="calendar-fields">
          <label className="league-field">
            Fecha (El Salvador)
            <input
              required
              type="date"
              min={fechaSalvador()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </label>
          <label className="league-field">
            Hora (El Salvador)
            <input
              required
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </label>
        </div>
        <p aria-live="polite">
          Fin calculado (+90 min): {finCalculado(fecha, hora)}
        </p>
        <div className="league-row">
          <button
            className="league-primary"
            disabled={
              catalogos.equipos.length < 2 ||
              !catalogos.canchas.length ||
              !catalogos.arbitros.length
            }
          >
            {ocupado
              ? "Guardando..."
              : partido
                ? "Guardar cambios"
                : "Guardar partido"}
          </button>
          {partido && (
            <button type="button" onClick={alCancelar}>
              Cerrar edición
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
