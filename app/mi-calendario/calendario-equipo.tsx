"use client";

import { EscudoEquipo } from "@/components/equipos/escudo-equipo";
import { FixtureCard } from "@/components/calendario/fixture-card";
import { useCallback, useState } from "react";
import Link from "next/link";
import { obtenerDetallePartido, obtenerMiCalendario } from "@/app/actions/calendario";
import { useAuth } from "@/contexts/auth-context";
import { useConsulta } from "@/hooks/use-consulta";
import type { DetallePartido, PartidoCalendario } from "@/types/calendario";

const fecha = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
});
const hora = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador", hour: "2-digit", minute: "2-digit", hour12: false,
});

function Condicion({ valor }: { valor: PartidoCalendario["condicion"] }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${valor === "LOCAL"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      : "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"}`}>
      {valor === "LOCAL" ? "Local" : "Visitante"}
    </span>
  );
}

function Detalle({ partido, cerrar }: { partido: DetallePartido; cerrar: () => void }) {
  return (
    <section aria-label="Detalle del partido" className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">Detalle del partido · Jornada {partido.jornada}</h2>
        <button type="button" onClick={cerrar} className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Cerrar</button>
      </div>
      <p className="equipo-con-escudo mt-3 flex-wrap text-xl font-semibold">
        <EscudoEquipo nombre={partido.local.nombre} id={partido.local.id} />
        <span>{partido.local.nombre} vs. {partido.visitante.nombre}</span>
        <EscudoEquipo nombre={partido.visitante.nombre} id={partido.visitante.id} />
      </p>
      <dl className="mt-3 space-y-1 text-sm">
        <div><dt className="inline font-medium">Inicio: </dt><dd className="inline">{fecha.format(new Date(partido.inicio))} · {hora.format(new Date(partido.inicio))}</dd></div>
        <div><dt className="inline font-medium">Fin: </dt><dd className="inline">{fecha.format(new Date(partido.fin))} · {hora.format(new Date(partido.fin))}</dd></div>
        <div><dt className="inline font-medium">Cancha: </dt><dd className="inline">{partido.cancha.nombre} · {partido.cancha.direccion}</dd></div>
        <div><dt className="inline font-medium">Árbitro: </dt><dd className="inline">{partido.arbitro.nombre}</dd></div>
      </dl>
    </section>
  );
}

export function CalendarioEquipoVista() {
  const { equipoActualId } = useAuth();
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const consultar = useCallback(() => obtenerMiCalendario(), []);
  const { resultado, recargar } = useConsulta(consultar);
  const [detalle, setDetalle] = useState<DetallePartido | null>(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  async function abrirDetalle(id: number) {
    setDetalle(null);
    setErrorDetalle(null);
    setDetalleCargando(true);
    try {
      const respuesta = await obtenerDetallePartido(id);
      if (respuesta.ok) setDetalle(respuesta.data);
      else setErrorDetalle(respuesta.error);
    } catch {
      setErrorDetalle("No pudimos cargar el detalle del partido.");
    } finally {
      setDetalleCargando(false);
    }
  }

  // Mantener la pantalla solo lectura y evitar mostrar partidos cancelados.
  const partidos = resultado?.ok
    ? [...resultado.data.partidos].filter((partido) => partido.estado !== "CANCELADO")
        .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    : [];
  const miEquipo = resultado?.ok && resultado.data.nombreEquipo
    ? { id: resultado.data.equipoId, nombre: resultado.data.nombreEquipo }
    : null;
  const proximo = partidos.find((partido) =>
    (partido.estado === "PROGRAMADO" || partido.estado === "EN_CURSO") &&
    new Date(partido.fin).getTime() >= ahora
  );

  const jornadas = [...new Set(partidos.map(p => p.jornada))];
  const jornadaActiva = jornadaSeleccionada !== null && jornadas.includes(jornadaSeleccionada) ? jornadaSeleccionada : null;
  const visibles = jornadaActiva === null ? partidos : partidos.filter(p => p.jornada === jornadaActiva);

  function actualizar() {
    setAhora(Date.now());
    setDetalle(null);
    setErrorDetalle(null);
    recargar();
  }

  return (
    <main className="league-page">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Mi calendario</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Los encuentros, horarios y canchas de tu equipo.</p>
        </div>
        {equipoActualId !== null && (
          <button type="button" onClick={actualizar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
            ↻ Actualizar
          </button>
        )}
      </header>

      {equipoActualId === null ? (
        <section role="status" className="rounded-xl border border-slate-300 bg-white p-7 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Tu cuenta no está ligada a ningún equipo inscrito.</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Vincula tu ficha para consultar el calendario de tu equipo.</p>
          <Link href="/vincular-ficha" className="mt-4 inline-block text-sm font-semibold underline">Vincular mi ficha de jugador</Link>
        </section>
      ) : !resultado ? (
        <section role="status" className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-slate-300 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
          <span aria-hidden="true" className="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p>Cargando tu calendario...</p>
        </section>
      ) : !resultado.ok ? (
        <section role="alert" className="rounded-xl border border-slate-300 bg-white p-7 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold">{resultado.codigo === "EQUIPO_NO_INSCRITO"
            ? "Tu equipo aún no está inscrito en la temporada."
            : resultado.status === 403
              ? "No tienes acceso a este calendario."
              : resultado.error}</p>
          {resultado.codigo === "EQUIPO_NO_INSCRITO" ? (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Pendiente de validación</p>
          ) : resultado.status !== 403 && (
            <button type="button" onClick={actualizar} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Reintentar</button>
          )}
        </section>
      ) : partidos.length === 0 ? (
        <section role="status" className="rounded-xl border border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Aún no hay partidos programados para tu equipo.</h2>
          <button type="button" onClick={actualizar} className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600">↻ Actualizar</button>
        </section>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{partidos.length} partidos publicados</p>

          <section className="fixtures-panel" aria-label="Partidos de mi equipo">
            <div className="fixtures-heading"><div><p className="fixture-kicker">CADA JORNADA CUENTA</p><h2>TUS ENCUENTROS</h2></div><span>HORARIO DE EL SALVADOR</span></div>
            <nav className="fixture-rounds" aria-label="Seleccionar jornada">
              <button type="button" aria-pressed={jornadaActiva === null} onClick={() => { setJornadaSeleccionada(null); setDetalle(null); }}>Todos los partidos</button>
              {jornadas.map(j => <button key={j} type="button" aria-pressed={j === jornadaActiva} onClick={() => { setJornadaSeleccionada(j); setDetalle(null); }}>Jornada {j}</button>)}
            </nav>
            <div className="fixtures-grid">
              {visibles.map(partido => <FixtureCard key={partido.id} id={partido.id} inicio={partido.inicio}
                local={partido.condicion === "LOCAL" ? miEquipo : partido.rival}
                visitante={partido.condicion === "VISITANTE" ? miEquipo : partido.rival}
                cancha={partido.cancha.nombre} estado={partido.estado} highlighted={partido.id === proximo?.id}
                footer={<><p>Árbitro: {partido.arbitro.nombre}</p><p>{partido.cancha.direccion}</p><Condicion valor={partido.condicion} /></>}>
                <button type="button" onClick={() => void abrirDetalle(partido.id)}><span aria-hidden="true">↗</span> Ver detalle</button>
                <Link href={`/partidos/${partido.id}/galeria`}><span aria-hidden="true">▧</span> Galería</Link>
                {partido.id === proximo?.id && <span className="fixture-upcoming">Próximo partido</span>}
              </FixtureCard>)}
            </div>
          </section>
          {proximo && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">El próximo partido está resaltado. El calendario es de solo lectura.</p>}
          <div aria-live="polite">
            {detalleCargando && <p role="status" className="mt-5">Cargando detalle...</p>}
            {errorDetalle && <p role="alert" className="mt-5 text-red-700 dark:text-red-300">{errorDetalle}</p>}
            {detalle && <Detalle partido={detalle} cerrar={() => setDetalle(null)} />}
          </div>
        </>
      )}
    </main>
  );
}
