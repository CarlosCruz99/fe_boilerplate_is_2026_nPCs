"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { consultarPosiciones } from "@/app/actions/posiciones";
import { useAuth } from "@/contexts/auth-context";
import { EscudoEquipo } from "@/components/equipos/escudo-equipo";
import type { Resultado } from "@/types/equipos";
import type { TablaPosiciones } from "@/types/posiciones";

const columnas = ["Lugar", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"];
const titulos = ["Lugar", "Equipo", "Partidos jugados", "Partidos ganados", "Partidos empatados", "Partidos perdidos", "Goles a favor", "Goles en contra", "Diferencia de goles", "Puntos"];

export function VistaPosiciones({ children }: { children?: ReactNode }) {
  const { equipoActualId } = useAuth();
  const [resultado, setResultado] = useState<Resultado<TablaPosiciones> | null>(null);
  const [cargando, setCargando] = useState(true);
  const actualizar = useRef<() => void>(() => {});
  useEffect(() => {
    let vigente = true;
    let ocupada = false;
    async function consultar() {
      if (ocupada || !vigente) return;
      ocupada = true;
      setCargando(true);
      try {
        const respuesta = await consultarPosiciones();
        if (vigente) setResultado(respuesta);
      } catch {
        if (vigente) setResultado({ ok: false, status: 503, error: "No pudimos cargar la tabla. Intenta de nuevo." });
      } finally {
        ocupada = false;
        if (vigente) setCargando(false);
      }
    }
    actualizar.current = () => void consultar();
    void consultar();
    const timer = setInterval(() => void consultar(), 30000);
    return () => { vigente = false; clearInterval(timer); };
  }, []);
  const filas = resultado?.ok ? resultado.data.posiciones : [];
  const miEquipo = filas.find(f => f.equipoId === equipoActualId);
  return <main className="league-page"><header className="league-hero"><p className="eyebrow">Clasificación oficial</p><h1>Tabla de posiciones</h1><p>Temporada actual · Actualización cada 30 segundos</p><button disabled={cargando} onClick={() => actualizar.current()}>Actualizar</button></header>
    {cargando && <p role="status">{resultado ? "Actualizando tabla…" : "Cargando tabla…"}</p>}
    {resultado && !resultado.ok && <section className="league-card"><p role="alert">No pudimos cargar la tabla. Intenta de nuevo.</p><button disabled={cargando} onClick={() => actualizar.current()}>Reintentar</button></section>}
    {resultado?.ok && (filas.length === 0 ? <p role="status" className="league-card">Aún no hay resultados registrados en esta temporada.</p> : <>
      {miEquipo && <section className="league-card standings-summary" aria-label="Resumen de mi equipo"><p className="eyebrow">Tu equipo</p><h2>{miEquipo.equipo}</h2><p>Lugar {miEquipo.lugar} · {miEquipo.puntos} puntos</p><p>PJ {miEquipo.pj} · PG {miEquipo.pg} · PE {miEquipo.pe} · PP {miEquipo.pp} · GF {miEquipo.gf} · GC {miEquipo.gc} · DG {miEquipo.dg}</p></section>}
      <section className="league-card standings-panel"><div className="standings-scroll" role="region" aria-label="Tabla oficial de posiciones, desplazable horizontalmente" tabIndex={0}><table className="standings-table"><caption>Posiciones de la temporada actual</caption><thead><tr>{columnas.map((c, i) => <th scope="col" key={c}><abbr title={titulos[i]}>{c}</abbr></th>)}</tr></thead><tbody>{filas.map(f => <tr key={f.equipoId} className={f.equipoId === equipoActualId ? "standings-mine" : undefined}><td>{f.lugar}</td><th scope="row"><span className="standings-team"><EscudoEquipo id={f.equipoId} nombre={f.equipo} /><span>{f.equipo}{f.equipoId === equipoActualId && <small>Tu equipo</small>}</span></span></th>{[f.pj, f.pg, f.pe, f.pp, f.gf, f.gc, f.dg, f.puntos].map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody></table></div><p className="standings-hint">En pantallas pequeñas, desliza la tabla para consultar todas las columnas.</p></section>
    </>)}
    {children}
  </main>;
}
