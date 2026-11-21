"use client";
import Link from "next/link";
import { FixtureCard } from "@/components/calendario/fixture-card";
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
import { AsignacionArbitro } from "@/components/calendario/asignacion-arbitro";
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
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const lectura = calendario.resultado;
  const jornadas = lectura?.ok ? lectura.data.jornadas : [];
  const jornadaVisible = jornadas.find(j => j.id === jornadaSeleccionada) ?? jornadas[0];
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
        <section className="fixtures-panel" aria-label="Jornadas del calendario">
          <div className="fixtures-heading"><div><p className="fixture-kicker">LA LIGA, JORNADA A JORNADA</p><h2>PARTIDOS DE LA TEMPORADA</h2></div><span>HORARIO DE EL SALVADOR</span></div>
          <nav className="fixture-rounds" aria-label="Seleccionar jornada">
            {jornadas.map(j => <button key={j.id} type="button" aria-pressed={j.id === jornadaVisible.id} disabled={ocupado} onClick={() => setJornadaSeleccionada(j.id)}>
              Jornada {j.numero} · {j.estado === "BORRADOR" ? "Borrador" : "Publicada"} · {j.partidos.filter(p => p.estado !== "CANCELADO").length} partidos
            </button>)}
          </nav>
          <div className="fixture-round-info">
            <p>Estado de la jornada: <strong>{jornadaVisible.estado === "BORRADOR" ? "Borrador" : "Publicada"}</strong>{jornadaVisible.publicadaEn && ` · Publicada el ${mostrarFecha(jornadaVisible.publicadaEn)}`}</p>
            {jornadaVisible.estado === "BORRADOR" && <button disabled={ocupado || !jornadaVisible.partidos.some(p => p.estado !== "CANCELADO")} onClick={() => { setPublicacion(jornadaVisible); setError(""); }}>Publicar jornada {jornadaVisible.numero}</button>}
          </div>
          {!jornadaVisible.partidos.length ? <p>Esta jornada no tiene partidos.</p> : <ul className="fixtures-grid" aria-label={`Partidos de la jornada ${jornadaVisible.numero}`}>
            {jornadaVisible.partidos.map(p => <li key={p.id}>
              <FixtureCard id={p.id} inicio={p.inicio} local={p.local} visitante={p.visitante} cancha={p.cancha.nombre} estado={p.estado}
                footer={<AsignacionArbitro partidoId={p.id} estado={p.estado} actual={p.arbitro ?? null} ocupado={ocupado} bloquear={bloquear} guardado={datos => { setAviso(`Árbitro asignado: ${datos.arbitroNombre}.`); calendario.recargar(); }} />}>
                <Link href={`/partidos/${p.id}/galeria`}><span aria-hidden="true">▧</span> Galería</Link>
                {p.estado === "FINALIZADO" && <Link href={`/organizador/partidos/${p.id}/correccion-oficial`}>Corregir resultado</Link>}
                {p.estado === "PROGRAMADO" && <>
                  <button aria-label={`Reprogramar partido ${p.id}`} disabled={ocupado || !catalogos.resultado?.ok} onClick={() => { setEdicion(p); setAviso(""); document.getElementById("calendar-editor")?.scrollIntoView?.({ block: "start" }); }}><span aria-hidden="true">↗</span> Reprogramar</button>
                  <button aria-label={`Cancelar partido ${p.id}`} disabled={ocupado} onClick={() => { setCancelacion(p); setError(""); }}><span aria-hidden="true">×</span> Cancelar</button>
                </>}
              </FixtureCard>
            </li>)}
          </ul>}
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
          <div id="calendar-editor" className="league-stack">
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
          </div>
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
