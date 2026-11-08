/* eslint-disable @next/next/no-img-element -- Fotos privadas y vistas previas sin optimización intermedia. */
"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Equipo, Temporada } from "@/types/equipos";

export function MarcoEquipos({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <main className="league-page">
      <Link href="/" className="underline">
        ← Inicio
      </Link>
      <h1>{titulo}</h1>
      {children}
    </main>
  );
}
export function ErrorConsulta({
  mensaje,
  reintentar,
}: {
  mensaje: string;
  reintentar?: () => void;
}) {
  return (
    <div className="league-alert" role="alert">
      <p>{mensaje}</p>
      {reintentar && (
        <button type="button" onClick={reintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
export function SelectorTemporada({
  temporadas,
  value,
  onChange,
}: {
  temporadas: Temporada[];
  value: number;
  onChange: (id: number) => void;
}) {
  return (
    <label className="league-field">
      Temporada
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {temporadas.map((t) => (
          <option value={t.id} key={t.id}>
            {t.nombre}
            {t.inscripcionAbierta
              ? " · Inscripción abierta"
              : " · Inscripción cerrada"}
          </option>
        ))}
      </select>
    </label>
  );
}
export function EstadoInscripcion({ equipo }: { equipo: Equipo }) {
  return (
    <section className="league-card">
      <h2>{equipo.nombre}</h2>
      <p>
        Estado:{" "}
        <strong>
          {equipo.estado === "PENDIENTE"
            ? "Pendiente de validación"
            : equipo.estado === "INSCRITO"
              ? "Inscrito"
              : "Rechazado"}
        </strong>
      </p>
      <p>{equipo.totalJugadores ?? 0} jugadores</p>
      {equipo.estado === "RECHAZADO" && (
        <p>Motivo: {equipo.motivoRechazo ?? "Sin motivo disponible."}</p>
      )}
    </section>
  );
}
export function FotoJugador({ url, nombre }: { url: string; nombre: string }) {
  const [fallo, setFallo] = useState<string | null>(null);
  const match = /^\/uploads\/jugadores\/([1-9]\d*\.(?:jpg|png))$/.exec(url);
  if (!match || fallo === url)
    return (
      <div
        className="league-photo league-placeholder"
        role="img"
        aria-label={`Foto no disponible de ${nombre}`}
      >
        Sin foto
      </div>
    );
  // La ruta del mismo origen adjunta la credencial en el servidor.
  return (
    <img
      className="league-photo"
      src={`/api/fotos/jugadores/${match[1]}`}
      alt={`Foto de ${nombre}`}
      onError={() => setFallo(url)}
    />
  );
}
