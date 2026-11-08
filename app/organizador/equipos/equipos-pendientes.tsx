"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  consultarDetalle,
  listarPendientes,
  listarTemporadas,
  validarEquipo,
} from "@/app/actions/equipos";
import {
  ErrorConsulta,
  FotoJugador,
  MarcoEquipos,
  SelectorTemporada,
} from "@/components/equipos/ui";
import { useConsulta } from "@/hooks/use-consulta";
import type { EquipoDetalle, Resultado } from "@/types/equipos";

export function EquiposPendientes() {
  const consulta = useCallback(() => listarTemporadas("ORGANIZADOR"), []);
  const { resultado, recargar } = useConsulta(consulta);
  const [temporada, setTemporada] = useState<number | null>(null);
  return (
    <MarcoEquipos titulo="Validar inscripciones">
      {!resultado ? (
        <p role="status">Cargando temporadas...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : !resultado.data.length ? (
        <p>No hay temporadas disponibles.</p>
      ) : (
        <>
          <SelectorTemporada
            temporadas={resultado.data}
            value={temporada ?? resultado.data[0].id}
            onChange={setTemporada}
          />
          <ListaPendientes
            key={temporada ?? resultado.data[0].id}
            temporadaId={temporada ?? resultado.data[0].id}
          />
        </>
      )}
    </MarcoEquipos>
  );
}
function ListaPendientes({ temporadaId }: { temporadaId: number }) {
  const [page, setPage] = useState(1);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [aviso, setAviso] = useState("");
  const consulta = useCallback(
    () => listarPendientes(temporadaId, page),
    [temporadaId, page],
  );
  const { resultado, recargar } = useConsulta(consulta);
  // Si otro organizador vació la página, regresamos a una página existente.
  const total = resultado?.ok ? resultado.data.total : null;
  useEffect(() => {
    if (total !== null && page > Math.max(1, Math.ceil(total / 20))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(Math.max(1, Math.ceil(total / 20)));
    }
  }, [total, page]);
  function decidido(mensaje: string) {
    setSeleccion(null);
    setAviso(mensaje);
    recargar();
  }
  return (
    <>
      {aviso && <p role="status">{aviso}</p>}
      {!resultado ? (
        <p role="status">Cargando equipos pendientes...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : (
        <>
          <p>{resultado.data.total} equipos pendientes</p>
          {!resultado.data.items.length ? (
            <p>No hay equipos pendientes en esta temporada.</p>
          ) : (
            <ul className="league-grid">
              {resultado.data.items.map((e) => (
                <li key={e.id} className="league-card">
                  <h2>{e.nombre}</h2>
                  <p>Capitán: {e.nombreCapitan}</p>
                  <p>{e.totalJugadores} jugadores</p>
                  <p>
                    Solicitud:{" "}
                    {new Date(e.creadoEn).toLocaleDateString("es-SV", {
                      timeZone: "America/El_Salvador",
                    })}
                  </p>
                  <button onClick={() => setSeleccion(e.id)}>
                    Revisar {e.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <nav aria-label="Paginación" className="league-row">
            <button
              disabled={page <= 1}
              onClick={() => {
                setSeleccion(null);
                setPage((p) => p - 1);
              }}
            >
              Anterior
            </button>
            <span>
              Página {page} de{" "}
              {Math.max(1, Math.ceil(resultado.data.total / 20))}
            </span>
            <button
              disabled={page * 20 >= resultado.data.total}
              onClick={() => {
                setSeleccion(null);
                setPage((p) => p + 1);
              }}
            >
              Siguiente
            </button>
          </nav>
        </>
      )}
      <button
        onClick={() => {
          setSeleccion(null);
          recargar();
        }}
      >
        Actualizar pendientes
      </button>
      {seleccion !== null && (
        <DetalleEquipo
          key={seleccion}
          id={seleccion}
          alDecidir={decidido}
          alCerrar={() => setSeleccion(null)}
        />
      )}
    </>
  );
}
function DetalleEquipo({
  id,
  alDecidir,
  alCerrar,
}: {
  id: number;
  alDecidir: (mensaje: string) => void;
  alCerrar: () => void;
}) {
  const consulta = useCallback(() => consultarDetalle(id), [id]);
  const { resultado, recargar } = useConsulta(consulta);
  const [dialogo, setDialogo] = useState<"APROBAR" | "RECHAZAR" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<Extract<
    Resultado<never>,
    { ok: false }
  > | null>(null);
  async function decidir() {
    if (!dialogo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await validarEquipo(id, dialogo, motivo);
      if (!res.ok) {
        if (res.status === 409) {
          alDecidir(res.error);
          return;
        }
        setError(res);
        return;
      }
      alDecidir(
        dialogo === "APROBAR"
          ? "Equipo inscrito correctamente."
          : "Equipo rechazado. El capitán puede consultar el motivo.",
      );
    } catch {
      setError({
        ok: false,
        status: 503,
        error: "No pudimos enviar la decisión. Intenta nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  }
  return (
    <section className="league-card" aria-label="Detalle del equipo">
      <button onClick={alCerrar} disabled={enviando}>
        Cerrar detalle
      </button>
      {!resultado ? (
        <p role="status">Cargando detalle...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : (
        <>
          <DatosDetalle equipo={resultado.data} />
          {resultado.data.estado === "PENDIENTE" ? (
            <div className="league-row">
              <button
                className="league-primary"
                disabled={enviando}
                onClick={() => {
                  setError(null);
                  setDialogo("APROBAR");
                }}
              >
                Aprobar
              </button>
              <button
                disabled={enviando}
                onClick={() => {
                  setError(null);
                  setDialogo("RECHAZAR");
                }}
              >
                Rechazar
              </button>
            </div>
          ) : (
            <p>El equipo ya fue validado: {resultado.data.estado}.</p>
          )}
        </>
      )}
      {dialogo && (
        <DialogoDecision
          decision={dialogo}
          motivo={motivo}
          setMotivo={setMotivo}
          enviando={enviando}
          cerrar={() => setDialogo(null)}
          confirmar={() => void decidir()}
          error={error}
        />
      )}
    </section>
  );
}
function DatosDetalle({ equipo }: { equipo: EquipoDetalle }) {
  return (
    <>
      <h2>{equipo.nombre}</h2>
      <p>Capitán: {equipo.nombreCapitan}</p>
      <p>{equipo.jugadores.length} jugadores</p>
      {equipo.jugadores.length < 7 && (
        <p className="league-warning">
          Plantilla incompleta: se necesitan al menos 7 jugadores.
        </p>
      )}
      <ul className="league-grid w-full">
        {equipo.jugadores.map((j) => (
          <li className="league-card" key={j.id}>
            <FotoJugador nombre={j.nombreCompleto} url={j.fotoUrl} />
            <h3>{j.nombreCompleto}</h3>
            <p>
              {j.edad === undefined ? "Edad no disponible" : `${j.edad} años`}
            </p>
            {j.edad !== undefined && j.edad < 16 && (
              <p className="league-warning">Menor de 16 años</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
function DialogoDecision({
  decision,
  motivo,
  setMotivo,
  enviando,
  cerrar,
  confirmar,
  error,
}: {
  decision: "APROBAR" | "RECHAZAR";
  motivo: string;
  setMotivo: (v: string) => void;
  enviando: boolean;
  cerrar: () => void;
  confirmar: () => void;
  error: Extract<Resultado<never>, { ok: false }> | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const rechazo = decision === "RECHAZAR";
  return (
    <dialog
      ref={ref}
      className="league-modal"
      aria-labelledby="decision-titulo"
      onCancel={(e) => {
        e.preventDefault();
        if (!enviando) cerrar();
      }}
    >
      <form
        className="league-stack"
        onSubmit={(e) => {
          e.preventDefault();
          confirmar();
        }}
      >
        <h2 id="decision-titulo">
          {rechazo ? "Rechazar inscripción" : "Aprobar inscripción"}
        </h2>
        {rechazo ? (
          <>
            <label className="league-field">
              Motivo del rechazo
              <textarea
                autoFocus
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={500}
                rows={5}
                required
                disabled={enviando}
                aria-describedby="motivo-contador"
              />
            </label>
            <p id="motivo-contador" aria-live="polite">
              {motivo.trim().length} / 500 caracteres · Mínimo 20
            </p>
          </>
        ) : (
          <p>
            ¿Confirmas que deseas inscribir a este equipo? El servidor
            comprobará los requisitos y el cupo de la temporada.
          </p>
        )}
        {error && (
          <div role="alert" className="league-alert">
            <p>{error.error}</p>
            {error.fallas?.length ? (
              <ul>
                {error.fallas.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
        <div className="league-row">
          <button type="button" disabled={enviando} onClick={cerrar}>
            Cancelar
          </button>
          <button
            className="league-primary"
            autoFocus={!rechazo}
            disabled={
              enviando ||
              (rechazo &&
                (motivo.trim().length < 20 || motivo.trim().length > 500))
            }
          >
            {enviando
              ? "Enviando..."
              : rechazo
                ? "Confirmar rechazo"
                : "Confirmar aprobación"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
