"use client";
import { useCallback, useRef, useState } from "react";
import {
  cancelarPartido,
  catalogosCalendario,
  consultarCalendario,
  publicarJornada,
  temporadasCalendario,
} from "@/app/actions/calendario-organizador";
import { ErrorConsulta, MarcoEquipos } from "@/components/equipos/ui";
import { ConfirmacionCalendario } from "@/components/calendario/confirmacion";
import { FormularioGeneracion } from "@/components/calendario/formulario-generacion";
import { FormularioPartido } from "@/components/calendario/formulario-partido";
import { useConsulta } from "@/hooks/use-consulta";
import { mostrarFecha } from "@/lib/calendario-validation";
import type {
  JornadaOrganizador,
  PartidoOrganizador,
} from "@/types/calendario-organizador";

export function CalendarioOrganizador() {
  const consultar = useCallback(() => temporadasCalendario(), []);
  const { resultado, recargar } = useConsulta(consultar);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const bloqueo = useRef(false);
  function bloquear(valor: boolean) {
    if (valor && bloqueo.current) return false;
    bloqueo.current = valor;
    setOcupado(valor);
    return true;
  }
  const temporadaId =
    seleccion ??
    (resultado?.ok
      ? (resultado.data.find((t) => t.actual)?.id ?? resultado.data[0]?.id)
      : undefined);
  return (
    <MarcoEquipos titulo="Calendario del organizador">
      <p>
        Todos los horarios corresponden a El Salvador. Los partidos duran 90
        minutos.
      </p>
      {!resultado ? (
        <p role="status">Cargando temporadas...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : !resultado.data.length || !temporadaId ? (
        <p>No hay temporadas disponibles.</p>
      ) : (
        <>
          <label className="league-field" htmlFor="temporada-calendario">
            Temporada
            <select
              id="temporada-calendario"
              disabled={ocupado}
              value={temporadaId}
              onChange={(e) => setSeleccion(Number(e.target.value))}
            >
              {resultado.data.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <ContenidoTemporada
            key={temporadaId}
            temporadaId={temporadaId}
            ocupado={ocupado}
            bloquear={bloquear}
          />
        </>
      )}
    </MarcoEquipos>
  );
}
function ContenidoTemporada({
  temporadaId,
  ocupado,
  bloquear,
}: {
  temporadaId: number;
  ocupado: boolean;
  bloquear: (valor: boolean) => boolean;
}) {
  const consultaCatalogos = useCallback(
    () => catalogosCalendario(temporadaId),
    [temporadaId],
  );
  const consulta = useCallback(
    () => consultarCalendario(temporadaId),
    [temporadaId],
  );
  const catalogos = useConsulta(consultaCatalogos);
  const calendario = useConsulta(consulta);
  const [edicion, setEdicion] = useState<PartidoOrganizador | undefined>();
  const [cancelacion, setCancelacion] = useState<PartidoOrganizador | null>(
    null,
  );
  const [publicacion, setPublicacion] = useState<JornadaOrganizador | null>(
    null,
  );
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const lectura = calendario.resultado;
  const jornadas = lectura?.ok ? lectura.data.jornadas : [];
  const noGenerar =
    !lectura?.ok ||
    jornadas.some(
      (j) =>
        j.estado === "PUBLICADA" ||
        j.partidos.some((p) => p.estado !== "CANCELADO"),
    );
  async function cancelar() {
    if (!cancelacion || ocupado || !bloquear(true)) return;
    setError("");
    try {
      const res = await cancelarPartido(cancelacion.id);
      if (!res.ok) {
        setError(res.error);
        if (res.status === 409) calendario.recargar();
        return;
      }
      setCancelacion(null);
      setAviso("Partido cancelado.");
      if (edicion?.id === res.data.id) setEdicion(undefined);
      calendario.recargar();
    } catch {
      setError("No pudimos cancelar el partido. Intenta de nuevo.");
    } finally {
      bloquear(false);
    }
  }
  async function publicar() {
    if (!publicacion || ocupado || !bloquear(true)) return;
    setError("");
    try {
      const res = await publicarJornada(publicacion.id);
      if (!res.ok) {
        if (res.status === 409) {
          setPublicacion(null);
          setAviso("La jornada ya está publicada.");
          calendario.recargar();
          return;
        }
        setError(res.error);
        return;
      }
      setPublicacion(null);
      setAviso("Jornada publicada.");
      calendario.recargar();
    } catch {
      setError("No pudimos publicar la jornada. Intenta de nuevo.");
    } finally {
      bloquear(false);
    }
  }
  function actualizar() {
    setEdicion(undefined);
    setAviso("");
    calendario.recargar();
    catalogos.recargar();
  }
  return (
    <>
      <div className="league-row">
        <h2>Jornadas de la temporada</h2>
        <button disabled={ocupado} onClick={actualizar}>
          Actualizar calendario
        </button>
      </div>
      {aviso && <p role="status">{aviso}</p>}
      {!lectura ? (
        <p role="status">Cargando calendario...</p>
      ) : !lectura.ok ? (
        <ErrorConsulta
          mensaje={lectura.error}
          reintentar={calendario.recargar}
        />
      ) : !jornadas.length ? (
        <p>
          Aún no hay jornadas en esta temporada. Genera el calendario o agenda
          el primer partido.
        </p>
      ) : (
        <section className="league-stack" aria-label="Jornadas del calendario">
          {jornadas.map((j) => (
            <details
              key={j.id}
              className="league-card calendar-jornada"
              open={j.numero === jornadas[0].numero}
            >
              <summary>
                Jornada {j.numero} ·{" "}
                {j.estado === "BORRADOR" ? "Borrador" : "Publicada"} ·{" "}
                {j.partidos.filter((p) => p.estado !== "CANCELADO").length}{" "}
                partidos
              </summary>
              <div className="league-row">
                <p>
                  Estado de la jornada:{" "}
                  <strong>
                    {j.estado === "BORRADOR" ? "Borrador" : "Publicada"}
                  </strong>
                </p>
                {j.publicadaEn && (
                  <p>Publicada el {mostrarFecha(j.publicadaEn)}</p>
                )}
                {j.estado === "BORRADOR" && (
                  <button
                    disabled={
                      ocupado ||
                      !j.partidos.some((p) => p.estado !== "CANCELADO")
                    }
                    onClick={() => {
                      setPublicacion(j);
                      setError("");
                    }}
                  >
                    Publicar jornada {j.numero}
                  </button>
                )}
              </div>
              {!j.partidos.length ? (
                <p>Esta jornada no tiene partidos.</p>
              ) : (
                <ul
                  className="league-grid"
                  aria-label={`Partidos de la jornada ${j.numero}`}
                >
                  {j.partidos.map((p) => (
                    <li className="league-card" key={p.id}>
                      <h3>
                        {p.local.nombre} vs. {p.visitante.nombre}
                      </h3>
                      <p>Inicio: {mostrarFecha(p.inicio)}</p>
                      <p>Fin: {mostrarFecha(p.fin)}</p>
                      <p>Cancha: {p.cancha.nombre}</p>
                      <p>Árbitro: {p.arbitro.nombre}</p>
                      <p>
                        Estado:{" "}
                        {
                          {
                            PROGRAMADO: "Programado",
                            EN_CURSO: "En curso",
                            FINALIZADO: "Finalizado",
                            CANCELADO: "Cancelado",
                          }[p.estado]
                        }
                      </p>
                      {p.estado === "PROGRAMADO" && (
                        <div className="league-row">
                          <button
                            disabled={ocupado || !catalogos.resultado?.ok}
                            onClick={() => {
                              setEdicion(p);
                              setAviso("");
                            }}
                          >
                            Reprogramar partido {p.id}
                          </button>
                          <button
                            disabled={ocupado}
                            onClick={() => {
                              setCancelacion(p);
                              setError("");
                            }}
                          >
                            Cancelar partido {p.id}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </section>
      )}
      {!catalogos.resultado ? (
        <p role="status">Cargando equipos, canchas y árbitros...</p>
      ) : !catalogos.resultado.ok ? (
        <ErrorConsulta
          mensaje={catalogos.resultado.error}
          reintentar={catalogos.recargar}
        />
      ) : (
        <>
          {!catalogos.resultado.data.canchas.length && (
            <p className="league-warning">
              No hay canchas activas disponibles.
            </p>
          )}
          {!catalogos.resultado.data.arbitros.length && (
            <p className="league-warning">No hay árbitros disponibles.</p>
          )}
          {catalogos.resultado.data.equipos.length < 2 && (
            <p className="league-warning">
              Se necesitan al menos dos equipos inscritos para agendar un
              partido.
            </p>
          )}
          <FormularioGeneracion
            temporadaId={temporadaId}
            catalogos={catalogos.resultado.data}
            ocupado={ocupado}
            bloquear={bloquear}
            impedido={noGenerar}
            motivoBloqueo={
              !lectura?.ok
                ? "Es necesario consultar el calendario antes de generar uno nuevo."
                : "Esta temporada ya tiene partidos activos o jornadas publicadas."
            }
            alGenerar={(resumen) => {
              setAviso(
                `Calendario generado: ${resumen.partidos} partidos en ${resumen.jornadas} jornadas.`,
              );
              calendario.recargar();
            }}
          />
          <FormularioPartido
            key={edicion?.id ?? "nuevo"}
            temporadaId={temporadaId}
            catalogos={catalogos.resultado.data}
            partido={edicion}
            ocupado={ocupado}
            bloquear={bloquear}
            alCancelar={() => setEdicion(undefined)}
            alGuardar={() => {
              setAviso(edicion ? "Partido reprogramado." : "Partido agendado.");
              setEdicion(undefined);
              calendario.recargar();
            }}
          />
        </>
      )}
      {cancelacion && (
        <ConfirmacionCalendario
          titulo="Cancelar partido"
          ocupado={ocupado}
          confirmar={() => void cancelar()}
          cerrar={() => setCancelacion(null)}
        >
          <p>
            ¿Cancelar {cancelacion.local.nombre} vs.{" "}
            {cancelacion.visitante.nombre} de la jornada {cancelacion.jornada}?
          </p>
          {error && <ErrorConsulta mensaje={error} />}
        </ConfirmacionCalendario>
      )}
      {publicacion && (
        <ConfirmacionCalendario
          titulo={`Publicar jornada ${publicacion.numero}`}
          ocupado={ocupado}
          confirmar={() => void publicar()}
          cerrar={() => setPublicacion(null)}
        >
          <p>
            Los capitanes recibirán un aviso. ¿Publicar la jornada{" "}
            {publicacion.numero}?
          </p>
          {error && <ErrorConsulta mensaje={error} />}
        </ConfirmacionCalendario>
      )}
    </>
  );
}
