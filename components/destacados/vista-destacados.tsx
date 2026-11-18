"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { consultarDestacados, temporadasDestacados } from "@/app/actions/destacados";
import type { Resultado, Temporada } from "@/types/equipos";
import type { ClasificacionDestacados, JugadorDestacado, MetricaDestacados } from "@/types/destacados";

export function SelectorTemporada({ temporadas, valor, cambiar }: { temporadas: Temporada[]; valor: string; cambiar: (valor: string) => void }) {
  return <label>Temporada<select value={valor} onChange={e => cambiar(e.target.value)}><option value="">Selecciona una temporada</option>{temporadas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></label>;
}

export function SelectorMetrica({ valor, cambiar }: { valor: MetricaDestacados; cambiar: (valor: MetricaDestacados) => void }) {
  return <label>Métrica<select value={valor} onChange={e => cambiar(e.target.value as MetricaDestacados)}><option value="goles">Goles</option><option value="asistencias">Asistencias</option></select></label>;
}

export function TablaDestacados({ jugadores, metrica }: { jugadores: JugadorDestacado[]; metrica: MetricaDestacados }) {
  return <div className="overflow-x-auto"><table className="w-full text-left"><caption>Clasificación por {metrica === "goles" ? "Goles" : "Asistencias"}</caption><thead><tr><th scope="col">Posición</th><th scope="col">Jugador</th><th scope="col">Total ({metrica === "goles" ? "Goles" : "Asistencias"})</th></tr></thead><tbody>{jugadores.map(j => <tr key={j.jugadorId}><td>{j.posicion}</td><td>{j.nombre}</td><td>{j.total}</td></tr>)}</tbody></table></div>;
}

function ErrorConsulta({ resultado, reintentar }: { resultado: { status: number; error: string }; reintentar: () => void }) {
  return <div><p role="alert">{resultado.status === 401 ? "Tu sesión expiró. Inicia sesión nuevamente." : resultado.status === 403 ? "No tienes permiso para ver esta página." : resultado.error}</p>{resultado.status === 401 ? <Link href="/login">Iniciar sesión</Link> : resultado.status !== 403 && <button type="button" onClick={reintentar}>Reintentar</button>}</div>;
}

export function VistaDestacados() {
  const [catalogo, setCatalogo] = useState<Resultado<Temporada[]> | null>(null);
  const [temporada, setTemporada] = useState("");
  const [metrica, setMetrica] = useState<MetricaDestacados>("goles");
  const [revision, setRevision] = useState(0);
  const [revisionCatalogo, setRevisionCatalogo] = useState(0);
  const [lectura, setLectura] = useState<{ clave: string; resultado: Resultado<ClasificacionDestacados> } | null>(null);
  const clave = `${temporada}:${metrica}:${revision}`;

  useEffect(() => {
    let vigente = true;
    temporadasDestacados().catch((): Resultado<Temporada[]> => ({ ok: false, status: 503, error: "No se pudieron consultar las temporadas." })).then(resultado => {
      if (!vigente) return;
      setCatalogo(resultado);
      if (resultado.ok) setTemporada(String((resultado.data.find(t => t.actual) ?? resultado.data[0])?.id ?? ""));
    });
    return () => { vigente = false; };
  }, [revisionCatalogo]);

  useEffect(() => {
    if (!temporada) return;
    let vigente = true;
    consultarDestacados(Number(temporada), metrica).catch((): Resultado<ClasificacionDestacados> => ({ ok: false, status: 503, error: "No se pudo consultar la clasificación." })).then(resultado => {
      if (vigente) setLectura({ clave, resultado });
    });
    return () => { vigente = false; };
  }, [temporada, metrica, clave]);

  const resultado = lectura?.clave === clave ? lectura.resultado : null;
  const cargando = Boolean(temporada) && !resultado;
  return <main className="league-page"><header className="league-hero"><p className="eyebrow">Estadísticas oficiales</p><h1>Jugadores destacados</h1><p>Consulta goles y asistencias de los partidos finalizados de cada temporada.</p></header><section className="league-card">
    {!catalogo ? <p role="status">Cargando temporadas…</p> : !catalogo.ok ? <ErrorConsulta resultado={catalogo} reintentar={() => { setCatalogo(null); setRevisionCatalogo(r => r + 1); }} /> : catalogo.data.length === 0 ? <p>No hay temporadas disponibles.</p> : <>
      <div className="grid gap-4 sm:grid-cols-3"><SelectorTemporada temporadas={catalogo.data} valor={temporada} cambiar={setTemporada} /><SelectorMetrica valor={metrica} cambiar={setMetrica} /><button type="button" disabled={!temporada || cargando} onClick={() => setRevision(r => r + 1)}>Actualizar</button></div>
      {!temporada ? <p>Selecciona una temporada para consultar.</p> : cargando ? <p role="status">Consultando clasificación…</p> : resultado && (!resultado.ok ? <ErrorConsulta resultado={resultado} reintentar={() => setRevision(r => r + 1)} /> : resultado.data.jugadores.length === 0 ? <p role="status">No hay estadísticas oficiales para esta temporada</p> : <TablaDestacados jugadores={resultado.data.jugadores} metrica={metrica} />)}
    </>}
  </section></main>;
}
