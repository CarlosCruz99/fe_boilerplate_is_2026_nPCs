"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { aplicarCorreccionOficial, consultarCorreccionOficial } from "@/app/actions/correccion-oficial";
import { ConfirmacionCalendario } from "@/components/calendario/confirmacion";
import { useConsulta } from "@/hooks/use-consulta";
import { camposEstadistica, limiteEstadistica, validarCorreccion } from "@/lib/correccion-oficial";
import type { ContextoCorreccion, SolicitudCorreccion, ValoresCorreccion } from "@/types/correccion-oficial";
import type { RegistroEstadistica } from "@/types/estadisticas-partido";

type FilaEditable = { clave: number; jugadorId: string; goles: string; asistencias: string; tarjetas: string };
const fecha = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/El_Salvador",
});
const numero = (valor: string) => valor === "" ? NaN : Number(valor);

function ResumenValores({ valores, nombre }: { valores: ValoresCorreccion; nombre: (id: number) => string }) {
  return (
    <>
      <p>Marcador {valores.golesLocal} – {valores.golesVisitante}</p>
      {valores.estadisticas.length > 0 && <ul className="list-disc space-y-1 pl-5">
        {valores.estadisticas.map(fila => (
          <li key={fila.jugadorId}>{nombre(fila.jugadorId)} · {fila.goles} goles · {fila.asistencias} asistencias · {fila.tarjetas} tarjetas</li>
        ))}
      </ul>}
    </>
  );
}

