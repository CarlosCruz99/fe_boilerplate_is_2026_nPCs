"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { consultarReportePagos, temporadasReportePagos } from "@/app/actions/reporte-pagos";
import { useConsulta } from "@/hooks/use-consulta";
import type { Temporada } from "@/types/equipos";
import type { EstadoReporte, FiltrosReportePagos, ReportePagos } from "@/types/reporte-pagos";

const estados = {
  MOROSO: { texto: "Moroso", clase: "bg-red-950 text-red-200" },
  CON_SALDO: { texto: "Con saldo", clase: "bg-amber-950 text-amber-200" },
  PAGADO: { texto: "Pagado", clase: "bg-green-950 text-green-200" },
  SIN_CUOTAS: { texto: "Sin cuotas", clase: "bg-slate-800 text-slate-200" },
} satisfies Record<EstadoReporte, { texto: string; clase: string }>;

const fechaVencimiento = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "short",
  timeZone: "UTC",
});
const fechaConsulta = new Intl.DateTimeFormat("es-SV", {
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

function TablaReporte({ reporte }: { reporte: ReportePagos }) {
  const { equipos, totales, generadoEn } = reporte;
  const morosos = `${totales.equiposMorosos} ${totales.equiposMorosos === 1 ? "equipo moroso" : "equipos morosos"}`;

  return (
    <section className="league-card payment-history-panel">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          Última consulta <time dateTime={generadoEn}>{fechaConsulta.format(new Date(generadoEn))}</time>
        </p>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${totales.equiposMorosos ? estados.MOROSO.clase : estados.SIN_CUOTAS.clase}`}>
          {morosos}
        </span>
      </div>
      {equipos.length === 0 && <p role="status">No hay equipos que coincidan con los filtros.</p>}
      <div className="payment-history-scroll" role="region" aria-label="Estado de pagos por equipo" tabIndex={0}>
        <table className="tabular-nums">
          <caption className="sr-only">Estado de cuotas por equipo, en USD</caption>
          <thead>
            <tr>
              {["Equipo", "Total de cuotas", "Pagado", "Saldo pendiente", "Vencido desde", "Estado"].map(columna => (
                <th key={columna} scope="col">{columna}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipos.map(equipo => (
              <tr key={equipo.equipoId}>
                <th scope="row">{equipo.nombre}</th>
                <td>${equipo.totalCuotas}</td>
                <td>${equipo.pagado}</td>
                <td>${equipo.saldoPendiente}</td>
                <td>{equipo.vencidoDesde ? (
                  <time dateTime={equipo.vencidoDesde}>
                    {fechaVencimiento.format(new Date(`${equipo.vencidoDesde}T00:00:00Z`))}
                  </time>
                ) : "—"}</td>
                <td>
                  <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${estados[equipo.estado].clase}`}>
                    {estados[equipo.estado].texto}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-semibold">
            <tr>
              <th scope="row">Totales</th>
              <td>${totales.totalCuotas}</td>
              <td>${totales.pagado}</td>
              <td>${totales.saldoPendiente}</td>
              <td>—</td>
              <td>{morosos}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-[var(--muted)] md:hidden">Desliza la tabla para ver todas las columnas.</p>
    </section>
  );
}

function ReporteConFiltros({ temporadas }: { temporadas: Temporada[] }) {
  const [filtros, setFiltros] = useState<FiltrosReportePagos>({
    temporadaId: (temporadas.find(temporada => temporada.actual) ?? temporadas[0]).id,
    concepto: "TODOS",
    estado: "",
  });
  const [aplicados, setAplicados] = useState(filtros);
  const consultar = useCallback(() => consultarReportePagos(aplicados), [aplicados]);
  const { resultado, recargar } = useConsulta(consultar);

  return (
    <>
      <form className="league-card grid! w-full grid-cols-1 items-end! gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Filtros del reporte" onSubmit={evento => {
          evento.preventDefault();
          if (aplicados === filtros) recargar();
          else setAplicados(filtros);
        }}>
        <label className="league-field">Temporada
          <select value={filtros.temporadaId}
            onChange={evento => setFiltros({ ...filtros, temporadaId: Number(evento.target.value) })}>
            {temporadas.map(temporada => (
              <option key={temporada.id} value={temporada.id}>{temporada.nombre}</option>
            ))}
          </select>
        </label>
        <label className="league-field">Concepto
          <select value={filtros.concepto}
            onChange={evento => setFiltros({ ...filtros, concepto: evento.target.value as FiltrosReportePagos["concepto"] })}>
            <option value="TODOS">Todos</option>
            <option value="INSCRIPCION">Inscripción</option>
            <option value="ARBITRAJE">Arbitraje</option>
          </select>
        </label>
        <label className="league-field">Estado
          <select value={filtros.estado}
            onChange={evento => setFiltros({ ...filtros, estado: evento.target.value as FiltrosReportePagos["estado"] })}>
            <option value="">Todos</option>
            {Object.entries(estados).map(([estado, { texto }]) => (
              <option key={estado} value={estado}>{texto}</option>
            ))}
          </select>
        </label>
        <button className="league-primary w-full" type="submit" disabled={!resultado}>Actualizar</button>
      </form>
      <div className="league-stack" aria-busy={!resultado}>
        {!resultado ? <p role="status">Consultando reporte…</p> : resultado.ok
          ? <TablaReporte reporte={resultado.data} />
          : <ErrorConsulta {...resultado} reintentar={recargar} />}
      </div>
    </>
  );
}

export function VistaReportePagos() {
  const { resultado: temporadas, recargar } = useConsulta(temporadasReportePagos);

  return (
    <main className="league-page">
      <header className="league-hero">
        <h1>Reporte de pagos</h1>
        <p>Estado de cuotas de los equipos inscritos en la temporada. Importes en USD.</p>
      </header>
      {!temporadas ? <p role="status">Cargando temporadas…</p> : !temporadas.ok
        ? <ErrorConsulta {...temporadas} reintentar={recargar} />
        : temporadas.data.length === 0
          ? <p role="status" className="league-card">No hay temporadas disponibles.</p>
          : <ReporteConFiltros temporadas={temporadas.data} />}
    </main>
  );
}
