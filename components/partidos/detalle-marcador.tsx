"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { consultarMarcadorPublico } from "@/app/actions/marcador-publico";
import { EscudoEquipo } from "@/components/equipos/escudo-equipo";
import type { MarcadorPublico, EquipoMarcador } from "@/types/marcador-publico";

function JugadoresEquipo({ equipo }: { equipo: EquipoMarcador }) {
  return <section className="league-card"><h2>Participantes · {equipo.nombre}</h2>{equipo.jugadores.length ? <ul>{equipo.jugadores.map(j => <li key={j.id}>{j.nombre}</li>)}</ul> : <p>Sin participantes registrados.</p>}</section>;
}

export function DetalleMarcador({ partidoId }: { partidoId: number }) {
  const [datos, setDatos] = useState<MarcadorPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const actualizar = useRef<() => void>(() => {});

  useEffect(() => {
    let vigente = true;
    let ocupada = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let ultimo: MarcadorPublico | null = null;
    async function consultar() {
      if (ocupada || !vigente) return;
      ocupada = true;
      setCargando(true);
      try {
        const respuesta = await consultarMarcadorPublico(partidoId);
        if (!vigente) return;
        if (respuesta.ok) {
          ultimo = respuesta.data;
          setDatos(ultimo);
          setError(null);
        } else {
          setError(respuesta.error);
          if (respuesta.status === 404 || respuesta.status === 409) {
            ultimo = null;
            setDatos(null);
          }
        }
      } catch {
        if (vigente) setError("No pudimos cargar el marcador. Intenta de nuevo.");
      } finally {
        ocupada = false;
        if (vigente) {
          setCargando(false);
          if (ultimo?.estado === "EN_CURSO" && !timer) timer = setInterval(() => void consultar(), 10000);
          if (ultimo?.estado !== "EN_CURSO" && timer) { clearInterval(timer); timer = undefined; }
        }
      }
    }
    actualizar.current = () => void consultar();
    void consultar();
    return () => { vigente = false; clearInterval(timer); };
  }, [partidoId]);

  return <main className="league-page"><Link href="/partidos" className="league-link">← Volver a partidos</Link><header className="league-hero"><p className="eyebrow">El partido, al instante</p><h1>Detalle del marcador</h1><button disabled={cargando} onClick={() => actualizar.current()}>Actualizar</button></header>
    {cargando && <p role="status">{datos ? "Actualizando marcador…" : "Cargando marcador…"}</p>}
    {error && <div className="league-card"><p role="alert">{error}</p>{datos && <p>Se conserva el último marcador recibido.</p>}</div>}
    {datos && <>
      <section className="league-card" aria-label="Marcador del partido"><p className="eyebrow">{datos.estado === "EN_CURSO" ? "En curso · Actualización cada 10 segundos" : "Finalizado"}</p><div className="public-score public-score-large"><div><EscudoEquipo id={datos.local.equipoId} nombre={datos.local.nombre} /><h2>{datos.local.nombre}</h2></div><strong aria-label={`Marcador ${datos.local.goles} a ${datos.visitante.goles}`}>{datos.local.goles} – {datos.visitante.goles}</strong><div><EscudoEquipo id={datos.visitante.equipoId} nombre={datos.visitante.nombre} /><h2>{datos.visitante.nombre}</h2></div></div><p>Duración: {datos.duracionMinutos} minutos</p><h2>Faltas por equipo</h2><p>{datos.local.nombre}: {datos.local.faltas} · {datos.visitante.nombre}: {datos.visitante.faltas}</p></section>
      <section className="league-card"><h2>Goleadores</h2>{datos.goleadores.length ? <ul>{datos.goleadores.map(j => <li key={j.jugadorId}>{j.nombre} · {j.equipoId === datos.local.equipoId ? datos.local.nombre : datos.visitante.nombre} · {j.goles} {j.goles === 1 ? "gol" : "goles"}</li>)}</ul> : <p>Sin goleadores registrados.</p>}</section>
      <div className="public-match-grid"><JugadoresEquipo equipo={datos.local} /><JugadoresEquipo equipo={datos.visitante} /></div>
    </>}
  </main>;
}
