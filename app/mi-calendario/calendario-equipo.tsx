"use client";

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

function Estado({ valor }: { valor: PartidoCalendario["estado"] }) {
  const apariencia = {
    PROGRAMADO: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    EN_CURSO: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    FINALIZADO: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    CANCELADO: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  };
  const etiquetas = {
    PROGRAMADO: "Programado", EN_CURSO: "En curso", FINALIZADO: "Finalizado", CANCELADO: "Cancelado",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${apariencia[valor]}`}>{etiquetas[valor]}</span>;
}

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
      <p className="mt-3 text-xl font-semibold">{partido.local.nombre} vs. {partido.visitante.nombre}</p>
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
  const ahora = Date.now();
  const proximo = partidos.find((partido) =>
    (partido.estado === "PROGRAMADO" || partido.estado === "EN_CURSO") &&
    new Date(partido.fin).getTime() >= ahora
  );

  function actualizar() {
    setDetalle(null);
    setErrorDetalle(null);
    recargar();
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Mi calendario</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Partidos publicados de tu equipo · Solo lectura</p>
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

          {/* Escritorio: tabla como el mockup. */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 md:block">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm">
              <thead className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                <tr>
                  <th scope="col" className="px-4 py-3">Jornada</th>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Hora</th>
                  <th scope="col" className="px-4 py-3">Cancha</th>
                  <th scope="col" className="px-4 py-3">Árbitro</th>
                  <th scope="col" className="px-4 py-3">Rival</th>
                  <th scope="col" className="px-4 py-3">Condición</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {partidos.map((partido) => (
                  <tr key={partido.id} className={`border-t border-slate-200 dark:border-slate-700 ${partido.id === proximo?.id ? "bg-blue-100/80 font-medium dark:bg-blue-950/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                    <td className="px-4 py-3">J{partido.jornada}</td>
                    <td className="whitespace-nowrap px-4 py-3">{fecha.format(new Date(partido.inicio))}</td>
                    <td className="whitespace-nowrap px-4 py-3">{hora.format(new Date(partido.inicio))}</td>
                    <td className="px-4 py-3">{partido.cancha.nombre} · {partido.cancha.direccion}</td>
                    <td className="px-4 py-3">{partido.arbitro.nombre}</td>
                    <td className="px-4 py-3">{partido.rival.nombre}</td>
                    <td className="px-4 py-3"><Condicion valor={partido.condicion} /></td>
                    <td className="px-4 py-3"><Estado valor={partido.estado} /></td>
                    <td className="px-4 py-3"><button type="button" onClick={() => void abrirDetalle(partido.id)} className="font-semibold text-blue-700 underline dark:text-blue-300">Ver detalle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas legibles desde 360 px. */}
          <div className="grid gap-3 md:hidden">
            {partidos.map((partido) => (
              <article key={partido.id} className={`rounded-xl border p-4 shadow-sm ${partido.id === proximo?.id
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
                : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">J{partido.jornada} · {fecha.format(new Date(partido.inicio))} · {hora.format(new Date(partido.inicio))}</h2>
                  <Estado valor={partido.estado} />
                </div>
                {partido.id === proximo?.id && <p className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-300">Próximo partido</p>}
                <p className="mt-2 text-sm">{partido.cancha.nombre} · {partido.cancha.direccion}</p>
                <p className="mt-1 text-sm">Árbitro: {partido.arbitro.nombre}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">Rival: <strong>{partido.rival.nombre}</strong><Condicion valor={partido.condicion} /></div>
                <button type="button" onClick={() => void abrirDetalle(partido.id)} className="mt-3 text-sm font-semibold text-blue-700 underline dark:text-blue-300">Ver detalle</button>
              </article>
            ))}
          </div>

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
