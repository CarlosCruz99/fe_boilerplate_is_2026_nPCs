"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { obtenerDetallePartido, obtenerMiCalendario } from "@/app/actions/calendario";
import { useAuth } from "@/contexts/auth-context";
import { useConsulta } from "@/hooks/use-consulta";
import type { DetallePartido, PartidoCalendario } from "@/types/calendario";

const fecha = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const hora = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  hour: "2-digit",
  minute: "2-digit",
});

function FechaHora({ iso }: { iso: string }) {
  const valor = new Date(iso);
  return <>{fecha.format(valor)} · {hora.format(valor)}</>;
}

function FichaPartido({ partido, onDetalle }: { partido: PartidoCalendario; onDetalle: (id: number) => void }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <span>Jornada {partido.jornada}</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {partido.estado === "FINALIZADO" ? "Finalizado" : partido.estado === "EN_CURSO" ? "En curso" : "Programado"}
        </span>
      </div>
      <h2 className="text-xl font-semibold">vs. {partido.rival.nombre}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {partido.condicion === "LOCAL" ? "Jugamos de local" : "Jugamos de visitante"}
      </p>
      <dl className="mt-4 grid gap-2 text-sm">
        <div><dt className="inline font-semibold">Inicio: </dt><dd className="inline"><FechaHora iso={partido.inicio} /></dd></div>
        <div><dt className="inline font-semibold">Fin: </dt><dd className="inline"><FechaHora iso={partido.fin} /></dd></div>
        <div><dt className="inline font-semibold">Cancha: </dt><dd className="inline">{partido.cancha.nombre} — {partido.cancha.direccion}</dd></div>
        <div><dt className="inline font-semibold">Árbitro: </dt><dd className="inline">{partido.arbitro.nombre}</dd></div>
      </dl>
      <button
        type="button"
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        onClick={() => onDetalle(partido.id)}
      >
        Ver detalle
      </button>
    </article>
  );
}

function Detalle({ partido, cerrar }: { partido: DetallePartido; cerrar: () => void }) {
  return (
    <section aria-label="Detalle del partido" className="rounded-xl border border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-600 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Detalle del partido · Jornada {partido.jornada}</h2>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={cerrar} type="button">Cerrar</button>
      </div>
      <p className="mt-3 text-xl font-semibold">{partido.local.nombre} vs. {partido.visitante.nombre}</p>
      <p className="mt-2 text-sm">Inicio: <FechaHora iso={partido.inicio} /></p>
      <p className="mt-1 text-sm">Fin: <FechaHora iso={partido.fin} /></p>
      <p className="mt-1 text-sm">Cancha: {partido.cancha.nombre} — {partido.cancha.direccion}</p>
      <p className="mt-1 text-sm">Árbitro: {partido.arbitro.nombre}</p>
    </section>
  );
}

export function CalendarioEquipoVista() {
  const { equipoActualId } = useAuth();
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
    } finally {
      setDetalleCargando(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Mi calendario</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">Consulta los partidos publicados de tu equipo.</p>
        </div>
        {equipoActualId !== null && (
          <button type="button" onClick={() => { setDetalle(null); setErrorDetalle(null); recargar(); }} className="rounded-md border px-4 py-2 text-sm font-medium">Actualizar</button>
        )}
      </div>
      {equipoActualId === null ? (
        <div role="status" className="rounded-lg border p-6">
          <p>Aún no perteneces a un equipo en la temporada actual.</p>
          <Link href="/vincular-ficha" className="mt-3 inline-block underline">Vincular mi ficha de jugador</Link>
        </div>
      ) : !resultado ? (
        <p role="status">Cargando calendario...</p>
      ) : !resultado.ok ? (
        <div role="alert" className="rounded-lg border p-6">
          <p>{resultado.codigo === "EQUIPO_NO_INSCRITO" ? "Tu equipo aún no está inscrito en la temporada." : resultado.error}</p>
          {resultado.codigo !== "EQUIPO_NO_INSCRITO" && <button type="button" onClick={recargar} className="mt-3 rounded-md border px-4 py-2">Reintentar</button>}
        </div>
      ) : resultado.data.partidos.length === 0 ? (
        <p role="status" className="rounded-lg border p-6">Aún no hay partidos publicados para tu equipo.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">{resultado.data.total} partidos visibles</p>
          <div className="grid gap-4 md:grid-cols-2">
            {resultado.data.partidos.map((partido) => (
              <FichaPartido key={partido.id} partido={partido} onDetalle={(id) => void abrirDetalle(id)} />
            ))}
          </div>
          <div className="mt-6" aria-live="polite">
            {detalleCargando && <p role="status">Cargando detalle...</p>}
            {errorDetalle && <p role="alert">{errorDetalle}</p>}
            {detalle && <Detalle partido={detalle} cerrar={() => setDetalle(null)} />}
          </div>
        </>
      )}
    </main>
  );
}
