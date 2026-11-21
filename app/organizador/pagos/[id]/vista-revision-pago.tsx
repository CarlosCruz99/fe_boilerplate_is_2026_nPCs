"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { consultarRevisionPago, decidirPago } from "@/app/actions/verificacion-pagos";
import { ConfirmacionCalendario } from "@/components/calendario/confirmacion";
import { useConsulta } from "@/hooks/use-consulta";
import { conceptosPago, ErrorPago, estadosPago, FechaPago } from "../datos-pago";
import type { DecisionPago, RevisionPago } from "@/types/verificacion-pagos";

const fechaDecision = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/El_Salvador",
});

function Comprobante({ pagoId, disponible }: { pagoId: number; disponible: boolean }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    setDescargando(true);
    setError("");
    try {
      const respuesta = await fetch(`/api/pagos/${pagoId}/revision/comprobante`, { cache: "no-store" });
      if (!respuesta.ok) {
        if (respuesta.status === 404) setError("El comprobante ya no está disponible.");
        else if (respuesta.status === 401) setError("Tu sesión expiró. Inicia sesión nuevamente.");
        else if (respuesta.status === 403) setError("No tienes permiso para ver el comprobante.");
        else setError("No pudimos descargar el comprobante. Intenta nuevamente.");
        return;
      }
      const archivo = await respuesta.blob();
      const extension = archivo.type === "application/pdf" ? "pdf" : archivo.type === "image/jpeg" ? "jpg" :
        archivo.type === "image/png" ? "png" : null;
      if (!extension) {
        setError("El comprobante tiene un formato no compatible.");
        return;
      }
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `pago-${pagoId}.${extension}`;
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("No pudimos descargar el comprobante. Intenta nuevamente.");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <section className="league-card">
      <h2>Comprobante</h2>
      {disponible ? (
        <button type="button" disabled={descargando} onClick={() => void descargar()}>
          {descargando ? "Descargando…" : "Descargar comprobante"}
        </button>
      ) : <p>El archivo no está disponible. Para verificar el pago se requiere el comprobante.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

function DatosRevision({ inicial, revisar }: {
  inicial: RevisionPago;
  revisar: (aviso?: string) => void;
}) {
  const [pago, setPago] = useState(inicial);
  const [decision, setDecision] = useState<DecisionPago | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errorModal, setErrorModal] = useState("");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const peticion = useRef(false);

  function abrir(estado: DecisionPago) {
    setErrorModal("");
    setError("");
    setDecision(estado);
  }

  async function confirmar() {
    if (!decision || peticion.current) return;
    const texto = motivo.trim();
    const longitud = Array.from(texto).length;
    if (decision === "RECHAZADO" && (longitud < 20 || longitud > 500 || texto.includes("\0"))) {
      setErrorModal("Escribe un motivo válido de entre 20 y 500 caracteres.");
      return;
    }
    peticion.current = true;
    setOcupado(true);
    try {
      const respuesta = await decidirPago(pago.id, decision, decision === "RECHAZADO" ? texto : undefined);
      if (respuesta.ok) {
        const { estado, saldo, disponible, verificadoPor, verificadoEn } = respuesta.data;
        setPago(actual => ({
          ...actual, estado, verificadoPor, verificadoEn,
          motivoRechazo: estado === "RECHAZADO" ? texto : null,
          cuota: { ...actual.cuota, saldo, disponible },
        }));
        setResultado(estado === "VERIFICADO" ? "Pago verificado." : "Pago rechazado.");
      } else if (respuesta.status === 409 || respuesta.status === 422) {
        revisar(respuesta.error);
      } else {
        setError(respuesta.error);
        setBloqueado(respuesta.status >= 500 || respuesta.status === 401 || respuesta.status === 403);
        setSesionExpirada(respuesta.status === 401);
      }
    } catch {
      setError("No pudimos confirmar la decisión. Actualiza el pago antes de volver a enviar.");
      setBloqueado(true);
    } finally {
      peticion.current = false;
      setOcupado(false);
      setDecision(null);
    }
  }

  return (
    <>
      <section className="league-card">
        <h2>{pago.cuota.equipo.nombre}</h2>
        <p>{conceptosPago[pago.cuota.concepto]} · Cuota #{pago.cuota.id} · <FechaPago fecha={pago.fechaPago} /></p>
        <p className="rounded border border-[var(--border)] px-3 py-1 font-semibold">{estadosPago[pago.estado]}</p>
        <dl className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Monto del pago", pago.monto],
            ["Total de la cuota", pago.cuota.montoTotal],
            ["Saldo de la cuota", pago.cuota.saldo],
            ["Disponible para registrar", pago.cuota.disponible],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0 rounded border border-[var(--border)] p-3">
              <dt>{etiqueta}</dt>
              <dd className="font-bold tabular-nums text-[var(--accent)]">${valor}</dd>
            </div>
          ))}
        </dl>
        {pago.verificadoEn && <p>Fecha de resolución <time dateTime={pago.verificadoEn}>{fechaDecision.format(new Date(pago.verificadoEn))}</time></p>}
        {pago.motivoRechazo && <p className="whitespace-pre-wrap"><strong>Motivo del rechazo</strong><br />{pago.motivoRechazo}</p>}
      </section>
      <Comprobante pagoId={pago.id} disponible={pago.tieneComprobante} />
      {resultado && <p role="status">{resultado}</p>}
      {error && <p role="alert" className="league-alert">{error}</p>}
      {pago.estado === "PENDIENTE" && (
        <div className="league-row">
          <button type="button" className="league-primary" disabled={!pago.tieneComprobante || bloqueado || ocupado}
            onClick={() => abrir("VERIFICADO")}>Verificar pago</button>
          <button type="button" disabled={bloqueado || ocupado} onClick={() => abrir("RECHAZADO")}>Rechazar con motivo</button>
          {bloqueado && !sesionExpirada && <button type="button" onClick={() => revisar()}>Actualizar pago</button>}
          {sesionExpirada && <Link href="/login" className="league-link">Iniciar sesión</Link>}
        </div>
      )}
      {decision && (
        <ConfirmacionCalendario titulo={decision === "VERIFICADO" ? "Confirmar verificación" : "Confirmar rechazo"}
          ocupado={ocupado} confirmar={() => void confirmar()} cerrar={() => setDecision(null)}>
          <p>{decision === "VERIFICADO"
            ? `Se verificará el pago de $${pago.monto} y el monto se descontará del saldo de la cuota.`
            : "Se rechazará el pago y el monto quedará disponible para registrar otro pago."}</p>
          {decision === "RECHAZADO" && (
            <label className="league-field">Motivo del rechazo
              <textarea rows={3} required value={motivo} onChange={e => setMotivo(e.target.value)}
                disabled={ocupado} aria-describedby="motivo-rechazo-longitud" />
              <span id="motivo-rechazo-longitud" className="text-sm">20 a 500 caracteres · {Array.from(motivo.trim()).length}/500</span>
            </label>
          )}
          {errorModal && <p role="alert">{errorModal}</p>}
        </ConfirmacionCalendario>
      )}
    </>
  );
}

export function VistaRevisionPago({ id }: { id: number }) {
  const consultar = useCallback(() => consultarRevisionPago(id), [id]);
  const { resultado, recargar } = useConsulta(consultar);
  const [aviso, setAviso] = useState("");

  return (
    <main className="league-page">
      <Link href="/organizador/pagos" className="underline">Volver a la bandeja</Link>
      <header><h1>Revisión de pago{id > 0 && ` #${id}`}</h1></header>
      {aviso && <p role="status" className="league-card">{aviso}</p>}
      {!resultado ? <p role="status">Cargando datos del pago…</p> : resultado.ok
        ? <DatosRevision inicial={resultado.data} revisar={mensaje => { setAviso(mensaje ?? ""); recargar(); }} />
        : <ErrorPago {...resultado} reintentar={recargar} />}
    </main>
  );
}
