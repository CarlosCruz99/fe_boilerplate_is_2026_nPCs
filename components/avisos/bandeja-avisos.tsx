"use client";

import { useCallback, useEffect, useState } from "react";
import { contarMisAvisosNoLeidos, listarMisAvisos } from "@/app/actions/avisos";
import { useConsulta } from "@/hooks/use-consulta";
import { EtiquetaModulo } from "@/components/avisos/etiqueta-modulo";
import { DetalleAviso } from "@/components/avisos/detalle-aviso";
import type { ConteoAvisos, ResultadoAvisos } from "@/types/avisos";

const fecha = new Intl.DateTimeFormat("es-SV", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  timeZone: "America/El_Salvador",
});

/** La misma bandeja se presenta en /avisos y /avisos/:id. */
export function BandejaAvisos({ seleccionInicialId = null, paginaInicial = 1 }: {
  seleccionInicialId?: number | null;
  paginaInicial?: number;
}) {
  const [pagina, setPagina] = useState(paginaInicial);
  const [seleccion, setSeleccion] = useState<number | null>(seleccionInicialId);
  const consultar = useCallback(() => listarMisAvisos(pagina), [pagina]);
  const { resultado, recargar } = useConsulta(consultar);
  const [conteo, setConteo] = useState<ResultadoAvisos<ConteoAvisos> | null>(null);
  const [revisionConteo, setRevisionConteo] = useState(0);

  useEffect(() => {
    let activo = true;
    void contarMisAvisosNoLeidos()
      .then((respuesta) => { if (activo) setConteo(respuesta); })
      .catch(() => { if (activo) setConteo({ ok: false, status: 503, error: "No se pudo consultar el conteo." }); });
    return () => { activo = false; };
  }, [revisionConteo]);

  const datos = resultado?.ok ? resultado.data.datos : [];
  const seleccionado = seleccion ?? datos[0]?.id ?? null;
  const paginas = resultado?.ok ? Math.max(1, Math.ceil(resultado.data.total / resultado.data.limite)) : 1;

  function actualizar() {
    recargar();
    setRevisionConteo((n) => n + 1);
  }

  return (
    <main className="w-full flex-1 bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-300">NPCS · LIGA</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Bandeja de avisos</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">Consulta los avisos de calendario, pagos y resultados.</p>
          </div>
          <button type="button" onClick={actualizar} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700">Actualizar</button>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <section aria-label="Lista de avisos" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Tus avisos</h2>
              <span aria-live="polite" className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                {conteo === null ? "Consultando…" : conteo.ok ? `${conteo.data.total} sin leer` : "Conteo no disponible"}
              </span>
            </div>
            {!resultado ? <p role="status" className="py-10 text-center text-slate-500">Cargando avisos…</p> : !resultado.ok ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                <p>{resultado.error}</p>
                <button type="button" onClick={actualizar} className="mt-3 underline">Reintentar</button>
              </div>
            ) : resultado.data.total === 0 ? (
              <p role="status" className="rounded-xl bg-slate-50 px-4 py-12 text-center text-slate-600 dark:bg-slate-800 dark:text-slate-300">Todavía no tienes avisos.</p>
            ) : (
              <>
                {datos.length === 0 ? <p role="status" className="rounded-lg bg-slate-50 p-4">No hay avisos en esta página.</p> : (
                  <ul className="space-y-3">
                    {datos.map((aviso) => (
                      <li key={aviso.id}>
                        <button type="button" onClick={() => setSeleccion(aviso.id)} aria-current={seleccionado === aviso.id ? "true" : undefined}
                          className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${seleccionado === aviso.id ? "border-blue-400 bg-white ring-1 ring-blue-200 dark:border-blue-500 dark:bg-slate-800" : !aviso.leidoEn ? "border-blue-200 bg-blue-50 hover:border-blue-400 dark:border-blue-900 dark:bg-blue-950/40" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <EtiquetaModulo modulo={aviso.moduloOrigen} />
                            {!aviso.leidoEn && <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Sin leer</span>}
                          </div>
                          <h3 className={`mt-2 text-base ${!aviso.leidoEn ? "font-bold" : "font-medium"}`}>{aviso.titulo}</h3>
                          <time dateTime={aviso.creadoEn} className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{fecha.format(new Date(aviso.creadoEn))}</time>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <nav aria-label="Paginación de avisos" className="mt-7 flex items-center justify-between gap-3">
                  <button type="button" disabled={pagina <= 1} onClick={() => { setPagina((p) => Math.max(1, p - 1)); setSeleccion(null); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600">Anterior</button>
                  <span className="text-center text-sm font-semibold">Página {pagina} de {paginas}</span>
                  <button type="button" disabled={pagina >= paginas} onClick={() => { setPagina((p) => p + 1); setSeleccion(null); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600">Siguiente</button>
                </nav>
              </>
            )}
          </section>

          <section aria-label="Detalle del aviso seleccionado" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
            <div className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">Detalle del aviso</h2>
            </div>
            {seleccionado === null ? (
              <p role="status" className="py-12 text-slate-500">{!resultado ? "Cargando detalle…" : "Selecciona un aviso de la lista para ver su detalle."}</p>
            ) : (
              <DetalleAviso key={seleccionado} id={seleccionado} integrado onLeido={actualizar} />
            )}
          </section>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">20 avisos por página · Selecciona un aviso para consultar su información</p>
      </div>
    </main>
  );
}
