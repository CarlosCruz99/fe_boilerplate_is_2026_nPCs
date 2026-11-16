"use client";
import { useCallback, useRef, useState } from "react";
import { consultarArbitrosDisponibles, asignarArbitro } from "@/app/actions/asignacion-arbitro";
import { useConsulta } from "@/hooks/use-consulta";
import { ErrorConsulta } from "@/components/equipos/ui";
import type { Arbitro, EstadoPartido } from "@/types/calendario-organizador";
import type { ArbitroAsignado } from "@/types/asignacion-arbitro";
type Props = { partidoId: number; estado: EstadoPartido; actual: Arbitro | null; ocupado: boolean; bloquear: (valor: boolean) => boolean; guardado: (datos: ArbitroAsignado) => void };
export function AsignacionArbitro(props: Props) {
  const [editando, setEditando] = useState(false);
  return <section className="league-stack" aria-label={`Asignación de árbitro del partido ${props.partidoId}`}>
    <p>Árbitro actual: <strong>{props.actual?.nombre ?? "Sin asignar"}</strong></p>
    {props.estado === "PROGRAMADO" && (editando ? <EditorArbitro {...props} cerrar={() => setEditando(false)} /> :
      <button type="button" disabled={props.ocupado} onClick={() => setEditando(true)}>{props.actual ? "Cambiar árbitro" : "Asignar árbitro"}</button>)}
  </section>;
}
function EditorArbitro({ partidoId, actual, ocupado, bloquear, guardado, cerrar }: Props & { cerrar: () => void }) {
  const consultar = useCallback(() => consultarArbitrosDisponibles(partidoId), [partidoId]);
  const { resultado, recargar } = useConsulta(consultar);
  const [seleccion, setSeleccion] = useState(actual?.id ?? "");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bloqueo = useRef(false);
  const candidatos = resultado?.ok ? resultado.data.arbitros : [];
  // La selección deja de ser válida si el candidato desaparece tras un 409.
  const elegido = candidatos.find(a => a.id === seleccion);
  async function guardar() {
    if (!elegido || ocupado || bloqueo.current || !bloquear(true)) return;
    bloqueo.current = true; setEnviando(true); setError("");
    try {
      const respuesta = await asignarArbitro(partidoId, elegido.id);
      if (!respuesta.ok) {
        setError(respuesta.error);
        if (respuesta.status === 409 || respuesta.status === 422 || respuesta.status === 404) recargar();
        return;
      }
      guardado(respuesta.data); cerrar();
    } catch { setError("No pudimos confirmar la asignación. Actualiza el calendario antes de reintentar."); }
    finally { bloqueo.current = false; setEnviando(false); bloquear(false); }
  }
  return <div className="league-stack">
    {!resultado ? <p role="status">Consultando árbitros disponibles...</p> : !resultado.ok ? <ErrorConsulta mensaje={resultado.error} reintentar={recargar} /> : !candidatos.length ? <p>No hay árbitros disponibles para este horario.</p> : <>
      <label className="league-field" htmlFor={`arbitro-partido-${partidoId}`}>Árbitro disponible
        <select id={`arbitro-partido-${partidoId}`} disabled={ocupado || enviando} value={elegido?.id ?? ""} onChange={e => { setSeleccion(e.target.value); setError(""); }}>
          <option value="">Selecciona un árbitro</option>
          {candidatos.map(a => <option key={a.id} value={a.id}>{a.nombre}{a.id === actual?.id ? " · Actual" : ""}</option>)}
        </select>
      </label>
      <p>La disponibilidad se vuelve a comprobar al guardar.</p>
    </>}
    {error && <p role="alert" className="league-alert">{error}</p>}
    <div className="league-row">
      <button type="button" disabled={ocupado || enviando} onClick={cerrar}>Cancelar cambio</button>
      <button type="button" className="league-primary" disabled={ocupado || enviando || !elegido} onClick={() => void guardar()}>{enviando ? "Guardando asignación..." : "Guardar árbitro"}</button>
    </div>
  </div>;
}
