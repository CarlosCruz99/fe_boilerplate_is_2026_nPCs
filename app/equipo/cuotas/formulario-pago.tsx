"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { consultarCuotasPago, registrarPago } from "@/app/actions/pagos";
import { hoySalvador, validarPago } from "@/lib/pagos-validation";
import type { CuotaPago, PagoRegistrado } from "@/types/pagos";
const dinero = (valor: string) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(Number(valor));
const campo = "w-full rounded-md border p-2";
export function FormularioPago() {
  const [cuotas, setCuotas] = useState<CuotaPago[]>([]);
  const [seleccion, setSeleccion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [confirmado, setConfirmado] = useState<PagoRegistrado | null>(null);
  const clave = useRef<string | null>(null);
  const bloqueo = useRef(false);
  const cuota = cuotas.find(c => String(c.id) === seleccion);
  function cambiar() { clave.current = null; setConfirmado(null); setError(""); }
  async function cargar() {
    setCargando(true);
    try {
      const resultado = await consultarCuotasPago();
      if (resultado.ok) { setCuotas(resultado.data.cuotas); return true; }
      setError(resultado.error);
    } catch { setError("No se pudieron actualizar las cuotas. Reintenta la consulta."); }
    finally { setCargando(false); }
    return false;
  }
  useEffect(() => {
    let vigente = true;
    void consultarCuotasPago().then(resultado => {
      if (!vigente) return;
      if (resultado.ok) setCuotas(resultado.data.cuotas);
      else setError(resultado.error);
    }).catch(() => { if (vigente) setError("No se pudieron consultar las cuotas."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueo.current || !cuota || cargando || confirmado) return;
    const fallo = validarPago(monto, fecha, archivo, clave.current ? undefined : cuota.disponible);
    if (fallo) { setError(fallo); return; }
    bloqueo.current = true; setEnviando(true); setError("");
    clave.current ??= crypto.randomUUID();
    const datos = new FormData();
    datos.set("monto", monto); datos.set("fechaPago", fecha); datos.set("comprobante", archivo!);
    try {
      const resultado = await registrarPago(cuota.id, datos, clave.current);
      if (resultado.ok) {
        setConfirmado(resultado.data);
        await cargar();
      } else {
        if (resultado.status === 409) await cargar();
        setError(resultado.error);
      }
    } catch { setError("No se pudo confirmar el pago. Puedes reintentar con los mismos datos."); }
    finally { bloqueo.current = false; setEnviando(false); }
  }
  return <main className="league-page">
    <Link href="/" className="underline">Volver al inicio</Link>
    <h1 className="text-2xl font-semibold">Cuotas y registro de pagos</h1>
    <p>El saldo descuenta pagos verificados. El disponible también reserva los pagos pendientes de verificación.</p>
    {error && <p role="alert" className="league-alert">{error}</p>}
    <button type="button" disabled={cargando || enviando} onClick={() => { setError(""); void cargar(); }} className="rounded border px-4 py-2">Actualizar cuotas</button>
    {cargando && <p role="status">Cargando cuotas...</p>}
    {cuotas.length === 0 ? (!cargando && !error && <section className="league-card" role="status"><h2>Estás al día</h2><p>No hay cuotas para tu equipo.</p><Link href="/mi-calendario" className="league-link">Ver mis próximos partidos</Link></section>) : <>
      <div className="grid gap-4 sm:grid-cols-2">
        {cuotas.map(c => <article key={c.id} className="league-card">
          <h2 className="font-semibold">Cuota #{c.id} · {c.concepto === "INSCRIPCION" ? "Inscripción" : "Arbitraje"}</h2>
          <dl className="grid grid-cols-2 gap-2">
            {([["Monto total", c.montoTotal], ["Total verificado", c.totalVerificado], ["Saldo", c.saldo], ["Pendiente de verificación", c.pendienteVerificacion], ["Disponible", c.disponible]]).map(([nombre, valor]) => <div key={nombre}><dt>{nombre}</dt><dd className="font-medium">{dinero(valor)}</dd></div>)}
          </dl>
        </article>)}
      </div>
      <form noValidate onSubmit={enviar} className="league-card w-full">
        <fieldset disabled={enviando || cargando} className="league-stack">
          <legend className="text-xl font-semibold">Registrar pago</legend>
          <label className="block">Cuota<select required className={campo} value={seleccion} onChange={e => { cambiar(); setSeleccion(e.target.value); }}><option value="">Selecciona una cuota</option>{cuotas.map(c => <option key={c.id} value={c.id}>#{c.id} · {c.concepto === "INSCRIPCION" ? "Inscripción" : "Arbitraje"} · Disponible {dinero(c.disponible)}</option>)}</select></label>
          {cuota && <p>Equipo #{cuota.equipoId} · Concepto: {cuota.concepto === "INSCRIPCION" ? "Inscripción" : "Arbitraje"}</p>}
          <label className="block">Monto (USD)<input required inputMode="decimal" className={campo} value={monto} onChange={e => { cambiar(); setMonto(e.target.value); }} /></label>
          <label className="block">Fecha de pago<input required type="date" max={hoySalvador()} className={campo} value={fecha} onChange={e => { cambiar(); setFecha(e.target.value); }} /></label>
          <label className="block">Comprobante<input required type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" className={campo} onChange={e => { cambiar(); setArchivo(e.target.files?.[0] ?? null); }} /></label>
          <p className="text-sm">Un archivo PDF, JPG o PNG, de hasta 5 MiB.</p>
          <button disabled={!cuota || !!confirmado} className="league-primary" type="submit">{enviando ? "Enviando..." : "Registrar pago"}</button>
        </fieldset>
      </form>
    </>}
    {confirmado && <section role="status" className="league-card">
      <h2 className="font-semibold">Pendiente de verificación</h2>
      <p>Número de registro: {confirmado.id}</p><p>Monto: {dinero(confirmado.monto)}</p><p>Fecha de pago: {confirmado.fechaPago.slice(0, 10)}</p>
      <p>{confirmado.mensaje ?? "El saldo se actualizará cuando un organizador apruebe el pago"}</p>
      {confirmado.advertencia && <p>{confirmado.advertencia}</p>}
    </section>}
  </main>;
}
