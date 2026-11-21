"use client";

import { EscudoEquipo } from "@/components/equipos/escudo-equipo";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  consultarMesaArbitro,
  actualizarMarcadorArbitro,
  finalizarPartidoArbitro,
  guardarParticipantesArbitro,
  iniciarPartidoArbitro,
} from "@/app/actions/partido-arbitro";
import type { Resultado } from "@/types/equipos";
import type { MarcadorPartido, MesaPartido, ParticipantesPartido } from "@/types/partido-arbitro";

type EstadoVista = MesaPartido["estado"];

type Aviso = {
  texto: string;
  error: boolean;
};

const inicial: MarcadorPartido = {
  golesLocal: 0,
  golesVisitante: 0,
  faltasLocal: 0,
  faltasVisitante: 0,
};

function fechaLarga(valor: string | null): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

function listaIds(texto: string): number[] | null {
  const limpio = texto.trim();
  if (!limpio) return [];
  const partes = limpio.split(/[\s,;]+/).filter(Boolean);
  if (partes.length > 30 || partes.some((parte) => !/^\d+$/.test(parte))) return null;
  const ids = partes.map(Number);
  if (ids.some((id) => !Number.isInteger(id) || id < 1 || id > 2147483647)) return null;
  if (new Set(ids).size !== ids.length) return null;
  return ids;
}

function badgeEstado(estado: EstadoVista) {
  if (estado === "EN_CURSO") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200";
  if (estado === "FINALIZADO") return "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  return "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
}

function tarjetaEstado(titulo: string, descripcion: string, activa: boolean, final?: boolean) {
  return (
    <div className={`rounded-2xl border px-5 py-5 text-center transition ${activa ? "border-blue-400 bg-slate-100 shadow-sm dark:border-blue-500 dark:bg-slate-900" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"} ${final ? "dark:bg-emerald-950/30" : ""}`}>
      <p className="font-bold text-slate-900 dark:text-white">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{descripcion}</p>
    </div>
  );
}

async function ejecutar<T>(
  accion: () => Promise<Resultado<T>>,
  alExito: (data: T) => void,
  setAviso: (aviso: Aviso | null) => void,
  setCargando: (estado: boolean) => void,
  mensajeExito: string,
) {
  setAviso(null);
  setCargando(true);
  try {
    const resultado = await accion();
    if (resultado.ok) {
      alExito(resultado.data);
      setAviso({ texto: mensajeExito, error: false });
    } else {
      setAviso({ texto: resultado.error, error: true });
    }
  } catch {
    setAviso({ texto: "No pudimos confirmar la operación. Actualiza el partido antes de reintentar.", error: true });
  } finally {
    setCargando(false);
  }
}

