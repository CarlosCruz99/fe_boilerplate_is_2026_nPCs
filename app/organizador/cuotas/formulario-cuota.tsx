"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  crearCuota,
  equiposParaCuotas,
  partidosParaCuotas,
  temporadasParaCuotas,
} from "@/app/actions/cuotas";
import type { EquipoResumen, Temporada } from "@/types/equipos";
import type { PartidoOrganizador } from "@/types/calendario-organizador";
import type { ConceptoCuota, CuotaCreada } from "@/types/cuotas";

type Mensaje = { texto: string; tipo: "error" | "exito" | "advertencia" };
const campo = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-teal-900";
const etiqueta = "block text-sm font-semibold text-slate-700 dark:text-slate-200";

function fechaHoySalvador() {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/El_Salvador", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const dato = (clave: string) => partes.find((parte) => parte.type === clave)?.value ?? "";
  return `${dato("year")}-${dato("month")}-${dato("day")}`;
}

export function FormularioCuota() {
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [equipos, setEquipos] = useState<EquipoResumen[]>([]);
  const [partidos, setPartidos] = useState<PartidoOrganizador[]>([]);
  const [temporadaId, setTemporadaId] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [partidoId, setPartidoId] = useState("");
  const [concepto, setConcepto] = useState<ConceptoCuota>("ARBITRAJE");
  const [monto, setMonto] = useState("25.00");
  const [vencimiento, setVencimiento] = useState("");
  const [hoy, setHoy] = useState("");
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [cargandoOpciones, setCargandoOpciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [cuotaCreada, setCuotaCreada] = useState<CuotaCreada | null>(null);

  useEffect(() => {
    let vigente = true;
    void temporadasParaCuotas().then((resultado) => {
      if (!vigente) return;
      const actual = fechaHoySalvador();
      setHoy(actual);
      setVencimiento(actual);
      if (resultado.ok) setTemporadas(resultado.data);
      else setMensaje({ tipo: "error", texto: resultado.error });
      setCargandoCatalogos(false);
    });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (!temporadaId) return;
    const id = Number(temporadaId);
    let vigente = true;
    void Promise.all([equiposParaCuotas(id), partidosParaCuotas(id)]).then(([resultadoEquipos, resultadoPartidos]) => {
      if (!vigente) return;
      if (resultadoEquipos.ok) setEquipos(resultadoEquipos.data);
      else setMensaje({ tipo: "error", texto: resultadoEquipos.error });
      if (resultadoPartidos.ok) setPartidos(resultadoPartidos.data.jornadas.flatMap((jornada) => jornada.partidos));
      else setMensaje({ tipo: "error", texto: resultadoPartidos.error });
      setCargandoOpciones(false);
    });
    return () => { vigente = false; };
  }, [temporadaId]);

  const partidosCompatibles = useMemo(() => partidos.filter((partido) => partido.estado !== "CANCELADO" && (
    !equipoId || partido.equipoLocalId === Number(equipoId) || partido.equipoVisitanteId === Number(equipoId)
  )), [partidos, equipoId]);

  async function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando) return;
    setMensaje(null);
    setCuotaCreada(null);
    const fechaActual = fechaHoySalvador();
    if (!temporadaId || !equipoId) {
      setMensaje({ tipo: "error", texto: "Selecciona una temporada y un equipo inscrito." });
      return;
    }
    if (!/^(?:0*[0-9]{1,6})(?:\.[0-9]{1,2})?$/.test(monto) || Number(monto) <= 0 || Number(monto) > 100000) {
      setMensaje({ tipo: "error", texto: "El monto debe ser mayor que $0 y hasta $100,000.00, con máximo dos decimales." });
      return;
    }
    if (!vencimiento || vencimiento < fechaActual) {
      setMensaje({ tipo: "error", texto: "Selecciona una fecha igual o posterior a hoy en El Salvador." });
      return;
    }
    if (concepto === "ARBITRAJE" && (!partidoId || !partidosCompatibles.some((partido) => partido.id === Number(partidoId)))) {
      setMensaje({ tipo: "error", texto: "Selecciona un partido compatible con el equipo inscrito." });
      return;
    }
    setGuardando(true);
    try {
      const resultado = await crearCuota({
        concepto,
        temporadaId: Number(temporadaId),
        equipoId: Number(equipoId),
        monto,
        fechaVencimiento: vencimiento,
        ...(concepto === "ARBITRAJE" ? { partidoId: Number(partidoId) } : {}),
      });
      if (!resultado.ok) {
        setMensaje({
          tipo: "error",
          texto: resultado.status === 409
            ? "Ya existe una cuota para esta selección. Revisa los datos antes de intentar otra vez."
            : resultado.error,
        });
        return;
      }
      setCuotaCreada(resultado.data);
      setMensaje({
        tipo: resultado.data.advertencia ? "advertencia" : "exito",
        texto: resultado.data.advertencia
          ? `Cuota #${resultado.data.id} registrada. ${resultado.data.advertencia} No vuelvas a enviarla.`
          : `Cuota #${resultado.data.id} registrada correctamente.`,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="league-page">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-slate-300 pb-6 dark:border-slate-700">
          <Link href="/" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline dark:text-teal-300">← Volver al inicio</Link>
          <p className="mt-6 text-sm font-bold tracking-wider text-teal-800 dark:text-teal-300">Strikers by NPCs / Administración / Cuotas</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Cuotas de la liga</h1>
        </header>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Nueva cuota</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Registra los cargos correspondientes a la inscripción de equipos o al arbitraje de partidos.</p>
          </div>
          <form onSubmit={(event) => void registrar(event)} className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <div className="grid gap-5 md:grid-cols-3">
              <label className={etiqueta}>
                Concepto
                <select className={campo} value={concepto} onChange={(event) => { setConcepto(event.target.value as ConceptoCuota); setPartidoId(""); setMensaje(null); setCuotaCreada(null); }} disabled={guardando}>
                  <option value="ARBITRAJE">Arbitraje</option>
                  <option value="INSCRIPCION">Inscripción</option>
                </select>
              </label>
              <label className={etiqueta}>
                Temporada
                <select required className={campo} value={temporadaId} disabled={guardando || cargandoCatalogos} onChange={(event) => {
                  setTemporadaId(event.target.value);
                  setEquipos([]); setPartidos([]); setEquipoId(""); setPartidoId("");
                  setCuotaCreada(null); setMensaje(null); setCargandoOpciones(Boolean(event.target.value));
                }}>
                  <option value="">{cargandoCatalogos ? "Cargando temporadas..." : "Selecciona temporada"}</option>
                  {temporadas.map((temporada) => <option key={temporada.id} value={temporada.id}>{temporada.nombre}</option>)}
                </select>
              </label>
              <label className={etiqueta}>
                Equipo inscrito
                <select required className={campo} value={equipoId} disabled={guardando || cargandoOpciones || !temporadaId} onChange={(event) => { setEquipoId(event.target.value); setPartidoId(""); setMensaje(null); setCuotaCreada(null); }}>
                  <option value="">{cargandoOpciones ? "Cargando equipos..." : "Selecciona equipo"}</option>
                  {equipos.map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>)}
                </select>
              </label>
              {concepto === "ARBITRAJE" && <label className={etiqueta}>
                Partido
                <select required className={campo} value={partidoId} disabled={guardando || cargandoOpciones || !equipoId} onChange={(event) => { setPartidoId(event.target.value); setMensaje(null); setCuotaCreada(null); }}>
                  <option value="">Selecciona partido</option>
                  {partidosCompatibles.map((partido) => <option key={partido.id} value={partido.id}>J{partido.jornada} · {partido.local.nombre} vs {partido.visitante.nombre} (#{partido.id})</option>)}
                </select>
              </label>}
              <label className={etiqueta}>
                Monto USD
                <input required className={campo} inputMode="decimal" placeholder="25.00" value={monto} onChange={(event) => { setMonto(event.target.value); setMensaje(null); setCuotaCreada(null); }} disabled={guardando} />
              </label>
              <label className={etiqueta}>
                Vencimiento
                <input required type="date" className={campo} min={hoy} value={vencimiento} onChange={(event) => { setVencimiento(event.target.value); setMensaje(null); setCuotaCreada(null); }} disabled={guardando} />
              </label>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button type="submit" disabled={guardando || cargandoOpciones || cargandoCatalogos || !!cuotaCreada} className="rounded-lg bg-teal-800 px-6 py-3 font-bold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-700 dark:hover:bg-teal-600">{guardando ? "Registrando..." : "Registrar cuota"}</button>
              {cuotaCreada && <button type="button" className="rounded-lg border border-teal-700 px-5 py-3 font-semibold text-teal-800 dark:text-teal-300" onClick={() => { setCuotaCreada(null); setMensaje(null); setPartidoId(""); }}>Registrar otra cuota</button>}
            </div>
            {mensaje && <div role={mensaje.tipo === "error" ? "alert" : "status"} className={`mt-6 rounded-lg border p-4 text-sm ${mensaje.tipo === "error" ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200" : mensaje.tipo === "advertencia" ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200" : "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-200"}`}>{mensaje.texto}</div>}
            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">El capitán recibirá un aviso de la nueva cuota. Si pierdes la conexión, comprueba el registro antes de volver a enviarlo.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
