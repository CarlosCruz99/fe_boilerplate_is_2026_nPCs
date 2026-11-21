/* eslint-disable @next/next/no-img-element -- Fotos privadas y vistas previas sin optimización intermedia. */
"use client";
import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  agregarJugador,
  consultarPlantilla,
  quitarJugador,
} from "@/app/actions/equipos";
import { useConsulta } from "@/hooks/use-consulta";
import {
  idValido,
  validarFoto,
  validarJugador,
} from "@/lib/equipos-validation";
import {
  ErrorConsulta,
  EstadoInscripcion,
  FotoJugador,
  MarcoEquipos,
} from "@/components/equipos/ui";

export function PlantillaEquipo({
  id,
  temporadaId,
}: {
  id: number;
  temporadaId: number;
}) {
  const consulta = useCallback(
    () => consultarPlantilla(id, temporadaId),
    [id, temporadaId],
  );
  const { resultado, recargar } = useConsulta(consulta);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  async function agregar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ocupado) return;
    const form = event.currentTarget;
    const datos = new FormData(form);
    const invalido = validarJugador(datos);
    if (invalido) {
      setError(invalido);
      return;
    }
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const res = await agregarJugador(id, datos);
      if (!res.ok) {
        setError(res.error);
        if ([409, 422].includes(res.status)) recargar();
        return;
      }
      form.reset();
      setPreview("");
      setMensaje("Jugador agregado.");
      recargar();
    } catch {
      setError("No pudimos agregar al jugador. Intenta nuevamente.");
    } finally {
      setOcupado(false);
    }
  }
  async function quitar(jugadorId: number) {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const res = await quitarJugador(id, jugadorId);
      if (!res.ok) {
        setError(res.error);
        if (res.status === 422) recargar();
        return;
      }
      setMensaje("Jugador eliminado de la plantilla.");
      recargar();
    } catch {
      setError("No pudimos quitar al jugador. Intenta nuevamente.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <MarcoEquipos titulo="Plantilla del equipo">
      <Link href="/equipos/nuevo" className="underline">
        ← Mis inscripciones
      </Link>
      {!idValido(id) || !idValido(temporadaId) ? (
        <ErrorConsulta mensaje="Selecciona tu equipo y temporada desde Mis inscripciones." />
      ) : (
        <>
          {error && <ErrorConsulta mensaje={error} />}
          {mensaje && <p role="status">{mensaje}</p>}
          {!resultado ? (
            <p role="status">Cargando plantilla...</p>
          ) : !resultado.ok ? (
            <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
          ) : (
            <>
              <EstadoInscripcion
                equipo={{
                  ...resultado.data.equipo,
                  totalJugadores: resultado.data.jugadores.length,
                }}
              />
              <p aria-live="polite">
                {resultado.data.jugadores.length} / 15 jugadores · Mínimo para
                aprobación: 7
              </p>
              {resultado.data.equipo.estado !== "PENDIENTE" && (
                <p>El equipo ya no puede modificarse.</p>
              )}
              {resultado.data.jugadores.length >= 15 && (
                <p>El equipo ya tiene 15 jugadores.</p>
              )}
              <form className="league-card" onSubmit={agregar}>
                <h2>Agregar jugador</h2>
                <fieldset
                  disabled={
                    ocupado ||
                    resultado.data.equipo.estado !== "PENDIENTE" ||
                    resultado.data.jugadores.length >= 15
                  }
                  className="league-stack"
                >
                  <label className="league-field">
                    Nombre completo
                    <input
                      name="nombreCompleto"
                      required
                      minLength={3}
                      maxLength={120}
                    />
                  </label>
                  <label className="league-field">
                    Identificación
                    <input
                      name="identificacion"
                      required
                      pattern={"[A-Za-z0-9\\-]{5,20}"}
                      minLength={5}
                      maxLength={20}
                    />
                  </label>
                  <label className="league-field">
                    Fecha de nacimiento
                    <input
                      name="fechaNacimiento"
                      type="date"
                      required
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </label>
                  <label className="league-field">
                    Fotografía (JPG o PNG, hasta 2 MiB)
                    <input
                      name="foto"
                      type="file"
                      accept="image/jpeg,image/png"
                      required
                      onChange={(e) => {
                        setPreview("");
                        const foto = e.target.files?.[0] ?? null;
                        const errorFoto = validarFoto(foto);
                        setError(errorFoto ?? "");
                        if (errorFoto || !foto) {
                          e.target.value = "";
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setPreview(String(reader.result));
                        reader.readAsDataURL(foto);
                      }}
                    />
                  </label>
                  {preview && (
                    <img
                      src={preview}
                      alt="Vista previa de la fotografía"
                      className="league-photo"
                    />
                  )}
                  <button className="league-primary" type="submit">
                    {ocupado ? "Procesando..." : "Agregar jugador"}
                  </button>
                </fieldset>
              </form>
              <h2>Jugadores registrados</h2>
              {!resultado.data.jugadores.length && (
                <p>Aún no hay jugadores registrados.</p>
              )}
              <ul className="league-grid">
                {resultado.data.jugadores.map((j) => (
                  <li className="league-card" key={j.id}>
                    <FotoJugador url={j.fotoUrl} nombre={j.nombreCompleto} />
                    <h3>{j.nombreCompleto}</h3>
                    <p>{j.identificacion}</p>
                    <p>Fecha de nacimiento: {j.fechaNacimiento}</p>
                    {resultado.data.equipo.estado === "PENDIENTE" && (
                      <button
                        disabled={ocupado}
                        onClick={() => void quitar(j.id)}
                      >
                        Quitar a {j.nombreCompleto}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <button disabled={ocupado} onClick={recargar}>
                Actualizar plantilla
              </button>
            </>
          )}
        </>
      )}
    </MarcoEquipos>
  );
}
