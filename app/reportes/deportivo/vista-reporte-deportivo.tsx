"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { consultarReporteDeportivo, temporadasReporteDeportivo } from "@/app/actions/reporte-deportivo";
import { useConsulta } from "@/hooks/use-consulta";
import type { Temporada } from "@/types/equipos";
import type { ReporteDeportivo } from "@/types/reporte-deportivo";
import styles from "./reporte-deportivo.module.css";

const indicadores = [
  ["totalPartidos", "Partidos finalizados"],
  ["totalGoles", "Goles"],
  ["totalTarjetas", "Tarjetas"],
  ["totalAsistencias", "Asistencias"],
] as const;

const numero = new Intl.NumberFormat("es-SV");
const fecha = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/El_Salvador",
});

function ErrorConsulta({ status, error, reintentar }: {
  status: number;
  error: string;
  reintentar: () => void;
}) {
  return (
    <section className="league-card">
      <p role="alert">{error}</p>
      {status === 401 && <Link className="league-link" href="/login">Iniciar sesión</Link>}
      {status >= 500 && <button type="button" onClick={reintentar}>Reintentar</button>}
    </section>
  );
}

function Indicadores({ reporte, temporada }: { reporte: ReporteDeportivo; temporada: string }) {
  return (
    <section className="league-stack" aria-labelledby="indicadores-temporada">
      <div className={styles.encabezado}>
        <h2 id="indicadores-temporada">{temporada}</h2>
        <p>Última consulta <time dateTime={reporte.generadoEn}>{fecha.format(new Date(reporte.generadoEn))}</time></p>
      </div>
      {reporte.totalPartidos === 0 && <p role="status">Esta temporada aún no tiene partidos finalizados.</p>}
      <dl className={styles.indicadores}>
        {indicadores.map(([campo, etiqueta]) => (
          <div key={campo} className={`league-card ${styles.indicador}`}>
            <dt>{etiqueta}</dt>
            <dd>{numero.format(reporte[campo])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ReportePorTemporada({ temporadas }: { temporadas: Temporada[] }) {
  const [temporadaId, setTemporadaId] = useState(
    () => (temporadas.find(temporada => temporada.actual) ?? temporadas[0]).id,
  );
  const consultar = useCallback(() => consultarReporteDeportivo(temporadaId), [temporadaId]);
  const { resultado, recargar } = useConsulta(consultar);
  const temporada = temporadas.find(item => item.id === temporadaId)?.nombre ?? "Temporada";

  return (
    <>
      <section className={`league-card ${styles.filtros}`} aria-label="Consulta por temporada">
        <label className="league-field">Temporada
          <select value={temporadaId} onChange={evento => setTemporadaId(Number(evento.target.value))}>
            {temporadas.map(item => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
        </label>
        <button className="league-primary" type="button" onClick={recargar} disabled={!resultado}>
          Actualizar
        </button>
      </section>
      {!resultado ? <p role="status">Consultando indicadores…</p> : resultado.ok
        ? <Indicadores reporte={resultado.data} temporada={temporada} />
        : <ErrorConsulta {...resultado} reintentar={recargar} />}
    </>
  );
}

export function VistaReporteDeportivo() {
  const { resultado: temporadas, recargar } = useConsulta(temporadasReporteDeportivo);

  return (
    <main className="league-page">
      <header className={styles.portada}>
        <Image src="/media/cancha-de-barrio.webp" alt="" fill unoptimized className={styles.cancha} />
        <div className={styles.intro}>
          <h1>Indicadores de la temporada</h1>
          <p>Reporte deportivo basado en los resultados oficiales de los partidos finalizados.</p>
        </div>
      </header>
      {!temporadas ? <p role="status">Cargando temporadas…</p> : !temporadas.ok
        ? <ErrorConsulta {...temporadas} reintentar={recargar} />
        : temporadas.data.length === 0
          ? <p role="status" className="league-card">No hay temporadas disponibles.</p>
          : <ReportePorTemporada temporadas={temporadas.data} />}
    </main>
  );
}