function EditorCorreccion({ datos, guardado, recargar }: {
  datos: ContextoCorreccion;
  guardado: (id: number) => void;
  recargar: () => void;
}) {
  const { marcador, jugadores, historial } = datos;
  const [local, setLocal] = useState(String(marcador.local.goles));
  const [visitante, setVisitante] = useState(String(marcador.visitante.goles));
  const [motivo, setMotivo] = useState("");
  const [filas, setFilas] = useState<FilaEditable[]>([]);
  const [pendiente, setPendiente] = useState<SolicitudCorreccion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const [guardadoIncierto, setGuardadoIncierto] = useState(false);
  const peticion = useRef(false);
  const siguienteClave = useRef(0);
  const nombre = (id: number) => jugadores.find(jugador => jugador.jugadorId === id)?.nombre ?? `Jugador #${id}`;

  function preparar() {
    const golesLocal = numero(local);
    const golesVisitante = numero(visitante);
    const cambiaMarcador = golesLocal !== marcador.local.goles || golesVisitante !== marcador.visitante.goles;
    const estadisticas: RegistroEstadistica[] = filas.map(fila => ({
      jugadorId: numero(fila.jugadorId),
      goles: numero(fila.goles),
      asistencias: numero(fila.asistencias),
      tarjetas: numero(fila.tarjetas),
    }));
    const solicitud: SolicitudCorreccion = {
      motivo: motivo.trim(),
      ...(cambiaMarcador ? { golesLocal, golesVisitante } : {}),
      ...(estadisticas.length ? { estadisticas } : {}),
    };
    const validacion = validarCorreccion(solicitud);
    setError(validacion ?? "");
    if (!validacion) setPendiente(solicitud);
  }

  async function confirmar() {
    if (!pendiente || peticion.current) return;
    peticion.current = true;
    setOcupado(true);
    try {
      const resultado = await aplicarCorreccionOficial(marcador.partidoId, pendiente);
      if (resultado.ok) {
        guardado(resultado.data.correccionId);
      } else {
        setError(resultado.error);
        setSesionExpirada(resultado.status === 401);
        setGuardadoIncierto(resultado.status >= 500 || resultado.status === 409);
      }
    } catch {
      setGuardadoIncierto(true);
      setError("No pudimos confirmar el guardado. Actualiza el marcador y la bitácora antes de volver a enviar.");
    } finally {
      peticion.current = false;
      setOcupado(false);
      setPendiente(null);
    }
  }

  function actualizarFila(clave: number, cambio: Partial<FilaEditable>) {
    setFilas(actuales => actuales.map(fila => fila.clave === clave ? { ...fila, ...cambio } : fila));
  }

  return (
    <>
      <p role="status">Finalizado · Marcador vigente <strong>{marcador.local.goles} – {marcador.visitante.goles}</strong></p>
      <form className="league-stack" onSubmit={evento => { evento.preventDefault(); preparar(); }}>
        <fieldset className="league-card w-full" disabled={ocupado}>
          <legend>Marcador oficial</legend>
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <label className="league-field">Goles de {marcador.local.nombre}
              <input type="number" min={0} max={99} step={1} required value={local} onChange={e => setLocal(e.target.value)} />
            </label>
            <label className="league-field">Goles de {marcador.visitante.nombre}
              <input type="number" min={0} max={99} step={1} required value={visitante} onChange={e => setVisitante(e.target.value)} />
            </label>
          </div>
        </fieldset>
        <fieldset className="league-card w-full" disabled={ocupado}>
          <legend>Estadísticas por jugador</legend>
          <p>Para cada jugador agregado, ingresa los tres valores oficiales completos.</p>
          {filas.map((fila, indice) => (
            <fieldset key={fila.clave} className="w-full space-y-3 rounded border border-[var(--border)] p-3">
              <legend>Jugador {indice + 1}</legend>
              <label className="league-field">Jugador
                <select required value={fila.jugadorId} onChange={e => actualizarFila(fila.clave, { jugadorId: e.target.value })}>
                  <option value="">Selecciona un jugador</option>
                  {[marcador.local, marcador.visitante].map(equipo => (
                    <optgroup key={equipo.equipoId} label={equipo.nombre}>
                      {jugadores.filter(jugador => jugador.equipoId === equipo.equipoId).map(jugador => (
                        <option key={jugador.jugadorId} value={jugador.jugadorId}
                          disabled={filas.some(otra => otra.clave !== fila.clave && Number(otra.jugadorId) === jugador.jugadorId)}>
                          {jugador.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {camposEstadistica.map(([campo, etiqueta]) => (
                  <label key={campo} className="league-field">{etiqueta}
                    <input type="number" min={0} max={limiteEstadistica} step={1} required value={fila[campo]}
                      onChange={e => actualizarFila(fila.clave, { [campo]: e.target.value })} />
                  </label>
                ))}
              </div>
              <button type="button" onClick={() => setFilas(actuales => actuales.filter(otra => otra.clave !== fila.clave))}>
                Quitar jugador
              </button>
            </fieldset>
          ))}
          <button type="button" disabled={filas.length >= jugadores.length} onClick={() => {
            const clave = siguienteClave.current++;
            setFilas(actuales => [...actuales, { clave, jugadorId: "", goles: "", asistencias: "", tarjetas: "" }]);
          }}>Agregar jugador</button>
          {jugadores.length === 0 && <p>No hay jugadores inscritos disponibles para corregir.</p>}
        </fieldset>
        <label className="league-field">Motivo de la corrección
          <textarea required rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} aria-describedby="motivo-longitud" />
        </label>
        <p id="motivo-longitud" className="text-sm">Entre 20 y 500 caracteres · {Array.from(motivo.trim()).length}/500</p>
        {error && <p className="league-alert" role="alert">{error}</p>}
        <div className="league-row">
          <button type="submit" className="league-primary" disabled={ocupado || guardadoIncierto || sesionExpirada}>Revisar corrección</button>
          {guardadoIncierto && <button type="button" onClick={recargar}>Actualizar marcador y bitácora</button>}
          {sesionExpirada && <Link href="/login" className="league-link">Iniciar sesión</Link>}
        </div>
      </form>
      {pendiente && <ConfirmacionCalendario titulo="Confirmar corrección oficial" ocupado={ocupado}
        confirmar={() => void confirmar()} cerrar={() => setPendiente(null)}>
        <ResumenValores nombre={nombre} valores={{
          golesLocal: pendiente.golesLocal ?? marcador.local.goles,
          golesVisitante: pendiente.golesVisitante ?? marcador.visitante.goles,
          estadisticas: pendiente.estadisticas ?? [],
        }} />
        <p className="wrap-anywhere whitespace-pre-wrap">Motivo · {pendiente.motivo}</p>
        <p>Al confirmar, se actualizará el resultado oficial y se registrará en la bitácora.</p>
      </ConfirmacionCalendario>}
      <section className="league-stack" aria-labelledby="titulo-bitacora">
        <h2 id="titulo-bitacora">Bitácora de correcciones</h2>
        {historial.length ? <ol className="grid gap-3">
          {historial.map(entrada => (
            <li key={entrada.id} className="league-card">
              <h3>Corrección #{entrada.id} · {entrada.responsable}</h3>
              <time dateTime={entrada.fecha}>{fecha.format(new Date(entrada.fecha))}</time>
              <p className="whitespace-pre-wrap">{entrada.motivo}</p>
              <div className="grid w-full gap-4 sm:grid-cols-2">
                <div><h4 className="font-bold">Antes</h4><ResumenValores valores={entrada.antes} nombre={nombre} /></div>
                <div><h4 className="font-bold">Después</h4><ResumenValores valores={entrada.despues} nombre={nombre} /></div>
              </div>
            </li>
          ))}
        </ol> : <p>Este partido todavía no tiene correcciones.</p>}
      </section>
    </>
  );
}

export function VistaCorreccionOficial({ partidoId }: { partidoId: number }) {
  const consultar = useCallback(() => consultarCorreccionOficial(partidoId), [partidoId]);
  const { resultado, recargar } = useConsulta(consultar);
  const [confirmada, setConfirmada] = useState<number | null>(null);

  return (
    <main className="league-page">
      <Link href="/organizador/calendario" className="underline">Volver al calendario</Link>
      <header>
        <h1>Corrección oficial</h1>
        {resultado?.ok && <p>{resultado.data.marcador.local.nombre} vs. {resultado.data.marcador.visitante.nombre}</p>}
      </header>
      {confirmada !== null && <p role="status" className="league-card">Corrección #{confirmada} guardada. El partido sigue finalizado.</p>}
      {!resultado ? <p role="status">Cargando datos del partido…</p> : resultado.ok
        ? <EditorCorreccion datos={resultado.data} recargar={recargar} guardado={id => { setConfirmada(id); recargar(); }} />
        : <section className="league-card">
          <p role="alert">{resultado.error}</p>
          {resultado.status >= 500 && <button type="button" onClick={recargar}>Reintentar</button>}
          {resultado.status === 401 && <Link href="/login" className="league-link">Iniciar sesión</Link>}
        </section>}
    </main>
  );
}
