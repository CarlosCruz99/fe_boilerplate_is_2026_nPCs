import Link from "next/link";
import type { AvisoCalendarioPublicado } from "@/types/avisos-calendario";

/** Presentación reutilizable: la futura bandeja H19 puede proporcionarle un aviso real. */
export function AvisoCalendarioPublicadoVista({
  aviso,
  esDemostracion = false,
}: {
  aviso: AvisoCalendarioPublicado;
  esDemostracion?: boolean;
}) {
  return (
    <article className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Calendario · Jornada publicada
          </span>
          {esDemostracion ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Ejemplo de diseño</span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
              {aviso.leidoEn ? "Leído" : "No leído"}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{aviso.titulo}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{aviso.mensaje}</p>
      </div>
      <div className="p-5">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            ["Rival", aviso.datos.rival],
            ["Cancha", aviso.datos.cancha],
            ["Fecha", aviso.datos.fecha],
            ["Hora", aviso.datos.hora],
          ] as const).map(([etiqueta, valor]) => (
            <div key={etiqueta} className="rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{etiqueta}</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">{valor}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/mi-calendario"
          className="mt-5 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Ver calendario del equipo
        </Link>
      </div>
    </article>
  );
}
