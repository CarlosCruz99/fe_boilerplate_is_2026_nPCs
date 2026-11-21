"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useConsulta } from "@/hooks/use-consulta";
import { consultarProximosRivales } from "@/app/actions/proximos-rivales";
import { EscudoEquipo } from "@/components/equipos/escudo-equipo";

const fecha = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", dateStyle: "medium", timeStyle: "short" });

function RivalesCapitan({ equipoId }: { equipoId: number }) {
  const { resultado, recargar } = useConsulta(consultarProximosRivales);
  if (resultado && !resultado.ok && resultado.status === 403) return null;
  const datos = resultado?.ok && resultado.data.equipoId === equipoId ? resultado.data : null;
  return <section className="league-card" aria-labelledby="proximos-rivales-titulo"><header className="rivals-heading"><div><p className="eyebrow">Tu siguiente desafío</p><h2 id="proximos-rivales-titulo">Próximos rivales</h2></div><button disabled={!resultado} onClick={recargar}>Actualizar rivales</button></header>
    {!resultado ? <p role="status">Cargando próximos partidos…</p> : !datos ? <div><p role="alert">{!resultado.ok && resultado.status === 401 ? "Inicia sesión nuevamente." : "No pudimos cargar tus próximos partidos. Intenta de nuevo."}</p>{!resultado.ok && resultado.status === 401 ? <Link href="/login">Iniciar sesión</Link> : <button onClick={recargar}>Reintentar próximos partidos</button>}</div> : datos.proximos.length === 0 ? <p role="status">No tienes partidos pendientes.</p> : <ul className="rivals-list">{[...datos.proximos].sort((a, b) => Date.parse(a.fechaHora) - Date.parse(b.fechaHora) || a.partidoId - b.partidoId).map(p => <li key={p.partidoId}><time dateTime={p.fechaHora}>{fecha.format(new Date(p.fechaHora))}</time><span className="standings-team"><EscudoEquipo id={p.rival.equipoId} nombre={p.rival.nombre} /><strong>{p.rival.nombre}</strong></span><span>Lugar: {p.rival.lugar ?? "Sin posición"} · Puntos: {p.rival.puntos ?? "Sin registro"}</span></li>)}</ul>}
  </section>;
}

export function ProximosRivales() {
  const { estado, rol, capitaneaEquipoId, usuario } = useAuth();
  if (estado !== "autenticado" || rol !== "JUGADOR" || capitaneaEquipoId === null) return null;
  return <RivalesCapitan key={`${usuario?.id}:${capitaneaEquipoId}`} equipoId={capitaneaEquipoId} />;
}
