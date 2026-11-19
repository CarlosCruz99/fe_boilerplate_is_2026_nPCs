"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { consultarEstadisticasPersonales, temporadasEstadisticasPersonales } from "@/app/actions/estadisticas-personales";
import { useConsulta } from "@/hooks/use-consulta";
import { useAuth } from "@/contexts/auth-context";
import type { Temporada } from "@/types/equipos";
import type { AcumuladosPersonales, PartidoEstadisticaPersonal } from "@/types/estadisticas-personales";

const fecha = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", dateStyle: "medium", timeStyle: "short" });

export function SelectorTemporada({ temporadas, valor, cambiar }: { temporadas: Temporada[]; valor: string; cambiar: (valor: string) => void }) {
  return <div className="personal-season"><label htmlFor="temporada-estadisticas">Temporada</label><select id="temporada-estadisticas" value={valor} onChange={e => cambiar(e.target.value)}><option value="">Selecciona una temporada</option>{temporadas.map(t => <option key={t.id} value={t.id}>{t.nombre}{t.actual ? " · Actual" : ""}</option>)}</select></div>;
}

export function ResumenEstadisticas({ acumulados }: { acumulados: AcumuladosPersonales }) {
  return <section aria-label="Resumen de estadísticas" className="personal-summary">{(["goles", "asistencias", "tarjetas"] as const).map(m => <div className="league-card" key={m}><h2>{m === "goles" ? "Goles" : m === "asistencias" ? "Asistencias" : "Tarjetas"}</h2><strong>{acumulados[m]}</strong></div>)}</section>;
}

export function DetallePorPartido({ partidos }: { partidos: PartidoEstadisticaPersonal[] }) {
  return <section className="league-card personal-detail"><h2>Detalle por partido</h2><div className="personal-table-scroll" role="region" aria-label="Estadísticas por partido, desplazable horizontalmente" tabIndex={0}><table><caption>Estadísticas oficiales de partidos finalizados</caption><thead><tr>{["Fecha", "Rival", "Goles", "Asistencias", "Tarjetas"].map(t => <th scope="col" key={t}>{t}</th>)}</tr></thead><tbody>{partidos.map(p => <tr key={p.partidoId}><td><time dateTime={p.fecha}>{fecha.format(new Date(p.fecha))}</time></td><th scope="row">{p.rival}</th><td>{p.goles}</td><td>{p.asistencias}</td><td>{p.tarjetas}</td></tr>)}</tbody></table></div></section>;
}

function ErrorConsulta({ status, error, reintentar }: { status: number; error: string; reintentar: () => void }) {
  return <section className="league-card"><p role="alert">{status === 401 ? "Tu sesión expiró. Inicia sesión nuevamente." : error}</p><div className="personal-error-actions"><button onClick={reintentar}>Reintentar</button>{status === 401 && <Link href="/login">Iniciar sesión</Link>}</div></section>;
}

function DatosTemporada({ temporadaId }: { temporadaId: number }) {
  const consulta = useCallback(() => consultarEstadisticasPersonales(temporadaId), [temporadaId]);
  const { resultado, recargar } = useConsulta(consulta);
  if (!resultado) return <p role="status">Cargando estadísticas…</p>;
  if (!resultado.ok) return <ErrorConsulta {...resultado} reintentar={recargar} />;
  return <>
    <ResumenEstadisticas acumulados={resultado.data.acumulados} />
    {resultado.data.partidos.length === 0 ? <p className="league-card" role="status">Sin estadísticas durante esta temporada</p> : <DetallePorPartido partidos={resultado.data.partidos} />}
  </>;
}

export function VistaEstadisticasPersonales() {
  const { usuario } = useAuth();
  const [temporada, setTemporada] = useState("");
  const { resultado: catalogo, recargar } = useConsulta(temporadasEstadisticasPersonales);
  return <main className="league-page"><header className="league-hero"><p className="eyebrow">Tu desempeño en la liga</p><h1>Mis estadísticas</h1><p>Consulta tus goles, asistencias y tarjetas oficiales por temporada.</p></header>
    {!catalogo ? <p role="status">Cargando temporadas…</p> : !catalogo.ok ? <ErrorConsulta {...catalogo} reintentar={recargar} /> : catalogo.data.length === 0 ? <p role="status" className="league-card">No hay temporadas disponibles.</p> : <>
      <section className="league-card"><SelectorTemporada temporadas={catalogo.data} valor={temporada} cambiar={setTemporada} /></section>
      {!temporada ? <p className="league-card" role="status">Selecciona una temporada para consultar tus estadísticas.</p> : <DatosTemporada key={`${usuario?.id}:${temporada}`} temporadaId={Number(temporada)} />}
    </>}
  </main>;
}
