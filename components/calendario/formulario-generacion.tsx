"use client";
import { useState, type FormEvent } from "react";
import { generarCalendario } from "@/app/actions/calendario-organizador";
import { ErrorConsulta } from "@/components/equipos/ui";
import { ConfirmacionCalendario } from "./confirmacion";
import { fechaSalvador, validarGeneracion } from "@/lib/calendario-validation";
import type {
  CalendarioGenerado,
  CatalogosCalendario,
} from "@/types/calendario-organizador";

export function FormularioGeneracion({
  temporadaId,
  catalogos,
  ocupado,
  bloquear,
  impedido,
  motivoBloqueo,
  alGenerar,
}: {
  temporadaId: number;
  catalogos: CatalogosCalendario;
  ocupado: boolean;
  bloquear: (valor: boolean) => boolean;
  impedido: boolean;
  motivoBloqueo?: string;
  alGenerar: (resumen: CalendarioGenerado) => void;
}) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("08:00");
  const [canchas, setCanchas] = useState<number[]>([]);
  const [arbitros, setArbitros] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const datos = {
    fechaPrimeraJornada: fecha,
    horaPrimerTurno: hora,
    canchaIds: canchas,
    arbitroIds: arbitros,
  };
  const faltan = Math.max(0, 12 - catalogos.totalInscritos);
  function preparar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ocupado || impedido || catalogos.totalInscritos !== 12) return;
    const error = validarGeneracion(datos);
    setError(error ?? "");
    if (!error) setConfirmar(true);
  }
  async function generar() {
    if (ocupado || !bloquear(true)) return;
    setError("");
    try {
      const res = await generarCalendario(temporadaId, datos);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirmar(false);
      alGenerar(res.data);
    } catch {
      setError("No pudimos generar el calendario. Intenta de nuevo.");
    } finally {
      bloquear(false);
    }
  }
  return (
    <section>
      <form
        className="league-card"
        onSubmit={preparar}
        aria-label="Generar calendario"
      >
        <h2>Generar calendario de ida</h2>
        <p>{catalogos.totalInscritos} de 12 equipos inscritos</p>
        {faltan > 0 && (
          <p className="league-warning">
            Faltan {faltan} equipos inscritos para generar el calendario.
          </p>
        )}
        {catalogos.totalInscritos > 12 && (
          <p className="league-warning">
            La generación requiere exactamente 12 equipos inscritos.
          </p>
        )}
        {impedido && (
          <p>
            {motivoBloqueo ?? "La temporada ya tiene un calendario guardado."}
          </p>
        )}
        {!confirmar && error && <ErrorConsulta mensaje={error} />}
        <fieldset className="league-stack" disabled={ocupado || impedido}>
          <div className="calendar-fields">
            <label className="league-field">
              Fecha de la primera jornada
              <input
                required
                type="date"
                min={fechaSalvador()}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </label>
            <label className="league-field">
              Hora del primer turno
              <input
                required
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </label>
          </div>
          <fieldset className="league-stack">
            <legend>Canchas para generar</legend>
            {catalogos.canchas.map((c) => (
              <label className="calendar-check" key={c.id}>
                <input
                  type="checkbox"
                  checked={canchas.includes(c.id)}
                  onChange={(e) =>
                    setCanchas((prev) =>
                      e.target.checked
                        ? [...prev, c.id]
                        : prev.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.nombre}
              </label>
            ))}
          </fieldset>
          <fieldset className="league-stack">
            <legend>Árbitros para generar</legend>
            {catalogos.arbitros.map((a) => (
              <label className="calendar-check" key={a.id}>
                <input
                  type="checkbox"
                  checked={arbitros.includes(a.id)}
                  onChange={(e) =>
                    setArbitros((prev) =>
                      e.target.checked
                        ? [...prev, a.id]
                        : prev.filter((id) => id !== a.id),
                    )
                  }
                />
                {a.nombre}
              </label>
            ))}
          </fieldset>
          <button
            className="league-primary"
            disabled={
              catalogos.totalInscritos !== 12 ||
              !catalogos.canchas.length ||
              !catalogos.arbitros.length
            }
          >
            Generar calendario ({catalogos.totalInscritos} de 12)
          </button>
        </fieldset>
      </form>
      {confirmar && (
        <ConfirmacionCalendario
          titulo="Generar calendario"
          ocupado={ocupado}
          confirmar={() => void generar()}
          cerrar={() => setConfirmar(false)}
        >
          <p>
            Se guardarán 66 partidos en 11 jornadas, con los árbitros y canchas
            seleccionados. ¿Deseas continuar?
          </p>
          {error && <ErrorConsulta mensaje={error} />}
        </ConfirmacionCalendario>
      )}
    </section>
  );
}
