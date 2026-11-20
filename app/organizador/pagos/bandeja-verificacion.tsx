"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { listarPagosPendientes } from "@/app/actions/verificacion-pagos";
import { useConsulta } from "@/hooks/use-consulta";
import { conceptosPago, ErrorPago, FechaPago } from "./datos-pago";

export function BandejaVerificacion() {
  const [pagina, setPagina] = useState(1);
  const consultar = useCallback(() => listarPagosPendientes(pagina), [pagina]);
  const { resultado, recargar } = useConsulta(consultar);
  const datos = resultado?.ok ? resultado.data : null;
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.pageSize)) : 1;

  return (
    <main className="league-page">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Bandeja de verificación</h1>
          <p>Revisa los comprobantes y resuelve los pagos pendientes de la liga.</p>
        </div>
        <button type="button" onClick={recargar} disabled={!resultado}>Actualizar</button>
      </header>
      {!resultado ? <p role="status">Cargando pagos pendientes…</p> : !resultado.ok &&
        <ErrorPago {...resultado} reintentar={recargar} />}
      {datos && (
        <>
          <p role="status">{datos.total === 0 ? "No hay pagos pendientes de verificación." :
            `${datos.total} ${datos.total === 1 ? "pago pendiente" : "pagos pendientes"}`}</p>
          {datos.pagos.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {datos.pagos.map(pago => (
              <li className="league-card min-w-0" key={pago.id}>
                <h2>{pago.equipo.nombre}</h2>
                <p>{conceptosPago[pago.concepto]} · Pago #{pago.id} · Cuota #{pago.cuotaId}</p>
                <p><strong className="text-[var(--accent)]">${pago.monto}</strong> · <FechaPago fecha={pago.fechaPago} /></p>
                <Link href={`/organizador/pagos/${pago.id}`} className="league-link mt-auto">
                  Revisar pago<span className="sr-only"> #{pago.id} de {pago.equipo.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>}
          {pagina > paginas ? (
            <button type="button" onClick={() => setPagina(paginas)}>Volver a la última página disponible</button>
          ) : paginas > 1 && (
            <nav className="flex flex-wrap items-center gap-3" aria-label="Paginación de pagos pendientes">
              <button type="button" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
              <span>Página {pagina} de {paginas}</span>
              <button type="button" disabled={pagina === paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
