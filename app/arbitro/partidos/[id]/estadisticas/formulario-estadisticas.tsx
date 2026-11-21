"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  consultarEstadisticasPartido,
  guardarEstadisticaJugador,
} from "@/app/actions/estadisticas-partido";
import type { Resultado } from "@/types/equipos";
import type {
  CantidadesEstadistica,
  EstadisticasPartido,
  RegistroEstadistica,
} from "@/types/estadisticas-partido";

const vacio: CantidadesEstadistica = { goles: 0, asistencias: 0, tarjetas: 0 };
const limite = 2147483647;
const campo = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

type Mensaje = { error: boolean; texto: string };

function valores(registro: RegistroEstadistica | undefined): CantidadesEstadistica {
  return registro
    ? { goles: registro.goles, asistencias: registro.asistencias, tarjetas: registro.tarjetas }
    : { ...vacio };
}

function mensajeError<T>(resultado: Resultado<T>): Mensaje | null {
  return resultado.ok ? null : { error: true, texto: resultado.error };
}

export function FormularioEstadisticas({ idTexto }: { idTexto: string }) {
  const partidoId = Number(idTexto);
  const idValido = /^\d+$/.test(idTexto) && Number.isSafeInteger(partidoId) && partidoId > 0 && partidoId <= limite;
  const [datos, setDatos] = useState<EstadisticasPartido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [jugadorId, setJugadorId] = useState<number | null>(null);
  const [borrador, setBorrador] = useState<{ jugadorId: number | null; registro: RegistroEstadistica | undefined; cantidades: CantidadesEstadistica } | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const consultar = useCallback((): Promise<Resultado<EstadisticasPartido>> => idValido
    ? consultarEstadisticasPartido(partidoId)
    : Promise.resolve({ ok: false, status: 400, error: "El número de partido no es válido." }), [idValido, partidoId]);

  const aplicarResultado = useCallback((resultado: Resultado<EstadisticasPartido>) => {
    setBorrador(null);
    if (resultado.ok) {
      setDatos(resultado.data);
      setMensaje(null);
      setJugadorId((actual) =>
        actual !== null && resultado.data.jugadoresHabilitados.some((jugador) => jugador.jugadorId === actual)
          ? actual
          : (resultado.data.jugadoresHabilitados[0]?.jugadorId ?? null),
      );
    } else {
      setDatos(null);
      setMensaje(mensajeError(resultado));
    }
    setCargando(false);
  }, []);

  const cargar = useCallback(async () => aplicarResultado(await consultar()), [consultar, aplicarResultado]);

  useEffect(() => {
    let vigente = true;
    void consultar().then((resultado) => { if (vigente) aplicarResultado(resultado); });
    return () => { vigente = false; };
  }, [consultar, aplicarResultado]);

  const seleccionado = useMemo(
    () => datos?.jugadoresHabilitados.find((jugador) => jugador.jugadorId === jugadorId) ?? null,
    [datos, jugadorId],
  );
  const registroActual = useMemo(
    () => datos?.registros.find((registro) => registro.jugadorId === jugadorId),
    [datos, jugadorId],
  );

  const cantidades = borrador?.jugadorId === jugadorId && borrador?.registro === registroActual
    ? borrador.cantidades
    : valores(registroActual);

  const editable = datos?.estado === "EN_CURSO" && !datos.resultadoOficial;
  const numerosValidos = Object.values(cantidades).every(
    (valor) => Number.isInteger(valor) && valor >= 0 && valor <= limite,
  );
  const mostrar = (estado: string) => estado.replaceAll("_", " ");

  function cambiar(campo: keyof CantidadesEstadistica, texto: string) {
    if (texto !== "" && !/^\d+$/.test(texto)) return;
    const numero = texto === "" ? NaN : Number(texto);
    if (texto !== "" && (!Number.isSafeInteger(numero) || numero > limite)) return;
    setBorrador({ jugadorId, registro: registroActual, cantidades: { ...cantidades, [campo]: numero } });
    setMensaje(null);
  }

  async function guardar() {
    if (!editable || !seleccionado || !numerosValidos || guardando) return;
    setGuardando(true);
    setMensaje(null);
    const resultado = await guardarEstadisticaJugador(partidoId, seleccionado.jugadorId, cantidades);
    if (resultado.ok) {
      setDatos((anterior) => {
        if (!anterior) return anterior;
        return {
          ...anterior,
          registros: [...anterior.registros.filter((registro) => registro.jugadorId !== resultado.data.jugadorId), resultado.data],
        };
      });
      setBorrador(null);
      setMensaje({ error: false, texto: `Estadísticas de ${seleccionado.nombre} guardadas correctamente.` });
    } else {
      setMensaje(mensajeError(resultado));
      if (resultado.status === 409) {
        // El partido puede haber finalizado entre la consulta y el PUT.
        await cargar();
        setMensaje(mensajeError(resultado));
      }
    }
    setGuardando(false);
  }

  return (
    <main className="league-page">
      <Link href={`/arbitro/partidos/${idTexto}`} className="text-sm font-semibold text-teal-600 hover:underline dark:text-teal-300">← Volver al partido</Link>
      <p className="mt-8 text-sm font-bold tracking-wide text-teal-700 dark:text-teal-300">Strikers by NPCs / Árbitro / Estadísticas</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Registro de estadísticas individuales por partido</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Consulta y registra los goles, asistencias y tarjetas de cada jugador habilitado.</p>
      <div className="my-6 h-px bg-slate-300 dark:bg-slate-700" />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Estadísticas del partido</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Partido #{idTexto} {datos && <>· {mostrar(datos.estado)} · Árbitro asignado</>}
            </p>
          </div>
          <button type="button" onClick={() => { setCargando(true); void cargar(); }} disabled={cargando || guardando} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">Actualizar datos</button>
        </div>

        {cargando && <p role="status" className="mt-6 text-sm text-slate-600 dark:text-slate-300">Consultando estadísticas y jugadores habilitados…</p>}

        {datos && !cargando && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Jugador
                <select value={jugadorId ?? ""} onChange={(evento) => { setJugadorId(Number(evento.target.value)); setBorrador(null); setMensaje(null); }} disabled={guardando || datos.jugadoresHabilitados.length === 0} className={`${campo} mt-2`}>
                  {datos.jugadoresHabilitados.length === 0 && <option value="">Sin jugadores habilitados</option>}
                  {datos.jugadoresHabilitados.map((jugador) => (
                    <option key={jugador.jugadorId} value={jugador.jugadorId}>{jugador.nombre} (#{jugador.jugadorId})</option>
                  ))}
                </select>
              </label>
              {(["goles", "asistencias", "tarjetas"] as const).map((nombre) => (
                <label key={nombre} className="block text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
                  {nombre}
                  <input type="number" min="0" max={limite} step="1" value={Number.isNaN(cantidades[nombre]) ? "" : cantidades[nombre]} onChange={(evento) => cambiar(nombre, evento.target.value)} disabled={!editable || guardando || !seleccionado} className={`${campo} mt-2`} />
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => void guardar()} disabled={!editable || !seleccionado || !numerosValidos || guardando} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                {guardando ? "Guardando…" : "Guardar estadísticas"}
              </button>
              {!editable && <span className="text-sm text-slate-600 dark:text-slate-300">{datos.estado === "FINALIZADO" ? "Partido finalizado: estadísticas en solo lectura." : `No se pueden editar estadísticas cuando el partido está ${mostrar(datos.estado)}.`}</span>}
            </div>

            {seleccionado && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{registroActual ? "Estadísticas registradas de este jugador." : "Este jugador todavía no tiene estadísticas guardadas."}</p>}
          </>
        )}

        {mensaje && <p role={mensaje.error ? "alert" : "status"} className={`mt-6 rounded-xl border p-4 text-sm ${mensaje.error ? "border-red-400 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200" : "border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950/30 dark:text-teal-200"}`}>{mensaje.texto}</p>}
      </section>
    </main>
  );
}