export function MesaArbitro({ idTexto }: { idTexto: string }) {
  const partidoId = Number(idTexto);
  const idValido = /^\d+$/.test(idTexto) && Number.isInteger(partidoId) && partidoId > 0;

  const [estado, setEstado] = useState<EstadoVista>("PROGRAMADO");
  const [marcador, setMarcador] = useState<MarcadorPartido>(inicial);
  const [participantesTexto, setParticipantesTexto] = useState("");
  const [participantes, setParticipantes] = useState<ParticipantesPartido | null>(null);
  const [inicioReal, setInicioReal] = useState<string | null>(null);
  const [finReal, setFinReal] = useState<string | null>(null);
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [confirmarFin, setConfirmarFin] = useState(false);
  const [marcadorGuardado, setMarcadorGuardado] = useState(false);

  const [consulta, setConsulta] = useState<Resultado<MesaPartido> | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!idValido) return;
    let activo = true;
    void consultarMesaArbitro(partidoId).then(resultado => {
      if (!activo) return;
      setConsulta(resultado);
      if (!resultado.ok) return;
      const datos = resultado.data;
      setEstado(datos.estado);
      setMarcador({ golesLocal: datos.golesLocal, golesVisitante: datos.golesVisitante, faltasLocal: datos.faltasLocal, faltasVisitante: datos.faltasVisitante });
      setInicioReal(datos.inicioReal);
      setFinReal(datos.finReal);
      setParticipantes(datos.participantes);
      setParticipantesTexto([...datos.participantes.local, ...datos.participantes.visitante].map(j => j.id).join(", "));
      setMarcadorGuardado(true);
      setConfirmarFin(false);
    });
    return () => { activo = false; };
  }, [partidoId, idValido, revision]);

  const chips = useMemo(() => participantesTexto.split(/[\s,;]+/).filter(Boolean).slice(0, 30), [participantesTexto]);
  const puedeEditar = estado === "EN_CURSO";

  function actualizarNumero(campo: keyof MarcadorPartido, valor: string) {
    if (valor !== "" && !/^\d+$/.test(valor)) return;
    const numero = valor === "" ? 0 : Number(valor);
    if (numero > 99) return;
    setMarcador((anterior) => ({ ...anterior, [campo]: numero }));
    setMarcadorGuardado(false);
    setConfirmarFin(false);
  }

  if (!idValido) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-3xl border border-red-300 bg-red-50 p-8 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          <h1 className="text-2xl font-bold">Identificador de partido inválido</h1>
          <p className="mt-3 text-sm">No encontramos un número de partido válido. Vuelve a la mesa del árbitro para seleccionar el encuentro.</p>
          <Link href="/arbitro/partidos" className="mt-5 inline-flex rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white">Volver</Link>
        </div>
      </main>
    );
  }

  if (!consulta) return <main className="league-page"><p role="status">Cargando partido...</p></main>;
  if (!consulta.ok) return <main className="league-page"><h1>Mesa del partido</h1><p role="alert" className="league-alert">{consulta.error}</p><button type="button" onClick={() => setRevision(r => r + 1)}>Reintentar</button><Link href="/arbitro/partidos" className="league-link">Cambiar de partido</Link></main>;

  return (
    <main className="league-page">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-slate-900 px-8 py-8 text-white">
          <p className="text-sm font-semibold tracking-wide text-slate-300">Control del encuentro</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Mesa del partido</h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">Vista operativa para iniciar, administrar y finalizar un partido asignado.</p>
        </div>

        <div className="bg-slate-50 px-8 py-4 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">Strikers by NPCs</p>
            <p>Acceso: árbitro asignado</p>
          </div>
        </div>

        <div className="grid gap-10 px-8 py-8 lg:grid-cols-[minmax(0,2.2fr)_340px]">
          <section className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span className={`rounded-full px-4 py-2 text-sm font-bold ${badgeEstado(estado)}`}>{estado.replace("_", " ")}</span>
              <span>Partido #{partidoId} · {consulta.data.local.nombre} vs. {consulta.data.visitante.nombre}</span>
              <span>|</span>
              <span>Inicio real: {fechaLarga(inicioReal) ?? "Pendiente"}</span>
              {finReal && <><span>|</span><span>Fin real: {fechaLarga(finReal)}</span></>}
            </div>

            {aviso && (
              <div className={`rounded-2xl border px-4 py-4 text-sm ${aviso.error ? "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100" : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"}`}>
                {aviso.texto}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-3 flex justify-center"><EscudoEquipo nombre={consulta.data.local.nombre} id={consulta.data.local.id} /></div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{consulta.data.local.nombre}<span className="block text-xs font-normal mt-1">LOCAL</span></p>
                <div className="mt-6 text-6xl font-bold text-blue-600">{marcador.golesLocal}</div>
                <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Goles
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={marcador.golesLocal}
                    onChange={(event) => actualizarNumero("golesLocal", event.target.value)}
                    disabled={!puedeEditar || cargando}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-semibold outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Faltas
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={marcador.faltasLocal}
                    onChange={(event) => actualizarNumero("faltasLocal", event.target.value)}
                    disabled={!puedeEditar || cargando}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-semibold outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-3 flex justify-center"><EscudoEquipo nombre={consulta.data.visitante.nombre} id={consulta.data.visitante.id} /></div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{consulta.data.visitante.nombre}<span className="block text-xs font-normal mt-1">VISITANTE</span></p>
                <div className="mt-6 text-6xl font-bold text-blue-600">{marcador.golesVisitante}</div>
                <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Goles
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={marcador.golesVisitante}
                    onChange={(event) => actualizarNumero("golesVisitante", event.target.value)}
                    disabled={!puedeEditar || cargando}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-semibold outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Faltas
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={marcador.faltasVisitante}
                    onChange={(event) => actualizarNumero("faltasVisitante", event.target.value)}
                    disabled={!puedeEditar || cargando}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-semibold outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Participantes del encuentro</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Introduce los números de ficha de los jugadores que participaron. Puedes separarlos con coma, espacio o punto y coma.
              </p>

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Números de ficha
                <textarea
                  rows={3}
                  value={participantesTexto}
                  onChange={(event) => setParticipantesTexto(event.target.value)}
                  disabled={!puedeEditar || cargando}
                  placeholder="12, 18, 21, 30"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              {chips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <span key={chip} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      #{chip}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!puedeEditar || cargando}
                  onClick={() => {
                    const ids = listaIds(participantesTexto);
                    if (ids === null) {
                      setAviso({ texto: "Introduce hasta 30 números de ficha válidos, sin repetir.", error: true });
                      return;
                    }
                    void ejecutar(
                      () => guardarParticipantesArbitro(partidoId, ids),
                      (data) => setParticipantes(data),
                      setAviso,
                      setCargando,
                      "Participantes guardados correctamente.",
                    );
                  }}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Guardar participantes
                </button>
              </div>

              {participantes && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="font-semibold text-slate-900 dark:text-white">Local ({participantes.local.length})</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      {participantes.local.map((jugador) => <li key={jugador.id}>{jugador.nombre} (#{jugador.id})</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="font-semibold text-slate-900 dark:text-white">Visitante ({participantes.visitante.length})</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      {participantes.visitante.map((jugador) => <li key={jugador.id}>{jugador.nombre} (#{jugador.id})</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </section>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                disabled={estado !== "PROGRAMADO" || cargando}
                onClick={() => void ejecutar(
                  () => iniciarPartidoArbitro(partidoId),
                  (data) => {
                    setEstado("EN_CURSO");
                    setInicioReal(data.inicioReal);
                    setFinReal(null);
                    setConfirmarFin(false);
                  },
                  setAviso,
                  setCargando,
                  "Partido iniciado correctamente.",
                )}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Iniciar partido
              </button>

              <button
                type="button"
                disabled={!puedeEditar || cargando}
                onClick={() => void ejecutar(
                  () => actualizarMarcadorArbitro(partidoId, marcador),
                  (data) => {
                    setMarcador({
                      golesLocal: data.golesLocal,
                      golesVisitante: data.golesVisitante,
                      faltasLocal: data.faltasLocal,
                      faltasVisitante: data.faltasVisitante,
                    });
                    setUltimoGuardado(data.actualizadoEn);
                    setMarcadorGuardado(true);
                    setConfirmarFin(false);
                  },
                  setAviso,
                  setCargando,
                  "Marcador y faltas guardados correctamente.",
                )}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guardar marcador
              </button>

              <button
                type="button"
                disabled={!puedeEditar || cargando}
                onClick={() => setConfirmarFin((valor) => !valor)}
                className="rounded-xl bg-amber-200 px-6 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-100"
              >
                {confirmarFin ? "Cancelar finalización" : "Finalizar partido"}
              </button>
            </div>

            {ultimoGuardado && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Último guardado del marcador: {fechaLarga(ultimoGuardado)}</p>
            )}

            {confirmarFin && (
              <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
                <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100">Confirmación requerida</h3>
                <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                  Solo puedes finalizar cuando el marcador actual ya fue guardado. Esta acción registrará el resultado oficial del encuentro.
                </p>
                <button
                  type="button"
                  disabled={!marcadorGuardado || cargando}
                  onClick={() => void ejecutar(
                    () => finalizarPartidoArbitro(partidoId),
                    (data) => {
                      setEstado("FINALIZADO");
                      setFinReal(data.finReal);
                      setConfirmarFin(false);
                    },
                    setAviso,
                    setCargando,
                    "Partido finalizado correctamente.",
                  )}
                  className="mt-4 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Confirmar finalización
                </button>
                {!marcadorGuardado && <p className="mt-3 text-sm text-amber-900 dark:text-amber-200">Debes guardar primero el marcador para poder finalizar.</p>}
              </section>
            )}


          </section>

          <aside className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Estados del partido</h2>
            {tarjetaEstado("Programado", "Solo se permite iniciar", estado === "PROGRAMADO")}
            <div className="mx-auto h-9 w-px bg-blue-500" aria-hidden="true" />
            {tarjetaEstado("En curso", "Marcador, faltas y participantes", estado === "EN_CURSO")}
            <div className="mx-auto h-9 w-px bg-blue-500" aria-hidden="true" />
            {tarjetaEstado("Finalizado", "Resultado y estadísticas en solo lectura", estado === "FINALIZADO", true)}
          </aside>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={cargando} className="league-link" onClick={() => { setConsulta(null); setAviso(null); setRevision(r => r + 1); }}>Actualizar partido</button>
        <Link href={`/arbitro/partidos/${partidoId}/estadisticas`} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          Estadísticas del partido
        </Link>
        <Link href="/arbitro/partidos" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
          Cambiar de partido
        </Link>
        <Link href="/" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
