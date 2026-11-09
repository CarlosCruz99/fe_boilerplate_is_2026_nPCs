"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { marcarMiAvisoLeido, obtenerMiAviso } from "@/app/actions/avisos";
import { EtiquetaModulo } from "@/components/avisos/etiqueta-modulo";
import { useConsulta } from "@/hooks/use-consulta";
import type { Aviso } from "@/types/avisos";

const fecha = new Intl.DateTimeFormat("es-SV", { dateStyle: "long", timeStyle: "short", timeZone: "America/El_Salvador" });

function enlaceRecurso(aviso: Aviso): { href: string; texto: string } | null {
  if (!aviso.referencia) return null;
  if (aviso.referencia.tipo === "JORNADA" || aviso.referencia.tipo === "PARTIDO") return { href: "/mi-calendario", texto: "Ver calendario del equipo" };
  // El proyecto aún no dispone de rutas funcionales para cuotas o pagos.
  return null;
}

export function DetalleAviso({ id, integrado = false, onLeido }: { id: number; integrado?: boolean; onLeido?: () => void }) {
  const consultar = useCallback(() => obtenerMiAviso(id), [id]);
  const { resultado, recargar } = useConsulta(consultar);
  const [leidoLocal, setLeidoLocal] = useState<string | null>(null);
  const [marcando, setMarcando] = useState(false);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);

  async function marcarLeido() {
    if (marcando) return;
    setMarcando(true);
    setErrorLectura(null);
    try {
      const respuesta = await marcarMiAvisoLeido(id);
      if (respuesta.ok) {
        setLeidoLocal(respuesta.data.leidoEn);
        recargar();
        onLeido?.();
      } else setErrorLectura(respuesta.error);
    } finally { setMarcando(false); }
  }

  const contenedor = integrado ? "" : "mx-auto w-full max-w-3xl flex-1 px-4 py-8";
  if (!resultado) return <div className={contenedor} role="status">Cargando aviso…</div>;
  if (!resultado.ok) return (
    <div className={contenedor}>
      <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        <p>{resultado.error}</p>
        <button type="button" onClick={recargar} className="mt-3 underline">Reintentar</button>
      </div>
      {!integrado && <Link href="/avisos" className="mt-4 inline-block underline">Volver a mis avisos</Link>}
    </div>
  );

  const aviso = resultado.data;
  const recurso = enlaceRecurso(aviso);
  const leido = leidoLocal ?? aviso.leidoEn;
  return (
    <article className={`${contenedor} min-w-0`}>
      {!integrado && <Link href="/avisos" className="mb-5 inline-block text-sm underline">← Volver a mis avisos</Link>}
      <div className="flex flex-wrap items-center gap-3">
        <EtiquetaModulo modulo={aviso.moduloOrigen} />
      </div>
      <h3 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl">{aviso.titulo}</h3>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        <time dateTime={aviso.creadoEn}>{fecha.format(new Date(aviso.creadoEn))}</time>
        <span className="mx-3" aria-hidden="true">·</span>{leido ? "Leído" : "Sin leer"}
      </p>
      <p className="mt-7 whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-200 sm:text-lg">{aviso.mensaje}</p>
      {recurso && <Link href={recurso.href} className="mt-8 inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">{recurso.texto}</Link>}
      {aviso.referencia && !recurso && <p className="mt-7 text-sm text-slate-500 dark:text-slate-400">Recurso relacionado: {aviso.referencia.tipo.toLowerCase()} #{aviso.referencia.id}. Aún no hay una pantalla disponible para este recurso.</p>}
      {!leido && <div><button type="button" disabled={marcando} onClick={() => void marcarLeido()} className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-slate-600">{marcando ? "Guardando…" : "Marcar como leído"}</button></div>}
      {errorLectura && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{errorLectura}</p>}
    </article>
  );
}
