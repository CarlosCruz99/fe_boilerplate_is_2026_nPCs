"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { consultarHistorialPagos, temporadasHistorialPagos } from "@/app/actions/historial-pagos";
import { useConsulta } from "@/hooks/use-consulta";
import { useAuth } from "@/contexts/auth-context";
import type { ConceptoCuota } from "@/types/cuotas";
import type { TotalesHistorial } from "@/types/historial-pagos";

const estados = { PENDIENTE: "Pendiente de verificación", VERIFICADO: "Verificado", RECHAZADO: "Rechazado" };
const conceptos = { INSCRIPCION: "Inscripción", ARBITRAJE: "Arbitraje" };
const fecha = new Intl.DateTimeFormat("es-SV", { timeZone: "UTC", dateStyle: "medium" });
function mensaje(status: number) {
  if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permiso para ver esta página.";
  if (status === 400 || status === 422) return "Revisa la temporada y el concepto seleccionados.";
  if (status === 404) return "El recurso solicitado no está disponible.";
  return "No pudimos cargar el historial de pagos. Intenta de nuevo.";
}
function ErrorHistorial({ status, reintentar, bloquear }: { status: number; reintentar: () => void; bloquear: () => void }) {
  const router = useRouter();
  useEffect(() => { if (status === 401) router.replace("/login"); if (status === 403) bloquear(); }, [status, router, bloquear]);
  return <section className="league-card"><p role="alert">{mensaje(status)}</p>{![400, 401, 403, 422].includes(status) && <button onClick={reintentar}>Reintentar</button>}</section>;
}
function TotalesPagos({ totales }: { totales: TotalesHistorial }) {
  const campos = [["totalRegistrado", "Total registrado"], ["totalVerificado", "Total verificado"], ["pendienteVerificacion", "Pendiente de verificación"], ["totalRechazado", "Total rechazado"]] as const;
  return <section className="payment-totals" aria-label="Totales del historial">{campos.map(([campo, nombre]) => <div className="league-card" key={campo}><h2>{nombre}</h2><strong>${totales[campo]}</strong></div>)}</section>;
}
function DatosHistorial({ temporadaId, concepto, bloquear }: { temporadaId: number; concepto: ConceptoCuota | ""; bloquear: () => void }) {
  const consultar = useCallback(() => consultarHistorialPagos(temporadaId, concepto || undefined), [temporadaId, concepto]);
  const { resultado, recargar } = useConsulta(consultar);
  const [errorDescarga, setErrorDescarga] = useState<number | null>(null);
  const [descargando, setDescargando] = useState<number | null>(null);
  const peticion = useRef<AbortController | null>(null);
  useEffect(() => () => { peticion.current?.abort(); }, []);
  async function descargar(id: number) {
    if (peticion.current) return;
    const controlador = new AbortController();
    peticion.current = controlador;
    setDescargando(id); setErrorDescarga(null);
    try {
      const respuesta = await fetch(`/api/pagos/${id}/comprobante`, { cache: "no-store", signal: controlador.signal });
      if (!respuesta.ok) { setErrorDescarga(respuesta.status); return; }
      const mime = respuesta.headers.get("Content-Type")?.split(";")[0];
      const extension = mime === "application/pdf" ? "pdf" : mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : null;
      if (!extension) { setErrorDescarga(502); return; }
      const archivo = await respuesta.blob();
      if (controlador.signal.aborted) return;
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url; enlace.download = `pago-${id}.${extension}`;
      document.body.append(enlace); enlace.click(); enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      if (!controlador.signal.aborted) setErrorDescarga(503);
    } finally {
      peticion.current = null;
      if (!controlador.signal.aborted) setDescargando(null);
    }
  }
  if (!resultado) return <p role="status">Cargando historial…</p>;
  if (!resultado.ok) return <ErrorHistorial status={resultado.status} reintentar={recargar} bloquear={bloquear} />;
  if (errorDescarga === 401 || errorDescarga === 403) return <ErrorHistorial status={errorDescarga} reintentar={recargar} bloquear={bloquear} />;
  return <>
    <TotalesPagos totales={resultado.data.totales} />
    {errorDescarga && <p role="alert" className="league-card">{mensaje(errorDescarga)} Vuelve a intentar la descarga desde el pago.</p>}
    {!resultado.data.pagos.length ? <p role="status" className="league-card">No hay pagos que coincidan con los filtros.</p> : <section className="league-card payment-history-panel"><h2>Pagos de la consulta</h2><div className="payment-history-scroll" role="region" aria-label="Historial de pagos, desplazable horizontalmente" tabIndex={0}><table><caption>Pagos registrados del equipo en la temporada seleccionada</caption><thead><tr>{["Concepto", "Monto", "Fecha", "Estado", "Motivo", "Ver comprobante"].map(c => <th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{resultado.data.pagos.map(p => <tr key={p.id}><th scope="row">{conceptos[p.concepto]}</th><td>${p.monto}</td><td><time dateTime={p.fechaPago}>{fecha.format(new Date(`${p.fechaPago}T00:00:00Z`))}</time></td><td>{estados[p.estado]}</td><td>{p.estado === "RECHAZADO" ? p.motivoRechazo ?? "Sin motivo registrado" : "—"}</td><td>{p.tieneComprobante ? <button aria-label={`Ver comprobante del pago ${p.id}`} disabled={descargando !== null} onClick={() => void descargar(p.id)}>{descargando === p.id ? "Descargando…" : "Ver comprobante"}</button> : "No disponible"}</td></tr>)}</tbody></table></div><p className="payment-history-hint">En móvil, desliza la tabla para consultar todas las columnas.</p></section>}
  </>;
}
function ContenidoHistorial() {
  const { usuario } = useAuth();
  const [temporada, setTemporada] = useState("");
  const [concepto, setConcepto] = useState<ConceptoCuota | "">("");
  const [sinPermiso, setSinPermiso] = useState(false);
  const bloquear = useCallback(() => setSinPermiso(true), []);
  const { resultado: temporadas, recargar } = useConsulta(temporadasHistorialPagos);
  if (sinPermiso) return <main className="league-page"><p role="alert" className="league-card">No tienes permiso para ver esta página.</p></main>;
  return <main className="league-page"><header className="league-hero"><p className="eyebrow">Pagos de tu equipo</p><h1>Historial de pagos</h1><p>Consulta los importes registrados, su verificación y los comprobantes privados.</p></header>
    {!temporadas ? <p role="status">Cargando temporadas…</p> : !temporadas.ok ? <ErrorHistorial status={temporadas.status} reintentar={recargar} bloquear={bloquear} /> : !temporadas.data.length ? <p role="status" className="league-card">No hay temporadas disponibles.</p> : <>
      <section className="league-card payment-history-filters" aria-label="Filtros del historial"><div><label htmlFor="historial-temporada">Temporada</label><select id="historial-temporada" value={temporada} onChange={e => setTemporada(e.target.value)}><option value="">Selecciona una temporada</option>{temporadas.data.map(t => <option value={t.id} key={t.id}>{t.nombre}{t.actual ? " · Actual" : ""}</option>)}</select></div><div><label htmlFor="historial-concepto">Concepto</label><select id="historial-concepto" value={concepto} onChange={e => setConcepto(e.target.value as ConceptoCuota | "")}><option value="">Todos</option><option value="INSCRIPCION">Inscripción</option><option value="ARBITRAJE">Arbitraje</option></select></div></section>
      {!temporada ? <p role="status" className="league-card">Selecciona una temporada para consultar los pagos de tu equipo.</p> : <DatosHistorial key={`${usuario?.id}:${temporada}:${concepto}`} temporadaId={Number(temporada)} concepto={concepto} bloquear={bloquear} />}
    </>}
  </main>;
}
export function HistorialPagosEquipo() {
  const { usuario, capitaneaEquipoId } = useAuth();
  return <ContenidoHistorial key={`${usuario?.id}:${capitaneaEquipoId}`} />;
}
