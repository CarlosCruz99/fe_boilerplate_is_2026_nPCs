"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { equiposPartidosPublicos, listarPartidosPublicos } from "@/app/actions/marcador-publico";
import { useConsulta } from "@/hooks/use-consulta";
import { EscudoEquipo } from "@/components/equipos/escudo-equipo";
import type { EstadoPublico, PartidoPublico } from "@/types/marcador-publico";

const estados = { PROGRAMADO: "Programado", EN_CURSO: "En curso", FINALIZADO: "Finalizado" };
const fecha = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", dateStyle: "medium", timeStyle: "short" });

function TarjetaPartido({ partido, avisar }: { partido: PartidoPublico; avisar: () => void }) {
  const pendiente = partido.estado === "PROGRAMADO";
  return <article className="league-card public-match">
    <div className="public-match-meta"><time dateTime={partido.inicio}>{fecha.format(new Date(partido.inicio))}</time><span className={`fixture-state state-${partido.estado.toLowerCase()}`}>{estados[partido.estado]}</span></div>
    <p className="eyebrow">Jornada {partido.jornada}</p>
    <div className="public-score"><div><EscudoEquipo {...partido.local} /><h2>{partido.local.nombre}</h2></div><strong aria-label={pendiente ? "Pendiente" : `Marcador ${partido.local.goles} a ${partido.visitante.goles}`}>{pendiente ? "VS" : `${partido.local.goles} – ${partido.visitante.goles}`}</strong><div><EscudoEquipo {...partido.visitante} /><h2>{partido.visitante.nombre}</h2></div></div>
    {pendiente ? <button type="button" onClick={avisar}>Consultar partido programado</button> : <Link className="league-link league-primary" href={`/partidos/${partido.id}`}>Ver marcador<span className="sr-only"> de {partido.local.nombre} contra {partido.visitante.nombre}</span></Link>}
  </article>;
}

export function ListaPartidos() {
  const [estado, setEstado] = useState<EstadoPublico | "">("");
  const [equipo, setEquipo] = useState("");
  const [page, setPage] = useState(1);
  const [aviso, setAviso] = useState(false);
  const consultar = useCallback(() => listarPartidosPublicos({ estado: estado || undefined, equipoId: equipo ? Number(equipo) : undefined, page }), [estado, equipo, page]);
  const { resultado, recargar } = useConsulta(consultar);
  const { resultado: equipos, recargar: recargarEquipos } = useConsulta(equiposPartidosPublicos);
  function limpiar() { setEstado(""); setEquipo(""); setPage(1); setAviso(false); }
  return <main className="league-page"><header className="league-hero"><p className="eyebrow">Sigue cada jornada</p><h1>Partidos y marcadores</h1><p>El resultado de tu liga, en curso y al final del encuentro.</p></header>
    <section className="league-card public-filters" aria-label="Filtros de partidos">
      <label>Estado<select aria-label="Estado" value={estado} onChange={e => { setEstado(e.target.value as EstadoPublico | ""); setPage(1); setAviso(false); }}><option value="">Todos</option><option value="EN_CURSO">En curso</option><option value="FINALIZADO">Finalizado</option><option value="PROGRAMADO">Programado</option></select></label>
      <label>Equipo<select aria-label="Equipo" value={equipo} disabled={!equipos?.ok} onChange={e => { setEquipo(e.target.value); setPage(1); setAviso(false); }}><option value="">Todos los equipos</option>{equipos?.ok && equipos.data.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
      <button type="button" onClick={limpiar}>Limpiar filtros</button>
      {!equipos && <p role="status">Cargando equipos…</p>}
      {equipos && !equipos.ok && <div><p role="alert">No pudimos cargar los equipos.</p><button onClick={recargarEquipos}>Reintentar equipos</button></div>}
    </section>
    {aviso && <p role="status" className="league-card">Este partido aún no comienza.</p>}
    {!resultado ? <p role="status">Cargando partidos…</p> : !resultado.ok ? <div className="league-card"><p role="alert">No pudimos cargar los partidos. Intenta de nuevo.</p><button onClick={recargar}>Reintentar</button></div> : <>
      {resultado.data.partidos.length === 0 ? <p role="status" className="league-card">No hay partidos que coincidan con los filtros.</p> : <div className="public-match-grid">{resultado.data.partidos.map(partido => <TarjetaPartido key={partido.id} partido={partido} avisar={() => setAviso(true)} />)}</div>}
      <nav aria-label="Páginas de partidos" className="public-pagination"><button disabled={page === 1} onClick={() => { setPage(p => p - 1); setAviso(false); }}>Anterior</button><span>Página {page} de {Math.max(1, Math.ceil(resultado.data.total / 20))}</span><button disabled={page * 20 >= resultado.data.total} onClick={() => { setPage(p => p + 1); setAviso(false); }}>Siguiente</button></nav>
    </>}
  </main>;
}
